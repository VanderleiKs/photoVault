import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount, formatPeriod } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type EventKind, type EventSummary, type Home } from '../../core/ipc/ipc';
import { EventStore } from '../../core/stores/event.store';
import { OrganizeStore } from '../../core/stores/organize.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { EventCardComponent } from '../../shared/event-card.component';
import { JobStatusComponent } from '../../shared/job-status.component';

type Show = 'all' | 'trip' | 'event';

/** "Viagens" (PRD §17): suggestions to accept or ignore, then trips and events. */
@Component({
  selector: 'app-trips-page',
  imports: [NgTemplateOutlet, FormsModule, DialogModule, InputTextModule, ButtonModule, SelectButtonModule, SkeletonModule, EmptyStateComponent, EventCardComponent, JobStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-send text-muted"></i>Viagens e eventos</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        @if (mergeable().length >= 2) {
          <p-button
            [label]="picking() ? 'Cancelar' : 'Juntar eventos'"
            [icon]="picking() ? 'pi pi-times' : 'pi pi-link'"
            size="small"
            [outlined]="!picking()"
            [text]="picking()"
            severity="secondary"
            title="Juntar vários eventos em um só (por exemplo, os dias de uma viagem sem GPS)"
            (onClick)="togglePicking()"
          />
        }
        <p-selectbutton [options]="shows" optionLabel="label" optionValue="value" [ngModel]="show()" (ngModelChange)="show.set($event)" [allowEmpty]="false" ariaLabel="Mostrar" />
      </div>
      <p class="mt-2 max-w-3xl text-xs text-muted">
        Encontrados pelas datas e pela localização das fotos: um intervalo de mais de 6 horas separa eventos, e uma viagem é quando você passa pelo menos um dia longe de casa
        (o lugar onde você mais fotografa). Aceite, edite ou ignore: o que for ignorado não volta a ser sugerido.
      </p>
      @if (picking()) {
        <p class="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">Escolha os eventos que fazem parte da mesma viagem ou evento. As fotos entre eles também entram.</p>
      }
    </header>

    <div class="space-y-8 p-6">
      @if (!store.loaded()) {
        <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
          @for (i of [1, 2, 3, 4]; track i) {
            <p-skeleton height="14rem" styleClass="!rounded-card" />
          }
        </div>
      } @else if (!store.events().length && !store.ignored().length) {
        <app-empty-state icon="pi pi-send" title="Nenhuma viagem ou evento ainda" [text]="emptyText()" />
      }

      @if (suggested().length) {
        <section aria-labelledby="sugestoes">
          <h2 id="sugestoes" class="mb-3 flex items-center gap-2 text-base font-semibold">
            Sugestões <span class="rounded-full bg-amber-500/15 px-2 text-xs text-amber-700 dark:text-amber-400">{{ suggested().length }}</span>
          </h2>
          <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
            @for (e of suggested(); track e.id) {
              <div class="relative">
                <app-event-card [event]="e" [class.ring-2]="isPicked(e)" [class.ring-primary]="isPicked(e)" [class.rounded-card]="true">
                  <div class="flex gap-1 border-t border-line px-2 py-1.5">
                    <p-button label="Aceitar" icon="pi pi-check" size="small" [text]="true" (onClick)="store.accept(e.id)" />
                    <p-button label="Ignorar" icon="pi pi-times" size="small" [text]="true" severity="secondary" (onClick)="store.ignore(e.id)" />
                  </div>
                </app-event-card>
                <ng-container *ngTemplateOutlet="pick; context: { $implicit: e }" />
              </div>
            }
          </div>
        </section>
      }

      @for (section of sections(); track section.title) {
        @if (section.items.length) {
          <section [attr.aria-label]="section.title">
            <h2 class="mb-3 text-base font-semibold">{{ section.title }}</h2>
            <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
              @for (e of section.items; track e.id) {
                <div class="relative">
                  <app-event-card [event]="e" [class.ring-2]="isPicked(e)" [class.ring-primary]="isPicked(e)" [class.rounded-card]="true" />
                  <ng-container *ngTemplateOutlet="pick; context: { $implicit: e }" />
                </div>
              }
            </div>
          </section>
        }
      }

      @if (store.ignored().length) {
        <section>
          <p-button [label]="(showIgnored() ? 'Esconder' : 'Mostrar') + ' ignorados (' + store.ignored().length + ')'" [icon]="showIgnored() ? 'pi pi-angle-up' : 'pi pi-angle-down'" size="small" [text]="true" severity="secondary" (onClick)="showIgnored.set(!showIgnored())" />
          @if (showIgnored()) {
            <ul class="mt-2 divide-y divide-line rounded-card border border-line bg-panel">
              @for (e of store.ignored(); track e.id) {
                <li class="flex items-center gap-3 px-4 py-2 text-sm">
                  <span class="min-w-0 flex-1 truncate">{{ e.title }}</span>
                  <span class="text-xs text-muted">{{ formatCount(e.photos + e.videos) }} itens</span>
                  <p-button label="Restaurar" icon="pi pi-replay" size="small" [text]="true" (onClick)="store.restore(e.id)" />
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>

    <ng-template #pick let-e>
      @if (picking()) {
        <button
          type="button"
          class="absolute inset-0 z-[1] flex items-start justify-end rounded-card p-2"
          [class]="isPicked(e) ? 'bg-primary/15' : 'bg-transparent hover:bg-black/5'"
          [attr.aria-pressed]="isPicked(e)"
          [attr.aria-label]="(isPicked(e) ? 'Desmarcar ' : 'Marcar ') + e.title"
          (click)="togglePick(e)"
        >
          <span class="flex size-7 items-center justify-center rounded-full border-2 shadow" [class]="isPicked(e) ? 'border-primary bg-primary text-white' : 'border-white bg-black/30 text-transparent'">
            <i class="pi pi-check text-xs"></i>
          </span>
        </button>
      }
    </ng-template>

    @if (picking()) {
      <div class="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-line bg-panel px-4 py-2 shadow-lg">
        <span class="text-sm">{{ picked().length }} {{ picked().length === 1 ? 'selecionado' : 'selecionados' }}</span>
        <p-button label="Juntar" icon="pi pi-link" size="small" [disabled]="picked().length < 2" (onClick)="openMerge()" />
        <p-button label="Cancelar" size="small" [text]="true" severity="secondary" (onClick)="togglePicking()" />
      </div>
    }

    <p-dialog header="Juntar eventos" [visible]="mergeOpen()" (visibleChange)="mergeOpen.set($event)" [modal]="true" [draggable]="false" styleClass="w-[30rem] max-w-[95vw]">
      <p class="mb-4 text-sm text-muted">{{ mergeSummary() }}</p>
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <span class="text-sm">É uma</span>
          <p-selectbutton [options]="kinds" optionLabel="label" optionValue="value" [ngModel]="mergeKind()" (ngModelChange)="mergeKind.set($event)" [allowEmpty]="false" ariaLabel="Tipo" />
        </div>
        <div class="relative flex flex-col gap-1.5">
          <span class="text-sm">Onde foi <span class="text-muted">(opcional)</span></span>
          @if (mergePlace(); as place) {
            <span class="flex w-fit items-center gap-2 rounded-full border border-line py-1 pl-3 pr-1 text-sm">
              <i class="pi pi-map-marker text-xs text-muted"></i>{{ place }}
              <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="secondary" size="small" ariaLabel="Remover lugar" (onClick)="mergePlace.set(null)" />
            </span>
          } @else {
            <input pInputText class="w-full" placeholder="Buscar cidade…" aria-label="Buscar cidade" autocomplete="off" [ngModel]="placeQuery()" (ngModelChange)="searchPlace($event)" />
            @if (placeResults().length) {
              <ul class="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-lg" role="listbox" aria-label="Cidades">
                @for (r of placeResults(); track $index) {
                  <li><button type="button" class="w-full px-3 py-2 text-left text-sm hover:bg-canvas" (click)="pickPlace(r.name)">{{ r.name }}</button></li>
                }
              </ul>
            }
          }
          <span class="text-[11px] text-muted">Útil quando as fotos não têm GPS. A busca usa a base de cidades embutida, sem internet.</span>
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm">Título</span>
          <input pInputText class="w-full" maxlength="120" [placeholder]="mergePlace() ? titlePreview() : 'Ex.: Viagem para Salvador'" aria-label="Título" [ngModel]="mergeTitle()" (ngModelChange)="mergeTitle.set($event)" />
          <span class="text-[11px] text-muted">Se ficar vazio: {{ mergePlace() ? '"' + titlePreview() + '"' : titlePreview() }}.</span>
        </label>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="mergeOpen.set(false)" />
        <p-button label="Juntar" icon="pi pi-link" [loading]="merging()" (onClick)="merge()" />
      </div>
    </p-dialog>
  `,
})
export class TripsPage {
  protected readonly store = inject(EventStore);
  private readonly organize = inject(OrganizeStore);

  protected readonly shows: { label: string; value: Show }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Viagens', value: 'trip' },
    { label: 'Eventos', value: 'event' },
  ];
  protected readonly show = signal<Show>('all');
  protected readonly showIgnored = signal(false);
  protected readonly formatCount = formatCount;

  // "Juntar eventos"
  private readonly backend = inject(Backend);
  private readonly router = inject(Router);
  protected readonly kinds: { label: string; value: EventKind }[] = [
    { label: 'Viagem', value: 'trip' },
    { label: 'Evento', value: 'event' },
  ];
  protected readonly picking = signal(false);
  private readonly pickedIds = signal<ReadonlySet<string>>(new Set());
  /** Everything that can be merged (not ignored), oldest first. */
  protected readonly mergeable = computed(() => this.store.events());
  protected readonly picked = computed(() =>
    this.mergeable()
      .filter((e) => this.pickedIds().has(e.id))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
  );
  protected readonly mergeOpen = signal(false);
  protected readonly mergeKind = signal<EventKind>('trip');
  protected readonly mergeTitle = signal('');
  protected readonly mergePlace = signal<string | null>(null);
  protected readonly placeQuery = signal('');
  protected readonly placeResults = signal<Home[]>([]);
  protected readonly merging = signal(false);
  private placeTimer: ReturnType<typeof setTimeout> | undefined;
  private placeSeq = 0;

  protected readonly mergeSummary = computed(() => {
    const p = this.picked();
    if (!p.length) return '';
    const items = p.reduce((n, e) => n + e.photos + e.videos, 0);
    return `${p.length} eventos · ${formatPeriod(p[0].startedAt, p.at(-1)!.endedAt)} · ${formatCount(items)} itens, mais as fotos entre eles. O resultado fica como editado: o PhotoVault não vai mais alterá-lo.`;
  });
  /** An empty title: from the chosen place (as `events::merge`), else automatic. */
  protected readonly titlePreview = computed(() => {
    const place = this.mergePlace()?.split(',')[0].trim();
    if (place) return `${this.mergeKind() === 'trip' ? 'Viagem para' : 'Evento em'} ${place}`;
    return 'automático, pelos lugares das fotos ou pela data';
  });

  protected togglePicking() {
    this.picking.update((v) => !v);
    this.pickedIds.set(new Set());
  }

  protected isPicked(e: EventSummary) {
    return this.pickedIds().has(e.id);
  }

  protected togglePick(e: EventSummary) {
    const next = new Set(this.pickedIds());
    if (!next.delete(e.id)) next.add(e.id);
    this.pickedIds.set(next);
  }

  protected openMerge() {
    // Merging is mostly the days of a trip.
    this.mergeKind.set('trip');
    this.mergeTitle.set('');
    this.mergePlace.set(null);
    this.placeQuery.set('');
    this.placeResults.set([]);
    this.mergeOpen.set(true);
  }

  protected searchPlace(text: string) {
    this.placeQuery.set(text);
    clearTimeout(this.placeTimer);
    const seq = ++this.placeSeq;
    if (text.trim().length < 2 || !isTauri()) return this.placeResults.set([]);
    this.placeTimer = setTimeout(async () => {
      const found = await unwrap(this.backend.commands.searchHomePlaces(text)).catch(() => []);
      if (seq === this.placeSeq) this.placeResults.set(found);
    }, 200);
  }

  protected pickPlace(name: string) {
    this.placeSeq++;
    this.mergePlace.set(name);
    this.placeResults.set([]);
  }

  protected async merge() {
    this.merging.set(true);
    try {
      const merged = await this.store.merge({
        eventIds: this.picked().map((e) => e.id),
        kind: this.mergeKind(),
        title: this.mergeTitle().trim() || undefined,
        place: this.mergePlace() ?? undefined,
      });
      if (merged) {
        this.mergeOpen.set(false);
        this.togglePicking();
        void this.router.navigate(['/trips', merged.id]);
      }
    } finally {
      this.merging.set(false);
    }
  }

  private readonly matches = (e: EventSummary) => this.show() === 'all' || e.kind === this.show();
  protected readonly suggested = computed(() => this.store.suggested().filter(this.matches));
  protected readonly sections = computed(() => [
    { title: 'Suas viagens', items: this.show() === 'event' ? [] : this.store.trips() },
    { title: 'Eventos', items: this.show() === 'trip' ? [] : this.store.others() },
  ]);
  protected readonly subtitle = computed(() => {
    const trips = this.store.events().filter((e) => e.kind === 'trip').length;
    const events = this.store.events().length - trips;
    return `${formatCount(trips)} ${trips === 1 ? 'viagem' : 'viagens'} · ${formatCount(events)} ${events === 1 ? 'evento' : 'eventos'}`;
  });
  protected readonly emptyText = computed(() => {
    const pending = this.organize.counts()?.pending;
    if (pending) return `A análise ainda está em andamento (${formatCount(pending)} itens na fila).`;
    return 'Viagens aparecem quando há fotos com data e localização (GPS) longe de casa; eventos, quando há muitas fotos em poucas horas.';
  });
}
