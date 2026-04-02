import type { Endereco, EntidadeTipoEndereco, SituacaoEndereco, ClassificacaoEndereco } from './types';
import type { GrauProcesso } from '@/app/app/partes/types';

/**
 * Converte dados do banco para entidade Endereco tipada
 */
export function converterParaEndereco(data: Record<string, unknown>): Endereco {
  return {
    id: data.id as number,
    id_pje: (data.id_pje as number) ?? null,
    entidade_tipo: data.entidade_tipo as EntidadeTipoEndereco,
    entidade_id: data.entidade_id as number,
    trt: (data.trt as string) ?? null,
    grau: (data.grau as GrauProcesso) ?? null,
    numero_processo: (data.numero_processo as string) ?? null,
    logradouro: (data.logradouro as string) ?? null,
    numero: (data.numero as string) ?? null,
    complemento: (data.complemento as string) ?? null,
    bairro: (data.bairro as string) ?? null,
    id_municipio_pje: (data.id_municipio_pje as number) ?? null,
    municipio: (data.municipio as string) ?? null,
    municipio_ibge: (data.municipio_ibge as string) ?? null,
    estado_id_pje: (data.estado_id_pje as number) ?? null,
    estado_sigla: (data.estado_sigla as string) ?? null,
    estado_descricao: (data.estado_descricao as string) ?? null,
    estado: (data.estado as string) ?? null,
    pais_id_pje: (data.pais_id_pje as number) ?? null,
    pais_codigo: (data.pais_codigo as string) ?? null,
    pais_descricao: (data.pais_descricao as string) ?? null,
    pais: (data.pais as string) ?? null,
    cep: (data.cep as string) ?? null,
    classificacoes_endereco: (data.classificacoes_endereco as ClassificacaoEndereco[]) ?? null,
    correspondencia: (data.correspondencia as boolean) ?? null,
    situacao: (data.situacao as SituacaoEndereco) ?? null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown>) ?? null,
    id_usuario_cadastrador_pje: (data.id_usuario_cadastrador_pje as number) ?? null,
    data_alteracao_pje: (data.data_alteracao_pje as string) ?? null,
    ativo: (data.ativo as boolean) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
