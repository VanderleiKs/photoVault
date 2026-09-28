import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TauriService } from '../../services/tauri.service';
import { Photo } from '../../models/photo';
import { ButtonModule } from '@openng/optimus-ui/button';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="photo-viewer">
      <!-- Header -->
      <header class="d-flex align-items-center justify-content-between px-4 py-3" style="background: var(--pv-surface); border-bottom: 1px solid var(--pv-border);">
        <div class="d-flex align-items-center gap-3">
          <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-secondary" (click)="goBack()"></button>
          <h5 class="fw-semibold mb-0" style="color: var(--pv-text);">{{ photo()?.filename ?? 'Photo' }}</h5>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button pButton type="button" icon="pi pi-minus" class="p-button-text p-button-secondary" (click)="zoomOut()"></button>
          <span class="small" style="color: var(--pv-text-muted);">{{ Math.round(zoom() * 100) }}%</span>
          <button pButton type="button" icon="pi pi-plus" class="p-button-text p-button-secondary" (click)="zoomIn()"></button>
        </div>
      </header>

      <!-- Image -->
      <div class="image-container" (wheel)="onWheel($event)">
        @if (photo(); as p) {
          @if (p.media_type === 'image') {
            <img [src]="imageUrl()" [alt]="p.filename" class="viewer-image" [style.transform]="'scale(' + zoom() + ')'" (click)="cycleZoom()" (error)="onImageError()" />
          } @else {
            <div class="video-placeholder">
              <i class="pi pi-video" style="font-size: 4rem; color: var(--pv-border);"></i>
              <p style="color: var(--pv-text-muted);">Pré-visualização de vídeo ainda não disponível</p>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      @if (photo(); as p) {
        <footer class="px-4 py-3" style="background: var(--pv-surface); border-top: 1px solid var(--pv-border);">
          <div class="d-flex flex-wrap gap-4">
            <div>
              <div class="small" style="color: var(--pv-text-muted);">Arquivo</div>
              <div class="fw-medium" style="color: var(--pv-text);">{{ p.filename }}</div>
            </div>
            <div>
              <div class="small" style="color: var(--pv-text-muted);">Data</div>
              <div class="fw-medium" style="color: var(--pv-text);">{{ formatDate(p.captured_at) }}</div>
            </div>
            <div>
              <div class="small" style="color: var(--pv-text-muted);">Dimensões</div>
              <div class="fw-medium" style="color: var(--pv-text);">{{ p.width ?? '?' }} x {{ p.height ?? '?' }}</div>
            </div>
            <div>
              <div class="small" style="color: var(--pv-text-muted);">Tamanho</div>
              <div class="fw-medium" style="color: var(--pv-text);">{{ formatSize(p.file_size) }}</div>
            </div>
          </div>
        </footer>
      }

      <!-- Navigation Arrows -->
      @if (hasPrev()) {
        <button pButton type="button" icon="pi pi-chevron-left" class="p-button-rounded p-button-secondary nav-arrow nav-arrow-left" (click)="prevPhoto()"></button>
      }
      @if (hasNext()) {
        <button pButton type="button" icon="pi pi-chevron-right" class="p-button-rounded p-button-secondary nav-arrow nav-arrow-right" (click)="nextPhoto()"></button>
      }
    </div>
  `,
  styles: [`
    .photo-viewer { display: flex; flex-direction: column; height: 100vh; background: var(--pv-bg); outline: none; }
    .image-container { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000; position: relative; }
    .viewer-image { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.2s ease; cursor: zoom-in; }
    .video-placeholder { text-align: center; color: var(--pv-text-muted); }
    .nav-arrow { position: fixed; top: 50%; transform: translateY(-50%); z-index: 100; background: var(--pv-surface) !important; border: 1px solid var(--pv-border) !important; }
    .nav-arrow-left { left: 1rem; }
    .nav-arrow-right { right: 1rem; }
    .nav-arrow:hover { background: var(--pv-surface-alt) !important; }
  `],
})
export class PhotoViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tauri = inject(TauriService);

  photo = signal<Photo | null>(null);
  imageUrl = signal<string>('');
  zoom = signal(1);
  readonly Math = Math;

  private libraryId = '';
  private photoId = '';
  private prevId = signal<string | null>(null);
  private nextId = signal<string | null>(null);

  hasPrev() { return this.prevId() !== null; }
  hasNext() { return this.nextId() !== null; }

  async ngOnInit() {
    this.libraryId = this.route.snapshot.paramMap.get('libraryId') || '';
    this.photoId = this.route.snapshot.paramMap.get('photoId') || '';
    if (this.photoId) {
      await this.loadPhotoData(this.photoId);
    }
  }

  private async loadPhotoData(photoId: string) {
    this.photoId = photoId;
    const [photo, nav] = await Promise.all([
      this.tauri.getPhoto(photoId),
      this.tauri.getPhotoNavigation(photoId),
    ]);
    this.photo.set(photo);
    this.prevId.set(nav?.prev_id ?? null);
    this.nextId.set(nav?.next_id ?? null);
    this.zoom.set(1);

    if (photo && photo.media_type === 'image') {
      this.imageUrl.set(this.tauri.mediaUrl(photoId));
    }
  }

  /** The original may be unreadable by the WebView (e.g. HEIC/TIFF): fall back to the thumbnail. */
  onImageError() {
    const thumbnail = this.tauri.thumbnailUrl(this.photoId);
    if (this.imageUrl() !== thumbnail) {
      this.imageUrl.set(thumbnail);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft': this.prevPhoto(); break;
      case 'ArrowRight': this.nextPhoto(); break;
      case 'Escape': this.goBack(); break;
      case '+': case '=': this.zoomIn(); break;
      case '-': this.zoomOut(); break;
      case '0': this.resetZoom(); break;
    }
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
  }

  zoomIn() { this.zoom.update(z => Math.min(z + 0.25, 5)); }
  zoomOut() { this.zoom.update(z => Math.max(z - 0.25, 0.25)); }
  resetZoom() { this.zoom.set(1); }
  cycleZoom() {
    const z = this.zoom();
    this.zoom.set(z === 1 ? 2 : z === 2 ? 3 : 1);
  }

  async prevPhoto() {
    if (this.prevId()) await this.loadPhotoData(this.prevId()!);
  }

  async nextPhoto() {
    if (this.nextId()) await this.loadPhotoData(this.nextId()!);
  }

  goBack() {
    this.router.navigate(['/library', this.libraryId]);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Desconhecida';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}
