import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TauriService } from '../../services/tauri.service';
import { Photo, Library } from '../../models/photo';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [SidebarComponent, ButtonModule, CardModule, ProgressBarModule],
  template: `
    <div class="d-flex h-100">
      <!-- Sidebar -->
      <app-sidebar [library]="library()" />

      <!-- Main Content -->
      <div class="flex-grow-1 d-flex flex-column" style="overflow: hidden;">
        <!-- Header -->
        <header class="d-flex align-items-center justify-content-between px-4 py-3" style="border-bottom: 1px solid var(--pv-border); flex-shrink: 0;">
          <div class="d-flex align-items-center gap-3">
            <h5 class="fw-semibold mb-0" style="color: var(--pv-text);">{{ library()?.name ?? 'PhotoVault' }}</h5>
            @if (stats()) {
              <span class="small" style="color: var(--pv-text-muted);">
                {{ stats()!.total_photos }} fotos · {{ stats()!.total_videos }} vídeos
              </span>
            }
          </div>

          <div class="d-flex align-items-center gap-2">
            @if (isScanning()) {
              <div class="d-flex align-items-center gap-2">
                <span class="small" style="color: var(--pv-text-muted);">
                  Escaneado {{ scanProgress()?.processed ?? 0 }}/{{ scanProgress()?.total ?? '?' }}
                </span>
                <button
                  pButton
                  type="button"
                  label="Cancelar"
                  icon="pi pi-times"
                  class="p-button-danger p-button-sm"
                  (click)="cancelScan()"
                ></button>
              </div>
            } @else {
              <button
                pButton
                type="button"
                label="Escanear"
                icon="pi pi-refresh"
                class="p-button-primary p-button-sm"
                (click)="startScan()"
              ></button>
            }
          </div>
        </header>

        <!-- Progress Bar -->
        @if (isScanning() && scanProgress()) {
          <div style="height: 2px; background: var(--pv-border); flex-shrink: 0;">
            <div
              style="height: 100%; background: var(--pv-accent); transition: width 0.3s;"
              [style.width.%]="scanProgress()!.total > 0 ? (scanProgress()!.processed / scanProgress()!.total) * 100 : 0"
            ></div>
          </div>
        }

        <!-- Gallery Grid -->
        <div class="flex-grow-1 p-4" style="overflow-y: auto;">
          @if (photos().length === 0 && !isScanning()) {
            <div class="h-100 d-flex align-items-center justify-content-center">
              <div class="text-center">
                <i class="pi pi-images mb-3" style="font-size: 3rem; color: var(--pv-border);"></i>
                <p class="mb-3" style="color: var(--pv-text-muted);">Nenhuma foto encontrada.</p>
                <button
                  pButton
                  type="button"
                  label="Escanear Biblioteca"
                  icon="pi pi-refresh"
                  class="p-button-primary"
                  (click)="startScan()"
                ></button>
              </div>
            </div>
          } @else {
            <div class="row g-3">
              @for (photo of photos(); track photo.id) {
                <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                  <div
                    class="p-card shadow-sm"
                    style="cursor: pointer; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;"
                    (click)="openPhoto(photo)"
                    (mouseenter)="photoHover = photo.id"
                    (mouseleave)="photoHover = null"
                    [style.transform]="photoHover === photo.id ? 'scale(1.02)' : 'scale(1)'"
                    [style.box-shadow]="photoHover === photo.id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'"
                  >
                    <div class="p-card-body p-0">
                      <div class="d-flex align-items-center justify-content-center" style="aspect-ratio: 1; background: var(--pv-surface-alt);">
                        @if (photo.media_type === 'image') {
                          <img
                            [src]="getThumbnailUrl(photo)"
                            [alt]="photo.filename"
                            class="w-100 h-100"
                            style="object-fit: cover;"
                            loading="lazy"
                          />
                        } @else {
                          <i class="pi pi-video" style="font-size: 2rem; color: var(--pv-border);"></i>
                        }
                      </div>
                      <div class="p-2">
                        <div class="small fw-medium text-truncate" style="color: var(--pv-text);">{{ photo.filename }}</div>
                        @if (photo.captured_at) {
                          <div class="small" style="color: var(--pv-text-muted); font-size: 0.7rem;">{{ formatDate(photo.captured_at) }}</div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class GalleryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tauri = inject(TauriService);

  library = signal<Library | null>(null);
  photos = this.tauri.photos;
  stats = this.tauri.stats;
  isScanning = this.tauri.isScanning;
  scanProgress = this.tauri.scanProgress;
  photoHover: string | null = '';

  private libraryId = '';

  async ngOnInit() {
    this.libraryId = this.route.snapshot.paramMap.get('id') || '';
    if (this.libraryId) {
      await this.loadLibrary();
      await this.tauri.getLibraryStats(this.libraryId);
      await this.tauri.loadPhotos(this.libraryId);
    }
  }

  private async loadLibrary() {
    await this.tauri.loadLibraries();
    const libs = this.tauri.libraries();
    this.library.set(libs.find((l: Library) => l.id === this.libraryId) || null);
  }

  async startScan() {
    await this.tauri.scanLibrary(this.libraryId);
  }

  async cancelScan() {
    await this.tauri.cancelScan();
  }

  openPhoto(photo: Photo) {
    console.log('Open photo:', photo);
  }

  getThumbnailUrl(photo: Photo): string {
    return `http://localhost:4200/assets/placeholder.svg`;
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }
}
