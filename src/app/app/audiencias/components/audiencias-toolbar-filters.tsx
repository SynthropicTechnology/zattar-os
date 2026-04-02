'use client';

import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { AudienciasFilters } from '../domain';
import { GrauTribunal } from '../domain';
import type { Usuario } from '@/app/app/usuarios';

const TRIBUNAIS = [
  'TRT1',
  'TRT2',
  'TRT3',
  'TRT4',
  'TRT5',
  'TRT6',
  'TRT7',
  'TRT8',
  'TRT9',
  'TRT10',
  'TRT11',
  'TRT12',
  'TRT13',
  'TRT14',
  'TRT15',
  'TRT16',
  'TRT17',
  'TRT18',
  'TRT19',
  'TRT20',
  'TRT21',
  'TRT22',
  'TRT23',
  'TRT24',
  'TST',
] as const;

export const AUDIENCIAS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'trt',
    label: 'Tribunal',
    type: 'select',
    options: TRIBUNAIS.map((trib) => ({ value: trib, label: trib })),
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'primeiro_grau', label: 'Primeiro Grau' },
      { value: 'segundo_grau', label: 'Segundo Grau' },
      { value: 'tribunal_superior', label: 'Tribunal Superior' },
    ],
  },
  {
    id: 'responsavel_id',
    label: 'Responsável',
    type: 'select',
    options: [],
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'M', label: 'Marcada' },
      { value: 'F', label: 'Finalizada' },
      { value: 'C', label: 'Cancelada' },
    ],
  },
  {
    id: 'modalidade',
    label: 'Modalidade',
    type: 'select',
    options: [
      { value: 'virtual', label: 'Virtual' },
      { value: 'presencial', label: 'Presencial' },
      { value: 'hibrida', label: 'Híbrida' },
    ],
  },
];

export function buildAudienciasFilterOptions(usuarios?: Usuario[]): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of AUDIENCIAS_FILTER_CONFIGS) {
    if (config.type === 'select') {
      if (config.id === 'responsavel_id' && usuarios) {
        const responsavelOptions: ComboboxOption[] = [
          { value: 'null', label: 'Sem responsável' },
          ...usuarios.map((u) => ({ value: u.id.toString(), label: u.nomeExibicao })),
        ];
        for (const opt of responsavelOptions) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: `${config.label}: ${opt.label}`,
            searchText: config.searchText || opt.searchText,
          });
        }
      } else if (config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: `${config.label}: ${opt.label}`,
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
}

export function buildAudienciasFilterGroups(usuarios?: Usuario[]): FilterGroup[] {
  const configMap = new Map(AUDIENCIAS_FILTER_CONFIGS.map((c) => [c.id, c]));

  const buildOptionsWithoutPrefix = (
    configs: FilterConfig[],
    usuariosList?: Usuario[]
  ): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select') {
        if (config.id === 'responsavel_id' && usuariosList) {
          const responsavelOptions: ComboboxOption[] = [
            { value: 'null', label: 'Sem responsável' },
            ...usuariosList.map((u) => ({ value: u.id.toString(), label: u.nomeExibicao })),
          ];
          for (const opt of responsavelOptions) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label,
              searchText: config.searchText || opt.searchText,
            });
          }
        } else if (config.options) {
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
      label: 'Tribunal',
      options: buildOptionsWithoutPrefix([configMap.get('trt')!]),
    },
    {
      label: 'Grau',
      options: buildOptionsWithoutPrefix([configMap.get('grau')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([configMap.get('status')!]),
    },
    {
      label: 'Responsável',
      options: buildOptionsWithoutPrefix([configMap.get('responsavel_id')!], usuarios),
    },
    {
      label: 'Modalidade',
      options: buildOptionsWithoutPrefix([configMap.get('modalidade')!]),
    },
  ];
}

export function parseAudienciasFilters(selectedFilters: string[]): AudienciasFilters {
  const filters: AudienciasFilters = {};
  const configMap = new Map(AUDIENCIAS_FILTER_CONFIGS.map((c) => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      let id: string | null = null;
      let value: string | null = null;
      for (const configId of configMap.keys()) {
        if (selected.startsWith(configId + '_')) {
          id = configId;
          value = selected.substring(configId.length + 1);
          break;
        }
      }
      if (!id || !value) continue;
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'trt') {
          filters.trt = value;
        } else if (id === 'grau') {
          filters.grau = value as GrauTribunal;
        } else if (id === 'responsavel_id') {
          if (value === 'null') {
            filters.responsavel_id = 'null';
          } else {
            const num = parseInt(value, 10);
            if (!isNaN(num)) {
              filters.responsavel_id = num;
            }
          }
        } else if (id === 'status') {
          filters.status = value;
        } else if (id === 'modalidade') {
          filters.modalidade = value as 'virtual' | 'presencial' | 'hibrida';
        }
      }
    }
  }

  return filters;
}
