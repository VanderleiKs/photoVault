import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { SliderModule } from '@openng/optimus-ui/slider';
import { formatCount } from '../../core/format';
import type { MediaItem } from '../../core/ipc/ipc';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaStore } from '../../core/stores/media.store';
import { ScanStore } from '../../core/stores/scan.store';
import { UiStore } from '../../core/stores/ui.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MediaTileComponent } from '../../shared/media-tile.component';

@Component({
  selector: 'app-photos-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    ProgressBarModule,
    SkeletonModule,
    SliderModule,
    EmptyStateComponent,
    MediaTileComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-semibold">Todas as fotos</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>

        @if (media.items().length) {
          <label class="hidden items-center gap-3 text-muted sm:flex" title="Tamanho das miniaturas">
            <i class="pi pi-th-large text-xs"></i>
            <p-slider [(ngModel)]="ui.tileSize" [min]="96" [max]="280" [step]="8" styleClass="w-28" ariaLabel="Tamanho das miniaturas" />
            <i class="pi pi-stop text-sm"></i>
          </label>
        }

        @if (scanning()) {
          <p-button label="Cancelar" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="scan.cancel()" />
        } @else {
          <p-button
            label="Escanear"
            icon="pi pi-refresh"
            [disabled]="!library()?.connected"
            (onClick)="startScan()"
          />
        }
      </div>

      @if (scanning()) {
        <div class="mt-3" role="status">
          <p-progressbar
            [value]="percent()"
            [mode]="percent() === null ? 'indeterminate' : 'determinate'"
            [showValue]="false"
            styleClass="!h-1.5"
          />
          <p class="mt-1.5 truncate text-xs text-muted">{{ progressText() }}</p>
        </div>
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
        } @else if (!media.items().length && !media.loading() && !scanning()) {
          <app-empty-state
            icon="pi pi-images"
            title="Nenhuma foto indexada ainda"
            text="Escaneie a biblioteca para encontrar fotos e vídeos. Seus arquivos não são alterados."
          >
            <p-button label="Escanear agora" icon="pi pi-refresh" (onClick)="startScan()" />
          </app-empty-state>
        }
      }

      <div class="grid gap-2" [style.grid-template-columns]="columns()" role="listbox" aria-label="Fotos">
        @for (item of media.items(); track item.id) {
          <app-media-tile
            [item]="item"
            [selected]="item.id === media.selectedId()"
            (select)="select($event)"
            (open)="open($event)"
          />
        }
        @if (media.loading()) {
          @for (i of skeletons; track i) {
            <p-skeleton styleClass="!aspect-square !h-auto !rounded-lg" />
          }
        }
      </div>
      <div #sentinel class="h-px"></div>
    </section>
  `,
})
export class PhotosPage {
  protected readonly media = inject(MediaStore);
  protected readonly scan = inject(ScanStore);
  protected readonly ui = inject(UiStore);
  private readonly libraries = inject(LibraryStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly library = this.libraries.active;
  protected readonly skeletons = Array.from({ length: 12 }, (_, i) => i);
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');

  protected readonly scanning = computed(() => this.scan.isScanning(this.library()?.id));
  protected readonly columns = computed(() => `repeat(auto-fill, minmax(${this.ui.tileSize()}px, 1fr))`);

  protected readonly subtitle = computed(() => {
    const lib = this.library();
    const stats = this.libraries.stats();
    if (!lib) return '';
    if (!stats) return lib.name;
    const photos = `${formatCount(stats.photos)} ${stats.photos === 1 ? 'foto' : 'fotos'}`;
    const videos = `${formatCount(stats.videos)} ${stats.videos === 1 ? 'vídeo' : 'vídeos'}`;
    return `${lib.name} · ${photos} · ${videos}`;
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
    // Infinite scroll: load the next page when the sentinel approaches the viewport.
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => entries.some((e) => e.isIntersecting) && void this.media.loadMore(),
        { rootMargin: '800px' },
      );
      observer.observe(this.sentinel().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected startScan() {
    const id = this.library()?.id;
    if (id) void this.scan.start(id);
  }

  protected select(item: MediaItem) {
    this.media.select(item);
    this.ui.infoPanelOpen.set(true);
  }

  protected open(item: MediaItem) {
    this.media.select(item);
    void this.router.navigate(['/viewer', item.id]);
  }
}
