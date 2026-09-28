import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { formatCount } from '../core/format';
import type { MediaItem } from '../core/ipc/ipc';
import { MediaActions } from '../core/stores/media-actions.service';
import { SelectionStore } from '../core/stores/selection.store';
import { AlbumPicker } from './album-picker.component';

/** Floating batch-action bar shown while items are selected (PRD §23.5). */
@Component({
  selector: 'app-selection-bar',
  imports: [ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (selection.active()) {
      <div
        class="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-panel px-2 py-1.5 shadow-xl md:bottom-6"
        role="toolbar"
        aria-label="Ações da seleção"
      >
        <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" size="small" ariaLabel="Limpar seleção" pTooltip="Limpar seleção (Esc)" tooltipPosition="top" (onClick)="selection.clear()" />
        <span class="whitespace-nowrap px-1 text-sm font-medium tabular-nums">{{ label() }}</span>
        <span class="mx-1 h-5 w-px bg-line"></span>
        @if (allFavorite()) {
          <p-button icon="pi pi-heart-fill" [text]="true" [rounded]="true" size="small" ariaLabel="Remover dos favoritos" pTooltip="Remover dos favoritos" tooltipPosition="top" (onClick)="favorite(false)" />
        } @else {
          <p-button icon="pi pi-heart" [text]="true" [rounded]="true" size="small" ariaLabel="Favoritar" pTooltip="Favoritar" tooltipPosition="top" (onClick)="favorite(true)" />
        }
        <p-button icon="pi pi-book" label="Adicionar ao álbum" [text]="true" [rounded]="true" size="small" (onClick)="picker.open(ids())" />
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

  protected readonly selection = inject(SelectionStore);
  protected readonly picker = inject(AlbumPicker);
  private readonly actions = inject(MediaActions);

  protected readonly ids = computed(() => [...this.selection.ids()]);
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
