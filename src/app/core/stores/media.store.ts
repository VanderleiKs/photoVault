import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Backend } from '../ipc/backend';
import { unwrap, type MediaItem } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { JobStore } from './job.store';
import { LibraryStore } from './library.store';
import { ScanStore } from './scan.store';

const PAGE_SIZE = 120;
/** While a scan fills an empty gallery, refresh it at most this often. */
const LIVE_REFRESH_MS = 2000;

/** Gallery of the active library (keyset-paginated) and the current selection. */
@Injectable({ providedIn: 'root' })
export class MediaStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly scan = inject(ScanStore);
  private readonly jobs = inject(JobStore);

  readonly items = signal<MediaItem[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  /** Selected item (may come from the gallery, the timeline or the viewer). */
  readonly selected = signal<MediaItem | null>(null);
  readonly selectedId = computed(() => this.selected()?.id ?? null);

  private libraryId: string | null = null;
  private lastLiveRefresh = 0;
  private cursor: string | null = null;
  /** Bumps on every reset so late responses from an older page are dropped. */
  private generation = 0;

  constructor() {
    // Reload when the active library changes...
    effect(() => {
      const id = this.libraries.activeId();
      untracked(() => void this.reset(id));
    });
    // ...progressively while a scan fills the first page...
    effect(() => {
      const progress = this.scan.progress();
      if (
        progress?.phase === 'indexing' &&
        progress.libraryId === untracked(this.libraries.activeId) &&
        untracked(this.items).length < PAGE_SIZE &&
        Date.now() - this.lastLiveRefresh > LIVE_REFRESH_MS
      ) {
        this.lastLiveRefresh = Date.now();
        untracked(() => void this.refreshFirstPage());
      }
    });
    // Analysis results (EXIF date, size, thumbnails) patch the loaded items in place...
    effect(() => {
      const update = this.jobs.lastUpdate();
      if (update) untracked(() => this.patch(update.items, update.removedIds));
    });
    // ...and once the queue drains, re-sort the top of the gallery by the real dates
    // (only near the top, so the user's scroll position is never lost).
    let wasBusy = false;
    effect(() => {
      const busy = this.jobs.busy();
      if (wasBusy && !busy && untracked(this.items).length <= PAGE_SIZE) {
        untracked(() => void this.refreshFirstPage());
      }
      wasBusy = busy;
    });
    // ...and when a scan of it finishes.
    effect(() => {
      const summary = this.scan.lastSummary();
      if (summary && summary.libraryId === untracked(this.libraries.activeId)) {
        untracked(() => void this.reset(summary.libraryId, true));
      }
    });
  }

  async reset(libraryId: string | null, keepSelection = false): Promise<void> {
    this.generation++;
    this.libraryId = libraryId;
    this.cursor = null;
    this.items.set([]);
    this.hasMore.set(!!libraryId);
    this.loading.set(false);
    if (!keepSelection) this.selected.set(null);
    await this.loadMore();
  }

  async loadMore(): Promise<void> {
    if (!this.libraryId || this.loading() || !this.hasMore()) return;
    const generation = this.generation;
    this.loading.set(true);
    try {
      const page = await unwrap(
        this.backend.commands.listMedia(this.libraryId, this.cursor, PAGE_SIZE),
      );
      if (generation !== this.generation) return;
      this.items.update((items) => [...items, ...page.items]);
      this.cursor = page.nextCursor;
      this.hasMore.set(page.nextCursor !== null);
    } catch (e) {
      if (generation === this.generation) {
        this.hasMore.set(false);
        this.notify.error('Não foi possível carregar as fotos', e);
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /** Replace the first page in place (no flash of empty content). */
  private async refreshFirstPage(): Promise<void> {
    if (!this.libraryId || this.loading()) return;
    const generation = ++this.generation;
    try {
      const page = await unwrap(this.backend.commands.listMedia(this.libraryId, null, PAGE_SIZE));
      if (generation !== this.generation) return;
      this.items.set(page.items);
      this.cursor = page.nextCursor;
      this.hasMore.set(page.nextCursor !== null);
    } catch {
      // Best effort: the full reload after the scan will surface errors.
    }
  }

  /** Apply updated items to the loaded page and the selection. */
  private patch(updated: MediaItem[], removedIds: string[]) {
    const byId = new Map(updated.filter((m) => m.libraryId === this.libraryId).map((m) => [m.id, m]));
    const removed = new Set(removedIds);
    if (byId.size || removed.size) {
      this.items.update((items) =>
        items.filter((m) => !removed.has(m.id)).map((m) => byId.get(m.id) ?? m),
      );
    }
    const selected = this.selected();
    if (selected) {
      if (removed.has(selected.id)) this.selected.set(null);
      else if (byId.has(selected.id)) this.selected.set(byId.get(selected.id)!);
    }
  }

  select(item: MediaItem | null) {
    this.selected.set(item);
  }
}
