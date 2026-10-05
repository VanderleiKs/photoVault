import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { formatCount } from '../../core/format';
import { livePreviewUrl, type ArrangeScope, type EditBatch, type MediaItem } from '../../core/ipc/ipc';
import { AlbumStore } from '../../core/stores/album.store';
import { EnhanceStore } from '../../core/stores/enhance.store';
import { EventStore } from '../../core/stores/event.store';
import { SelectionStore } from '../../core/stores/selection.store';
import { ViewerContext } from '../../core/stores/viewer-context';

/** Edge of the before/after tiles. */
const SAMPLE_EDGE = 480;
/** Wait after the intensity control stops before re-rendering the grid. */
const INTENSITY_DELAY_MS = 250;

/**
 * "Melhorar fotos" (PRD §29): which photos → style and intensity → before/after →
 * apply (non-destructive) → history with undo.
 */
@Component({
  selector: 'app-enhance-page',
  imports: [FormsModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-sun text-muted"></i>Melhorar fotos</h1>
      <p class="max-w-3xl text-sm text-muted">
        Corrige cor, exposição, sombras e realces de cada foto automaticamente, como um fotógrafo faria antes de entregar.
        Os arquivos originais nunca mudam: a melhoria fica guardada no PhotoVault e pode ser desfeita.
      </p>
    </header>

    <div class="space-y-6 p-6">
      <section class="rounded-card border border-line bg-panel p-5">
        <h2 class="font-semibold"><span class="mr-2 text-muted">1</span>Quais fotos</h2>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <select class="rounded-md border border-line bg-panel px-2 py-1.5 text-sm" [ngModel]="scopeKey()" (ngModelChange)="scopeKey.set($event)" aria-label="Quais fotos">
            <option value="all">Toda a biblioteca</option>
            @if (selection.count()) {
              <option value="selection">As {{ fmt(selection.count()) }} fotos selecionadas</option>
            }
            @for (a of albums.albums(); track a.id) {
              <option [value]="'album:' + a.id">Álbum: {{ a.name }}</option>
            }
            @for (e of acceptedEvents(); track e.id) {
              <option [value]="'event:' + e.id">{{ e.kind === 'trip' ? 'Viagem' : 'Evento' }}: {{ e.title }}</option>
            }
          </select>
          @if (store.loading()) {
            <i class="pi pi-spin pi-spinner text-sm text-muted"></i>
          }
        </div>
        @if (store.summaryError(); as err) {
          <p class="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300" role="alert">{{ err }}</p>
        } @else if (s(); as s) {
          <p class="mt-3 text-sm">
            <strong>{{ fmt(s.editable) }}</strong> {{ s.editable === 1 ? 'foto será melhorada' : 'fotos serão melhoradas' }}
            @if (s.edited) {
              · {{ fmt(s.edited) }} já {{ s.edited === 1 ? 'tem' : 'têm' }} melhoria (o ajuste fino é mantido)
            }
            @if (s.excluded) {
              · {{ fmt(s.excluded) }} {{ s.excluded === 1 ? 'fica' : 'ficam' }} de fora (vídeos, screenshots, documentos e formatos como HEIC)
            }
          </p>
        }
      </section>

      <section class="rounded-card border border-line bg-panel p-5">
        <h2 class="font-semibold"><span class="mr-2 text-muted">2</span>Estilo</h2>
        <div class="mt-3 flex flex-wrap items-center gap-6">
          <div class="rounded-lg border-2 border-primary bg-primary/5 px-4 py-2.5">
            <p class="text-sm font-medium">Natural</p>
            <p class="text-xs text-muted">Corrige sem mudar a cara da foto</p>
          </div>
          <label class="flex min-w-72 flex-1 items-center gap-3 text-sm">
            Intensidade
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              class="flex-1 accent-[var(--p-primary-color)]"
              aria-label="Intensidade"
              [value]="intensityPercent()"
              (input)="setIntensity($event)"
            />
            <span class="w-10 text-right tabular-nums">{{ intensityPercent() }}%</span>
          </label>
        </div>
        <p class="mt-3 text-xs text-muted">Mais estilos (Vivo, Quente, Suave, Preto e branco, Cinema) chegam na próxima versão.</p>
      </section>

      <section class="rounded-card border border-line bg-panel p-5">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="flex-1 font-semibold"><span class="mr-2 text-muted">3</span>Antes e depois</h2>
          <p-button
            [label]="showBefore() ? 'Ver melhoradas' : 'Ver originais'"
            [icon]="showBefore() ? 'pi pi-sun' : 'pi pi-image'"
            size="small"
            severity="secondary"
            [outlined]="true"
            (onClick)="showBefore.set(!showBefore())"
          />
          <p-button
            [label]="s() && s()!.editable ? 'Melhorar ' + fmt(s()!.editable) + (s()!.editable === 1 ? ' foto…' : ' fotos…') : 'Melhorar…'"
            icon="pi pi-sun"
            [loading]="store.applying()"
            [disabled]="!s()?.editable"
            (onClick)="apply()"
          />
        </div>
        <p class="mt-1 text-xs text-muted">Segure o clique numa foto para ver o original. Duplo clique abre a foto.</p>
        @if (s()?.sample?.length) {
          <div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
            @for (id of s()!.sample; track id) {
              <button
                type="button"
                class="relative aspect-[4/3] overflow-hidden rounded-tile bg-panel-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/60"
                [attr.aria-label]="'Comparar ' + id"
                (pointerdown)="pressed.set(id)"
                (pointerup)="pressed.set(null)"
                (pointerleave)="pressed.set(null)"
                (dblclick)="open(id)"
              >
                <img [src]="sampleUrl(id)" alt="" class="size-full object-cover" draggable="false" loading="lazy" />
                <span class="pointer-events-none absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                  {{ showBefore() || pressed() === id ? 'Original' : 'Melhorada' }}
                </span>
              </button>
            }
          </div>
        } @else if (s()) {
          <p class="mt-4 text-sm text-muted">Nenhuma foto para mostrar aqui.</p>
        }
      </section>

      @if (store.batches().length) {
        <section class="rounded-card border border-line bg-panel p-5">
          <h2 class="font-semibold">Histórico</h2>
          <ul class="mt-3 divide-y divide-line">
            @for (b of store.batches(); track b.id) {
              <li class="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span class="min-w-0 flex-1">
                  {{ fmt(b.count) }} {{ b.count === 1 ? 'foto' : 'fotos' }} · Natural {{ percent(b) }}%
                  <span class="block text-xs text-muted">{{ when(b.createdAt) }}{{ b.status === 'undone' ? ' · desfeito' : '' }}</span>
                </span>
                @if (b.status === 'applied') {
                  <p-button label="Desfazer" icon="pi pi-undo" size="small" severity="secondary" [outlined]="true" (onClick)="store.undo(b, scope())" />
                }
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class EnhancePage {
  protected readonly store = inject(EnhanceStore);
  protected readonly albums = inject(AlbumStore);
  protected readonly selection = inject(SelectionStore);
  private readonly events = inject(EventStore);
  private readonly viewer = inject(ViewerContext);

  /** `?scope=selection` (from the selection bar). */
  readonly scopeParam = input<string | undefined>(undefined, { alias: 'scope' });

  protected readonly scopeKey = signal('all');
  protected readonly showBefore = signal(false);
  protected readonly pressed = signal<string | null>(null);
  /** Intensity used by the grid (follows the control after a short pause). */
  private readonly shownIntensity = signal(this.store.intensity());

  protected readonly s = this.store.summary;
  protected readonly intensityPercent = computed(() => Math.round(this.store.intensity() * 100));
  protected readonly acceptedEvents = computed(() => this.events.events().filter((e) => e.status !== 'suggested'));
  protected readonly scope = computed<ArrangeScope>(() => {
    const key = this.scopeKey();
    if (key === 'selection') return { filter: {}, mediaIds: [...this.selection.ids()] };
    if (key.startsWith('album:')) return { filter: { albumId: key.slice(6) } };
    if (key.startsWith('event:')) return { filter: { eventId: key.slice(6) } };
    return { filter: {} };
  });

  constructor() {
    effect(() => {
      if (this.scopeParam() === 'selection' && untracked(() => this.selection.count())) this.scopeKey.set('selection');
    });
    effect(() => {
      const scope = this.scope();
      untracked(() => void this.store.load(scope));
    });
    effect((onCleanup) => {
      const value = this.store.intensity();
      const timer = setTimeout(() => this.shownIntensity.set(value), INTENSITY_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected sampleUrl(id: string): string {
    const before = this.showBefore() || this.pressed() === id;
    return livePreviewUrl(id, { edge: SAMPLE_EDGE, before, style: this.store.style(), intensity: this.shownIntensity() });
  }

  protected setIntensity(event: Event) {
    this.store.intensity.set(Number((event.target as HTMLInputElement).value) / 100);
  }

  protected async apply() {
    await this.store.apply(this.scope());
  }

  protected open(id: string) {
    // ← → walk the scope (a selection has no filter: the whole library).
    this.viewer.open({ id } as MediaItem, { filter: this.scope().filter });
  }

  protected fmt(n: number) {
    return formatCount(n);
  }

  protected percent(b: EditBatch) {
    return Math.round((b.auto.intensity ?? 1) * 100);
  }

  protected when(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
