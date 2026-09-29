import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import type { MediaItem } from '../../core/ipc/ipc';
import { GalleryStore } from '../../core/stores/gallery.store';
import { MediaActions } from '../../core/stores/media-actions.service';
import { SelectionStore } from '../../core/stores/selection.store';
import { UiStore } from '../../core/stores/ui.store';
import { MediaTileComponent } from '../media-tile.component';
import { GAP, type GridRow, type GroupBy, layoutGrid, visibleRange } from './grid-layout';

/** Rows rendered beyond the viewport, in viewport heights. */
const OVERSCAN = 1;
/** Ask for the next page this many viewports before the end. */
const PREFETCH = 2;

/**
 * Virtualized gallery grid (PRD §26: 60 fps with 50k items). Rows have known
 * heights (see `layoutGrid`), so only the visible ones are in the DOM. Scrolls with
 * the shell's `#main`, so content above it (headers, hero) is fine.
 */
@Component({
  selector: 'app-media-grid',
  imports: [SkeletonModule, MediaTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block',
    role: 'listbox',
    'aria-multiselectable': 'true',
    '[attr.aria-label]': 'label()',
    '[style.height.px]': 'hostHeight()',
    '(keydown)': 'onKey($event)',
  },
  template: `
    @for (row of visibleRows(); track row.key) {
      @switch (row.kind) {
        @case ('month') {
          <h2
            class="absolute inset-x-0 flex items-end gap-2 pb-2 text-base font-semibold"
            [style.top.px]="row.top"
            [style.height.px]="row.height"
            [attr.data-anchor]="row.anchor"
          >
            {{ row.label }}
            <span class="text-xs font-normal text-muted">{{ countLabel(row.count) }}</span>
          </h2>
        }
        @case ('day') {
          <h3 class="absolute inset-x-0 flex items-center gap-2 text-[13px] font-medium text-muted" [style.top.px]="row.top" [style.height.px]="row.height">
            {{ row.label }}
            @if (row.count !== undefined) {
              <span class="text-[11px] font-normal">· {{ row.count }}</span>
            }
          </h3>
        }
        @default {
          <div
            class="absolute inset-x-0 grid"
            [style.top.px]="row.top"
            [style.gap.px]="gap"
            [style.grid-template-columns]="'repeat(' + layout().columns + ', minmax(0, 1fr))'"
          >
            @for (item of row.items; track item.id) {
              <app-media-tile
                [item]="item"
                [focused]="item.id === selection.focusedId()"
                [checked]="selection.ids().has(item.id)"
                [selecting]="selection.active()"
                [badge]="badges()?.get(item.id) ?? null"
                (select)="onSelect(item, $event)"
                (open)="open.emit(item)"
                (check)="selection.toggle(item.id)"
                (favorite)="actions.setFavorite([item.id], !item.isFavorite)"
              />
            }
          </div>
        }
      }
    }

    @if (loading()) {
      <div class="absolute inset-x-0 grid" [style.top.px]="height() + (items().length ? gap : 0)" [style.gap.px]="gap" [style.grid-template-columns]="'repeat(' + layout().columns + ', minmax(0, 1fr))'">
        @for (i of skeletons(); track i) {
          <p-skeleton styleClass="!aspect-square !h-auto !rounded-lg" />
        }
      </div>
    }
  `,
})
export class MediaGridComponent {
  readonly items = input.required<readonly MediaItem[]>();
  readonly groupBy = input<GroupBy>('none');
  /** Month totals from the backend ("2025-07" → n) for timeline headers. */
  readonly monthCounts = input<ReadonlyMap<string, number>>();
  readonly loading = input(false);
  readonly hasMore = input(false);
  readonly label = input('Fotos');
  /** Optional text per item id, shown over its tile. */
  readonly badges = input<ReadonlyMap<string, string>>();

  readonly loadMore = output<void>();
  readonly open = output<MediaItem>();

