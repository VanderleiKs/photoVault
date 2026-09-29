import { ChangeDetectionStrategy, Component, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';

export interface ConfirmOptions {
  header: string;
  message: string;
  /** Smaller text under the message (what happens to the files). */
  detail?: string;
  acceptLabel: string;
  icon?: string;
  danger?: boolean;
  /** The user must type this to confirm (large batches, PRD §25). */
  typed?: string;
}

/**
 * Confirmation before anything that touches files (R3). Promise-based, so actions can
 * chain confirmations (e.g. "excluir definitivamente" asks twice). Rendered once, in
 * `AppComponent`, so it also works over the viewer.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmAction {
  readonly current = signal<ConfirmOptions | null>(null);
  private resolve: ((ok: boolean) => void) | null = null;

  ask(options: ConfirmOptions): Promise<boolean> {
    this.resolve?.(false);
    this.current.set(options);
    return new Promise((resolve) => (this.resolve = resolve));
  }

  answer(ok: boolean) {
    const resolve = this.resolve;
    this.resolve = null;
    this.current.set(null);
    resolve?.(ok);
  }
}

@Component({
  selector: 'app-confirm-action',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="options()?.header ?? ''"
      [visible]="!!options()"
      (visibleChange)="!$event && confirm.answer(false)"
      [modal]="true"
      [draggable]="false"
      [closeOnEscape]="true"
      styleClass="w-[30rem] max-w-[95vw]"
    >
      @if (options(); as o) {
        <div class="flex gap-4">
          <i [class]="(o.icon ?? 'pi pi-exclamation-triangle') + ' mt-0.5 text-2xl ' + (o.danger ? 'text-rose-500' : 'text-amber-500')"></i>
          <div class="min-w-0 flex-1 space-y-2">
            <p class="text-sm">{{ o.message }}</p>
            @if (o.detail) {
              <p class="text-xs text-muted">{{ o.detail }}</p>
            }
            @if (o.typed) {
              <label class="block pt-2 text-xs text-muted" for="confirm-typed">Para confirmar, digite <strong class="text-ink">{{ o.typed }}</strong>:</label>
              <input pInputText id="confirm-typed" class="w-full" autocomplete="off" [(ngModel)]="typed" [ngModelOptions]="{ standalone: true }" (keydown.enter)="ready() && confirm.answer(true)" />
            }
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="confirm.answer(false)" />
          <p-button [label]="o.acceptLabel" [severity]="o.danger ? 'danger' : 'primary'" [disabled]="!ready()" (onClick)="confirm.answer(true)" />
        </div>
      }
    </p-dialog>
  `,
})
export class ConfirmActionComponent {
  protected readonly confirm = inject(ConfirmAction);
  protected readonly options = this.confirm.current;
  protected readonly typed = signal('');
  protected readonly ready = computed(() => {
    const o = this.options();
    return !o?.typed || this.typed().trim() === o.typed;
  });

  constructor() {
    // A new question starts with an empty field.
    effect(() => {
      this.options();
      untracked(() => this.typed.set(''));
    });
  }
}
