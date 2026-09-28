import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type Album, type MediaFilter } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { LibraryStore } from './library.store';

/** Albums of the active library. Mutations reload the list (it is small). */
@Injectable({ providedIn: 'root' })
export class AlbumStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);

  readonly albums = signal<Album[]>([]);
  readonly loaded = signal(false);
  readonly manual = computed(() => this.albums().filter((a) => a.kind === 'manual'));

  constructor() {
    effect(() => {
      const id = this.libraries.activeId();
      untracked(() => void this.load(id));
    });
  }

  async load(libraryId = this.libraries.activeId()): Promise<void> {
    if (!libraryId || !isTauri()) {
      this.albums.set([]);
      this.loaded.set(!libraryId);
      return;
    }
    try {
      this.albums.set(await unwrap(this.backend.commands.listAlbums(libraryId)));
    } catch (e) {
      this.notify.error('Não foi possível carregar os álbuns', e);
    } finally {
      this.loaded.set(true);
    }
  }

  /** Throws on validation errors (the dialog shows them). */
  async create(name: string, rule: MediaFilter | null = null): Promise<Album> {
    const libraryId = this.libraries.activeId();
    if (!libraryId) throw new Error('Nenhuma biblioteca ativa.');
    const album = await unwrap(this.backend.commands.createAlbum(libraryId, name, rule));
    await this.load();
    return album;
  }

  async rename(id: string, name: string): Promise<Album> {
    const album = await unwrap(this.backend.commands.renameAlbum(id, name));
    await this.load();
    return album;
  }

  async updateRule(id: string, rule: MediaFilter): Promise<Album> {
    const album = await unwrap(this.backend.commands.updateAlbumRule(id, rule));
    await this.load();
    return album;
  }

  async remove(id: string): Promise<void> {
    try {
      await unwrap(this.backend.commands.deleteAlbum(id));
      this.notify.success('Álbum excluído', 'As fotos continuam na biblioteca.');
      await this.load();
    } catch (e) {
      this.notify.error('Não foi possível excluir o álbum', e);
    }
  }

  async add(album: Album, mediaIds: readonly string[]): Promise<boolean> {
    try {
      const added = await unwrap(this.backend.commands.addToAlbum(album.id, [...mediaIds]));
      const skipped = mediaIds.length - added;
      this.notify.success(
        `Adicionado a "${album.name}"`,
        `${added} ${added === 1 ? 'item' : 'itens'}${skipped ? ` (${skipped} já estavam no álbum)` : ''}.`,
      );
      await this.load();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível adicionar ao álbum', e);
      return false;
    }
  }

  async removeMedia(album: Album, mediaIds: readonly string[]): Promise<boolean> {
    try {
      const removed = await unwrap(this.backend.commands.removeFromAlbum(album.id, [...mediaIds]));
      this.notify.info(`Removido de "${album.name}"`, `${removed} ${removed === 1 ? 'item' : 'itens'}. Os arquivos não foram apagados.`);
      await this.load();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível remover do álbum', e);
      return false;
    }
  }

  async setCover(album: Album, mediaId: string | null): Promise<void> {
    try {
      await unwrap(this.backend.commands.setAlbumCover(album.id, mediaId));
      await this.load();
    } catch (e) {
      this.notify.error('Não foi possível definir a capa', e);
    }
  }
}
