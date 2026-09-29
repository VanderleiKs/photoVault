import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import type { EventSummary } from '../../core/ipc/ipc';
import { EventStore } from '../../core/stores/event.store';
import { OrganizeStore } from '../../core/stores/organize.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { EventCardComponent } from '../../shared/event-card.component';
import { JobStatusComponent } from '../../shared/job-status.component';

type Show = 'all' | 'trip' | 'event';

/** "Viagens" (PRD §17): suggestions to accept or ignore, then trips and events. */
@Component({
  selector: 'app-trips-page',
  imports: [FormsModule, ButtonModule, SelectButtonModule, SkeletonModule, EmptyStateComponent, EventCardComponent, JobStatusComponent],
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
        <p-selectbutton [options]="shows" optionLabel="label" optionValue="value" [ngModel]="show()" (ngModelChange)="show.set($event)" [allowEmpty]="false" ariaLabel="Mostrar" />
      </div>
      <p class="mt-2 max-w-3xl text-xs text-muted">
        Encontrados pelas datas e pela localização das fotos: um intervalo de mais de 6 horas separa eventos, e uma viagem é quando você passa pelo menos um dia longe de casa
        (o lugar onde você mais fotografa). Aceite, edite ou ignore: o que for ignorado não volta a ser sugerido.
      </p>
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
              <app-event-card [event]="e">
                <div class="flex gap-1 border-t border-line px-2 py-1.5">
                  <p-button label="Aceitar" icon="pi pi-check" size="small" [text]="true" (onClick)="store.accept(e.id)" />
                  <p-button label="Ignorar" icon="pi pi-times" size="small" [text]="true" severity="secondary" (onClick)="store.ignore(e.id)" />
                </div>
              </app-event-card>
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
                <app-event-card [event]="e" />
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
