import {
  Component,
  OnInit,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TauriService } from '../../services/tauri.service';
import { Photo, Library } from '../../models/photo';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [SidebarComponent, ButtonModule, CardModule],
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
                    class="p-card shadow-sm photo-card"
                    #photoCard
                    [attr.data-photo-id]="photo.id"
                    (click)="openPhoto(photo)"
                  >
                    <div class="p-card-body p-0">
                      <div class="photo-thumbnail">
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
  styles: [`
    .photo-card {
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .photo-card:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .photo-thumbnail {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      background: var(--pv-surface-alt);
    }
  `],
})
export class GalleryComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private tauri = inject(TauriService);

  library = signal<Library | null>(null);
  photos = this.tauri.photos;
  stats = this.tauri.stats;
  isScanning = this.tauri.isScanning;
  scanProgress = this.tauri.scanProgress;

  @ViewChildren('photoCard') photoCards!: QueryList<ElementRef>;

  private libraryId = '';
  private thumbnailCache = new Map<string, string>();
  private observer: IntersectionObserver | null = null;
  private loadingThumbnails = new Set<string>();

  async ngOnInit() {
    this.libraryId = this.route.snapshot.paramMap.get('id') || '';
    if (this.libraryId) {
      await this.loadLibrary();
      await this.tauri.getLibraryStats(this.libraryId);
      await this.tauri.loadPhotos(this.libraryId);
    }
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
    this.observeCards();

    // Re-observe when photos change
    this.photoCards.changes.subscribe(() => {
      this.observeCards();
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const photoId = entry.target.getAttribute('data-photo-id');
            if (photoId) {
              this.loadThumbnail(photoId);
            }
          }
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );
  }

  private observeCards() {
    if (!this.observer) return;
    const cards = this.photoCards?.toArray() ?? [];
    cards.forEach((card) => this.observer!.observe(card.nativeElement));
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
    // TODO: Implement photo viewer
    console.log('Open photo:', photo);
  }

  getThumbnailUrl(photo: Photo): string {
    const cached = this.thumbnailCache.get(photo.id);
    if (cached) {
      return cached;
    }
    return 'assets/placeholder.svg';
  }

  private async loadThumbnail(photoId: string) {
    if (this.loadingThumbnails.has(photoId)) return;
    this.loadingThumbnails.add(photoId);

    try {
      const dataUrl = await this.tauri.getThumbnailDataUrl(photoId);
      if (dataUrl) {
        this.thumbnailCache.set(photoId, dataUrl);
        this.photos.update(p => [...p]);
      }
    } catch (err) {
      console.error('Failed to load thumbnail:', err);
    } finally {
      this.loadingThumbnails.delete(photoId);
    }
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
