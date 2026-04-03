"use server";

import { cookies } from "next/headers";
import { obterDashboardCliente } from "../service";
import { validarCpf } from "../utils";
import { redirect } from "next/navigation";
import { buscarClientePorDocumento } from "@/app/(authenticated)/partes/server";

export type PortalLoginResult = { success: boolean; error?: string };

export async function validarCpfESetarSessao(
  cpf: string
): Promise<PortalLoginResult> {
  const validacao = validarCpf(cpf);
  if (!validacao.valido) {
    console.error('[Portal] CPF inválido (falhou na validação de dígitos):', validacao.erro, 'CPF digitado:', cpf, 'CPF normalizado:', validacao.cpfLimpo);
    return { success: false, error: 'CPF inválido. Verifique os números digitados.' };
  }

  console.log('[Portal] CPF válido, buscando cliente:', validacao.cpfLimpo);

  let result;
  try {
    result = await buscarClientePorDocumento(validacao.cpfLimpo);
  } catch (e) {
    console.error('[Portal] Erro ao buscar cliente por documento:', e, validacao.cpfLimpo);
    return { success: false, error: 'Erro ao buscar cliente: ' + (e instanceof Error ? e.message : String(e)) };
  }
  if (!result.success) {
    const errorMsg = result.error?.message || result.error || 'Cliente não encontrado';
    console.warn('[Portal] Cliente não encontrado no banco de dados. CPF:', validacao.cpfLimpo, 'Erro:', errorMsg);
    return { success: false, error: 'CPF não cadastrado no sistema. Entre em contato com o escritório.' };
  }
  if (!result.data) {
    console.warn('[Portal] Cliente não encontrado no banco de dados. CPF:', validacao.cpfLimpo);
    return { success: false, error: 'CPF não cadastrado no sistema. Entre em contato com o escritório.' };
  }
  const cliente = result.data;
  console.log('[Portal] Cliente encontrado:', cliente.nome, 'CPF:', validacao.cpfLimpo);

  // Set cookie de sessão sem 'expires' no payload, usando maxAge do cookie
  (await cookies()).set(
    "portal-cpf-session",
    JSON.stringify({
      cpf: validacao.cpfLimpo,
      nome: cliente.nome,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    }
  );

  return { success: true };
}

/**
 * Action chamada pelo formulário de login.
 * Em caso de sucesso, realiza o redirect (não retorna valor).
 * Em caso de erro, retorna objecto de erro.
 */
export async function actionLoginPortal(
  cpf: string
): Promise<PortalLoginResult | void> {
  const result = await validarCpfESetarSessao(cpf);

  if (!result.success) {
    return result;
  }

  redirect("/portal/processos");
}

export async function actionValidarCpf(cpf: string) {
  // Mantida para compatibilidade ou uso direto sem redirect, mas recomenda-se usar actionLoginPortal
  return validarCpfESetarSessao(cpf);
}

export async function actionCarregarDashboard() {
  const session = (await cookies()).get("portal-cpf-session")?.value;
  if (!session) throw new Error("Sessão inválida");
  // Payload não tem mais 'expires'
  const { cpf } = JSON.parse(session);
  return obterDashboardCliente(cpf);
}

export async function actionLogout() {
  (await cookies()).delete("portal-cpf-session");
  (await cookies()).delete("portal_session");
  redirect("/portal");
}
