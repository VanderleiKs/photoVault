import type { GroupKind, QualityFlag, QualityLevel, ReviewReason, ReviewStatus } from './ipc/ipc';

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

/** Review reasons (PRD §15): chip text, icon and a short explanation. */
export const REASON_LABEL: Record<ReviewReason, { label: string; icon: string; hint: string }> = {
  EXACT_DUPLICATE: { label: 'Cópia exata', icon: 'pi pi-clone', hint: 'Mesmo conteúdo de outra foto, que foi mantida como a melhor candidata.' },
  VISUAL_DUPLICATE: { label: 'Duplicata visual', icon: 'pi pi-images', hint: 'A mesma foto em outra versão (reduzida, recomprimida); a melhor versão fica.' },
  SIMILAR_SEQUENCE: { label: 'Rajada', icon: 'pi pi-forward', hint: 'Faz parte de uma sequência em rajada; a melhor foto da sequência fica.' },
  BLURRY: { label: 'Borrada', icon: 'pi pi-eye-slash', hint: 'Pouca nitidez nas áreas com detalhe.' },
  DARK: { label: 'Escura', icon: 'pi pi-moon', hint: 'Subexposta, sem altas luzes.' },
  OVEREXPOSED: { label: 'Estourada', icon: 'pi pi-sun', hint: 'Grande parte da imagem sem detalhe por excesso de luz.' },
  LOW_RESOLUTION: { label: 'Baixa resolução', icon: 'pi pi-arrows-alt', hint: 'Menos megapixels que o mínimo configurado.' },
  SCREENSHOT: { label: 'Screenshot', icon: 'pi pi-mobile', hint: 'Captura de tela.' },
  MOMENTARY: { label: 'Documento', icon: 'pi pi-file', hint: 'Foto de documento, recibo ou tela: um registro momentâneo.' },
  ACCIDENTAL: { label: 'Acidental', icon: 'pi pi-bolt', hint: 'Provavelmente tirada sem querer (quase preta ou tremida demais).' },
  LOW_INFORMATION: { label: 'Sem informação', icon: 'pi pi-stop', hint: 'Imagem quase lisa, sem conteúdo.' },
  EXAMPLE: { label: 'Parecida com exemplo', icon: 'pi pi-sparkles', hint: 'Parecida com uma foto que você deu como exemplo do que remover.' },
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pendente',
  kept: 'Mantida',
  ignored: 'Sugestão ignorada',
  trashed: 'Enviada para a lixeira',
};
