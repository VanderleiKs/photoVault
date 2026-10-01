import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type PersonName, type PersonSummary } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { LibraryStore } from './library.store';

/** People of the active library (PRD §20) and the decisions on them: name, merge, hide, correct. */
@Injectable({ providedIn: 'root' })
export class PeopleStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);

  /** Everyone with photos in the library, hidden included. */
  readonly all = signal<PersonSummary[]>([]);
  readonly loaded = signal(false);
  /** Named people (for suggesting names while typing). */
  readonly names = signal<PersonName[]>([]);
  /** Bumps when faces were regrouped or a decision changed them; pages reload on it. */
  readonly version = signal(0);

  readonly named = computed(() => this.all().filter((p) => p.name && !p.hidden));
  readonly suggested = computed(() => this.all().filter((p) => !p.name && !p.hidden));
  readonly hidden = computed(() => this.all().filter((p) => p.hidden));

  private listening = false;

  constructor() {
    effect(() => {
      const library = this.libraries.activeId();
      this.version();
      untracked(() => void this.load(library));
    });
  }

  async init(): Promise<void> {
    if (this.listening || !isTauri()) return;
    this.listening = true;
    await this.backend.events.peopleUpdatedEvent.listen(() => this.touch());
  }

  touch(): void {
    this.version.update((v) => v + 1);
  }

  async load(libraryId = this.libraries.activeId()): Promise<void> {
    if (!libraryId || !isTauri()) {
      this.all.set([]);
      return;
    }
    try {
      const [people, names] = await Promise.all([
        unwrap(this.backend.commands.listPeople(libraryId, true)),
        unwrap(this.backend.commands.listPersonNames()),
      ]);
      if (libraryId !== this.libraries.activeId()) return;
      this.all.set(people);
      this.names.set(names);
    } catch (e) {
      this.notify.error('Não foi possível carregar as pessoas', e);
    } finally {
      this.loaded.set(true);
    }
  }

  /** Returns the id that remains (another person with that name absorbs this one), or null. */
  async rename(id: string, name: string): Promise<string | null> {
    const existing = this.names().find((n) => n.id !== id && fold(n.name) === fold(name));
    try {
      const kept = await unwrap(this.backend.commands.renamePerson(id, name));
      if (existing) this.notify.success(`Juntado com ${existing.name}`, 'Já existia uma pessoa com esse nome: agora é uma só.');
      this.touch();
      return kept;
    } catch (e) {
      this.notify.error('Não foi possível salvar o nome', e);
      return null;
    }
  }

  async merge(targetId: string, sourceIds: string[]): Promise<boolean> {
    try {
      await unwrap(this.backend.commands.mergePeople(targetId, sourceIds));
      this.notify.success('Pessoas juntadas', 'As fotos agora estão numa pessoa só.');
      this.touch();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível juntar', e);
      return false;
    }
  }

  async setHidden(id: string, hidden: boolean): Promise<boolean> {
    try {
      await unwrap(this.backend.commands.setPersonHidden(id, hidden));
      this.notify.success(hidden ? 'Pessoa oculta' : 'Pessoa visível de novo', hidden ? 'Ela não aparece mais em Pessoas nem na busca. Você pode mostrá-la de novo em "Ocultas".' : '');
      this.touch();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível alterar', e);
      return false;
    }
  }

  async setCover(personId: string, faceId: string): Promise<void> {
    try {
      await unwrap(this.backend.commands.setPersonCover(personId, faceId));
      this.touch();
    } catch (e) {
      this.notify.error('Não foi possível trocar a foto', e);
    }
  }

  /** "Not this person". */
  async removeFaces(faceIds: string[]): Promise<boolean> {
    try {
      await unwrap(this.backend.commands.removePersonFaces(faceIds));
      this.touch();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível remover', e);
      return false;
    }
  }

  /** "Não é um rosto": hidden for good, never grouped. */
  async ignoreFaces(faceIds: string[]): Promise<boolean> {
    try {
      await unwrap(this.backend.commands.ignoreFaces(faceIds));
      this.notify.success(faceIds.length === 1 ? 'Rosto removido' : 'Rostos removidos', 'Não aparecem mais nas fotos nem em Pessoas.');
      this.touch();
      return true;
    } catch (e) {
      this.notify.error('Não foi possível remover', e);
      return false;
    }
  }

  /** "This is Ana": returns the person's id, or null. */
  async nameFace(faceId: string, name: string): Promise<string | null> {
    try {
      const id = await unwrap(this.backend.commands.nameFace(faceId, name));
      this.touch();
      return id;
    } catch (e) {
      this.notify.error('Não foi possível salvar o nome', e);
      return null;
    }
  }
}

/** Lowercase without accents, as the backend compares names. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** "Ana" / "Pessoa sem nome". */
export function personLabel(p: { name: string | null }): string {
  return p.name ?? 'Sem nome';
}
