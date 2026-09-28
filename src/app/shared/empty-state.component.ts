import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center' },
  template: `
    <div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <i [class]="icon()" class="text-2xl"></i>
    </div>
    <h2 class="text-lg font-semibold text-ink">{{ title() }}</h2>
    @if (text()) {
      <p class="max-w-md text-sm text-muted">{{ text() }}</p>
    }
    <div class="mt-2 flex flex-wrap justify-center gap-2"><ng-content /></div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('pi pi-images');
  readonly title = input.required<string>();
  readonly text = input<string>();
}
