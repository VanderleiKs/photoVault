/** Single source for the sidebar, bottom nav and "coming soon" pages. */
export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Plan phase that delivers it; absent = available now. */
  phase?: number;
  description?: string;
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Início', icon: 'pi pi-home', route: '/home' },
  { label: 'Todas as fotos', icon: 'pi pi-images', route: '/photos' },
  { label: 'Timeline', icon: 'pi pi-calendar', route: '/timeline' },
  { label: 'Álbuns', icon: 'pi pi-book', route: '/albums' },
  {
    label: 'Viagens',
    icon: 'pi pi-send',
    route: '/trips',
    phase: 6,
    description: 'Viagens e eventos sugeridos a partir de datas e localização. Você aceita, edita ou ignora.',
  },
  {
    label: 'Pessoas',
    icon: 'pi pi-user',
    route: '/people',
    phase: 7,
    description: 'Reconhecimento de rostos 100% local, sem enviar fotos para fora do computador.',
  },
  { label: 'Favoritos', icon: 'pi pi-heart', route: '/favorites' },
];

export const ORGANIZE_NAV: NavItem[] = [
  {
    label: 'Revisão',
    icon: 'pi pi-check-square',
    route: '/review',
    description: 'Todas as sugestões priorizadas: manter, favoritar, ignorar ou enviar para a lixeira.',
  },
  {
    label: 'Possíveis duplicatas',
    icon: 'pi pi-clone',
    route: '/organize/duplicates',
    description: 'Cópias exatas (mesmo conteúdo) e visuais (redimensionadas ou recomprimidas).',
  },
  {
    label: 'Fotos semelhantes',
    icon: 'pi pi-th-large',
    route: '/organize/similar',
    description: 'Fotos diferentes da mesma cena, com a melhor candidata destacada.',
  },
  {
    label: 'Baixa qualidade',
    icon: 'pi pi-eye-slash',
    route: '/organize/low-quality',
    description: 'Fotos borradas, escuras ou estouradas. Qualidade baixa não significa valor baixo.',
  },
  {
    label: 'Fotos momentâneas',
    icon: 'pi pi-bolt',
    route: '/organize/momentary',
    description: 'Registros rápidos: telas, preços, documentos, endereços.',
  },
  {
    label: 'Screenshots',
    icon: 'pi pi-mobile',
    route: '/organize/screenshots',
    description: 'Capturas de tela identificadas por dimensões, nome e ausência de dados de câmera.',
  },
  {
    label: 'Lixeira',
    icon: 'pi pi-trash',
    route: '/trash',
    description: 'Fotos enviadas para a lixeira da biblioteca: restaure ou exclua definitivamente.',
  },
];

export const LIBRARY_NAV: NavItem[] = [
  { label: 'Bibliotecas', icon: 'pi pi-database', route: '/libraries' },
  { label: 'Configurações', icon: 'pi pi-cog', route: '/settings' },
];

export const COMING_SOON: NavItem[] = [...MAIN_NAV, ...ORGANIZE_NAV].filter((n) => n.phase);
