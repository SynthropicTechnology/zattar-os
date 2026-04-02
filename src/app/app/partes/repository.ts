/**
 * PARTES REPOSITORY - Camada de Persistência
 *
 * Repositório consolidado para clientes, partes contrárias,
 * terceiros, representantes, processo-partes e cadastros PJE.
 *
 * Agrupa todos os sub-repositórios em um único ponto de importação.
 */

// =============================================================================
// CONVERTERS
// =============================================================================
export {
  converterParaCliente,
  converterParaParteContraria,
  converterParaTerceiro,
  converterParaEndereco,
} from './repositories/shared/converters';

// =============================================================================
// CLIENTES
// =============================================================================
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
} from './repositories/clientes-repository';

// =============================================================================
// PARTES CONTRÁRIAS
// =============================================================================
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
} from './repositories/partes-contrarias-repository';

// =============================================================================
// TERCEIROS
// =============================================================================
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
} from './repositories/terceiros-repository';

// =============================================================================
// REPRESENTANTES
// Note: exported with Repo suffix to avoid conflicts with service layer
// =============================================================================
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
  countRepresentantes as countRepresentantesRepo,
  countRepresentantesEntreDatas as countRepresentantesEntreDatasRepo,
} from './repositories/representantes-repository';

// =============================================================================
// PROCESSO-PARTES
// =============================================================================
export type {
  VincularParteProcessoParams,
  ProcessoParte,
  VincularParteProcessoResult,
  BuscarProcessosPorEntidadeResult,
} from './repositories/processo-partes-repository';
export {
  vincularParteProcesso,
  buscarProcessosPorEntidade,
} from './repositories/processo-partes-repository';

// =============================================================================
// CADASTROS PJE
// =============================================================================
export type {
  TipoEntidadeCadastroPJE,
  SistemaJudicial,
  CadastroPJE,
  UpsertCadastroPJEParams,
  BuscarEntidadePorIdPessoaPJEParams,
} from './repositories/cadastros-pje-repository';
export {
  upsertCadastroPJE,
  buscarEntidadePorIdPessoaPJE,
} from './repositories/cadastros-pje-repository';
