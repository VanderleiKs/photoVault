import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { formatBytes, formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type MediaItem, type TrashSummary } from '../../core/ipc/ipc';
import { AppStore } from '../../core/stores/app.store';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaActions } from '../../core/stores/media-actions.service';
import { OrganizeStore } from '../../core/stores/organize.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

/** "Lixeira" (PRD §16): what was sent to `.photovault-trash`, to restore or delete. */
@Component({
  selector: 'app-trash-page',
  imports: [ButtonModule, EmptyStateComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-trash text-muted"></i>Lixeira</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <p-button label="Esvaziar lixeira" icon="pi pi-trash" severity="danger" [outlined]="true" [disabled]="!summary()?.count" (onClick)="empty()" />
      </div>
      <p class="mt-2 max-w-3xl text-xs text-muted">
        As fotos ficam na pasta <code>.photovault-trash</code> da própria biblioteca, no mesmo disco. Restaurar devolve cada arquivo ao local original, sem alterar nenhum byte.
        @if (systemTrash()) {
          Novas exclusões estão indo para a lixeira do sistema (Configurações → Revisão e lixeira) e não aparecem aqui.
        }
      </p>
    </header>
    <section class="p-6">
      @if (gallery.loaded() && !gallery.items().length) {
        <app-empty-state icon="pi pi-trash" title="A lixeira está vazia" text="Fotos enviadas para a lixeira aparecem aqui até você restaurá-las ou excluí-las definitivamente." />
      }
      <app-media-grid
        label="Lixeira"
        [items]="gallery.items()"
        [loading]="gallery.loading()"
        [hasMore]="gallery.hasMore()"
        (loadMore)="gallery.loadMore()"
        (open)="open($event)"
      />
    </section>
    <app-selection-bar mode="trash" [items]="gallery.items()" />
  `,
})
export class TrashPage {
  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);
  private readonly viewer = inject(ViewerContext);
  private readonly actions = inject(MediaActions);
  private readonly app = inject(AppStore);

  protected readonly summary = signal<TrashSummary | null>(null);
  protected readonly systemTrash = computed(() => this.app.settings().review?.useSystemTrash ?? false);
  protected readonly subtitle = computed(() => {
    const s = this.summary();
    if (!s) return '';
    return s.count ? `${formatCount(s.count)} ${s.count === 1 ? 'item' : 'itens'} · ${formatBytes(s.bytes)}` : 'Vazia';
  });

  constructor() {
    this.gallery.fixed.set({ trashed: true });
    this.gallery.userQuery.set({ sort: 'newest' });
    effect(() => {
      const library = this.libraries.activeId();
      this.organize.version();
      untracked(() => {
        void this.loadSummary(library);
        void this.gallery.refresh();
      });
    });
  }

  private async loadSummary(libraryId: string | null) {
    if (!libraryId || !isTauri()) return this.summary.set(null);
    this.summary.set(await unwrap(this.backend.commands.getTrashSummary(libraryId)).catch(() => null));
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }

  protected empty() {
    const library = this.libraries.activeId();
    const count = this.summary()?.count ?? 0;
    if (library) void this.actions.emptyTrash(library, count);
  }
}
