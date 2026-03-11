// Domain types and schemas
export type {
  TipoLitigio,
  StatusEntrevista,
  PerfilReclamante,
  ModuloEntrevista,
  EntrevistaTrabalhista,
  EntrevistaAnexo,
  // Respostas unificadas
  RespostasEntrevista,
  // Trilha A — Clássico
  RespostasClassico,
  RespostasVinculo,
  RespostasJornada,
  RespostasSaudeAmbiente,
  RespostasRuptura,
  // Trilha B — Gig Economy
  RespostasGig,
  RespostasControleAlgoritmico,
  RespostasDependenciaEconomica,
  RespostasCondicoesTrabalhoGig,
  RespostasDesligamentoPlataforma,
  // Trilha C — Pejotização
  RespostasPejotizacao,
  RespostasContratoPJ,
  RespostasSubordinacaoReal,
  RespostasExclusividadePessoalidade,
  RespostasFraudeVerbas,
  RespostasConsolidacaoFinal,
  // Inputs
  CreateEntrevistaInput,
  SalvarModuloInput,
  CreateAnexoInput,
} from './domain';

export {
  createEntrevistaSchema,
  salvarModuloSchema,
  createAnexoSchema,
  respostasClassicoSchema,
  respostasGigSchema,
  respostasPejotizacaoSchema,
  respostasConsolidacaoFinalSchema,
  tipoLitigioSchema,
  statusEntrevistaSchema,
  TIPO_LITIGIO_LABELS,
  TIPO_LITIGIO_DESCRICAO,
  STATUS_ENTREVISTA_LABELS,
  PERFIL_RECLAMANTE_LABELS,
  MODULO_LABELS,
  MODULOS_CLASSICO,
  MODULOS_GIG,
  MODULOS_PEJOTIZACAO,
  PERFIS_POR_TRILHA,
  getModulosPorTrilha,
  CTPS_OPTIONS,
  CONTROLE_PONTO_OPTIONS,
  JORNADA_INTERVALO_OPTIONS,
  TIPO_RISCO_OPTIONS,
  MOTIVO_RUPTURA_OPTIONS,
  VERBAS_RECEBIDAS_OPTIONS,
  TIPO_ANEXO_OPTIONS,
  // Gig Economy
  TIPO_PLATAFORMA_OPTIONS,
  RECUSA_CONSEQUENCIA_OPTIONS,
  PERCENTUAL_RENDA_OPTIONS,
  QTD_PLATAFORMAS_OPTIONS,
  FAIXA_HORAS_DIA_OPTIONS,
  DIAS_SEMANA_OPTIONS,
  FORMA_DESLIGAMENTO_OPTIONS,
  TEMPO_PLATAFORMA_OPTIONS,
  // Pejotização
  ORIGEM_PJ_OPTIONS,
  TIPO_PJ_OPTIONS,
  VALOR_PAGAMENTO_OPTIONS,
  LOCAL_TRABALHO_OPTIONS,
  PROIBICAO_OUTROS_OPTIONS,
  DURACAO_RELACAO_OPTIONS,
  REGIME_FERIAS_OPTIONS,
  BENEFICIO_RECEBIDO_OPTIONS,
} from './domain';

// Service layer
export {
  iniciarEntrevista,
  salvarModulo,
  finalizarEntrevista,
  reabrirEntrevista,
  buscarEntrevistaPorContrato,
} from './service';

// Queries (Server Components)
export type { EntrevistaComAnexos } from './queries';
export { fetchEntrevistaByContratoId } from './queries';

// Actions (Server Actions)
export type { EntrevistaActionResult } from './actions/entrevista-actions';
export {
  iniciarEntrevistaAction,
  salvarModuloAction,
  finalizarEntrevistaAction,
  reabrirEntrevistaAction,
} from './actions/entrevista-actions';
export { uploadAnexoAction, uploadArquivoAnexoAction, deleteAnexoAction } from './actions/anexo-actions';
export { consolidarEntrevistaIAAction } from './actions/consolidacao-ia-actions';
export { enviarParaIntegracaoPeticaoAction } from './actions/integracao-peticao-actions';

// Hooks (Client Components)
export { useEntrevista } from './hooks/use-entrevista';

// Components (Client)
export { EntrevistaTab } from './components/entrevista-tab';
