import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { TipoTemplate } from '@/shared/assinatura-digital';

export interface TemplatesFilters {
  status?: 'ativo' | 'inativo' | 'rascunho';
  ativo?: boolean;
  tipo_template?: TipoTemplate;
}

export const TEMPLATES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
      { value: 'rascunho', label: 'Rascunho' },
    ],
    searchText: 'status situacao',
  },
  {
    id: 'ativo',
    label: 'Disponível',
    type: 'boolean',
    searchText: 'disponivel ativo inativo',
  },
  {
    id: 'tipo_template',
    label: 'Tipo de Template',
    type: 'select',
    options: [
      { value: 'pdf', label: 'PDF' },
      { value: 'markdown', label: 'Markdown' },
    ],
    searchText: 'tipo template',
  },
];

export function buildTemplatesFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(TEMPLATES_FILTER_CONFIGS);
}

export function buildTemplatesFilterGroups(): FilterGroup[] {
  // Criar mapeamento de configs por ID para fácil acesso
  const configMap = new Map(TEMPLATES_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' || config.type === 'multiselect') {
        if (config.options) {
          for (const opt of config.options) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label,
              searchText: config.searchText || opt.searchText,
            });
          }
        }
      } else if (config.type === 'boolean') {
        options.push({
          value: config.id,
          label: config.label,
          searchText: config.searchText,
        });
      }
    }

    return options;
  };

  return [
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('status')!,
      ]),
    },
    {
      label: 'Disponibilidade',
      options: buildOptionsWithoutPrefix([
        configMap.get('ativo')!,
      ]),
    },
    {
      label: 'Tipo de Template',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo_template')!,
      ]),
    },
  ];
}

export function parseTemplatesFilters(selectedFilters: string[]): TemplatesFilters {
  return parseFilterValues(selectedFilters, TEMPLATES_FILTER_CONFIGS) as TemplatesFilters;
}