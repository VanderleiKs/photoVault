import { MONTH_NAMES } from '../../core/format';
import type { MediaItem } from '../../core/ipc/ipc';

export const GAP = 8;
export const MONTH_HEADER = 52;
export const DAY_HEADER = 34;

export type GroupBy = 'none' | 'timeline';

export interface GridRow {
  key: string;
  kind: 'tiles' | 'month' | 'day';
  top: number;
  height: number;
  items: MediaItem[];
  label?: string;
  /** Items in the group (month rows use the backend total when known). */
  count?: number;
  /** Month rows: "2025-07"; lets the timeline jump to a year/month. */
  anchor?: string;
}

export interface GridLayout {
  columns: number;
  tile: number;
  rows: GridRow[];
  height: number;
}

const dayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

/** "2025-07-12T14:32:01" → "2025-07-12" (local wall-clock; no time-zone shift). */
const dayKey = (item: MediaItem) => item.capturedAt?.slice(0, 10) ?? '';

export function monthLabel(key: string): string {
  if (!key) return 'Sem data';
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const text = dayFormat.format(new Date(y, m - 1, d));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Columns and tile edge for a width and a target tile size. */
export function columnsFor(width: number, target: number): { columns: number; tile: number } {
  const columns = Math.max(1, Math.floor((width + GAP) / (target + GAP)));
  return { columns, tile: Math.max(1, (width - GAP * (columns - 1)) / columns) };
}

/**
 * Rows of a gallery with known heights (so it can be virtualized). With `timeline`,
 * items (already in date order) get month and day headers.
 */
export function layoutGrid(
  items: readonly MediaItem[],
  width: number,
  target: number,
  groupBy: GroupBy = 'none',
  monthCounts?: ReadonlyMap<string, number>,
  /** More items follow (not loaded yet): the last day's count would be partial. */
  partial = false,
): GridLayout {
  const { columns, tile } = columnsFor(width, target);
  const rowHeight = tile + GAP;
  const rows: GridRow[] = [];
  let top = 0;

  const pushTiles = (group: readonly MediaItem[], keyPrefix: string) => {
    for (let i = 0; i < group.length; i += columns) {
      const slice = group.slice(i, i + columns);
      rows.push({ key: `${keyPrefix}:${slice[0].id}`, kind: 'tiles', top, height: rowHeight, items: slice });
      top += rowHeight;
    }
  };

  if (groupBy === 'none') {
    pushTiles(items, 't');
    return { columns, tile, rows, height: Math.max(0, top - GAP) };
  }

  let i = 0;
  while (i < items.length) {
    const month = dayKey(items[i]).slice(0, 7);
    let end = i;
    while (end < items.length && dayKey(items[end]).slice(0, 7) === month) end++;
    rows.push({
      key: `m:${month || 'none'}`,
      kind: 'month',
      top,
      height: MONTH_HEADER,
      items: [],
      label: monthLabel(month),
      count: monthCounts?.get(month) ?? end - i,
      anchor: month,
    });
    top += MONTH_HEADER;

    if (!month) {
      pushTiles(items.slice(i, end), 'none');
    } else {
      let d = i;
      while (d < end) {
        const day = dayKey(items[d]);
        let dayEnd = d;
        while (dayEnd < end && dayKey(items[dayEnd]) === day) dayEnd++;
        const last = partial && dayEnd === items.length;
        rows.push({ key: `d:${day}`, kind: 'day', top, height: DAY_HEADER, items: [], label: dayLabel(day), count: last ? undefined : dayEnd - d });
        top += DAY_HEADER;
        pushTiles(items.slice(d, dayEnd), day);
        d = dayEnd;
      }
    }
    i = end;
  }
  return { columns, tile, rows, height: Math.max(0, top - GAP) };
}

/** Index range of rows intersecting [from, to] (binary search on `top`). */
export function visibleRange(rows: readonly GridRow[], from: number, to: number): [number, number] {
  let lo = 0;
  let hi = rows.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].top + rows[mid].height < from) lo = mid + 1;
    else hi = mid;
  }
  let end = lo;
  while (end < rows.length && rows[end].top <= to) end++;
  return [lo, end];
}
