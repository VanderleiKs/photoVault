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
        jobProgressEvent: { listen },
        mediaUpdatedEvent: { listen },
        analysisUpdatedEvent: { listen },
        peopleUpdatedEvent: { listen },
      },
    },
  };
}

/** A `MediaItem` with defaults (override what the test cares about). */
export function mediaItem(id: string, patch: Partial<import('../ipc/ipc').MediaItem> = {}): import('../ipc/ipc').MediaItem {
  return {
    id,
    libraryId: 'lib',
    relativePath: `${id}.jpg`,
    filename: `${id}.jpg`,
    extension: 'jpg',
    mediaType: 'image',
    fileSize: 1,
    width: null,
    height: null,
    durationMs: null,
    capturedAt: null,
    dateSource: null,
    cameraMake: null,
    cameraModel: null,
    lens: null,
    iso: null,
    aperture: null,
    shutter: null,
    focalLength: null,
    gpsLat: null,
    gpsLon: null,
    placeName: null,
    placeAdmin1: null,
    placeCountry: null,
    isFavorite: false,
    thumbVersion: 0,
    indexedAt: '',
    inTrash: false,
    reviewPriority: null,
    edited: false,
    editVersion: 0,
    ...patch,
  };
}
