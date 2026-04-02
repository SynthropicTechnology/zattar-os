import { buscarProcessosClientePorCpf } from "@/features/acervo/service";
import { listarContratosPorClienteId } from "@/features/contratos";
import { listarAudienciasPorBuscaCpf } from "@/features/audiencias/service";
import { listarAcordosPorBuscaCpf } from "@/features/obrigacoes/service";
import { buscarClientePorDocumento } from "@/app/app/partes/server";
import { DashboardData, ContratoPortal, AudienciaPortal, PagamentoPortal } from "./types";

/** Serializa erro de forma segura (Supabase errors são objetos, não Error instances) */
function serializeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    if ('message' in e && typeof (e as { message: unknown }).message === 'string') {
      return (e as { message: string }).message;
    }
    try {
      return JSON.stringify(e);
    } catch {
      return '[Erro não serializável]';
    }
  }
  return String(e);
}

export async function obterDashboardCliente(
  cpf: string
): Promise<DashboardData> {
  const cpfLimpo = cpf.replace(/\D/g, "");

  // 1. Buscar dados do cliente (principalmente ID)
  const clienteResult = await buscarClientePorDocumento(cpfLimpo);
  if (!clienteResult.success || !clienteResult.data) {
    throw new Error("Cliente não encontrado");
  }
  const cliente = clienteResult.data;

  // 2. Buscar Processos (Acervo)
  const processosResponse = await buscarProcessosClientePorCpf(cpfLimpo);
  const processos = (processosResponse.success && processosResponse.data?.processos)
    ? processosResponse.data.processos
    : [];

  // 3. Buscar Contratos, Audiencias e Pagamentos usando helpers
  let contratos: ContratoPortal[] = [];
  let audiencias: AudienciaPortal[] = [];
  let pagamentos: PagamentoPortal[] = [];
  const errors: Record<string, string> = {};

  try {
    [contratos, audiencias, pagamentos] = await Promise.all([
      listarContratosPorClienteId(cliente.id).catch(e => {
        const errorMsg = serializeError(e);
        console.error('[Portal] Erro ao buscar contratos:', errorMsg);
        errors.contratos = errorMsg || 'Erro ao carregar contratos';
        return [];
      }),
      listarAudienciasPorBuscaCpf(cpfLimpo).catch(e => {
        const errorMsg = serializeError(e);
        console.error('[Portal] Erro ao buscar audiências:', errorMsg);
        errors.audiencias = errorMsg || 'Erro ao carregar audiências';
        return [];
      }),
      listarAcordosPorBuscaCpf(cpfLimpo).catch(e => {
        const errorMsg = serializeError(e);
        console.error('[Portal] Erro ao buscar pagamentos:', errorMsg);
        errors.pagamentos = errorMsg || 'Erro ao carregar pagamentos';
        return [];
      }),
    ]);
  } catch (e) {
    console.error('[Portal] Erro ao buscar dados complementares:', serializeError(e));
    contratos = [];
    audiencias = [];
    pagamentos = [];
  }

  return {
    cliente: { nome: cliente.nome, cpf: cliente.cpf || cpfLimpo },
    processos,
    contratos,
    audiencias,
    pagamentos,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
