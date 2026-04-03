import { actionCarregarDashboard } from "@/app/portal/feature";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPortalPage() {
  let data = null;
  let error: string | undefined;

  try {
    data = await actionCarregarDashboard();
  } catch (e) {
    error = "Erro ao carregar dashboard";
    console.error("[Portal Dashboard]", e);
  }

  return <DashboardContent data={data} error={error} />;
}
