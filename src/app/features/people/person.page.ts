import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { faceUrl, unwrap, usePlaceholder, type FaceInfo, type MediaItem, type PersonSummary } from '../../core/ipc/ipc';
import { GalleryStore } from '../../core/stores/gallery.store';
import { LibraryStore } from '../../core/stores/library.store';
import { PeopleStore, personLabel } from '../../core/stores/people.store';
import { ViewerContext } from '../../core/stores/viewer-context';
import { MediaGridComponent } from '../../shared/media-grid/media-grid.component';

/** Faces loaded for review at once (the least certain first). */
const REVIEW_LIMIT = 600;

/** One person: name, photos, and the corrections (PRD §20). Route: /people/:id */
@Component({
  selector: 'app-person-page',
  imports: [FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SkeletonModule, MediaGridComponent],
  providers: [GalleryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (person(); as p) {
      <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
        <a routerLink="/people" class="text-xs text-muted hover:text-ink"><i class="pi pi-arrow-left mr-1 text-[10px]"></i>Pessoas</a>
        <div class="mt-2 flex flex-wrap items-center gap-4">
          <span class="block size-16 shrink-0 overflow-hidden rounded-full bg-panel-2">
            @if (p.coverFaceId) {
              <img [src]="face(p.coverFaceId)" alt="" class="size-full object-cover" (error)="placeholder($event)" />
            }
          </span>
          <div class="min-w-0 flex-1">
            @if (editing()) {
              <form class="flex max-w-md items-center gap-2" (ngSubmit)="saveName(p)">
                <input
                  pInputText
                  name="name"
                  list="person-names"
                  class="min-w-0 flex-1"
                  placeholder="Nome"
                  aria-label="Nome da pessoa"
                  maxlength="80"
                  autocomplete="off"
                  [(ngModel)]="draft"
                  [ngModelOptions]="{ standalone: true }"
                  (keydown.escape)="editing.set(false)"
                />
                <p-button type="submit" icon="pi pi-check" [rounded]="true" size="small" ariaLabel="Salvar nome" />
                <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="secondary" size="small" ariaLabel="Cancelar" (onClick)="editing.set(false)" />
              </form>
            } @else {
              <h1 class="flex items-center gap-2 text-xl font-semibold">
                <span class="truncate" [class.text-muted]="!p.name">{{ label(p) }}</span>
                <button type="button" class="text-sm text-muted hover:text-ink" [attr.aria-label]="p.name ? 'Editar nome' : 'Adicionar nome'" (click)="startName(p)">
                  <i class="pi pi-pencil"></i>
                </button>
              </h1>
            }
            <p class="text-sm text-muted">
              {{ fmt(p.photoCount) }} {{ p.photoCount === 1 ? 'foto' : 'fotos' }}
              @if (p.hidden) {
                · oculta
              }
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            @if (!p.name) {
              <p-button label="Adicionar nome" icon="pi pi-pencil" size="small" (onClick)="startName(p)" />
            }
            <p-button label="Revisar rostos" icon="pi pi-user-edit" size="small" severity="secondary" [outlined]="true" (onClick)="openReview()" />
            <p-button label="Juntar com…" icon="pi pi-link" size="small" severity="secondary" [outlined]="true" [disabled]="!others().length" (onClick)="mergeOpen.set(true)" />
            <p-button [label]="p.hidden ? 'Mostrar' : 'Ocultar'" [icon]="p.hidden ? 'pi pi-eye' : 'pi pi-eye-slash'" size="small" severity="secondary" [text]="true" (onClick)="toggleHidden(p)" />
          </div>
        </div>
        @if (!p.name) {
          <p class="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs">
            Fotos agrupadas porque o rosto é parecido. Dê um nome para buscar por ela; confira em "Revisar rostos" se algum não é dela.
          </p>
        }
      </header>

      <section class="p-6">
        <app-media-grid
          [label]="label(p)"
          [items]="gallery.items()"
          [loading]="gallery.loading()"
          [hasMore]="gallery.hasMore()"
          (loadMore)="gallery.loadMore()"
          (open)="open($event)"
        />
      </section>

      <datalist id="person-names">
        @for (n of people.names(); track n.id) {
          <option [value]="n.name"></option>
        }
      </datalist>

      <p-dialog
        [header]="'Rostos de ' + label(p)"
        [visible]="reviewOpen()"
        (visibleChange)="reviewOpen.set($event)"
        [modal]="true"
        [draggable]="false"
        styleClass="w-[52rem] max-w-[95vw]"
      >
        <p class="mb-3 text-sm text-muted">
          Marque os rostos que não são {{ p.name ?? 'desta pessoa' }}: eles saem e não voltam. Os que o PhotoVault colocou aqui sozinho aparecem primeiro.
        </p>
        @if (reviewLoading()) {
          <div class="grid grid-cols-6 gap-2">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <p-skeleton height="6rem" />
            }
          </div>
        } @else {
          <ul class="grid max-h-[60vh] gap-2 overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(6rem,1fr))]">
            @for (f of faces(); track f.id) {
              <li>
                <button
                  type="button"
                  class="relative block aspect-square w-full overflow-hidden rounded-lg bg-panel-2"
                  [class]="marked().has(f.id) ? 'ring-4 ring-rose-500' : 'hover:ring-2 hover:ring-line'"
                  [attr.aria-pressed]="marked().has(f.id)"
                  [attr.aria-label]="marked().has(f.id) ? 'Desmarcar rosto' : 'Marcar rosto como errado'"
                  (click)="toggleMark(f)"
                >
                  <img [src]="face(f.id)" alt="" loading="lazy" class="size-full object-cover" (error)="placeholder($event)" />
                  @if (marked().has(f.id)) {
                    <span class="absolute inset-0 flex items-center justify-center bg-rose-600/40"><i class="pi pi-times text-2xl text-white"></i></span>
                  } @else if (f.confirmed) {
                    <span class="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white" title="Confirmado por você">
                      <i class="pi pi-check text-[10px]"></i>
                    </span>
                  }
                </button>
              </li>
            }
          </ul>
        }
        <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
          @if (marked().size === 1) {
            <p-button label="Usar como foto" icon="pi pi-image" severity="secondary" [text]="true" (onClick)="useAsCover(p)" />
          }
          <span class="flex-1"></span>
          <p-button label="Fechar" severity="secondary" [text]="true" (onClick)="reviewOpen.set(false)" />
          <p-button
            [label]="marked().size ? 'Não é ' + (p.name ?? 'esta pessoa') + ' (' + marked().size + ')' : 'Não é ' + (p.name ?? 'esta pessoa')"
            icon="pi pi-user-minus"
            severity="danger"
            [disabled]="!marked().size"
            (onClick)="removeMarked()"
          />
        </div>
      </p-dialog>

      <p-dialog header="Juntar com outra pessoa" [visible]="mergeOpen()" (visibleChange)="mergeOpen.set($event)" [modal]="true" [draggable]="false" styleClass="w-[40rem] max-w-[95vw]">
        <p class="mb-3 text-sm text-muted">Escolha quem é a mesma pessoa. As fotos passam a ficar numa pessoa só, com o nome que ela já tiver.</p>
        <ul class="grid max-h-[60vh] gap-4 overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(6.5rem,1fr))]">
          @for (o of others(); track o.id) {
            <li>
              <button type="button" class="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-panel-2" (click)="mergeWith(p, o)">
                <span class="block size-20 overflow-hidden rounded-full bg-panel-2">
                  @if (o.coverFaceId) {
                    <img [src]="face(o.coverFaceId)" alt="" loading="lazy" class="size-full object-cover" (error)="placeholder($event)" />
                  }
                </span>
                <span class="max-w-full truncate text-sm" [class.text-muted]="!o.name">{{ label(o) }}</span>
                <span class="text-xs text-muted">{{ fmt(o.photoCount) }} fotos</span>
              </button>
            </li>
          }
        </ul>
      </p-dialog>
    } @else if (missing()) {
      <div class="p-10 text-center text-muted">
        <p>Esta pessoa não existe mais (o grupo pode ter mudado ou sido juntado a outro).</p>
        <p-button class="mt-4 inline-block" label="Voltar para Pessoas" routerLink="/people" [text]="true" />
      </div>
    } @else {
      <div class="space-y-4 p-6"><p-skeleton height="4rem" /><p-skeleton height="12rem" /></div>
    }
  `,
})
export class PersonPage {
  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly people = inject(PeopleStore);
  protected readonly gallery = inject(GalleryStore);
  private readonly backend = inject(Backend);
  private readonly libraries = inject(LibraryStore);
  private readonly viewer = inject(ViewerContext);
  private readonly router = inject(Router);

  protected readonly person = signal<PersonSummary | null>(null);
  protected readonly missing = signal(false);
  protected readonly editing = signal(false);
  protected readonly draft = signal('');
  protected readonly reviewOpen = signal(false);
  protected readonly reviewLoading = signal(false);
  protected readonly faces = signal<FaceInfo[]>([]);
  protected readonly marked = signal<ReadonlySet<string>>(new Set());
  protected readonly mergeOpen = signal(false);

  protected readonly others = computed(() => this.people.all().filter((p) => p.id !== this.id() && !p.hidden));

  constructor() {
    effect(() => this.gallery.fixed.set({ personId: this.id() }));
    effect(() => {
      const id = this.id();
      this.people.version();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string) {
    const library = this.libraries.activeId();
    if (!library || !isTauri()) return;
    try {
      const person = await unwrap(this.backend.commands.getPerson(library, id));
      if (id !== this.id()) return;
      this.person.set(person);
      this.missing.set(false);
      void this.gallery.refresh();
    } catch {
      this.person.set(null);
      this.missing.set(true);
    }
  }

  protected label(p: PersonSummary) {
    return personLabel(p);
  }

  protected face(id: string) {
    return faceUrl(id);
  }

  protected placeholder(e: Event) {
    usePlaceholder(e);
  }

  protected fmt(n: number) {
    return formatCount(n);
  }

  protected open(item: MediaItem) {
    this.viewer.open(item, { filter: { personId: this.id() }, sort: 'newest' });
  }

  protected startName(p: PersonSummary) {
    this.draft.set(p.name ?? '');
    this.editing.set(true);
  }

  protected async saveName(p: PersonSummary) {
    const name = this.draft().trim();
    if (!name) return;
    const kept = await this.people.rename(p.id, name);
    if (!kept) return;
    this.editing.set(false);
    if (kept !== p.id) void this.router.navigate(['/people', kept], { replaceUrl: true });
  }

  protected async openReview() {
    const library = this.libraries.activeId();
    if (!library) return;
    this.marked.set(new Set());
    this.reviewOpen.set(true);
    this.reviewLoading.set(true);
    try {
      this.faces.set(await unwrap(this.backend.commands.getPersonFaces(library, this.id(), REVIEW_LIMIT)));
    } catch {
      this.faces.set([]);
    } finally {
      this.reviewLoading.set(false);
    }
  }

  protected toggleMark(f: FaceInfo) {
    const next = new Set(this.marked());
    if (next.has(f.id)) next.delete(f.id);
    else next.add(f.id);
    this.marked.set(next);
  }

  protected async removeMarked() {
    const ids = [...this.marked()];
    if (!(await this.people.removeFaces(ids))) return;
    this.faces.update((all) => all.filter((f) => !this.marked().has(f.id)));
    this.marked.set(new Set());
  }

  protected async useAsCover(p: PersonSummary) {
    const [faceId] = [...this.marked()];
    if (!faceId) return;
    await this.people.setCover(p.id, faceId);
    this.marked.set(new Set());
  }

  /** The one with a name absorbs the other (this one, if both or neither have). */
  protected async mergeWith(p: PersonSummary, other: PersonSummary) {
    const [target, source] = !p.name && other.name ? [other, p] : [p, other];
    if (!(await this.people.merge(target.id, [source.id]))) return;
    this.mergeOpen.set(false);
    if (target.id !== p.id) void this.router.navigate(['/people', target.id], { replaceUrl: true });
  }

  protected async toggleHidden(p: PersonSummary) {
    await this.people.setHidden(p.id, !p.hidden);
  }
}
