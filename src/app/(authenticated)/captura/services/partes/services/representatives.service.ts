/**
 * Serviço de processamento de representantes (advogados, defensores)
 *
 * Este serviço é responsável por:
 * - Processar lista de representantes de uma parte
 * - Upsert de representantes por CPF
 * - Processar endereços de representantes
 * - Registrar representantes em cadastros_pje
 */

import type { RepresentantePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import type { TipoParteClassificacao } from "../types";
import type { ProcessoParaCaptura } from "../partes-capture.service";
import type {
  SituacaoOAB,
  TipoRepresentante,
} from "@/app/(authenticated)/partes/types";
import {
  upsertRepresentantePorCPFRepo as upsertRepresentantePorCPF,
  buscarRepresentantePorCPFRepo as buscarRepresentantePorCPF,
} from "@/app/(authenticated)/partes/server";
import getLogger from "@/lib/logger";
import { normalizarDocumento } from "../utils";
import { extrairCamposRepresentantePJE } from "../utils";
import { processarEnderecoRepresentante } from "./addresses.service";
import { registrarRepresentanteCadastroPJE } from "./persistence.service";

/**
 * Processa e salva representantes de uma parte em lote
 *
 * @param representantes - Lista de representantes do PJE
 * @param tipoParte - Tipo da parte associada
 * @param parteId - ID da parte no sistema
 * @param processo - Dados do processo
 * @param logger - Logger para registro de operações
 * @returns Quantidade de representantes salvos com sucesso
 */
export async function processarRepresentantes(
  representantes: RepresentantePJE[],
  tipoParte: TipoParteClassificacao,
  parteId: number,
  processo: ProcessoParaCaptura,
  logger: ReturnType<typeof getLogger>
): Promise<number> {
  let count = 0;

  logger.info(
    { count: representantes.length, parteId },
    "Processando representantes"
  );

  for (const rep of representantes) {
    try {
      const representanteId = await processarRepresentante(rep, logger);

      if (representanteId) {
        // Registrar em cadastros_pje
        await registrarRepresentanteCadastroPJE(
          representanteId,
          rep.idPessoa,
          rep.dadosCompletos,
          processo
        );

        count++;
        logger.debug(
          { nome: rep.nome, numeroDocumento: rep.numeroDocumento },
          "Representante salvo"
        );

        // Processa endereço do representante se houver
        if (rep.dadosCompletos?.endereco) {
          await processarEnderecoRepresentante(
            rep,
            tipoParte,
            parteId,
            processo
          );
        }
      }
    } catch (error) {
      logger.error(
        {
          nome: rep.nome,
          error: error instanceof Error ? error.message : String(error),
        },
        "Erro ao salvar representante"
      );
    }
  }

  logger.info(
    { salvos: count, total: representantes.length },
    "Representantes processados"
  );
  return count;
}

/**
 * Processa um representante individual: upsert por CPF
 *
 * @param rep - Dados do representante do PJE
 * @param logger - Logger para registro de operações
 * @returns ID do representante ou null se falhou
 */
async function processarRepresentante(
  rep: RepresentantePJE,
  logger: ReturnType<typeof getLogger>
): Promise<number | null> {
  // Extrair e normalizar CPF com validação de null/empty
  if (!rep.numeroDocumento || String(rep.numeroDocumento).trim() === "") {
    logger.warn({ nome: rep.nome }, "Representante sem CPF; ignorando");
    return null;
  }

  const cpf = String(rep.numeroDocumento);
  const cpfNormalizado = normalizarDocumento(cpf);

  // Buscar representante existente por CPF
  const representanteExistente = await buscarRepresentantePorCPF(cpfNormalizado);

  if (representanteExistente) {
    // UPDATE: representante já existe
    return representanteExistente.id;
  }

  // INSERT: novo representante
  const camposExtras = extrairCamposRepresentantePJE(rep);

  const params = {
    nome: rep.nome,
    cpf: cpfNormalizado,
    numero_oab: rep.numeroOAB || undefined,
    situacao_oab: (rep.situacaoOAB as unknown as SituacaoOAB) || undefined,
    tipo: (rep.tipo as unknown as TipoRepresentante) || undefined,
    email: rep.email || undefined,
    ddd_celular: rep.telefones?.[0]?.ddd || undefined,
    numero_celular: rep.telefones?.[0]?.numero || undefined,
    ...camposExtras,
  };

  const result = await upsertRepresentantePorCPF(params);

  if (result.sucesso && result.representante) {
    return result.representante.id;
  }

  return null;
}

/**
 * Busca representante por CPF
 *
 * @param cpf - CPF do representante (pode estar formatado)
 * @returns Representante encontrado ou null
 */
export async function buscarRepresentante(
  cpf: string
): Promise<{ id: number; nome: string } | null> {
  const cpfNormalizado = normalizarDocumento(cpf);
  return await buscarRepresentantePorCPF(cpfNormalizado);
}

/**
 * Verifica se representante existe por CPF
 *
 * @param cpf - CPF do representante
 * @returns true se representante existe
 */
export async function representanteExiste(cpf: string): Promise<boolean> {
  const representante = await buscarRepresentante(cpf);
  return !!representante;
}
