import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { formatDuration } from '../core/format';
import { thumbnailUrl, type MediaItem } from '../core/ipc/ipc';
import { JobStore } from '../core/stores/job.store';

/**
 * Square gallery tile (PRD §23.2): selection circle (top left), favorite heart
 * (top right), video duration. Click = focus/select, double-click / Enter = open.
 */
@Component({
  selector: 'app-media-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'group relative block aspect-square cursor-pointer overflow-hidden rounded-tile bg-panel-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/60',
    '[class.ring-3]': 'focused() || checked()',
    '[class.ring-primary]': 'focused() || checked()',
    '[attr.aria-label]': 'item().filename',
    '[attr.aria-selected]': 'checked() || focused()',
    role: 'option',
    tabindex: '0',
    '(click)': 'select.emit($event)',
    '(dblclick)': 'open.emit()',
    '(keydown.enter)': 'open.emit()',
    '(keydown.space)': '$event.preventDefault(); check.emit()',
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
          [class.scale-90]="checked()"
          [class.rounded-lg]="checked()"
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

    @if (badge(); as b) {
      <span class="pointer-events-none absolute bottom-1.5 left-1.5 max-w-[85%] truncate rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">{{ b }}</span>
    }

    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 to-transparent to-40% opacity-0 transition-opacity group-hover:opacity-100" [class.opacity-100]="selecting()"></div>

    <button
      type="button"
      class="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-opacity"
      [class]="checkClass()"
      [attr.aria-label]="checked() ? 'Desmarcar' : 'Selecionar'"
      [attr.aria-pressed]="checked()"
      tabindex="-1"
      (click)="$event.stopPropagation(); check.emit()"
      (dblclick)="$event.stopPropagation()"
    >
      <i class="pi pi-check text-[11px] font-bold"></i>
    </button>

    <button
      type="button"
      class="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full text-white drop-shadow transition-opacity hover:scale-110"
      [class]="item().isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'"
      [attr.aria-label]="item().isFavorite ? 'Remover dos favoritos' : 'Favoritar'"
      [attr.aria-pressed]="item().isFavorite"
      tabindex="-1"
      (click)="$event.stopPropagation(); favorite.emit()"
      (dblclick)="$event.stopPropagation()"
    >
      <i class="pi text-sm" [class]="item().isFavorite ? 'pi-heart-fill text-rose-500' : 'pi-heart'"></i>
    </button>
  `,
})
export class MediaTileComponent {
  readonly item = input.required<MediaItem>();
  /** Shown in the info panel. */
  readonly focused = input(false);
  /** Part of the multi-selection. */
  readonly checked = input(false);
  /** Selection mode: circles always visible. */
  readonly selecting = input(false);
  /** Short text over the bottom of the tile (e.g. the review reason). */
  readonly badge = input<string | null>(null);

  readonly select = output<MouseEvent>();
  readonly open = output<void>();
  readonly check = output<void>();
  readonly favorite = output<void>();

  protected readonly jobs = inject(JobStore);
  protected readonly src = computed(() => thumbnailUrl(this.item().id, this.item().thumbVersion));
  protected readonly checkClass = computed(() => {
    if (this.checked()) return 'border-primary bg-primary text-white opacity-100';
    const base = 'border-white/90 bg-black/20 text-transparent hover:text-white/80';
    return this.selecting() ? `${base} opacity-100` : `${base} opacity-0 group-hover:opacity-100`;
  });
  protected readonly duration = computed(() => formatDuration(this.item().durationMs));
  /** URL that failed to load; a new `thumbVersion` yields a new URL and retries. */
  protected readonly failedSrc = signal<string | null>(null);
}
