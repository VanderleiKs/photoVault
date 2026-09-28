import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { Backend } from '../../core/ipc/backend';
import {
  mediaUrl,
  thumbnailUrl,
  unwrap,
  type MediaItem,
  type MediaNavigation,
} from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { MediaStore } from '../../core/stores/media.store';
import { MediaDetailsComponent } from '../../shared/media-details.component';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

/** Full-screen dark viewer (PRD §23.3). Route: /viewer/:id */
@Component({
  selector: 'app-viewer-page',
  imports: [ButtonModule, TooltipModule, MediaDetailsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex h-full flex-col bg-[#0b0f17] text-slate-100',
    '(window:keydown)': 'onKey($event)',
  },
  template: `
    <header class="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-3">
      <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Voltar" pTooltip="Voltar (Esc)" (onClick)="close()" />
      @if (nav(); as n) {
        <span class="text-sm tabular-nums text-slate-300">{{ n.position }} / {{ n.total }}</span>
      }
      <span class="ml-2 min-w-0 flex-1 truncate text-sm text-slate-400">{{ item()?.filename }}</span>

      @if (item()?.mediaType === 'image') {
        <p-button icon="pi pi-minus" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Diminuir zoom" (onClick)="zoomBy(-1)" />
        <button type="button" class="w-12 text-center text-xs tabular-nums text-slate-300" (click)="zoom.set(1)" title="Zoom 100% (0)">
          {{ zoomLabel() }}
        </button>
        <p-button icon="pi pi-plus" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Aumentar zoom" (onClick)="zoomBy(1)" />
      }
      <p-button
        icon="pi pi-info-circle"
        [text]="!showDetails()"
        [rounded]="true"
        severity="contrast"
        ariaLabel="Detalhes"
        pTooltip="Detalhes (I)"
        (onClick)="showDetails.set(!showDetails())"
      />
    </header>

    <div class="flex min-h-0 flex-1">
      <div class="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden" (wheel)="onWheel($event)">
        @if (item(); as m) {
          @if (m.mediaType === 'image') {
            <img
              [src]="src()"
              [alt]="m.filename"
              class="max-h-full max-w-full select-none object-contain transition-transform duration-150"
              [style.transform]="'scale(' + zoom() + ')'"
              (dblclick)="zoom.set(zoom() === 1 ? 2 : 1)"
              (error)="onImageError()"
              draggable="false"
            />
          } @else {
            <video [src]="original()" controls autoplay class="max-h-full max-w-full" (error)="videoError.set(true)"></video>
            @if (videoError()) {
              <p class="absolute bottom-6 rounded bg-black/70 px-3 py-2 text-sm text-slate-300">
                Este formato de vídeo não é suportado pelo visualizador.
              </p>
            }
          }
        } @else if (failed()) {
          <p class="text-slate-400">Não foi possível abrir este item.</p>
        }

        @if (nav()?.prevId) {
          <p-button icon="pi pi-chevron-left" [rounded]="true" severity="secondary" ariaLabel="Anterior" styleClass="!absolute left-4 top-1/2 -translate-y-1/2 !bg-black/50 !border-0 !text-white" (onClick)="go(nav()!.prevId)" />
        }
        @if (nav()?.nextId) {
          <p-button icon="pi pi-chevron-right" [rounded]="true" severity="secondary" ariaLabel="Próxima" styleClass="!absolute right-4 top-1/2 -translate-y-1/2 !bg-black/50 !border-0 !text-white" (onClick)="go(nav()!.nextId)" />
        }
      </div>

      @if (showDetails() && item(); as m) {
        <aside class="w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-[#111827] p-5">
          <h2 class="mb-4 text-sm font-semibold text-white">Detalhes</h2>
          <app-media-details [item]="m" [dark]="true" />
        </aside>
      }
    </div>
  `,
})
export class ViewerPage {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly media = inject(MediaStore);
  private readonly router = inject(Router);

  /** Route parameter (bound by `withComponentInputBinding`). */
  readonly id = input.required<string>();

  protected readonly item = signal<MediaItem | null>(null);
  protected readonly nav = signal<MediaNavigation | null>(null);
  protected readonly failed = signal(false);
  protected readonly zoom = signal(1);
  protected readonly showDetails = signal(true);
  protected readonly videoError = signal(false);
  /** Falls back to the thumbnail when the WebView cannot decode the original (HEIC/TIFF). */
  private readonly useThumbnail = signal(false);

  protected readonly original = computed(() => mediaUrl(this.id()));
  protected readonly src = computed(() =>
    this.useThumbnail() ? thumbnailUrl(this.id()) : this.original(),
  );
  protected readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string) {
    this.zoom.set(1);
    this.useThumbnail.set(false);
    this.videoError.set(false);
    this.failed.set(false);
    try {
      const [item, nav] = await Promise.all([
        unwrap(this.backend.commands.getMedia(id)),
        unwrap(this.backend.commands.getMediaNavigation(id)),
      ]);
      if (id !== this.id()) return;
      this.item.set(item);
      this.nav.set(nav);
      this.media.select(item);
    } catch (e) {
      this.failed.set(true);
      this.notify.error('Não foi possível abrir o item', e);
    }
  }

  protected go(id: string | null | undefined) {
    if (id) void this.router.navigate(['/viewer', id], { replaceUrl: true });
  }

  protected close() {
    void this.router.navigate(['/photos']);
  }

  protected zoomBy(direction: 1 | -1) {
    const current = ZOOM_STEPS.findIndex((z) => z >= this.zoom());
    const index = Math.min(Math.max((current < 0 ? 2 : current) + direction, 0), ZOOM_STEPS.length - 1);
    this.zoom.set(ZOOM_STEPS[index]);
  }

  protected onWheel(event: WheelEvent) {
    if (this.item()?.mediaType !== 'image') return;
    event.preventDefault();
    this.zoomBy(event.deltaY < 0 ? 1 : -1);
  }

  protected onImageError() {
    if (!this.useThumbnail()) this.useThumbnail.set(true);
  }

  protected onKey(event: KeyboardEvent) {
    if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;
    switch (event.key) {
      case 'ArrowLeft':
        this.go(this.nav()?.prevId);
        break;
      case 'ArrowRight':
        this.go(this.nav()?.nextId);
        break;
      case 'Escape':
        this.close();
        break;
      case '+':
      case '=':
        this.zoomBy(1);
        break;
      case '-':
        this.zoomBy(-1);
        break;
      case '0':
        this.zoom.set(1);
        break;
      case 'i':
      case 'I':
        this.showDetails.update((v) => !v);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
