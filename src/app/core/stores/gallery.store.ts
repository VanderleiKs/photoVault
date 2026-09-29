import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Backend } from '../ipc/backend';
import { unwrap, type MediaCount, type MediaFilter, type MediaItem, type MediaQuery } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { JobStore } from './job.store';
import { LibraryStore } from './library.store';
import { MediaBus } from './media-bus';
import { ScanStore } from './scan.store';
import { ViewerContext } from './viewer-context';

export const PAGE_SIZE = 120;
/** Largest page the backend serves (in-place refresh of what is loaded). */
const MAX_PAGE = 500;

const sameJson = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
/** Restored galleries older than this reload from scratch. */
const CACHE_TTL_MS = 10 * 60_000;

interface Snapshot {
  key: string;
  savedAt: number;
  items: MediaItem[];
  cursor: string | null;
  hasMore: boolean;
  count: MediaCount | null;
  scrollTop: number;
}

/**
 * Last state of each gallery page, so coming back from the viewer keeps the loaded
 * items and the scroll position instead of starting at the top.
 */
@Injectable({ providedIn: 'root' })
export class GalleryCache {
  private readonly snapshots = new Map<string, Snapshot>();

  save(page: string, snapshot: Snapshot) {
    this.snapshots.set(page, snapshot);
  }

  /** The snapshot of `page`, if it is for the same library/query and still fresh. */
  take(page: string, key: string): Snapshot | null {
    const snapshot = this.snapshots.get(page);
    this.snapshots.delete(page);
    return snapshot && snapshot.key === key && Date.now() - snapshot.savedAt < CACHE_TTL_MS ? snapshot : null;
  }
}

/** Drops unset fields so equal filters compare equal. */
export function compactFilter(filter: MediaFilter): MediaFilter {
  return Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  ) as MediaFilter;
}

/**
 * One gallery (a page's list of media): the page's fixed filter (favorites, album)
 * over the user's query, keyset-paginated. Provide it in the page component.
 */
