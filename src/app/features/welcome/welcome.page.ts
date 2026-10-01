import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { formatBytes } from '../../core/format';
import type { AiPackage, Library } from '../../core/ipc/ipc';
import { AiStore } from '../../core/stores/ai.store';
import { ScanStore } from '../../core/stores/scan.store';
import { LibraryFormComponent } from '../../shared/library-form.component';

/**
 * First run: the photos folder, then the optional analysis data (local AI), explained and
 * asked once. Scanning and downloading go on in the background; the app is usable at once.
 */
@Component({
  selector: 'app-welcome-page',
  imports: [FormsModule, ButtonModule, LibraryFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-full items-center justify-center p-6' },
  template: `
    <div class="w-full max-w-lg rounded-card border border-line bg-panel p-8 shadow-sm">
      <p class="text-xs font-medium uppercase tracking-wide text-muted">Passo {{ step() }} de 2</p>
      @if (step() === 1) {
        <span class="mt-3 flex size-12 items-center justify-center rounded-xl bg-primary text-white">
          <i class="pi pi-images text-xl"></i>
        </span>
        <h1 class="mt-5 text-2xl font-semibold">Bem-vindo ao PhotoVault</h1>
        <p class="mt-2 text-sm text-muted">
          Aponte para a pasta onde estão suas fotos (pode ser um HD externo). O PhotoVault cria uma
          biblioteca organizada sem mover, renomear ou apagar nenhum arquivo.
        </p>
        <app-library-form class="mt-6" (created)="created($event)" />
      } @else {
        <span class="mt-3 flex size-12 items-center justify-center rounded-xl bg-primary text-white">
          <i class="pi pi-sparkles text-xl"></i>
        </span>
        <h1 class="mt-5 text-2xl font-semibold">Análise inteligente</h1>
        <p class="mt-2 text-sm text-muted">
          Suas fotos já estão sendo lidas. Para também encontrá-las pelo que mostram e reconhecer as pessoas, o PhotoVault baixa
          <strong class="text-ink">uma vez</strong> alguns dados de análise (modelos de IA, do Hugging Face). Depois disso tudo roda no seu computador:
          nenhuma foto sai dele.
        </p>
        <ul class="mt-5 space-y-3">
          @for (o of options; track o.pkg) {
            <li>
              <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 hover:bg-panel-2">
                <input type="checkbox" class="mt-1" [ngModel]="chosen().has(o.pkg)" (ngModelChange)="toggle(o.pkg, $event)" />
                <span class="text-sm">
                  <span class="font-medium">{{ o.title }}</span> <span class="text-muted">· {{ size(o.pkg) }}</span>
                  <span class="block text-xs text-muted">{{ o.text }}</span>
                </span>
              </label>
            </li>
          }
        </ul>
        <p class="mt-4 text-xs text-muted">
          O download e a análise continuam em segundo plano: você já pode usar o app. Dá para mudar isso depois em Configurações → IA local.
        </p>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <p-button label="Agora não" severity="secondary" [text]="true" (onClick)="finish(false)" />
          <p-button [label]="chosen().size ? 'Baixar ' + total() + ' e continuar' : 'Continuar'" icon="pi pi-arrow-right" iconPos="right" (onClick)="finish(true)" />
        </div>
      }
    </div>
  `,
})
export class WelcomePage {
  private readonly scan = inject(ScanStore);
  private readonly router = inject(Router);
  private readonly ai = inject(AiStore);

  protected readonly step = signal<1 | 2>(1);
  protected readonly chosen = signal<ReadonlySet<AiPackage>>(new Set<AiPackage>(['content', 'faces']));
  protected readonly options: { pkg: AiPackage; title: string; text: string }[] = [
    { pkg: 'content', title: 'Busca pelo conteúdo', text: 'Encontre "praia", "cachorro" ou "aniversário" sem ter dado nome às fotos, e veja a cena de cada foto.' },
    { pkg: 'faces', title: 'Pessoas', text: 'Agrupa as fotos de cada pessoa pelo rosto; você dá os nomes e busca por eles.' },
  ];
  protected readonly total = computed(() => formatBytes([...this.chosen()].reduce((sum, p) => sum + this.bytes(p), 0)));

  constructor() {
    void this.ai.refresh();
  }

  protected created(library: Library) {
    void this.scan.start(library.id);
    const s = this.ai.status();
    // Already there (another library before, or a copied app folder): nothing to ask.
    if (s?.installed && s.faces.installed) void this.router.navigate(['/photos']);
    else this.step.set(2);
  }

  protected toggle(pkg: AiPackage, on: boolean) {
    const next = new Set(this.chosen());
    if (on) next.add(pkg);
    else next.delete(pkg);
    this.chosen.set(next);
  }

  protected size(pkg: AiPackage) {
    return formatBytes(this.bytes(pkg));
  }

  private bytes(pkg: AiPackage) {
    const s = this.ai.status();
    return (pkg === 'faces' ? s?.faces.sizeBytes : s?.sizeBytes) ?? 0;
  }

  protected finish(download: boolean) {
    if (download && this.chosen().size) void this.ai.downloadAll([...this.chosen()]);
    void this.router.navigate(['/photos']);
  }
}
