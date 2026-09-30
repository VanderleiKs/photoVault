import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import { faceUrl, usePlaceholder, type PersonSummary } from '../../core/ipc/ipc';
import { AiStore } from '../../core/stores/ai.store';
import { JobStore } from '../../core/stores/job.store';
import { PeopleStore, personLabel } from '../../core/stores/people.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { JobStatusComponent } from '../../shared/job-status.component';

/** "Pessoas" (PRD §20): named people, suggestions to name, merge and hide. */
@Component({
  selector: 'app-people-page',
  imports: [NgTemplateOutlet, FormsModule, RouterLink, ButtonModule, SkeletonModule, EmptyStateComponent, JobStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header data-sticky-header class="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex items-center gap-2 text-xl font-semibold"><i class="pi pi-user text-muted"></i>Pessoas</h1>
          <p class="text-sm text-muted">{{ subtitle() }}</p>
        </div>
        <app-job-status />
        @if (visible().length >= 2) {
          <p-button
            [label]="picking() ? 'Cancelar' : 'Juntar pessoas'"
            [icon]="picking() ? 'pi pi-times' : 'pi pi-link'"
            size="small"
            [outlined]="!picking()"
            [text]="picking()"
            severity="secondary"
            title="A mesma pessoa aparece em mais de um grupo? Junte os grupos em um só."
            (onClick)="togglePicking()"
          />
        }
      </div>
      @if (picking()) {
        <div class="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <span class="flex-1">Escolha os grupos que são a mesma pessoa. {{ picked().size ? picked().size + ' escolhidos.' : '' }}</span>
          <p-button label="Juntar" icon="pi pi-link" size="small" [disabled]="picked().size < 2" (onClick)="mergePicked()" />
        </div>
      }
    </header>

    <div class="space-y-8 p-6">
      @if (!ai.facesInstalled()) {
        <app-empty-state
          icon="pi pi-user"
          title="Reconhecimento de rostos desligado"
          text="Baixe os modelos de rostos (39 MB) em Configurações → IA local. O PhotoVault encontra os rostos e agrupa as fotos de cada pessoa, tudo no seu computador; você dá os nomes e depois busca por eles."
        >
          <p-button label="Abrir Configurações" icon="pi pi-cog" routerLink="/settings" />
        </app-empty-state>
      } @else if (!people.loaded()) {
        <div class="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))]">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <p-skeleton shape="circle" size="7rem" />
          }
        </div>
      } @else if (!visible().length && !people.hidden().length) {
        <app-empty-state icon="pi pi-user" title="Nenhuma pessoa ainda" [text]="emptyText()" />
      }

      @if (people.named().length) {
        <section aria-labelledby="nomeadas">
          <h2 id="nomeadas" class="mb-4 text-base font-semibold">Pessoas <span class="text-sm font-normal text-muted">{{ people.named().length }}</span></h2>
          <ul class="grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))]">
            @for (p of people.named(); track p.id) {
              <li><ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: p }" /></li>
            }
          </ul>
        </section>
      }

      @if (people.suggested().length) {
        <section aria-labelledby="sem-nome">
          <h2 id="sem-nome" class="text-base font-semibold">Sem nome <span class="text-sm font-normal text-muted">{{ people.suggested().length }}</span></h2>
          <p class="mb-4 mt-1 text-xs text-muted">Grupos de fotos da mesma pessoa. Dê um nome para encontrá-la na busca; se dois grupos forem a mesma pessoa, dê o mesmo nome ou use "Juntar pessoas".</p>
          <ul class="grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))]">
            @for (p of people.suggested(); track p.id) {
              <li><ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: p }" /></li>
            }
          </ul>
        </section>
      }

      @if (people.hidden().length) {
        <section aria-labelledby="ocultas">
          <button id="ocultas" type="button" class="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink" (click)="showHidden.set(!showHidden())">
            <i [class]="showHidden() ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>Ocultas ({{ people.hidden().length }})
          </button>
          @if (showHidden()) {
            <ul class="mt-4 grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))]">
              @for (p of people.hidden(); track p.id) {
                <li class="opacity-70"><ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: p }" /></li>
              }
            </ul>
          }
        </section>
      }
    </div>

    <datalist id="people-names">
      @for (n of people.names(); track n.id) {
        <option [value]="n.name"></option>
      }
    </datalist>

    <ng-template #card let-p>
      <div class="flex flex-col items-center text-center">
        @if (picking() && !p.hidden) {
          <button
            type="button"
            class="relative block size-28 overflow-hidden rounded-full bg-panel-2 ring-offset-2 ring-offset-canvas transition"
            [class]="picked().has(p.id) ? 'ring-4 ring-primary' : 'hover:ring-2 hover:ring-line'"
            [attr.aria-pressed]="picked().has(p.id)"
            [attr.aria-label]="'Escolher ' + label(p)"
            (click)="togglePick(p)"
          >
            <ng-container [ngTemplateOutlet]="avatar" [ngTemplateOutletContext]="{ $implicit: p }" />
            @if (picked().has(p.id)) {
              <span class="absolute inset-0 flex items-center justify-center bg-primary/30"><i class="pi pi-check text-2xl text-white"></i></span>
            }
          </button>
        } @else {
          <a [routerLink]="['/people', p.id]" class="block size-28 overflow-hidden rounded-full bg-panel-2 transition hover:ring-2 hover:ring-primary" [attr.aria-label]="'Abrir ' + label(p)">
            <ng-container [ngTemplateOutlet]="avatar" [ngTemplateOutletContext]="{ $implicit: p }" />
          </a>
        }
        @if (editing() === p.id) {
          <form class="mt-2 flex w-full items-center gap-1" (ngSubmit)="saveName(p)">
            <input
              name="name"
              list="people-names"
              class="w-full min-w-0 rounded-md border border-line bg-transparent px-2 py-1 text-sm outline-none focus:border-primary"
              placeholder="Nome"
              aria-label="Nome da pessoa"
              maxlength="80"
              autocomplete="off"
              [(ngModel)]="draft"
              [ngModelOptions]="{ standalone: true }"
              (keydown.escape)="editing.set(null)"
            />
            <button type="submit" class="shrink-0 text-primary" aria-label="Salvar nome"><i class="pi pi-check"></i></button>
          </form>
        } @else if (p.name) {
          <a [routerLink]="['/people', p.id]" class="mt-2 max-w-full truncate text-sm font-medium hover:underline">{{ p.name }}</a>
        } @else {
          <button type="button" class="mt-2 text-sm text-primary hover:underline" (click)="startName(p)">Adicionar nome</button>
        }
        <span class="text-xs text-muted">{{ fmt(p.photoCount) }} {{ p.photoCount === 1 ? 'foto' : 'fotos' }}</span>
      </div>
    </ng-template>

    <ng-template #avatar let-p>
      @if (p.coverFaceId) {
        <img [src]="face(p.coverFaceId)" alt="" loading="lazy" class="size-full object-cover" (error)="placeholder($event)" />
      } @else {
        <span class="flex size-full items-center justify-center"><i class="pi pi-user text-3xl text-muted"></i></span>
      }
    </ng-template>
  `,
})
export class PeoplePage {
  protected readonly people = inject(PeopleStore);
  protected readonly ai = inject(AiStore);
  private readonly jobs = inject(JobStore);

  protected readonly showHidden = signal(false);
  protected readonly editing = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly picking = signal(false);
  protected readonly picked = signal<ReadonlySet<string>>(new Set());

  protected readonly visible = computed(() => [...this.people.named(), ...this.people.suggested()]);
  private readonly scanning = computed(() => (this.jobs.progress()?.facesPending ?? 0) > 0);

  protected readonly subtitle = computed(() => {
    const named = this.people.named().length;
    const suggested = this.people.suggested().length;
    if (!named && !suggested) return 'Rostos encontrados nas fotos, agrupados por pessoa.';
    const parts = [];
    if (named) parts.push(`${formatCount(named)} ${named === 1 ? 'pessoa' : 'pessoas'}`);
    if (suggested) parts.push(`${formatCount(suggested)} sem nome`);
    return parts.join(' · ');
  });

  protected readonly emptyText = computed(() =>
    this.scanning() || !this.ai.facesReady()
      ? 'Procurando rostos nas fotos, em segundo plano. Uma pessoa aparece aqui quando o PhotoVault a encontra em pelo menos 3 fotos.'
      : 'Nenhuma pessoa foi encontrada em 3 fotos ou mais. Rostos pequenos (menos de 40 pixels na prévia) ou de perfil não entram nos grupos.',
  );

  constructor() {
    void this.ai.refresh();
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

  protected startName(p: PersonSummary) {
    this.draft.set(p.name ?? '');
    this.editing.set(p.id);
  }

  protected async saveName(p: PersonSummary) {
    const name = this.draft().trim();
    if (!name) return;
    if (await this.people.rename(p.id, name)) this.editing.set(null);
  }

  protected togglePicking() {
    this.picking.update((v) => !v);
    this.picked.set(new Set());
  }

  protected togglePick(p: PersonSummary) {
    const next = new Set(this.picked());
    if (next.has(p.id)) next.delete(p.id);
    else next.add(p.id);
    this.picked.set(next);
  }

  /** The named one (the first, if several) absorbs the others. */
  protected async mergePicked() {
    const chosen = this.visible().filter((p) => this.picked().has(p.id));
    const target = chosen.find((p) => p.name) ?? chosen[0];
    if (!target) return;
    const sources = chosen.filter((p) => p.id !== target.id).map((p) => p.id);
    if (await this.people.merge(target.id, sources)) {
      this.picking.set(false);
      this.picked.set(new Set());
    }
  }
}
