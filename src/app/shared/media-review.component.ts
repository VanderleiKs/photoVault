import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { REASON_LABEL, REVIEW_STATUS_LABEL } from '../core/analysis-labels';
import { formatDate } from '../core/format';
import { Backend } from '../core/ipc/backend';
import { unwrap, type MediaItem, type ReviewEntry, type TrashEntry } from '../core/ipc/ipc';
import { MediaActions } from '../core/stores/media-actions.service';
import { OrganizeStore } from '../core/stores/organize.store';

/**
 * Review suggestions of one photo and what was decided (PRD §15), or where it came from
 * when it is in the trash. Shared by the info panel and the viewer (`dark`).
 */
@Component({
  selector: 'app-media-review',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (item().inTrash) {
      <h4 class="mb-2 text-sm font-semibold" [class]="title()">Na lixeira</h4>
      @if (trash(); as t) {
        <p class="text-xs" [class]="muted()">Desde {{ date(t.deletedAt) }}</p>
        <p class="mt-1 break-all text-xs" [class]="muted()">Local original: {{ t.originalPath }}</p>
      }
      <div class="mt-3 flex gap-2">
        <p-button label="Restaurar" icon="pi pi-replay" size="small" [outlined]="true" (onClick)="actions.restore([item().id])" />
        <p-button label="Excluir" icon="pi pi-trash" size="small" severity="danger" [text]="true" (onClick)="actions.purge([item().id])" />
      </div>
    } @else if (pending().length || decided().length) {
      <h4 class="mb-2 text-sm font-semibold" [class]="title()">Revisão</h4>
      @if (pending().length) {
        <ul class="space-y-1.5">
          @for (e of pending(); track e.reason) {
            <li class="flex items-start gap-2 text-xs" [title]="reason(e).hint">
              <i [class]="reason(e).icon + ' mt-0.5 text-amber-600 dark:text-amber-400'"></i>
              <span class="flex-1" [class]="text()">
                {{ reason(e).label }}
                @if (e.exampleName) {
                  <span [class]="muted()">({{ e.exampleName }})</span>
                }
              </span>
              <span class="tabular-nums" [class]="muted()">{{ percent(e.score) }}</span>
            </li>
          }
        </ul>
        <div class="mt-3 flex flex-wrap gap-2">
          <p-button label="Manter" icon="pi pi-check" size="small" [outlined]="true" (onClick)="actions.decide([item().id], 'keep')" />
          <p-button label="Ignorar" icon="pi pi-eye-slash" size="small" severity="secondary" [text]="true" (onClick)="actions.decide([item().id], 'ignore')" />
          <p-button label="Lixeira" icon="pi pi-trash" size="small" severity="danger" [text]="true" (onClick)="actions.trash([item().id])" />
        </div>
      }
      @for (e of decided(); track e.reason) {
        <p class="mt-2 flex items-center gap-2 text-xs" [class]="muted()">
          <i class="pi pi-check-circle"></i>
          <span class="flex-1">{{ reason(e).label }}: {{ status(e) }}{{ e.decidedAt ? ' em ' + date(e.decidedAt) : '' }}</span>
          @if (e.status === 'kept' || e.status === 'ignored') {
            <button type="button" class="text-primary hover:underline" (click)="actions.decide([item().id], 'reopen', e.reason)">Desfazer</button>
          }
        </p>
      }
    }
  `,
})
export class MediaReviewComponent {
  readonly item = input.required<MediaItem>();
  readonly dark = input(false);

  protected readonly actions = inject(MediaActions);
  private readonly backend = inject(Backend);
  private readonly organize = inject(OrganizeStore);

  private readonly entries = signal<ReviewEntry[]>([]);
  protected readonly trash = signal<TrashEntry | null>(null);
  protected readonly pending = computed(() => this.entries().filter((e) => e.status === 'pending'));
  protected readonly decided = computed(() => this.entries().filter((e) => e.status !== 'pending'));
  protected readonly title = computed(() => (this.dark() ? 'text-white' : 'text-ink'));
  protected readonly text = computed(() => (this.dark() ? 'text-slate-200' : 'text-ink'));
  protected readonly muted = computed(() => (this.dark() ? 'text-slate-400' : 'text-muted'));

  constructor() {
    effect(() => {
      const item = this.item();
      this.organize.version();
      untracked(() => void this.load(item));
    });
  }

  private async load(item: MediaItem) {
    if (!isTauri()) return;
    if (item.inTrash) {
      const entry = await unwrap(this.backend.commands.getTrashEntry(item.id)).catch(() => null);
      if (item.id === this.item().id) this.trash.set(entry);
      return;
    }
    const entries = await unwrap(this.backend.commands.getMediaReview(item.id)).catch(() => []);
    if (item.id === this.item().id) this.entries.set(entries);
  }

  protected reason(e: ReviewEntry) {
    return REASON_LABEL[e.reason];
  }

  protected status(e: ReviewEntry) {
    return REVIEW_STATUS_LABEL[e.status].toLowerCase();
  }

  protected percent(score: number | null) {
    return `${Math.round((score ?? 0) * 100)}%`;
  }

  protected date(iso: string) {
    return formatDate(iso);
  }
}
