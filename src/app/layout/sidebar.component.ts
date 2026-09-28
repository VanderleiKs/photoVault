import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { formatBytes, formatCount } from '../core/format';
import { LibraryStore } from '../core/stores/library.store';
import { OrganizeStore } from '../core/stores/organize.store';
import { UiStore } from '../core/stores/ui.store';
import { LIBRARY_NAV, MAIN_NAV, ORGANIZE_NAV, type NavItem } from './nav';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ProgressBarModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex shrink-0 flex-col bg-side text-side-ink transition-[width] duration-200',
    '[class.w-60]': '!collapsed()',
    '[class.w-[72px]]': 'collapsed()',
  },
  template: `
    <div class="flex h-16 items-center gap-2.5 px-5">
      <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
        <i class="pi pi-images text-sm"></i>
      </span>
      @if (!collapsed()) {
        <span class="text-[17px] font-semibold tracking-tight text-white">PhotoVault</span>
      }
    </div>

    <nav class="flex-1 overflow-y-auto px-3 pb-3" aria-label="Navegação principal">
      @for (section of sections; track section.title; let first = $first) {
        @if (!first) {
          @if (collapsed()) {
            <hr class="mx-2 my-3 border-side-line" />
          } @else {
            <p class="mb-1.5 mt-5 px-3 text-[11px] font-medium uppercase tracking-wider text-side-muted">{{ section.title }}</p>
          }
        }
        <ul class="space-y-0.5">
          @for (item of section.items; track item.route) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="!bg-side-active !text-white"
                class="flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-side-ink/85 transition-colors hover:bg-side-hover hover:text-white"
                [class.justify-center]="collapsed()"
                [class.opacity-55]="item.phase"
                [pTooltip]="tooltip(item)"
                tooltipPosition="right"
              >
                <i [class]="item.icon" class="w-4 text-center text-[15px]"></i>
                @if (!collapsed()) {
                  <span class="flex-1 truncate">{{ item.label }}</span>
                  @if (badge(item); as n) {
                    <span class="rounded-full bg-white/10 px-1.5 py-px text-[11px] tabular-nums text-side-ink" [attr.aria-label]="n + ' itens'">{{ count(n) }}</span>
                  }
                }
              </a>
            </li>
          }
        </ul>
      }
    </nav>

    @if (volume(); as v) {
      <div class="border-t border-side-line p-4" [title]="v.mountPoint">
        <div class="flex items-center gap-3">
          <i class="pi pi-server text-side-muted"></i>
          @if (!collapsed()) {
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] text-white">{{ v.label }}</p>
              <p-progressbar [value]="usedPercent()" [showValue]="false" styleClass="!mt-1.5 !h-1 !bg-white/10" />
              <p class="mt-1.5 text-[11px] text-side-muted">{{ free() }} livres de {{ total() }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SidebarComponent {
  private readonly ui = inject(UiStore);
  private readonly libraries = inject(LibraryStore);
  private readonly organize = inject(OrganizeStore);

  protected badge(item: NavItem): number {
    return this.organize.badges()[item.route] ?? 0;
  }

  protected count(n: number) {
    return n > 9999 ? '9999+' : formatCount(n);
  }

  protected readonly sections: { title: string; items: NavItem[] }[] = [
    { title: 'Principal', items: MAIN_NAV },
    { title: 'Organizar', items: ORGANIZE_NAV },
    { title: 'Biblioteca', items: LIBRARY_NAV },
  ];
  protected readonly collapsed = this.ui.sidebarCollapsed;
  protected readonly volume = this.libraries.volume;

  protected readonly usedPercent = computed(() => {
    const v = this.volume();
    return v && v.totalBytes > 0 ? Math.round(100 * (1 - v.availableBytes / v.totalBytes)) : 0;
  });
  protected tooltip(item: NavItem): string | undefined {
    if (item.phase) return `${item.label}: em breve (Fase ${item.phase})`;
    return this.collapsed() ? item.label : undefined;
  }

  protected readonly free = computed(() => formatBytes(this.volume()?.availableBytes ?? 0));
  protected readonly total = computed(() => formatBytes(this.volume()?.totalBytes ?? 0));
}
