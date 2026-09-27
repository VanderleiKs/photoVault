import { Routes } from '@angular/router';
import { LibrarySelectorComponent } from './components/library-selector/library-selector.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { PhotoViewerComponent } from './components/photo-viewer/photo-viewer.component';

export const routes: Routes = [
  { path: '', component: LibrarySelectorComponent },
  { path: 'library/:id', component: GalleryComponent },
  { path: 'library/:libraryId/photo/:photoId', component: PhotoViewerComponent },
];