@Injectable()
export class GalleryStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly bus = inject(MediaBus);

  /** Set by the page; always applied (e.g. `{ favorite: true }`, `{ albumId }`). */
  readonly fixed = signal<MediaFilter>({});
  /** User-controlled part (filters, search, sort). */
  readonly userQuery = signal<MediaQuery>({});
  /** Pause loading (e.g. the page hasn't resolved its album yet). */
  readonly enabled = signal(true);

  readonly query = computed<MediaQuery>(
    () => {
      const user = this.userQuery();
      return {
        filter: compactFilter({ ...user.filter, ...this.fixed() }),
        sort: user.sort ?? 'newest',
      };
    },
    { equal: sameJson },
  );
  readonly libraryId = this.libraries.activeId;

  readonly items = signal<MediaItem[]>([]);
  readonly count = signal<MediaCount | null>(null);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  /** First page arrived (distinguishes "empty" from "not loaded yet"). */
  readonly loaded = signal(false);

  private cursor: string | null = null;
  /** Bumps on every reset so late responses for an older query are dropped. */
  private generation = 0;

  private readonly cache = inject(GalleryCache);
  /** Page path (without query string) the gallery belongs to. */
  private readonly page = inject(Router).url.split('?')[0];
  /** Scroll position to restore (read once by the grid). */
  pendingScroll: number | null = null;
  /** Latest scroll position, kept up to date by the grid. */
  scrollTop = 0;

  constructor() {
    const viewer = inject(ViewerContext);
    inject(DestroyRef).onDestroy(() => {
      if (!this.activeLibrary || !this.loaded()) return;
      this.cache.save(this.page, {
        key: this.cacheKey(this.activeLibrary, this.query()),
        savedAt: Date.now(),
        items: this.items(),
        cursor: this.cursor,
        hasMore: this.hasMore(),
        count: this.count(),
        scrollTop: this.scrollTop,
      });
    });
    effect(() => {
      const libraryId = this.libraryId();
      const query = this.query();
      const enabled = this.enabled();
      untracked(() => {
        viewer.current.set(query);
        void this.reset(enabled ? libraryId : null, query);
      });
    });
    this.bus.subscribe((update) => this.patch(update.items, update.removedIds));

    // A finished scan of this library changes the list.
    const scan = inject(ScanStore);
    effect(() => {
      const summary = scan.lastSummary();
      if (summary && summary.libraryId === untracked(this.libraryId)) {
        untracked(() => void this.refresh());
      }
    });
    // Once the analysis queue drains, real dates may reorder the top of the list.
    const jobs = inject(JobStore);
    let wasBusy = false;
    effect(() => {
      const busy = jobs.busy();
      if (wasBusy && !busy) untracked(() => void this.refresh());
      wasBusy = busy;
    });
  }

  private activeLibrary: string | null = null;

  private async reset(libraryId: string | null, query: MediaQuery): Promise<void> {
    this.generation++;
    this.activeLibrary = libraryId;
    this.cursor = null;
    this.items.set([]);
    this.count.set(null);
    this.loaded.set(false);
    this.hasMore.set(!!libraryId);
    this.loading.set(false);
    if (!libraryId) return;

    const snapshot = this.cache.take(this.page, this.cacheKey(libraryId, query));
    if (snapshot) {
      this.items.set(snapshot.items);
      this.cursor = snapshot.cursor;
      this.hasMore.set(snapshot.hasMore);
      this.count.set(snapshot.count);
      this.loaded.set(true);
      this.pendingScroll = snapshot.scrollTop;
      return;
    }
    void this.loadCount(query);
    await this.loadMore();
  }

  private cacheKey(libraryId: string, query: MediaQuery) {
    return `${libraryId}|${JSON.stringify(query)}`;
  }

  async loadMore(pageSize = PAGE_SIZE): Promise<void> {
    const libraryId = this.activeLibrary;
    if (!libraryId || this.loading() || !this.hasMore()) return;
    const generation = this.generation;
    this.loading.set(true);
    try {
      const page = await unwrap(
        this.backend.commands.listMedia(libraryId, this.query(), this.cursor, pageSize),
      );
      if (generation !== this.generation) return;
      this.items.update((items) => [...items, ...page.items]);
      this.cursor = page.nextCursor;
      this.hasMore.set(page.nextCursor !== null);
      this.loaded.set(true);
    } catch (e) {
      if (generation === this.generation) {
        this.hasMore.set(false);
        this.loaded.set(true);
        this.notify.error('Não foi possível carregar as fotos', e);
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /**
   * Reload what is on screen without clearing it (no flash, scroll kept). Beyond one
   * backend page the list is left as is: the order only changes near the top.
   */
  async refresh(): Promise<void> {
    const libraryId = this.activeLibrary;
    if (!libraryId || this.loading()) return;
    const generation = ++this.generation;
    const query = this.query();
    const loaded = this.items().length;
    if (loaded > MAX_PAGE) {
      void this.loadCount(query);
      return;
    }
    try {
      const page = await unwrap(
        this.backend.commands.listMedia(libraryId, query, null, Math.max(loaded, PAGE_SIZE)),
      );
      if (generation !== this.generation) return;
      this.items.set(page.items);
      this.cursor = page.nextCursor;
      this.hasMore.set(page.nextCursor !== null);
      this.loaded.set(true);
      void this.loadCount(query);
    } catch {
      // Best effort; the next navigation reloads.
    }
  }

  private async loadCount(query: MediaQuery) {
    const libraryId = this.activeLibrary;
    if (!libraryId) return;
    const generation = this.generation;
    try {
      const count = await unwrap(this.backend.commands.countMedia(libraryId, query.filter ?? {}));
      if (generation === this.generation) this.count.set(count);
    } catch {
      // The list itself reports errors.
    }
  }

  /** Apply changed items; drop those that no longer match the page's fixed filter. */
  private patch(updated: MediaItem[], removedIds: string[]) {
    const fixed = this.fixed();
    const byId = new Map(updated.map((m) => [m.id, m]));
    const removed = new Set(removedIds);
    let dropped = 0;
    const next: MediaItem[] = [];
    for (const item of this.items()) {
      const fresh = byId.get(item.id) ?? item;
      if (removed.has(item.id) || !matchesLocally(fixed, fresh)) {
        dropped++;
        continue;
      }
      next.push(fresh);
    }
    if (dropped || updated.some((m) => this.items().some((i) => i.id === m.id))) {
      this.items.set(next);
    }
    if (dropped) void this.loadCount(this.query());
  }
}

/** Checks the filter fields an edit can change (favorite, type, trash, review). */
export function matchesLocally(filter: MediaFilter, item: MediaItem): boolean {
  if (filter.favorite === true && !item.isFavorite) return false;
  if (filter.mediaType && item.mediaType !== filter.mediaType) return false;
  if ((filter.trashed === true) !== item.inTrash) return false;
  if ((filter.review === true || filter.reviewReason) && item.reviewPriority === null) return false;
  return true;
}
