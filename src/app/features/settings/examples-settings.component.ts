import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { FormsModule } from '@angular/forms';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type ExampleIntent, type ReviewExample } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { OrganizeStore } from '../../core/stores/organize.store';

/**
 * Settings → "Exemplos": photos that teach what the user usually deletes (or keeps).
 * Photos like a "remover" example get the "Parecida com exemplo" reason in Review.
 */
@Component({
  selector: 'app-examples-settings',
  imports: [FormsModule, ButtonModule, SelectButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-card border border-line bg-panel p-5', id: 'exemplos' },
  template: `
    <h2 class="font-semibold">Exemplos</h2>
    <p class="mt-1 text-sm text-muted">
      Mostre ao PhotoVault o tipo de foto que você costuma apagar (prints de conversa, fotos de recibos, fotos no escuro…) e ele sugere as parecidas na Revisão.
      Um exemplo "manter" faz o contrário: fotos parecidas com ele nunca são sugeridas por exemplo.
    </p>
    <p class="mt-2 text-xs text-muted">
      Também dá para usar fotos da biblioteca: selecione-as e clique em <i class="pi pi-sparkles text-[11px]"></i> na barra de seleção, no painel ou no visualizador.
      Por enquanto a comparação olha o aspecto da foto (luz, cores, textura, formato, se é captura de tela), não o que ela mostra; isso chega com a IA local (v2.0).
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <p-button label="Adicionar exemplo do que remover…" icon="pi pi-plus" size="small" [loading]="busy()" (onClick)="addFile('remove')" />
      <p-button label="Adicionar exemplo do que manter…" icon="pi pi-plus" size="small" [outlined]="true" severity="secondary" [loading]="busy()" (onClick)="addFile('keep')" />
    </div>

    @if (examples().length) {
      <ul class="mt-4 divide-y divide-line">
        @for (e of examples(); track e.id) {
          <li class="flex items-center gap-3 py-2.5">
            <img [src]="e.thumbnail" alt="" class="size-14 shrink-0 rounded-md object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm" [title]="e.name">{{ e.name }}</p>
              <p class="text-xs text-muted">{{ matchText(e) }}</p>
            </div>
            <p-selectbutton [options]="intents" optionLabel="label" optionValue="value" [ngModel]="e.intent" (ngModelChange)="setIntent(e, $event)" [allowEmpty]="false" size="small" [ariaLabel]="'Tipo do exemplo ' + e.name" />
            <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" size="small" [ariaLabel]="'Remover exemplo ' + e.name" (onClick)="remove(e)" />
          </li>
        }
      </ul>
    } @else if (loaded()) {
      <p class="mt-4 text-sm text-muted">Nenhum exemplo ainda.</p>
    }
  `,
})
export class ExamplesSettingsComponent {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly organize = inject(OrganizeStore);

  protected readonly intents = [
    { label: 'Remover', value: 'remove' },
    { label: 'Manter', value: 'keep' },
  ];
  protected readonly examples = signal<ReviewExample[]>([]);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    // Match counts change after each analysis pass.
    effect(() => {
      this.organize.version();
      untracked(() => void this.load());
    });
  }

  private async load() {
    if (!isTauri()) return;
    this.examples.set(await unwrap(this.backend.commands.listExamples()).catch(() => []));
    this.loaded.set(true);
  }

  protected async addFile(intent: ExampleIntent) {
    this.busy.set(true);
    try {
      const added = await unwrap(this.backend.commands.addExampleFromFile(intent));
      if (added) {
        this.notify.success('Exemplo adicionado', 'As sugestões são recalculadas em segundos.');
        await this.load();
      }
    } catch (e) {
      this.notify.error('Não foi possível usar a imagem como exemplo', e);
    } finally {
      this.busy.set(false);
    }
  }

  protected async setIntent(example: ReviewExample, intent: ExampleIntent) {
    try {
      await unwrap(this.backend.commands.setExampleIntent(example.id, intent));
      await this.load();
    } catch (e) {
      this.notify.error('Não foi possível alterar o exemplo', e);
    }
  }

  protected async remove(example: ReviewExample) {
    try {
      await unwrap(this.backend.commands.removeExample(example.id));
      this.examples.update((list) => list.filter((e) => e.id !== example.id));
    } catch (e) {
      this.notify.error('Não foi possível remover o exemplo', e);
    }
  }

  protected matchText(e: ReviewExample) {
    if (e.intent === 'keep') return 'Fotos parecidas não são sugeridas';
    return e.matches ? `${formatCount(e.matches)} ${e.matches === 1 ? 'foto parecida' : 'fotos parecidas'} na Revisão` : 'Nenhuma foto parecida pendente';
  }
}
