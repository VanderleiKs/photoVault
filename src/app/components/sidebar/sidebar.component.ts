import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Library } from '../../models/photo';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="d-flex flex-column h-100" style="width: 256px; background: var(--pv-surface); border-right: 1px solid var(--pv-border);">
      <!-- Logo -->
      <div class="d-flex align-items-center px-4 py-3" style="border-bottom: 1px solid var(--pv-border);">
        <i class="pi pi-images me-2" style="color: var(--pv-accent); font-size: 1.25rem;"></i>
        <span class="fw-bold" style="color: var(--pv-text);">PhotoVault</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-grow-1 p-3">
        <a
          routerLink="/"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'home'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'home' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'home' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-home"></i>
          <span>Biblioteca</span>
        </a>

        <div class="mt-3 mb-2 px-3">
          <span class="small fw-semibold text-uppercase" style="color: var(--pv-text-muted); font-size: 0.7rem; letter-spacing: 0.05em;">Navegação</span>
        </div>

        <a
          [routerLink]="['/library', library()?.id]"
          routerLinkActive="active"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'all'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'all' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'all' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-images"></i>
          <span>Todas</span>
        </a>

        <a
          [routerLink]="['/library', library()?.id]"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'timeline'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'timeline' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'timeline' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-calendar"></i>
          <span>Timeline</span>
        </a>

        <a
          [routerLink]="['/library', library()?.id]"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'trips'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'trips' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'trips' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-map-marker"></i>
          <span>Viagens</span>
        </a>

        <div class="mt-3 mb-2 px-3">
          <span class="small fw-semibold text-uppercase" style="color: var(--pv-text-muted); font-size: 0.7rem; letter-spacing: 0.05em;">Organizar</span>
        </div>

        <a
          [routerLink]="['/library', library()?.id]"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'duplicates'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'duplicates' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'duplicates' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-copy"></i>
          <span>Duplicatas</span>
        </a>

        <a
          [routerLink]="['/library', library()?.id]"
          class="d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1 text-decoration-none"
          style="color: var(--pv-text-muted);"
          (mouseenter)="navHover = 'review'" (mouseleave)="navHover = ''"
          [style.background]="navHover === 'review' ? 'var(--pv-surface-alt)' : 'transparent'"
          [style.color]="navHover === 'review' ? 'var(--pv-text)' : 'var(--pv-text-muted)'"
        >
          <i class="pi pi-check-circle"></i>
          <span>Revisão</span>
        </a>
      </nav>

      <!-- Footer -->
      <div class="p-3" style="border-top: 1px solid var(--pv-border);">
        <div class="small" style="color: var(--pv-text-muted);">
          <div>PhotoVault v0.1.0</div>
          <div class="mt-1">Local-first · Privacy-first</div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  library = input.required<Library | null>();
  navHover = '';
}
