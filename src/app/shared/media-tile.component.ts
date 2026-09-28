import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatDuration } from '../core/format';
import { thumbnailUrl, usePlaceholder, type MediaItem } from '../core/ipc/ipc';

/** Square gallery tile. Click selects, double-click / Enter opens. */
@Component({
  selector: 'app-media-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'group relative block aspect-square cursor-pointer overflow-hidden rounded-tile bg-panel-2 outline-none',
    '[class.ring-3]': 'selected()',
    '[class.ring-primary]': 'selected()',
    '[attr.aria-label]': 'item().filename',
    '[attr.aria-selected]': 'selected()',
    role: 'option',
    tabindex: '0',
    '(click)': 'select.emit(item())',
    '(dblclick)': 'open.emit(item())',
    '(keydown.enter)': 'open.emit(item())',
    '(keydown.space)': '$event.preventDefault(); select.emit(item())',
  },
  template: `
    @if (item().mediaType === 'image') {
      <img
        [src]="src()"
        [alt]="item().filename"
        loading="lazy"
        decoding="async"
        draggable="false"
        (error)="onError($event)"
        class="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      />
    } @else {
      <div class="flex size-full items-center justify-center bg-slate-800 text-slate-400">
        <i class="pi pi-video text-3xl"></i>
      </div>
      <span class="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        <i class="pi pi-video text-[10px]"></i>{{ duration() ?? 'Vídeo' }}
      </span>
    }
    @if (item().isFavorite) {
      <i class="pi pi-heart-fill absolute right-2 top-2 text-sm text-white drop-shadow"></i>
    }
    <div class="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10"></div>
  `,
})
export class MediaTileComponent {
  readonly item = input.required<MediaItem>();
  readonly selected = input(false);
  readonly select = output<MediaItem>();
  readonly open = output<MediaItem>();

  protected readonly src = computed(() => thumbnailUrl(this.item().id));
  protected readonly duration = computed(() => formatDuration(this.item().durationMs));

  protected onError(event: Event) {
    usePlaceholder(event);
  }
}
