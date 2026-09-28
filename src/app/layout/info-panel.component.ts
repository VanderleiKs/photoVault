import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { Backend } from '../core/ipc/backend';
import { previewUrl, unwrap, usePlaceholder, type AlbumRef } from '../core/ipc/ipc';
import { AlbumStore } from '../core/stores/album.store';
import { MediaActions } from '../core/stores/media-actions.service';
import { SelectionStore } from '../core/stores/selection.store';
import { UiStore } from '../core/stores/ui.store';
import { ViewerContext } from '../core/stores/viewer-context';
import { AlbumPicker } from '../shared/album-picker.component';
import { MediaDetailsComponent } from '../shared/media-details.component';

/** Right-hand "Informações" panel for the focused item (PRD §23.1). */
@Component({
  selector: 'app-info-panel',
  imports: [RouterLink, ButtonModule, MediaDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-80 shrink-0 flex-col overflow-y-auto border-l border-line bg-panel' },
  template: `
    @if (selection.focused(); as item) {
      <div class="flex items-center justify-between px-5 pb-3 pt-4">
        <h2 class="text-sm font-semibold">Informações</h2>
        <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" size="small" ariaLabel="Fechar" (onClick)="ui.infoPanelOpen.set(false)" />
      </div>
      <div class="px-5 pb-6">
        <div class="relative">
          <button type="button" class="block w-full cursor-zoom-in overflow-hidden rounded-card bg-panel-2" (click)="viewer.open(item)" aria-label="Abrir no visualizador">
            @if (item.mediaType === 'image') {
              <img [src]="thumb()" [alt]="item.filename" class="aspect-[4/3] w-full object-cover" (error)="onError($event)" />
            } @else {
              <div class="flex aspect-[4/3] items-center justify-center bg-slate-800 text-slate-400"><i class="pi pi-video text-4xl"></i></div>
            }
          </button>
          <p-button
            [icon]="item.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
            [rounded]="true"
            size="small"
            [severity]="item.isFavorite ? 'danger' : 'secondary'"
            [ariaLabel]="item.isFavorite ? 'Remover dos favoritos' : 'Favoritar'"
            styleClass="!absolute right-2 top-2 shadow"
            (onClick)="actions.setFavorite([item.id], !item.isFavorite)"
          />
        </div>

        <app-media-details class="mt-4" [item]="item" />

        @if (albums().length) {
          <h4 class="mb-2 mt-5 text-sm font-semibold">Álbuns</h4>
          <div class="flex flex-wrap gap-1.5">
            @for (a of albums(); track a.id) {
              <a [routerLink]="['/albums', a.id]" class="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs hover:bg-primary/10 hover:text-primary">{{ a.name }}</a>
            }
          </div>
        }

        <div class="mt-5 flex gap-2">
          <p-button label="Abrir" icon="pi pi-external-link" [outlined]="true" styleClass="w-full" class="flex-1" (onClick)="viewer.open(item)" />
          <p-button icon="pi pi-book" [outlined]="true" severity="secondary" ariaLabel="Adicionar ao álbum" (onClick)="picker.open([item.id])" />
        </div>
      </div>
    }
  `,
})
export class InfoPanelComponent {
  protected readonly selection = inject(SelectionStore);
  protected readonly ui = inject(UiStore);
  protected readonly viewer = inject(ViewerContext);
  protected readonly actions = inject(MediaActions);
  protected readonly picker = inject(AlbumPicker);
  private readonly backend = inject(Backend);

  protected readonly albums = signal<AlbumRef[]>([]);
  protected readonly thumb = computed(() => {
    const item = this.selection.focused();
    return item ? previewUrl(item.id, item.thumbVersion) : '';
  });

  constructor() {
    const albumStore = inject(AlbumStore);
    effect(() => {
      const id = this.selection.focusedId();
      albumStore.albums(); // membership changes reload the album list
      untracked(() => void this.loadAlbums(id));
    });
  }

  private async loadAlbums(id: string | null) {
    if (!id || !isTauri()) return this.albums.set([]);
    const albums = await unwrap(this.backend.commands.getMediaAlbums(id)).catch(() => []);
    if (id === this.selection.focusedId()) this.albums.set(albums);
  }

  protected onError(event: Event) {
    usePlaceholder(event);
  }
}
