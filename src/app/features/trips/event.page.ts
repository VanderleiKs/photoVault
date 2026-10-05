import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount, formatDayShort, formatPeriod } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { previewUrl, itemThumbnailUrl, unwrap, type EventDay, type EventSummary, type MediaFilter, type MediaItem } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { AlbumStore } from '../../core/stores/album.store';
import { EventStore } from '../../core/stores/event.store';
import { GalleryStore } from '../../core/stores/gallery.store';
import { OrganizeStore } from '../../core/stores/organize.store';
import { SelectionStore } from '../../core/stores/selection.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { eventCounts } from '../../shared/event-card.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

type Tab = 'photos' | 'days' | 'info';
const HIGHLIGHTS = 12;

/** A trip or event (PRD §23.4, dark): header, highlights, day cards, photos. Route: /trips/:id */
@Component({
  selector: 'app-event-page',
  imports: [FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SkeletonModule, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#0b0f17] text-slate-100' },
  template: `
    @if (event(); as e) {
      <header data-sticky-header class="sticky top-0 z-10 border-b border-white/5 bg-[#0b0f17]/95 px-6 pb-0 pt-4 backdrop-blur">
        <a routerLink="/trips" class="text-xs text-slate-400 hover:text-white"><i class="pi pi-arrow-left mr-1 text-[10px]"></i>Viagens e eventos</a>
        <div class="mt-1 flex flex-wrap items-start gap-4">
          <div class="min-w-0 flex-1">
            @if (editingTitle()) {
              <form class="flex items-center gap-2" (ngSubmit)="saveTitle()">
                <input pInputText name="title" class="min-w-0 flex-1 !text-lg" maxlength="120" aria-label="Título" [(ngModel)]="titleDraft" [ngModelOptions]="{ standalone: true }" (keydown.escape)="editingTitle.set(false)" />
                <p-button type="submit" icon="pi pi-check" [rounded]="true" size="small" ariaLabel="Salvar título" />
                <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="contrast" size="small" ariaLabel="Cancelar" (onClick)="editingTitle.set(false)" />
              </form>
            } @else {
              <h1 class="flex items-center gap-2 text-2xl font-semibold text-white">
                <span class="truncate">{{ e.title }}</span>
                <button type="button" class="text-sm text-slate-400 hover:text-white" aria-label="Editar título" (click)="startTitle(e)"><i class="pi pi-pencil"></i></button>
              </h1>
            }
            <p class="mt-1 text-sm text-slate-400">
              {{ period() }} · {{ counts() }}
              @if (e.placeSummary) {
                · {{ e.placeSummary }}
              }
              @if (e.distanceKm) {
                · a {{ formatCount(e.distanceKm) }} km de casa
              }
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            @if (e.status === 'suggested') {
              <p-button label="Aceitar" icon="pi pi-check" size="small" (onClick)="store.accept(e.id)" />
            }
            <p-button
              [label]="e.kind === 'trip' ? 'É um evento' : 'É uma viagem'"
              icon="pi pi-arrow-right-arrow-left"
              size="small"
              severity="contrast"
              [outlined]="true"
              [title]="e.kind === 'trip' ? 'Classificar como evento, e não como viagem' : 'Classificar como viagem, e não como evento'"
              (onClick)="toggleKind(e)"
            />
            <p-button label="Editar período" icon="pi pi-calendar" size="small" severity="contrast" [outlined]="true" (onClick)="openDates(e)" />
            <p-button label="Criar álbum" icon="pi pi-book" size="small" severity="contrast" [outlined]="true" (onClick)="createAlbum(e)" />
            <p-button label="Ignorar" icon="pi pi-times" size="small" severity="contrast" [text]="true" (onClick)="ignore(e)" />
          </div>
        </div>
        @if (e.status === 'suggested') {
          <p class="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Sugestão encontrada pelas datas e locais das fotos. Aceite para guardar, ou ignore para não ver de novo.</p>
        }
        <nav class="mt-3 flex gap-1" role="tablist" aria-label="Seções do evento">
          @for (t of tabs; track t.value) {
            <button
              type="button"
              role="tab"
              class="border-b-2 px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              [class]="tab() === t.value ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'"
              [attr.aria-selected]="tab() === t.value"
              [disabled]="!t.value"
              [title]="t.value ? '' : 'Em breve'"
              (click)="t.value && tab.set(t.value)"
            >
              {{ t.label }}
            </button>
          }
        </nav>
      </header>

      @switch (tab()) {
        @case ('photos') {
          <section class="space-y-6 p-6">
            @if (highlights().length) {
              <ul class="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2" aria-label="Destaques">
                @for (h of highlights(); track h.id) {
                  <li class="w-72 shrink-0 snap-start">
                    <button type="button" class="block aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5" [attr.aria-label]="'Abrir ' + h.filename" (click)="open(h)">
                      <img [src]="preview(h)" alt="" loading="lazy" class="size-full object-cover transition-transform duration-300 hover:scale-105" />
                    </button>
                  </li>
                }
              </ul>
            }

            @if (days().length > 1) {
              <ul class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1" aria-label="Dias">
                <li class="shrink-0">
                  <button type="button" class="flex h-full min-w-28 flex-col justify-center rounded-xl border px-4 py-3 text-left" [class]="dayClass(null)" (click)="selectDay(null)">
                    <span class="text-sm font-semibold">Todos os dias</span>
                    <span class="text-xs text-slate-400">{{ days().length }} dias</span>
                  </button>
                </li>
                @for (d of days(); track d.date) {
                  <li class="shrink-0">
                    <button type="button" class="flex w-56 items-center gap-3 rounded-xl border p-2 text-left" [class]="dayClass(d.date)" (click)="selectDay(d.date)">
                      @if (d.cover; as c) {
                        <img [src]="thumb(c)" alt="" class="size-14 shrink-0 rounded-lg object-cover" />
                      }
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold">{{ dayShort(d.date) }}</span>
                        <span class="block truncate text-xs text-slate-400">{{ d.place ?? 'Sem local' }} · {{ formatCount(d.count) }} {{ d.count === 1 ? 'foto' : 'fotos' }}</span>
                      </span>
                    </button>
                  </li>
                }
              </ul>
            }

            <app-media-grid
              [label]="e.title"
              [items]="gallery.items()"
              [loading]="gallery.loading()"
              [hasMore]="gallery.hasMore()"
              (loadMore)="gallery.loadMore()"
              (open)="open($event)"
            />
          </section>
        }
        @case ('days') {
          <section class="space-y-4 p-6">
            @for (d of days(); track d.date; let i = $index) {
              <article class="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span class="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <span class="text-[10px] font-medium">DIA</span><span class="text-lg font-semibold leading-none">{{ i + 1 }}</span>
                </span>
                @if (d.cover; as c) {
                  <img [src]="thumb(c)" alt="" class="size-14 shrink-0 rounded-lg object-cover" />
                }
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-white">{{ dayShort(d.date) }} · {{ d.place ?? 'Sem local' }}</p>
                  <p class="text-xs text-slate-400">{{ formatCount(d.count) }} {{ d.count === 1 ? 'foto' : 'fotos' }}</p>
                </div>
                <p-button label="Ver fotos do dia" icon="pi pi-images" size="small" severity="contrast" [text]="true" (onClick)="selectDay(d.date); tab.set('photos')" />
              </article>
            }
          </section>
        }
        @case ('info') {
          <section class="p-6">
            <dl class="grid max-w-2xl grid-cols-[10rem_1fr] gap-x-4 gap-y-3 text-sm">
              <dt class="text-slate-400">Tipo</dt><dd>{{ e.kind === 'trip' ? 'Viagem' : 'Evento' }}</dd>
              <dt class="text-slate-400">Período</dt><dd>{{ period() }} ({{ days().length }} {{ days().length === 1 ? 'dia' : 'dias' }})</dd>
              <dt class="text-slate-400">Itens</dt><dd>{{ counts() }}</dd>
              <dt class="text-slate-400">Lugares</dt><dd>{{ e.placeSummary ?? 'Sem localização nas fotos' }}</dd>
              @if (e.distanceKm) {
                <dt class="text-slate-400">Distância de casa</dt><dd>{{ formatCount(e.distanceKm) }} km</dd>
              }
              <dt class="text-slate-400">Situação</dt><dd>{{ statusText(e) }}</dd>
            </dl>
          </section>
        }
      }
      <app-selection-bar [items]="gallery.items()">
        <p-button icon="pi pi-minus-circle" label="Remover do evento" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="removeSelected(e)" />
      </app-selection-bar>

      <p-dialog header="Editar período" [visible]="datesOpen()" (visibleChange)="datesOpen.set($event)" [modal]="true" [draggable]="false" styleClass="w-[26rem] max-w-[95vw]">
        <p class="mb-4 text-sm text-muted">As fotos desses dias passam a formar o evento (as que já estão em outra viagem aceita ficam onde estão).</p>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-sm">De<input pInputText type="date" [(ngModel)]="startDraft" [ngModelOptions]="{ standalone: true }" /></label>
          <label class="flex flex-col gap-1 text-sm">Até<input pInputText type="date" [(ngModel)]="endDraft" [ngModelOptions]="{ standalone: true }" /></label>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="datesOpen.set(false)" />
          <p-button label="Salvar" [disabled]="!startDraft() || !endDraft() || startDraft() > endDraft()" (onClick)="saveDates(e)" />
        </div>
      </p-dialog>
    } @else if (missing()) {
      <div class="p-10 text-center text-slate-400">
        <p>Este evento não existe mais (a sugestão pode ter mudado com novas fotos).</p>
        <p-button class="mt-4 inline-block" label="Voltar para Viagens" routerLink="/trips" [text]="true" />
      </div>
    } @else {
      <div class="space-y-4 p-6"><p-skeleton height="3rem" /><p-skeleton height="12rem" /></div>
    }
  `,
})
export class EventPage {
  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly store = inject(EventStore);
  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly organize = inject(OrganizeStore);
  private readonly viewer = inject(ViewerContext);
  private readonly selection = inject(SelectionStore);
  private readonly albums = inject(AlbumStore);
  private readonly router = inject(Router);

  protected readonly tabs: { label: string; value: Tab | null }[] = [
    { label: 'Fotos', value: 'photos' },
    { label: 'Linha do tempo', value: 'days' },
    { label: 'Informações', value: 'info' },
    { label: 'Mapa', value: null },
    { label: 'Pessoas', value: null },
  ];
  protected readonly tab = signal<Tab>('photos');
  protected readonly event = signal<EventSummary | null>(null);
  protected readonly missing = signal(false);
  protected readonly days = signal<EventDay[]>([]);
  protected readonly highlights = signal<MediaItem[]>([]);
  protected readonly day = signal<string | null>(null);
  protected readonly editingTitle = signal(false);
  protected readonly titleDraft = signal('');
  protected readonly datesOpen = signal(false);
  protected readonly startDraft = signal('');
  protected readonly endDraft = signal('');
  protected readonly formatCount = formatCount;

  protected readonly period = computed(() => {
    const e = this.event();
    return e ? formatPeriod(e.startedAt, e.endedAt) : '';
  });
  protected readonly counts = computed(() => {
    const e = this.event();
    return e ? eventCounts(e) : '';
  });

  constructor() {
    effect(() => {
      const id = this.id();
      const day = this.day();
      const filter: MediaFilter = { eventId: id };
      if (day) {
        const [year, month, d] = day.split('-').map(Number);
        Object.assign(filter, { year, month, day: d });
      }
      this.gallery.fixed.set(filter);
    });
    this.gallery.userQuery.set({ sort: 'oldest' });
    effect(() => {
      const id = this.id();
      this.organize.version();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string) {
    if (!isTauri()) return;
    try {
      const [event, days, highlights] = await Promise.all([
        unwrap(this.backend.commands.getEvent(id)),
        unwrap(this.backend.commands.getEventDays(id)),
        unwrap(this.backend.commands.getEventHighlights(id, HIGHLIGHTS)),
      ]);
      if (id !== this.id()) return;
      this.event.set(event);
      this.days.set(days);
      this.highlights.set(highlights);
      this.missing.set(false);
      void this.gallery.refresh();
    } catch {
      this.event.set(null);
      this.missing.set(true);
    }
  }

  protected selectDay(date: string | null) {
    this.day.set(date);
  }

  protected dayClass(date: string | null) {
    return this.day() === date ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]';
  }

  protected dayShort(date: string) {
    return formatDayShort(date);
  }

  protected thumb(item: MediaItem) {
    return itemThumbnailUrl(item);
  }

  protected preview(item: MediaItem) {
    return previewUrl(item.id, item.thumbVersion);
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, { filter: { eventId: this.id() }, sort: 'oldest' });
  }

  protected startTitle(e: EventSummary) {
    this.titleDraft.set(e.title);
    this.editingTitle.set(true);
  }

  protected async saveTitle() {
    const updated = await this.store.update(this.id(), { title: this.titleDraft() });
    if (updated) {
      this.event.set(updated);
      this.editingTitle.set(false);
    }
  }

  protected async toggleKind(e: EventSummary) {
    const kind = e.kind === 'trip' ? 'event' : 'trip';
    const updated = await this.store.update(e.id, { kind });
    if (updated) {
      this.event.set(updated);
      this.notify.success(kind === 'trip' ? 'Agora é uma viagem' : 'Agora é um evento', 'O app não vai mais alterar esta classificação.');
    }
  }

  protected openDates(e: EventSummary) {
    this.startDraft.set(e.startedAt.slice(0, 10));
    this.endDraft.set(e.endedAt.slice(0, 10));
    this.datesOpen.set(true);
  }

  protected async saveDates(e: EventSummary) {
    const updated = await this.store.update(e.id, { startDate: this.startDraft(), endDate: this.endDraft() });
    if (updated) {
      this.datesOpen.set(false);
      this.day.set(null);
      this.notify.success('Período atualizado', `${eventCounts(updated)} no evento.`);
    }
  }

  protected async ignore(e: EventSummary) {
    if (await this.store.ignore(e.id)) void this.router.navigate(['/trips']);
  }

  protected async createAlbum(e: EventSummary) {
    try {
      const album = await this.albums.create(e.title, { eventId: e.id });
      void this.router.navigate(['/albums', album.id]);
    } catch (err) {
      this.notify.error('Não foi possível criar o álbum', err);
    }
  }

  protected async removeSelected(e: EventSummary) {
    const ids = [...this.selection.ids()];
    if (await this.store.removeMedia(e.id, ids)) this.selection.clear();
  }

  protected statusText(e: EventSummary) {
    switch (e.status) {
      case 'suggested':
        return 'Sugestão (ainda não aceita)';
      case 'accepted':
        return 'Aceita: fotos novas desses dias entram sozinhas';
      case 'edited':
        return 'Editada por você: o PhotoVault não altera mais';
      default:
        return 'Ignorada';
    }
  }
}
