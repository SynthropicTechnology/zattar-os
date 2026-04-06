/**
 * Tipos compartilhados para CopilotKit Actions
 */

// Módulos disponíveis no sistema
export type ModuloSistema =
  | 'dashboard'
  | 'processos'
  | 'audiencias'
  | 'expedientes'
  | 'obrigacoes'
  | 'contratos'
  | 'assistentes'
  | 'clientes'
  | 'usuarios'
  | 'captura'
  | 'financeiro'
  | 'rh';

// Visualizações de período
export type VisualizacaoPeriodo = 'semana' | 'mes' | 'ano' | 'lista';

// Modos de exibição
export type ModoExibicao = 'tabela' | 'cards';

// Tribunais
export type Tribunal =
  | 'TRT1' | 'TRT2' | 'TRT3' | 'TRT4' | 'TRT5' | 'TRT6'
  | 'TRT7' | 'TRT8' | 'TRT9' | 'TRT10' | 'TRT11' | 'TRT12'
  | 'TRT13' | 'TRT14' | 'TRT15' | 'TRT16' | 'TRT17' | 'TRT18'
  | 'TRT19' | 'TRT20' | 'TRT21' | 'TRT22' | 'TRT23' | 'TRT24'
  | 'TST';

// Graus processuais
export type GrauProcessual = 'primeiro' | 'segundo' | 'superior';

// Status de audiência
export type StatusAudiencia = 'marcada' | 'realizada' | 'cancelada' | 'adiada';

// Modalidade de audiência
export type ModalidadeAudiencia = 'virtual' | 'presencial' | 'hibrida';

// Tipos de entidades para atribuição
export type TipoEntidade = 'processo' | 'audiencia' | 'expediente';

// Interface para filtros de processo
export interface FiltrosProcesso {
  tribunal?: string;
  grau?: GrauProcessual;
  status?: string;
  parteAutora?: string;
  parteRe?: string;
  responsavel?: string;
  busca?: string;
}

// Interface para filtros de audiência
export interface FiltrosAudiencia {
  periodo?: VisualizacaoPeriodo | 'hoje';
  tribunal?: string;
  status?: StatusAudiencia;
  modalidade?: ModalidadeAudiencia;
  responsavel?: string;
}

// Interface para filtros de expediente
export interface FiltrosExpediente {
  tipo?: string;
  status?: string;
  responsavel?: string;
  dataInicio?: string;
  dataFim?: string;
}
