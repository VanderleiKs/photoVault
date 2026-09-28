import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { Backend } from '../core/ipc/backend';
import { errorMessage, unwrap, type Library } from '../core/ipc/ipc';
import { LibraryStore } from '../core/stores/library.store';

/** Name + folder form that creates a library and makes it active. */
@Component({
  selector: 'app-library-form',
  imports: [FormsModule, ButtonModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form class="flex flex-col gap-4" (ngSubmit)="submit()">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-ink">Nome da biblioteca</span>
        <input pInputText name="name" [(ngModel)]="name" placeholder="Ex.: Fotos da família" autocomplete="off" />
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-ink">Pasta das fotos</span>
        <div class="flex gap-2">
          <input
            pInputText
            name="rootPath"
            class="min-w-0 flex-1"
            [(ngModel)]="rootPath"
            placeholder="Ex.: E:\\Fotos ou /media/hd/Fotos"
            autocomplete="off"
          />
          <p-button type="button" icon="pi pi-folder-open" label="Escolher" severity="secondary" (onClick)="pick()" />
        </div>
        <span class="text-xs text-muted">
          O PhotoVault só lê essa pasta. Nenhum arquivo é movido, renomeado ou apagado.
        </span>
      </div>

      @if (error()) {
        <p class="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
          <i class="pi pi-exclamation-triangle mt-0.5"></i>{{ error() }}
        </p>
      }

      <p-button
        type="submit"
        [label]="submitLabel"
        icon="pi pi-plus"
        [loading]="saving()"
        [disabled]="!name().trim() || !rootPath().trim()"
        styleClass="w-full"
      />
    </form>
  `,
})
export class LibraryFormComponent {
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);

  readonly created = output<Library>();
  readonly submitLabel = 'Adicionar biblioteca';

  protected readonly name = signal('');
  protected readonly rootPath = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async pick() {
    try {
      const path = await unwrap(this.backend.commands.pickFolder());
      if (path) {
        this.rootPath.set(path);
        if (!this.name().trim()) {
          this.name.set(path.split(/[\\/]/).filter(Boolean).pop() ?? '');
        }
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected async submit() {
    this.saving.set(true);
    this.error.set(null);
    try {
      const library = await this.libraries.create(this.name(), this.rootPath());
      this.name.set('');
      this.rootPath.set('');
      this.created.emit(library);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
