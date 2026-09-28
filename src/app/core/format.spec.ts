import { formatBytes, formatCount, formatDimensions, formatDuration } from './format';

describe('format', () => {
  it('formats counts with pt-BR grouping', () => {
    expect(formatCount(48293)).toBe('48.293');
  });

  it('formats bytes in binary units', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(3.2 * 1024 * 1024)).toBe('3,2 MB');
    expect(formatBytes(512 * 1024 ** 3)).toBe('512 GB');
  });

  it('shows megapixels only when meaningful', () => {
    expect(formatDimensions(4032, 3024)).toBe('4032 × 3024 (12,2 MP)');
    expect(formatDimensions(96, 96)).toBe('96 × 96');
    expect(formatDimensions(null, 10)).toBeNull();
  });

  it('formats durations', () => {
    expect(formatDuration(24_000)).toBe('0:24');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
    expect(formatDuration(null)).toBeNull();
  });
});
