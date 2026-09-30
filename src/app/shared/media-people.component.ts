import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../core/ipc/backend';
import { faceUrl, unwrap, usePlaceholder, type FaceInfo, type MediaItem } from '../core/ipc/ipc';
import { PeopleStore } from '../core/stores/people.store';

/**
 * "Pessoas" of one photo (PRD §20): the faces found, with their names; an unnamed face
 * can be named here ("Quem é?"), a wrong one taken out. Nothing without the face models.
 */
@Component({
  selector: 'app-media-people',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (faces().length) {
      <h4 class="mb-2 mt-4 text-sm font-semibold" [class]="dark() ? 'text-white' : 'text-ink'">Pessoas</h4>
      <ul class="flex flex-wrap gap-3">
        @for (f of faces(); track f.id) {
          <li class="group flex w-16 flex-col items-center gap-1 text-center">
            <span class="relative block size-14">
              @if (f.personId && f.personName) {
                <a [routerLink]="['/people', f.personId]" class="block size-14 overflow-hidden rounded-full ring-primary hover:ring-2" [attr.aria-label]="'Ver fotos de ' + f.personName">
                  <img [src]="face(f.id)" alt="" loading="lazy" class="size-full object-cover" (error)="placeholder($event)" />
                </a>
                <button
                  type="button"
                  class="absolute -right-1 -top-1 hidden size-5 items-center justify-center rounded-full bg-rose-600 text-white group-hover:flex focus:flex"
                  [attr.aria-label]="'Não é ' + f.personName"
                  [title]="'Não é ' + f.personName"
                  (click)="notThem(f)"
                >
                  <i class="pi pi-times text-[9px]"></i>
                </button>
              } @else {
                <button type="button" class="block size-14 overflow-hidden rounded-full ring-primary hover:ring-2" aria-label="Dar nome a este rosto" (click)="start(f)">
                  <img [src]="face(f.id)" alt="" loading="lazy" class="size-full object-cover" (error)="placeholder($event)" />
                </button>
              }
            </span>
            @if (editing() === f.id) {
              <form (ngSubmit)="save(f)">
                <input
                  name="name"
                  [attr.list]="listId"
                  class="w-20 rounded-md border bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-primary"
                  [class]="dark() ? 'border-white/15 text-slate-100' : 'border-line'"
                  placeholder="Nome"
                  aria-label="Nome da pessoa"
                  maxlength="80"
                  autocomplete="off"
                  [(ngModel)]="draft"
                  [ngModelOptions]="{ standalone: true }"
                  (keydown.escape)="editing.set(null)"
                />
              </form>
            } @else if (f.personName) {
              <span class="w-full truncate text-xs" [class]="dark() ? 'text-slate-200' : 'text-ink'" [title]="f.personName">{{ f.personName }}</span>
            } @else {
              <button type="button" class="text-xs text-primary hover:underline" (click)="start(f)">Quem é?</button>
            }
          </li>
        }
      </ul>
      <datalist [id]="listId">
        @for (n of people.names(); track n.id) {
          <option [value]="n.name"></option>
        }
      </datalist>
    }
  `,
})
export class MediaPeopleComponent {
  readonly item = input.required<MediaItem>();
  readonly dark = input(false);

  protected readonly people = inject(PeopleStore);
  private readonly backend = inject(Backend);

  protected readonly faces = signal<FaceInfo[]>([]);
  protected readonly editing = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly listId = `people-${Math.random().toString(36).slice(2)}`;

  constructor() {
    effect(() => {
      const id = this.item().id;
      this.people.version();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string) {
    if (!isTauri()) return;
    const faces = await unwrap(this.backend.commands.getMediaFaces(id)).catch(() => []);
    if (id === this.item().id) this.faces.set(faces);
  }

  protected face(id: string) {
    return faceUrl(id);
  }

  protected placeholder(e: Event) {
    usePlaceholder(e);
  }

  protected start(f: FaceInfo) {
    this.draft.set('');
    this.editing.set(f.id);
  }

  protected async save(f: FaceInfo) {
    const name = this.draft().trim();
    if (!name) {
      this.editing.set(null);
      return;
    }
    if (await this.people.nameFace(f.id, name)) this.editing.set(null);
  }

  protected async notThem(f: FaceInfo) {
    await this.people.removeFaces([f.id]);
  }
}
