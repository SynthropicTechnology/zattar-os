import { actionObterFinanceiroPortal } from "./actions"
import { FinanceiroContent } from "./financeiro-content"

export default async function FinanceiroPage() {
  const result = await actionObterFinanceiroPortal()

  return (
    <FinanceiroContent
      data={result.data}
      error={result.success ? undefined : result.error}
    />
  )
}
