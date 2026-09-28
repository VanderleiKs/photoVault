import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MenuModule } from '@openng/optimus-ui/menu';
import { SelectModule } from '@openng/optimus-ui/select';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { AppStore } from '../core/stores/app.store';
import { BrowseStore } from '../core/stores/browse.store';
import { LibraryStore } from '../core/stores/library.store';
import { ScanStore } from '../core/stores/scan.store';
import { UiStore } from '../core/stores/ui.store';

@Component({
  selector: 'app-topbar',
  imports: [
    FormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MenuModule,
    SelectModule,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex h-16 shrink-0 items-center gap-3 border-b border-line bg-panel px-4',
    '(window:keydown)': 'onGlobalKey($event)',
  },
  template: `
    <p-button
      icon="pi pi-bars"
      [text]="true"
      severity="secondary"
      ariaLabel="Recolher menu"
      pTooltip="Recolher menu"
      tooltipPosition="bottom"
      styleClass="!hidden md:!inline-flex"
      (onClick)="ui.sidebarCollapsed.set(!ui.sidebarCollapsed())"
    />

    @if (libraries.libraries().length > 1) {
      <p-select
        [options]="libraries.libraries()"
        optionLabel="name"
        optionValue="id"
        [ngModel]="libraries.activeId()"
        (ngModelChange)="libraries.setActive($event)"
        ariaLabel="Biblioteca ativa"
        styleClass="w-48"
      />
    }

    <p-iconfield class="min-w-0 max-w-xl flex-1">
      <p-inputicon styleClass="pi pi-search" />
      <input
        #search
        pInputText
        type="search"
        class="w-full pr-16"
        placeholder="Buscar nomes, pastas, locais, álbuns, datas…"
        aria-label="Buscar (Ctrl+K)"
        [value]="query()"
        (input)="onSearch($any($event.target).value)"
        (keydown.enter)="commit()"
        (keydown.escape)="clearSearch(); search.blur()"
        [disabled]="!libraries.activeId()"
      />
      @if (!query()) {
        <kbd class="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-muted sm:block">Ctrl K</kbd>
      }
    </p-iconfield>

    @if (scanLabel(); as label) {
      <span class="ml-auto hidden items-center gap-2 whitespace-nowrap text-sm text-muted lg:flex" role="status">
        <i class="pi pi-spin pi-spinner text-primary"></i>{{ label }}
      </span>
    }

    <p-button label="Importar" icon="pi pi-plus" [outlined]="true" styleClass="whitespace-nowrap" [class.ml-auto]="!scanLabel()" (onClick)="importLibrary()" />

    <p-button
      [icon]="app.dark() ? 'pi pi-sun' : 'pi pi-moon'"
      [rounded]="true"
      [text]="true"
      severity="secondary"
      [ariaLabel]="app.dark() ? 'Usar tema claro' : 'Usar tema escuro'"
      [pTooltip]="app.dark() ? 'Tema claro' : 'Tema escuro'"
      tooltipPosition="bottom"
      (onClick)="toggleTheme()"
    />
    <p-button icon="pi pi-user" [rounded]="true" severity="secondary" ariaLabel="Menu" (onClick)="menu.toggle($event)" />
    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body" />
  `,
})
export class TopbarComponent {
  protected readonly app = inject(AppStore);
  protected readonly ui = inject(UiStore);
  protected readonly libraries = inject(LibraryStore);
  private readonly scan = inject(ScanStore);
  private readonly router = inject(Router);
  private readonly browse = inject(BrowseStore);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  /** What is typed; applied to the gallery after a short pause. */
  protected readonly query = signal('');
  private debounce: ReturnType<typeof setTimeout> | undefined;

  protected readonly scanLabel = computed(() => {
    if (!this.scan.scanningId()) return null;
    const p = this.scan.progress();
    return p?.phase === 'indexing' ? `Indexando ${p.processed}/${p.total}` : 'Procurando arquivos…';
  });

  protected readonly menuItems: MenuItem[] = [
    { label: 'Bibliotecas', icon: 'pi pi-database', routerLink: '/libraries' },
    { label: 'Configurações', icon: 'pi pi-cog', routerLink: '/settings' },
  ];

  protected onSearch(value: string) {
    this.query.set(value);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.commit(), 200);
  }

  /** Apply the search to "Todas as fotos" (opening it if needed). */
  protected commit() {
    clearTimeout(this.debounce);
    this.browse.text.set(this.query());
    if (this.query().trim() && !this.router.url.startsWith('/photos')) {
      void this.router.navigate(['/photos']);
    }
  }

  protected clearSearch() {
    this.query.set('');
    this.commit();
  }

  /** Ctrl+K / ⌘K focuses the search from anywhere in the shell. */
  protected onGlobalKey(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = this.searchInput()?.nativeElement;
      input?.focus();
      input?.select();
    }
  }

  /** Chip "Busca" removed elsewhere, or library switched: mirror it. */
  private readonly syncText = effect(() => {
    const text = this.browse.text();
    untracked(() => {
      if (text !== this.query().trim() && document.activeElement !== this.searchInput()?.nativeElement) {
        this.query.set(text);
      }
    });
  });

  protected importLibrary() {
    void this.router.navigate(['/libraries'], { queryParams: { add: 1 } });
  }

  protected toggleTheme() {
    void this.app.updateSettings({ theme: this.app.dark() ? 'light' : 'dark' });
  }
}
