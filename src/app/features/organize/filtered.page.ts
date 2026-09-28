import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { formatCount } from '../../core/format';
import type { MediaFilter, MediaItem, MediaSort } from '../../core/ipc/ipc';
import { GalleryStore } from '../../core/stores/gallery.store';
import { OrganizeStore } from '../../core/stores/organize.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { JobStatusComponent } from '../../shared/job-status.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

type FilteredMode = 'low-quality' | 'momentary' | 'screenshots';

interface Mode {
  title: string;
  icon: string;
  intro: string;
  empty: string;
  /** Sub-filters as chips; the first is the default. */
  options: { label: string; filter: MediaFilter }[];
}

const MODES: Record<FilteredMode, Mode> = {
  'low-quality': {
    title: 'Baixa qualidade',
    icon: 'pi pi-eye-slash',
    intro: 'Fotos borradas, escuras, estouradas ou sem informação, medidas pela nitidez e pelo histograma. Qualidade técnica baixa não significa foto sem valor: revise antes de descartar.',
    empty: 'Nenhuma foto com problema técnico encontrado.',
    options: [
      { label: 'Todas', filter: { quality: 'low' } },
      { label: 'Borradas', filter: { qualityFlag: 'blurry' } },
      { label: 'Escuras', filter: { qualityFlag: 'dark' } },
      { label: 'Estouradas', filter: { qualityFlag: 'overexposed' } },
      { label: 'Sem informação', filter: { qualityFlag: 'empty' } },
      { label: 'Baixa resolução', filter: { qualityFlag: 'low_res' } },
    ],
  },
  momentary: {
    title: 'Fotos momentâneas',
    icon: 'pi pi-bolt',
    intro: 'Registros rápidos que costumam perder a utilidade: fotos de documentos e recibos, e fotos provavelmente tiradas sem querer (muito escuras ou tremidas).',
    empty: 'Nenhuma foto momentânea encontrada.',
    options: [
      { label: 'Todas', filter: { momentary: 'any' } },
      { label: 'Documentos', filter: { momentary: 'document' } },
      { label: 'Acidentais', filter: { momentary: 'accidental' } },
    ],
  },
  screenshots: {
    title: 'Screenshots',
    icon: 'pi pi-mobile',
    intro: 'Capturas de tela identificadas pelo nome, pela pasta ou pelo tamanho de tela, em imagens sem dados de câmera.',
    empty: 'Nenhuma captura de tela encontrada.',
    options: [{ label: 'Todas', filter: { screenshot: true } }],
  },
};

/** Organize pages that are a filtered gallery. Route data: `{ mode }`. */
@Component({
  selector: 'app-filtered-page',
  imports: [FormsModule, SelectButtonModule, EmptyStateComponent, GalleryControlsComponent, JobStatusComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 text-xl font-semibold"><i [class]="config().icon" class="text-muted"></i>{{ config().title }}</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        <app-gallery-controls [(sort)]="sort" />
      </div>
      @if (config().options.length > 1) {
        <p-selectbutton class="mt-3 block" [options]="options()" optionLabel="label" optionValue="index" [ngModel]="option()" (ngModelChange)="option.set($event)" [allowEmpty]="false" size="small" ariaLabel="Filtro" />
      }
      <p class="mt-2 max-w-3xl text-xs text-muted">{{ config().intro }}</p>
    </header>
    <section class="p-6">
      @if (gallery.loaded() && !gallery.items().length) {
        <app-empty-state [icon]="config().icon" [title]="config().empty" [text]="pendingText()" />
      }
      <app-media-grid
        [label]="config().title"
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
export class FilteredPage {
  readonly mode = input.required<FilteredMode>();

  protected readonly gallery = inject(GalleryStore);
  private readonly organize = inject(OrganizeStore);
  private readonly viewer = inject(ViewerContext);

  protected readonly config = computed(() => MODES[this.mode()]);
  protected readonly options = computed(() => this.config().options.map((o, index) => ({ label: o.label, index })));
  protected readonly option = signal(0);
  protected readonly sort = signal<MediaSort | undefined>('newest');

  protected readonly subtitle = computed(() => {
    const n = this.gallery.count()?.total;
    return n === undefined ? '' : `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  });
  protected readonly pendingText = computed(() => {
    const pending = this.organize.counts()?.pending;
    return pending ? `A análise ainda está em andamento (${formatCount(pending)} itens na fila).` : 'Nada para revisar aqui por enquanto.';
  });

  constructor() {
    effect(() => {
      const option = this.config().options[this.option()] ?? this.config().options[0];
      this.gallery.fixed.set(option.filter);
    });
    effect(() => this.gallery.userQuery.set({ sort: this.sort() ?? 'newest' }));
    // Recomputed flags/labels change the list.
    effect(() => {
      if (this.organize.version()) void this.gallery.refresh();
    });
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }
}
