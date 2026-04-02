import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { PageShell } from "@/components/shared/page-shell";
import { actionObterMetricasDB } from "@/app/app/admin";
import { MetricasDBContent } from "./components/metricas-db-content";

export default async function MetricasDBPage() {
  const result = await actionObterMetricasDB();

  if (!result.success) {
    if (result.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <PageShell title="Métricas do Banco de Dados">
        <div className="text-destructive">{result.error || "Erro ao carregar métricas"}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {result.data && <MetricasDBContent metricas={result.data} />}
    </PageShell>
  );
}
