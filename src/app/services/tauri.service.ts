import { Injectable, signal } from '@angular/core';
import type { Photo, Library, LibraryStats, ScanProgress, ScanComplete } from '../models/photo';

/**
 * Service for communicating with the Rust backend via Tauri IPC.
 * All heavy operations (scanning, hashing, etc.) happen on the Rust side.
 */
@Injectable({ providedIn: 'root' })
export class TauriService {
  private readonly invoke = (window as any).__TAURI_INTERNALS__?.invoke;
  private readonly event = (window as any).__TAURI_INTERNALS__?.event;

  readonly libraries = signal<Library[]>([]);
  readonly currentLibrary = signal<Library | null>(null);
  readonly photos = signal<Photo[]>([]);
  readonly stats = signal<LibraryStats | null>(null);
  readonly scanProgress = signal<ScanProgress | null>(null);
  readonly isScanning = signal(false);

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability() {
    if (!this.invoke) {
      console.warn('Tauri IPC not available - running in browser mode');
    }
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

    // Listen for progress events
    const unlisten = await this.event.listen(
      'scan_progress',
      (event: any) => {
        this.scanProgress.set(event.payload as ScanProgress);
      }
    );

    const unlistenComplete = await this.event.listen(
      'scan_complete',
      (event: any) => {
        this.isScanning.set(false);
        this.scanProgress.set(null);
        this.getLibraryStats(libraryId);
        this.loadPhotos(libraryId, 1);
      }
    );

    const unlistenError = await this.event.listen(
      'scan_error',
      (event: any) => {
        console.error('Scan error:', event.payload);
        this.isScanning.set(false);
      }
    );

    try {
      await this.tauriInvoke('scan_library', { libraryId });
    } finally {
      unlisten();
      unlistenComplete();
      unlistenError();
    }
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
      this.photos.set(photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
      this.photos.set([]);
    }
  }

  async getPhoto(photoId: string): Promise<Photo | null> {
    return this.tauriInvoke<Photo | null>('get_photo', { photoId });
  }

  async getThumbnailPath(photoId: string): Promise<string | null> {
    return this.tauriInvoke<string | null>('get_thumbnail', { photoId });
  }

  async getThumbnailDataUrl(photoId: string): Promise<string | null> {
    return this.tauriInvoke<string | null>('get_thumbnail_data_url', { photoId });
  }
}
