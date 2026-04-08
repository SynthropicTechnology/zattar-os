/**
 * Registry de Prompts MCP do Synthropic
 *
 * Registra todos os prompts disponíveis para uso com LLMs
 */

import { z } from "zod";
import { registerMcpPrompt, createPromptResult } from "./prompts";
import type { Processo } from "@/app/(authenticated)/processos";

/**
 * Registra todos os prompts disponíveis
 */
export async function registerAllPrompts(): Promise<void> {
  console.log("[MCP Prompts] Iniciando registro de prompts...");

  // =========================================================================
  // ANÁLISE DE PROCESSO
  // =========================================================================

  registerMcpPrompt({
    name: "analisar_processo",
    description: "Gera prompt para análise jurídica de processo",
    arguments: z.object({
      processo_id: z.number().describe("ID do processo"),
      foco: z
        .enum(["riscos", "estrategia", "prazos", "geral"])
        .default("geral")
        .describe("Foco da análise"),
    }),
    handler: async (args) => {
      const { processo_id, foco } = args as {
        processo_id: number;
        foco: string;
      };

      // Buscar dados do processo
      const { actionBuscarProcesso } = await import(
        "@/app/(authenticated)/processos/actions"
      );
      const result = await actionBuscarProcesso(processo_id);

      if (!result.success || !result.data) {
        throw new Error(`Processo ${processo_id} não encontrado`);
      }

      const processo = result.data as Processo;

      const focoTextos: Record<string, string> = {
        riscos:
          "Identifique os principais riscos jurídicos e financeiros deste processo.",
        estrategia:
          "Sugira estratégias processuais e argumentos jurídicos para este caso.",
        prazos:
          "Liste todos os prazos críticos e obrigações processuais pendentes.",
        geral: "Faça uma análise completa e abrangente deste processo.",
      };

      const systemPrompt = `Você é um assistente jurídico especializado em direito trabalhista brasileiro.
Sua função é analisar processos judiciais e fornecer insights relevantes para advogados.
Sempre fundamente suas análises na legislação e jurisprudência aplicáveis.
Use linguagem técnica, mas clara.`;

      const userPrompt = `Analise o seguinte processo:

**Número**: ${processo.numeroProcesso}
**TRT**: ${processo.trt}
**Grau**: ${processo.grau}
**Status**: ${processo.status}
**Parte Autora**: ${processo.nomeParteAutora || "N/A"}
**Parte Ré**: ${processo.nomeParteRe || "N/A"}

${focoTextos[foco]}`;

      return createPromptResult(
        systemPrompt,
        userPrompt,
        `Análise de processo ${processo.numeroProcesso}`
      );
    },
  });

  // =========================================================================
  // GERAÇÃO DE PETIÇÃO
  // =========================================================================

  registerMcpPrompt({
    name: "gerar_peticao",
    description: "Gera prompt para criação de petição jurídica",
    arguments: z.object({
      tipo: z
        .enum(["inicial", "contestacao", "recurso", "manifestacao", "embargo"])
        .describe("Tipo de petição"),
      processo_id: z.number().optional().describe("ID do processo vinculado"),
      contexto: z.string().describe("Contexto e fatos relevantes"),
      argumentos: z
        .array(z.string())
        .optional()
        .describe("Argumentos principais"),
    }),
    handler: async (args) => {
      const { tipo, processo_id, contexto, argumentos } = args as {
        tipo: string;
        processo_id?: number;
        contexto: string;
        argumentos?: string[];
      };

      let processoInfo = "";

      if (processo_id) {
        const { actionBuscarProcesso } = await import(
          "@/app/(authenticated)/processos/actions"
        );
        const result = await actionBuscarProcesso(processo_id);

        if (result.success && result.data) {
          const processo = result.data as Processo;
          processoInfo = `

**Processo Vinculado**:
- Número: ${processo.numeroProcesso}
- TRT: ${processo.trt}
- Grau: ${processo.grau}
- Parte Autora: ${processo.nomeParteAutora || "N/A"}
- Parte Ré: ${processo.nomeParteRe || "N/A"}`;
        }
      }

      const tipoDescricoes: Record<string, string> = {
        inicial: "Redija uma petição inicial trabalhista",
        contestacao: "Redija uma contestação",
        recurso: "Redija um recurso ordinário",
        manifestacao: "Redija uma manifestação processual",
        embargo: "Redija embargos de declaração",
      };

      const systemPrompt = `Você é um advogado trabalhista experiente.
Sua função é redigir petições formais seguindo as normas da ABNT e do CPC/CLT.
Use linguagem jurídica formal e precisa.
Fundamente os argumentos na legislação e jurisprudência.
Estruture a petição com: endereçamento, qualificação, fatos, fundamentos, pedidos e requerimentos finais.`;

      let userPrompt = `${tipoDescricoes[tipo]} com base no seguinte contexto:

**Contexto/Fatos**:
${contexto}${processoInfo}`;

      if (argumentos && argumentos.length > 0) {
        userPrompt += `

**Argumentos Principais**:
${argumentos.map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
      }

      return createPromptResult(systemPrompt, userPrompt, `Geração de ${tipo}`);
    },
  });

  // =========================================================================
  // BUSCA COM CONTEXTO RAG
  // =========================================================================

  registerMcpPrompt({
    name: "buscar_com_contexto",
    description: "Gera prompt com contexto RAG para responder perguntas",
    arguments: z.object({
      pergunta: z.string().describe("Pergunta do usuário"),
      max_resultados: z
        .number()
        .default(5)
        .describe("Máximo de resultados RAG"),
    }),
    handler: async (args) => {
      const { pergunta, max_resultados } = args as {
        pergunta: string;
        max_resultados: number;
      };

      // Buscar contexto via RAG
      const { buscaSemantica } = await import("@/lib/ai/retrieval");

      const resultados = await buscaSemantica(pergunta, {
        limite: max_resultados,
      });

      let contexto = "";
      const fontes: string[] = [];

      if (resultados.length > 0) {
        contexto = resultados
          .map((r, i) => {
            fontes.push(
              `[${i + 1}] ${r.metadata.tipo}: ${
                r.metadata.titulo || "Sem título"
              }`
            );
            return `[${i + 1}] ${r.texto}`;
          })
          .join("\n\n");
      }

      const systemPrompt = `Você é um assistente jurídico do Synthropic, especializado em direito trabalhista.
Use APENAS o contexto fornecido para responder às perguntas.
Se a informação não estiver no contexto, diga claramente que não encontrou.
Sempre cite as fontes usando o formato [número].

${
  contexto
    ? `**Contexto disponível**:\n${contexto}`
    : "Nenhum contexto encontrado."
}

${fontes.length > 0 ? `**Fontes**:\n${fontes.join("\n")}` : ""}`;

      return createPromptResult(
        systemPrompt,
        pergunta,
        `Busca RAG: ${resultados.length} resultados`
      );
    },
  });

  // =========================================================================
  // RESUMO DE DOCUMENTO
  // =========================================================================

  registerMcpPrompt({
    name: "resumir_documento",
    description: "Gera prompt para resumir um documento",
    arguments: z.object({
      documento_id: z.number().describe("ID do documento"),
      formato: z
        .enum(["curto", "detalhado", "topicos"])
        .default("detalhado")
        .describe("Formato do resumo"),
    }),
    handler: async (args) => {
      const { documento_id, formato } = args as {
        documento_id: number;
        formato: string;
      };

      // Obter userId do contexto de autenticação
      const { authenticateRequest } = await import("@/lib/auth/session");
      const user = await authenticateRequest();
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { buscarDocumento } = await import("@/app/(authenticated)/documentos/service");
      const doc = await buscarDocumento(documento_id, user.id);

      const formatoInstrucoes: Record<string, string> = {
        curto: "Faça um resumo conciso em no máximo 3 parágrafos.",
        detalhado:
          "Faça um resumo detalhado, incluindo todos os pontos importantes.",
        topicos: "Faça um resumo em formato de tópicos/bullet points.",
      };

      const systemPrompt = `Você é um assistente especializado em resumir documentos jurídicos.
Mantenha a precisão técnica e não omita informações relevantes.
${formatoInstrucoes[formato]}`;

      const conteudoTexto =
        typeof doc.conteudo === "string"
          ? doc.conteudo
          : JSON.stringify(doc.conteudo, null, 2).substring(0, 10000);

      const userPrompt = `Resuma o seguinte documento:

**Título**: ${doc.titulo}
**Tags**: ${doc.tags?.join(", ") || "Nenhuma"}

**Conteúdo**:
${conteudoTexto}`;

      return createPromptResult(
        systemPrompt,
        userPrompt,
        `Resumo de: ${doc.titulo}`
      );
    },
  });

  // =========================================================================
  // ANÁLISE FINANCEIRA
  // =========================================================================

  registerMcpPrompt({
    name: "analisar_financeiro",
    description: "Gera prompt para análise financeira",
    arguments: z.object({
      tipo: z
        .enum(["fluxo_caixa", "dre", "inadimplencia", "geral"])
        .describe("Tipo de análise"),
      periodo_inicio: z.string().describe("Data inicial (YYYY-MM-DD)"),
      periodo_fim: z.string().describe("Data final (YYYY-MM-DD)"),
    }),
    handler: async (args) => {
      const { tipo, periodo_inicio, periodo_fim } = args as {
        tipo: string;
        periodo_inicio: string;
        periodo_fim: string;
      };

      const systemPrompt = `Você é um analista financeiro especializado em escritórios de advocacia.
Analise os dados financeiros fornecidos e forneça insights acionáveis.
Identifique tendências, riscos e oportunidades de melhoria.
Use métricas e indicadores relevantes para o setor jurídico.`;

      const tipoInstrucoes: Record<string, string> = {
        fluxo_caixa:
          "Analise o fluxo de caixa, identificando padrões de entrada/saída e projetando necessidades futuras.",
        dre: "Analise a Demonstração de Resultado, identificando margens, custos principais e tendências de rentabilidade.",
        inadimplencia:
          "Analise a inadimplência, identificando padrões, riscos de crédito e sugestões de cobrança.",
        geral:
          "Faça uma análise financeira geral, cobrindo receitas, despesas, fluxo de caixa e indicadores de saúde financeira.",
      };

      const userPrompt = `Período: ${periodo_inicio} a ${periodo_fim}

${tipoInstrucoes[tipo]}

Por favor, forneça:
1. Resumo executivo
2. Principais indicadores
3. Análise de tendências
4. Riscos identificados
5. Recomendações de ação`;

      return createPromptResult(
        systemPrompt,
        userPrompt,
        `Análise ${tipo}: ${periodo_inicio} a ${periodo_fim}`
      );
    },
  });

  // =========================================================================
  // ASSISTENTE GERAL
  // =========================================================================

  registerMcpPrompt({
    name: "assistente_juridico",
    description: "Prompt base para assistente jurídico geral",
    arguments: z.object({
      pergunta: z.string().describe("Pergunta do usuário"),
      contexto_adicional: z.string().optional().describe("Contexto adicional"),
    }),
    handler: async (args) => {
      const { pergunta, contexto_adicional } = args as {
        pergunta: string;
        contexto_adicional?: string;
      };

      const systemPrompt = `Você é um assistente jurídico virtual do Synthropic, especializado em direito trabalhista brasileiro.

Suas capacidades incluem:
- Responder dúvidas sobre legislação trabalhista (CLT, súmulas, OJs)
- Auxiliar na análise de processos e documentos
- Sugerir estratégias processuais
- Calcular prazos e valores trabalhistas
- Explicar procedimentos judiciais

Diretrizes:
- Use linguagem clara e profissional
- Fundamente suas respostas na legislação vigente
- Quando apropriado, cite artigos de lei, súmulas ou OJs
- Se não souber algo com certeza, seja honesto sobre a limitação
- Sugira consultar um advogado para casos específicos complexos`;

      let userPrompt = pergunta;

      if (contexto_adicional) {
        userPrompt = `**Contexto**: ${contexto_adicional}\n\n**Pergunta**: ${pergunta}`;
      }

      return createPromptResult(systemPrompt, userPrompt);
    },
  });

  console.log("[MCP Prompts] Prompts registrados com sucesso");
}
