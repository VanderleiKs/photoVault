import { Injectable, inject } from '@angular/core';
import { Backend } from '../ipc/backend';
import { unwrap } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { LibraryStore } from './library.store';
import { MediaBus } from './media-bus';

/** Edits on media that every screen shares (favorite for now; trash in phase 5). */
@Injectable({ providedIn: 'root' })
export class MediaActions {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly bus = inject(MediaBus);
  private readonly libraries = inject(LibraryStore);

  async setFavorite(ids: readonly string[], favorite: boolean): Promise<boolean> {
    if (!ids.length) return false;
    try {
      const items = await unwrap(this.backend.commands.setFavorite([...ids], favorite));
      this.bus.publish(items);
      void this.libraries.refresh();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível atualizar os favoritos', e);
      return false;
    }
  }
}
