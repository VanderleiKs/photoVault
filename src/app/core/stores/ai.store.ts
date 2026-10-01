import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { formatBytes } from '../format';
import { Backend } from '../ipc/backend';
import { unwrap, type AiPackage, type AiStatus } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { ConfirmAction } from '../../shared/confirm-action.component';
import { AppStore } from './app.store';
import { OrganizeStore } from './organize.store';
import { PeopleStore } from './people.store';

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
  private readonly people = inject(PeopleStore);

  readonly status = signal<AiStatus | null>(null);
  /** Content search and scene chips are available. */
  readonly ready = computed(() => !!this.status()?.ready);
  /** Faces are being searched and grouped (Pessoas). */
  readonly facesReady = computed(() => !!this.status()?.faces.ready);
  readonly facesInstalled = computed(() => !!this.status()?.faces.installed);
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
      const loading = this.enabled() && !s.error && ((s.installed && !s.ready) || (s.faces.installed && !s.faces.ready));
      if (s.download.running || loading) this.timer = setTimeout(() => void this.refresh(), DOWNLOAD_POLL_MS);
      else if (s.pending > 0 || s.faces.pending > 0) this.timer = setTimeout(() => void this.refresh(), ANALYSIS_POLL_MS);
    } catch {
      // Status unavailable: the settings page shows the last one.
    }
  }

  /** Explains what is downloaded and from where; downloads only if the user agrees. */
  async download(pkg: AiPackage = 'content'): Promise<void> {
    const s = this.status();
    const size = formatBytes((pkg === 'faces' ? s?.faces.sizeBytes : s?.sizeBytes) ?? 0);
    const ok = await this.confirm.ask(
      pkg === 'faces'
        ? {
            header: 'Baixar o reconhecimento de rostos',
            icon: 'pi pi-download',
            message: `O PhotoVault vai baixar ${size} de modelos do Hugging Face (huggingface.co). É o único acesso à internet do app, e só acontece agora.`,
            detail:
              'Modelos do OpenCV Zoo: YuNet (encontra os rostos, licença MIT) e SFace (reconhece a mesma pessoa, licença Apache 2.0). ' +
              'Cada arquivo é conferido (SHA-256). Os rostos e os nomes ficam só no catálogo deste computador: nenhuma foto sai dele.',
            acceptLabel: `Baixar ${size}`,
          }
        : {
            header: 'Baixar os modelos de IA local',
            icon: 'pi pi-download',
            message: `O PhotoVault vai baixar ${size} de modelos de IA do Hugging Face (huggingface.co). É o único acesso à internet do app, e só acontece agora.`,
            detail:
              'Modelos: CLIP ViT-B/32 (OpenAI, licença MIT) e o codificador de texto multilíngue clip-ViT-B-32-multilingual-v1 (licença Apache 2.0). ' +
              'Cada arquivo é conferido (SHA-256). Depois disso, a análise roda só no seu computador: nenhuma foto sai dele.',
            acceptLabel: `Baixar ${size}`,
          },
    );
    if (!ok) return;
    try {
      await unwrap(this.backend.commands.downloadAiModels([pkg]));
      this.wasDownloading = true;
      void this.refresh();
    } catch (e) {
      this.notify.error('Não foi possível iniciar o download', e);
    }
  }

  /** First run: the welcome screen already explained and asked; download what's missing. */
  async downloadAll(pkgs: AiPackage[]): Promise<void> {
    const s = this.status() ?? (await this.refreshed());
    const missing = pkgs.filter((p) => !(p === 'faces' ? s?.faces.installed : s?.installed));
    if (!missing.length) return;
    try {
      await unwrap(this.backend.commands.downloadAiModels(missing));
      this.wasDownloading = true;
      void this.refresh();
    } catch (e) {
      this.notify.error('Não foi possível iniciar o download', e);
    }
  }

  private async refreshed(): Promise<AiStatus | null> {
    await this.refresh();
    return this.status();
  }

  /** "Tentar de novo" after a model stopped or failed to load. */
  async retry(): Promise<void> {
    try {
      const ready = await unwrap(this.backend.commands.retryAi());
      if (ready) this.notify.success('IA local de volta', 'A análise continua de onde parou.');
    } catch (e) {
      this.notify.error('A IA local ainda não carregou', e);
    }
    await this.refresh();
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

  async remove(pkg: AiPackage = 'content'): Promise<void> {
    const ok = await this.confirm.ask(
      pkg === 'faces'
        ? {
            header: 'Remover o reconhecimento de rostos',
            message: 'Apagar os modelos, os rostos encontrados e as pessoas, com os nomes que você deu?',
            detail: 'As fotos não são afetadas. Para usar de novo, é preciso baixar outra vez, e os nomes terão de ser dados de novo.',
            acceptLabel: 'Remover',
            danger: true,
          }
        : {
            header: 'Remover a IA local',
            message: 'Apagar os modelos baixados e a análise de conteúdo das fotos?',
            detail: 'As fotos não são afetadas. A busca volta a procurar só por nome, pasta, local e álbum. Para usar de novo, é preciso baixar outra vez.',
            acceptLabel: 'Remover',
            danger: true,
          },
    );
    if (!ok) return;
    try {
      await unwrap(this.backend.commands.removeAiModels(pkg));
      if (pkg === 'faces') {
        this.notify.success('Reconhecimento de rostos removido', 'Os modelos, os rostos e as pessoas foram apagados.');
        this.people.touch();
      } else {
        this.notify.success('IA local removida', 'Os modelos e a análise de conteúdo foram apagados.');
      }
      this.organize.touch();
    } catch (e) {
      this.notify.error('Não foi possível remover', e);
    }
    void this.refresh();
  }

  private downloadEnded(s: AiStatus) {
    const wanted = s.download.packages;
    const faces = wanted.includes('faces-yunet2023-sface2021');
    const content = wanted.some((p) => p !== 'faces-yunet2023-sface2021');
    if ((!faces || s.faces.installed) && (!content || s.installed)) {
      this.notify.success(
        'Modelos baixados',
        faces && content
          ? 'A análise das fotos continua em segundo plano: busca por conteúdo e, depois, os rostos em Pessoas.'
          : faces
            ? 'A busca de rostos começa agora, em segundo plano. As pessoas aparecem em Pessoas.'
            : 'A análise de conteúdo começa agora, em segundo plano.',
      );
      this.organize.touch();
    } else if (s.download.error && !s.download.error.includes('cancelado')) {
      this.notify.error('O download não terminou', s.download.error);
    }
  }
}
