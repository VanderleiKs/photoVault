import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { FormsModule } from '@angular/forms';
import { GROUP_LABEL, QUALITY_LABEL } from '../../core/analysis-labels';
import { formatBytes, formatCount, formatDate, formatDimensions } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type GroupKind, type MediaGroup, type MediaItem } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { LibraryStore } from '../../core/stores/library.store';
import { MediaActions } from '../../core/stores/media-actions.service';
import { MediaBus } from '../../core/stores/media-bus';
import { OrganizeStore } from '../../core/stores/organize.store';
import { SelectionStore } from '../../core/stores/selection.store';
import { UiStore } from '../../core/stores/ui.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { JobStatusComponent } from '../../shared/job-status.component';
import { MediaTileComponent } from '../../shared/media-tile.component';
import { SelectionBarComponent } from '../../shared/selection-bar.component';

const PAGE = 20;

interface Mode {
  title: string;
  intro: string;
  tabs: { label: string; kind: GroupKind }[];
}

const MODES: Record<'duplicates' | 'similar', Mode> = {
  duplicates: {
    title: 'Possíveis duplicatas',
    intro: 'Cópias exatas (mesmos bytes) e visuais (a mesma foto redimensionada, recomprimida ou levemente editada). A melhor candidata aparece primeiro. Nada é apagado automaticamente.',
    tabs: [
      { label: 'Exatas', kind: 'exact_duplicate' },
      { label: 'Visuais', kind: 'visual_duplicate' },
    ],
  },
  similar: {
    title: 'Fotos semelhantes',
    intro: 'Fotos diferentes da mesma cena, tiradas perto no tempo, e sequências em rajada. Servem para escolher a melhor; todas continuam na biblioteca.',
    tabs: [
      { label: 'Semelhantes', kind: 'similar' },
      { label: 'Sequências', kind: 'sequence' },
    ],
  },
};

