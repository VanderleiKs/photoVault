import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Backend } from '../ipc/backend';
import { unwrap, type Library, type LibraryStats, type VolumeInfo } from '../ipc/ipc';
import { AppStore } from './app.store';

/** Libraries, the active one, and its stats/volume for the shell. */
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly backend = inject(Backend);
  private readonly app = inject(AppStore);

  readonly libraries = signal<Library[]>([]);
  readonly loaded = signal(false);

  /** Saved active library, or the first one if the saved id no longer exists. */
  readonly activeId = computed(() => {
    const libs = this.libraries();
    const saved = this.app.settings().activeLibraryId;
    return libs.find((l) => l.id === saved)?.id ?? libs[0]?.id ?? null;
  });
  readonly active = computed(() => this.libraries().find((l) => l.id === this.activeId()) ?? null);

  readonly stats = signal<LibraryStats | null>(null);
  readonly volume = signal<VolumeInfo | null>(null);

  constructor() {
    effect(() => {
      const library = this.active();
      untracked(() => this.refreshDetails(library));
    });
  }

  async load(): Promise<void> {
    this.libraries.set(await unwrap(this.backend.commands.listLibraries()));
    this.loaded.set(true);
  }

  async create(name: string, rootPath: string): Promise<Library> {
    const library = await unwrap(this.backend.commands.createLibrary(name, rootPath));
    await this.load();
    await this.setActive(library.id);
    return library;
  }

  async rename(id: string, name: string): Promise<void> {
    await unwrap(this.backend.commands.renameLibrary(id, name));
    await this.load();
  }

  async relocate(id: string, rootPath: string): Promise<void> {
    await unwrap(this.backend.commands.relocateLibrary(id, rootPath));
    await this.load();
  }

  async remove(id: string): Promise<void> {
    await unwrap(this.backend.commands.deleteLibrary(id));
    await this.load();
    if (this.app.settings().activeLibraryId === id) {
      await this.app.updateSettings({ activeLibraryId: this.activeId() });
    }
  }

  async setActive(id: string): Promise<void> {
    if (this.app.settings().activeLibraryId !== id) {
      await this.app.updateSettings({ activeLibraryId: id });
    }
  }

  /** Reload the list (e.g. `lastScanAt` changed) and the active library's details. */
  async refresh(): Promise<void> {
    await this.load();
    await this.refreshDetails(this.active());
  }

  private async refreshDetails(library: Library | null): Promise<void> {
    if (!library) {
      this.stats.set(null);
      this.volume.set(null);
      return;
    }
    const [stats, volume] = await Promise.all([
      unwrap(this.backend.commands.getLibraryStats(library.id)).catch(() => null),
      library.connected
        ? unwrap(this.backend.commands.getVolumeInfo(library.rootPath)).catch(() => null)
        : Promise.resolve(null),
    ]);
    this.stats.set(stats);
    this.volume.set(volume);
  }
}
