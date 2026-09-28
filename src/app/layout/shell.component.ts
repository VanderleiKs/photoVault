import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SelectionStore } from '../core/stores/selection.store';
import { UiStore } from '../core/stores/ui.store';
import { BottomNavComponent } from './bottom-nav.component';
import { InfoPanelComponent } from './info-panel.component';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

/** Desktop shell (PRD §23.1): sidebar · topbar · content · info panel. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    InfoPanelComponent,
    BottomNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full bg-canvas text-ink', '(window:keydown.escape)': 'onEscape($event)' },
  template: `
    <app-sidebar class="hidden md:flex" />
    <div class="flex min-w-0 flex-1 flex-col">
      <app-topbar />
      <div class="flex min-h-0 flex-1">
        <main id="main" class="min-w-0 flex-1 overflow-y-auto">
          <router-outlet />
        </main>
        @if (showInfo()) {
          <app-info-panel class="hidden lg:flex" />
        }
      </div>
      <app-bottom-nav class="md:hidden" />
    </div>
  `,
})
export class ShellComponent {
  private readonly ui = inject(UiStore);
  private readonly selection = inject(SelectionStore);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** Pages that show media and therefore the "Informações" panel. */
  private readonly mediaPage = computed(() => /^\/(home|photos|timeline|favorites|albums\/|organize\/)/.test(this.url()));

  protected readonly showInfo = computed(
    () => this.mediaPage() && this.ui.infoPanelOpen() && !!this.selection.focused(),
  );

  /** Esc leaves selection mode (dialogs and inputs handle their own Esc). */
  protected onEscape(event: Event) {
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, .p-dialog, .p-select-overlay')) return;
    if (this.selection.active()) this.selection.clear();
  }
}