/** Duplicate / similar groups as cards (PRD §23.5). Route data: `{ mode }`. */
@Component({
  selector: 'app-groups-page',
  imports: [FormsModule, ButtonModule, SelectButtonModule, SkeletonModule, EmptyStateComponent, JobStatusComponent, MediaTileComponent, SelectionBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-semibold">{{ config().title }}</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        <p-selectbutton [options]="tabs()" optionLabel="label" optionValue="kind" [ngModel]="kind()" (ngModelChange)="kind.set($event)" [allowEmpty]="false" ariaLabel="Tipo de grupo" />
      </div>
      <p class="mt-2 max-w-3xl text-xs text-muted">{{ config().intro }}</p>
    </header>

    <section class="space-y-5 p-6">
      @if (loading() && !groups().length) {
        @for (i of [1, 2, 3]; track i) {
          <p-skeleton height="12rem" styleClass="!rounded-card" />
        }
      } @else if (!groups().length) {
        <app-empty-state [icon]="emptyIcon()" [title]="emptyTitle()" [text]="emptyText()" />
      }

      @for (group of groups(); track group.id) {
        <article class="rounded-card border border-line bg-panel p-4" [attr.aria-label]="groupTitle(group)">
          <header class="mb-3 flex flex-wrap items-center gap-2">
            <i [class]="label(group.kind).icon" class="text-muted"></i>
            <h2 class="text-sm font-semibold">{{ groupTitle(group) }}</h2>
            <span class="text-xs text-muted">{{ groupDetail(group) }}</span>
            <span class="flex-1"></span>
            <p-button label="Selecionar as outras" icon="pi pi-check-square" size="small" [text]="true" (onClick)="selectOthers(group)" />
            @if (isDuplicate(group)) {
              <p-button label="Enviar as outras para a lixeira" icon="pi pi-trash" size="small" severity="danger" [text]="true" (onClick)="trashOthers(group)" />
            }
            <p-button label="Ver" icon="pi pi-external-link" size="small" [text]="true" (onClick)="open(group, group.members[0].item)" />
          </header>
          <div class="grid gap-3" [style.grid-template-columns]="'repeat(auto-fill, minmax(' + tile() + 'px, 1fr))'">
            @for (member of group.members; track member.item.id; let best = $first) {
              <figure class="min-w-0">
                <div class="relative">
                  <app-media-tile
                    [item]="member.item"
                    [focused]="member.item.id === selection.focusedId()"
                    [checked]="selection.ids().has(member.item.id)"
                    [selecting]="selection.active()"
                    (select)="onSelect(member.item, $event)"
                    (open)="open(group, member.item)"
                    (check)="selection.toggle(member.item.id)"
                    (favorite)="actions.setFavorite([member.item.id], !member.item.isFavorite)"
                  />
                  @if (best) {
                    <span class="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      <i class="pi pi-star-fill text-[9px]"></i>Melhor candidata
                    </span>
                  }
                </div>
                <figcaption class="mt-1.5 space-y-0.5 text-[11px] leading-tight text-muted">
                  <p class="truncate text-xs text-ink" [title]="member.item.relativePath">{{ member.item.relativePath }}</p>
                  <p>{{ dims(member.item) }} · {{ bytes(member.item.fileSize) }}</p>
                  <p>
                    {{ date(member.item) }}
                    @if (member.quality) {
                      · Qualidade {{ quality(member.quality) }}
                    }
                    @if (!best && member.distance) {
                      · diferença {{ member.distance }}
                    }
                  </p>
                </figcaption>
              </figure>
            }
          </div>
        </article>
      }

      @if (hasMore()) {
        <div class="flex justify-center">
          <p-button label="Carregar mais grupos" icon="pi pi-angle-down" [outlined]="true" [loading]="loading()" (onClick)="loadMore()" />
        </div>
      }
    </section>
    <app-selection-bar [items]="allItems()" />
  `,
})
export class GroupsPage {
  /** From the route data. */
  readonly mode = input.required<'duplicates' | 'similar'>();

  protected readonly selection = inject(SelectionStore);
  protected readonly actions = inject(MediaActions);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);
  private readonly viewer = inject(ViewerContext);
  private readonly ui = inject(UiStore);

  protected readonly config = computed(() => MODES[this.mode()]);
  protected readonly tabs = computed(() => this.config().tabs);
  protected readonly kind = signal<GroupKind>('exact_duplicate');
  protected readonly groups = signal<MediaGroup[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly hasMore = computed(() => this.groups().length < this.total());
  protected readonly allItems = computed(() => this.groups().flatMap((g) => g.members.map((m) => m.item)));
  protected readonly tile = computed(() => Math.max(120, Math.min(this.ui.tileSize(), 220)));
  private generation = 0;

  protected readonly subtitle = computed(() => {
    const c = this.organize.counts();
    if (!c) return '';
    const pending = c.pending ? ` · analisando ${formatCount(c.pending)} itens, a lista ainda pode crescer` : '';
    if (this.mode() === 'duplicates') {
      return `${formatCount(c.exactGroups)} grupos exatos (${formatCount(c.exactExtra)} cópias) · ${formatCount(c.visualGroups)} visuais${pending}`;
    }
    return `${formatCount(c.similarGroups)} grupos semelhantes · ${formatCount(c.sequences)} sequências${pending}`;
  });

  constructor() {
    inject(MediaBus).subscribe((update) => {
      const byId = new Map(update.items.map((m) => [m.id, m]));
      const removed = new Set(update.removedIds);
      // Trashed or deleted members leave the card; a card with one photo left goes.
      this.groups.update((groups) =>
        groups
          .map((g) => ({
            ...g,
            members: g.members
              .map((m) => ({ ...m, item: byId.get(m.item.id) ?? m.item }))
              .filter((m) => !removed.has(m.item.id) && !m.item.inTrash),
          }))
          .filter((g) => g.members.length > 1),
      );
    });
    effect(() => {
      // Default tab of the mode.
      const tabs = this.tabs();
      untracked(() => {
        if (!tabs.some((t) => t.kind === this.kind())) this.kind.set(tabs[0].kind);
      });
    });
    effect(() => {
      const kind = this.kind();
      const library = this.libraries.activeId();
      this.organize.version();
      untracked(() => void this.reload(library, kind));
    });
  }

  private async reload(libraryId: string | null, kind: GroupKind) {
    const generation = ++this.generation;
    this.groups.set([]);
    this.total.set(0);
    if (!libraryId || !isTauri()) return;
    await this.fetch(libraryId, kind, 0, generation);
  }

  protected async loadMore() {
    const libraryId = this.libraries.activeId();
    if (!libraryId || this.loading()) return;
    await this.fetch(libraryId, this.kind(), this.groups().length, this.generation);
  }

  private async fetch(libraryId: string, kind: GroupKind, offset: number, generation: number) {
    this.loading.set(true);
    try {
      const page = await unwrap(this.backend.commands.listGroups(libraryId, kind, offset, PAGE));
      if (generation !== this.generation) return;
      this.groups.update((g) => [...g, ...page.groups]);
      this.total.set(page.total);
    } catch (e) {
      this.notify.error('Não foi possível carregar os grupos', e);
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  protected label(kind: GroupKind) {
    return GROUP_LABEL[kind];
  }

  protected groupTitle(group: MediaGroup) {
    return `${GROUP_LABEL[group.kind].one} · ${group.members.length} fotos`;
  }

  protected groupDetail(group: MediaGroup) {
    if (group.kind === 'exact_duplicate' || group.kind === 'visual_duplicate') {
      return group.extraBytes ? `${formatBytes(group.extraBytes)} em cópias` : '';
    }
    const first = group.members.map((m) => m.item.capturedAt).filter(Boolean).sort()[0];
    return first ? formatDate(first, true) : '';
  }

  protected emptyIcon() {
    return this.mode() === 'duplicates' ? 'pi pi-clone' : 'pi pi-th-large';
  }

  protected emptyTitle() {
    return this.mode() === 'duplicates' ? 'Nenhuma duplicata encontrada' : 'Nenhum grupo encontrado';
  }

  protected emptyText() {
    const pending = this.organize.counts()?.pending;
    return pending
      ? `A análise ainda está em andamento (${formatCount(pending)} itens na fila). Os grupos aparecem aqui quando ela terminar.`
      : 'Ótimo: nada para revisar aqui por enquanto.';
  }

  protected dims(item: MediaItem) {
    return formatDimensions(item.width, item.height)?.replace(/ \(.*\)/, '') ?? item.extension.toUpperCase();
  }

  protected bytes(n: number) {
    return formatBytes(n);
  }

  protected date(item: MediaItem) {
    return formatDate(item.capturedAt, true);
  }

  protected quality(level: keyof typeof QUALITY_LABEL) {
    return QUALITY_LABEL[level].toLowerCase();
  }

  protected onSelect(item: MediaItem, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || this.selection.active()) {
      this.selection.toggle(item.id);
    } else {
      this.selection.focus(item);
      this.ui.infoPanelOpen.set(true);
    }
  }

  /** Select every member except the best candidate (e.g. to review them). */
  protected selectOthers(group: MediaGroup) {
    for (const m of group.members.slice(1)) {
      if (!this.selection.ids().has(m.item.id)) this.selection.toggle(m.item.id);
    }
  }

  protected isDuplicate(group: MediaGroup) {
    return group.kind === 'exact_duplicate' || group.kind === 'visual_duplicate';
  }

  /** Keep the best candidate, trash the copies (confirmed by `MediaActions`). */
  protected trashOthers(group: MediaGroup) {
    void this.actions.trash(group.members.slice(1).map((m) => m.item.id));
  }

  protected open(group: MediaGroup, item: MediaItem) {
    const filter = group.kind === 'sequence' ? { sequenceId: group.id } : { groupId: group.id };
    this.viewer.open(item, { filter, sort: 'newest' });
  }
}
