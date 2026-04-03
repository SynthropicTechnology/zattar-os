import { PageShell } from "@/components/shared/page-shell"
import { actionListarContratosPortal } from "./actions"
import { ContratosContent } from "./contratos-content"

export default async function ContratosPage() {
  const result = await actionListarContratosPortal()

  return (
    <PageShell title="Contratos">
      <ContratosContent
        contratos={result.success ? result.data : undefined}
        error={result.success ? undefined : result.error}
      />
    </PageShell>
  )
}
