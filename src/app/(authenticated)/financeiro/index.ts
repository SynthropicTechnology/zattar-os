/**
 * Barrel export principal do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useContasPagar } from '@/app/(authenticated)/financeiro/hooks/use-contas-pagar';
 * import { ContaPagarFormDialog } from '@/app/(authenticated)/financeiro/components/contas-pagar/conta-pagar-form-dialog';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useContasPagar, ContaPagarFormDialog } from '@/app/(authenticated)/financeiro';
 *
 * @example
 * import { LancamentosService, actionCriarLancamento } from '@/app/(authenticated)/financeiro';
 * import { useDRE, useOrcamentos } from '@/app/(authenticated)/financeiro/hooks';
 * import { ImportarExtratoDialog } from '@/app/(authenticated)/financeiro/components';
 * import { exportHelpers } from '@/app/(authenticated)/financeiro'; // namespace para helpers de exportação
 */

// ============================================================================
// Domain Layer - Regras de negócio puras
// ============================================================================
// Types - Lancamentos
export type {
  TipoLancamento,
  StatusLancamento,
  OrigemLancamento,
  FormaPagamento,
  FrequenciaRecorrencia,
  AnexoLancamento,
  Lancamento,
  ListarLancamentosParams,
  StatusContaPagar,
  FormaPagamentoContaPagar,
  ContaPagarComDetalhes,
  ResumoVencimentos,
  ContasPagarFilters,
  StatusContaReceber,
  FormaRecebimentoContaReceber,
  ContaReceberComDetalhes,
  RecebimentoContaReceber,
  HistoricoRecebimentos,
  ResumoInadimplencia,
  ContasReceberFilters,
} from "./domain";

// Types - Conciliacao
export type {
  TipoTransacao,
  StatusConciliacao,
  Conciliacao,
  TransacaoImportada,
  ConciliacaoBancaria,
  TransacaoComConciliacao,
  SugestaoConciliacao,
  LancamentoFinanceiroResumo,
  ImportarExtratoDTO,
  ImportarExtratoResponse,
  ConciliarManualDTO,
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  ConciliacaoFilters,
  BuscarLancamentosCandidatosParams,
} from "./domain";

// Types - Plano de Contas
export type {
  TipoContaContabil,
  NaturezaConta,
  NivelConta,
  PlanoContas,
  PlanoContaComPai,
  CriarPlanoContaDTO,
  AtualizarPlanoContaDTO,
  PlanoContasFilters,
  ListarPlanoContasParams,
  ListarPlanoContasResponse,
  PlanoConta,
  PlanoContaHierarquico,
} from "./domain";

// ============================================================================
// Obrigações - validação de sincronização (export direto para consumo externo)
// ============================================================================
export {
  validarSincronizacaoParcela,
  validarSincronizacaoAcordo,
  formatarResultadoValidacao,
} from "./services";

// Types - Fluxo de Caixa
export type {
  FiltroFluxoCaixa,
  FluxoCaixaRealizado,
  FluxoCaixaProjetado,
  FluxoCaixaConsolidado,
  ProjecaoFluxoCaixa,
  FluxoCaixaDiario,
  FluxoCaixaPeriodo,
} from "./domain";

// Types - Relatórios
export type {
  RelatorioComparativo,
  RelatorioCompleto,
  RelatorioExecutivo,
  AnaliseParaUI,
} from "./domain";

// Functions - Lancamentos
export {
  validarCriacaoLancamento,
  validarEfetivacaoLancamento,
  validarCancelamentoLancamento,
  validarEstornoLancamento,
  calcularProximaDataRecorrencia,
  lancamentoEstaVencido,
  calcularDiasAteVencimento,
  gerarDescricaoAcordoJudicial,
  determinarTipoLancamentoPorDirecao,
  getHistoricoRecebimentos,
  isParcialmenteRecebida,
  STATUS_LANCAMENTO_LABELS,
  ORIGEM_LANCAMENTO_LABELS,
  FORMA_PAGAMENTO_LABELS,
  FORMA_RECEBIMENTO_LABELS,
  FREQUENCIA_RECORRENCIA_LABELS,
} from "./domain";

