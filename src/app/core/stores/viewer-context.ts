import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MediaItem, MediaQuery } from '../ipc/ipc';

export interface ViewerContextState {
  /** Gallery the viewer was opened from: its order and filter drive ← → and "12 / 426". */
  query: MediaQuery;
  /** Where Esc / "Voltar" goes. */
  returnUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ViewerContext {
  private readonly router = inject(Router);
  readonly state = signal<ViewerContextState>({ query: {}, returnUrl: '/photos' });
  /** Query of the gallery on screen (set by `GalleryStore`); default for `open`. */
  readonly current = signal<MediaQuery>({});

  /** Open the viewer on `item`, navigating within `query`; Esc returns to this page. */
  open(item: MediaItem, query: MediaQuery = this.current()) {
    this.state.set({ query, returnUrl: this.router.url });
    void this.router.navigate(['/viewer', item.id]);
  }
}
