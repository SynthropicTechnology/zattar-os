/**
 * Registry de Resources MCP do Sinesys
 *
 * Registra todos os recursos acessíveis via MCP
 */

import { registerMcpResource, jsonResourceResult } from "./resources";
import type { Processo } from "@/app/(authenticated)/processos";
import type { Cliente } from "@/app/(authenticated)/partes";
import type { Contrato } from "@/app/(authenticated)/contratos";
import type { Audiencia } from "@/app/(authenticated)/audiencias";

/**
 * Registra todos os resources disponíveis
 */
export async function registerAllResources(): Promise<void> {
  console.log("[MCP Resources] Iniciando registro de resources...");

  // =========================================================================
  // DOCUMENTOS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://documentos/{id}",
    name: "Documento",
    description: "Acessa conteúdo de documento Plate.js",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      // Obter userId do contexto de autenticação
      const { authenticateRequest } = await import("@/lib/auth/session");
      const user = await authenticateRequest();
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Import dinâmico para evitar dependências circulares
      const { buscarDocumento } = await import("@/app/(authenticated)/documentos/service");

      const doc = await buscarDocumento(id, user.id);

      return jsonResourceResult(uri, doc.conteudo, {
        titulo: doc.titulo,
        versao: doc.versao,
        tags: doc.tags,
        criado_em: doc.created_at,
        atualizado_em: doc.updated_at,
      });
    },
  });

  // =========================================================================
  // PROCESSOS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://processos/{id}",
    name: "Processo",
    description: "Acessa dados completos de processo",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarProcesso } = await import(
        "@/app/(authenticated)/processos/actions"
      );

      const result = await actionBuscarProcesso(id);

      if (!result.success || !result.data) {
        throw new Error(`Processo ${id} não encontrado`);
      }

      const processo = result.data as Processo;
      return jsonResourceResult(uri, processo, {
        numero: processo.numeroProcesso,
        trt: processo.trt,
        grau: processo.grau,
        status: processo.status,
      });
    },
  });

  // =========================================================================
  // CLIENTES
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://clientes/{id}",
    name: "Cliente",
    description: "Acessa dados de cliente",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarCliente } = await import("@/app/(authenticated)/partes/server");

      const result = await actionBuscarCliente(id);

      if (!result.success || !result.data) {
        throw new Error(`Cliente ${id} não encontrado`);
      }

      const cliente = result.data as Cliente;
      const documento =
        cliente.tipo_pessoa === "pf" ? cliente.cpf : cliente.cnpj;
      return jsonResourceResult(uri, cliente, {
        nome: cliente.nome,
        documento: documento || "",
        tipo: cliente.tipo_pessoa,
      });
    },
  });

  // =========================================================================
  // CONTRATOS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://contratos/{id}",
    name: "Contrato",
    description: "Acessa dados de contrato",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarContrato } = await import("@/app/(authenticated)/contratos");

      const result = await actionBuscarContrato(id);

      if (!result.success || !result.data) {
        throw new Error(`Contrato ${id} não encontrado`);
      }

      const contrato = result.data as Contrato;
      return jsonResourceResult(uri, contrato, {
        tipo: contrato.tipoContrato,
        status: contrato.status,
        cliente_id: contrato.clienteId,
      });
    },
  });

  // =========================================================================
  // EXPEDIENTES
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://expedientes/{id}",
    name: "Expediente",
    description: "Acessa dados de expediente/prazo",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { buscarExpediente } = await import(
        "@/app/(authenticated)/expedientes/service"
      );

      const result = await buscarExpediente(id);

      if (!result.success || !result.data) {
        throw new Error(`Expediente ${id} não encontrado`);
      }

      const expediente = result.data;
      return jsonResourceResult(uri, expediente, {
        numero_processo: expediente.numeroProcesso,
        prazo: expediente.dataPrazoLegalParte,
      });
    },
  });

  // =========================================================================
  // AUDIÊNCIAS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://audiencias/{id}",
    name: "Audiência",
    description: "Acessa dados de audiência",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarAudienciaPorId } = await import(
        "@/app/(authenticated)/audiencias/actions"
      );

      const result = await actionBuscarAudienciaPorId(id);

      if (!result.success || !result.data) {
        throw new Error(`Audiência ${id} não encontrada`);
      }

      const audiencia = result.data as Audiencia;
      return jsonResourceResult(uri, audiencia, {
        data: audiencia.dataInicio,
        tipo: audiencia.tipoAudienciaId,
        status: audiencia.status,
      });
    },
  });

  // =========================================================================
  // LANÇAMENTOS FINANCEIROS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://lancamentos/{id}",
    name: "Lançamento Financeiro",
    description: "Acessa dados de lançamento financeiro",
    mimeType: "application/json",
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarLancamento } = await import(
        "@/app/(authenticated)/financeiro/actions"
      );

      const result = await actionBuscarLancamento(id);

      if (!result.success || !result.data) {
        throw new Error(`Lançamento ${id} não encontrado`);
      }

      const lancamento = result.data;
      return jsonResourceResult(uri, lancamento, {
        tipo: lancamento.tipo,
        valor: lancamento.valor,
        status: lancamento.status,
        vencimento: lancamento.dataVencimento,
      });
    },
  });

  // =========================================================================
  // LISTAGENS
  // =========================================================================

  registerMcpResource({
    uri: "sinesys://processos",
    name: "Lista de Processos",
    description: "Lista processos ativos",
    mimeType: "application/json",
    handler: async (uri) => {
      const { actionListarProcessos } = await import(
        "@/app/(authenticated)/processos/actions"
      );

      const result = await actionListarProcessos({ limite: 50 });

      if (!result.success || !result.data) {
        throw new Error("Erro ao listar processos");
      }

      const data = result.data as {
        data?: unknown[];
        pagination?: { total: number };
      };
      return jsonResourceResult(uri, data.data || result.data, {
        total: data.pagination?.total || 0,
      });
    },
  });

  registerMcpResource({
    uri: "sinesys://clientes",
    name: "Lista de Clientes",
    description: "Lista clientes cadastrados",
    mimeType: "application/json",
    handler: async (uri) => {
      const { actionListarClientes } = await import("@/app/(authenticated)/partes/server");

      const result = await actionListarClientes({ limite: 50 });

      if (!result.success || !result.data) {
        throw new Error("Erro ao listar clientes");
      }

      const data = result.data as {
        data?: unknown[];
        pagination?: { total: number };
      };
      return jsonResourceResult(uri, data.data || result.data, {
        total: data.pagination?.total || 0,
      });
    },
  });

  console.log("[MCP Resources] Resources registrados com sucesso");
}
