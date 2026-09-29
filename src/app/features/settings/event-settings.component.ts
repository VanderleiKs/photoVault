import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import { ToggleSwitchModule } from '@openng/optimus-ui/toggleswitch';
import type { EventSettings } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { AppStore, DEFAULT_EVENTS } from '../../core/stores/app.store';
import { EventStore } from '../../core/stores/event.store';
import { HomeSettingsComponent } from './home-settings.component';

/** The thresholds (the homes have their own block). */
type NumericKey = Exclude<keyof EventSettings, 'homes'>;

interface Field {
  key: NumericKey;
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
  imports: [FormsModule, ButtonModule, InputNumberModule, ToggleSwitchModule, HomeSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-card border border-line bg-panel p-5' },
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="flex-1 font-semibold">Viagens e eventos</h2>
      <p-button label="Restaurar padrões" icon="pi pi-undo" size="small" [text]="true" severity="secondary" [disabled]="isDefault()" (onClick)="reset()" />
    </div>
    <p class="mt-1 text-sm text-muted">Como as sugestões são encontradas. Ao mudar um valor, as sugestões são refeitas; eventos aceitos, editados ou ignorados não mudam.</p>
    <app-home-settings class="mt-4 block" />
    <div class="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
      @for (f of fields; track f.key) {
        <label class="flex flex-col gap-1.5">
          <span class="text-sm">{{ f.label }}</span>
          <p-inputnumber [ngModel]="value(f.key)" (ngModelChange)="set(f.key, $event)" [min]="f.min" [max]="f.max" [step]="f.step" [showButtons]="true" [suffix]="f.suffix" />
          <span class="text-[11px] text-muted">{{ f.hint }}</span>
        </label>
      }
    </div>
    <div class="mt-5 border-t border-line pt-4">
      <h3 class="text-sm font-semibold">Reclassificar agora</h3>
      <p class="mt-1 text-xs text-muted">Procura viagens e eventos de novo em todas as bibliotecas, com os valores acima. Os que você editou nunca mudam.</p>
      <div class="mt-3 flex flex-col gap-2">
        <label class="flex items-center gap-3">
          <p-toggleswitch [(ngModel)]="redoAccepted" ariaLabel="Refazer também os aceitos" />
          <span class="text-sm">Refazer também os aceitos <span class="text-muted">(os que voltarem continuam aceitos; os outros saem)</span></span>
        </label>
        <label class="flex items-center gap-3">
          <p-toggleswitch [(ngModel)]="forgetIgnored" ariaLabel="Sugerir de novo os ignorados" />
          <span class="text-sm">Sugerir de novo os ignorados</span>
        </label>
      </div>
      <p-button class="mt-3 inline-block" label="Reclassificar" icon="pi pi-refresh" size="small" [loading]="running()" (onClick)="reclassify()" />
    </div>
  `,
})
export class EventSettingsComponent {
  private readonly app = inject(AppStore);
  private readonly events = inject(EventStore);
  private readonly notify = inject(NotifyService);
  private readonly draft = signal<EventSettings | null>(null);
  protected readonly current = computed(() => this.draft() ?? this.app.settings().events ?? DEFAULT_EVENTS);
  protected readonly isDefault = computed(() => this.fields.every((f) => this.value(f.key) === DEFAULT_EVENTS[f.key]));
  private timer: ReturnType<typeof setTimeout> | undefined;
  protected readonly redoAccepted = signal(false);
  protected readonly forgetIgnored = signal(false);
  protected readonly running = signal(false);

  protected readonly fields: Field[] = [
    { key: 'gapHours', label: 'Intervalo que separa eventos', hint: 'Sem fotos por mais tempo que isso, começa outro evento (padrão 6 h).', min: 1, max: 72, step: 1, suffix: ' h' },
    { key: 'tripMinKm', label: 'Distância de casa para ser viagem', hint: 'Até a casa mais próxima (padrão 50 km).', min: 5, max: 5000, step: 10, suffix: ' km' },
    { key: 'tripJoinHours', label: 'Noites dentro da mesma viagem', hint: 'Dias longe de casa com até este intervalo formam uma só viagem (padrão 48 h).', min: 6, max: 240, step: 6, suffix: ' h' },
    { key: 'minEventItems', label: 'Tamanho mínimo de um evento', hint: 'Fotos e vídeos (padrão 20).', min: 2, max: 1000, step: 1, suffix: ' itens' },
    { key: 'minTripItems', label: 'Tamanho mínimo de uma viagem', hint: 'Fotos e vídeos (padrão 10).', min: 2, max: 1000, step: 1, suffix: ' itens' },
  ];

  protected value(key: NumericKey): number {
    return this.current()[key] ?? DEFAULT_EVENTS[key] ?? 0;
  }

  protected set(key: NumericKey, value: number | null) {
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

  protected async reclassify() {
    this.running.set(true);
    try {
      // A value still waiting for the debounce is saved first.
      const pending = this.draft();
      if (pending) {
        clearTimeout(this.timer);
        await this.save(pending);
      }
      const c = await this.events.reclassify({ accepted: this.redoAccepted(), ignored: this.forgetIgnored() });
      if (c) {
        const found = `${plural(c.trips, 'viagem', 'viagens')} e ${plural(c.events, 'evento', 'eventos')}`;
        this.notify.success('Reclassificação concluída', c.suggested ? `${found}, ${plural(c.suggested, 'sugestão', 'sugestões')} para revisar.` : `${found}.`);
      }
    } finally {
      this.running.set(false);
    }
  }

  private async save(events: EventSettings) {
    // The homes are saved by their own block: keep the latest ones.
    const homes = this.app.settings().events?.homes ?? [];
    await this.app.updateSettings({ events: { ...events, homes } }).catch(() => {});
    this.draft.set(null);
  }
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
