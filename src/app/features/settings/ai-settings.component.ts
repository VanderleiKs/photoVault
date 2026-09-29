import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { ToggleSwitchModule } from '@openng/optimus-ui/toggleswitch';
import { formatBytes, formatCount } from '../../core/format';
import { AiStore } from '../../core/stores/ai.store';

/** Settings → "IA local" (PRD §21): consent + download, on/off, progress, removal. */
@Component({
  selector: 'app-ai-settings',
  imports: [FormsModule, ButtonModule, ProgressBarModule, ToggleSwitchModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-card border border-line bg-panel p-5' },
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="flex flex-1 items-center gap-2 font-semibold"><i class="pi pi-sparkles text-primary"></i>IA local</h2>
      @if (status()?.installed) {
        <label class="flex items-center gap-2 text-sm">
          <p-toggleswitch [ngModel]="ai.enabled()" (ngModelChange)="ai.setEnabled($event)" ariaLabel="Usar a IA local" />
          Usar
        </label>
      }
    </div>
    <p class="mt-1 text-sm text-muted">
      Busca pelo conteúdo das fotos ("cachorro na praia", "bolo de aniversário") e etiquetas de cena ("Praia 71 %"), tudo processado no seu computador.
      É opcional: sem ela, o app funciona igual e a busca procura por nome, pasta, local e álbum.
    </p>

    @if (status(); as s) {
      @if (s.download.running) {
        <div class="mt-4 space-y-2">
          <p class="text-sm">Baixando os modelos… {{ bytes(s.download.doneBytes) }} de {{ bytes(s.download.totalBytes) }}</p>
          <p-progressbar [value]="downloadPercent()" [showValue]="false" styleClass="!h-2" />
          <p-button label="Cancelar" icon="pi pi-times" size="small" [text]="true" severity="secondary" (onClick)="ai.cancel()" />
        </div>
      } @else if (!s.installed) {
        <div class="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 px-4 py-3">
          <div class="min-w-0 flex-1 text-sm">
            <p>Os modelos ({{ bytes(s.sizeBytes) }}) são baixados uma vez, só quando você pedir. Depois, nada sai do computador.</p>
            @if (s.download.error && !s.download.error.includes('cancelado')) {
              <p class="mt-1 text-xs text-rose-600 dark:text-rose-400">Última tentativa: {{ s.download.error }}</p>
            }
          </div>
          <p-button [label]="'Baixar modelos (' + bytes(s.sizeBytes) + ')'" icon="pi pi-download" (onClick)="ai.download()" />
        </div>
      } @else {
        <div class="mt-4 space-y-3">
          @if (s.error) {
            <p class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">Não foi possível carregar os modelos: {{ s.error }}. Remova e baixe de novo.</p>
          } @else if (!ai.enabled()) {
            <p class="text-sm text-muted">Desligada: a análise de conteúdo está parada e a busca procura só por nome, pasta, local e álbum.</p>
          } @else if (!s.ready) {
            <p class="flex items-center gap-2 text-sm"><i class="pi pi-spin pi-spinner text-primary"></i>Carregando os modelos…</p>
          } @else if (s.pending > 0) {
            <div class="space-y-1.5">
              <p class="text-sm">Analisando o conteúdo das fotos: {{ count(s.indexed) }} de {{ count(s.indexed + s.pending) }}</p>
              <p-progressbar [value]="analysisPercent()" [showValue]="false" styleClass="!h-2" />
              <p class="text-xs text-muted">Em segundo plano, depois da análise de qualidade. As fotos já analisadas aparecem na busca.</p>
            </div>
          } @else {
            <p class="flex items-center gap-2 text-sm"><i class="pi pi-check-circle text-emerald-600"></i>Pronta: {{ count(s.indexed) }} {{ s.indexed === 1 ? 'foto analisada' : 'fotos analisadas' }}. Experimente buscar "praia" ou "comida" (Ctrl+K).</p>
          }
          <p class="text-xs text-muted">Modelos: CLIP ViT-B/32 (OpenAI, MIT) e clip-ViT-B-32-multilingual-v1 (Apache 2.0), {{ bytes(s.sizeBytes) }} na pasta <code>models</code>.</p>
          <p-button label="Remover modelos" icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="ai.remove()" />
        </div>
      }
    }
  `,
})
export class AiSettingsComponent {
  protected readonly ai = inject(AiStore);
  protected readonly status = this.ai.status;

  protected readonly downloadPercent = computed(() => {
    const d = this.status()?.download;
    return d && d.totalBytes ? Math.round((d.doneBytes / d.totalBytes) * 100) : 0;
  });
  protected readonly analysisPercent = computed(() => {
    const s = this.status();
    const total = (s?.indexed ?? 0) + (s?.pending ?? 0);
    return total ? Math.round(((s?.indexed ?? 0) / total) * 100) : 0;
  });

  constructor() {
    void this.ai.refresh();
  }

  protected bytes(n: number) {
    return formatBytes(n);
  }

  protected count(n: number) {
    return formatCount(n);
  }
}
