import { Injectable, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import { errorMessage } from './ipc/ipc';

/** Global toasts (rendered by `<p-toast>` in the shell). Never use `alert()`. */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail?: string) {
    this.messages.add({ severity: 'success', summary, detail, life: 4000 });
  }

  info(summary: string, detail?: string) {
    this.messages.add({ severity: 'info', summary, detail, life: 6000 });
  }

  error(summary: string, error?: unknown) {
    this.messages.add({
      severity: 'error',
      summary,
      detail: error === undefined ? undefined : errorMessage(error),
      life: 8000,
    });
  }
}