// Functions - Conciliacao
export {
  calcularScoreConciliacao,
  determinarTipoMatch,
  validarConciliacao,
  validarDesconciliacao,
  tiposCorrespondem,
  gerarHashTransacao,
  filtrarCandidatos,
  STATUS_CONCILIACAO_LABELS,
  TIPO_TRANSACAO_LABELS,
  SCORE_MINIMO_AUTO_CONCILIACAO,
  SCORE_MINIMO_SUGESTAO,
} from "./domain";

// Functions - Plano de Contas
export {
  validarCodigoConta,
  validarCriacaoConta,
  validarExclusaoConta,
  validarLancamentoConta,
  extrairCodigoPai,
  ehFilhoDe,
  calcularNivelProfundidade,
  gerarProximoCodigo,
  organizarHierarquia,
  achatarHierarquia,
  sugerirContaPadrao,
  getNaturezaPadrao,
  TIPO_CONTA_LABELS,
  NATUREZA_LABELS,
  NIVEL_LABELS,
} from "./domain";

// Functions - Fluxo de Caixa
export {
  calcularFluxoRealizado,
  calcularFluxoProjetado,
  converterParcelasEmProjecoes,
  agruparPorPeriodo,
  calcularIndicadoresSaude,
  verificarAlertasCaixa,
  AGRUPAMENTOS_PERIODO,
  LIMIAR_ALERTA_SALDO_BAIXO,
  LIMIAR_VARIACAO_ATENCAO,
} from "./domain";

export { isStatusValido, isPeriodoValido } from "./domain";

// Re-export dos tipos únicos de orçamentos e DRE (já definidos em domain/index.ts)
export type {
  Orcamento,
  OrcamentoItem,
  OrcamentoItemComDetalhes,
  OrcamentoComItens,
  OrcamentoComDetalhes,
  StatusOrcamento,
  PeriodoOrcamento,
  CriarOrcamentoDTO,
  AtualizarOrcamentoDTO,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
  AprovarOrcamentoDTO,
  EncerrarOrcamentoDTO,
  DuplicarOrcamentoDTO,
  ResumoOrcamentario,
  AnaliseOrcamentariaItem,
  AlertaDesvio,
  ProjecaoItem,
  AnaliseOrcamentaria,
  EvolucaoMensal,
  ProjecaoOrcamentaria,
  ComparativoOrcamento,
  ListarOrcamentosParams,
  ListarOrcamentosResponse,
  OperacaoOrcamentoResult,
  OrcamentosFilters,
  StatusItemOrcamento,
  TendenciaOrcamento,
  SeveridadeAlerta,
  ItemAnalise,
  AlertaOrcamentario,
  DRE,
  ResumoDRE,
  PeriodoDRE,
  TipoComparativo,
  TipoConta,
  TendenciaDRE,
  ItemDRE,
  CategoriaDRE,
  VariacaoDRE,
  VariacoesDRE,
  ComparativoDRE,
  EvolucaoDRE,
  GerarDREDTO,
  ListarDREsParams,
  BuscarEvolucaoParams,
  DREResponse,
  GrupoDRE,
} from "./domain";

// ============================================================================
// Repository Layer - Acesso a dados
// ============================================================================
export {
  LancamentosRepository,
  ConciliacaoRepository,
  ObrigacoesRepository,
  PlanoContasRepository,
  FluxoCaixaRepository,
  OrcamentosRepository,
  DRERepository,
} from "./repository";

// ============================================================================
// Service Layer - Orquestração de casos de uso
// ============================================================================
// Server-only exports
// ============================================================================
// Para evitar que dependências Node (ex: Redis/ioredis) entrem no bundle do browser,
// o barrel público da feature (este arquivo) exporta apenas código client-safe.
//
// Use:
// - `@/app/(authenticated)/financeiro/server` para services e helpers server-side
// - `@/app/(authenticated)/financeiro/server-actions` para Server Actions

// ============================================================================
// Utils - Utilitários de Exportação
// ============================================================================
export {
  exportarTransacoesImportadasCSV,
  exportarConciliacoesPDF,
} from "./utils/export/conciliacao";
export {
  exportarContasPagarCSV,
  exportarContasPagarPDF,
} from "./utils/export/contas-pagar";
export {
  exportarContasReceberCSV,
  exportarContasReceberPDF,
} from "./utils/export/contas-receber";
export {
  exportarPlanoContasCSV,
  exportarPlanoContasPDF,
} from "./utils/export/plano-contas";
export {
  exportarOrcamentoCSV,
  exportarAnaliseCSV,
  exportarEvolucaoCSV,
  exportarComparativoCSV,
  exportarRelatorioPDF,
  exportarComparativoPDF,
} from "./utils/export/orcamentos";

