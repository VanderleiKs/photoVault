import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { formatCount } from '../../core/format';
import type { ArrangeBatch, ArrangeItem, ArrangeRule, ArrangeScope } from '../../core/ipc/ipc';
import { AlbumStore } from '../../core/stores/album.store';
import { ArrangeStore } from '../../core/stores/arrange.store';
import { EventStore } from '../../core/stores/event.store';
import { SelectionStore } from '../../core/stores/selection.store';

type Preset = 'month' | 'event' | 'place' | 'custom';
type Naming = 'keep' | 'datetime' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, string> = {
  month: '{ano}/{mes} - {mes_nome}',
  event: '{ano}/{evento|mes}',
  place: '{ano}/{local|mes}',
};
const DATETIME = '{data}_{hora}';
const TOKENS = ['ano', 'mes', 'mes_nome', 'dia', 'data', 'hora', 'evento', 'local', 'camera', 'nome', 'tipo'];
const PREVIEW_DELAY_MS = 350;

/** "Organizar pastas" (PRD §24): rule → preview before/after → confirm → progress → undo. */
@Component({
  selector: 'app-arrange-page',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, ProgressBarModule, SelectButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-folder-open text-muted"></i>Organizar pastas</h1>
      <p class="max-w-3xl text-sm text-muted">
        Move e renomeia as fotos dentro da pasta da biblioteca, por uma regra (por exemplo, ano e mês). Você vê antes para onde vai cada arquivo;
        nada é apagado nem sobrescrito, e tudo pode ser desfeito.
      </p>
    </header>

    <div class="space-y-6 p-6">
      @if (store.current(); as b) {
        <section class="rounded-card border border-primary/40 bg-primary/5 p-5" aria-live="polite">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="flex flex-1 items-center gap-2 font-semibold">
              @if (store.busy()) {
                <i class="pi pi-spin pi-spinner text-primary"></i>
              } @else {
                <i class="pi pi-pause text-amber-600"></i>
              }
              {{ statusText(b) }}
            </h2>
            @if (store.busy()) {
              <p-button label="Pausar" icon="pi pi-pause" size="small" severity="secondary" [outlined]="true" (onClick)="store.pause(b)" />
            } @else {
              <p-button [label]="b.status === 'undo_paused' ? 'Continuar a desfazer' : 'Retomar'" icon="pi pi-play" size="small" (onClick)="store.resume(b)" />
              @if (b.status === 'paused' && b.done > 0) {
                <p-button label="Desfazer o que foi feito" icon="pi pi-undo" size="small" severity="secondary" [text]="true" (onClick)="store.undo(b)" />
              }
            }
          </div>
          <p-progressbar class="mt-3 block" [value]="percent(b)" [showValue]="false" styleClass="!h-2" />
          <p class="mt-2 text-sm text-muted">{{ progressText(b) }}</p>
          @if (b.message) {
            <p class="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">{{ b.message }}</p>
          }
          @if (b.failed || b.status === 'undo_paused') {
            <p-button class="mt-2 inline-block" label="Ver detalhes" icon="pi pi-list" size="small" [text]="true" (onClick)="showProblems(b)" />
          }
        </section>
      }

      <section class="rounded-card border border-line bg-panel p-5" [class.opacity-60]="!!store.current()">
        <h2 class="font-semibold">Regra</h2>
        <div class="mt-3 grid gap-5 lg:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium">Pastas</p>
            <p-selectbutton [options]="presets" optionLabel="label" optionValue="value" [ngModel]="preset()" (ngModelChange)="choosePreset($event)" [allowEmpty]="false" ariaLabel="Pastas" />
            <input
              pInputText
              class="w-full font-mono !text-sm"
              aria-label="Modelo das pastas"
              [ngModel]="folders()"
              (ngModelChange)="folders.set($event); preset.set('custom')"
              placeholder="{ano}/{mes} - {mes_nome}"
            />
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" [ngModel]="keepFolders()" (ngModelChange)="keepFolders.set($event)" />
              Manter as pastas atuais (só renomear)
            </label>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium">Nome dos arquivos</p>
            <p-selectbutton [options]="namings" optionLabel="label" optionValue="value" [ngModel]="naming()" (ngModelChange)="chooseNaming($event)" [allowEmpty]="false" ariaLabel="Nome dos arquivos" />
            @if (naming() !== 'keep') {
              <input
                pInputText
                class="w-full font-mono !text-sm"
                aria-label="Modelo do nome"
                [ngModel]="name()"
                (ngModelChange)="name.set($event); naming.set('custom')"
                placeholder="{data}_{hora}"
              />
              <p class="text-xs text-muted">A extensão (.jpg, .mp4…) é mantida. Sem data, o arquivo fica com o nome original.</p>
            }
          </div>
        </div>
        <p class="mt-4 text-xs text-muted">
          Use: @for (t of tokens; track t) {<code class="mx-0.5 rounded bg-panel-2 px-1">{{ '{' + t + '}' }}</code>}.
          <code class="rounded bg-panel-2 px-1">{{ '{evento|mes}' }}</code> = o evento, ou o mês se a foto não estiver numa viagem ou evento aceito.
          Uma pasta sem valor para a foto é pulada; fotos sem data (ou com a data da cópia) vão para "Sem data".
        </p>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm">
            Quais fotos
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
          </label>
        </div>
      </section>

      <section class="rounded-card border border-line bg-panel p-5">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="flex flex-1 items-center gap-2 font-semibold">
            Prévia
            @if (store.previewing()) {
              <i class="pi pi-spin pi-spinner text-sm text-muted"></i>
            }
          </h2>
          <p-button
            [label]="p && p.moving ? 'Organizar ' + fmt(p.moving) + (p.moving === 1 ? ' arquivo…' : ' arquivos…') : 'Organizar…'"
            icon="pi pi-folder-open"
            [disabled]="!p || !p.moving || !!store.current() || !!store.previewError()"
            (onClick)="organize()"
          />
        </div>
        @if (store.previewError(); as err) {
          <p class="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300" role="alert">{{ err }}</p>
        } @else if (p) {
          <p class="mt-2 text-sm">
            <strong>{{ fmt(p.moving) }}</strong> {{ p.moving === 1 ? 'arquivo muda' : 'arquivos mudam' }} de lugar ou de nome · {{ fmt(p.unchanged) }} já {{ p.unchanged === 1 ? 'está' : 'estão' }} certos
            @if (p.renamed) {
              · {{ fmt(p.renamed) }} com "(2)" no nome, porque o nome já existia
            }
            @if (p.undated) {
              · {{ fmt(p.undated) }} sem data
            }
            @if (p.sidecars) {
              · {{ fmt(p.sidecars) }} arquivos auxiliares vão junto
            }
          </p>
          @if (p.folders.length) {
            <div class="mt-4">
              <p class="text-xs font-medium uppercase tracking-wide text-muted">Pastas de destino</p>
              <ul class="mt-2 flex flex-wrap gap-2">
                @for (f of p.folders; track f.path) {
                  <li class="rounded-full bg-panel-2 px-3 py-1 text-xs"><i class="pi pi-folder mr-1 text-muted"></i>{{ f.path || '(raiz)' }} · {{ fmt(f.count) }}</li>
                }
              </ul>
            </div>
          }
          @if (p.items.length) {
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="text-muted">
                  <tr><th class="py-1 pr-4 font-medium">Antes</th><th class="py-1 font-medium">Depois</th></tr>
                </thead>
                <tbody>
                  @for (m of p.items; track m.mediaId) {
                    <tr class="border-t border-line align-top">
                      <td class="break-all py-1.5 pr-4 font-mono text-muted">{{ m.from }}</td>
                      <td class="break-all py-1.5 font-mono">
                        {{ m.to }}
                        @if (m.renamed) {
                          <span class="ml-1 rounded bg-amber-500/15 px-1.5 font-sans text-[11px] text-amber-700 dark:text-amber-400">nome já existia</span>
                        }
                        @for (s of m.sidecars; track s[0]) {
                          <span class="block text-muted">+ {{ s[1] }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (p.moving > p.items.length) {
                <p class="mt-2 text-xs text-muted">Mostrando os primeiros {{ fmt(p.items.length) }} de {{ fmt(p.moving) }}.</p>
              }
            </div>
          }
        }
      </section>

      @if (done().length) {
        <section class="rounded-card border border-line bg-panel p-5">
          <h2 class="font-semibold">Histórico</h2>
          <ul class="mt-3 divide-y divide-line">
            @for (b of done(); track b.id) {
              <li class="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span class="min-w-0 flex-1">
                  <span class="font-mono text-xs">{{ ruleText(b.rule) }}</span>
                  <span class="block text-xs text-muted">{{ when(b.finishedAt ?? b.createdAt) }} · {{ statusText(b) }} · {{ fmt(b.done + b.undone) }} arquivos</span>
                </span>
                @if (b.failed) {
                  <p-button [label]="fmt(b.failed) + ' com problema'" size="small" [text]="true" severity="warn" (onClick)="showProblems(b)" />
                }
                @if (b.status === 'done' && !store.current()) {
                  <p-button label="Desfazer" icon="pi pi-undo" size="small" severity="secondary" [outlined]="true" (onClick)="store.undo(b)" />
                }
              </li>
            }
          </ul>
        </section>
      }
    </div>

    <p-dialog header="Detalhes" [visible]="problemsOpen()" (visibleChange)="problemsOpen.set($event)" [modal]="true" [draggable]="false" styleClass="w-[48rem] max-w-[95vw]">
      <ul class="max-h-[60vh] space-y-2 overflow-y-auto text-xs">
        @for (i of problems(); track i.seq) {
          <li class="rounded-lg bg-panel-2 px-3 py-2">
            <span class="block break-all font-mono">{{ i.from }} → {{ i.to }}</span>
            <span class="text-rose-600 dark:text-rose-400">{{ i.error ?? 'não foi possível mover' }}</span>
          </li>
        } @empty {
          <li class="text-muted">Nenhum problema registrado.</li>
        }
      </ul>
    </p-dialog>
  `,
})
export class ArrangePage {
  protected readonly store = inject(ArrangeStore);
  protected readonly albums = inject(AlbumStore);
  protected readonly selection = inject(SelectionStore);
  private readonly events = inject(EventStore);

  protected readonly presets = [
    { label: 'Ano / Mês', value: 'month' },
    { label: 'Ano / Evento', value: 'event' },
    { label: 'Ano / Local', value: 'place' },
    { label: 'Personalizado', value: 'custom' },
  ];
  protected readonly namings = [
    { label: 'Manter', value: 'keep' },
    { label: 'Data e hora', value: 'datetime' },
    { label: 'Personalizado', value: 'custom' },
  ];
  protected readonly tokens = TOKENS;

  protected readonly preset = signal<Preset>('month');
  protected readonly folders = signal(PRESETS.month);
  protected readonly keepFolders = signal(false);
  protected readonly naming = signal<Naming>('keep');
  protected readonly name = signal(DATETIME);
  protected readonly scopeKey = signal('all');
  protected readonly problemsOpen = signal(false);
  protected readonly problems = signal<ArrangeItem[]>([]);

  protected readonly acceptedEvents = computed(() => this.events.events().filter((e) => e.status !== 'suggested'));
  protected readonly done = computed(() => this.store.history().filter((b) => b.id !== this.store.current()?.id));

  protected readonly rule = computed<ArrangeRule>(() => ({
    folders: this.keepFolders() ? undefined : this.folders().trim() || undefined,
    name: this.naming() === 'keep' ? undefined : this.name().trim() || undefined,
  }));
  protected readonly scope = computed<ArrangeScope>(() => {
    const key = this.scopeKey();
    if (key === 'selection') return { filter: {}, mediaIds: [...this.selection.ids()] };
    if (key.startsWith('album:')) return { filter: { albumId: key.slice(6) } };
    if (key.startsWith('event:')) return { filter: { eventId: key.slice(6) } };
    return { filter: {} };
  });

  protected get p() {
    return this.store.preview();
  }

  constructor() {
    void this.store.refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect((onCleanup) => {
      const rule = this.rule();
      const scope = this.scope();
      this.store.current();
      timer = setTimeout(() => untracked(() => void this.store.loadPreview(rule, scope)), PREVIEW_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected choosePreset(p: Preset) {
    this.preset.set(p);
    if (p !== 'custom') this.folders.set(PRESETS[p]);
    this.keepFolders.set(false);
  }

  protected chooseNaming(n: Naming) {
    this.naming.set(n);
    if (n === 'datetime') this.name.set(DATETIME);
  }

  protected organize() {
    void this.store.organize(this.rule(), this.scope());
  }

  protected async showProblems(b: ArrangeBatch) {
    this.problems.set(await this.store.failures(b));
    this.problemsOpen.set(true);
  }

  protected fmt(n: number) {
    return formatCount(n);
  }

  protected percent(b: ArrangeBatch) {
    const total = b.total || 1;
    const handled = b.status === 'undoing' || b.status === 'undo_paused' ? b.undone : b.done + b.failed + b.skipped;
    return Math.round((handled / total) * 100);
  }

  protected progressText(b: ArrangeBatch) {
    if (b.status === 'undoing' || b.status === 'undo_paused') {
      return `${this.fmt(b.undone)} de ${this.fmt(b.undone + b.done)} arquivos de volta ao lugar`;
    }
    const extra = [b.failed ? `${this.fmt(b.failed)} com problema` : '', b.skipped ? `${this.fmt(b.skipped)} pulados (mudaram desde o plano)` : '']
      .filter(Boolean)
      .join(' · ');
    return `${this.fmt(b.done)} de ${this.fmt(b.total)} arquivos movidos${extra ? ' · ' + extra : ''}`;
  }

  protected statusText(b: ArrangeBatch) {
    switch (b.status) {
      case 'running':
        return 'Organizando os arquivos…';
      case 'paused':
        return 'Organização pausada';
      case 'undoing':
        return 'Desfazendo…';
      case 'undo_paused':
        return 'Desfazer pausado';
      case 'done':
        return 'Feita';
      case 'undone':
        return 'Desfeita';
      default:
        return 'Planejada';
    }
  }

  protected ruleText(r: ArrangeRule) {
    return [r.folders ?? '(mesmas pastas)', r.name ? `nome ${r.name}` : 'mesmo nome'].join(' · ');
  }

  protected when(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
