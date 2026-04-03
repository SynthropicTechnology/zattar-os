"use server";

import { cookies } from "next/headers";
import { listarAudienciasPorBuscaCpf } from "@/app/(authenticated)/audiencias/service";
import { StatusAudiencia } from "@/app/(authenticated)/audiencias";
import type { Audiencia } from "@/app/(authenticated)/audiencias";
import type { AudienciaPortal, StatusAudienciaPortal } from "./domain";

function mapStatus(status: string): StatusAudienciaPortal {
  switch (status) {
    case StatusAudiencia.Marcada:
      return "Agendada";
    case StatusAudiencia.Finalizada:
      return "Realizada";
    case StatusAudiencia.Cancelada:
      return "Adiada";
    default:
      return "Agendada";
  }
}

function formatDataHora(
  dataInicio: string,
  horaInicio: string | null
): string {
  const date = new Date(dataInicio);
  const dia = date.getDate().toString().padStart(2, "0");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();

  if (horaInicio) {
    return `${dia} ${mes} ${ano}, ${horaInicio.substring(0, 5)}`;
  }
  return `${dia} ${mes} ${ano}`;
}

function formatLocal(audiencia: Audiencia): string {
  if (audiencia.salaAudienciaNome) return audiencia.salaAudienciaNome;
  if (audiencia.enderecoPresencial) {
    const e = audiencia.enderecoPresencial;
    return `${e.logradouro}, ${e.numero} — ${e.cidade}/${e.uf}`;
  }
  if (
    audiencia.modalidade === "virtual" &&
    audiencia.urlAudienciaVirtual
  ) {
    return "Videoconferência";
  }
  return "A definir";
}

function formatVara(audiencia: Audiencia): string {
  const tribunal = audiencia.trt || "";
  return tribunal ? `${tribunal}` : "Tribunal não informado";
}

export async function actionListarAudienciasPortal(): Promise<{
  success: boolean;
  data: AudienciaPortal[];
  error?: string;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal-cpf-session")?.value;
  if (!session) return { success: false, data: [], error: "Sessão inválida" };

  try {
    const { cpf } = JSON.parse(session);
    const audiencias = await listarAudienciasPorBuscaCpf(cpf);

    const mapped: AudienciaPortal[] = audiencias.map((a) => ({
      id: a.id,
      processo: a.numeroProcesso,
      vara: formatVara(a),
      dataHora: formatDataHora(a.dataInicio, a.horaInicio),
      local: formatLocal(a),
      tipo: a.tipoDescricao || "Audiência",
      status: mapStatus(a.status),
      modalidade: a.modalidade,
      urlVirtual: a.urlAudienciaVirtual,
    }));

    // Sort: upcoming first (Agendada), then by date
    mapped.sort((a, b) => {
      if (a.status === "Agendada" && b.status !== "Agendada") return -1;
      if (a.status !== "Agendada" && b.status === "Agendada") return 1;
      return 0;
    });

    return { success: true, data: mapped };
  } catch (error) {
    console.error("[Portal] Erro ao listar audiências:", error);
    return { success: false, data: [], error: "Erro ao carregar audiências" };
  }
}
