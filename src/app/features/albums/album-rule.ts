import { MONTH_NAMES } from '../../core/format';
import type { MediaFilter } from '../../core/ipc/ipc';

/** Human-readable parts of a smart album rule ("Favoritas", "2025", "Julho"…). */
export function describeRule(rule: MediaFilter | null | undefined): string[] {
  if (!rule) return [];
  const parts: string[] = [];
  if (rule.text) parts.push(`"${rule.text}"`);
  if (rule.mediaType) parts.push(rule.mediaType === 'image' ? 'Só fotos' : 'Só vídeos');
  if (rule.favorite) parts.push('Favoritas');
  if (rule.year) parts.push(String(rule.year));
  if (rule.month) parts.push(MONTH_NAMES[rule.month - 1]);
  if (rule.day) parts.push(`dia ${rule.day}`);
  if (rule.dateFrom || rule.dateTo) parts.push(`${rule.dateFrom ?? '…'} a ${rule.dateTo ?? '…'}`);
  if (rule.placeId) parts.push('Local escolhido');
  if (rule.camera) parts.push(rule.camera);
  return parts;
}
