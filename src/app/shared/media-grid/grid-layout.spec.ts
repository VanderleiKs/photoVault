import type { MediaItem } from '../../core/ipc/ipc';
import { GAP, columnsFor, dayLabel, layoutGrid, monthLabel, visibleRange } from './grid-layout';

const item = (id: string, capturedAt: string | null) => ({ id, capturedAt }) as MediaItem;

describe('grid layout', () => {
  it('fits as many columns as the target size allows', () => {
    expect(columnsFor(1000, 180)).toEqual({ columns: 5, tile: (1000 - 4 * GAP) / 5 });
    expect(columnsFor(100, 160).columns).toBe(1);
  });

  it('lays out plain rows with known heights', () => {
    const items = Array.from({ length: 11 }, (_, i) => item(`i${i}`, null));
    const layout = layoutGrid(items, 1000, 180);
    expect(layout.rows.map((r) => r.items.length)).toEqual([5, 5, 1]);
    const rowHeight = layout.tile + GAP;
    expect(layout.rows[2].top).toBe(2 * rowHeight);
    expect(layout.height).toBe(3 * rowHeight - GAP);
  });

  it('groups the timeline by month and day, undated last', () => {
    const items = [
      item('a', '2025-07-12T10:00:00'),
      item('b', '2025-07-12T09:00:00'),
      item('c', '2025-07-01T09:00:00'),
      item('d', '2025-06-30T23:00:00'),
      item('e', null),
    ];
    const layout = layoutGrid(items, 1000, 160, 'timeline', new Map([['2025-07', 40]]));
    expect(layout.rows.map((r) => [r.kind, r.label ?? r.items.map((m) => m.id).join(), r.count])).toEqual([
      ['month', 'Julho de 2025', 40],
      ['day', 'Sábado, 12 de julho', 2],
      ['tiles', 'a,b', undefined],
      ['day', 'Terça-feira, 1 de julho', 1],
      ['tiles', 'c', undefined],
      ['month', 'Junho de 2025', 1],
      ['day', 'Segunda-feira, 30 de junho', 1],
      ['tiles', 'd', undefined],
      ['month', 'Sem data', 1],
      ['tiles', 'e', undefined],
    ]);
    expect(layout.rows[5].anchor).toBe('2025-06');
  });

  it('finds visible rows by offset', () => {
    const items = Array.from({ length: 50 }, (_, i) => item(`i${i}`, null));
    const layout = layoutGrid(items, 1000, 180); // 10 rows
    const h = layout.tile + GAP;
    expect(visibleRange(layout.rows, 0, h - 1)).toEqual([0, 1]);
    expect(visibleRange(layout.rows, 2.5 * h, 4.2 * h)).toEqual([2, 5]);
    expect(visibleRange(layout.rows, 100 * h, 101 * h)).toEqual([10, 10]);
  });

  it('labels', () => {
    expect(monthLabel('')).toBe('Sem data');
    expect(monthLabel('2024-12')).toBe('Dezembro de 2024');
    expect(dayLabel('2025-07-12')).toBe('Sábado, 12 de julho');
  });

  it('omits the count of a day that may continue on the next page', () => {
    const items = [item('a', '2025-07-12T10:00:00'), item('b', '2025-07-11T10:00:00'), item('c', '2025-07-11T09:00:00')];
    const days = (partial: boolean) =>
      layoutGrid(items, 1000, 180, 'timeline', undefined, partial).rows.filter((r) => r.kind === 'day').map((r) => r.count);
    expect(days(false)).toEqual([1, 2]);
    expect(days(true)).toEqual([1, undefined]);
  });
});
