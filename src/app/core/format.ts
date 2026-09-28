const numberFormat = new Intl.NumberFormat('pt-BR');

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** 48293 → "48.293" */
export function formatCount(n: number): string {
  return numberFormat.format(n);
}

/** Bytes → "3,2 MB" (base 1024, pt-BR decimals). */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })} ${units[unit]}`;
}

/** ISO date → "12/07/2025" (or "12/07/2025 14:32" with `time`). */
export function formatDate(iso: string | null | undefined, time = false): string {
  if (!iso) return 'Sem data';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Width×height → "4032 × 3024 (12,2 MP)". */
export function formatDimensions(width: number | null, height: number | null): string | null {
  if (!width || !height) return null;
  const mp = (width * height) / 1_000_000;
  const size = `${width} × ${height}`;
  return mp < 0.1 ? size : `${size} (${mp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MP)`;
}

/** Milliseconds → "0:24" / "1:02:03". */
export function formatDuration(ms: number | null): string | null {
  if (ms == null) return null;
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

const DATE_SOURCES: Record<string, string> = {
  exif_original: 'EXIF (original)',
  exif_datetime: 'EXIF',
  file_meta: 'Metadados do arquivo',
  filename: 'Nome do arquivo',
  mtime: 'Data de modificação do arquivo',
};

export function describeDateSource(source: string | null): string | null {
  return source ? (DATE_SOURCES[source] ?? source) : null;
}

const countryNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

/** "Canela", "RS", "BR" → "Canela, RS · Brasil". */
export function formatPlace(
  name: string | null,
  admin1: string | null,
  country: string | null,
): string | null {
  if (!name) return null;
  const city = admin1 ? `${name}, ${admin1}` : name;
  if (!country) return city;
  let countryName = country;
  try {
    countryName = countryNames.of(country) ?? country;
  } catch {
    // Unknown code: show it as is.
  }
  return `${city} · ${countryName}`;
}

/** "Apple" + "iPhone 15 Pro" → "Apple iPhone 15 Pro"; avoids "Canon Canon EOS R6". */
export function formatCamera(make: string | null, model: string | null): string | null {
  if (!model) return make;
  if (!make || model.toLowerCase().startsWith(make.toLowerCase())) return model;
  return `${make} ${model}`;
}

const decimal = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** "f/1,8 · 1/1200 s · ISO 32 · 24 mm" (missing parts are skipped). */
export function formatExposure(m: {
  aperture: number | null;
  shutter: string | null;
  iso: number | null;
  focalLength: number | null;
}): string | null {
  const parts = [
    m.aperture ? `f/${decimal(m.aperture)}` : null,
    m.shutter ? `${m.shutter} s` : null,
    m.iso ? `ISO ${m.iso}` : null,
    m.focalLength ? `${decimal(m.focalLength)} mm` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** Seconds → "menos de 1 min" / "~12 min" / "~2 h 5 min". */
export function formatEta(seconds: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return 'menos de 1 min';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h} h ${m} min` : `~${h} h`;
}
