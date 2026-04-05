import {
  Database,
  Shield,
  Blocks,
  Bot,
  Palette,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TIPOS
// =============================================================================

export type SettingsTab =
  | 'metricas'
  | 'seguranca'
  | 'integracoes'
  | 'assistentes-ia'
  | 'aparencia'
  | 'prompts-ia';

export interface SettingsNavItem {
  id: SettingsTab;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface SettingsNavGroup {
  label: string;
  items: SettingsNavItem[];
}

export interface SettingsExternalLink {
  label: string;
  icon: LucideIcon;
  href: string;
}

// =============================================================================
// DADOS DE NAVEGAÇÃO
// =============================================================================

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: 'Sistema',
    items: [
      {
        id: 'metricas',
        label: 'Métricas DB',
        icon: Database,
        description: 'Saúde do banco de dados, cache e consultas lentas',
      },
      {
        id: 'seguranca',
        label: 'Segurança',
        icon: Shield,
        description: 'Gerenciamento de IPs bloqueados e políticas de acesso',
      },
    ],
  },
  {
    label: 'Integrações',
    items: [
      {
        id: 'integracoes',
        label: 'Serviços',
        icon: Blocks,
        description: 'Conecte serviços externos ao Zattar OS',
      },
      {
        id: 'assistentes-ia',
        label: 'Assistentes IA',
        icon: Bot,
        description: 'Gerencie aplicativos e workflows de IA via Dify',
      },
    ],
  },
  {
    label: 'Personalização',
    items: [
      {
        id: 'aparencia',
        label: 'Aparência',
        icon: Palette,
        description: 'Tema, cores, tipografia e layout da interface',
      },
      {
        id: 'prompts-ia',
        label: 'Prompts IA',
        icon: Sparkles,
        description: 'Gerencie prompts de sistema para assistentes de IA',
      },
    ],
  },
];

export const SETTINGS_EXTERNAL_LINKS: SettingsExternalLink[] = [
  { label: 'Usuários', icon: Users, href: '/app/usuarios' },
];

// =============================================================================
// HELPERS
// =============================================================================

export const ALL_NAV_ITEMS = SETTINGS_NAV_GROUPS.flatMap((g) => g.items);

export const VALID_TABS = new Set<SettingsTab>(ALL_NAV_ITEMS.map((i) => i.id));

export function findNavItem(tab: SettingsTab): SettingsNavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => item.id === tab);
}
