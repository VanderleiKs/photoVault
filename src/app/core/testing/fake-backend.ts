import { Backend } from '../ipc/backend';
import type { ApiError } from '../ipc/ipc';

type Ok<T> = { status: 'ok'; data: T };
type Err = { status: 'error'; error: ApiError };

export const ok = <T>(data: T): Promise<Ok<T>> => Promise.resolve({ status: 'ok', data });
export const fail = (code: string, message = code): Promise<Err> =>
  Promise.resolve({ status: 'error', error: { code, message } });

/** `unwrap` refuses to run outside Tauri; tests pretend to be inside it. */
export function pretendTauri() {
  (globalThis as { isTauri?: boolean }).isTauri = true;
}

/** Backend whose commands are overridden per test; events are inert. */
export function fakeBackend(commands: Record<string, (...args: never[]) => unknown>) {
  const listen = () => Promise.resolve(() => {});
  return {
    provide: Backend,
    useValue: {
      commands: new Proxy(commands, {
        get: (target, name: string) =>
          target[name] ?? (() => fail('NOT_MOCKED', `command ${name} not mocked`)),
      }),
      events: {
        scanProgressEvent: { listen },
        scanCompleteEvent: { listen },
        scanErrorEvent: { listen },
      },
    },
  };
}
