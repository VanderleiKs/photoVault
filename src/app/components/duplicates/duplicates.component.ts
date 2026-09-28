import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TauriService, useThumbnailPlaceholder } from '../../services/tauri.service';
import { Photo, Library } from '../../models/photo';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';

interface DuplicateGroup {
  id: string;
  photos: Photo[];
}

@Component({
  selector: 'app-duplicates',
  standalone: true,
  imports: [SidebarComponent, ButtonModule, CardModule],
  template: `
    <div class="d-flex h-100">
      <app-sidebar [library]="library()" />
      <div class="flex-grow-1 d-flex flex-column" style="overflow: hidden;">
        <header class="d-flex align-items-center justify-content-between px-4 py-3" style="border-bottom: 1px solid var(--pv-border); flex-shrink: 0;">
          <h5 class="fw-semibold mb-0" style="color: var(--pv-text);">Duplicatas</h5>
          <span class="small" style="color: var(--pv-text-muted);">{{ duplicateGroups().length }} grupos</span>
        </header>
        <div class="flex-grow-1 p-4" style="overflow-y: auto;">
          @for (group of duplicateGroups(); track group.id) {
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="pi pi-copy" style="color: var(--pv-accent);"></i>
                <span class="fw-medium" style="color: var(--pv-text);">{{ group.photos.length }} fotos idênticas</span>
              </div>
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
                          <div class="small" style="color: var(--pv-text-muted); font-size: 0.7rem;">{{ formatSize(photo.file_size) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center" style="padding: 4rem 0;">
              <i class="pi pi-check-circle mb-3" style="font-size: 3rem; color: var(--pv-border);"></i>
              <p style="color: var(--pv-text-muted);">Nenhuma duplicata encontrada.</p>
              <p class="small" style="color: var(--pv-text-muted);">A detecção de duplicatas (SHA-256) chega na próxima fase.</p>
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
export class DuplicatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tauri = inject(TauriService);

  library = signal<Library | null>(null);
  duplicateGroups = signal<DuplicateGroup[]>([]);

  private libraryId = '';

  async ngOnInit() {
    this.libraryId = this.route.snapshot.paramMap.get('id') || '';
    if (this.libraryId) {
      await this.tauri.loadLibraries();
      const libs = this.tauri.libraries();
      this.library.set(libs.find((l: Library) => l.id === this.libraryId) || null);
      await this.loadDuplicates();
    }
  }

  private async loadDuplicates() {
    // Temporary: loads up to 10k photos at once; replaced by backend grouping in phase 4.
    const photos = await this.tauri.fetchPhotos(this.libraryId, 1, 10000);
    
    // Group by sha256 (exact duplicates)
    const groups = new Map<string, Photo[]>();
    
    for (const photo of photos) {
      if (!photo.sha256) continue;
      
      if (!groups.has(photo.sha256)) {
        groups.set(photo.sha256, []);
      }
      groups.get(photo.sha256)!.push(photo);
    }
    
    // Only keep groups with more than 1 photo
    const duplicates = Array.from(groups.entries())
      .filter(([, groupPhotos]) => groupPhotos.length > 1)
      .map(([hash, groupPhotos]) => ({ id: hash, photos: groupPhotos }));
    
    this.duplicateGroups.set(duplicates);
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

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}
