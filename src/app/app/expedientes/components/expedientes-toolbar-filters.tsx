import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { ExpedientesFilters } from '../domain';
import { CodigoTribunal, GRAU_TRIBUNAL_LABELS, ORIGEM_EXPEDIENTE_LABELS, GrauTribunal, ResultadoDecisao, RESULTADO_DECISAO_LABELS } from '../domain';

// =============================================================================
// CONFIGURAÇÕES DE FILTROS
// =============================================================================

export const EXPEDIENTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'trt',
    label: 'Tribunal',
    type: 'multiselect',
    options: CodigoTribunal.map(trt => ({ value: trt, label: trt })),
    searchText: 'tribunal regional trabalho trt',
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'multiselect',
    options: Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    searchText: 'grau instancia primeiro segundo superior',
  },
  {
    id: 'origem',
    label: 'Origem',
    type: 'multiselect',
    options: Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    searchText: 'origem captura manual comunica cnj',
  },
  {
    id: 'responsavel_id',
    label: 'Responsável',
    type: 'select',
    options: [], // Será preenchido dinamicamente
    searchText: 'responsavel usuario atribuido',
  },
  {
    id: 'tipo_expediente_id',
    label: 'Tipo de Expediente',
    type: 'multiselect',
    options: [], // Será preenchido dinamicamente
    searchText: 'tipo expediente categoria',
  },
  {
    id: 'sem_responsavel',
    label: 'Sem Responsável',
    type: 'boolean',
    searchText: 'sem responsavel nao atribuido',
  },
  {
    id: 'sem_tipo',
    label: 'Sem Tipo',
    type: 'boolean',
    searchText: 'sem tipo categoria',
  },
  {
    id: 'prazo_vencido',
    label: 'Prazo Vencido',
    type: 'boolean',
    searchText: 'vencido atrasado prazo',
  },
  {
    id: 'sem_prazo',
    label: 'Sem Data de Prazo',
    type: 'boolean',
    searchText: 'sem prazo sem data vencimento',
  },
  {
    id: 'segredo_justica',
    label: 'Segredo de Justiça',
    type: 'boolean',
    searchText: 'segredo justica sigiloso',
  },
  {
    id: 'juizo_digital',
    label: 'Juízo Digital',
    type: 'boolean',
    searchText: 'juizo digital eletronico',
  },
  {
    id: 'prioridade_processual',
    label: 'Prioridade Processual',
    type: 'boolean',
    searchText: 'prioridade urgente',
  },
  {
    id: 'resultado_decisao',
    label: 'Resultado da Decisão',
    type: 'multiselect',
    options: Object.entries(RESULTADO_DECISAO_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    searchText: 'resultado decisao desfavoravel parcialmente favoravel',
  },
];

// =============================================================================
// BUILDERS
// =============================================================================

export function buildExpedientesFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(EXPEDIENTES_FILTER_CONFIGS);
}

/**
 * Constrói os grupos de filtros para exibição agrupada
 */
export function buildExpedientesFilterGroups(
  usuarios: Array<{ id: number; nome_exibicao?: string; nomeExibicao?: string; nome?: string }> = [],
  tiposExpedientes: Array<{ id: number; tipoExpediente?: string; tipo_expediente?: string; nome?: string }> = []
): FilterGroup[] {
  const configMap = new Map(EXPEDIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

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

  // Preencher opções dinâmicas
  const responsavelConfig = configMap.get('responsavel_id');
  if (responsavelConfig) {
    responsavelConfig.options = usuarios.map(u => ({
      value: u.id.toString(),
      label: u.nome_exibicao || u.nomeExibicao || u.nome || `Usuário ${u.id}`,
    }));
  }

  const tipoConfig = configMap.get('tipo_expediente_id');
  if (tipoConfig) {
    tipoConfig.options = tiposExpedientes.map(t => ({
      value: t.id.toString(),
      label: t.tipoExpediente || t.tipo_expediente || t.nome || `Tipo ${t.id}`,
    }));
  }

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
      label: 'Origem',
      options: buildOptionsWithoutPrefix([configMap.get('origem')!]),
    },
    {
      label: 'Responsável',
      options: buildOptionsWithoutPrefix([configMap.get('responsavel_id')!, configMap.get('sem_responsavel')!]),
    },
    {
      label: 'Tipo',
      options: buildOptionsWithoutPrefix([configMap.get('tipo_expediente_id')!, configMap.get('sem_tipo')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('prazo_vencido')!,
        configMap.get('sem_prazo')!,
      ]),
    },
    {
      label: 'Características',
      options: buildOptionsWithoutPrefix([
        configMap.get('segredo_justica')!,
        configMap.get('juizo_digital')!,
        configMap.get('prioridade_processual')!,
      ]),
    },
    {
      label: 'Decisão',
      options: buildOptionsWithoutPrefix([configMap.get('resultado_decisao')!]),
    },
  ];
}

// =============================================================================
// PARSER DE FILTROS
// =============================================================================

/**
 * Converte IDs de filtro selecionados para objeto de filtros
 */
export function parseExpedientesFilters(selectedIds: string[]): ExpedientesFilters {
  const parsed = parseFilterValues(selectedIds, EXPEDIENTES_FILTER_CONFIGS);
  const filters: ExpedientesFilters = {};

  // TRT (multiselect)
  if (parsed.trt && Array.isArray(parsed.trt)) {
    filters.trt = parsed.trt[0] as CodigoTribunal; // Apenas o primeiro, pois o backend espera um único valor
  }

  // Grau (multiselect)
  if (parsed.grau && Array.isArray(parsed.grau)) {
    filters.grau = parsed.grau[0] as GrauTribunal;
  }

  // Origem não está no tipo ExpedientesFilters, então não aplicamos
  // if (parsed.origem && Array.isArray(parsed.origem)) {
  //   filters.origem = parsed.origem[0] as OrigemExpediente;
  // }

  // Responsável
  if (parsed.responsavel_id) {
    if (parsed.responsavel_id === 'null') {
      filters.responsavelId = 'null';
    } else {
      const id = parseInt(parsed.responsavel_id as string, 10);
      if (!isNaN(id)) {
        filters.responsavelId = id;
      }
    }
  }

  // Sem responsável
  if (parsed.sem_responsavel === true) {
    filters.semResponsavel = true;
  }

  // Tipo de expediente (multiselect)
  if (parsed.tipo_expediente_id && Array.isArray(parsed.tipo_expediente_id)) {
    const firstId = parsed.tipo_expediente_id[0];
    const id = parseInt(firstId as string, 10);
    if (!isNaN(id)) {
      filters.tipoExpedienteId = id;
    }
  }

  // Sem tipo
  if (parsed.sem_tipo === true) {
    filters.semTipo = true;
  }

  // Prazo vencido
  if (parsed.prazo_vencido === true) {
    filters.prazoVencido = true;
  }

  // Sem prazo
  if (parsed.sem_prazo === true) {
    // Quando sem prazo, não definimos dataPrazoLegalInicio/Fim
    // O backend deve tratar isso
  }

  // Características booleanas
  if (parsed.segredo_justica === true) {
    filters.segredoJustica = true;
  }
  if (parsed.juizo_digital === true) {
    filters.juizoDigital = true;
  }
  // prioridadeProcessual não está no tipo ExpedientesFilters
  // if (parsed.prioridade_processual === true) {
  //   filters.prioridadeProcessual = true;
  // }

  // Resultado da Decisão
  if (parsed.resultado_decisao && Array.isArray(parsed.resultado_decisao)) {
    filters.resultadoDecisao = parsed.resultado_decisao[0] as ResultadoDecisao;
  }

  return filters;
}

