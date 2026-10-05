import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { Backend } from '../../core/ipc/backend';
import {
  editPreviewUrl,
  itemThumbnailUrl,
  livePreviewUrl,
  mediaUrl,
  previewUrl,
  unwrap,
  type AlbumRef,
  type MediaContext,
  type MediaItem,
} from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { MediaActions } from '../../core/stores/media-actions.service';
import { MediaBus } from '../../core/stores/media-bus';
import { SelectionStore } from '../../core/stores/selection.store';
import { isEditable } from '../../core/stores/enhance.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { FineTuneComponent, type RecipeChange } from '../enhance/fine-tune.component';
import { LivePreview, REST_EDGE } from '../enhance/live-preview';
import { AlbumPicker } from '../../shared/album-picker.component';
import { MediaAnalysisComponent } from '../../shared/media-analysis.component';
import { MediaDetailsComponent } from '../../shared/media-details.component';
import { MediaReviewComponent } from '../../shared/media-review.component';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];
/** Neighbours fetched per side for the thumbnail strip. */
const STRIP_RADIUS = 12;

/** Full-screen dark viewer (PRD §23.3). Route: /viewer/:id */
@Component({
  selector: 'app-viewer-page',
  imports: [RouterLink, ButtonModule, TooltipModule, FineTuneComponent, MediaAnalysisComponent, MediaDetailsComponent, MediaReviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex h-full flex-col bg-[#0b0f17] text-slate-100',
    '(window:keydown)': 'onKey($event)',
    '(window:keyup)': 'onKeyUp($event)',
  },
  template: `
    <header class="flex h-14 shrink-0 items-center gap-1 border-b border-white/5 px-3">
      <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Voltar" pTooltip="Voltar (Esc)" tooltipPosition="bottom" (onClick)="close()" />
      @if (ctx(); as c) {
        <span data-counter class="ml-1 text-sm tabular-nums text-slate-300">{{ c.position }} / {{ c.total }}</span>
      }
      <span class="ml-3 min-w-0 flex-1 truncate text-sm text-slate-400">{{ item()?.filename }}</span>

      @if (item(); as m) {
        @if (m.mediaType === 'image') {
          <p-button icon="pi pi-minus" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Diminuir zoom" (onClick)="zoomBy(-1)" />
          <button type="button" class="w-12 text-center text-xs tabular-nums text-slate-300" (click)="zoom.set(1)" title="Zoom 100% (0)">{{ zoomLabel() }}</button>
          <p-button icon="pi pi-plus" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Aumentar zoom" (onClick)="zoomBy(1)" />
          <span class="mx-1 h-5 w-px bg-white/10"></span>
        }
        <p-button
          [icon]="m.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
          [text]="true"
          [rounded]="true"
          [severity]="m.isFavorite ? 'danger' : 'contrast'"
          [ariaLabel]="m.isFavorite ? 'Remover dos favoritos' : 'Favoritar'"
          [pTooltip]="m.isFavorite ? 'Remover dos favoritos (F)' : 'Favoritar (F)'"
          tooltipPosition="bottom"
          (onClick)="toggleFavorite()"
        />
        @if (m.edited || tuning()) {
          <p-button
            icon="pi pi-images"
            [text]="!compare()"
            [rounded]="true"
            severity="contrast"
            ariaLabel="Comparar com o original"
            pTooltip="Ver o original (segure \\)"
            tooltipPosition="bottom"
            (onClick)="compare.set(!compare())"
          />
        }
        @if (canEdit(m)) {
          <p-button
            icon="pi pi-sun"
            [text]="!tuning()"
            [rounded]="true"
            severity="contrast"
            ariaLabel="Melhorar"
            pTooltip="Melhorar (E)"
            tooltipPosition="bottom"
            (onClick)="tuning.set(!tuning())"
          />
        }
        <p-button icon="pi pi-book" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Adicionar ao álbum" pTooltip="Adicionar ao álbum" tooltipPosition="bottom" (onClick)="picker.open([m.id])" />
        @if (m.inTrash) {
          <p-button icon="pi pi-replay" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Restaurar" pTooltip="Restaurar da lixeira" tooltipPosition="bottom" (onClick)="restoreCurrent()" />
        } @else {
          <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="contrast" ariaLabel="Enviar para a lixeira" pTooltip="Enviar para a lixeira (Delete)" tooltipPosition="bottom" (onClick)="trashCurrent()" />
        }
      }
      <p-button
        icon="pi pi-info-circle"
        [text]="!showDetails()"
        [rounded]="true"
        severity="contrast"
        ariaLabel="Detalhes"
        pTooltip="Detalhes (I)"
        tooltipPosition="bottom"
        (onClick)="showDetails.set(!showDetails())"
      />
    </header>

    <div class="flex min-h-0 flex-1">
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" (wheel)="onWheel($event)">
          @if (item(); as m) {
            @if (m.mediaType === 'image') {
              @if (src()) {
                <img
                  [src]="src()"
                  [alt]="m.filename"
                  class="max-h-full max-w-full select-none object-contain transition-transform duration-150"
                  [style.transform]="'scale(' + zoom() + ')'"
                  (dblclick)="zoom.set(zoom() === 1 ? 2 : 1)"
                  (load)="onImageLoad()"
                  (error)="onImageError()"
                  draggable="false"
                />
                @if (compare()) {
                  <span class="absolute left-4 top-4 rounded bg-black/60 px-2 py-1 text-xs text-white">Original</span>
                }
              } @else {
                <p class="text-slate-400">Pré-visualização indisponível para este formato ({{ m.extension.toUpperCase() }}).</p>
              }
            } @else {
              <video [src]="original()" [attr.poster]="m.thumbVersion > 0 ? preview(m) : null" controls autoplay class="max-h-full max-w-full" (error)="videoError.set(true)"></video>
              @if (videoError()) {
                <p class="absolute bottom-6 rounded bg-black/70 px-3 py-2 text-sm text-slate-300">Este formato de vídeo não é suportado pelo visualizador.</p>
              }
            }
          } @else if (failed()) {
            <p class="text-slate-400">Não foi possível abrir este item.</p>
          }

          @if (prev(); as p) {
            <p-button icon="pi pi-chevron-left" [rounded]="true" severity="secondary" ariaLabel="Anterior (←)" styleClass="!absolute left-4 top-1/2 -translate-y-1/2 !bg-black/50 !border-0 !text-white" (onClick)="go(p.id)" />
          }
          @if (next(); as n) {
            <p-button icon="pi pi-chevron-right" [rounded]="true" severity="secondary" ariaLabel="Próxima (→)" styleClass="!absolute right-4 top-1/2 -translate-y-1/2 !bg-black/50 !border-0 !text-white" (onClick)="go(n.id)" />
          }
        </div>

        @if ((ctx()?.items?.length ?? 0) > 1) {
          <div #strip class="flex h-20 shrink-0 items-center gap-1.5 overflow-x-auto border-t border-white/5 px-3" role="listbox" aria-label="Miniaturas">
            @for (s of ctx()!.items; track s.id) {
              <button
                type="button"
                role="option"
                class="relative size-14 shrink-0 overflow-hidden rounded-md opacity-60 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                [class.!opacity-100]="s.id === id()"
                [class.ring-2]="s.id === id()"
                [class.ring-primary]="s.id === id()"
                [attr.aria-selected]="s.id === id()"
                [attr.aria-label]="s.filename"
                [attr.data-current]="s.id === id() ? '' : null"
                (click)="go(s.id)"
              >
                @if (s.mediaType === 'image') {
                  <img [src]="thumb(s)" alt="" class="size-full object-cover" loading="lazy" />
                } @else {
                  <span class="flex size-full items-center justify-center bg-slate-800"><i class="pi pi-video text-slate-400"></i></span>
                }
              </button>
            }
          </div>
        }
      </div>

      @if (tuning() && item(); as m) {
        <aside class="w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-[#111827] p-5">
          <app-fine-tune [item]="m" (recipeChange)="onRecipe($event)" (closed)="tuning.set(false)" />
        </aside>
      } @else if (showDetails() && item(); as m) {
        <aside class="w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-[#111827] p-5">
          <h2 class="mb-4 text-sm font-semibold text-white">Detalhes</h2>
          <app-media-details [item]="m" [dark]="true" />
          <app-media-review class="mt-5" [item]="m" [dark]="true" />
          <app-media-analysis class="mt-5" [item]="m" [dark]="true" />

          @if (albums().length) {
            <h4 class="mb-2 mt-5 text-sm font-semibold text-white">Álbuns</h4>
            <div class="flex flex-wrap gap-1.5">
              @for (a of albums(); track a.id) {
                <a [routerLink]="['/albums', a.id]" class="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-200 hover:bg-white/20">{{ a.name }}</a>
              }
            </div>
          }

          <h4 class="mb-2 mt-5 text-sm font-semibold text-white">Ações</h4>
          <div class="flex flex-col gap-2">
            <p-button [label]="m.isFavorite ? 'Remover dos favoritos' : 'Favoritar'" [icon]="m.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'" severity="secondary" [outlined]="true" styleClass="w-full !justify-start" (onClick)="toggleFavorite()" />
            <p-button label="Adicionar ao álbum" icon="pi pi-book" severity="secondary" [outlined]="true" styleClass="w-full !justify-start" (onClick)="picker.open([m.id])" />
            @if (!m.inTrash) {
              <p-button label="Usar como exemplo do que remover" icon="pi pi-sparkles" severity="secondary" [outlined]="true" styleClass="w-full !justify-start" (onClick)="actions.addExamples([m.id], 'remove')" />
              <p-button label="Enviar para a lixeira" icon="pi pi-trash" severity="danger" [outlined]="true" styleClass="w-full !justify-start" (onClick)="trashCurrent()" />
            }
          </div>
        </aside>
      }
    </div>
  `,
})
export class ViewerPage {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly selection = inject(SelectionStore);
  private readonly context = inject(ViewerContext);
  protected readonly actions = inject(MediaActions);
  private readonly router = inject(Router);
  protected readonly picker = inject(AlbumPicker);
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

  /** Route parameter (bound by `withComponentInputBinding`). */
  readonly id = input.required<string>();

  protected readonly ctx = signal<MediaContext | null>(null);
  protected preview(m: MediaItem): string {
    return previewUrl(m.id, m.thumbVersion);
  }

  protected readonly item = computed(() => {
    const c = this.ctx();
    return c?.items[c.index] ?? null;
  });
  protected readonly prev = computed(() => {
    const c = this.ctx();
    return c && c.index > 0 ? c.items[c.index - 1] : null;
  });
  protected readonly next = computed(() => {
    const c = this.ctx();
    return c ? (c.items[c.index + 1] ?? null) : null;
  });
  protected readonly albums = signal<AlbumRef[]>([]);
  protected readonly failed = signal(false);
  protected readonly zoom = signal(1);
  protected readonly showDetails = signal(true);
  protected readonly videoError = signal(false);

  /** preview (1024 WebP, instant) → original (full quality) → none (undecodable). */
  private readonly stage = signal<'preview' | 'original' | 'none'>('preview');
  private failedStages = new Set<'preview' | 'original'>();
  protected readonly original = computed(() => mediaUrl(this.id()));
  /** Fine tuning open ("Melhorar", E). */
  protected readonly tuning = signal(false);
  /** Showing the original of an improved photo (\\ held or the button). */
  protected readonly compare = signal(false);
  /** Live preview while tuning. */
  private readonly live = signal<LivePreview | null>(null);
  /** Improved photo at full preview size, once loaded. */
  private readonly editedFull = signal<string | null>(null);

  protected readonly src = computed(() => {
    const m = this.item();
    if (!m) return '';
    if (!this.compare() && m.mediaType === 'image') {
      const live = this.live()?.src();
      if (this.tuning() && live) return live;
      if (m.edited) return this.editedFull() ?? (m.editVersion > 0 ? editPreviewUrl(m.id, m.editVersion) : this.baseSrc());
    }
    return this.baseSrc();
  });

  /** The original: preview, then the file itself. */
  private readonly baseSrc = computed(() => {
    const m = this.item();
    if (!m) return '';
    switch (this.stage()) {
      case 'original':
        return this.original();
      case 'preview':
        return previewUrl(m.id, m.thumbVersion);
      default:
        return '';
    }
  });
  protected readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    // Favorites and analysis results update the item and the strip.
    const bus = inject(MediaBus);
    bus.subscribe((update) => {
      const c = this.ctx();
      if (!c) return;
      const byId = new Map(update.items.map((m) => [m.id, m]));
      if (c.items.some((m) => byId.has(m.id))) {
        this.ctx.set({ ...c, items: c.items.map((m) => byId.get(m.id) ?? m) });
      }
    });
    // Tuning: a live preview per photo.
    effect(() => {
      const id = this.item()?.id;
      const tuning = this.tuning();
      untracked(() =>
        this.live.set(
          tuning && id ? new LivePreview(id, (recipe) => unwrap(this.backend.commands.setEditDraft(id, recipe))) : null,
        ),
      );
    });
    // Improved photo: its 1024 thumbnail at once, then the sharper render.
    effect(() => {
      const m = this.item();
      const tuning = this.tuning();
      untracked(() => this.loadEdited(m, tuning));
    });
    // Keep the current thumbnail visible in the strip.
    effect(() => {
      this.ctx();
      const strip = this.strip()?.nativeElement;
      requestAnimationFrame(() =>
        strip?.querySelector('[data-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }),
      );
    });
  }

  private async load(id: string) {
    this.zoom.set(1);
    this.compare.set(false);
    this.videoError.set(false);
    this.failed.set(false);
    try {
      const ctx = await unwrap(
        this.backend.commands.getMediaContext(id, this.context.state().query, STRIP_RADIUS),
      );
      if (id !== this.id()) return;
      this.ctx.set(ctx);
      const item = ctx.items[ctx.index];
      this.selection.focus(item);
      this.startImage(item);
      this.albums.set(await unwrap(this.backend.commands.getMediaAlbums(id)).catch(() => []));
    } catch (e) {
      this.failed.set(true);
      this.notify.error('Não foi possível abrir o item', e);
    }
  }

  /** Show the preview at once, then swap in the original when it has loaded. */
  private startImage(item: MediaItem) {
    this.failedStages = new Set();
    if (item.mediaType !== 'image') return;
    if (!item.thumbVersion) {
      this.stage.set('original');
      return;
    }
    this.stage.set('preview');
    const full = new Image();
    full.decoding = 'async';
    full.onload = () => {
      if (this.id() === item.id && !this.failedStages.has('original')) this.stage.set('original');
    };
    full.src = mediaUrl(item.id);
  }

  private loadEdited(m: MediaItem | null, tuning: boolean) {
    this.editedFull.set(null);
    if (!m?.edited || tuning || m.mediaType !== 'image') return;
    // Never cached by the backend: a fresh `v` after tuning shows the saved recipe.
    const url = livePreviewUrl(m.id, { edge: REST_EDGE, version: Date.now() });
    const full = new Image();
    full.decoding = 'async';
    full.onload = () => {
      if (this.item()?.id === m.id && !this.tuning()) this.editedFull.set(url);
    };
    full.src = url;
  }

  protected canEdit(m: MediaItem): boolean {
    return m.mediaType === 'image' && !m.inTrash && isEditable(m.extension);
  }

  protected onRecipe(change: RecipeChange) {
    this.live()?.update(change.recipe, change.resting);
  }

  protected onImageLoad() {
    if (this.tuning()) this.live()?.loaded();
  }

  protected go(id: string | null | undefined) {
    if (id) void this.router.navigate(['/viewer', id], { replaceUrl: true });
  }

  protected close() {
    void this.router.navigateByUrl(this.context.state().returnUrl);
  }

  protected toggleFavorite() {
    const m = this.item();
    if (m) void this.actions.setFavorite([m.id], !m.isFavorite);
  }

  /** Trash the photo on screen and move on to the next one (or back, at the end). */
  protected async trashCurrent() {
    const m = this.item();
    if (!m || m.inTrash) return;
    const target = this.next() ?? this.prev();
    const done = await this.actions.trash([m.id]);
    if (!done.length || this.item()?.id !== m.id) return;
    if (target) this.go(target.id);
    else this.close();
  }

  protected async restoreCurrent() {
    const m = this.item();
    if (!m?.inTrash) return;
    const target = this.next() ?? this.prev();
    if (!(await this.actions.restore([m.id])) || this.item()?.id !== m.id) return;
    // Inside the trash the restored photo leaves the context.
    if (this.context.state().query.filter?.trashed) {
      if (target) this.go(target.id);
      else this.close();
    }
  }

  protected thumb(m: MediaItem) {
    return itemThumbnailUrl(m);
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

  /** Original undecodable (HEIC/TIFF) → preview; preview missing → original; else none. */
  protected onImageError() {
    if (this.src() !== this.baseSrc()) {
      // A live/edited render failed: release the preview loop, show the original.
      this.live()?.loaded();
      this.compare.set(true);
      return;
    }
    const stage = this.stage();
    if (stage === 'none') return;
    this.failedStages.add(stage);
    const other = stage === 'preview' ? 'original' : 'preview';
    this.stage.set(this.failedStages.has(other) ? 'none' : other);
  }

  protected onKeyUp(event: KeyboardEvent) {
    if (event.key === '\\') this.compare.set(false);
  }

  protected onKey(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, .p-dialog')) return;
    switch (event.key) {
      case 'ArrowLeft':
        this.go(this.prev()?.id);
        break;
      case 'ArrowRight':
        this.go(this.next()?.id);
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
      case 'f':
      case 'F':
        this.toggleFavorite();
        break;
      case 'i':
      case 'I':
        this.showDetails.update((v) => !v);
        break;
      case 'Delete':
        void this.trashCurrent();
        break;
      case 'e':
      case 'E': {
        const m = this.item();
        if (m && this.canEdit(m)) this.tuning.update((v) => !v);
        break;
      }
      case '\\':
        if (this.item()?.edited || this.tuning()) this.compare.set(true);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
