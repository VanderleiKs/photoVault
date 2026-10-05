import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type Adjust, type EditRecipe, type MediaItem } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';

/** Wait after the last change before saving the recipe. */
const SAVE_DELAY_MS = 600;

type AdjustKey = keyof Adjust;

interface Control {
  key: AdjustKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const CONTROLS: { title: string; controls: Control[] }[] = [
  {
    title: 'Luz',
    controls: [
      { key: 'exposure', label: 'Exposição', min: -3, max: 3, step: 0.05 },
      { key: 'contrast', label: 'Contraste', min: -100, max: 100, step: 1 },
      { key: 'highlights', label: 'Realces', min: -100, max: 100, step: 1 },
      { key: 'shadows', label: 'Sombras', min: -100, max: 100, step: 1 },
      { key: 'whites', label: 'Brancos', min: -100, max: 100, step: 1 },
      { key: 'blacks', label: 'Pretos', min: -100, max: 100, step: 1 },
    ],
  },
  {
    title: 'Cor',
    controls: [
      { key: 'temperature', label: 'Temperatura', min: -100, max: 100, step: 1 },
      { key: 'tint', label: 'Tonalidade', min: -100, max: 100, step: 1 },
      { key: 'vibrance', label: 'Vibração', min: -100, max: 100, step: 1 },
      { key: 'saturation', label: 'Saturação', min: -100, max: 100, step: 1 },
    ],
  },
  {
    title: 'Detalhe',
    controls: [{ key: 'sharpen', label: 'Nitidez', min: 0, max: 100, step: 1 }],
  },
];

/** A recipe with every field present (the generated type has them optional). */
export function fullRecipe(r: EditRecipe | null | undefined): EditRecipe {
  return {
    version: r?.version ?? 1,
    auto: { enabled: r?.auto?.enabled ?? true, style: r?.auto?.style ?? 'natural', intensity: r?.auto?.intensity ?? 1 },
    adjust: { ...(r?.adjust ?? {}) },
    geometry: { ...(r?.geometry ?? {}) },
  };
}

export interface RecipeChange {
  recipe: EditRecipe;
  /** The control was released (render sharp) or is still moving (render fast). */
  resting: boolean;
}

/**
 * Fine tuning of one photo (dark, in the viewer): the automatic part with its
 * intensity, plus light/colour/detail added on top. Saved as the user goes; "Voltar
 * ao original" removes the edit.
 */
@Component({
  selector: 'app-fine-tune',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block text-sm' },
  template: `
    <div class="mb-4 flex items-center gap-2">
      <h2 class="flex-1 text-sm font-semibold text-white"><i class="pi pi-sun mr-1.5"></i>Melhorar</h2>
      @if (saving()) {
        <i class="pi pi-spin pi-spinner text-xs text-slate-400" title="Salvando"></i>
      }
      <p-button icon="pi pi-times" [text]="true" [rounded]="true" size="small" severity="contrast" ariaLabel="Fechar" (onClick)="closed.emit()" />
    </div>

    <label class="flex items-center gap-2 text-slate-200">
      <input type="checkbox" [checked]="recipe().auto?.enabled" (change)="setAuto($event)" />
      Correção automática
    </label>
    @if (recipe().auto?.enabled) {
      <div class="mt-2">
        <div class="flex justify-between text-xs text-slate-400">
          <span>Intensidade</span><span class="tabular-nums">{{ intensityPercent() }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          class="w-full accent-[var(--p-primary-color)]"
          aria-label="Intensidade"
          [value]="intensityPercent()"
          (input)="setIntensity($event, false)"
          (change)="setIntensity($event, true)"
        />
      </div>
    }

    @for (group of groups; track group.title) {
      <h3 class="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ group.title }}</h3>
      @for (c of group.controls; track c.key) {
        <div class="mt-1.5">
          <div class="flex justify-between text-xs text-slate-300">
            <button type="button" class="hover:text-white" title="Duplo clique: zerar" (dblclick)="reset(c.key)">{{ c.label }}</button>
            <span class="tabular-nums text-slate-400">{{ display(c) }}</span>
          </div>
          <input
            type="range"
            class="w-full accent-[var(--p-primary-color)]"
            [attr.aria-label]="c.label"
            [min]="c.min"
            [max]="c.max"
            [step]="c.step"
            [value]="value(c.key)"
            (input)="set(c.key, $event, false)"
            (change)="set(c.key, $event, true)"
          />
        </div>
      }
    }

    <div class="mt-6 flex flex-col gap-2">
      <p class="text-xs text-slate-400">Segure <kbd class="rounded bg-white/10 px-1">\\</kbd> ou use o botão para comparar com o original.</p>
      <p-button label="Voltar ao original" icon="pi pi-replay" severity="secondary" [outlined]="true" styleClass="w-full !justify-start" [disabled]="!item().edited" (onClick)="restore()" />
    </div>
  `,
})
export class FineTuneComponent {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);

