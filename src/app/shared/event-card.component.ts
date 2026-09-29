import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCount, formatPeriod } from '../core/format';
import { previewUrl, type EventSummary } from '../core/ipc/ipc';

/** Card of a trip or event (Viagens, Início): cover, title, period, counts, places. */
@Component({
  selector: 'app-event-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article class="group overflow-hidden rounded-card border border-line bg-panel transition-shadow hover:shadow-md">
      <a [routerLink]="['/trips', event().id]" class="block" [attr.aria-label]="event().title">
        <div class="relative aspect-[16/9] overflow-hidden bg-panel-2">
          @if (cover()) {
            <img [src]="cover()" alt="" loading="lazy" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          } @else {
            <div class="flex size-full items-center justify-center text-muted"><i class="pi text-3xl" [class]="icon()"></i></div>
          }
          <span class="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            <i class="pi text-[10px]" [class]="icon()"></i>{{ event().kind === 'trip' ? 'Viagem' : 'Evento' }}
          </span>
          @if (event().status === 'suggested') {
            <span class="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-medium text-white">Sugestão</span>
          }
        </div>
        <div class="p-3">
          <h3 class="truncate text-sm font-semibold" [title]="event().title">{{ event().title }}</h3>
          <p class="mt-0.5 text-xs text-muted">{{ period() }} · {{ counts() }}</p>
          @if (event().placeSummary) {
            <p class="mt-0.5 truncate text-xs text-muted" [title]="event().placeSummary">{{ event().placeSummary }}</p>
          }
        </div>
      </a>
      <ng-content />
    </article>
  `,
})
export class EventCardComponent {
  readonly event = input.required<EventSummary>();

  protected readonly cover = computed(() => {
    const c = this.event().cover;
    return c ? previewUrl(c.id, c.thumbVersion) : '';
  });
  protected readonly icon = computed(() => (this.event().kind === 'trip' ? 'pi-send' : 'pi-calendar'));
  protected readonly period = computed(() => formatPeriod(this.event().startedAt, this.event().endedAt));
  protected readonly counts = computed(() => eventCounts(this.event()));
}

/** "426 fotos, 38 vídeos" */
export function eventCounts(e: Pick<EventSummary, 'photos' | 'videos'>): string {
  const parts = [`${formatCount(e.photos)} ${e.photos === 1 ? 'foto' : 'fotos'}`];
  if (e.videos) parts.push(`${formatCount(e.videos)} ${e.videos === 1 ? 'vídeo' : 'vídeos'}`);
  return parts.join(', ');
}
