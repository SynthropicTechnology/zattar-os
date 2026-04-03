import { actionContarClientesPorEstado } from "@/app/(authenticated)/partes/server-actions";
import { LeadBySourceCard } from "./leads-by-source";
import type { CrmDateFilter } from "../crm-date-filter";
import { toCrmDateFilterInput } from "../crm-date-filter";

export async function LeadBySourceCardWrapper({ dateFilter }: { dateFilter: CrmDateFilter }) {
  const result = await actionContarClientesPorEstado(4, toCrmDateFilterInput(dateFilter));

  return (
    <LeadBySourceCard 
      data={result.success ? result.data : undefined}
      error={result.success ? undefined : result.error}
    />
  );
}

