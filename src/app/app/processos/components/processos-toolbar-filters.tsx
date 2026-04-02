import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { ProcessosFilters } from '../types';

// Lista de tribunais removida em favor de dados do banco
// const TRIBUNAIS = [...]

export const PROCESSOS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'origem',
    label: 'Origem',
    type: 'select',
    options: [
      { value: 'acervo_geral', label: 'Acervo Geral' },
      { value: 'arquivado', label: 'Arquivado' },
    ],
    searchText: 'origem fonte',
  },
  {
    id: 'trt',
    label: 'Tribunal',
    type: 'select',
    options: [], // Options will be populated dynamically
    searchText: 'regional tribunal trabalho tst superior',
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
    searchText: 'instancia grau judicial superior tst',
  },
  {
    id: 'numero_processo',
    label: 'Número do Processo',
    type: 'text',
    placeholder: 'Ex: 0010014-94.2025.5.03.0022',
    searchText: 'numero processo judicial',
  },
  {
    id: 'nome_parte_autora',
    label: 'Parte Autora',
    type: 'text',
    placeholder: 'Nome da parte autora',
    searchText: 'autor parte autora reclamante',
  },
  {
    id: 'nome_parte_re',
    label: 'Parte Ré',
    type: 'text',
    placeholder: 'Nome da parte ré',
    searchText: 'reu parte re reclamado',
  },
  {
    id: 'descricao_orgao_julgador',
    label: 'Órgão Julgador',
    type: 'text',
    placeholder: 'Descrição do órgão julgador',
    searchText: 'orgao julgador vara',
  },
  {
    id: 'classe_judicial',
    label: 'Classe Judicial',
    type: 'text',
    placeholder: 'Ex: ATOrd, ATSum',
    searchText: 'classe judicial rito',
  },
  {
    id: 'codigo_status_processo',
    label: 'Status do Processo',
    type: 'text',
    placeholder: 'Ex: DISTRIBUIDO',
    searchText: 'status processo situacao',
  },
  {
    id: 'segredo_justica',
    label: 'Segredo de Justiça',
    type: 'boolean',
    searchText: 'segredo justica confidencial',
  },
  {
    id: 'juizo_digital',
    label: 'Juízo Digital',
    type: 'boolean',
    searchText: 'juizo digital processo digital',
  },
  {
    id: 'tem_associacao',
    label: 'Com Associação',
    type: 'boolean',
    searchText: 'associacao vinculo',
  },
  {
    id: 'tem_proxima_audiencia',
    label: 'Com Próxima Audiência',
    type: 'boolean',
    searchText: 'proxima audiencia marcada',
  },
  {
    id: 'sem_responsavel',
    label: 'Sem Responsável',
    type: 'boolean',
    searchText: 'sem responsavel advogado',
  },
  {
    id: 'data_autuacao_inicio',
    label: 'Data Autuação - Início',
    type: 'date',
    searchText: 'data autuacao inicio distribuicao',
  },
  {
    id: 'data_autuacao_fim',
    label: 'Data Autuação - Fim',
    type: 'date',
    searchText: 'data autuacao fim distribuicao',
  },
  {
    id: 'data_arquivamento_inicio',
    label: 'Data Arquivamento - Início',
    type: 'date',
    searchText: 'data arquivamento inicio conclusao',
  },
  {
    id: 'data_arquivamento_fim',
    label: 'Data Arquivamento - Fim',
    type: 'date',
    searchText: 'data arquivamento fim conclusao',
  },
  {
    id: 'data_proxima_audiencia_inicio',
    label: 'Data Próxima Audiência - Início',
    type: 'date',
    searchText: 'data proxima audiencia inicio',
  },
  {
    id: 'data_proxima_audiencia_fim',
    label: 'Data Próxima Audiência - Fim',
    type: 'date',
    searchText: 'data proxima audiencia fim',
  },
];

export function buildProcessosFilterOptions(tribunais: { codigo: string; nome: string }[] = []): ReturnType<typeof buildFilterOptions> {
  // Atualizar opcoes de tribunais dinamicamente
  const configs = [...PROCESSOS_FILTER_CONFIGS];
  const trtConfig = configs.find(c => c.id === 'trt');
  if (trtConfig) {
    trtConfig.options = tribunais.map(t => ({ value: t.codigo, label: t.codigo })); // Usando codigo como label como antes
  }

  return buildFilterOptions(configs);
}

export function buildProcessosFilterGroups(): FilterGroup[] {
  // Criar mapeamento de configs por ID para fácil acesso
  const configMap = new Map(PROCESSOS_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' || config.type === 'multiselect') {
        if (config.options) {
          for (const opt of config.options) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label, // Apenas o label da opção, sem prefixo
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
      options: buildOptionsWithoutPrefix([
        configMap.get('trt')!,
      ]),
    },
    {
      label: 'Grau',
      options: buildOptionsWithoutPrefix([
        configMap.get('grau')!,
      ]),
    },
    {
      label: 'Origem',
      options: buildOptionsWithoutPrefix([
        configMap.get('origem')!,
      ]),
    },
    {
      label: 'Características',
      options: buildOptionsWithoutPrefix([
        configMap.get('segredo_justica')!,
        configMap.get('juizo_digital')!,
        configMap.get('tem_associacao')!,
        configMap.get('tem_proxima_audiencia')!,
        configMap.get('sem_responsavel')!,
      ]),
    },
  ];
}

export function parseProcessosFilters(selectedFilters: string[]): ProcessosFilters {
  return parseFilterValues(selectedFilters, PROCESSOS_FILTER_CONFIGS) as ProcessosFilters;
}
