import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LibraryStore } from './core/stores/library.store';
import { COMING_SOON } from './layout/nav';
import { ShellComponent } from './layout/shell.component';

/** Library-scoped pages need at least one library; otherwise go to onboarding. */
const requireLibrary: CanActivateFn = () => {
  const libraries = inject(LibraryStore);
  return libraries.libraries().length > 0 || inject(Router).createUrlTree(['/welcome']);
};

export const routes: Routes = [
  {
    path: 'viewer/:id',
    canActivate: [requireLibrary],
    loadComponent: () => import('./features/viewer/viewer.page').then((m) => m.ViewerPage),
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'photos' },
      {
        path: 'welcome',
        loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage),
      },
      {
        path: 'photos',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/photos/photos.page').then((m) => m.PhotosPage),
      },
      {
        path: 'timeline',
        canActivate: [requireLibrary],
        loadComponent: () =>
          import('./features/timeline/timeline.page').then((m) => m.TimelinePage),
      },
      {
        path: 'libraries',
        loadComponent: () =>
          import('./features/libraries/libraries.page').then((m) => m.LibrariesPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      ...COMING_SOON.map((item) => ({
        path: item.route.slice(1),
        data: { item },
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
      })),
      { path: '**', redirectTo: 'photos' },
    ],
  },
];