  readonly item = input.required<MediaItem>();
  readonly recipeChange = output<RecipeChange>();
  readonly closed = output<void>();

  protected readonly groups = CONTROLS;
  protected readonly recipe = signal<EditRecipe>(fullRecipe(null));
  protected readonly saving = signal(false);
  protected readonly intensityPercent = computed(() => Math.round((this.recipe().auto?.intensity ?? 1) * 100));

  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private dirty = false;
  private loadedFor = '';

  constructor() {
    effect(() => {
      const item = this.item();
      untracked(() => {
        if (item.id !== this.loadedFor) void this.load(item);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.saveTimer);
      if (this.dirty) void this.save();
      if (this.loadedFor) void unwrap(this.backend.commands.closeEdit(this.loadedFor)).catch(() => {});
    });
  }

  /** Opens the photo; one never improved gets the automatic improvement right away. */
  private async load(item: MediaItem) {
    if (this.dirty) {
      clearTimeout(this.saveTimer);
      await this.save();
    }
    if (this.loadedFor) void unwrap(this.backend.commands.closeEdit(this.loadedFor)).catch(() => {});
    this.loadedFor = item.id;
    try {
      const [edit] = await Promise.all([
        unwrap(this.backend.commands.getEdit(item.id)),
        unwrap(this.backend.commands.openEdit(item.id)),
      ]);
      if (this.loadedFor !== item.id) return;
      this.recipe.set(fullRecipe(edit?.recipe));
      this.recipeChange.emit({ recipe: this.recipe(), resting: true });
      if (!edit) this.scheduleSave(0);
    } catch (e) {
      this.notify.error('Não foi possível abrir a foto para melhorar', e);
      this.closed.emit();
    }
  }

  protected value(key: AdjustKey): number {
    return this.recipe().adjust?.[key] ?? 0;
  }

  protected display(c: Control): string {
    const v = this.value(c.key);
    if (c.key === 'exposure') return `${v > 0 ? '+' : ''}${v.toFixed(2)} EV`;
    return `${v > 0 ? '+' : ''}${Math.round(v)}`;
  }

  protected set(key: AdjustKey, event: Event, resting: boolean) {
    const v = Number((event.target as HTMLInputElement).value);
    this.change((r) => ({ ...r, adjust: { ...r.adjust, [key]: v } }), resting);
  }

  protected reset(key: AdjustKey) {
    this.change((r) => ({ ...r, adjust: { ...r.adjust, [key]: 0 } }), true);
  }

  protected setAuto(event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    this.change((r) => ({ ...r, auto: { ...r.auto, enabled } }), true);
  }

  protected setIntensity(event: Event, resting: boolean) {
    const intensity = Number((event.target as HTMLInputElement).value) / 100;
    this.change((r) => ({ ...r, auto: { ...r.auto, intensity } }), resting);
  }

  private change(f: (r: EditRecipe) => EditRecipe, resting: boolean) {
    this.recipe.update(f);
    this.recipeChange.emit({ recipe: this.recipe(), resting });
    this.scheduleSave(SAVE_DELAY_MS);
  }

  private scheduleSave(delay: number) {
    this.dirty = true;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(), delay);
  }

  private async save() {
    const id = this.loadedFor;
    if (!id) return;
    this.dirty = false;
    this.saving.set(true);
    try {
      await unwrap(this.backend.commands.saveEdit(id, this.recipe()));
    } catch (e) {
      this.notify.error('Não foi possível salvar a melhoria', e);
    } finally {
      this.saving.set(false);
    }
  }

  protected async restore() {
    const id = this.loadedFor;
    clearTimeout(this.saveTimer);
    this.dirty = false;
    try {
      await unwrap(this.backend.commands.resetEdits([id]));
      this.notify.success('Foto voltou ao original');
      this.closed.emit();
    } catch (e) {
      this.notify.error('Não foi possível voltar ao original', e);
    }
  }
}
