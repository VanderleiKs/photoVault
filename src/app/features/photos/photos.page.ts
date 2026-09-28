import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { formatCount } from '../../core/format';
import type { MediaItem, MediaSort } from '../../core/ipc/ipc';
import { BrowseStore } from '../../core/stores/browse.store';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { ScanStore } from '../../core/stores/scan.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FilterBarComponent } from '../../shared/filter-bar.component';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { JobStatusComponent } from '../../shared/job-status.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

/** "Todas as fotos": the whole library with filters, search and sort (PRD §19). */
@Component({
  selector: 'app-photos-page',
  imports: [
    RouterLink,
    ButtonModule,
    ProgressBarModule,
    EmptyStateComponent,
    FilterBarComponent,
    GalleryControlsComponent,
    JobStatusComponent,
    MediaGridComponent,
    SelectionBarComponent,
  ],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-semibold">{{ browse.text().trim() ? 'Resultados da busca' : 'Todas as fotos' }}</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        <app-gallery-controls [sort]="browse.sort()" (sortChange)="setSort($event)" />
        @if (scanning()) {
          <p-button label="Cancelar" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="scan.cancel()" />
        } @else {
          <p-button label="Escanear" icon="pi pi-refresh" [disabled]="!library()?.connected" (onClick)="startScan()" />
        }
      </div>

      @if (scanning()) {
        <div class="mt-3" role="status">
          <p-progressbar [value]="percent()" [mode]="percent() === null ? 'indeterminate' : 'determinate'" [showValue]="false" styleClass="!h-1.5" />
          <p class="mt-1.5 truncate text-xs text-muted">{{ progressText() }}</p>
        </div>
      }

      @if (hasMedia()) {
        <app-filter-bar class="mt-3" />
      }
    </header>

    <section class="p-6">
      @if (library(); as lib) {
        @if (!lib.connected) {
          <app-empty-state
            icon="pi pi-exclamation-triangle"
            title="Biblioteca desconectada"
            [text]="'A pasta ' + lib.rootPath + ' não está acessível. Conecte o disco ou aponte para o novo local.'"
          >
            <p-button label="Gerenciar bibliotecas" icon="pi pi-database" routerLink="/libraries" />
          </app-empty-state>
        } @else if (gallery.loaded() && !gallery.items().length && !scanning()) {
          @if (browse.filtered()) {
            <app-empty-state icon="pi pi-search" title="Nada encontrado" text="Nenhuma foto atende a esta busca ou a estes filtros.">
              <p-button label="Limpar filtros" icon="pi pi-filter-slash" [outlined]="true" (onClick)="browse.clear()" />
            </app-empty-state>
          } @else {
            <app-empty-state icon="pi pi-images" title="Nenhuma foto indexada ainda" text="Escaneie a biblioteca para encontrar fotos e vídeos. Seus arquivos não são alterados.">
              <p-button label="Escanear agora" icon="pi pi-refresh" (onClick)="startScan()" />
            </app-empty-state>
          }
        }
      }

      <app-media-grid
        [items]="gallery.items()"
        [loading]="gallery.loading()"
        [hasMore]="gallery.hasMore()"
        (loadMore)="gallery.loadMore()"
        (open)="open($event)"
      />
    </section>

    <app-selection-bar [items]="gallery.items()" />
  `,
})
export class PhotosPage {
  protected readonly gallery = inject(GalleryStore);
  protected readonly browse = inject(BrowseStore);
  protected readonly scan = inject(ScanStore);
  private readonly libraries = inject(LibraryStore);
  private readonly viewer = inject(ViewerContext);

  protected readonly library = this.libraries.active;
  protected readonly scanning = computed(() => this.scan.isScanning(this.library()?.id));
  /** The library has anything at all (filters are pointless otherwise). */
  protected readonly hasMedia = computed(() => {
    const stats = this.libraries.stats();
    return !!stats && stats.photos + stats.videos > 0;
  });

  protected readonly subtitle = computed(() => {
    const lib = this.library();
    if (!lib) return '';
    const count = this.gallery.count();
    if (!count) return lib.name;
    const photos = `${formatCount(count.photos)} ${count.photos === 1 ? 'foto' : 'fotos'}`;
    const videos = `${formatCount(count.videos)} ${count.videos === 1 ? 'vídeo' : 'vídeos'}`;
    return `${lib.name} · ${photos} · ${videos}${this.browse.filtered() ? ' (filtrado)' : ''}`;
  });

  protected readonly percent = computed(() => {
    const p = this.scan.progress();
    return p?.phase === 'indexing' && p.total > 0 ? Math.round((100 * p.processed) / p.total) : null;
  });

  protected readonly progressText = computed(() => {
    const p = this.scan.progress();
    if (!p || p.phase === 'discovering') {
      return `Procurando arquivos… ${formatCount(p?.processed ?? 0)} encontrados`;
    }
    return `Indexando ${formatCount(p.processed)} de ${formatCount(p.total)} · ${p.currentPath}`;
  });

  constructor() {
    effect(() => this.gallery.userQuery.set(this.browse.query()));
  }

  protected setSort(sort: MediaSort | undefined) {
    if (sort) this.browse.sort.set(sort);
  }

  protected startScan() {
    const id = this.library()?.id;
    if (id) void this.scan.start(id);
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }
}
