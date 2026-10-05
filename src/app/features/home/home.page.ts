import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { previewUrl, itemThumbnailUrl, unwrap, type LibraryOverview, type MediaFilter, type MediaItem, type MediaSort } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { BrowseStore } from '../../core/stores/browse.store';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaBus } from '../../core/stores/media-bus';
import { ScanStore } from '../../core/stores/scan.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { EventCardComponent } from '../../shared/event-card.component';
import { EventStore } from '../../core/stores/event.store';
import { GalleryControlsComponent } from '../../shared/gallery-controls.component';
import { JobStatusComponent } from '../../shared/job-status.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

/** Recent photos shown on the home page (the rest is in "Todas as fotos"). */
const RECENT = 60;
const TRIPS = 4;

interface Stat {
  label: string;
  value: number;
  icon: string;
  tone: string;
  link: string;
  /** Filter applied to "Todas as fotos" before opening it. */
  filter?: MediaFilter;
}

/** Início (PRD §23.2): hero, stats, years and recent photos. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ButtonModule, SkeletonModule, EmptyStateComponent, EventCardComponent, GalleryControlsComponent, JobStatusComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-8 p-6">
      <section class="relative flex min-h-56 overflow-hidden rounded-2xl bg-slate-900 text-white">
        @if (hero(); as h) {
          <img [src]="heroSrc()" alt="" class="absolute inset-0 size-full object-cover opacity-80" />
          <button type="button" class="absolute inset-0" [attr.aria-label]="'Abrir ' + h.filename" (click)="openHero(h)"></button>
        }
        <div class="pointer-events-none relative mt-auto w-full bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 pt-20">
          <h1 class="text-2xl font-semibold sm:text-3xl">Bem-vindo ao PhotoVault</h1>
          <p class="mt-1 text-sm text-white/80">{{ heroText() }}</p>
        </div>
        <div class="absolute right-4 top-4"><app-job-status /></div>
      </section>

      <section class="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Resumo">
        @for (stat of stats(); track stat.label) {
          <a [routerLink]="stat.link" (click)="applyFilter(stat)" class="flex items-center gap-4 rounded-card border border-line bg-panel p-4 transition-shadow hover:shadow-md">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl" [class]="stat.tone"><i [class]="stat.icon" class="text-lg"></i></span>
            <span class="min-w-0">
              <span class="block text-2xl font-semibold tabular-nums">{{ format(stat.value) }}</span>
              <span class="text-sm text-muted">{{ stat.label }}</span>
            </span>
          </a>
        } @empty {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <p-skeleton height="5rem" styleClass="!rounded-card" />
          }
        }
      </section>

      @if (trips().length) {
        <section aria-label="Viagens">
          <div class="mb-3 flex items-center gap-3">
            <h2 class="flex-1 text-base font-semibold">Viagens</h2>
            <p-button label="Ver todas" icon="pi pi-arrow-right" iconPos="right" [text]="true" routerLink="/trips" />
          </div>
          <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
            @for (t of trips(); track t.id) {
              <app-event-card [event]="t" />
            }
          </div>
        </section>
      }

      @if (overview()?.years?.length) {
        <section aria-label="Anos">
          <h2 class="mb-3 text-base font-semibold">Anos</h2>
          <ul class="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
            @for (y of overview()!.years; track y.year) {
              <li class="w-44 shrink-0 snap-start">
                <a [routerLink]="'/timeline'" [queryParams]="{ year: y.year }" class="group block">
                  <div class="aspect-[4/3] overflow-hidden rounded-xl bg-panel-2">
                    @if (y.cover; as c) {
                      <img [src]="thumb(c)" alt="" loading="lazy" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    }
                  </div>
                  <p class="mt-1.5 text-sm"><span class="font-semibold">{{ y.year }}</span><span class="text-muted"> · {{ format(y.count) }} {{ y.count === 1 ? 'item' : 'itens' }}</span></p>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      <section aria-label="Fotos recentes">
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <h2 class="flex-1 text-base font-semibold">Fotos recentes</h2>
          <app-gallery-controls [(sort)]="sort" />
          <p-button label="Ver todas" icon="pi pi-arrow-right" iconPos="right" [text]="true" routerLink="/photos" />
        </div>
        @if (gallery.loaded() && !gallery.items().length) {
          <app-empty-state icon="pi pi-images" title="Nenhuma foto indexada ainda" text="Escaneie a biblioteca para ver suas fotos aqui.">
            <p-button label="Ir para Todas as fotos" icon="pi pi-images" routerLink="/photos" />
          </app-empty-state>
        }
        <app-media-grid label="Fotos recentes" [items]="recent()" [loading]="gallery.loading()" (open)="open($event)" />
      </section>
    </div>
    <app-selection-bar [items]="recent()" />
  `,
})
export class HomePage {
  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly viewer = inject(ViewerContext);
  private readonly browse = inject(BrowseStore);
  private reloadTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly overview = signal<LibraryOverview | null>(null);
  protected readonly sort = signal<MediaSort | undefined>('newest');
  protected readonly recent = computed(() => this.gallery.items().slice(0, RECENT));
  private readonly events = inject(EventStore);
  /** Latest trips (accepted or suggested). */
  protected readonly trips = computed(() => this.events.events().filter((e) => e.kind === 'trip').slice(0, TRIPS));
  protected readonly hero = computed(() => this.overview()?.highlight ?? null);
  protected readonly heroSrc = computed(() => {
    const h = this.hero();
    return h ? previewUrl(h.id, h.thumbVersion) : '';
  });

  protected readonly heroText = computed(() => {
    const lib = this.libraries.active();
    const o = this.overview();
    if (!lib) return 'Sua biblioteca de fotos, organizada e privada.';
    if (!o) return lib.name;
    const years = o.years.length > 1 ? ` · ${o.years.at(-1)!.year}–${o.years[0].year}` : '';
    return `${lib.name} · ${formatCount(o.photos + o.videos)} itens${years}. Tudo fica no seu computador.`;
  });

  protected readonly stats = computed<Stat[]>(() => {
    const o = this.overview();
    if (!o) return [];
    return [
      { label: 'Fotos', value: o.photos, icon: 'pi pi-image', tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', link: '/photos', filter: { mediaType: 'image' } },
      { label: 'Vídeos', value: o.videos, icon: 'pi pi-video', tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', link: '/photos', filter: { mediaType: 'video' } },
      { label: 'Viagens', value: o.trips, icon: 'pi pi-send', tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', link: '/trips' },
      { label: 'Favoritos', value: o.favorites, icon: 'pi pi-heart', tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', link: '/favorites' },
      { label: 'Álbuns', value: o.albums, icon: 'pi pi-book', tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', link: '/albums' },
    ];
  });

  constructor() {
    effect(() => this.gallery.userQuery.set({ sort: this.sort() ?? 'newest' }));
    const scan = inject(ScanStore);
    const bus = inject(MediaBus);
    effect(() => {
      const id = this.libraries.activeId();
      scan.lastSummary();
      untracked(() => void this.load(id));
    });
    // Favorites and analysis change counters and covers; the hero keeps its photo.
    // Debounced: during analysis the bus fires every ~500 ms.
    bus.subscribe(() => {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = setTimeout(() => void this.load(this.libraries.activeId(), true), 3000);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.reloadTimer));
  }

  private async load(libraryId: string | null, keepHero = false) {
    if (!libraryId || !isTauri()) return;
    try {
      const fresh = await unwrap(this.backend.commands.getOverview(libraryId));
      const hero = this.overview()?.highlight;
      this.overview.set(keepHero && hero ? { ...fresh, highlight: hero } : fresh);
    } catch (e) {
      this.notify.error('Não foi possível carregar o resumo', e);
    }
  }

  protected format(n: number) {
    return formatCount(n);
  }

  protected thumb(item: MediaItem) {
    return itemThumbnailUrl(item);
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }

  protected openHero(item: MediaItem) {
    this.viewer.open(item, { filter: {}, sort: 'newest' });
  }

  protected applyFilter(stat: Stat) {
    if (stat.filter) {
      this.browse.clear();
      this.browse.patch(stat.filter);
    }
  }
}
