import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, type MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MenuModule } from '@openng/optimus-ui/menu';
import { TagModule } from '@openng/optimus-ui/tag';
import { formatBytes, formatCount, formatDate } from '../../core/format';
import { Backend } from '../../core/ipc/backend';
import { unwrap, type Library, type LibraryStats } from '../../core/ipc/ipc';
import { NotifyService } from '../../core/notify.service';
import { LibraryStore } from '../../core/stores/library.store';
import { ScanStore } from '../../core/stores/scan.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { LibraryFormComponent } from '../../shared/library-form.component';

@Component({
  selector: 'app-libraries-page',
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MenuModule,
    TagModule,
    EmptyStateComponent,
    LibraryFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="flex items-center gap-4 border-b border-line px-6 py-4">
      <div class="flex-1">
        <h1 class="text-xl font-semibold">Bibliotecas</h1>
        <p class="text-sm text-muted">Pastas que o PhotoVault organiza. Remover uma biblioteca nunca apaga fotos do disco.</p>
      </div>
      <p-button label="Adicionar biblioteca" icon="pi pi-plus" (onClick)="adding.set(true)" />
    </header>

    <section class="grid gap-4 p-6 xl:grid-cols-2">
      @for (lib of store.libraries(); track lib.id) {
        <article class="flex flex-col gap-4 rounded-card border border-line bg-panel p-5" [class.ring-2]="lib.id === store.activeId()" [class.ring-primary/40]="lib.id === store.activeId()">
          <div class="flex items-start gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <i class="pi pi-folder"></i>
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-semibold">{{ lib.name }}</h2>
              <p class="truncate text-xs text-muted" [title]="lib.rootPath">{{ lib.rootPath }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                @if (lib.id === store.activeId()) {
                  <p-tag value="Ativa" icon="pi pi-check" />
                }
                @if (scan.isScanning(lib.id)) {
                  <p-tag value="Escaneando" severity="info" icon="pi pi-spin pi-spinner" />
                } @else if (lib.connected) {
                  <p-tag value="Conectada" severity="success" />
                } @else {
                  <p-tag value="Desconectada" severity="warn" icon="pi pi-exclamation-triangle" />
                }
              </div>
            </div>
            <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Mais ações" (onClick)="openMenu($event, lib, menu)" />
          </div>

          <dl class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt class="text-xs text-muted">Fotos</dt>
              <dd class="font-medium">{{ count(stats()[lib.id]?.photos) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Vídeos</dt>
              <dd class="font-medium">{{ count(stats()[lib.id]?.videos) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Tamanho</dt>
              <dd class="font-medium">{{ bytes(stats()[lib.id]?.totalBytes) }}</dd>
            </div>
          </dl>

          <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span class="flex-1 text-xs text-muted">
              {{ lib.lastScanAt ? 'Último scan: ' + date(lib.lastScanAt) : 'Nunca escaneada' }}
            </span>
            @if (!lib.connected) {
              <p-button label="Relocalizar" icon="pi pi-folder-open" size="small" severity="warn" [outlined]="true" (onClick)="relocate(lib)" />
            } @else if (scan.isScanning(lib.id)) {
              <p-button label="Cancelar" icon="pi pi-times" size="small" severity="danger" [outlined]="true" (onClick)="scan.cancel()" />
            } @else {
              <p-button label="Escanear" icon="pi pi-refresh" size="small" [outlined]="true" [disabled]="!!scan.scanningId()" (onClick)="scan.start(lib.id)" />
            }
            @if (lib.id !== store.activeId()) {
              <p-button label="Abrir" icon="pi pi-images" size="small" (onClick)="openLibrary(lib)" />
            }
          </div>
        </article>
      } @empty {
        <app-empty-state class="xl:col-span-2" icon="pi pi-database" title="Nenhuma biblioteca" text="Adicione a pasta onde estão suas fotos para começar.">
          <p-button label="Adicionar biblioteca" icon="pi pi-plus" (onClick)="adding.set(true)" />
        </app-empty-state>
      }
    </section>

    <p-menu #menu [model]="menuItems()" [popup]="true" appendTo="body" />

    <p-dialog header="Adicionar biblioteca" [modal]="true" [(visible)]="adding" [style]="{ width: '32rem' }" [draggable]="false">
      <app-library-form (created)="onCreated($event)" />
    </p-dialog>

    <p-dialog header="Renomear biblioteca" [modal]="true" [(visible)]="renaming" [style]="{ width: '26rem' }" [draggable]="false">
      <form class="flex flex-col gap-4" (ngSubmit)="saveName()">
        <input pInputText name="name" [(ngModel)]="newName" aria-label="Novo nome" />
        <div class="flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="renaming.set(false)" />
          <p-button type="submit" label="Salvar" [disabled]="!newName().trim()" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class LibrariesPage {
  protected readonly store = inject(LibraryStore);
  protected readonly scan = inject(ScanStore);
  private readonly backend = inject(Backend);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly stats = signal<Record<string, LibraryStats>>({});
  protected readonly adding = signal(false);
  protected readonly renaming = signal(false);
  protected readonly newName = signal('');
  protected readonly menuItems = signal<MenuItem[]>([]);
  private renameTarget: Library | null = null;

  constructor() {
    // Refresh connection status (drives may have been plugged/unplugged).
    void this.store.refresh().catch((e) => this.notify.error('Não foi possível carregar as bibliotecas', e));
    // "Importar" in the topbar lands here with ?add=1.
    if (this.route.snapshot.queryParamMap.has('add')) {
      this.adding.set(true);
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    effect(() => {
      const libraries = this.store.libraries();
      this.scan.lastSummary();
      untracked(() => void this.loadStats(libraries));
    });
  }

  private async loadStats(libraries: Library[]) {
    const entries = await Promise.all(
      libraries.map(async (lib) => {
        const stats = await unwrap(this.backend.commands.getLibraryStats(lib.id)).catch(() => null);
        return [lib.id, stats] as const;
      }),
    );
    this.stats.set(
      Object.fromEntries(entries.filter((e): e is [string, LibraryStats] => e[1] !== null)),
    );
  }

  protected count(n: number | undefined) {
    return n === undefined ? '—' : formatCount(n);
  }

  protected bytes(n: number | undefined) {
    return n === undefined ? '—' : formatBytes(n);
  }

  protected date(iso: string) {
    return formatDate(iso, true);
  }

  protected openMenu(event: Event, lib: Library, menu: { toggle(e: Event): void }) {
    this.menuItems.set([
      { label: 'Tornar ativa', icon: 'pi pi-check', disabled: lib.id === this.store.activeId(), command: () => void this.store.setActive(lib.id) },
      { label: 'Renomear', icon: 'pi pi-pencil', command: () => this.startRename(lib) },
      { label: 'Relocalizar pasta…', icon: 'pi pi-folder-open', command: () => void this.relocate(lib) },
      { separator: true },
      { label: 'Remover do catálogo', icon: 'pi pi-trash', styleClass: 'text-red-500', command: () => this.remove(lib) },
    ]);
    menu.toggle(event);
  }

  protected async openLibrary(lib: Library) {
    await this.store.setActive(lib.id);
    void this.router.navigate(['/photos']);
  }

  protected onCreated(lib: Library) {
    this.adding.set(false);
    this.notify.success('Biblioteca adicionada', `Escaneando "${lib.name}"…`);
    void this.scan.start(lib.id);
    void this.router.navigate(['/photos']);
  }

  private startRename(lib: Library) {
    this.renameTarget = lib;
    this.newName.set(lib.name);
    this.renaming.set(true);
  }

  protected async saveName() {
    if (!this.renameTarget) return;
    try {
      await this.store.rename(this.renameTarget.id, this.newName());
      this.renaming.set(false);
    } catch (e) {
      this.notify.error('Não foi possível renomear', e);
    }
  }

  protected async relocate(lib: Library) {
    try {
      const path = await unwrap(this.backend.commands.pickFolder());
      if (!path) return;
      await this.store.relocate(lib.id, path);
      this.notify.success('Biblioteca relocalizada', path);
    } catch (e) {
      this.notify.error('Não foi possível relocalizar', e);
    }
  }

  private remove(lib: Library) {
    this.confirm.confirm({
      header: 'Remover biblioteca',
      message: `Remover "${lib.name}" do catálogo? As fotos no disco NÃO serão apagadas; apenas o índice e as miniaturas.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: async () => {
        try {
          await this.store.remove(lib.id);
          this.notify.success('Biblioteca removida do catálogo');
        } catch (e) {
          this.notify.error('Não foi possível remover', e);
        }
      },
    });
  }
}
