import { Injectable } from '@angular/core';
import { commands, events } from './bindings';

/** Injectable handle to the generated IPC bindings (swap for a fake in tests). */
@Injectable({ providedIn: 'root' })
export class Backend {
  readonly commands = commands;
  readonly events = events;
}
