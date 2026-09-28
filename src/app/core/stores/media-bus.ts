import { Injectable, effect, signal, untracked } from '@angular/core';
import type { MediaItem } from '../ipc/ipc';

export interface MediaUpdate {
  items: MediaItem[];
  /** Ids that no longer exist (merged into another record). */
  removedIds: string[];
}

/** Entries kept for consumers that fall behind between two change-detection runs. */
const LOG_SIZE = 500;

/**
 * Stream of "these items changed": analysis results from the backend and local
 * edits (favorites). Galleries, the selection and the viewer patch their copies.
 *
 * A signal only holds the latest value, so two publications before effects run would
 * lose the first. Updates are therefore logged with a sequence number and each
 * subscriber receives everything since its last run, merged.
 */
@Injectable({ providedIn: 'root' })
export class MediaBus {
  private readonly log: { seq: number; update: MediaUpdate }[] = [];
  private seq = 0;
  /** Bumps on every publication. */
  readonly version = signal(0);

  publish(items: MediaItem[], removedIds: string[] = []) {
    if (!items.length && !removedIds.length) return;
    this.log.push({ seq: ++this.seq, update: { items, removedIds } });
    if (this.log.length > LOG_SIZE) this.log.shift();
    this.version.set(this.seq);
  }

  /** Everything published after `seq`, merged (later edits win; removals stick). */
  since(seq: number): MediaUpdate {
    const items = new Map<string, MediaItem>();
    const removed = new Set<string>();
    for (const entry of this.log) {
      if (entry.seq <= seq) continue;
      for (const item of entry.update.items) items.set(item.id, item);
      for (const id of entry.update.removedIds) removed.add(id);
    }
    for (const id of removed) items.delete(id);
    return { items: [...items.values()], removedIds: [...removed] };
  }

  /** Call `handler` with the merged updates (injection context: creates an effect). */
  subscribe(handler: (update: MediaUpdate) => void) {
    let seen = this.seq;
    effect(() => {
      const version = this.version();
      if (version === seen) return;
      const update = this.since(seen);
      seen = version;
      untracked(() => handler(update));
    });
  }
}
