/**
 * Serviço para buscar processos completos no painel do PJe
 *
 * Busca processos por ID nas páginas "Arquivados" e "Acervo Geral",
 * retornando dados completos para persistência.
 *
 * Extraído de captura-combinada.service.ts para reuso no fluxo de audiências.
 */

import type { AuthResult } from "./trt-auth.service";
import { obterProcessosAcervoGeral } from "@/app/(authenticated)/captura/pje-trt/acervo-geral/obter-processos";
import { obterProcessosArquivados } from "@/app/(authenticated)/captura/pje-trt/arquivados/obter-processos";
import type { Processo } from "../../types/types";

type OrigemProcesso = "acervo_geral" | "arquivado";

export async function buscarProcessosPorIdsNoPainel(
  page: AuthResult["page"],
  params: {
    idAdvogado: number;
    processosIds: number[];
    delayEntrePaginas?: number;
  },
): Promise<{
  processosPorOrigem: Record<OrigemProcesso, Processo[]>;
  processosFaltantes: number[];
}> {
  const { idAdvogado, processosIds, delayEntrePaginas = 300 } = params;

  const faltantes = new Set(processosIds);
  const processosArquivados: Processo[] = [];
  const processosAcervo: Processo[] = [];

  // 1) Buscar primeiro em ARQUIVADOS (para respeitar origem)
  const paramsArquivados: Record<string, string | number | boolean> = {
    tipoPainelAdvogado: 5,
    ordenacaoCrescente: false,
    data: Date.now(),
  };

  console.log(
    `🔎 [BuscarProcessos] Buscando processos em Arquivados... (alvo: ${faltantes.size})`,
  );

  {
    const primeiraPagina = await obterProcessosArquivados(
      page,
      idAdvogado,
      1,
      100,
      paramsArquivados,
    );
    const registros = Array.isArray(primeiraPagina.resultado)
      ? primeiraPagina.resultado
      : [];

    for (const proc of registros) {
      if (faltantes.has(proc.id)) {
        processosArquivados.push(proc);
        faltantes.delete(proc.id);
      }
    }

    const qtdPaginas =
      primeiraPagina.qtdPaginas > 0
        ? primeiraPagina.qtdPaginas
        : registros.length > 0
          ? 1
          : 0;

    for (let p = 2; p <= qtdPaginas && faltantes.size > 0; p++) {
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));
      const pagina = await obterProcessosArquivados(
        page,
        idAdvogado,
        p,
        100,
        paramsArquivados,
      );
      const lista = Array.isArray(pagina.resultado) ? pagina.resultado : [];
      for (const proc of lista) {
        if (faltantes.has(proc.id)) {
          processosArquivados.push(proc);
          faltantes.delete(proc.id);
        }
      }
    }
  }

  console.log(
    `✅ [BuscarProcessos] Encontrados em Arquivados: ${processosArquivados.length} | faltantes: ${faltantes.size}`,
  );

  // 2) Buscar o restante em ACERVO GERAL
  if (faltantes.size > 0) {
    console.log(
      `🔎 [BuscarProcessos] Buscando processos em Acervo Geral... (faltantes: ${faltantes.size})`,
    );

    const primeiraPagina = await obterProcessosAcervoGeral(
      page,
      idAdvogado,
      1,
      100,
    );
    const registros = Array.isArray(primeiraPagina.resultado)
      ? primeiraPagina.resultado
      : [];

    for (const proc of registros) {
      if (faltantes.has(proc.id)) {
        processosAcervo.push(proc);
        faltantes.delete(proc.id);
      }
    }

    const qtdPaginas =
      primeiraPagina.qtdPaginas > 0
        ? primeiraPagina.qtdPaginas
        : registros.length > 0
          ? 1
          : 0;

    for (let p = 2; p <= qtdPaginas && faltantes.size > 0; p++) {
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));
      const pagina = await obterProcessosAcervoGeral(page, idAdvogado, p, 100);
      const lista = Array.isArray(pagina.resultado) ? pagina.resultado : [];
      for (const proc of lista) {
        if (faltantes.has(proc.id)) {
          processosAcervo.push(proc);
          faltantes.delete(proc.id);
        }
      }
    }

    console.log(
      `✅ [BuscarProcessos] Encontrados em Acervo Geral: ${processosAcervo.length} | faltantes: ${faltantes.size}`,
    );
  }

  return {
    processosPorOrigem: {
      arquivado: processosArquivados,
      acervo_geral: processosAcervo,
    },
    processosFaltantes: Array.from(faltantes),
  };
}
