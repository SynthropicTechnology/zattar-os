import { actionBuscarProcessoPortal } from "../../actions"
import { TimelineContent } from "./timeline-content"

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const result = await actionBuscarProcessoPortal(decodedId)

  return <TimelineContent processo={result.data} error={result.error} />
}
