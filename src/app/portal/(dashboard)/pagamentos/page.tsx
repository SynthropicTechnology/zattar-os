import { actionObterFinanceiroPortal } from "../financeiro/actions"
import { PagamentosContent } from "./pagamentos-content"

export default async function PagamentosPage() {
  const result = await actionObterFinanceiroPortal()

  return (
    <PagamentosContent
      pagamentos={result.data?.pagamentos ?? []}
      resumo={result.data?.resumo}
      error={result.success ? undefined : result.error}
    />
  )
}
