import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import type { RestoreResult, TrashResult } from '../ipc/ipc';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { fakeBackend, ok, pretendTauri } from '../testing/fake-backend';
import { MediaActions } from './media-actions.service';

describe('MediaActions (trash)', () => {
  beforeEach(pretendTauri);

  function setup(commands: Record<string, (...args: never[]) => unknown>) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        fakeBackend({
          listLibraries: () => ok([]),
          getOrganizeCounts: () => ok(null),
          ...commands,
        }),
      ],
    });
    return { actions: TestBed.inject(MediaActions), confirm: TestBed.inject(ConfirmAction) };
  }

  /** Answer the next question once it is asked. */
  async function answer(confirm: ConfirmAction, ok: boolean, typed?: (text: string | undefined) => void) {
    await new Promise((r) => setTimeout(r));
    typed?.(confirm.current()?.typed);
    confirm.answer(ok);
  }

  it('asks before trashing and does nothing when cancelled', async () => {
    const sent: string[][] = [];
    const { actions, confirm } = setup({
      trashMedia: (ids: string[]) => {
        sent.push(ids);
        return ok<TrashResult>({ done: ids, failed: [] });
      },
    });

    const cancelled = actions.trash(['a', 'b']);
    await answer(confirm, false);
    expect(await cancelled).toEqual([]);
    expect(sent).toEqual([]);

    const accepted = actions.trash(['a', 'b']);
    await answer(confirm, true);
    expect(await accepted).toEqual(['a', 'b']);
    expect(sent).toEqual([['a', 'b']]);
  });

  it('makes large batches type the count', async () => {
    const { actions, confirm } = setup({ trashMedia: (ids: string[]) => ok<TrashResult>({ done: ids, failed: [] }) });
    const ids = Array.from({ length: 501 }, (_, i) => `m${i}`);
    let typed: string | undefined;
    const done = actions.trash(ids);
    await answer(confirm, true, (t) => (typed = t));
    expect(typed).toBe('501');
    expect((await done).length).toBe(501);
  });

  it('offers to restore under another name when the original place is taken', async () => {
    const calls: [string[], string][] = [];
    const { actions, confirm } = setup({
      restoreMedia: (ids: string[], onConflict: string) => {
        calls.push([ids, onConflict]);
        return ok<RestoreResult>(
          onConflict === 'ask'
            ? { restored: ['a'], conflicts: [{ mediaId: 'b', filename: 'b.jpg', originalPath: 'fotos/b.jpg' }], failed: [] }
            : { restored: ids, conflicts: [], failed: [] },
        );
      },
    });
    const restored = actions.restore(['a', 'b']);
    await answer(confirm, true);
    expect(await restored).toBe(true);
    expect(calls).toEqual([
      [['a', 'b'], 'ask'],
      [['b'], 'rename'],
    ]);
  });
});
