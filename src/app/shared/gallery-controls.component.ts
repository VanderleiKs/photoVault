import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from '@openng/optimus-ui/select';
import { SliderModule } from '@openng/optimus-ui/slider';
import type { MediaSort } from '../core/ipc/ipc';
import { UiStore } from '../core/stores/ui.store';

export const SORT_OPTIONS: { label: string; value: MediaSort }[] = [
  { label: 'Mais recentes', value: 'newest' },
  { label: 'Mais antigas', value: 'oldest' },
  { label: 'Nome', value: 'name' },
  { label: 'Maiores arquivos', value: 'largest' },
];

/** Tile-size slider and (optionally) the sort order of a gallery. */
@Component({
  selector: 'app-gallery-controls',
  imports: [FormsModule, SelectModule, SliderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center gap-4' },
  template: `
    <label class="hidden items-center gap-3 text-muted sm:flex" title="Tamanho das miniaturas">
      <i class="pi pi-th-large text-xs"></i>
      <p-slider [(ngModel)]="ui.tileSize" [min]="96" [max]="280" [step]="8" styleClass="w-24" ariaLabel="Tamanho das miniaturas" />
      <i class="pi pi-stop text-sm"></i>
    </label>
    @if (sort() !== undefined) {
      <p-select [options]="sorts" optionLabel="label" optionValue="value" [(ngModel)]="sort" size="small" styleClass="w-40" ariaLabel="Ordenação" />
    }
  `,
})
export class GalleryControlsComponent {
  /** Leave unbound to hide the sort select. */
  readonly sort = model<MediaSort | undefined>(undefined);
  protected readonly ui = inject(UiStore);
  protected readonly sorts = SORT_OPTIONS;
}
