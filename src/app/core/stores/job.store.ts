import { Injectable, computed, inject, signal } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type JobFailure, type JobProgress, type MediaItem } from '../ipc/ipc';
import { NotifyService } from '../notify.service';

export interface MediaUpdate {
  items: MediaItem[];
  removedIds: string[];
}

/** Background analysis queue (EXIF, thumbnails, hashes), driven by backend events. */
@Injectable({ providedIn: 'root' })
export class JobStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);

  readonly progress = signal<JobProgress | null>(null);
  /** Latest batch of processed items; stores patch their copies from it. */
  readonly lastUpdate = signal<MediaUpdate | null>(null);
  readonly failures = signal<JobFailure[]>([]);

  readonly busy = computed(() => {
    const p = this.progress();
    return !!p && p.queued > 0 && !p.paused;
  });

  private listening = false;

  async init(): Promise<void> {
    if (this.listening || !isTauri()) return;
    this.listening = true;
    const { events, commands } = this.backend;
    await Promise.all([
      events.jobProgressEvent.listen(({ payload }) => this.progress.set(payload)),
      events.mediaUpdatedEvent.listen(({ payload }) => this.lastUpdate.set(payload)),
    ]);
    this.progress.set(await unwrap(commands.getJobProgress()).catch(() => null));
  }

  async pause(): Promise<void> {
    await this.run(this.backend.commands.pauseJobs(), 'Não foi possível pausar a análise');
  }

  async resume(): Promise<void> {
    await this.run(this.backend.commands.resumeJobs(), 'Não foi possível retomar a análise');
  }

  async loadFailures(): Promise<void> {
    try {
      this.failures.set(await unwrap(this.backend.commands.listJobFailures(200)));
    } catch (e) {
      this.notify.error('Não foi possível carregar os problemas', e);
    }
  }

  async retryFailed(): Promise<void> {
    try {
      const count = await unwrap(this.backend.commands.retryFailedJobs());
      this.failures.set([]);
      this.notify.info('Reprocessando', `${count} arquivo(s) voltaram para a fila.`);
      this.progress.set(await unwrap(this.backend.commands.getJobProgress()));
    } catch (e) {
      this.notify.error('Não foi possível reprocessar', e);
    }
  }

  private async run(call: ReturnType<Backend['commands']['pauseJobs']>, error: string) {
    try {
      this.progress.set(await unwrap(call));
    } catch (e) {
      this.notify.error(error, e);
    }
  }
}
