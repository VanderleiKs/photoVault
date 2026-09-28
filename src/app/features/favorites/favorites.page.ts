import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { formatCount } from '../../core/format';
import type { MediaItem, MediaSort } from '../../core/ipc/ipc';
import { GalleryStore } from '../../core/stores/gallery.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

@Component({
  selector: 'app-favorites-page',
  imports: [EmptyStateComponent, GalleryControlsComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="min-w-0 flex-1">
        <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-heart-fill text-rose-500"></i>Favoritos</h1>
        <p class="text-sm text-muted">{{ subtitle() }}</p>
      </div>
      <app-gallery-controls [(sort)]="sort" />
    </header>
    <section class="p-6">
      @if (gallery.loaded() && !gallery.items().length) {
        <app-empty-state
          icon="pi pi-heart"
          title="Nenhuma favorita ainda"
          text="Toque no coração de uma foto (ou tecle F no visualizador) para guardá-la aqui. Favoritas nunca são sugeridas para exclusão."
        />
      }
      <app-media-grid
        label="Favoritos"
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
export class FavoritesPage {
  protected readonly gallery = inject(GalleryStore);
  private readonly viewer = inject(ViewerContext);
  protected readonly sort = signal<MediaSort | undefined>('newest');

  protected readonly subtitle = computed(() => {
    const n = this.gallery.count()?.total;
    return n === undefined ? '' : `${formatCount(n)} ${n === 1 ? 'favorita' : 'favoritas'}`;
  });

  constructor() {
    this.gallery.fixed.set({ favorite: true });
    effect(() => this.gallery.userQuery.set({ sort: this.sort() ?? 'newest' }));
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }
}
