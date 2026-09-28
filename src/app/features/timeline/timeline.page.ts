import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type MediaItem, type TimelineBucket } from '../../core/ipc/ipc';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { ScanStore } from '../../core/stores/scan.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

/** Pages this big while jumping to a year that isn't loaded yet. */
const JUMP_PAGE = 500;

/** Timeline: Year → Month → Day with a year scrubber (PRD §19). Route: /timeline?year= */
@Component({
  selector: 'app-timeline-page',
  imports: [EmptyStateComponent, GalleryControlsComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold">Timeline</h1>
        <p class="text-sm text-muted">{{ subtitle() }}</p>
      </div>
      <app-gallery-controls />
    </header>

    <div class="flex">
      <section class="min-w-0 flex-1 p-6 pr-3">
        @if (gallery.loaded() && !gallery.items().length) {
          <app-empty-state icon="pi pi-calendar" title="Nada na timeline ainda" text="Escaneie a biblioteca para ver suas fotos organizadas por data." />
        }
        <app-media-grid
          #grid
          groupBy="timeline"
          label="Timeline"
          [items]="gallery.items()"
          [monthCounts]="monthCounts()"
          [loading]="gallery.loading()"
          [hasMore]="gallery.hasMore()"
          (loadMore)="gallery.loadMore()"
          (open)="open($event)"
        />
      </section>

      @if (years().length > 1) {
        <nav class="sticky top-24 flex max-h-[calc(100vh-10rem)] w-16 shrink-0 flex-col items-end gap-0.5 self-start overflow-y-auto py-6 pr-4" aria-label="Anos">
          @for (y of years(); track y.year) {
            <button
              type="button"
              class="rounded px-1.5 py-0.5 text-xs tabular-nums text-muted hover:bg-panel-2 hover:text-ink"
              [class.font-semibold]="jumping() === y.year"
              [class.text-primary]="jumping() === y.year"
              [title]="count(y.count)"
              (click)="jump(y.year)"
            >
              {{ y.year }}
            </button>
          }
        </nav>
      }
    </div>
    <app-selection-bar [items]="gallery.items()" />
  `,
})
export class TimelinePage {
  /** `?year=2019` (from the home page's year cards). */
  readonly year = input<string>();

  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);
  private readonly viewer = inject(ViewerContext);
  private readonly grid = viewChild.required<MediaGridComponent>('grid');

  private readonly buckets = signal<TimelineBucket[]>([]);
  protected readonly jumping = signal<number | null>(null);

  protected readonly monthCounts = computed(
    () => new Map(this.buckets().map((b) => [b.year ? `${b.year}-${String(b.month).padStart(2, '0')}` : '', b.count])),
  );
  protected readonly years = computed(() => {
    const years = new Map<number, number>();
    for (const b of this.buckets()) if (b.year) years.set(b.year, (years.get(b.year) ?? 0) + b.count);
    return [...years].map(([year, count]) => ({ year, count }));
  });
  protected readonly subtitle = computed(() => {
    const n = this.gallery.count()?.total;
    const years = this.years();
    if (n === undefined) return '';
    const span = years.length > 1 ? ` · ${years.at(-1)!.year}–${years[0].year}` : '';
    return `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}${span}`;
  });

  constructor() {
    this.gallery.userQuery.set({ sort: 'newest' });
    const scan = inject(ScanStore);
    effect(() => {
      const id = this.libraries.activeId();
      scan.lastSummary();
      untracked(() => void this.loadBuckets(id));
    });
    // Deep link from the home page: jump once the first page is there.
    effect(() => {
      const year = Number(this.year());
      if (year && this.gallery.loaded()) untracked(() => void this.jump(year));
    });
  }

  private async loadBuckets(libraryId: string | null) {
    if (!libraryId || !isTauri()) return;
    this.buckets.set(await unwrap(this.backend.commands.getTimeline(libraryId, {})).catch(() => []));
  }

  /** Scroll to a year, loading pages until it is in the list. */
  protected async jump(year: number) {
    if (this.jumping() !== null && this.jumping() !== year) return;
    this.jumping.set(year);
    try {
      while (!this.grid().scrollToAnchor(String(year))) {
        if (!this.gallery.hasMore()) break;
        if (this.gallery.loading()) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        await this.gallery.loadMore(JUMP_PAGE);
        // Let the grid lay out the new rows.
        await new Promise((r) => requestAnimationFrame(r));
      }
    } finally {
      this.jumping.set(null);
    }
  }

  protected count(n: number) {
    return `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }
}
