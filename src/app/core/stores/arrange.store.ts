import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { formatCount } from '../format';
import { Backend } from '../ipc/backend';
import { unwrap, type ArrangeBatch, type ArrangeItem, type ArrangePreview, type ArrangeRule, type ArrangeScope } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { LibraryStore } from './library.store';
import { TYPED_CONFIRM_ABOVE } from './media-actions.service';
import { OrganizeStore } from './organize.store';

const POLL_MS = 700;
const PREVIEW_ITEMS = 300;

/** "Organizar pastas" (PRD §24): preview, confirmation, progress, undo, history. */
@Injectable({ providedIn: 'root' })
export class ArrangeStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmAction);
  private readonly libraries = inject(LibraryStore);
  private readonly counters = inject(OrganizeStore);

  readonly preview = signal<ArrangePreview | null>(null);
  readonly previewError = signal<string | null>(null);
  readonly previewing = signal(false);
  readonly history = signal<ArrangeBatch[]>([]);
  /** Running, paused or being undone (one per library). */
  readonly current = computed(() => this.history().find((b) => ['running', 'paused', 'undoing', 'undo_paused'].includes(b.status)) ?? null);
  readonly busy = computed(() => {
    const s = this.current()?.status;
    return s === 'running' || s === 'undoing';
  });

  private timer: ReturnType<typeof setTimeout> | undefined;
  private previewSeq = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    effect(() => {
      const library = this.libraries.activeId();
      untracked(() => void this.refresh(library));
    });
  }

  async refresh(libraryId = this.libraries.activeId()): Promise<void> {
    clearTimeout(this.timer);
    if (!libraryId || !isTauri()) {
      this.history.set([]);
      return;
    }
    const before = this.current();
    try {
      this.history.set(await unwrap(this.backend.commands.listArrangeBatches(libraryId)));
    } catch {
      return;
    }
    const now = this.history().find((b) => b.id === before?.id);
    if (before && (before.status === 'running' || before.status === 'undoing') && now && now.status !== before.status) this.ended(now);
    if (this.busy()) this.timer = setTimeout(() => void this.refresh(), POLL_MS);
  }

  /** Before → after for the rule (nothing touched). Latest call wins. */
  async loadPreview(rule: ArrangeRule, scope: ArrangeScope): Promise<void> {
    const library = this.libraries.activeId();
    if (!library || !isTauri()) return;
    const seq = ++this.previewSeq;
    this.previewing.set(true);
    try {
      const p = await unwrap(this.backend.commands.previewArrange(library, rule, scope, PREVIEW_ITEMS));
      if (seq !== this.previewSeq) return;
      this.preview.set(p);
      this.previewError.set(null);
    } catch (e) {
      if (seq !== this.previewSeq) return;
      this.preview.set(null);
      this.previewError.set(e instanceof Error ? e.message : String(e));
    } finally {
      if (seq === this.previewSeq) this.previewing.set(false);
    }
  }

  /** Plans again (the library may have changed), asks, then moves the files. */
  async organize(rule: ArrangeRule, scope: ArrangeScope): Promise<void> {
    const library = this.libraries.activeId();
    if (!library) return;
    let batch: ArrangeBatch;
    try {
      batch = await unwrap(this.backend.commands.createArrange(library, rule, scope));
    } catch (e) {
      this.notify.error('Não foi possível planejar', e);
      return;
    }
    const n = batch.total;
    const files = `${formatCount(n)} ${n === 1 ? 'arquivo' : 'arquivos'}`;
    const ok = await this.confirm.ask({
      header: 'Organizar os arquivos no disco',
      icon: 'pi pi-folder-open',
      message: `Mover e renomear ${files} dentro da pasta da biblioteca, como na prévia?`,
      detail:
        (batch.sidecars ? `${formatCount(batch.sidecars)} arquivos que acompanham as fotos (.xmp, .aae, .json) vão junto. ` : '') +
        'Nada é apagado nem sobrescrito. Cada arquivo fica registrado, e você pode desfazer tudo depois. Se o disco for desconectado, a organização pausa e continua quando ele voltar.',
      acceptLabel: `Organizar ${files}`,
      typed: n > TYPED_CONFIRM_ABOVE ? String(n) : undefined,
    });
    if (!ok) {
      await unwrap(this.backend.commands.discardArrange(batch.id)).catch(() => {});
      return;
    }
    await this.start(batch.id, false);
  }

  async resume(batch: ArrangeBatch): Promise<void> {
    await this.start(batch.id, batch.status === 'undo_paused');
  }

  async pause(batch: ArrangeBatch): Promise<void> {
    await unwrap(this.backend.commands.pauseArrange(batch.id)).catch(() => {});
    void this.refresh();
  }

  async undo(batch: ArrangeBatch): Promise<void> {
    const n = batch.done;
    const ok = await this.confirm.ask({
      header: 'Desfazer a organização',
      icon: 'pi pi-undo',
      message: `Devolver ${formatCount(n)} ${n === 1 ? 'arquivo' : 'arquivos'} para onde ${n === 1 ? 'estava' : 'estavam'}, com os nomes de antes?`,
      detail: 'As pastas criadas pela organização são removidas se ficarem vazias. Um arquivo cujo lugar original estiver ocupado fica onde está (e é avisado).',
      acceptLabel: 'Desfazer',
      typed: n > TYPED_CONFIRM_ABOVE ? String(n) : undefined,
    });
    if (ok) await this.start(batch.id, true);
  }

  async failures(batch: ArrangeBatch): Promise<ArrangeItem[]> {
    const status = batch.status === 'undo_paused' ? 'done' : 'failed';
    return unwrap(this.backend.commands.listArrangeItems(batch.id, status, 0, 500)).catch(() => []);
  }

  private async start(batchId: string, undo: boolean) {
    try {
      await unwrap(undo ? this.backend.commands.undoArrange(batchId) : this.backend.commands.startArrange(batchId));
    } catch (e) {
      this.notify.error(undo ? 'Não foi possível desfazer' : 'Não foi possível organizar', e);
    }
    await this.refresh();
    const b = this.history().find((h) => h.id === batchId);
    // A small batch may be over already; otherwise it may still be starting: keep watching.
    if (b && ['done', 'undone', 'paused', 'undo_paused'].includes(b.status)) this.ended(b);
    else if (!this.busy()) this.timer = setTimeout(() => void this.refresh(), POLL_MS);
  }

  private ended(b: ArrangeBatch) {
    this.counters.touch();
    this.preview.set(null);
    const problems = b.failed ? ` ${formatCount(b.failed)} não puderam ser movidos: veja os detalhes.` : '';
    switch (b.status) {
      case 'done':
        this.notify.success('Arquivos organizados', `${formatCount(b.done)} ${b.done === 1 ? 'arquivo movido' : 'arquivos movidos'}.${problems}`);
        break;
      case 'undone':
        this.notify.success('Organização desfeita', 'Os arquivos voltaram para onde estavam.');
        break;
      case 'paused':
      case 'undo_paused':
        if (b.message) this.notify.error('Organização pausada', b.message);
        break;
    }
  }
}
