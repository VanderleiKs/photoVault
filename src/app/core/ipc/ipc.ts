import { convertFileSrc, isTauri } from '@tauri-apps/api/core';
import type { ApiError, MediaItem, Style } from './bindings';

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

/** 160px JPEG of a detected face (people, phase 7b). */
export function faceUrl(faceId: string): string {
  return isTauri() ? convertFileSrc(`face/${faceId}`, 'pv') : PLACEHOLDER_URL;
}

/** 256px thumbnail of the improved photo ("Melhorar fotos"); `version` = `editVersion`. */
export function editThumbnailUrl(mediaId: string, version: number): string {
  return isTauri() ? convertFileSrc(`edit-thumb/${mediaId}?v=${version}`, 'pv') : PLACEHOLDER_URL;
}

/** 1024px WebP of the improved photo. */
export function editPreviewUrl(mediaId: string, version: number): string {
  return isTauri() ? convertFileSrc(`edit-preview/${mediaId}?v=${version}`, 'pv') : PLACEHOLDER_URL;
}

/** The tile's thumbnail: the improved look once rendered, else the original. */
export function itemThumbnailUrl(item: MediaItem): string {
  return item.editVersion > 0 ? editThumbnailUrl(item.id, item.editVersion) : thumbnailUrl(item.id, item.thumbVersion);
}

export interface LivePreview {
  /** Long edge, px (≤ 1600). */
  edge: number;
  /** The original instead. */
  before?: boolean;
  /** Draft version (busts the cache: the preview is never stored). */
  version?: number;
  /** Try this automatic improvement instead of the saved/draft recipe. */
  style?: Style;
  intensity?: number;
}

/** Live preview rendered by the backend (JPEG): draft, saved edit or a style to try. */
export function livePreviewUrl(mediaId: string, p: LivePreview): string {
  if (!isTauri()) return PLACEHOLDER_URL;
  const q = [`e=${Math.round(p.edge)}`, `v=${p.version ?? 0}`];
  if (p.before) q.push('before=1');
  if (p.intensity !== undefined) q.push(`i=${p.intensity.toFixed(2)}`, `s=${p.style ?? 'natural'}`);
  return convertFileSrc(`edit/${mediaId}?${q.join('&')}`, 'pv');
}

/** `(error)` handler for thumbnails: swap in the placeholder once. */
export function usePlaceholder(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (!img.src.endsWith(PLACEHOLDER_URL)) {
    img.src = PLACEHOLDER_URL;
  }
}
