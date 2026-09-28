import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TauriService, useThumbnailPlaceholder } from '../../services/tauri.service';
import { Photo, Library } from '../../models/photo';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';

interface TimelineGroup {
  year: number;
  month: number;
  monthName: string;
  photos: Photo[];
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [SidebarComponent, ButtonModule, CardModule],
  template: `
    <div class="d-flex h-100">
      <app-sidebar [library]="library()" />
      <div class="flex-grow-1 d-flex flex-column" style="overflow: hidden;">
        <header class="d-flex align-items-center justify-content-between px-4 py-3" style="border-bottom: 1px solid var(--pv-border); flex-shrink: 0;">
          <h5 class="fw-semibold mb-0" style="color: var(--pv-text);">Timeline</h5>
        </header>
        <div class="flex-grow-1 p-4" style="overflow-y: auto;">
          @for (group of timelineGroups(); track group.year + '-' + group.month) {
            <div class="mb-4">
              <h6 class="fw-semibold mb-3" style="color: var(--pv-text);">{{ group.monthName }} {{ group.year }}</h6>
              <div class="row g-3">
                @for (photo of group.photos; track photo.id) {
                  <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                    <div class="p-card shadow-sm photo-card" (click)="openPhoto(photo)">
                      <div class="p-card-body p-0">
                        <div class="photo-thumbnail">
                          @if (photo.media_type === 'image') {
                            <img [src]="thumbnailUrl(photo)" [alt]="photo.filename" class="w-100 h-100" style="object-fit: cover;" loading="lazy" decoding="async" (error)="onThumbnailError($event)" />
                          } @else {
                            <i class="pi pi-video" style="font-size: 2rem; color: var(--pv-border);"></i>
                          }
                        </div>
                        <div class="p-2">
                          <div class="small fw-medium text-truncate" style="color: var(--pv-text);">{{ photo.filename }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center" style="padding: 4rem 0;">
              <i class="pi pi-calendar mb-3" style="font-size: 3rem; color: var(--pv-border);"></i>
              <p style="color: var(--pv-text-muted);">Nenhuma foto na timeline.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .photo-card { cursor: pointer; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .photo-card:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .photo-thumbnail { display: flex; align-items: center; justify-content: center; aspect-ratio: 1; background: var(--pv-surface-alt); }
  `],
})
export class TimelineComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tauri = inject(TauriService);

  library = signal<Library | null>(null);
  photos = signal<Photo[]>([]);
  timelineGroups = signal<TimelineGroup[]>([]);

  private libraryId = '';

  async ngOnInit() {
    this.libraryId = this.route.snapshot.paramMap.get('id') || '';
    if (this.libraryId) {
      await this.tauri.loadLibraries();
      const libs = this.tauri.libraries();
      this.library.set(libs.find((l: Library) => l.id === this.libraryId) || null);
      await this.loadPhotos();
    }
  }

  private async loadPhotos() {
    // Temporary: loads up to 10k photos at once; replaced by a paginated timeline in phase 3.
    this.photos.set(await this.tauri.fetchPhotos(this.libraryId, 1, 10000));
    this.groupByDate();
  }

  private groupByDate() {
    const groups = new Map<string, TimelineGroup>();
    
    for (const photo of this.photos()) {
      if (!photo.captured_at) continue;
      
      const date = new Date(photo.captured_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = year + '-' + month;
      
      if (!groups.has(key)) {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        groups.set(key, { year, month, monthName: monthNames[month], photos: [] });
      }
      
      groups.get(key)!.photos.push(photo);
    }
    
    // Sort groups by year/month descending
    const sorted = Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    this.timelineGroups.set(sorted);
  }

  thumbnailUrl(photo: Photo): string {
    return this.tauri.thumbnailUrl(photo.id);
  }

  onThumbnailError(event: Event) {
    useThumbnailPlaceholder(event);
  }

  openPhoto(photo: Photo) {
    this.router.navigate(['/library', this.libraryId, 'photo', photo.id]);
  }
}
