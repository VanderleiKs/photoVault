import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type Album, type MediaItem, type MediaSort } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { AlbumStore } from '../../core/stores/album.store';
import { BrowseStore } from '../../core/stores/browse.store';
import { GalleryStore } from '../../core/stores/gallery.store';
import { SelectionStore } from '../../core/stores/selection.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';
import { describeRule } from './album-rule';

/** One album. Route: /albums/:id */
@Component({
  selector: 'app-album-page',
  imports: [RouterLink, ButtonModule, TooltipModule, EmptyStateComponent, GalleryControlsComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-3">
        <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Voltar para álbuns" routerLink="/albums" />
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 truncate text-xl font-semibold">
            @if (album()?.kind === 'smart') {
              <i class="pi pi-bolt text-amber-500" title="Álbum inteligente"></i>
            }
            {{ album()?.name ?? 'Álbum' }}
          </h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        @if (album(); as a) {
          @if (a.kind === 'smart') {
            <p-button label="Editar regra" icon="pi pi-sliders-h" size="small" [outlined]="true" (onClick)="editRule(a)" />
          }
        }
        <app-gallery-controls [(sort)]="sort" />
      </div>
      @if (rule().length) {
        <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span class="text-muted">Regra:</span>
          @for (part of rule(); track part) {
            <span class="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">{{ part }}</span>
          }
        </div>
      }
    </header>

    <section class="p-6">
      @if (missing()) {
        <app-empty-state icon="pi pi-book" title="Álbum não encontrado" text="Ele pode ter sido excluído.">
          <p-button label="Ver álbuns" icon="pi pi-book" routerLink="/albums" />
        </app-empty-state>
      } @else if (gallery.loaded() && !gallery.items().length) {
        @if (album()?.kind === 'smart') {
          <app-empty-state icon="pi pi-bolt" title="Nenhuma foto atende à regra" text="Assim que houver fotos que atendam a estes filtros, elas aparecem aqui sozinhas." />
        } @else {
          <app-empty-state icon="pi pi-images" title="Álbum vazio" text="Em Todas as fotos, selecione fotos pelo círculo no canto e use &quot;Adicionar ao álbum&quot;.">
            <p-button label="Ir para Todas as fotos" icon="pi pi-images" routerLink="/photos" />
          </app-empty-state>
        }
      }
      <app-media-grid
        [label]="album()?.name ?? 'Álbum'"
        [items]="gallery.items()"
        [loading]="gallery.loading()"
        [hasMore]="gallery.hasMore()"
        (loadMore)="gallery.loadMore()"
        (open)="open($event)"
      />
    </section>

    <app-selection-bar [items]="gallery.items()">
      @if (album()?.kind === 'manual') {
        @if (selection.count() === 1) {
          <p-button icon="pi pi-image" label="Usar como capa" [text]="true" [rounded]="true" size="small" (onClick)="useAsCover()" />
        }
        <p-button icon="pi pi-minus-circle" label="Remover do álbum" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Os arquivos não são apagados" tooltipPosition="top" (onClick)="removeSelected()" />
      }
    </app-selection-bar>
  `,
})
export class AlbumPage {
  readonly id = input.required<string>();

  protected readonly gallery = inject(GalleryStore);
  protected readonly selection = inject(SelectionStore);
  private readonly albums = inject(AlbumStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly viewer = inject(ViewerContext);
  private readonly browse = inject(BrowseStore);
  private readonly router = inject(Router);

  protected readonly album = signal<Album | null>(null);
  protected readonly missing = signal(false);
  protected readonly sort = signal<MediaSort | undefined>('newest');
  protected readonly rule = computed(() => describeRule(this.album()?.rule));
  protected readonly subtitle = computed(() => {
    const n = this.gallery.count()?.total ?? this.album()?.mediaCount;
    return n === undefined ? '' : `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.gallery.fixed.set({ albumId: id });
      untracked(() => void this.load(id));
    });
    effect(() => this.gallery.userQuery.set({ sort: this.sort() ?? 'newest' }));
    // Renamed/rule edited elsewhere (album list reloads after every change).
    effect(() => {
      const fresh = this.albums.albums().find((a) => a.id === this.id());
      if (fresh) untracked(() => this.album.set(fresh));
    });
  }

  private async load(id: string) {
    this.missing.set(false);
    try {
      this.album.set(await unwrap(this.backend.commands.getAlbum(id)));
    } catch {
      this.album.set(null);
      this.missing.set(true);
      this.gallery.enabled.set(false);
    }
  }

  protected async removeSelected() {
    const album = this.album();
    if (!album) return;
    const ids = [...this.selection.ids()];
    if (await this.albums.removeMedia(album, ids)) {
      this.selection.clear();
      await this.gallery.refresh();
    }
  }

  protected async useAsCover() {
    const album = this.album();
    const [id] = [...this.selection.ids()];
    if (!album || !id) return;
    await this.albums.setCover(album, id);
    this.selection.clear();
    this.notify.success('Capa atualizada', album.name);
  }

  protected editRule(album: Album) {
    this.browse.editRule(album);
    void this.router.navigate(['/photos']);
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }
}
