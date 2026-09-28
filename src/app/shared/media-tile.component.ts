import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { formatDuration } from '../core/format';
import { thumbnailUrl, type MediaItem } from '../core/ipc/ipc';
import { JobStore } from '../core/stores/job.store';

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
      @if (failedSrc() !== src()) {
        <img
          [src]="src()"
          [alt]="item().filename"
          loading="lazy"
          decoding="async"
          draggable="false"
          (error)="failedSrc.set(src())"
          class="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
      } @else if (item().thumbVersion === 0 && jobs.busy()) {
        <div class="flex size-full flex-col items-center justify-center gap-1.5 text-muted" title="Gerando miniatura…">
          <i class="pi pi-image animate-pulse text-2xl"></i>
          <span class="max-w-[90%] truncate text-[11px]">{{ item().filename }}</span>
        </div>
      } @else {
        <div class="flex size-full flex-col items-center justify-center gap-1.5 text-muted" title="Miniatura indisponível">
          <i class="pi pi-image text-2xl opacity-60"></i>
          <span class="max-w-[90%] truncate text-[11px]">{{ item().filename }}</span>
        </div>
      }
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

  protected readonly src = computed(() => thumbnailUrl(this.item().id, this.item().thumbVersion));
  protected readonly duration = computed(() => formatDuration(this.item().durationMs));
  protected readonly jobs = inject(JobStore);
  /** URL that failed to load; a new `thumbVersion` yields a new URL and retries. */
  protected readonly failedSrc = signal<string | null>(null);
}
