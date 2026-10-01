import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Backend } from '../ipc/backend';
import { unwrap, type AppInfo, type AnalysisSettings, type AppSettings, type ReviewSettings, type EventSettings } from '../ipc/ipc';
import { NotifyService } from '../notify.service';

/** Same values as `AnalysisSettings::default()` in the core. */
export const DEFAULT_ANALYSIS: AnalysisSettings = {
  visualDistance: 4,
  colorDistance: 2,
  similarDistance: 12,
  similarWindowMinutes: 30,
  sequenceGapSeconds: 3,
  sequenceMinSize: 3,
  blurThreshold: 0.075,
  darkThreshold: 45,
  overexposedFraction: 0.25,
  minMegapixels: 1,
  screenshotThreshold: 0.6,
  momentaryThreshold: 0.6,
};

/** Same values as `ReviewSettings::default()` in the core. */
export const DEFAULT_REVIEW: ReviewSettings = {
  weights: {
    exactDuplicate: 1,
    visualDuplicate: 1,
    similarSequence: 0.6,
    blurry: 0.6,
    dark: 0.6,
    overexposed: 0.3,
    lowResolution: 0.3,
    screenshot: 0.6,
    momentary: 0.6,
    accidental: 1,
    lowInformation: 1,
    example: 1,
  },
  exampleSimilarity: 0.7,
  useSystemTrash: false,
  autoPurgeDays: 0,
  autoTrashExact: false,
};

/** Same values as `EventSettings::default()` in the core. */
export const DEFAULT_EVENTS: EventSettings = {
  gapHours: 6,
  tripMinKm: 50,
  tripJoinHours: 48,
  minEventItems: 20,
  minTripItems: 10,
  homes: [],
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  activeLibraryId: null,
  ioConcurrency: 2,
  cpuConcurrency: 0,
  analysis: DEFAULT_ANALYSIS,
  review: DEFAULT_REVIEW,
  events: DEFAULT_EVENTS,
  ai: { enabled: true },
};

/** App-wide info and persisted settings (theme, active library, performance). */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);

  readonly info = signal<AppInfo | null>(null);
  readonly settings = signal<AppSettings>(DEFAULT_SETTINGS);
  readonly ready = signal(false);

  private readonly systemDark = signal(false);
  readonly dark = computed(() => {
    const theme = this.settings().theme;
    return theme === 'dark' || (theme === 'system' && this.systemDark());
  });

  constructor() {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (media) {
      this.systemDark.set(media.matches);
      const onChange = (e: MediaQueryListEvent) => {
        this.systemDark.set(e.matches);
        this.applyTheme();
      };
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
    }
  }

  async init(): Promise<void> {
    try {
      const [info, settings] = await Promise.all([
        unwrap(this.backend.commands.getAppInfo()),
        unwrap(this.backend.commands.getSettings()),
      ]);
      this.info.set(info);
      this.settings.set(settings);
      if (info.archivedLegacyCatalog) {
        this.notify.info(
          'Catálogo atualizado',
          'O catálogo da versão anterior foi arquivado. Suas bibliotecas foram mantidas: escaneie-as novamente.',
        );
      }
    } catch (e) {
      this.notify.error('Não foi possível carregar as configurações', e);
    } finally {
      this.applyTheme();
      this.ready.set(true);
    }
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const next = { ...this.settings(), ...patch };
    try {
      this.settings.set(await unwrap(this.backend.commands.saveSettings(next)));
      this.applyTheme();
    } catch (e) {
      this.notify.error('Não foi possível salvar as configurações', e);
      throw e;
    }
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark-mode', this.dark());
  }
}
