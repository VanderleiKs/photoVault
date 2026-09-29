import { Injectable, inject } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Backend } from './ipc/backend';
import { mediaUrl, unwrap } from './ipc/ipc';
import { MediaBus } from './stores/media-bus';

/** Longest edge of the captured frame (the preview thumbnail size). */
const FRAME_SIZE = 1024;
/** Frame taken at 1 s (or 10 % of a shorter video): the first frame is often black. */
const FRAME_AT_S = 1;
const TIMEOUT_MS = 20_000;
const BATCH = 20;

/**
 * Video thumbnails without ffmpeg: each ingested video without one is played hidden,
 * a frame is drawn to a canvas and sent to the backend, which makes the thumbnails
 * as for photos. Videos the WebView can't play (codec) are marked and keep the icon.
 */
@Injectable({ providedIn: 'root' })
export class VideoFrameService {
  private readonly backend = inject(Backend);
  private readonly bus = inject(MediaBus);
  private running = false;
  private again = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    if (!isTauri()) return;
    // Newly ingested videos arrive through the bus without a thumbnail.
    this.bus.subscribe(({ items }) => {
      if (items.some((i) => i.mediaType === 'video' && i.thumbVersion === 0)) this.schedule();
    });
  }

  /** Captures what is pending from previous sessions. */
  init() {
    if (isTauri()) this.schedule();
  }

  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.run(), 1500);
  }

  private async run() {
    if (this.running) {
      this.again = true;
      return;
    }
    this.running = true;
    try {
      for (;;) {
        const ids = await unwrap(this.backend.commands.listPendingVideoFrames(BATCH));
        if (!ids.length) break;
        for (const id of ids) await this.capture(id);
      }
    } catch {
      // Backend unavailable: tried again on the next update.
    } finally {
      this.running = false;
      if (this.again) {
        this.again = false;
        this.schedule();
      }
    }
  }

  private async capture(id: string) {
    let frame: string;
    try {
      frame = await grabFrame(mediaUrl(id));
    } catch (e) {
      await unwrap(this.backend.commands.failVideoFrame(id, describe(e))).catch(() => {});
      return;
    }
    const item = await unwrap(this.backend.commands.saveVideoFrame(id, frame)).catch(() => null);
    if (item) this.bus.publish([item]);
    else await unwrap(this.backend.commands.failVideoFrame(id, 'Quadro inválido.')).catch(() => {});
  }
}

/** A JPEG data URL of a frame near the start of the video. */
export async function grabFrame(src: string): Promise<string> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  // The pv: protocol answers with CORS, so the canvas stays readable.
  video.crossOrigin = 'anonymous';
  try {
    const loaded = once(video, 'loadeddata');
    video.src = src;
    await loaded;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const at = Math.min(FRAME_AT_S, duration * 0.1);
    if (at > 0) {
      const seeked = once(video, 'seeked');
      video.currentTime = at;
      await seeked;
    }
    const { videoWidth: w, videoHeight: h } = video;
    if (!w || !h) throw new Error('Vídeo sem imagem.');
    const scale = Math.min(1, FRAME_SIZE / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível.');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}

function once(video: HTMLVideoElement, event: 'loadeddata' | 'seeked'): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error('O vídeo demorou demais para abrir.')), TIMEOUT_MS);
    const ok = () => done();
    const fail = () => done(new Error(mediaError(video.error)));
    function done(error?: Error) {
      clearTimeout(timer);
      video.removeEventListener(event, ok);
      video.removeEventListener('error', fail);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener(event, ok);
    video.addEventListener('error', fail);
  });
}

function mediaError(error: MediaError | null): string {
  switch (error?.code) {
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
    case MediaError.MEDIA_ERR_DECODE:
      return 'Formato de vídeo não suportado pelo sistema (codec).';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Não foi possível ler o vídeo.';
    default:
      return error?.message || 'Não foi possível abrir o vídeo.';
  }
}

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
