import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TauriService } from '../../services/tauri.service';
import { Photo, Library } from '../../models/photo';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [SidebarComponent],
  template: `
    <div class="h-screen flex">
      <!-- Sidebar -->
      <app-sidebar [library]="library()" />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="h-14 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div class="flex items-center gap-4">
            <h1 class="text-lg font-semibold">{{ library()?.name ?? 'PhotoVault' }}</h1>
            @if (stats()) {
              <span class="text-sm text-zinc-400">
                {{ stats()!.total_photos }} fotos · {{ stats()!.total_videos }} vídeos
              </span>
            }
          </div>

          <div class="flex items-center gap-3">
            @if (isScanning()) {
              <div class="flex items-center gap-3">
                <span class="text-sm text-zinc-400">
                  Escaneado {{ scanProgress()?.processed ?? 0 }}/{{ scanProgress()?.total ?? '?' }}
                </span>
                <button
                  (click)="cancelScan()"
                  class="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            } @else {
              <button
                (click)="startScan()"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
              >
                Escanear
              </button>
            }
          </div>
        </header>

        <!-- Progress Bar -->
        @if (isScanning() && scanProgress()) {
          <div class="h-1 bg-zinc-800 shrink-0">
            <div
              class="h-full bg-blue-500 transition-all duration-300"
              [style.width.%]="scanProgress()!.total > 0 ? (scanProgress()!.processed / scanProgress()!.total) * 100 : 0"
            ></div>
          </div>
        }

        <!-- Gallery Grid -->
        <div class="flex-1 overflow-y-auto p-6">
          @if (photos().length === 0 && !isScanning()) {
            <div class="h-full flex items-center justify-center">
              <div class="text-center space-y-4">
                <p class="text-zinc-400">Nenhuma foto encontrada.</p>
                <button
                  (click)="startScan()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
                >
                  Escanear Biblioteca
                </button>
              </div>
            </div>
          } @else {
            <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              @for (photo of photos(); track photo.id) {
                <div
                  class="aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition group relative"
                  (click)="openPhoto(photo)"
                >
                  @if (photo.media_type === 'image') {
                    <img
                      [src]="getThumbnailUrl(photo)"
                      [alt]="photo.filename"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                  }

                  <!-- Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <div class="absolute bottom-0 left-0 right-0 p-3">
                      <p class="text-sm font-medium truncate">{{ photo.filename }}</p>
                      @if (photo.captured_at) {
                        <p class="text-xs text-zinc-300">{{ formatDate(photo.captured_at) }}</p>
                      }
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
    // TODO: Open photo viewer
    console.log('Open photo:', photo);
  }

  getThumbnailUrl(photo: Photo): string {
    // In production, this would fetch the thumbnail path from Rust
    // and use Tauri's convertFileSrc to create a valid URL
    // For now, return a placeholder
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
