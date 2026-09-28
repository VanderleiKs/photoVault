const numberFormat = new Intl.NumberFormat('pt-BR');

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
