import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { TagModule } from '@openng/optimus-ui/tag';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type Theme } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { AppStore } from '../../core/stores/app.store';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, ButtonModule, InputNumberModule, SelectButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="border-b border-line px-6 py-4">
      <h1 class="text-xl font-semibold">Configurações</h1>
    </header>

    <div class="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <section class="rounded-card border border-line bg-panel p-5">
        <h2 class="font-semibold">Aparência</h2>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm">Tema</span>
          <p-selectbutton
            [options]="themes"
            optionLabel="label"
            optionValue="value"
            [allowEmpty]="false"
            [ngModel]="app.settings().theme"
            (ngModelChange)="setTheme($event)"
            ariaLabel="Tema"
          />
        </div>
      </section>

      <section class="rounded-card border border-line bg-panel p-5">
        <h2 class="font-semibold">Desempenho</h2>
        <p class="mt-1 text-sm text-muted">Usado pela análise em segundo plano (a partir da Fase 2). Em HD externo USB, mantenha poucas leituras paralelas.</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="text-sm">Leituras de disco em paralelo</span>
            <p-inputnumber [ngModel]="app.settings().ioConcurrency" (ngModelChange)="save({ ioConcurrency: $event })" [min]="1" [max]="32" [showButtons]="true" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-sm">Núcleos de CPU (0 = automático)</span>
            <p-inputnumber [ngModel]="app.settings().cpuConcurrency" (ngModelChange)="save({ cpuConcurrency: $event })" [min]="0" [max]="64" [showButtons]="true" />
          </label>
        </div>
      </section>

      @if (app.info(); as info) {
        <section class="rounded-card border border-line bg-panel p-5">
          <div class="flex items-center gap-3">
            <h2 class="flex-1 font-semibold">Dados e privacidade</h2>
            <p-tag [value]="mode().label" [severity]="mode().severity" />
          </div>
          <p class="mt-1 text-sm text-muted">{{ mode().text }}</p>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-xs text-muted">Pasta de dados (catálogo, miniaturas, cache)</dt>
              <dd class="break-all font-mono text-[13px]">{{ info.baseDir }}</dd>
            </div>
            <div class="flex flex-wrap items-end gap-3">
              <div class="min-w-0 flex-1">
                <dt class="text-xs text-muted">Logs</dt>
                <dd class="break-all font-mono text-[13px]">{{ info.logsDir }}</dd>
              </div>
              <p-button label="Abrir pasta de logs" icon="pi pi-folder-open" size="small" severity="secondary" [outlined]="true" (onClick)="openLogs()" />
            </div>
          </dl>
          <p class="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <i class="pi pi-shield"></i>Tudo é processado localmente. Nenhuma foto sai do seu computador.
          </p>
        </section>

        <section class="rounded-card border border-line bg-panel p-5">
          <h2 class="font-semibold">Sobre</h2>
          <p class="mt-1 text-sm text-muted">PhotoVault {{ info.version }} · local-first · privacy-first</p>
        </section>
      }
    </div>
  `,
})
export class SettingsPage {
  protected readonly app = inject(AppStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);

  protected readonly themes: { label: string; value: Theme }[] = [
    { label: 'Claro', value: 'light' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Sistema', value: 'system' },
  ];

  protected readonly mode = computed(() => {
    switch (this.app.info()?.dataMode) {
      case 'portable':
        return {
          label: 'Portátil',
          severity: 'success' as const,
          text: 'Os dados ficam ao lado do executável. Copie a pasta do PhotoVault para levar tudo junto.',
        };
      case 'custom':
        return {
          label: 'Personalizado',
          severity: 'info' as const,
          text: 'Pasta definida pela variável de ambiente PHOTOVAULT_HOME.',
        };
      default:
        return {
          label: 'Sistema',
          severity: 'warn' as const,
          text: 'Os dados estão na pasta do sistema. Para o modo portátil, crie um arquivo portable.flag ao lado do executável.',
        };
    }
  });

  protected setTheme(theme: Theme) {
    void this.save({ theme });
  }

  protected async save(patch: Parameters<AppStore['updateSettings']>[0]) {
    await this.app.updateSettings(patch).catch(() => {});
  }

  protected async openLogs() {
    await unwrap(this.backend.commands.openLogsDir()).catch((e) =>
      this.notify.error('Não foi possível abrir a pasta', e),
    );
  }
}
