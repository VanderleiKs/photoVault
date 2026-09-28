import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { Library } from '../../core/ipc/ipc';
import { ScanStore } from '../../core/stores/scan.store';
import { LibraryFormComponent } from '../../shared/library-form.component';

/** First run: no library yet. */
@Component({
  selector: 'app-welcome-page',
  imports: [LibraryFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-full items-center justify-center p-6' },
  template: `
    <div class="w-full max-w-lg rounded-card border border-line bg-panel p-8 shadow-sm">
      <span class="flex size-12 items-center justify-center rounded-xl bg-primary text-white">
        <i class="pi pi-images text-xl"></i>
      </span>
      <h1 class="mt-5 text-2xl font-semibold">Bem-vindo ao PhotoVault</h1>
      <p class="mt-2 text-sm text-muted">
        Aponte para a pasta onde estão suas fotos (pode ser um HD externo). O PhotoVault cria uma
        biblioteca organizada sem mover, renomear ou apagar nenhum arquivo.
      </p>
      <app-library-form class="mt-6" (created)="start($event)" />
    </div>
  `,
})
export class WelcomePage {
  private readonly scan = inject(ScanStore);
  private readonly router = inject(Router);

  protected start(library: Library) {
    void this.scan.start(library.id);
    void this.router.navigate(['/photos']);
  }
}
