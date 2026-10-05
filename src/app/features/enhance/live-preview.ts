import { signal } from '@angular/core';
import { livePreviewUrl } from '../../core/ipc/ipc';
import type { EditRecipe } from '../../core/ipc/ipc';

/** Preview edge while a slider moves (fast) and when it rests (sharp). */
export const DRAG_EDGE = 1024;
export const REST_EDGE = 1600;

/**
 * Live preview of the editor: one render in flight at a time, the latest recipe wins
 * (no fixed debounce: as fast as the backend renders). `send` stores the draft and
 * returns its version; the `<img>` calls `loaded()` when the picture arrived.
 */
export class LivePreview {
  /** URL for the `<img>`; empty until the first draft. */
  readonly src = signal('');

  private pending: { recipe: EditRecipe; edge: number } | null = null;
  private inFlight = false;

  constructor(
    private readonly mediaId: string,
    private readonly send: (recipe: EditRecipe) => Promise<number>,
  ) {}

  /** A new recipe (`resting` = the control was released: render sharp). */
  update(recipe: EditRecipe, resting = true): void {
    this.pending = { recipe, edge: resting ? REST_EDGE : DRAG_EDGE };
    if (!this.inFlight) void this.flush();
  }

  /** The `<img>` finished (or failed) loading the current URL. */
  loaded(): void {
    this.inFlight = false;
    if (this.pending) void this.flush();
  }

  private async flush(): Promise<void> {
    const next = this.pending;
    if (!next) return;
    this.pending = null;
    this.inFlight = true;
    try {
      const version = await this.send(next.recipe);
      this.src.set(livePreviewUrl(this.mediaId, { edge: next.edge, version }));
    } catch {
      this.inFlight = false;
    }
  }
}
