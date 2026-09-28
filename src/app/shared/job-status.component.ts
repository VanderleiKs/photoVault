import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { formatCount, formatEta } from '../core/format';
import { JobStore } from '../core/stores/job.store';

/** Compact "Analisando 1.234 arquivos · ~3 min" indicator with pause/resume. */
@Component({
  selector: 'app-job-status',
  imports: [ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (jobs.progress(); as p) {
      @if (p.grouping && p.queued === 0) {
        <div class="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs" role="status">
          <i class="pi pi-spin pi-spinner text-primary"></i>Agrupando duplicatas e semelhantes…
        </div>
      } @else if (p.queued > 0) {
        <div class="flex items-center gap-1 rounded-full border border-line bg-panel py-0.5 pl-3 pr-0.5 text-xs" role="status">
          @if (p.paused) {
            <i class="pi pi-pause text-muted"></i>
          } @else {
            <i class="pi pi-spin pi-spinner text-primary"></i>
          }
          <span class="ml-1 whitespace-nowrap" [title]="p.currentPath ?? ''">{{ label() }}</span>
          <p-button
            [icon]="p.paused ? 'pi pi-play' : 'pi pi-pause'"
            [text]="true"
            [rounded]="true"
            size="small"
            [ariaLabel]="p.paused ? 'Retomar análise' : 'Pausar análise'"
            [pTooltip]="p.paused ? 'Retomar análise' : 'Pausar análise (libera o disco e a CPU)'"
            tooltipPosition="bottom"
            (onClick)="p.paused ? jobs.resume() : jobs.pause()"
          />
        </div>
      }
    }
  `,
})
export class JobStatusComponent {
  protected readonly jobs = inject(JobStore);

  protected readonly label = computed(() => {
    const p = this.jobs.progress();
    if (!p) return '';
    const count = `${formatCount(p.queued)} ${p.queued === 1 ? 'arquivo' : 'arquivos'}`;
    if (p.paused) return `Análise pausada · ${count}`;
    const eta = formatEta(p.etaSeconds);
    return `Analisando ${count}${eta ? ` · ${eta}` : ''}`;
  });
}
