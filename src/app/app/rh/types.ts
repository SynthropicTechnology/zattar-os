/**
 * Barrel export para tipos do módulo RH
 * Re-exporta tipos do domain.ts para compatibilidade
 */

export type {
  SalarioComDetalhes,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO,
  FormaPagamentoFolha,
  StatusFolhaPagamento,
  UsuarioResumo,
  CargoResumo,
  ContaContabilResumo,
  CentroCustoResumo,
  ContaBancariaResumo,
  LancamentoFinanceiroResumo,
  Salario,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento,
} from './domain';

