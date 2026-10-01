import { Injectable, inject } from '@angular/core';
import { formatCount } from '../format';
import { Backend } from '../ipc/backend';
import { unwrap, type Decision, type ExampleIntent, type ReviewReason, type TrashFailure } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { AppStore } from './app.store';
import { LibraryStore } from './library.store';
import { MediaBus } from './media-bus';
import { OrganizeStore } from './organize.store';
import { SelectionStore } from './selection.store';

/** Batches above this need the count typed to confirm (PRD §25). */
export const TYPED_CONFIRM_ABOVE = 500;

const photos = (n: number) => `${formatCount(n)} ${n === 1 ? 'foto' : 'fotos'}`;

/**
 * Edits on media that every screen shares: favorites, review decisions, examples and
 * the trash. Everything that touches files is confirmed first (R3) and reported per file.
 */
@Injectable({ providedIn: 'root' })
export class MediaActions {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly bus = inject(MediaBus);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);
  private readonly selection = inject(SelectionStore);
  private readonly confirm = inject(ConfirmAction);
  private readonly app = inject(AppStore);

  async setFavorite(ids: readonly string[], favorite: boolean): Promise<boolean> {
    if (!ids.length) return false;
    try {
      const items = await unwrap(this.backend.commands.setFavorite([...ids], favorite));
      this.bus.publish(items);
      void this.libraries.refresh();
      if (favorite) this.organize.touch(); // favorites leave the Review list (R5)
      return true;
    } catch (e) {
      this.notify.error('Não foi possível atualizar os favoritos', e);
      return false;
    }
  }

  /** "Manter" / "Ignorar sugestão" / undo, for every pending reason or only `reason`. */
  async decide(ids: readonly string[], decision: Decision, reason: ReviewReason | null = null): Promise<boolean> {
    if (!ids.length) return false;
    try {
      const items = await unwrap(this.backend.commands.decideReview([...ids], decision, reason));
      this.bus.publish(items);
      this.organize.touch();
      if (decision !== 'reopen') {
        this.notify.success(
          decision === 'keep' ? `${photos(ids.length)} mantida${ids.length === 1 ? '' : 's'}` : 'Sugestão ignorada',
          'Não serão sugeridas de novo pelo mesmo motivo.',
        );
      }
      return true;
    } catch (e) {
      this.notify.error('Não foi possível registrar a decisão', e);
      return false;
    }
  }

  /** Send to the trash after confirming. Resolves to the ids that went. */
  async trash(ids: readonly string[]): Promise<string[]> {
    if (!ids.length) return [];
    const system = this.app.settings().review?.useSystemTrash ?? false;
    const ok = await this.confirm.ask({
      header: 'Enviar para a lixeira',
      message: `Enviar ${photos(ids.length)} para a lixeira?`,
      detail: system
        ? 'Os arquivos vão para a lixeira do sistema e saem do catálogo. Para recuperá-los, use a lixeira do Windows ou do Linux.'
        : 'Os arquivos são movidos para a pasta .photovault-trash, dentro da própria biblioteca. Você pode restaurá-los pela tela Lixeira.',
      acceptLabel: 'Enviar para a lixeira',
      icon: 'pi pi-trash',
      danger: true,
      typed: ids.length > TYPED_CONFIRM_ABOVE ? String(ids.length) : undefined,
    });
    if (!ok) return [];
    try {
      const result = await unwrap(this.backend.commands.trashMedia([...ids]));
      if (result.done.length) {
        this.notify.success(`${photos(result.done.length)} na lixeira`, system ? undefined : 'Restaure pela tela Lixeira, se precisar.');
      }
      this.reportFailures('não puderam ir para a lixeira', result.failed);
      this.afterFileChange();
      return result.done;
    } catch (e) {
      this.notify.error('Não foi possível enviar para a lixeira', e);
      return [];
    }
  }

  /** Every exact copy of the library to the trash, keeping the suggested one of each group. */
  async trashExactCopies(): Promise<boolean> {
    const library = this.libraries.activeId();
    if (!library) return false;
    const n = await unwrap(this.backend.commands.countExactCopies(library)).catch(() => 0);
    if (!n) {
      this.notify.success('Nenhuma cópia exata para remover', 'Favoritas e as que você marcou como "Manter" ficam.');
      return false;
    }
    const system = this.app.settings().review?.useSystemTrash ?? false;
    const ok = await this.confirm.ask({
      header: 'Remover as cópias exatas',
      message: `Enviar ${photos(n)} para a lixeira, deixando só a sugerida de cada grupo?`,
      detail:
        'São arquivos idênticos byte a byte à foto que fica. Os álbuns e tags das cópias passam para ela; favoritas e as que você marcou como "Manter" não saem. ' +
        (system ? 'Vão para a lixeira do sistema.' : 'Você pode restaurá-las pela tela Lixeira.'),
      acceptLabel: `Enviar ${photos(n)} para a lixeira`,
      icon: 'pi pi-clone',
      danger: true,
      typed: n > TYPED_CONFIRM_ABOVE ? String(n) : undefined,
    });
    if (!ok) return false;
    try {
      const result = await unwrap(this.backend.commands.trashExactCopies(library));
      if (result.done.length) this.notify.success(`${photos(result.done.length)} na lixeira`, 'Ficou uma foto de cada grupo.');
      this.reportFailures('não puderam ir para a lixeira', result.failed);
      this.afterFileChange();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível remover as cópias', e);
      return false;
    }
  }

  /** Restore; if the original place is taken, offer to restore under another name. */
  async restore(ids: readonly string[]): Promise<boolean> {
    if (!ids.length) return false;
    try {
      let result = await unwrap(this.backend.commands.restoreMedia([...ids], 'ask'));
      let restored = result.restored.length;
      const failed = [...result.failed];
      if (result.conflicts.length) {
        const n = result.conflicts.length;
        const first = result.conflicts[0];
        const rename = await this.confirm.ask({
          header: 'Já existe um arquivo no local original',
          message:
            n === 1
              ? `Já existe um arquivo em "${first.originalPath}".`
              : `${photos(n)} têm um arquivo novo no local original (ex.: "${first.originalPath}").`,
          detail: 'Restaurar com "(restaurada)" no nome? O arquivo que está lá não é alterado.',
          acceptLabel: 'Restaurar com outro nome',
          icon: 'pi pi-copy',
        });
        if (rename) {
          result = await unwrap(this.backend.commands.restoreMedia(result.conflicts.map((c) => c.mediaId), 'rename'));
          restored += result.restored.length;
          failed.push(...result.failed);
        }
      }
      if (restored) this.notify.success(`${photos(restored)} restaurada${restored === 1 ? '' : 's'}`);
      this.reportFailures('não puderam ser restauradas', failed);
      this.afterFileChange();
      return restored > 0;
    } catch (e) {
      this.notify.error('Não foi possível restaurar', e);
      return false;
    }
  }

  /** Delete trashed photos for good: two confirmations. */
  async purge(ids: readonly string[]): Promise<boolean> {
    if (!ids.length) return false;
    if (!(await this.confirmPurge(`Excluir ${photos(ids.length)} definitivamente?`, ids.length))) return false;
    try {
      const result = await unwrap(this.backend.commands.purgeMedia([...ids]));
      if (result.done.length) this.notify.success(`${photos(result.done.length)} excluída${result.done.length === 1 ? '' : 's'} definitivamente`);
      this.reportFailures('não puderam ser excluídas', result.failed);
      this.afterFileChange();
      return result.done.length > 0;
    } catch (e) {
      this.notify.error('Não foi possível excluir', e);
      return false;
    }
  }

  async emptyTrash(libraryId: string, count: number): Promise<boolean> {
    if (!count) return false;
    if (!(await this.confirmPurge(`Esvaziar a lixeira (${photos(count)})?`, count))) return false;
    try {
      const result = await unwrap(this.backend.commands.emptyTrash(libraryId));
      this.notify.success('Lixeira esvaziada', `${photos(result.done.length)} excluída${result.done.length === 1 ? '' : 's'} definitivamente.`);
      this.reportFailures('não puderam ser excluídas', result.failed);
      this.afterFileChange();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível esvaziar a lixeira', e);
      return false;
    }
  }

  /** Photos as examples of what to remove (or never suggest). */
  async addExamples(ids: readonly string[], intent: ExampleIntent): Promise<boolean> {
    if (!ids.length) return false;
    try {
      const added = await unwrap(this.backend.commands.addExamples([...ids], intent));
      this.notify.success(
        intent === 'remove' ? 'Exemplo registrado' : 'Exemplo para manter registrado',
        intent === 'remove'
          ? 'Fotos parecidas vão aparecer na Revisão com o motivo "Parecida com exemplo". Gerencie os exemplos em Configurações.'
          : 'Fotos parecidas com esta não serão sugeridas por exemplo.',
      );
      this.selection.clear();
      return added >= 0;
    } catch (e) {
      this.notify.error('Não foi possível usar como exemplo', e);
      return false;
    }
  }

  private async confirmPurge(message: string, count: number): Promise<boolean> {
    const first = await this.confirm.ask({
      header: 'Excluir definitivamente',
      message,
      detail: 'Os arquivos são apagados do disco.',
      acceptLabel: 'Continuar',
      icon: 'pi pi-trash',
      danger: true,
    });
    if (!first) return false;
    return this.confirm.ask({
      header: 'Tem certeza?',
      message: 'Esta ação não pode ser desfeita: as fotos não poderão ser restauradas.',
      acceptLabel: 'Excluir definitivamente',
      icon: 'pi pi-exclamation-triangle',
      danger: true,
      typed: count > TYPED_CONFIRM_ABOVE ? String(count) : undefined,
    });
  }

  private reportFailures(what: string, failed: TrashFailure[]) {
    if (!failed.length) return;
    const first = failed[0];
    this.notify.error(
      `${photos(failed.length)} ${what}`,
      failed.length === 1 ? `${first.filename}: ${first.message}` : `Ex.: ${first.filename}: ${first.message}`,
    );
  }

  private afterFileChange() {
    this.selection.clear();
    this.organize.touch();
    void this.libraries.refresh();
  }
}
