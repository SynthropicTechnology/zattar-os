import { actionListarContratos, type Contrato } from "@/app/(authenticated)/contratos";
import type { CrmDateFilter } from "../crm-date-filter";
import { RecentContractsCard, type RecentContractRow } from "./recent-contracts";

function getClienteDisplay(contrato: Contrato): string {
  const clienteParte = contrato.partes?.find((p) => p.tipoEntidade === "cliente") ?? null;
  return clienteParte?.nomeSnapshot || `Cliente #${contrato.clienteId}`;
}

export async function RecentContractsCardWrapper({ dateFilter }: { dateFilter: CrmDateFilter }) {
  const result = await actionListarContratos({
    pagina: 1,
    limite: 100,
    ordenarPor: "created_at",
    ordem: "desc",
    ...(dateFilter.mode === "range"
      ? { dataInicio: dateFilter.from.toISOString(), dataFim: dateFilter.to.toISOString() }
      : {}),
  });

  const rows: RecentContractRow[] =
    result.success && result.data
      ? ((result.data as { data: Contrato[] }).data || []).map((c) => ({
          id: c.id,
          cliente: getClienteDisplay(c),
          status: c.status,
          tipoContrato: c.tipoContrato,
          cadastradoEm: c.cadastradoEm || c.createdAt,
        }))
      : [];

  return <RecentContractsCard data={rows} />;
}


