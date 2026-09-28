import type { GroupKind, QualityFlag, QualityLevel } from './ipc/ipc';

export const QUALITY_LABEL: Record<QualityLevel, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const FLAG_LABEL: Record<QualityFlag, string> = {
  blurry: 'Borrada',
  dark: 'Escura',
  overexposed: 'Estourada',
  low_res: 'Baixa resolução',
  empty: 'Sem informação',
};

export const GROUP_LABEL: Record<GroupKind, { one: string; icon: string }> = {
  exact_duplicate: { one: 'Duplicata exata', icon: 'pi pi-clone' },
  visual_duplicate: { one: 'Duplicata visual', icon: 'pi pi-images' },
  similar: { one: 'Fotos semelhantes', icon: 'pi pi-th-large' },
  sequence: { one: 'Sequência', icon: 'pi pi-forward' },
};

/** Automatic labels as chips. */
export function labelText(dimension: string, value: string): string {
  if (dimension === 'tag') return value;
  switch (value) {
    case 'screenshot':
      return 'Screenshot';
    case 'whatsapp':
      return 'WhatsApp';
    case 'document':
      return 'Documento';
    case 'accidental':
      return 'Possível acidental';
    default:
      return value;
  }
}
