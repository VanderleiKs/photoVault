import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TagModule } from '@openng/optimus-ui/tag';
import type { NavItem } from '../../layout/nav';
import { EmptyStateComponent } from '../../shared/empty-state.component';

/** Placeholder for menu entries delivered in later phases (no dead links). */
@Component({
  selector: 'app-coming-soon-page',
  imports: [TagModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="border-b border-line px-6 py-4">
      <h1 class="text-xl font-semibold">{{ item().label }}</h1>
    </header>
    <app-empty-state [icon]="item().icon" [title]="'Em breve: ' + item().label" [text]="item().description">
      <p-tag [value]="'Chega na Fase ' + item().phase + ' do plano'" severity="secondary" />
    </app-empty-state>
  `,
})
export class ComingSoonPage {
  /** From route `data` (bound by `withComponentInputBinding`). */
  readonly item = input.required<NavItem>();
}
