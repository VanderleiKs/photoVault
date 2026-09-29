import { formatBytes, formatCount, formatDimensions, formatDuration, formatCamera, formatExposure, formatPlace, formatEta, formatPeriod, formatDayShort } from './format';

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

  it('formats places with localized country names', () => {
    expect(formatPlace('Canela', 'RS', 'BR')).toBe('Canela, RS · Brasil');
    expect(formatPlace('Paris', 'Île-de-France', 'FR')).toBe('Paris, Île-de-France · França');
    expect(formatPlace(null, 'RS', 'BR')).toBeNull();
  });

  it('does not repeat the camera make', () => {
    expect(formatCamera('Apple', 'iPhone 15 Pro')).toBe('Apple iPhone 15 Pro');
    expect(formatCamera('Canon', 'Canon EOS R6')).toBe('Canon EOS R6');
    expect(formatCamera(null, null)).toBeNull();
  });

  it('formats exposure', () => {
    expect(formatExposure({ aperture: 1.8, shutter: '1/1200', iso: 32, focalLength: 24 })).toBe(
      'f/1,8 · 1/1200 s · ISO 32 · 24 mm',
    );
    expect(formatExposure({ aperture: null, shutter: null, iso: 100, focalLength: null })).toBe('ISO 100');
    expect(formatExposure({ aperture: null, shutter: null, iso: null, focalLength: null })).toBeNull();
  });

  it('formats remaining time', () => {
    expect(formatEta(30)).toBe('menos de 1 min');
    expect(formatEta(12 * 60)).toBe('~12 min');
    expect(formatEta(125 * 60)).toBe('~2 h 5 min');
    expect(formatEta(null)).toBeNull();
  });

  it('formats event periods compactly', () => {
    expect(formatPeriod('2025-07-12T09:00:00', '2025-07-12T20:00:00')).toBe('12 jul 2025');
    expect(formatPeriod('2025-07-10T09:00:00', '2025-07-12T20:00:00')).toBe('10 a 12 jul 2025');
    expect(formatPeriod('2025-06-28T09:00:00', '2025-07-03T20:00:00')).toBe('28 jun a 3 jul 2025');
    expect(formatPeriod('2024-12-28T09:00:00', '2025-01-02T20:00:00')).toBe('28 dez 2024 a 2 jan 2025');
    expect(formatDayShort('2025-07-11')).toBe('11 JUL');
  });
});
