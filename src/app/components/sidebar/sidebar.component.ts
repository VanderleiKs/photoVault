import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Library } from '../../models/photo';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="d-flex flex-column h-100 sidebar">
      <!-- Logo -->
      <div class="d-flex align-items-center px-4 py-3 sidebar-header">
        <i class="pi pi-images me-2 sidebar-logo-icon"></i>
        <span class="fw-bold sidebar-logo-text">PhotoVault</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-grow-1 p-3">
        <a routerLink="/" class="nav-link">
          <i class="pi pi-home"></i>
          <span>Biblioteca</span>
        </a>

        <div class="nav-section-title">Navegação</div>

        <a [routerLink]="['/library', library()?.id]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
          <i class="pi pi-images"></i>
          <span>Todas</span>
        </a>

        <a [routerLink]="['/library', library()?.id, 'timeline']" routerLinkActive="active" class="nav-link">
          <i class="pi pi-calendar"></i>
          <span>Timeline</span>
        </a>

        <span class="nav-link disabled" title="Em breve">
          <i class="pi pi-map-marker"></i>
          <span>Viagens</span>
        </span>

        <div class="nav-section-title">Organizar</div>

        <a [routerLink]="['/library', library()?.id, 'duplicates']" routerLinkActive="active" class="nav-link">
          <i class="pi pi-copy"></i>
          <span>Duplicatas</span>
        </a>

        <span class="nav-link disabled" title="Em breve">
          <i class="pi pi-check-circle"></i>
          <span>Revisão</span>
        </span>
      </nav>

      <!-- Footer -->
      <div class="p-3 sidebar-footer">
        <div class="small">
          <div>PhotoVault v0.1.0</div>
          <div class="mt-1">Local-first · Privacy-first</div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 256px;
      background: var(--pv-surface);
      border-right: 1px solid var(--pv-border);
    }

    .sidebar-header {
      border-bottom: 1px solid var(--pv-border);
    }

    .sidebar-logo-icon {
      color: var(--pv-accent);
      font-size: 1.25rem;
    }

    .sidebar-logo-text {
      color: var(--pv-text);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.25rem;
      text-decoration: none;
      color: var(--pv-text-muted);
      transition: background-color 0.15s, color 0.15s;
    }

    .nav-link:hover {
      background: var(--pv-surface-alt);
      color: var(--pv-text);
    }

    .nav-link.disabled {
      opacity: 0.45;
      cursor: default;
      pointer-events: none;
    }

    .nav-link.active {
      background: var(--pv-surface-alt);
      color: var(--pv-text);
    }

    .nav-section-title {
      margin-top: 0.75rem;
      margin-bottom: 0.5rem;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--pv-text-muted);
      letter-spacing: 0.05em;
    }

    .sidebar-footer {
      border-top: 1px solid var(--pv-border);
      color: var(--pv-text-muted);
    }
  `],
})
export class SidebarComponent {
  library = input.required<Library | null>();
}
