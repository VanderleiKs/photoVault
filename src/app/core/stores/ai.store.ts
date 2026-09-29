import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { formatBytes } from '../format';
import { Backend } from '../ipc/backend';
import { unwrap, type AiStatus } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { AppStore } from './app.store';
import { OrganizeStore } from './organize.store';

/** While downloading, the status is polled this often; while analyzing, less often. */
const DOWNLOAD_POLL_MS = 700;
const ANALYSIS_POLL_MS = 4000;

/** Local AI (PRD §21): download with consent, status of the content analysis. */
@Injectable({ providedIn: 'root' })
export class AiStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmAction);
  private readonly app = inject(AppStore);
  private readonly organize = inject(OrganizeStore);

  readonly status = signal<AiStatus | null>(null);
  /** Content search and scene chips are available. */
  readonly ready = computed(() => !!this.status()?.ready);
  readonly downloading = computed(() => !!this.status()?.download.running);
  readonly enabled = computed(() => this.app.settings().ai?.enabled ?? true);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private wasDownloading = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  async refresh(): Promise<void> {
    if (!isTauri()) return;
    clearTimeout(this.timer);
    try {
      const s = await unwrap(this.backend.commands.getAiStatus());
      this.status.set(s);
      if (this.wasDownloading && !s.download.running) this.downloadEnded(s);
      this.wasDownloading = s.download.running;
      // The model loads a moment after the download; keep looking until it's ready.
      const loading = s.installed && this.enabled() && !s.ready && !s.error;
      if (s.download.running || loading) this.timer = setTimeout(() => void this.refresh(), DOWNLOAD_POLL_MS);
      else if (s.pending > 0) this.timer = setTimeout(() => void this.refresh(), ANALYSIS_POLL_MS);
    } catch {
      // Status unavailable: the settings page shows the last one.
    }
  }

  /** Explains what is downloaded and from where; downloads only if the user agrees. */
  async download(): Promise<void> {
    const size = formatBytes(this.status()?.sizeBytes ?? 0);
    const ok = await this.confirm.ask({
      header: 'Baixar os modelos de IA local',
      icon: 'pi pi-download',
      message: `O PhotoVault vai baixar ${size} de modelos de IA do Hugging Face (huggingface.co). É o único acesso à internet do app, e só acontece agora.`,
      detail:
        'Modelos: CLIP ViT-B/32 (OpenAI, licença MIT) e o codificador de texto multilíngue clip-ViT-B-32-multilingual-v1 (licença Apache 2.0). ' +
        'Cada arquivo é conferido (SHA-256). Depois disso, a análise roda só no seu computador: nenhuma foto sai dele.',
      acceptLabel: `Baixar ${size}`,
    });
    if (!ok) return;
    try {
      await unwrap(this.backend.commands.downloadAiModels());
      this.wasDownloading = true;
      void this.refresh();
    } catch (e) {
      this.notify.error('Não foi possível iniciar o download', e);
    }
  }

  async cancel(): Promise<void> {
    await unwrap(this.backend.commands.cancelAiDownload()).catch(() => {});
    void this.refresh();
  }

  async setEnabled(enabled: boolean): Promise<void> {
    const ai = { ...(this.app.settings().ai ?? { enabled: true }), enabled };
    await this.app.updateSettings({ ai }).catch(() => {});
    await this.refresh();
    this.organize.touch();
  }

  async remove(): Promise<void> {
    const ok = await this.confirm.ask({
      header: 'Remover a IA local',
      message: 'Apagar os modelos baixados e a análise de conteúdo das fotos?',
      detail: 'As fotos não são afetadas. A busca volta a procurar só por nome, pasta, local e álbum. Para usar de novo, é preciso baixar outra vez.',
      acceptLabel: 'Remover',
      danger: true,
    });
    if (!ok) return;
    try {
      await unwrap(this.backend.commands.removeAiModels());
      this.notify.success('IA local removida', 'Os modelos e a análise de conteúdo foram apagados.');
      this.organize.touch();
    } catch (e) {
      this.notify.error('Não foi possível remover a IA local', e);
    }
    void this.refresh();
  }

  private downloadEnded(s: AiStatus) {
    if (s.installed) {
      this.notify.success('Modelos baixados', 'A análise de conteúdo começa agora, em segundo plano.');
      this.organize.touch();
    } else if (s.download.error && !s.download.error.includes('cancelado')) {
      this.notify.error('O download não terminou', s.download.error);
    }
  }
}
