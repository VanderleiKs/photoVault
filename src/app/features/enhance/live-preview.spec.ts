import { LivePreview } from './live-preview';
import type { EditRecipe } from '../../core/ipc/ipc';

const recipe = (exposure: number) => ({ adjust: { exposure } }) as unknown as EditRecipe;

describe('LivePreview', () => {
  (globalThis as { isTauri?: boolean }).isTauri = true;

  it('keeps one render in flight and sends only the latest recipe after it', async () => {
    const sent: number[] = [];
    let version = 0;
    const live = new LivePreview('m1', async (r) => {
      sent.push(r.adjust?.exposure ?? 0);
      return ++version;
    });
    live.update(recipe(1), false);
    live.update(recipe(2), false);
    live.update(recipe(3), true);
    await Promise.resolve();
    await Promise.resolve();
    expect(sent).toEqual([1]);
    live.loaded();
    await Promise.resolve();
    await Promise.resolve();
    // The intermediate recipe (2) was skipped.
    expect(sent).toEqual([1, 3]);
    live.loaded();
    expect(sent).toEqual([1, 3]);
  });
});
