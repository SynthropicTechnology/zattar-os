import { PageShell } from "@/components/shared/page-shell"
import { actionListarProcessosPortal } from "./actions"
import { ProcessosContent } from "./processos-content"

export default async function ProcessosPage() {
  const result = await actionListarProcessosPortal()

  return (
    <PageShell title="Meus Processos">
      <ProcessosContent
        processos={result.success ? result.data : undefined}
        error={result.success ? undefined : result.error}
      />
    </PageShell>
  )
}
