import { Injectable, inject, signal } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type ScanProgress, type ScanSummary } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { LibraryStore } from './library.store';

/** Scan lifecycle, driven by backend events. Only one scan runs at a time. */
@Injectable({ providedIn: 'root' })
export class ScanStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);

  /** Library being scanned, or null. */
  readonly scanningId = signal<string | null>(null);
  readonly progress = signal<ScanProgress | null>(null);
  /** Last finished scan; the gallery reloads when it changes. */
  readonly lastSummary = signal<ScanSummary | null>(null);

  private listening = false;

  /** Subscribe to events and pick up a scan already running (e.g. after a reload). */
  async init(): Promise<void> {
    if (this.listening || !isTauri()) return;
    this.listening = true;
    const { events } = this.backend;

    await Promise.all([
      events.scanProgressEvent.listen(({ payload }) => {
        this.scanningId.set(payload.libraryId);
        this.progress.set(payload);
      }),
      events.scanCompleteEvent.listen(({ payload }) => this.finish(payload)),
      events.scanErrorEvent.listen(({ payload }) => {
        this.reset();
        this.notify.error('Falha no scan', payload.error.message);
      }),
    ]);

    this.scanningId.set(await unwrap(this.backend.commands.getScanningLibrary()).catch(() => null));
  }

  isScanning(libraryId: string | null | undefined): boolean {
    return !!libraryId && this.scanningId() === libraryId;
  }

  async start(libraryId: string): Promise<void> {
    this.progress.set(null);
    this.scanningId.set(libraryId);
    try {
      await unwrap(this.backend.commands.scanLibrary(libraryId));
    } catch (e) {
      this.reset();
      this.notify.error('Não foi possível iniciar o scan', e);
    }
  }

  async cancel(): Promise<void> {
    // `scanningId` clears when the backend emits the completion event.
    await unwrap(this.backend.commands.cancelScan()).catch((e) =>
      this.notify.error('Não foi possível cancelar', e),
    );
  }

  private finish(summary: ScanSummary) {
    this.reset();
    this.lastSummary.set(summary);
    const changes = `${summary.newFiles} novos, ${summary.modifiedFiles} modificados`;
    const errors = summary.errors ? `, ${summary.errors} com erro` : '';
    if (summary.cancelled) {
      this.notify.info('Scan cancelado', `${summary.processed} de ${summary.total} arquivos processados (${changes}).`);
    } else {
      this.notify.success('Scan concluído', `${summary.total} arquivos: ${changes}${errors}.`);
    }
    void this.libraries.refresh();
  }

  private reset() {
    this.scanningId.set(null);
    this.progress.set(null);
  }
}
