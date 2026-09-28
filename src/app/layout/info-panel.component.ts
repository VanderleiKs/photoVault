import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { thumbnailUrl, usePlaceholder } from '../core/ipc/ipc';
import { MediaStore } from '../core/stores/media.store';
import { UiStore } from '../core/stores/ui.store';
import { MediaDetailsComponent } from '../shared/media-details.component';

/** Right-hand "Informações" panel for the selected item. */
@Component({
  selector: 'app-info-panel',
  imports: [ButtonModule, MediaDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-80 shrink-0 flex-col overflow-y-auto border-l border-line bg-panel' },
  template: `
    @if (media.selected(); as item) {
      <div class="flex items-center justify-between px-5 pb-3 pt-4">
        <h2 class="text-sm font-semibold">Informações</h2>
        <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" size="small" ariaLabel="Fechar" (onClick)="ui.infoPanelOpen.set(false)" />
      </div>
      <div class="px-5 pb-6">
        <button type="button" class="block w-full cursor-zoom-in overflow-hidden rounded-card bg-panel-2" (click)="open(item.id)" aria-label="Abrir no visualizador">
          @if (item.mediaType === 'image') {
            <img [src]="thumb()" [alt]="item.filename" class="aspect-[4/3] w-full object-cover" (error)="onError($event)" />
          } @else {
            <div class="flex aspect-[4/3] items-center justify-center bg-slate-800 text-slate-400"><i class="pi pi-video text-4xl"></i></div>
          }
        </button>
        <app-media-details class="mt-4" [item]="item" />
        <p-button label="Abrir" icon="pi pi-external-link" [outlined]="true" styleClass="mt-5 w-full" (onClick)="open(item.id)" />
      </div>
    }
  `,
})
export class InfoPanelComponent {
  protected readonly media = inject(MediaStore);
  protected readonly ui = inject(UiStore);
  private readonly router = inject(Router);

  protected readonly thumb = computed(() => {
    const id = this.media.selectedId();
    return id ? thumbnailUrl(id) : '';
  });

  protected open(id: string) {
    void this.router.navigate(['/viewer', id]);
  }

  protected onError(event: Event) {
    usePlaceholder(event);
  }
}
