import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { definePreset } from '@openng/optimus-ui-themes';
import Aura from '@openng/optimus-ui-themes/aura';
import { routes } from './app.routes';
import { AppStore } from './core/stores/app.store';
import { LibraryStore } from './core/stores/library.store';
import { ScanStore } from './core/stores/scan.store';
import { JobStore } from './core/stores/job.store';
import { OrganizeStore } from './core/stores/organize.store';
import { VideoFrameService } from './core/video-frames.service';
import { AiStore } from './core/stores/ai.store';

/** Aura with a blue primary palette. */
const PhotoVaultPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
  },
});

/** Load settings, libraries, any running scan and the analysis queue before the first route renders. */
async function bootstrapStores() {
  const app = inject(AppStore);
  const libraries = inject(LibraryStore);
  const scan = inject(ScanStore);
  const jobs = inject(JobStore);
  const organize = inject(OrganizeStore);
  inject(VideoFrameService).init();
  void inject(AiStore).refresh();
  await app.init();
  await Promise.all([
    libraries.load().catch(() => {}),
    scan.init().catch(() => {}),
    jobs.init().catch(() => {}),
    organize.init().catch(() => {}),
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideOptimus({
      theme: {
        preset: PhotoVaultPreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: { name: 'optimus', order: 'theme, base, optimus, components, utilities' },
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideAppInitializer(bootstrapStores),
  ],
};
