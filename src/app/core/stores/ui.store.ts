import { Injectable, effect, signal } from '@angular/core';

const KEY = 'photovault.ui';

interface UiState {
  sidebarCollapsed: boolean;
  infoPanelOpen: boolean;
  /** Gallery tile edge in px. */
  tileSize: number;
}

const DEFAULTS: UiState = { sidebarCollapsed: false, infoPanelOpen: true, tileSize: 160 };

function load(): UiState {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

/** Layout preferences, persisted in the (portable) WebView storage. */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly initial = load();
  readonly sidebarCollapsed = signal(this.initial.sidebarCollapsed);
  readonly infoPanelOpen = signal(this.initial.infoPanelOpen);
  readonly tileSize = signal(this.initial.tileSize);

  constructor() {
    effect(() => {
      const state: UiState = {
        sidebarCollapsed: this.sidebarCollapsed(),
        infoPanelOpen: this.infoPanelOpen(),
        tileSize: this.tileSize(),
      };
      localStorage.setItem(KEY, JSON.stringify(state));
    });
  }
}
