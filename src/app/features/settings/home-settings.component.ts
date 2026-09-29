import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isTauri } from '@tauri-apps/api/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { formatPlace } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type Home } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { AppStore, DEFAULT_EVENTS } from '../../core/stores/app.store';

const MAX_HOMES = 5;

/** Settings → "Viagens e eventos" → "Sua casa": confirm the detected one or choose cities. */
@Component({
  selector: 'app-home-settings',
  imports: [FormsModule, ButtonModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-sm font-semibold">Sua casa</h3>
    <p class="mt-1 text-xs text-muted">As viagens são medidas a partir da casa mais próxima. Sem casa definida, vale o lugar onde você fotografa em mais dias.</p>

    @if (homes().length) {
      <ul class="mt-3 flex flex-wrap gap-2" aria-label="Suas casas">
        @for (h of homes(); track h.name) {
          <li class="flex items-center gap-2 rounded-full border border-line py-1 pl-3 pr-1 text-sm">
            <i class="pi pi-home text-xs text-muted"></i>{{ label(h) }}
            <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="secondary" size="small" [ariaLabel]="'Remover ' + h.name" (onClick)="remove(h)" />
          </li>
        }
      </ul>
    } @else {
      @for (h of detected(); track h.name) {
        <div class="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <i class="pi pi-map-marker text-primary"></i>
          <span class="flex-1">Pelas fotos, sua casa parece ser <strong>{{ label(h) }}</strong>. Está certo?</span>
          <p-button label="Confirmar" icon="pi pi-check" size="small" (onClick)="add(h)" />
        </div>
      } @empty {
        <p class="mt-3 text-sm text-muted">Ainda não há fotos com localização suficientes para saber onde é sua casa.</p>
      }
    }

    @if (homes().length < maxHomes) {
      <div class="relative mt-3 max-w-md">
        <input
          pInputText
          class="w-full"
          [placeholder]="homes().length ? 'Adicionar outra cidade…' : 'Escolher outra cidade…'"
          aria-label="Buscar cidade"
          autocomplete="off"
          [ngModel]="query()"
          (ngModelChange)="search($event)"
          (keydown.escape)="clear()"
        />
        @if (results().length) {
          <ul class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-lg" role="listbox" aria-label="Cidades">
            @for (r of results(); track $index) {
              <li>
                <button type="button" class="w-full px-3 py-2 text-left text-sm hover:bg-canvas" (click)="add(r)">{{ label(r) }}</button>
              </li>
            }
          </ul>
        } @else if (query().trim().length >= 2 && !searching()) {
          <p class="mt-1 text-xs text-muted">Nenhuma cidade encontrada.</p>
        }
      </div>
    }
  `,
})
export class HomeSettingsComponent {
  private readonly app = inject(AppStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);

  protected readonly maxHomes = MAX_HOMES;
  protected readonly homes = computed(() => this.app.settings().events?.homes ?? []);
  protected readonly detected = signal<Home[]>([]);
  protected readonly query = signal('');
  protected readonly results = signal<Home[]>([]);
  protected readonly searching = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;

  constructor() {
    if (isTauri()) {
      unwrap(this.backend.commands.getDetectedHomes())
        .then((h) => this.detected.set(h))
        .catch(() => {});
    }
  }

  protected label(h: Home): string {
    return formatPlace(h.name, null, h.countryCode ?? null) ?? h.name;
  }

  protected search(text: string) {
    this.query.set(text);
    clearTimeout(this.timer);
    if (text.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.searching.set(true);
    const seq = ++this.seq;
    this.timer = setTimeout(async () => {
      try {
        const found = await unwrap(this.backend.commands.searchHomePlaces(text));
        if (seq === this.seq) this.results.set(found);
      } catch (e) {
        this.notify.error('Não foi possível buscar a cidade', e);
      } finally {
        if (seq === this.seq) this.searching.set(false);
      }
    }, 200);
  }

  protected clear() {
    this.seq++;
    this.query.set('');
    this.results.set([]);
  }

  protected add(h: Home) {
    this.clear();
    if (this.homes().some((o) => o.name === h.name)) return;
    void this.save([...this.homes(), h], 'Casa definida');
  }

  protected remove(h: Home) {
    void this.save(this.homes().filter((o) => o !== h), 'Casa removida');
  }

  private async save(homes: Home[], done: string) {
    const events = { ...(this.app.settings().events ?? DEFAULT_EVENTS), homes };
    try {
      await this.app.updateSettings({ events });
      this.notify.success(done, 'As sugestões de viagens estão sendo refeitas.');
    } catch {
      // Already notified by the store.
    }
  }
}
