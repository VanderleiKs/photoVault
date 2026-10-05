import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { formatCount } from '../core/format';
import type { MediaItem, ReviewReason } from '../core/ipc/ipc';
import { MediaActions } from '../core/stores/media-actions.service';
import { SelectionStore } from '../core/stores/selection.store';
import { AlbumPicker } from './album-picker.component';

/** `review` adds Manter/Ignorar; `trash` swaps everything for Restaurar/Excluir. */
export type SelectionMode = 'default' | 'review' | 'trash';

/** Floating batch-action bar shown while items are selected (PRD §23.5). */
@Component({
  selector: 'app-selection-bar',
  imports: [ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (selection.active()) {
      <div
        class="fixed bottom-20 left-1/2 z-30 flex max-w-[96vw] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full border border-line bg-panel px-2 py-1.5 shadow-xl md:bottom-6"
        role="toolbar"
        aria-label="Ações da seleção"
      >
        <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" size="small" ariaLabel="Limpar seleção" pTooltip="Limpar seleção (Esc)" tooltipPosition="top" (onClick)="selection.clear()" />
        <span class="whitespace-nowrap px-1 text-sm font-medium tabular-nums">{{ label() }}</span>
        <span class="mx-1 h-5 w-px bg-line"></span>
        @if (mode() === 'trash') {
          <p-button icon="pi pi-replay" label="Restaurar" [text]="true" [rounded]="true" size="small" (onClick)="actions.restore(ids())" />
          <p-button icon="pi pi-trash" label="Excluir definitivamente" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="actions.purge(ids())" />
        } @else {
          @if (mode() === 'review') {
            <p-button icon="pi pi-check" label="Manter" [text]="true" [rounded]="true" size="small" pTooltip="Manter: não sugerir de novo" tooltipPosition="top" (onClick)="actions.decide(ids(), 'keep')" />
            <p-button icon="pi pi-eye-slash" label="Ignorar" [text]="true" [rounded]="true" size="small" severity="secondary" [pTooltip]="reason() ? 'Ignorar só este motivo' : 'Ignorar as sugestões'" tooltipPosition="top" (onClick)="actions.decide(ids(), 'ignore', reason())" />
          }
          @if (allFavorite()) {
            <p-button icon="pi pi-heart-fill" [text]="true" [rounded]="true" size="small" ariaLabel="Remover dos favoritos" pTooltip="Remover dos favoritos" tooltipPosition="top" (onClick)="favorite(false)" />
          } @else {
            <p-button icon="pi pi-heart" [text]="true" [rounded]="true" size="small" ariaLabel="Favoritar" pTooltip="Favoritar" tooltipPosition="top" (onClick)="favorite(true)" />
          }
          <p-button icon="pi pi-book" [label]="mode() === 'review' ? '' : 'Adicionar ao álbum'" [text]="true" [rounded]="true" size="small" ariaLabel="Adicionar ao álbum" pTooltip="Adicionar ao álbum" tooltipPosition="top" (onClick)="picker.open(ids())" />
          <p-button icon="pi pi-sun" [text]="true" [rounded]="true" size="small" severity="secondary" ariaLabel="Melhorar fotos" pTooltip="Melhorar: correção automática (os originais não mudam)" tooltipPosition="top" (onClick)="enhance()" />
          <p-button icon="pi pi-sparkles" [text]="true" [rounded]="true" size="small" severity="secondary" ariaLabel="Usar como exemplo do que remover" pTooltip="Usar como exemplo: sugerir fotos parecidas para remoção" tooltipPosition="top" (onClick)="actions.addExamples(ids(), 'remove')" />
          <p-button icon="pi pi-trash" label="Lixeira" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Enviar para a lixeira" tooltipPosition="top" (onClick)="actions.trash(ids())" />
        }
        <ng-content />
        @if (items().length > selection.count()) {
          <p-button label="Selecionar tudo" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="selection.selectAll(items())" />
        }
      </div>
    }
  `,
})
export class SelectionBarComponent {
  /** Loaded items of the current gallery ("Selecionar tudo", favorite state). */
  readonly items = input<readonly MediaItem[]>([]);
  readonly mode = input<SelectionMode>('default');
  /** Review reason on screen: "Ignorar" then dismisses only it. */
  readonly reason = input<ReviewReason | null>(null);

  protected readonly selection = inject(SelectionStore);
  protected readonly picker = inject(AlbumPicker);
  protected readonly actions = inject(MediaActions);
  private readonly router = inject(Router);

  protected readonly ids = computed(() => [...this.selection.ids()]);

  /** "Melhorar fotos" with the selection as the scope (keeps the selection). */
  protected enhance() {
    void this.router.navigate(['/enhance'], { queryParams: { scope: 'selection' } });
  }
  protected readonly label = computed(() => {
    const n = this.selection.count();
    return `${formatCount(n)} ${n === 1 ? 'selecionada' : 'selecionadas'}`;
  });
  protected readonly allFavorite = computed(() => {
    const ids = this.selection.ids();
    const selected = this.items().filter((m) => ids.has(m.id));
    return selected.length === ids.size && selected.every((m) => m.isFavorite);
  });

  protected favorite(value: boolean) {
    void this.actions.setFavorite(this.ids(), value);
  }
}