  protected readonly selection = inject(SelectionStore);
  protected readonly actions = inject(MediaActions);
  private readonly ui = inject(UiStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  /** The page's gallery, for scroll save/restore (absent in tests). */
  private readonly gallery = inject(GalleryStore, { optional: true });

  protected readonly gap = GAP;
  private readonly width = signal(0);
  /** Visible window in grid coordinates. */
  private readonly viewport = signal({ top: 0, height: 800 });
  private scroller: HTMLElement | null = null;

  protected readonly layout = computed(() =>
    layoutGrid(this.items(), this.width() || 800, this.ui.tileSize(), this.groupBy(), this.monthCounts(), this.hasMore()),
  );
  protected readonly height = computed(() => this.layout().height);
  /** Includes the skeleton rows while a page loads. */
  protected readonly hostHeight = computed(() => {
    if (!this.loading()) return this.height();
    const rows = this.items().length ? 1 : 3;
    const { tile } = this.layout();
    return this.height() + (this.items().length ? GAP : 0) + rows * (tile + GAP) - GAP;
  });
  protected readonly visibleRows = computed<GridRow[]>(() => {
    const { rows } = this.layout();
    const { top, height } = this.viewport();
    const [from, to] = visibleRange(rows, top - OVERSCAN * height, top + (1 + OVERSCAN) * height);
    return rows.slice(from, to);
  });
  protected readonly skeletons = computed(() => {
    const n = this.items().length ? this.layout().columns : this.layout().columns * 3;
    return Array.from({ length: n }, (_, i) => i);
  });

  constructor() {
    afterNextRender(() => {
      const el = this.host.nativeElement;
      this.scroller = el.closest<HTMLElement>('#main') ?? document.documentElement;
      const measure = () => this.measure();
      const resize = new ResizeObserver(() => {
        this.width.set(el.clientWidth);
        measure();
      });
      resize.observe(el);
      resize.observe(this.scroller);
      let frame = 0;
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
      };
      this.scroller.addEventListener('scroll', onScroll, { passive: true });
      this.width.set(el.clientWidth);
      measure();
      // Coming back from the viewer: put the list where it was.
      const restore = this.gallery?.pendingScroll;
      if (restore && this.gallery) {
        this.gallery.pendingScroll = null;
        requestAnimationFrame(() => this.scroller?.scrollTo({ top: restore }));
      }
      this.destroyRef.onDestroy(() => {
        resize.disconnect();
        cancelAnimationFrame(frame);
        this.scroller?.removeEventListener('scroll', onScroll);
      });
    });

    // Infinite scroll: request more when the end is near (also when the first page is
    // too short to fill the screen).
    effect(() => {
      const { top, height } = this.viewport();
      const total = this.height();
      if (this.hasMore() && !this.loading() && top + (1 + PREFETCH) * height >= total) {
        untracked(() => this.loadMore.emit());
      }
    });
  }

  private measure() {
    const scroller = this.scroller;
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const top = Math.max(0, scrollerRect.top - hostRect.top);
    const height = scroller.clientHeight || window.innerHeight;
    if (this.gallery) this.gallery.scrollTop = scroller.scrollTop;
    const current = this.viewport();
    if (current.top !== top || current.height !== height) this.viewport.set({ top, height });
  }

  /** Scroll so the row with `anchor` (timeline month "YYYY-MM") is at the top. */
  scrollToAnchor(prefix: string): boolean {
    const row = this.layout().rows.find((r) => r.anchor?.startsWith(prefix));
    if (!row || !this.scroller) return false;
    const hostTop = this.host.nativeElement.getBoundingClientRect().top - this.scroller.getBoundingClientRect().top;
    // Leave room for the page's sticky header.
    const header = this.scroller.querySelector<HTMLElement>('[data-sticky-header]')?.offsetHeight ?? 0;
    this.scroller.scrollTo({ top: this.scroller.scrollTop + hostTop + row.top - header - 8 });
    return true;
  }

  protected onSelect(item: MediaItem, event: MouseEvent) {
    if (event.shiftKey) {
      this.selection.extendTo(item.id, this.items());
    } else if (event.ctrlKey || event.metaKey || this.selection.active()) {
      this.selection.toggle(item.id);
    } else {
      this.selection.focus(item);
      this.ui.infoPanelOpen.set(true);
    }
  }

  protected onKey(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.selection.selectAll(this.items());
    }
  }

  protected countLabel(n: number | undefined) {
    return n === undefined ? '' : `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  }
}
