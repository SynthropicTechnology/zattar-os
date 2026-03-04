import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as dashboardService from "./lib/services/dashboard.service";
import * as projectService from "./lib/services/project.service";
import * as reminderService from "./lib/services/reminder.service";
import {
  SummaryCards,
  ChartProjectOverview,
  ChartProjectEfficiency,
  TableRecentProjects,
  Reminders,
  SuccessMetrics,
  AchievementByYear,
  Reports,
} from "./components/dashboard";

export async function generateMetadata() {
  return generateMeta({
    title: "Gestão de Projetos",
    description:
      "Painel de gestão de projetos com métricas, tarefas e acompanhamento de equipe.",
    canonical: "/app/project-management",
  });
}

export default async function ProjectManagementDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    resumoResult,
    projetosPeriodoResult,
    distribuicaoResult,
    comparativoResult,
    membrosResult,
    projetosResult,
    lembretesResult,
  ] = await Promise.all([
    dashboardService.obterResumo(),
    dashboardService.obterProjetosPorPeriodo(12),
    dashboardService.obterDistribuicaoPorStatus(),
    dashboardService.obterComparativoAnual(),
    dashboardService.obterMembrosAtivos(6),
    projectService.listarProjetos({ limite: 50, ordenarPor: "created_at", ordem: "desc" }),
    reminderService.listarLembretes(user.id, { concluido: false, limite: 10 }),
  ]);

  const resumo = resumoResult.success ? resumoResult.data : {
    projetosAtivos: 0,
    projetosAtivosVariacao: 0,
    tarefasPendentes: 0,
    tarefasPendentesVariacao: 0,
    horasRegistradas: 0,
    horasRegistradasVariacao: 0,
    taxaConclusao: 0,
    taxaConclusaoVariacao: 0,
  };
  const projetosPeriodo = projetosPeriodoResult.success ? projetosPeriodoResult.data : [];
  const distribuicao = distribuicaoResult.success ? distribuicaoResult.data : [];
  const comparativo = comparativoResult.success ? comparativoResult.data : [];
  const membros = membrosResult.success ? membrosResult.data : [];
  const projetos = projetosResult.success ? projetosResult.data.data : [];
  const lembretes = lembretesResult.success ? lembretesResult.data : [];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestão de Projetos
        </h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="z-10">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SummaryCards data={resumo} />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartProjectOverview data={projetosPeriodo} />
            </div>
            <SuccessMetrics membros={membros} resumo={resumo} />
          </div>

          <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-4">
            <Reminders lembretes={lembretes} />
            <AchievementByYear data={comparativo} />
            <ChartProjectEfficiency data={distribuicao} />
          </div>

          <TableRecentProjects projetos={projetos} />
        </TabsContent>

        <TabsContent value="reports">
          <Reports projetos={projetos} />
        </TabsContent>
      </Tabs>
    </>
  );
}
