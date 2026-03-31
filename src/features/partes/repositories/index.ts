/**
 * PARTES REPOSITORIES - Barrel Export
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { findClienteById } from '@/features/partes/repositories/clientes-repository';
 *
 * Re-exporta todas as funcoes dos repositories decompostos para
 * manter retrocompatibilidade com codigo existente.
 *
 * A estrutura antiga (repository.ts monolitico) esta sendo substituida por:
 * - clientes-repository.ts
 * - partes-contrarias-repository.ts
 * - terceiros-repository.ts
 * - shared/converters.ts
 */

// Clientes
export {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNome,
  findAllClientes,
  saveCliente,
  updateCliente,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  softDeleteCliente,
  softDeleteClientesEmMassa,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  findClienteByIdComEndereco,
  countClientes,
  countClientesAteData,
  countClientesEntreDatas,
  countClientesPorEstado,
  countClientesPorEstadoComFiltro,
} from './clientes-repository';

// Partes Contrarias
export {
  findParteContrariaById,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  findAllPartesContrariasComEnderecoEProcessos,
  saveParteContraria,
  updateParteContraria,
  upsertParteContrariaByCPF,
  upsertParteContrariaByCNPJ,
  searchPartesContrariaComEndereco,
  softDeleteParteContraria,
  softDeletePartesContrariasEmMassa,
  countPartesContrarias,
  countPartesContrariasAteData,
  countPartesContrariasEntreDatas,
} from './partes-contrarias-repository';

// Terceiros
export {
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  findAllTerceiros,
  findAllTerceirosComEnderecoEProcessos,
  saveTerceiro,
  updateTerceiro,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
  softDeleteTerceiro,
  softDeleteTerceirosEmMassa,
  countTerceiros,
  countTerceirosEntreDatas,
} from './terceiros-repository';

// Representantes - exported with Repo suffix to avoid conflicts with service layer
export {
  buscarRepresentantePorId as buscarRepresentantePorIdRepo,
  buscarRepresentantePorIdComEndereco as buscarRepresentantePorIdComEnderecoRepo,
  buscarRepresentantePorCPF as buscarRepresentantePorCPFRepo,
  buscarRepresentantePorNome as buscarRepresentantePorNomeRepo,
  buscarRepresentantesPorOAB as buscarRepresentantesPorOABRepo,
  listarRepresentantes as listarRepresentantesRepo,
  listarRepresentantesComEndereco as listarRepresentantesComEnderecoRepo,
  listarRepresentantesComEnderecoEProcessos as listarRepresentantesComEnderecoEProcessosRepo,
  criarRepresentante as criarRepresentanteRepo,
  atualizarRepresentante as atualizarRepresentanteRepo,
  deletarRepresentante as deletarRepresentanteRepo,
  deletarRepresentantesEmMassa as deletarRepresentantesEmMassaRepo,
  upsertRepresentantePorCPF as upsertRepresentantePorCPFRepo,
} from './representantes-repository';

// Processo Partes
export type {
  VincularParteProcessoParams,
  ProcessoParte,
  VincularParteProcessoResult,
  BuscarProcessosPorEntidadeResult,
} from './processo-partes-repository';
export {
  vincularParteProcesso,
  buscarProcessosPorEntidade,
} from './processo-partes-repository';

// Cadastros PJE
export type {
  TipoEntidadeCadastroPJE,
  SistemaJudicial,
  CadastroPJE,
  UpsertCadastroPJEParams,
  BuscarEntidadePorIdPessoaPJEParams,
} from './cadastros-pje-repository';
export {
  upsertCadastroPJE,
  buscarEntidadePorIdPessoaPJE,
} from './cadastros-pje-repository';

// Converters (para casos onde precisam ser usados externamente)
export {
  converterParaCliente,
  converterParaParteContraria,
  converterParaTerceiro,
  converterParaEndereco,
} from './shared/converters';
