import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { FLAG_LABEL, GROUP_LABEL, QUALITY_LABEL, labelText } from '../core/analysis-labels';
import { Backend } from '../core/ipc/backend';
import { unwrap, type GroupRef, type MediaAnalysis, type MediaItem } from '../core/ipc/ipc';
import { NotifyService } from '../core/notify.service';
import { LibraryStore } from '../core/stores/library.store';
import { OrganizeStore } from '../core/stores/organize.store';
import { ViewerContext } from '../core/stores/viewer-context';

/**
 * Quality, automatic labels, groups and manual tags of one item (PRD §13, §23.1).
 * Shared by the info panel and the viewer (`dark`).
 */
@Component({
  selector: 'app-media-analysis',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (analysis(); as a) {
      <h4 class="mb-2 text-sm font-semibold" [class]="dark() ? 'text-white' : 'text-ink'">Classificação</h4>
      @if (!a.analyzed) {
        <p class="text-xs" [class]="muted()">{{ item().mediaType === 'image' ? 'Aguardando análise.' : 'Vídeos ainda não são analisados.' }}</p>
      } @else {
        <div class="flex flex-wrap gap-1.5">
          @if (a.quality; as q) {
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="qualityClass(q)" [title]="'Nitidez ' + (a.sharpness ?? 0).toFixed(0) + ' · brilho ' + (a.brightness ?? 0).toFixed(0)">
              Qualidade: {{ qualityLabel(q) }}
            </span>
          }
          @for (flag of a.flags; track flag) {
            <span class="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">{{ flagLabel(flag) }}</span>
          }
          @for (label of autoLabels(); track label.value) {
            <span class="rounded-full px-2.5 py-0.5 text-xs" [class]="chip()" [title]="label.score ? 'Confiança ' + (label.score * 100).toFixed(0) + '%' : ''">{{ text(label.dimension, label.value) }}</span>
          }
          @for (scene of a.scenes; track scene.value) {
            <span class="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary" title="Conteúdo reconhecido pela IA local">
              <i class="pi pi-sparkles text-[10px]"></i>{{ scene.label }} {{ ((scene.score ?? 0) * 100).toFixed(0) }} %
            </span>
          }
        </div>
      }

      @if (a.events.length) {
        <ul class="mt-3 space-y-1.5 text-xs">
          @for (ev of a.events; track ev.id) {
            <li class="flex items-center gap-2">
              <i [class]="(ev.kind === 'trip' ? 'pi pi-send ' : 'pi pi-calendar ') + muted()"></i>
              <a [routerLink]="['/trips', ev.id]" class="flex-1 truncate hover:underline" [class]="dark() ? 'text-slate-200' : 'text-ink'">
                {{ ev.title }}
                @if (ev.status === 'suggested') {
                  <span class="ml-1 rounded bg-amber-500/15 px-1.5 text-[11px] text-amber-700 dark:text-amber-400">sugestão</span>
                }
              </a>
            </li>
          }
        </ul>
      }

      @if (a.groups.length) {
        <ul class="mt-3 space-y-1.5 text-xs">
          @for (g of a.groups; track g.id) {
            <li class="flex items-center gap-2">
              <i [class]="groupIcon(g) + ' ' + muted()"></i>
              <span class="flex-1" [class]="dark() ? 'text-slate-200' : 'text-ink'">
                {{ groupText(g) }}
                @if (g.isBest) {
                  <span class="ml-1 rounded bg-emerald-600/15 px-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">melhor candidata</span>
                }
              </span>
              <button type="button" class="text-primary hover:underline" (click)="openGroup(g)">Ver grupo</button>
            </li>
          }
        </ul>
      }

      <h4 class="mb-2 mt-4 text-sm font-semibold" [class]="dark() ? 'text-white' : 'text-ink'">Tags</h4>
      <div class="flex flex-wrap items-center gap-1.5">
        @for (tag of tags(); track tag) {
          <span class="inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs" [class]="chip()">
            {{ tag }}
            <button type="button" class="flex size-4 items-center justify-center rounded-full hover:bg-black/10" [attr.aria-label]="'Remover tag ' + tag" (click)="remove(tag)">
              <i class="pi pi-times text-[9px]"></i>
            </button>
          </span>
        }
        <form class="min-w-24 flex-1" (ngSubmit)="add()">
          <input
            name="tag"
            [attr.list]="listId"
            class="w-full rounded-md border bg-transparent px-2 py-1 text-xs outline-none focus:border-primary"
            [class]="dark() ? 'border-white/15 text-slate-100 placeholder:text-slate-500' : 'border-line placeholder:text-muted'"
            placeholder="+ tag"
            aria-label="Adicionar tag"
            maxlength="40"
            [(ngModel)]="draft"
            [ngModelOptions]="{ standalone: true }"
          />
          <datalist [id]="listId">
            @for (t of suggestions(); track t) {
              <option [value]="t"></option>
            }
          </datalist>
        </form>
      </div>
    }
  `,
})
export class MediaAnalysisComponent {
  readonly item = input.required<MediaItem>();
  readonly dark = input(false);

  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly organize = inject(OrganizeStore);
  private readonly libraries = inject(LibraryStore);
  private readonly viewer = inject(ViewerContext);

  protected readonly analysis = signal<MediaAnalysis | null>(null);
  protected readonly draft = signal('');
  private readonly libraryTags = signal<string[]>([]);
  protected readonly listId = `tags-${Math.random().toString(36).slice(2)}`;

  protected readonly tags = computed(() => this.analysis()?.labels.filter((l) => l.dimension === 'tag').map((l) => l.value) ?? []);
  protected readonly autoLabels = computed(() => this.analysis()?.labels.filter((l) => l.dimension !== 'tag') ?? []);
  protected readonly suggestions = computed(() => this.libraryTags().filter((t) => !this.tags().includes(t)));
  protected readonly muted = computed(() => (this.dark() ? 'text-slate-400' : 'text-muted'));
  protected readonly chip = computed(() => (this.dark() ? 'bg-white/10 text-slate-200' : 'bg-panel-2 text-ink'));

  constructor() {
    effect(() => {
      const id = this.item().id;
      this.organize.version();
      untracked(() => void this.load(id));
    });
    effect(() => {
      const library = this.libraries.activeId();
      untracked(() => void this.loadTags(library));
    });
  }

  private async load(id: string) {
    if (!isTauri()) return;
    const analysis = await unwrap(this.backend.commands.getMediaAnalysis(id)).catch(() => null);
    if (id === this.item().id) this.analysis.set(analysis);
  }

  private async loadTags(libraryId: string | null) {
    if (!libraryId || !isTauri()) return;
    const tags = await unwrap(this.backend.commands.listTags(libraryId)).catch(() => []);
    this.libraryTags.set(tags.map((t) => t.tag));
  }

  protected async add() {
    const tag = this.draft().trim();
    if (!tag) return;
    try {
      await unwrap(this.backend.commands.addTag([this.item().id], tag));
      this.draft.set('');
      await Promise.all([this.load(this.item().id), this.loadTags(this.libraries.activeId())]);
    } catch (e) {
      this.notify.error('Não foi possível adicionar a tag', e);
    }
  }

  protected async remove(tag: string) {
    try {
      await unwrap(this.backend.commands.removeTag([this.item().id], tag));
      await this.load(this.item().id);
    } catch (e) {
      this.notify.error('Não foi possível remover a tag', e);
    }
  }

  protected openGroup(g: GroupRef) {
    const filter = g.kind === 'sequence' ? { sequenceId: g.id } : { groupId: g.id };
    this.viewer.open(this.item(), { filter, sort: 'newest' });
  }

  protected qualityLabel(q: keyof typeof QUALITY_LABEL) {
    return QUALITY_LABEL[q];
  }

  protected qualityClass(q: keyof typeof QUALITY_LABEL) {
    switch (q) {
      case 'high':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
      case 'medium':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-400';
      default:
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400';
    }
  }

  protected flagLabel(flag: keyof typeof FLAG_LABEL) {
    return FLAG_LABEL[flag];
  }

  protected text(dimension: string, value: string) {
    return labelText(dimension, value);
  }

  protected groupIcon(g: GroupRef) {
    return GROUP_LABEL[g.kind].icon;
  }

  protected groupText(g: GroupRef) {
    return g.kind === 'sequence' ? `Sequência de ${g.size} fotos` : `${GROUP_LABEL[g.kind].one} (${g.size})`;
  }
}
