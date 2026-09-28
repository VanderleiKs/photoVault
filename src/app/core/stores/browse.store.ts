import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { MediaFilter, MediaQuery, MediaSort } from '../ipc/ipc';
import { compactFilter } from './gallery.store';
import { LibraryStore } from './library.store';

const KEY = 'photovault.browse.';

interface Saved {
  filter: MediaFilter;
  sort: MediaSort;
}

function load(libraryId: string): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY + libraryId) ?? '{}') as Partial<Saved>;
    return { filter: compactFilter(saved.filter ?? {}), sort: saved.sort ?? 'newest' };
  } catch {
    return { filter: {}, sort: 'newest' };
  }
}

/**
 * Filters and sort of "Todas as fotos", persisted per library (PRD §19), plus the
 * global search text (Ctrl+K), which is not persisted.
 */
@Injectable({ providedIn: 'root' })
export class BrowseStore {
  private readonly libraries = inject(LibraryStore);

  readonly filter = signal<MediaFilter>({});
  /** Smart album whose rule is being edited with these filters (see `editRule`). */
  readonly editing = signal<{ id: string; name: string; before: Saved } | null>(null);
  readonly sort = signal<MediaSort>('newest');
  readonly text = signal('');

  readonly query = computed<MediaQuery>(() => {
    const text = this.text().trim();
    return { filter: compactFilter({ ...this.filter(), text: text || null }), sort: this.sort() };
  });
  /** Filters or search active (for "Limpar" and "Salvar como álbum inteligente"). */
  readonly filtered = computed(() => Object.keys(this.query().filter ?? {}).length > 0);

  private loadedFor: string | null = null;

  constructor() {
    effect(() => {
      const id = this.libraries.activeId();
      untracked(() => {
        this.editing.set(null);
        this.loadedFor = id;
        const saved = id ? load(id) : { filter: {}, sort: 'newest' as const };
        this.filter.set(saved.filter);
        this.sort.set(saved.sort);
        this.text.set('');
      });
    });
    effect(() => {
      const saved: Saved = { filter: compactFilter(this.filter()), sort: this.sort() };
      // A rule being edited is not the user's browsing state.
      if (this.loadedFor && !this.editing()) localStorage.setItem(KEY + this.loadedFor, JSON.stringify(saved));
    });
  }

  /** Merge into the filter; `null`/`undefined` fields are removed. */
  patch(patch: MediaFilter) {
    this.filter.update((f) => compactFilter({ ...f, ...patch }));
  }

  clear() {
    this.filter.set({});
    this.text.set('');
  }

  /** Load a smart album's rule into the filters so it can be edited visually. */
  editRule(album: { id: string; name: string; rule: MediaFilter | null }) {
    const rule = { ...(album.rule ?? {}) };
    const text = rule.text ?? '';
    delete rule.text;
    this.editing.set({ id: album.id, name: album.name, before: { filter: this.filter(), sort: this.sort() } });
    this.filter.set(compactFilter(rule));
    this.text.set(text);
  }

  /** Leave rule editing, restoring the filters the user had before. */
  endEditing() {
    const editing = this.editing();
    if (!editing) return;
    this.editing.set(null);
    this.filter.set(editing.before.filter);
    this.sort.set(editing.before.sort);
    this.text.set('');
  }
}
