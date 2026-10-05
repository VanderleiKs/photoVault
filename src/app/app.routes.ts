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
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'welcome',
        loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage),
      },
      {
        path: 'home',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
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
        path: 'favorites',
        canActivate: [requireLibrary],
        loadComponent: () =>
          import('./features/favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      {
        path: 'albums',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/albums/albums.page').then((m) => m.AlbumsPage),
      },
      {
        path: 'albums/:id',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/albums/album.page').then((m) => m.AlbumPage),
      },
      ...(['duplicates', 'similar'] as const).map((mode) => ({
        path: `organize/${mode}`,
        canActivate: [requireLibrary],
        data: { mode },
        loadComponent: () => import('./features/organize/groups.page').then((m) => m.GroupsPage),
      })),
      ...(['low-quality', 'momentary', 'screenshots'] as const).map((mode) => ({
        path: `organize/${mode}`,
        canActivate: [requireLibrary],
        data: { mode },
        loadComponent: () => import('./features/organize/filtered.page').then((m) => m.FilteredPage),
      })),
      {
        path: 'trips',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/trips/trips.page').then((m) => m.TripsPage),
      },
      {
        path: 'enhance',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/enhance/enhance.page').then((m) => m.EnhancePage),
      },
      {
        path: 'arrange',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/arrange/arrange.page').then((m) => m.ArrangePage),
      },
      {
        path: 'people',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/people/people.page').then((m) => m.PeoplePage),
      },
      {
        path: 'people/:id',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/people/person.page').then((m) => m.PersonPage),
      },
      {
        path: 'trips/:id',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/trips/event.page').then((m) => m.EventPage),
      },
      {
        path: 'review',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/review/review.page').then((m) => m.ReviewPage),
      },
      {
        path: 'trash',
        canActivate: [requireLibrary],
        loadComponent: () => import('./features/trash/trash.page').then((m) => m.TrashPage),
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
      { path: '**', redirectTo: 'home' },
    ],
  },
];
