import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { MediaItem } from '../ipc/ipc';
import { LibraryStore } from './library.store';
import { MediaBus } from './media-bus';

/**
 * What the user is looking at: the focused item (info panel) and the multi-selection
 * (batch actions). Shared by every gallery.
 */
@Injectable({ providedIn: 'root' })
export class SelectionStore {
  private readonly bus = inject(MediaBus);

  /** Item shown in the info panel. */
  readonly focused = signal<MediaItem | null>(null);
  readonly focusedId = computed(() => this.focused()?.id ?? null);

  /** Multi-selection (ids); non-empty = selection mode. */
  readonly ids = signal<ReadonlySet<string>>(new Set());
  readonly count = computed(() => this.ids().size);
  readonly active = computed(() => this.ids().size > 0);
  /** Last item clicked, for shift+click ranges. */
  private anchor: string | null = null;

  constructor() {
    this.bus.subscribe((update) => {
      const focused = this.focused();
      if (focused) {
        const fresh = update.items.find((m) => m.id === focused.id);
        if (update.removedIds.includes(focused.id)) this.focused.set(null);
        else if (fresh) this.focused.set(fresh);
      }
      const removed = update.removedIds.filter((id) => this.ids().has(id));
      if (removed.length) this.ids.update((s) => without(s, removed));
    });
    // Another library: nothing selected there.
    const libraries = inject(LibraryStore);
    effect(() => {
      libraries.activeId();
      untracked(() => this.clear(true));
    });
  }

  focus(item: MediaItem | null) {
    this.focused.set(item);
    if (item) this.anchor = item.id;
  }

  isSelected(id: string) {
    return this.ids().has(id);
  }

  toggle(id: string) {
    this.ids.update((s) => (s.has(id) ? without(s, [id]) : new Set([...s, id])));
    this.anchor = id;
  }

  /** Select everything between the anchor and `id` in `order` (shift+click). */
  extendTo(id: string, order: readonly MediaItem[]) {
    const from = order.findIndex((m) => m.id === (this.anchor ?? id));
    const to = order.findIndex((m) => m.id === id);
    if (from < 0 || to < 0) return this.toggle(id);
    const [lo, hi] = from < to ? [from, to] : [to, from];
    this.ids.update((s) => new Set([...s, ...order.slice(lo, hi + 1).map((m) => m.id)]));
    this.anchor = id;
  }

  selectAll(items: readonly MediaItem[]) {
    this.ids.set(new Set(items.map((m) => m.id)));
  }

  /** Clears the multi-selection (and the focus with `all`). */
  clear(all = false) {
    if (this.ids().size) this.ids.set(new Set());
    if (all) this.focused.set(null);
    this.anchor = null;
  }
}

function without(set: ReadonlySet<string>, ids: string[]): Set<string> {
  const next = new Set(set);
  for (const id of ids) next.delete(id);
  return next;
}
