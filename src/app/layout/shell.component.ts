import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MediaStore } from '../core/stores/media.store';
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
    ToastModule,
    ConfirmDialogModule,
    SidebarComponent,
    TopbarComponent,
    InfoPanelComponent,
    BottomNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full bg-canvas text-ink' },
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
    <p-toast position="bottom-right" />
    <p-confirmdialog />
  `,
})
export class ShellComponent {
  private readonly ui = inject(UiStore);
  private readonly media = inject(MediaStore);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** Pages that show media and therefore the "Informações" panel. */
  private readonly mediaPage = computed(() => /^\/(photos|timeline)\b/.test(this.url()));

  protected readonly showInfo = computed(
    () => this.mediaPage() && this.ui.infoPanelOpen() && !!this.media.selected(),
  );
}
