import { Injectable, signal, OnDestroy } from '@angular/core';
import type { Photo, Library, LibraryStats, ScanProgress, ScanComplete } from '../models/photo';

@Injectable({ providedIn: 'root' })
export class TauriService implements OnDestroy {
  private readonly invoke = (window as any).__TAURI_INTERNALS__?.invoke;
  private readonly event = (window as any).__TAURI_INTERNALS__?.event;

  readonly libraries = signal<Library[]>([]);
  readonly currentLibrary = signal<Library | null>(null);
  readonly photos = signal<Photo[]>([]);
  readonly stats = signal<LibraryStats | null>(null);
  readonly scanProgress = signal<ScanProgress | null>(null);
  readonly isScanning = signal(false);

  private thumbnailQueue: string[] = [];
  private activeThumbnailRequests = 0;
  private readonly maxConcurrentThumbnails = 5;
  private unlistenProgress?: () => void;
  private unlistenComplete?: () => void;
  private unlistenError?: () => void;
  private listenersRegistered = false;

  constructor() {
    this.checkAvailability();
    this.registerEventListeners();
  }

  private checkAvailability() {
    if (!this.invoke) {
      console.warn('Tauri IPC not available - running in browser mode');
    }
  }

  private registerEventListeners() {
    if (this.listenersRegistered || !this.event) return;
    this.listenersRegistered = true;

    this.event.listen('scan_progress', (event: any) => {
      this.scanProgress.set(event.payload as ScanProgress);
    }).then((unlisten: () => void) => { this.unlistenProgress = unlisten; });

    this.event.listen('scan_complete', (event: any) => {
      this.isScanning.set(false);
      this.scanProgress.set(null);
      const payload = event.payload as ScanComplete;
      if (payload.library_id) {
        this.getLibraryStats(payload.library_id);
        this.loadPhotos(payload.library_id, 1);
      }
    }).then((unlisten: () => void) => { this.unlistenComplete = unlisten; });

    this.event.listen('scan_error', (event: any) => {
      console.error('Scan error:', event.payload);
      this.isScanning.set(false);
    }).then((unlisten: () => void) => { this.unlistenError = unlisten; });
  }

  ngOnDestroy() {
    this.unlistenProgress?.();
    this.unlistenComplete?.();
    this.unlistenError?.();
  }

  private async tauriInvoke<T>(cmd: string, args?: Record<string, any>): Promise<T> {
    if (!this.invoke) {
      throw new Error('Tauri IPC not available');
    }
    return this.invoke(cmd, args) as Promise<T>;
  }

  async loadLibraries(): Promise<void> {
    const libs = await this.tauriInvoke<Library[]>('list_libraries');
    this.libraries.set(libs);
  }

  async createLibrary(name: string, rootPath: string): Promise<Library> {
    const lib = await this.tauriInvoke<Library>('create_library', {
      name,
      rootPath,
    });
    await this.loadLibraries();
    return lib;
  }

  async deleteLibrary(libraryId: string): Promise<void> {
    await this.tauriInvoke('delete_library', { libraryId });
    await this.loadLibraries();
  }

  async pickFolder(): Promise<string | null> {
    return this.tauriInvoke<string | null>('pick_folder');
  }

  async getLibraryStats(libraryId: string): Promise<LibraryStats> {
    const stats = await this.tauriInvoke<LibraryStats>('get_library_stats', {
      libraryId,
    });
    this.stats.set(stats);
    return stats;
  }

  async scanLibrary(libraryId: string): Promise<void> {
    this.isScanning.set(true);
    this.scanProgress.set(null);
    await this.tauriInvoke('scan_library', { libraryId });
  }

  async cancelScan(): Promise<void> {
    await this.tauriInvoke('cancel_scan');
    this.isScanning.set(false);
  }

  async loadPhotos(libraryId: string, page: number = 1, limit: number = 50): Promise<void> {
    try {
      const photos = await this.tauriInvoke<Photo[]>('get_photos', {
        libraryId,
        page: { value: page },
        limit: { value: limit },
      });
      if (page === 1) {
        this.photos.set(photos);
      } else {
        this.photos.update(existing => [...existing, ...photos]);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
      if (page === 1) {
        this.photos.set([]);
      }
    }
  }

  async getPhoto(photoId: string): Promise<Photo | null> {
    return this.tauriInvoke<Photo | null>('get_photo', { photoId });
  }

  async getThumbnailPath(photoId: string): Promise<string | null> {
    return this.tauriInvoke<string | null>('get_thumbnail', { photoId });
  }

  async getThumbnailDataUrl(photoId: string): Promise<string | null> {
    return this.enqueueThumbnailRequest(photoId);
  }

  private async enqueueThumbnailRequest(photoId: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.thumbnailQueue.push(photoId);
      this.processThumbnailQueue(resolve);
    });
  }

  private async processThumbnailQueue(resolve: (value: string | null) => void) {
    if (this.activeThumbnailRequests >= this.maxConcurrentThumbnails || this.thumbnailQueue.length === 0) {
      return;
    }

    const photoId = this.thumbnailQueue.shift()!;
    this.activeThumbnailRequests++;

    try {
      const dataUrl = await this.tauriInvoke<string | null>('get_thumbnail_data_url', { photoId });
      resolve(dataUrl);
    } catch (err) {
      console.error('Failed to load thumbnail:', err);
      resolve(null);
    } finally {
      this.activeThumbnailRequests--;
      if (this.thumbnailQueue.length > 0) {
        this.processThumbnailQueue(() => {});
      }
    }
  }
}
