/**
 * Barrel export para Domain Layer do módulo financeiro
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { validarCriacaoLancamento } from '@/app/(authenticated)/financeiro/domain/lancamentos';
 *
 * NOTA: orcamentos e dre são exportados como namespaces para evitar conflitos
 * de nomes entre símbolos como MESES, TENDENCIA_LABELS, calcularVariacao, etc.
 */

// ============================================================================
// Lancamentos - Tipos e Validações
// ============================================================================
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
} from './lancamentos';

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
} from './lancamentos';

// ============================================================================
// Conciliacao - Tipos e Validações
// ============================================================================
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
} from './conciliacao';

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
} from './conciliacao';

// ============================================================================
// Plano de Contas - Tipos e Validações
// ============================================================================
// Obrigações: tipos agora vêm de @/app/(authenticated)/obrigacoes
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
} from './plano-contas';

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
} from './plano-contas';

// ============================================================================
// Fluxo de Caixa - Tipos e Funções
// ============================================================================
export type {
  FiltroFluxoCaixa,
  FluxoCaixaRealizado,
  FluxoCaixaProjetado,
  FluxoCaixaConsolidado,
  ProjecaoFluxoCaixa,
  FluxoCaixaDiario,
  FluxoCaixaPeriodo,
} from './fluxo-caixa';

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
} from './fluxo-caixa';

// ============================================================================
// Relatorios - Tipos
// ============================================================================
export type {
  RelatorioComparativo,
  RelatorioCompleto,
  RelatorioExecutivo,
  AnaliseParaUI,
} from './relatorios';

export {
  isStatusValido,
  isPeriodoValido,
} from './orcamentos';

// Re-exportar tipos que são únicos e não conflitam (para conveniência)
export type {
  // Orçamentos
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
} from './orcamentos';

export type {
  // DRE
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
} from './dre';
