import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { REASON_LABEL, REVIEW_STATUS_LABEL } from '../../core/analysis-labels';
import { formatBytes, formatCount, formatDate } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { thumbnailUrl, unwrap, type HistoryEntry, type MediaItem, type ReviewReason, type ReviewSummary } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaActions } from '../../core/stores/media-actions.service';
import { OrganizeStore } from '../../core/stores/organize.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { JobStatusComponent } from '../../shared/job-status.component';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

const HISTORY_PAGE = 60;

/** "Revisão" (PRD §15, §23.5): every suggestion, highest priority first. */
@Component({
  selector: 'app-review-page',
  imports: [FormsModule, RouterLink, ButtonModule, SelectButtonModule, EmptyStateComponent, JobStatusComponent, MediaGridComponent, SelectionBarComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-check-square text-muted"></i>Revisão</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        <p-selectbutton [options]="tabs" optionLabel="label" optionValue="value" [ngModel]="tab()" (ngModelChange)="tab.set($event)" [allowEmpty]="false" ariaLabel="Seção" />
      </div>
      @if (tab() === 'pending') {
        @if (reasonOptions().length > 1) {
          <p-selectbutton class="mt-3 block" [options]="reasonOptions()" optionLabel="label" optionValue="value" [ngModel]="reason()" (ngModelChange)="reason.set($event)" [allowEmpty]="false" size="small" ariaLabel="Motivo" />
        }
        <p class="mt-2 max-w-3xl text-xs text-muted">
          Sugestões de fotos que talvez você não precise guardar, das mais prováveis para as menos. Nada é apagado sem sua confirmação, e favoritas nunca aparecem aqui.
          Para ensinar o que você costuma apagar, use <i class="pi pi-sparkles text-[11px]"></i> <strong>Usar como exemplo</strong> numa foto ou veja
          <a routerLink="/settings" fragment="exemplos" class="text-primary hover:underline">Configurações → Exemplos</a>.
        </p>
      } @else {
        <p class="mt-2 max-w-3xl text-xs text-muted">Suas decisões, das mais recentes. "Desfazer" devolve a sugestão para a revisão, se ela ainda se aplicar.</p>
      }
    </header>

    @if (tab() === 'pending') {
      <section class="p-6">
        @if (gallery.loaded() && !gallery.items().length) {
          <app-empty-state icon="pi pi-check-circle" title="Nada para revisar" [text]="emptyText()" />
        }
        <app-media-grid
          label="Fotos para revisar"
          [items]="gallery.items()"
          [loading]="gallery.loading()"
          [hasMore]="gallery.hasMore()"
          [badges]="badges()"
          (loadMore)="gallery.loadMore()"
          (open)="open($event)"
        />
      </section>
      <app-selection-bar mode="review" [reason]="reason()" [items]="gallery.items()" />
    } @else {
      <section class="p-6">
        @if (historyLoaded() && !history().length) {
          <app-empty-state icon="pi pi-history" title="Nenhuma decisão ainda" text="Quando você mantiver, ignorar ou enviar fotos para a lixeira pela revisão, elas aparecem aqui." />
        }
        <ul class="divide-y divide-line rounded-card border border-line bg-panel" [class.hidden]="!history().length">
          @for (h of history(); track h.item.id + h.reason) {
            <li class="flex items-center gap-3 px-4 py-2.5">
              <button type="button" class="size-12 shrink-0 overflow-hidden rounded-md bg-panel-2" [attr.aria-label]="'Abrir ' + h.item.filename" (click)="openHistory(h.item)">
                <img [src]="thumb(h.item)" alt="" class="size-full object-cover" loading="lazy" />
              </button>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm">{{ h.item.filename }}</p>
                <p class="text-xs text-muted">{{ reasonLabel(h.reason) }} · {{ statusLabel(h) }} · {{ date(h.decidedAt) }}</p>
              </div>
              @if (h.status === 'kept' || h.status === 'ignored') {
                <p-button label="Desfazer" icon="pi pi-undo" size="small" [text]="true" (onClick)="undo(h)" />
              } @else if (h.item.inTrash) {
                <p-button label="Restaurar" icon="pi pi-replay" size="small" [text]="true" (onClick)="restore(h)" />
              }
            </li>
          }
        </ul>
        @if (historyCursor()) {
          <div class="mt-4 flex justify-center">
            <p-button label="Carregar mais" icon="pi pi-angle-down" [outlined]="true" [loading]="historyLoading()" (onClick)="loadHistory(false)" />
          </div>
        }
      </section>
    }
  `,
})
export class ReviewPage {
  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);
  private readonly viewer = inject(ViewerContext);
  private readonly actions = inject(MediaActions);

  protected readonly tabs = [
    { label: 'Sugestões', value: 'pending' },
    { label: 'Histórico', value: 'history' },
  ];
  protected readonly tab = signal<'pending' | 'history'>('pending');
  protected readonly reason = signal<ReviewReason | null>(null);
  protected readonly summary = signal<ReviewSummary | null>(null);
  /** Main reason (+ how many more) per photo on screen. */
  private readonly reasons = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly badges = computed(() => this.reasons());

  protected readonly history = signal<HistoryEntry[]>([]);
  protected readonly historyCursor = signal<string | null>(null);
  protected readonly historyLoading = signal(false);
  protected readonly historyLoaded = signal(false);

  protected readonly reasonOptions = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: `Todas (${formatCount(s.pending)})`, value: null },
      ...s.byReason.map((r) => ({ label: `${REASON_LABEL[r.reason].label} (${formatCount(r.count)})`, value: r.reason })),
    ];
  });
  protected readonly subtitle = computed(() => {
    const s = this.summary();
    if (!s) return '';
    if (!s.pending) return 'Nenhuma sugestão pendente';
    return `${formatCount(s.pending)} ${s.pending === 1 ? 'foto' : 'fotos'} para revisar · ${formatBytes(s.pendingBytes)}`;
  });
  protected readonly emptyText = computed(() => {
    const pending = this.organize.counts()?.pending;
    if (pending) return `A análise ainda está em andamento (${formatCount(pending)} itens na fila). As sugestões aparecem aqui quando ela terminar.`;
    return this.reason() ? 'Nenhuma foto pendente por este motivo.' : 'Tudo revisado por enquanto.';
  });

  constructor() {
    effect(() => {
      const reason = this.reason();
      this.gallery.fixed.set(reason ? { reviewReason: reason } : { review: true });
    });
    this.gallery.userQuery.set({ sort: 'priority' });
    effect(() => {
      const library = this.libraries.activeId();
      this.organize.version();
      untracked(() => {
        void this.loadSummary(library);
        void this.gallery.refresh();
        if (this.tab() === 'history') void this.loadHistory(true);
      });
    });
    // A reason with nothing left falls back to "Todas".
    effect(() => {
      const s = this.summary();
      const reason = untracked(this.reason);
      if (s && reason && !s.byReason.some((r) => r.reason === reason)) this.reason.set(null);
    });
    effect(() => {
      if (this.tab() === 'history') untracked(() => void this.loadHistory(true));
    });
    // Reasons of the photos on screen (fetched once per photo, again after changes).
    effect(() => {
      const items = this.gallery.items();
      this.organize.version();
      untracked(() => void this.loadReasons(items));
    });
  }

  private async loadSummary(libraryId: string | null) {
    if (!libraryId || !isTauri()) return this.summary.set(null);
    this.summary.set(await unwrap(this.backend.commands.getReviewSummary(libraryId)).catch(() => null));
  }

  private async loadReasons(items: readonly MediaItem[]) {
    if (!items.length || !isTauri()) return this.reasons.set(new Map());
    const rows = await unwrap(this.backend.commands.getPendingReasons(items.map((m) => m.id))).catch(() => []);
    this.reasons.set(
      new Map(
        rows
          .filter((r) => r.reasons.length)
          .map((r) => [r.mediaId, REASON_LABEL[r.reasons[0].reason].label + (r.reasons.length > 1 ? ` +${r.reasons.length - 1}` : '')]),
      ),
    );
  }

  protected async loadHistory(reset: boolean) {
    const libraryId = this.libraries.activeId();
    if (!libraryId || !isTauri() || (this.historyLoading() && !reset)) return;
    this.historyLoading.set(true);
    try {
      const page = await unwrap(
        this.backend.commands.listReviewHistory(libraryId, reset ? null : this.historyCursor(), HISTORY_PAGE),
      );
      this.history.update((h) => (reset ? page.entries : [...h, ...page.entries]));
      this.historyCursor.set(page.nextCursor);
      this.historyLoaded.set(true);
    } catch (e) {
      this.notify.error('Não foi possível carregar o histórico', e);
    } finally {
      this.historyLoading.set(false);
    }
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, this.gallery.query());
  }

  protected openHistory(item: MediaItem) {
    this.viewer.open(item, { filter: item.inTrash ? { trashed: true } : {}, sort: 'newest' });
  }

  protected async undo(h: HistoryEntry) {
    if (await this.actions.decide([h.item.id], 'reopen', h.reason)) void this.loadHistory(true);
  }

  protected async restore(h: HistoryEntry) {
    if (await this.actions.restore([h.item.id])) void this.loadHistory(true);
  }

  protected thumb(item: MediaItem) {
    return thumbnailUrl(item.id, item.thumbVersion);
  }

  protected reasonLabel(reason: ReviewReason) {
    return REASON_LABEL[reason].label;
  }

  protected statusLabel(h: HistoryEntry) {
    if (h.status === 'kept' || h.status === 'ignored') return REVIEW_STATUS_LABEL[h.status];
    return h.item.inTrash ? 'Na lixeira' : 'Enviada para a lixeira e restaurada';
  }

  protected date(iso: string) {
    return formatDate(iso, true);
  }
}