// Utils - Parse Vencimento
export type { VencimentoRange, VencimentoPreset } from "./utils/parse-vencimento";
export { parseVencimentoFilter } from "./utils/parse-vencimento";

// ============================================================================
// Hooks - React Hooks
// ============================================================================
export {
  // Lancamentos
  useContasPagar,
  cancelarConta,
  excluirConta,
  useContaPagar,
  useContasReceber,
  cancelarContaReceber,
  excluirContaReceber,
  useContaReceber,
  useContasBancarias,
  useCentrosCustoAtivos,
  useCentrosCusto,
  // Conciliação
  useTransacoesImportadas,
  useTransacaoDetalhes,
  useSugestoesConciliacao,
  conciliarManual,
  conciliarAutomaticamente,
  desconciliar,
  // Obrigações
  useObrigacoes,
  useResumoObrigacoes,
  sincronizarAcordo,
  sincronizarParcela,
  // Plano de Contas
  usePlanoContas,
  usePlanoContasAnaliticas,
  usePlanoContasHierarquiaAchatada,
  gerarLabelParaSeletor,
  // DRE
  useDRE,
  useEvolucaoDRE,
  useExportarDRE,
  gerarPeriodoAtual,
  gerarPeriodoAnterior,
  // Orçamentos
  useOrcamentos,
  useOrcamento,
  useAnaliseOrcamentaria,
  useProjecaoOrcamentaria,
  aprovarOrcamento,
  iniciarExecucaoOrcamento,
  encerrarOrcamento,
  excluirOrcamento,
  excluirItemOrcamento,
  criarItemOrcamento,
  atualizarItemOrcamento,
  // Fluxo de Caixa
  useFluxoCaixa,
  // Filtros
  useFiltrosFinanceiros,
} from "./hooks";

export type {
  PlanoContasPaginacao,
  PlanoContaComIndentacao,
} from "./hooks";


// ============================================================================
// Components - Componentes React
// ============================================================================
export {
  // Gerais
  ExportButton,
  // Compartilhados
  OrigemLancamentoSection,
  FiltroStatus,
  FiltroVencimento,
  FiltroCategoria,
  FiltroContaContabil,
  FiltroCentroCusto,
  FiltroCliente,
  FiltroFornecedor,
  MaisFiltrosPopover,
  MaisFiltrosReceberPopover,
  // Contas a Pagar
  AlertasVencimento,
  ContaPagarFormDialog,
  PagarContaDialog,
  // Contas a Receber
  AlertasInadimplencia,
  ContaReceberFormDialog,
  ReceberContaDialog,
  // Conciliação
  AlertasConciliacao,
  buildConciliacaoFilterOptions,
  buildConciliacaoFilterGroups,
  parseConciliacaoFilters,
  ConciliacaoListFilters,
  calcularPeriodo,
  ConciliarManualDialog,
  ImportarExtratoDialog,
  TransacoesImportadasTable,
  // Plano de Contas
  PlanoContaCreateDialog,
  PlanoContaEditDialog,
  PlanoContaSelect,
  PlanoContaPaiSelect,
  PlanoContaAnaliticaSelect,
  PLANO_CONTAS_FILTER_CONFIGS,
  buildPlanoContasFilterOptions,
  buildPlanoContasFilterGroups,
  parsePlanoContasFilters,
  MaisFiltrosPlanoContasPopover,
  // Orçamentos
  OrcamentoFormDialog,
  OrcamentoItemDialog,
  ORCAMENTOS_FILTER_CONFIGS,
  buildOrcamentosFilterOptions,
  buildOrcamentosFilterGroups,
  parseOrcamentosFilters,
  filtersToSelectedIds,
  ResumoCards,
  // Dashboard
  FinanceiroDashboard,
  // Provider
  UsuarioIdProvider,
  useUsuarioId,
} from "./components";

export type {
  StatusConciliacaoFilter,
  PeriodoFilter,
  ConciliacaoListFiltersProps,
  OrcamentoFormDialogProps,
} from "./components";
