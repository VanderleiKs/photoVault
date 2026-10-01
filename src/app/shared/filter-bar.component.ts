import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { MONTH_NAMES, formatCamera, formatCount, formatPlace } from '../core/format';
import { Backend } from '../core/ipc/backend';
import {
  errorMessage,
  unwrap,
  type CameraOption,
  type MediaFilter,
  type MediaType,
  type PlaceOption,
} from '../core/ipc/ipc';
import { NotifyService } from '../core/notify.service';
import { AlbumStore } from '../core/stores/album.store';
import { BrowseStore } from '../core/stores/browse.store';
import { LibraryStore } from '../core/stores/library.store';
import { ScanStore } from '../core/stores/scan.store';

interface Chip {
  label: string;
  clear: MediaFilter | 'text';
}

/** Wait for the typing to settle before recounting the menus. */
const OPTIONS_DELAY_MS = 300;

/** Combinable filters of "Todas as fotos" (PRD §19) as selects + removable chips. */
@Component({
  selector: 'app-filter-bar',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, SelectButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (browse.editing(); as editing) {
      <div class="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
        <i class="pi pi-bolt text-amber-500"></i>
        <span class="min-w-0 flex-1">Editando a regra de <strong>{{ editing.name }}</strong>: ajuste os filtros e salve.</span>
        <p-button label="Cancelar" size="small" [text]="true" severity="secondary" (onClick)="cancelRule()" />
        <p-button label="Salvar regra" icon="pi pi-check" size="small" [disabled]="!browse.filtered()" (onClick)="saveRule()" />
      </div>
    }
    <div class="flex flex-wrap items-center gap-2">
      <p-selectbutton
        [options]="types"
        optionLabel="label"
        optionValue="value"
        [ngModel]="filter().mediaType ?? null"
        (ngModelChange)="browse.patch({ mediaType: $event })"
        [allowEmpty]="false"
        size="small"
        ariaLabel="Tipo de mídia"
      />
      <p-button
        [icon]="filter().favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
        label="Favoritas"
        size="small"
        [outlined]="!filter().favorite"
        [severity]="filter().favorite ? 'danger' : 'secondary'"
        [attr.aria-pressed]="!!filter().favorite"
        (onClick)="browse.patch({ favorite: filter().favorite ? null : true })"
      />
      @if (years().length) {
        <p-select [options]="years()" optionLabel="label" optionValue="value" [ngModel]="filter().year ?? null" (ngModelChange)="setYear($event)" placeholder="Ano" [showClear]="true" size="small" styleClass="w-32" ariaLabel="Ano" />
        <p-select [options]="months" optionLabel="label" optionValue="value" [ngModel]="filter().month ?? null" (ngModelChange)="browse.patch({ month: $event, day: null })" placeholder="Mês" [showClear]="true" size="small" styleClass="w-36" ariaLabel="Mês" />
      }
      @if (places().length) {
        <p-select [options]="places()" optionLabel="label" optionValue="value" [ngModel]="filter().placeId ?? null" (ngModelChange)="browse.patch({ placeId: $event })" placeholder="Local" [showClear]="true" [filter]="places().length > 8" filterPlaceholder="Buscar local" size="small" styleClass="w-48" ariaLabel="Local" />
      }
      @if (cameras().length > 1) {
        <p-select [options]="cameras()" optionLabel="label" optionValue="value" [ngModel]="filter().camera ?? null" (ngModelChange)="browse.patch({ camera: $event })" placeholder="Câmera" [showClear]="true" size="small" styleClass="w-48" ariaLabel="Câmera" />
      }

      @if (browse.filtered() && !browse.editing()) {
        <span class="mx-1 hidden h-5 w-px bg-line sm:block"></span>
        <p-button label="Salvar como álbum" icon="pi pi-bookmark" size="small" [text]="true" pTooltip="Cria um álbum inteligente que se atualiza sozinho com estes filtros" tooltipPosition="bottom" (onClick)="openSave()" />
        <p-button label="Limpar" icon="pi pi-filter-slash" size="small" [text]="true" severity="secondary" (onClick)="browse.clear()" />
      }
    </div>

    @if (chips().length) {
      <div class="mt-2 flex flex-wrap gap-1.5" aria-label="Filtros ativos">
        @for (chip of chips(); track chip.label) {
          <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-3 pr-1 text-xs font-medium text-primary">
            {{ chip.label }}
            <button type="button" class="flex size-5 items-center justify-center rounded-full hover:bg-primary/15" [attr.aria-label]="'Remover filtro ' + chip.label" (click)="remove(chip)">
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </span>
        }
      </div>
    }

    <p-dialog header="Salvar como álbum inteligente" [(visible)]="saving" [modal]="true" [draggable]="false" styleClass="w-[26rem] max-w-[95vw]">
      <form (ngSubmit)="save()">
        <p class="mb-3 text-sm text-muted">O álbum mostra sempre as fotos que atendem a estes filtros, inclusive as que chegarem depois.</p>
        <div class="mb-3 flex flex-wrap gap-1.5">
          @for (chip of chips(); track chip.label) {
            <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{{ chip.label }}</span>
          }
        </div>
        <input pInputText name="albumName" class="w-full" placeholder="Nome do álbum" aria-label="Nome do álbum" [(ngModel)]="albumName" [ngModelOptions]="{ standalone: true }" maxlength="100" />
        @if (saveError()) {
          <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ saveError() }}</p>
        }
        <div class="mt-4 flex justify-end gap-2">
          <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="saving.set(false)" />
          <p-button type="submit" label="Criar álbum" icon="pi pi-check" [disabled]="!albumName().trim()" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class FilterBarComponent {
  protected readonly browse = inject(BrowseStore);
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);
  private readonly albums = inject(AlbumStore);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  protected readonly filter = this.browse.filter;
  protected readonly types: { label: string; value: MediaType | null }[] = [
    { label: 'Tudo', value: null },
    { label: 'Fotos', value: 'image' },
    { label: 'Vídeos', value: 'video' },
  ];
  protected readonly months = MONTH_NAMES.map((label, i) => ({ label, value: i + 1 }));

  private readonly yearOptions = signal<{ year: number; count: number }[]>([]);
  private readonly placeOptions = signal<PlaceOption[]>([]);
  private readonly cameraOptions = signal<CameraOption[]>([]);

  protected readonly years = computed(() =>
    this.yearOptions().map((y) => ({ label: `${y.year} (${formatCount(y.count)})`, value: y.year })),
  );
  protected readonly places = computed(() =>
    this.placeOptions().map((p) => ({
      label: `${formatPlace(p.name, p.admin1, null)} (${formatCount(p.count)})`,
      value: p.id,
    })),
  );
  protected readonly cameras = computed(() =>
    this.cameraOptions().map((c) => ({
      label: `${formatCamera(c.make, c.model)} (${formatCount(c.count)})`,
      value: c.model,
    })),
  );

  protected readonly chips = computed<Chip[]>(() => {
    const f = this.filter();
    const chips: Chip[] = [];
    const text = this.browse.text().trim();
    if (text) chips.push({ label: `Busca: "${text}"`, clear: 'text' });
    if (f.mediaType) chips.push({ label: f.mediaType === 'image' ? 'Só fotos' : 'Só vídeos', clear: { mediaType: null } });
    if (f.favorite) chips.push({ label: 'Favoritas', clear: { favorite: null } });
    if (f.year && f.month && f.day) {
      chips.push({ label: `${f.day} de ${MONTH_NAMES[f.month - 1].toLowerCase()} de ${f.year}`, clear: { day: null } });
    } else {
      if (f.year) chips.push({ label: String(f.year), clear: { year: null, day: null } });
      if (f.month) chips.push({ label: MONTH_NAMES[f.month - 1], clear: { month: null, day: null } });
    }
    if (f.placeId) {
      const p = this.placeOptions().find((o) => o.id === f.placeId);
      chips.push({ label: p ? formatPlace(p.name, p.admin1, null)! : 'Local', clear: { placeId: null } });
    }
    if (f.camera) chips.push({ label: f.camera, clear: { camera: null } });
    return chips;
  });

  protected readonly saving = signal(false);
  protected readonly albumName = signal('');
  protected readonly saveError = signal<string | null>(null);

  constructor() {
    const scan = inject(ScanStore);
    // The counts follow the search and the other filters ("praia": 12 photos, 2019: 3).
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect((onCleanup) => {
      const id = this.libraries.activeId();
      const filter = this.browse.query().filter ?? {};
      scan.lastSummary();
      timer = setTimeout(() => untracked(() => void this.loadOptions(id, filter)), OPTIONS_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  private optionsSeq = 0;

  /** Each menu counts the photos of the current search, without its own choice. */
  private async loadOptions(libraryId: string | null, filter: MediaFilter) {
    if (!libraryId || !isTauri()) return;
    const seq = ++this.optionsSeq;
    const { commands } = this.backend;
    const [buckets, places, cameras] = await Promise.all([
      unwrap(commands.getTimeline(libraryId, { ...filter, year: null, month: null, day: null })).catch(() => []),
      unwrap(commands.listPlaces(libraryId, filter)).catch(() => []),
      unwrap(commands.listCameras(libraryId, filter)).catch(() => []),
    ]);
    if (seq !== this.optionsSeq) return;
    const years = new Map<number, number>();
    for (const b of buckets) if (b.year) years.set(b.year, (years.get(b.year) ?? 0) + b.count);
    this.yearOptions.set([...years].map(([year, count]) => ({ year, count })));
    this.placeOptions.set(places);
    this.cameraOptions.set(cameras);
  }

  protected setYear(year: number | null) {
    this.browse.patch({ year, day: null });
  }

  protected remove(chip: Chip) {
    if (chip.clear === 'text') this.browse.text.set('');
    else this.browse.patch(chip.clear);
  }

  protected async saveRule() {
    const editing = this.browse.editing();
    if (!editing) return;
    try {
      await this.albums.updateRule(editing.id, this.browse.query().filter ?? {});
      this.browse.endEditing();
      void this.router.navigate(['/albums', editing.id]);
    } catch (e) {
      this.notify.error('Não foi possível salvar a regra', e);
    }
  }

  protected cancelRule() {
    const editing = this.browse.editing();
    this.browse.endEditing();
    if (editing) void this.router.navigate(['/albums', editing.id]);
  }

  protected openSave() {
    this.albumName.set(this.chips().map((c) => c.label.replace(/^Busca: /, '').replaceAll('"', '')).join(' · '));
    this.saveError.set(null);
    this.saving.set(true);
  }

  protected async save() {
    try {
      const album = await this.albums.create(this.albumName(), this.browse.query().filter ?? {});
      this.saving.set(false);
      void this.router.navigate(['/albums', album.id]);
    } catch (e) {
      this.saveError.set(errorMessage(e));
    }
  }
}
