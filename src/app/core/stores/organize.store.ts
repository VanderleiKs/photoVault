import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type OrganizeCounts } from '../ipc/ipc';
import { LibraryStore } from './library.store';

/** Counters of "Organizar" for the active library (sidebar badges, pages). */
@Injectable({ providedIn: 'root' })
export class OrganizeStore {
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);

  readonly counts = signal<OrganizeCounts | null>(null);
  /** Bumps when the backend recomputed groups/flags; pages reload on it. */
  readonly version = signal(0);

  /** Badge per organize route (0 = no badge). */
  readonly badges = computed<Record<string, number>>(() => {
    const c = this.counts();
    if (!c) return {} as Record<string, number>;
    return {
      '/organize/duplicates': c.exactGroups + c.visualGroups,
      '/organize/similar': c.similarGroups + c.sequences,
      '/organize/low-quality': c.lowQuality,
      '/organize/momentary': c.momentary,
      '/organize/screenshots': c.screenshots,
    };
  });

  private listening = false;

  constructor() {
    effect(() => {
      const id = this.libraries.activeId();
      untracked(() => void this.refresh(id));
    });
  }

  async init(): Promise<void> {
    if (this.listening || !isTauri()) return;
    this.listening = true;
    await this.backend.events.analysisUpdatedEvent.listen(({ payload }) => {
      if (payload.libraryId === this.libraries.activeId()) {
        this.version.update((v) => v + 1);
        void this.refresh();
      }
    });
  }

  async refresh(libraryId = this.libraries.activeId()): Promise<void> {
    if (!libraryId || !isTauri()) {
      this.counts.set(null);
      return;
    }
    this.counts.set(await unwrap(this.backend.commands.getOrganizeCounts(libraryId)).catch(() => null));
  }
}
