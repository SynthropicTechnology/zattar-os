
// Types
export type {
  Salario,
  SalarioComDetalhes,
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento,
  ItemFolhaComDetalhes,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO,
  CancelarFolhaDTO,
  ListarSalariosParams,
  ListarSalariosResponse,
  ListarFolhasParams,
  ListarFolhasResponse,
  StatusFolhaPagamento,
  FormaPagamentoFolha,
} from './domain';

// Domain
export {
  criarSalarioSchema,
  atualizarSalarioSchema,
  gerarFolhaSchema,
  aprovarFolhaSchema,
  pagarFolhaSchema,
  STATUS_FOLHA_LABELS,
  FORMA_PAGAMENTO_FOLHA_LABELS,
  MESES_LABELS,
  MESES_OPTIONS,
  isStatusFolhaValido,
  isFormaPagamentoFolhaValida,
  isTransicaoStatusValida,
} from './domain';

// Utils
export {
  formatarPeriodo,
  validarPeriodoFolha,
  ultimoDiaDoMes,
  primeiroDiaDoMes,
  dataEstaNoPeriodo,
  calcularDuracaoVigencia,
  calcularSalarioVigente,
  STATUS_FOLHA_CORES,
} from './utils';

// Values/Functions from Service
export {
  gerarFolhaPagamento,
  previewGerarFolha,
  aprovarFolhaPagamento,
  pagarFolhaPagamento,
  calcularTotalAPagar,
  cancelarFolhaPagamento,
  podeCancelarFolha,

  // Re-exported from repository via service
  listarSalarios,
  buscarSalarioPorId,
  buscarSalariosDoUsuario,
  buscarSalarioVigente,
  criarSalario,
  atualizarSalario,
  encerrarVigenciaSalario,
  inativarSalario,
  deletarSalario,
  calcularTotaisSalariosAtivos,
  listarUsuariosSemSalarioVigente,
  buscarFolhaPorId,
  buscarFolhaPorPeriodo,
  listarFolhasPagamento,
  deletarFolhaPagamento
} from './service';

// Actions
export {
  actionListarSalarios,
  actionBuscarSalario,
  actionCriarSalario,
  actionAtualizarSalario,
  actionEncerrarVigenciaSalario,
  actionInativarSalario,
  actionExcluirSalario,
  actionBuscarSalariosDoUsuario
} from './actions/salarios-actions';

export {
  actionListarFolhasPagamento,
  actionBuscarFolhaPagamento,
  actionGerarFolhaPagamento,
  actionPreviewGerarFolha,
  actionAprovarFolhaPagamento,
  actionPagarFolhaPagamento,
  actionCancelarFolhaPagamento,
  actionExcluirFolhaPagamento,

  actionBuscarFolhaPorPeriodo
} from './actions/folhas-pagamento-actions';


// Hooks
export * from './hooks';
export { SalariosList } from './components/salarios/salarios-list';
export { SalarioFormDialog } from './components/salarios/salario-form-dialog';
export { FolhasPagamentoList } from './components/folhas-pagamento/folhas-list';
export { FolhaDetalhes } from './components/folhas-pagamento/folha-detalhes';
export { GerarFolhaDialog } from './components/folhas-pagamento/gerar-folha-dialog';
export { AprovarFolhaDialog } from './components/folhas-pagamento/aprovar-folha-dialog';
export { PagarFolhaDialog } from './components/folhas-pagamento/pagar-folha-dialog';
export { HistoricoSalarios } from './components/shared/historico-salarios';
