import { ChangeDetectionStrategy, Component, Injectable, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { errorMessage, thumbnailUrl, type Album } from '../core/ipc/ipc';
import { AlbumStore } from '../core/stores/album.store';
import { SelectionStore } from '../core/stores/selection.store';
import { formatCount } from '../core/format';

/** Opens the "Adicionar ao álbum" dialog (rendered once, in the shell). */
@Injectable({ providedIn: 'root' })
export class AlbumPicker {
  readonly mediaIds = signal<readonly string[] | null>(null);

  open(mediaIds: readonly string[]) {
    if (mediaIds.length) this.mediaIds.set(mediaIds);
  }

  close() {
    this.mediaIds.set(null);
  }
}

@Component({
  selector: 'app-album-picker',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="title()"
      [visible]="!!picker.mediaIds()"
      (visibleChange)="!$event && picker.close()"
      [modal]="true"
      [draggable]="false"
      [dismissableMask]="true"
      styleClass="w-[28rem] max-w-[95vw]"
    >
      <form class="flex gap-2" (ngSubmit)="createAndAdd()">
        <input pInputText name="name" class="min-w-0 flex-1" placeholder="Novo álbum" aria-label="Nome do novo álbum" [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" maxlength="100" />
        <p-button type="submit" label="Criar" icon="pi pi-plus" [disabled]="!name().trim() || busy()" />
      </form>
      @if (error()) {
        <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
      }

      @if (albums.manual().length) {
        <p class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Seus álbuns</p>
        <ul class="max-h-80 space-y-1 overflow-y-auto">
          @for (album of albums.manual(); track album.id) {
            <li>
              <button type="button" class="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-panel-2 disabled:opacity-50" [disabled]="busy()" (click)="add(album)">
                @if (album.cover; as cover) {
                  <img [src]="thumb(cover.id, cover.thumbVersion)" alt="" class="size-11 rounded-md object-cover" />
                } @else {
                  <span class="flex size-11 items-center justify-center rounded-md bg-panel-2 text-muted"><i class="pi pi-book"></i></span>
                }
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium">{{ album.name }}</span>
                  <span class="text-xs text-muted">{{ count(album.mediaCount) }}</span>
                </span>
                <i class="pi pi-plus text-xs text-muted"></i>
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="mt-4 text-sm text-muted">Você ainda não tem álbuns. Crie o primeiro acima.</p>
      }
      <p class="mt-4 text-xs text-muted">Álbuns só guardam referências: nenhum arquivo é copiado ou movido.</p>
    </p-dialog>
  `,
})
export class AlbumPickerComponent {
  protected readonly picker = inject(AlbumPicker);
  protected readonly albums = inject(AlbumStore);
  private readonly selection = inject(SelectionStore);

  protected readonly name = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly title = computed(() => {
    const n = this.picker.mediaIds()?.length ?? 0;
    return `Adicionar ${n} ${n === 1 ? 'item' : 'itens'} ao álbum`;
  });

  protected thumb = thumbnailUrl;
  protected count(n: number) {
    return `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  }

  protected async add(album: Album) {
    const ids = this.picker.mediaIds();
    if (!ids) return;
    this.busy.set(true);
    const ok = await this.albums.add(album, ids);
    this.busy.set(false);
    if (ok) this.done();
  }

  protected async createAndAdd() {
    const ids = this.picker.mediaIds();
    if (!ids || !this.name().trim()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const album = await this.albums.create(this.name());
      if (await this.albums.add(album, ids)) this.done();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  private done() {
    this.name.set('');
    this.error.set(null);
    this.picker.close();
    this.selection.clear();
  }
}
