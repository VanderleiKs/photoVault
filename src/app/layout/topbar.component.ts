import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
  host: { class: 'flex h-16 shrink-0 items-center gap-3 border-b border-line bg-panel px-4' },
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

    <p-iconfield class="min-w-0 max-w-xl flex-1" pTooltip="A busca chega na Fase 3" tooltipPosition="bottom">
      <p-inputicon styleClass="pi pi-search" />
      <input
        pInputText
        type="search"
        class="w-full"
        placeholder="Buscar fotos, pessoas, locais, álbuns…"
        aria-label="Buscar"
        disabled
      />
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

  protected readonly scanLabel = computed(() => {
    if (!this.scan.scanningId()) return null;
    const p = this.scan.progress();
    return p?.phase === 'indexing' ? `Indexando ${p.processed}/${p.total}` : 'Procurando arquivos…';
  });

  protected readonly menuItems: MenuItem[] = [
    { label: 'Bibliotecas', icon: 'pi pi-database', routerLink: '/libraries' },
    { label: 'Configurações', icon: 'pi pi-cog', routerLink: '/settings' },
  ];

  protected importLibrary() {
    void this.router.navigate(['/libraries'], { queryParams: { add: 1 } });
  }

  protected toggleTheme() {
    void this.app.updateSettings({ theme: this.app.dark() ? 'light' : 'dark' });
  }
}
