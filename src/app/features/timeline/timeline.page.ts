import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type MediaItem, type MediaPage } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaStore } from '../../core/stores/media.store';
import { ScanStore } from '../../core/stores/scan.store';
import { UiStore } from '../../core/stores/ui.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MediaTileComponent } from '../../shared/media-tile.component';

/** Temporary cap until the paginated timeline (phase 3). */
const MAX_ITEMS = 5000;
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthGroup {
  key: string;
  year: number;
  title: string;
  items: MediaItem[];
}

@Component({
  selector: 'app-timeline-page',
  imports: [ButtonModule, SkeletonModule, EmptyStateComponent, MediaTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <h1 class="text-xl font-semibold">Timeline</h1>
      @if (years().length) {
        <div class="mt-3 flex flex-wrap gap-2" role="navigation" aria-label="Anos">
          @for (year of years(); track year) {
            <p-button [label]="year.toString()" size="small" severity="secondary" [outlined]="true" (onClick)="jump(year)" />
          }
        </div>
      }
    </header>

    <section class="space-y-8 p-6">
      @if (loading()) {
        <div class="grid gap-2" [style.grid-template-columns]="columns()">
          @for (i of skeletons; track i) {
            <p-skeleton styleClass="!aspect-square !h-auto !rounded-lg" />
          }
        </div>
      } @else if (!groups().length) {
        <app-empty-state icon="pi pi-calendar" title="Nada na timeline ainda" text="Escaneie a biblioteca para ver suas fotos organizadas por data." />
      }

      @for (group of groups(); track group.key) {
        <div [id]="'year-' + group.year" class="scroll-mt-28">
          <h2 class="mb-3 flex items-baseline gap-2 text-base font-semibold">
            {{ group.title }}
            <span class="text-xs font-normal text-muted">{{ count(group.items.length) }}</span>
          </h2>
          <div class="grid gap-2" [style.grid-template-columns]="columns()">
            @for (item of group.items; track item.id) {
              <app-media-tile
                [item]="item"
                [selected]="item.id === media.selectedId()"
                (select)="select($event)"
                (open)="open($event)"
              />
            }
          </div>
        </div>
      }

      @if (truncated()) {
        <p class="text-center text-xs text-muted">Mostrando as {{ count(maxItems) }} mais recentes. A timeline completa chega na Fase 3.</p>
      }
    </section>
  `,
})
export class TimelinePage {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly scan = inject(ScanStore);
  private readonly ui = inject(UiStore);
  private readonly router = inject(Router);
  protected readonly media = inject(MediaStore);

  protected readonly maxItems = MAX_ITEMS;
  protected readonly skeletons = Array.from({ length: 12 }, (_, i) => i);
  protected readonly items = signal<MediaItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly truncated = signal(false);
  protected readonly columns = computed(() => `repeat(auto-fill, minmax(${this.ui.tileSize()}px, 1fr))`);

  protected readonly groups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    for (const item of this.items()) {
      const date = item.capturedAt ? new Date(item.capturedAt) : null;
      const valid = date && !Number.isNaN(date.getTime());
      const key = valid ? `${date.getFullYear()}-${date.getMonth()}` : 'none';
      let group = groups.get(key);
      if (!group) {
        group = valid
          ? { key, year: date.getFullYear(), title: `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`, items: [] }
          : { key, year: 0, title: 'Sem data', items: [] };
        groups.set(key, group);
      }
      group.items.push(item);
    }
    // Items arrive newest-first, so Map insertion order is already chronological (desc).
    return [...groups.values()];
  });

  protected readonly years = computed(() => [...new Set(this.groups().map((g) => g.year).filter(Boolean))]);

  constructor() {
    effect(() => {
      const id = this.libraries.activeId();
      this.scan.lastSummary();
      untracked(() => void this.load(id));
    });
  }

  private async load(libraryId: string | null) {
    this.loading.set(true);
    const all: MediaItem[] = [];
    let cursor: string | null = null;
    try {
      while (libraryId && all.length < MAX_ITEMS) {
        const page: MediaPage = await unwrap(this.backend.commands.listMedia(libraryId, cursor, 500));
        all.push(...page.items);
        cursor = page.nextCursor;
        if (!cursor) break;
      }
      this.truncated.set(cursor !== null);
      this.items.set(all.slice(0, MAX_ITEMS));
    } catch (e) {
      this.notify.error('Não foi possível carregar a timeline', e);
    } finally {
      this.loading.set(false);
    }
  }

  protected count(n: number) {
    return `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  }

  protected jump(year: number) {
    document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: 'smooth' });
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
