import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PortalShell } from "@/app/portal/feature"

// Toda a árvore (dashboard) depende do cookie de sessão do portal — força renderização
// dinâmica para evitar erros de "Dynamic server usage" durante a coleta de SSG no build.
export const dynamic = "force-dynamic"

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
