import { Routes } from '@angular/router';
import { LibrarySelectorComponent } from './components/library-selector/library-selector.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { PhotoViewerComponent } from './components/photo-viewer/photo-viewer.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { DuplicatesComponent } from './components/duplicates/duplicates.component';

export const routes: Routes = [
  { path: '', component: LibrarySelectorComponent },
  { path: 'library/:id', component: GalleryComponent },
  { path: 'library/:id/timeline', component: TimelineComponent },
  { path: 'library/:id/duplicates', component: DuplicatesComponent },
  { path: 'library/:libraryId/photo/:photoId', component: PhotoViewerComponent },
];
