import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from '@openng/optimus-ui/tag';
import {
  describeDateSource,
  formatBytes,
  formatCamera,
  formatDate,
  formatDimensions,
  formatDuration,
  formatExposure,
  formatPlace,
} from '../core/format';
import type { MediaItem } from '../core/ipc/ipc';

interface Row {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}

/** Metadata block shared by the info panel and the viewer. */
@Component({
  selector: 'app-media-details',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h3 class="break-all text-base font-semibold" [class]="dark() ? 'text-white' : 'text-ink'">
      {{ item().filename }}
    </h3>
    <p class="mt-1 flex items-center gap-1.5 text-xs" [class]="mutedClass()">
      <i class="pi pi-calendar text-[11px]"></i>{{ date() }}
    </p>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <p-tag [value]="item().mediaType === 'image' ? 'Foto' : 'Vídeo'" severity="info" />
      <p-tag [value]="item().extension.toUpperCase()" severity="secondary" />
      @if (item().isFavorite) {
        <p-tag value="Favorita" severity="danger" icon="pi pi-heart-fill" />
      }
    </div>

    <h4 class="mb-2 mt-5 text-sm font-semibold" [class]="dark() ? 'text-white' : 'text-ink'">Metadados</h4>
    <dl class="space-y-2 text-[13px]">
      @for (row of rows(); track row.label) {
        <div class="flex gap-2.5" [title]="row.label">
          <i [class]="row.icon" class="mt-0.5 w-4 shrink-0 text-center text-xs" [class.text-muted]="!dark()" [class.text-slate-400]="dark()"></i>
          <dd class="min-w-0 break-words" [class]="dark() ? 'text-slate-200' : 'text-ink'">
            {{ row.value }}
            @if (row.hint) {
              <span class="block text-[11px]" [class]="mutedClass()">{{ row.hint }}</span>
            }
          </dd>
        </div>
      }
    </dl>
  `,
})
export class MediaDetailsComponent {
  readonly item = input.required<MediaItem>();
  /** Styling for the dark viewer. */
  readonly dark = input(false);

  protected readonly mutedClass = computed(() => (this.dark() ? 'text-slate-400' : 'text-muted'));
  protected readonly date = computed(() => formatDate(this.item().capturedAt, true));

  protected readonly rows = computed<Row[]>(() => {
    const m = this.item();
    const rows: Row[] = [
      {
        icon: 'pi pi-calendar',
        label: 'Data',
        value: formatDate(m.capturedAt, true),
        hint: describeDateSource(m.dateSource) ?? undefined,
      },
    ];
    const place = formatPlace(m.placeName, m.placeAdmin1, m.placeCountry);
    if (place) rows.push({ icon: 'pi pi-map-marker', label: 'Local', value: place });
    rows.push({ icon: 'pi pi-folder', label: 'Local no disco', value: m.relativePath });
    const camera = formatCamera(m.cameraMake, m.cameraModel);
    if (camera) rows.push({ icon: 'pi pi-camera', label: 'Câmera', value: camera, hint: m.lens ?? undefined });
    const exposure = formatExposure(m);
    if (exposure) rows.push({ icon: 'pi pi-sliders-h', label: 'Exposição', value: exposure });
    const dims = formatDimensions(m.width, m.height);
    if (dims) rows.push({ icon: 'pi pi-image', label: 'Dimensões', value: dims });
    const duration = formatDuration(m.durationMs);
    if (duration) rows.push({ icon: 'pi pi-video', label: 'Duração', value: duration });
    rows.push({
      icon: 'pi pi-file',
      label: 'Arquivo',
      value: `${formatBytes(m.fileSize)} · ${m.extension.toUpperCase()}`,
    });
    return rows;
  });
}
