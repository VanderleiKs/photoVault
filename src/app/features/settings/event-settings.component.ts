import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import type { EventSettings } from '../../core/ipc/ipc';
import { AppStore, DEFAULT_EVENTS } from '../../core/stores/app.store';

interface Field {
  key: keyof EventSettings;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}

/** Settings → "Viagens e eventos" (PRD §17): how trips and events are found. */
@Component({
  selector: 'app-event-settings',
  imports: [FormsModule, ButtonModule, InputNumberModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-card border border-line bg-panel p-5' },
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="flex-1 font-semibold">Viagens e eventos</h2>
      <p-button label="Restaurar padrões" icon="pi pi-undo" size="small" [text]="true" severity="secondary" [disabled]="isDefault()" (onClick)="reset()" />
    </div>
    <p class="mt-1 text-sm text-muted">Como as sugestões são encontradas. Eventos aceitos, editados ou ignorados não mudam.</p>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      @for (f of fields; track f.key) {
        <label class="flex flex-col gap-1.5">
          <span class="text-sm">{{ f.label }}</span>
          <p-inputnumber [ngModel]="value(f.key)" (ngModelChange)="set(f.key, $event)" [min]="f.min" [max]="f.max" [step]="f.step" [showButtons]="true" [suffix]="f.suffix" />
          <span class="text-[11px] text-muted">{{ f.hint }}</span>
        </label>
      }
    </div>
  `,
})
export class EventSettingsComponent {
  private readonly app = inject(AppStore);
  private readonly draft = signal<EventSettings | null>(null);
  protected readonly current = computed(() => this.draft() ?? this.app.settings().events ?? DEFAULT_EVENTS);
  protected readonly isDefault = computed(() => JSON.stringify(this.current()) === JSON.stringify(DEFAULT_EVENTS));
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly fields: Field[] = [
    { key: 'gapHours', label: 'Intervalo que separa eventos', hint: 'Sem fotos por mais tempo que isso, começa outro evento (padrão 6 h).', min: 1, max: 72, step: 1, suffix: ' h' },
    { key: 'tripMinKm', label: 'Distância de casa para ser viagem', hint: '"Casa" é o lugar onde você mais fotografa (padrão 50 km).', min: 5, max: 5000, step: 10, suffix: ' km' },
    { key: 'tripJoinHours', label: 'Noites dentro da mesma viagem', hint: 'Dias longe de casa com até este intervalo formam uma só viagem (padrão 48 h).', min: 6, max: 240, step: 6, suffix: ' h' },
    { key: 'minEventItems', label: 'Tamanho mínimo de um evento', hint: 'Fotos e vídeos (padrão 20).', min: 2, max: 1000, step: 1, suffix: ' itens' },
    { key: 'minTripItems', label: 'Tamanho mínimo de uma viagem', hint: 'Fotos e vídeos (padrão 10).', min: 2, max: 1000, step: 1, suffix: ' itens' },
  ];

  protected value(key: keyof EventSettings): number {
    return this.current()[key] ?? DEFAULT_EVENTS[key] ?? 0;
  }

  protected set(key: keyof EventSettings, value: number | null) {
    if (value === null || value === undefined) return;
    const next = { ...this.current(), [key]: value };
    this.draft.set(next);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.save(next), 800);
  }

  protected reset() {
    clearTimeout(this.timer);
    this.draft.set(DEFAULT_EVENTS);
    void this.save(DEFAULT_EVENTS);
  }

  private async save(events: EventSettings) {
    await this.app.updateSettings({ events }).catch(() => {});
    this.draft.set(null);
  }
}
