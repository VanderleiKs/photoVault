import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Mobile/narrow navigation (PRD §23.6). */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex shrink-0 border-t border-line bg-panel' },
  template: `
    @for (item of items; track item.route) {
      <a
        [routerLink]="item.route"
        routerLinkActive="!text-primary"
        class="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted"
      >
        <i [class]="item.icon" class="text-lg"></i>{{ item.label }}
      </a>
    }
  `,
})
export class BottomNavComponent {
  protected readonly items = [
    { label: 'Início', icon: 'pi pi-home', route: '/home' },
    { label: 'Fotos', icon: 'pi pi-images', route: '/photos' },
    { label: 'Organizar', icon: 'pi pi-th-large', route: '/organize/duplicates' },
    { label: 'Álbuns', icon: 'pi pi-book', route: '/albums' },
    { label: 'Mais', icon: 'pi pi-ellipsis-h', route: '/settings' },
  ];
}
