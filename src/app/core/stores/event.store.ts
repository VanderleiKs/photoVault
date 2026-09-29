import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from '../ipc/backend';
import { unwrap, type EventSummary, type EventUpdate } from '../ipc/ipc';
import { NotifyService } from '../notify.service';
import { LibraryStore } from './library.store';
import { OrganizeStore } from './organize.store';

/** Trips and events of the active library (PRD §17) and the decisions on them. */
@Injectable({ providedIn: 'root' })
export class EventStore {
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);

  /** Not ignored, newest first. */
  readonly events = signal<EventSummary[]>([]);
  readonly ignored = signal<EventSummary[]>([]);
  readonly loaded = signal(false);
  readonly suggested = computed(() => this.events().filter((e) => e.status === 'suggested'));
  readonly trips = computed(() => this.events().filter((e) => e.kind === 'trip' && e.status !== 'suggested'));
  readonly others = computed(() => this.events().filter((e) => e.kind === 'event' && e.status !== 'suggested'));

  constructor() {
    // New analysis passes (and local edits) change the suggestions.
    effect(() => {
      const library = this.libraries.activeId();
      this.organize.version();
      untracked(() => void this.load(library));
    });
  }

  async load(libraryId = this.libraries.activeId()): Promise<void> {
    if (!libraryId || !isTauri()) {
      this.events.set([]);
      this.ignored.set([]);
      return;
    }
    try {
      const [events, ignored] = await Promise.all([
        unwrap(this.backend.commands.listEvents(libraryId, false)),
        unwrap(this.backend.commands.listEvents(libraryId, true)),
      ]);
      if (libraryId !== this.libraries.activeId()) return;
      this.events.set(events);
      this.ignored.set(ignored);
    } catch (e) {
      this.notify.error('Não foi possível carregar as viagens', e);
    } finally {
      this.loaded.set(true);
    }
  }

  accept(id: string) {
    return this.decide(() => this.backend.commands.acceptEvent(id), 'Adicionado às suas viagens e eventos');
  }

  ignore(id: string) {
    return this.decide(() => this.backend.commands.ignoreEvent(id), 'Sugestão ignorada', 'Ela não será sugerida de novo. Você pode restaurá-la em "Ignorados".');
  }

  restore(id: string) {
    return this.decide(() => this.backend.commands.restoreEvent(id), 'Sugestão restaurada');
  }

  update(id: string, change: EventUpdate) {
    return this.decide(() => this.backend.commands.updateEvent(id, change));
  }

  removeMedia(id: string, mediaIds: readonly string[]) {
    return this.decide(() => this.backend.commands.removeFromEvent(id, [...mediaIds]), 'Fotos removidas do evento', 'Os arquivos continuam na biblioteca.');
  }

  private async decide(
    call: () => ReturnType<typeof this.backend.commands.getEvent>,
    success?: string,
    detail?: string,
  ): Promise<EventSummary | null> {
    try {
      const event = await unwrap(call());
      if (success) this.notify.success(success, detail);
      this.organize.touch();
      return event;
    } catch (e) {
      this.notify.error('Não foi possível atualizar o evento', e);
      return null;
    }
  }
}
