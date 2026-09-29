import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import { SelectModule } from '@openng/optimus-ui/select';
import { ToggleSwitchModule } from '@openng/optimus-ui/toggleswitch';
import { REASON_LABEL } from '../../core/analysis-labels';
import type { ReasonWeights, ReviewReason, ReviewSettings } from '../../core/ipc/ipc';
import { AppStore, DEFAULT_REVIEW } from '../../core/stores/app.store';
import { ConfirmAction } from '../../shared/confirm-action.component';

const LEVELS = [
  { label: 'Alta', value: 1 },
  { label: 'Normal', value: 0.6 },
  { label: 'Baixa', value: 0.3 },
  { label: 'Não sugerir', value: 0 },
];

const WEIGHT_KEYS: { key: keyof ReasonWeights; reason: ReviewReason }[] = [
  { key: 'exactDuplicate', reason: 'EXACT_DUPLICATE' },
  { key: 'visualDuplicate', reason: 'VISUAL_DUPLICATE' },
  { key: 'similarSequence', reason: 'SIMILAR_SEQUENCE' },
  { key: 'blurry', reason: 'BLURRY' },
  { key: 'dark', reason: 'DARK' },
  { key: 'overexposed', reason: 'OVEREXPOSED' },
  { key: 'lowResolution', reason: 'LOW_RESOLUTION' },
  { key: 'lowInformation', reason: 'LOW_INFORMATION' },
  { key: 'screenshot', reason: 'SCREENSHOT' },
  { key: 'momentary', reason: 'MOMENTARY' },
  { key: 'accidental', reason: 'ACCIDENTAL' },
  { key: 'example', reason: 'EXAMPLE' },
];

/** Settings → "Revisão e lixeira" (PRD §15–16): reason weights and trash options. */
@Component({
  selector: 'app-review-settings',
  imports: [FormsModule, ButtonModule, InputNumberModule, SelectModule, ToggleSwitchModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-card border border-line bg-panel p-5' },
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="flex-1 font-semibold">Revisão e lixeira</h2>
      <p-button label="Restaurar padrões" icon="pi pi-undo" size="small" [text]="true" severity="secondary" [disabled]="isDefault()" (onClick)="reset()" />
    </div>
    <p class="mt-1 text-sm text-muted">Quais motivos geram sugestões na Revisão e com que prioridade. Favoritas nunca são sugeridas.</p>

    <div class="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
      @for (w of weightKeys; track w.key) {
        <label class="flex items-center gap-3">
          <span class="flex-1 text-sm" [title]="hint(w.reason)"><i [class]="icon(w.reason) + ' mr-1.5 text-xs text-muted'"></i>{{ label(w.reason) }}</span>
          <p-select [options]="levels" optionLabel="label" optionValue="value" [ngModel]="level(weight(w.key))" (ngModelChange)="setWeight(w.key, $event)" size="small" styleClass="w-36" [ariaLabel]="'Prioridade: ' + label(w.reason)" />
        </label>
      }
    </div>

    <label class="mt-5 flex flex-col gap-1.5 sm:w-1/2">
      <span class="text-sm">Semelhança mínima com os exemplos</span>
      <p-inputnumber [ngModel]="review().exampleSimilarity" (ngModelChange)="set({ exampleSimilarity: $event })" [min]="0.5" [max]="1" [step]="0.02" [minFractionDigits]="2" [maxFractionDigits]="2" [showButtons]="true" />
      <span class="text-[11px] text-muted">De 0,5 a 1 (padrão 0,70). Maior = só fotos muito parecidas com o exemplo.</span>
    </label>

    <div class="mt-5 space-y-4 border-t border-line pt-4">
      <label class="flex items-start gap-3">
        <p-toggleswitch [ngModel]="review().useSystemTrash" (ngModelChange)="set({ useSystemTrash: $event })" ariaLabel="Usar a lixeira do sistema" />
        <span class="text-sm">
          Usar a lixeira do sistema
          <span class="block text-xs text-muted">Desligado (padrão): as fotos vão para a pasta <code>.photovault-trash</code> da biblioteca e são restauradas pelo PhotoVault. Ligado: vão para a lixeira do Windows/Linux e saem do catálogo.</span>
        </span>
      </label>
      <label class="flex flex-col gap-1.5 sm:w-1/2">
        <span class="text-sm">Excluir da lixeira automaticamente após</span>
        <p-inputnumber [ngModel]="review().autoPurgeDays" (ngModelChange)="setPurge($event)" [min]="0" [max]="3650" [showButtons]="true" suffix=" dias" />
        <span class="text-[11px] text-muted">0 = nunca (padrão). A limpeza roda ao abrir o app.</span>
      </label>
    </div>
  `,
})
export class ReviewSettingsComponent {
  private readonly app = inject(AppStore);
  private readonly confirm = inject(ConfirmAction);

  protected readonly levels = LEVELS;
  protected readonly weightKeys = WEIGHT_KEYS;
  private readonly draft = signal<ReviewSettings | null>(null);
  protected readonly review = computed(() => this.draft() ?? this.app.settings().review ?? DEFAULT_REVIEW);
  protected readonly isDefault = computed(() => JSON.stringify(this.review()) === JSON.stringify(DEFAULT_REVIEW));
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected label(reason: ReviewReason) {
    return REASON_LABEL[reason].label;
  }

  protected icon(reason: ReviewReason) {
    return REASON_LABEL[reason].icon;
  }

  protected hint(reason: ReviewReason) {
    return REASON_LABEL[reason].hint;
  }

  /** Nearest level (custom values saved elsewhere still show something). */
  protected level(weight: number) {
    return LEVELS.reduce((best, l) => (Math.abs(l.value - weight) < Math.abs(best.value - weight) ? l : best)).value;
  }

  protected weight(key: keyof ReasonWeights): number {
    return this.review().weights?.[key] ?? DEFAULT_REVIEW.weights?.[key] ?? 0;
  }

  protected setWeight(key: keyof ReasonWeights, value: number) {
    this.set({ weights: { ...this.review().weights, [key]: value } });
  }

  protected async setPurge(days: number | null) {
    if (days === null || days === undefined) return;
    if (days > 0 && !this.review().autoPurgeDays) {
      const ok = await this.confirm.ask({
        header: 'Limpeza automática da lixeira',
        message: `Excluir definitivamente, ao abrir o app, o que estiver na lixeira há mais de ${days} dias?`,
        detail: 'Os arquivos excluídos assim não podem ser restaurados.',
        acceptLabel: 'Ativar limpeza',
        danger: true,
      });
      if (!ok) {
        this.draft.set({ ...this.review() });
        queueMicrotask(() => this.draft.set(null));
        return;
      }
    }
    this.set({ autoPurgeDays: days });
  }

  protected set(patch: Partial<ReviewSettings>) {
    if (Object.values(patch).some((v) => v === null || v === undefined)) return;
    const next = { ...this.review(), ...patch };
    this.draft.set(next);
    // Each save recomputes the suggestions of every library.
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.save(next), 600);
  }

  protected reset() {
    clearTimeout(this.timer);
    this.draft.set(DEFAULT_REVIEW);
    void this.save(DEFAULT_REVIEW);
  }

  private async save(review: ReviewSettings) {
    await this.app.updateSettings({ review }).catch(() => {});
    this.draft.set(null);
  }
}
