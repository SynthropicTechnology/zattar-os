import { actionBuscarProcessoPortal } from "../actions"
import { ProcessoDetalheContent } from "./processo-detalhe-content"

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const result = await actionBuscarProcessoPortal(decodedId)

  return <ProcessoDetalheContent processo={result.data} error={result.error} />
}
