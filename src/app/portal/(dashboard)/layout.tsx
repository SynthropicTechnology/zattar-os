import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PortalShell } from "@/app/portal/feature"

export default async function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get("portal-cpf-session")?.value

  if (!session) {
    redirect("/portal")
  }

  let clientName = "Cliente"
  try {
    const parsed = JSON.parse(session)
    clientName = parsed.nome || "Cliente"
  } catch {
    redirect("/portal")
  }

  return <PortalShell clientName={clientName}>{children}</PortalShell>
}
