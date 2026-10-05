import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { formatCount } from '../format';
import { Backend } from '../ipc/backend';
import { unwrap, type ArrangeScope, type EditBatch, type EnhanceSummary, type Style } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { LibraryStore } from './library.store';
import { TYPED_CONFIRM_ABOVE } from './media-actions.service';

/** Photos shown in the before/after grid. */
export const SAMPLE_SIZE = 12;

/** Extensions the editor reads (same list as `edit::store::EDITABLE`). */
export const EDITABLE = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'webp', 'bmp'];

export function isEditable(extension: string): boolean {
  return EDITABLE.includes(extension.toLowerCase());
}

/** "Melhorar fotos" (PRD §29): scope summary, style and intensity, apply, undo. */
@Injectable({ providedIn: 'root' })
export class EnhanceStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmAction);
  private readonly libraries = inject(LibraryStore);

  readonly summary = signal<EnhanceSummary | null>(null);
  readonly summaryError = signal<string | null>(null);
  readonly loading = signal(false);
  readonly applying = signal(false);
  readonly batches = signal<EditBatch[]>([]);
  readonly style = signal<Style>('natural');
  /** 0..1 */
  readonly intensity = signal(1);

  private seq = 0;

  constructor() {
    effect(() => {
      const library = this.libraries.activeId();
      untracked(() => void this.refreshBatches(library));
    });
  }

  /** What the improvement would touch in `scope`. Latest call wins. */
  async load(scope: ArrangeScope): Promise<void> {
    const library = this.libraries.activeId();
    if (!library || !isTauri()) return;
    const seq = ++this.seq;
    this.loading.set(true);
    try {
      const s = await unwrap(this.backend.commands.summarizeEnhance(library, scope, SAMPLE_SIZE));
      if (seq !== this.seq) return;
      this.summary.set(s);
      this.summaryError.set(null);
    } catch (e) {
      if (seq !== this.seq) return;
      this.summary.set(null);
      this.summaryError.set(e instanceof Error ? e.message : String(e));
    } finally {
      if (seq === this.seq) this.loading.set(false);
    }
  }

  async refreshBatches(libraryId = this.libraries.activeId()): Promise<void> {
    if (!libraryId || !isTauri()) {
      this.batches.set([]);
      return;
    }
    this.batches.set(await unwrap(this.backend.commands.listEnhanceBatches(libraryId)).catch(() => []));
  }

  /** Confirms, then saves the improvement on every photo of the scope. */
  async apply(scope: ArrangeScope): Promise<boolean> {
    const library = this.libraries.activeId();
    const n = this.summary()?.editable ?? 0;
    if (!library || !n) return false;
    const photos = `${formatCount(n)} ${n === 1 ? 'foto' : 'fotos'}`;
    const edited = this.summary()?.edited ?? 0;
    const ok = await this.confirm.ask({
      header: 'Melhorar fotos',
      icon: 'pi pi-sun',
      message: `Aplicar a melhoria automática em ${photos}?`,
      detail:
        'Os arquivos originais não são alterados: a melhoria fica guardada no PhotoVault e pode ser desfeita a qualquer momento. ' +
        (edited ? `${formatCount(edited)} já ${edited === 1 ? 'tinha' : 'tinham'} melhoria: o ajuste fino é mantido. ` : '') +
        'As miniaturas melhoradas aparecem aos poucos.',
      acceptLabel: `Melhorar ${photos}`,
      typed: n > TYPED_CONFIRM_ABOVE ? String(n) : undefined,
    });
    if (!ok) return false;
    this.applying.set(true);
    try {
      const batch = await unwrap(
        this.backend.commands.applyEnhance(library, scope, {
          enabled: true,
          style: this.style(),
          intensity: this.intensity(),
        }),
      );
      this.notify.success('Fotos melhoradas', `${formatCount(batch.count)} ${batch.count === 1 ? 'foto' : 'fotos'}. Dá para desfazer no histórico.`);
      await Promise.all([this.refreshBatches(), this.load(scope)]);
      return true;
    } catch (e) {
      this.notify.error('Não foi possível melhorar as fotos', e);
      return false;
    } finally {
      this.applying.set(false);
    }
  }

  async undo(batch: EditBatch, scope: ArrangeScope): Promise<void> {
    const n = batch.count;
    const ok = await this.confirm.ask({
      header: 'Desfazer a melhoria',
      icon: 'pi pi-undo',
      message: `Voltar ${formatCount(n)} ${n === 1 ? 'foto' : 'fotos'} para como ${n === 1 ? 'estava' : 'estavam'} antes?`,
      detail: 'Fotos que não tinham melhoria voltam ao original; as que já tinham voltam ao ajuste anterior.',
      acceptLabel: 'Desfazer',
      typed: n > TYPED_CONFIRM_ABOVE ? String(n) : undefined,
    });
    if (!ok) return;
    try {
      await unwrap(this.backend.commands.undoEnhance(batch.id));
      this.notify.success('Melhoria desfeita');
      await Promise.all([this.refreshBatches(), this.load(scope)]);
    } catch (e) {
      this.notify.error('Não foi possível desfazer', e);
    }
  }
}
