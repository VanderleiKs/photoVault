import { Injectable, OnDestroy, signal } from '@angular/core';
import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  Library,
  LibraryStats,
  Photo,
  PhotoNavigation,
  ScanComplete,
  ScanError,
  ScanProgress,
} from '../models/photo';

/** Single entry point for every IPC call to the Rust backend. */
@Injectable({ providedIn: 'root' })
export class TauriService implements OnDestroy {
  readonly libraries = signal<Library[]>([]);
  readonly photos = signal<Photo[]>([]);
  readonly stats = signal<LibraryStats | null>(null);
  readonly scanProgress = signal<ScanProgress | null>(null);
  readonly isScanning = signal(false);
  /** Last finished scan; components react to it to reload their data. */
  readonly scanCompleted = signal<ScanComplete | null>(null);
  readonly scanError = signal<string | null>(null);

  private readonly unlisteners: Promise<UnlistenFn>[] = [];

  constructor() {
    if (!isTauri()) {
      console.warn('[PhotoVault] Tauri IPC not available - running in browser mode');
      return;
    }

    this.unlisteners.push(
      listen<ScanProgress>('scan_progress', ({ payload }) => {
        this.isScanning.set(true);
        this.scanProgress.set(payload);
      }),
      listen<ScanComplete>('scan_complete', ({ payload }) => {
        this.isScanning.set(false);
        this.scanProgress.set(null);
        this.scanCompleted.set(payload);
        this.getLibraryStats(payload.libraryId).catch(() => {});
      }),
      listen<ScanError>('scan_error', ({ payload }) => {
        this.isScanning.set(false);
        this.scanProgress.set(null);
        this.scanError.set(payload.error);
      }),
    );
  }

  ngOnDestroy() {
    for (const unlisten of this.unlisteners) {
      unlisten.then((fn) => fn());
    }
  }

  /** Invoke a command. Rejects with the backend's error message (a string). */
  private call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri()) {
      return Promise.reject('Tauri IPC não disponível');
    }
    return invoke<T>(cmd, args);
  }

  async loadLibraries(): Promise<void> {
    this.libraries.set(await this.call<Library[]>('list_libraries'));
  }

  async createLibrary(name: string, rootPath: string): Promise<Library> {
    const lib = await this.call<Library>('create_library', { name, rootPath });
    await this.loadLibraries();
    return lib;
  }

  async deleteLibrary(libraryId: string): Promise<void> {
    await this.call('delete_library', { libraryId });
    await this.loadLibraries();
  }

  pickFolder(): Promise<string | null> {
    return this.call<string | null>('pick_folder');
  }

  async getLibraryStats(libraryId: string): Promise<LibraryStats> {
    const stats = await this.call<LibraryStats>('get_library_stats', { libraryId });
    this.stats.set(stats);
    return stats;
  }

  async scanLibrary(libraryId: string): Promise<void> {
    this.scanError.set(null);
    this.scanProgress.set(null);
    this.isScanning.set(true);
    try {
      await this.call('scan_library', { libraryId });
    } catch (err) {
      this.isScanning.set(false);
      this.scanError.set(String(err));
    }
  }

  async cancelScan(): Promise<void> {
    // `isScanning` goes false when the backend emits `scan_complete`.
    await this.call('cancel_scan');
  }

  /** Fetch a page of photos without touching shared state. `page` starts at 1. */
  fetchPhotos(libraryId: string, page = 1, limit = 50): Promise<Photo[]> {
    return this.call<Photo[]>('get_photos', { libraryId, page, limit });
  }

  /** Load a page into the shared `photos` signal (page 1 replaces, others append). */
  async loadPhotos(libraryId: string, page = 1, limit = 50): Promise<Photo[]> {
    const photos = await this.fetchPhotos(libraryId, page, limit);
    if (page === 1) {
      this.photos.set(photos);
    } else {
      this.photos.update((existing) => [...existing, ...photos]);
    }
    return photos;
  }

  getPhoto(photoId: string): Promise<Photo | null> {
    return this.call<Photo | null>('get_photo', { photoId });
  }

  getPhotoNavigation(photoId: string): Promise<PhotoNavigation> {
    return this.call<PhotoNavigation>('get_photo_navigation', { photoId });
  }

  /** URL of the 256px thumbnail, served by the `pv://` protocol. */
  thumbnailUrl(photoId: string): string {
    return isTauri() ? convertFileSrc(`thumb/${photoId}`, 'pv') : PLACEHOLDER_URL;
  }

  /** URL of the original image, served by the `pv://` protocol. */
  mediaUrl(photoId: string): string {
    return isTauri() ? convertFileSrc(`media/${photoId}`, 'pv') : PLACEHOLDER_URL;
  }
}

export const PLACEHOLDER_URL = 'assets/placeholder.svg';

/** `(error)` handler for thumbnails: swap in the placeholder once. */
export function useThumbnailPlaceholder(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (!img.src.endsWith(PLACEHOLDER_URL)) {
    img.src = PLACEHOLDER_URL;
  }
}
