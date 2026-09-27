import { Routes } from '@angular/router';
import { LibrarySelectorComponent } from './components/library-selector/library-selector.component';
import { GalleryComponent } from './components/gallery/gallery.component';

export const routes: Routes = [
  { path: '', component: LibrarySelectorComponent },
  { path: 'library/:id', component: GalleryComponent },
];
