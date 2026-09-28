import { convertFileSrc, isTauri } from '@tauri-apps/api/core';
import type { ApiError } from './bindings';

export { commands, events } from './bindings';
export type * from './bindings';

/** Error thrown by `unwrap` when a command fails. `code` is stable (see core `Error::code`). */
export class IpcError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'IpcError';
  }
}

type CommandResult<T> = { status: 'ok'; data: T } | { status: 'error'; error: ApiError };

/** Turn a tauri-specta `Result` into a value, throwing `IpcError` on failure. */
export async function unwrap<T>(result: Promise<CommandResult<T>>): Promise<T> {
  if (!isTauri()) {
    throw new IpcError('NO_BACKEND', 'O backend do PhotoVault não está disponível (modo navegador).');
  }
  let r: CommandResult<T>;
  try {
    r = await result;
  } catch (e) {
    throw new IpcError('INTERNAL', e instanceof Error ? e.message : String(e));
  }
  if (r.status === 'error') {
    throw new IpcError(r.error.code, r.error.message);
  }
  return r.data;
}

/** Human-readable message for any thrown value. */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export const PLACEHOLDER_URL = 'assets/placeholder.svg';

/**
 * 256px thumbnail served by the `pv://` protocol. `version` (`MediaItem.thumbVersion`)
 * changes when the thumbnail is regenerated, so the WebView cache is never stale.
 */
export function thumbnailUrl(mediaId: string, version = 0): string {
  return isTauri() ? convertFileSrc(`thumb/${mediaId}?v=${version}`, 'pv') : PLACEHOLDER_URL;
}

/** 1024px WebP: viewer fallback for formats the WebView can't decode (HEIC, TIFF). */
export function previewUrl(mediaId: string, version = 0): string {
  return isTauri() ? convertFileSrc(`preview/${mediaId}?v=${version}`, 'pv') : PLACEHOLDER_URL;
}

/** Original file (image or video, with Range support) served by `pv://`. */
export function mediaUrl(mediaId: string): string {
  return isTauri() ? convertFileSrc(`media/${mediaId}`, 'pv') : PLACEHOLDER_URL;
}

/** `(error)` handler for thumbnails: swap in the placeholder once. */
export function usePlaceholder(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (!img.src.endsWith(PLACEHOLDER_URL)) {
    img.src = PLACEHOLDER_URL;
  }
}
