import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Backend } from '../ipc/backend';
import { unwrap, type AppInfo, type AnalysisSettings, type AppSettings } from '../ipc/ipc';
import { NotifyService } from '../notify.service';

/** Same values as `AnalysisSettings::default()` in the core. */
export const DEFAULT_ANALYSIS: AnalysisSettings = {
  visualDistance: 4,
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

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  activeLibraryId: null,
  ioConcurrency: 2,
  cpuConcurrency: 0,
  analysis: DEFAULT_ANALYSIS,
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
