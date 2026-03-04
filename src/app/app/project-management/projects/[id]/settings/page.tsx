import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import * as projectService from "../../../lib/services/project.service";
import { SettingsView } from "./settings-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success
    ? `Configurações — ${result.data.nome}`
    : "Configurações";
  return generateMeta({
    title,
    canonical: `/app/project-management/projects/${id}/settings`,
  });
}

export default async function ProjectSettingsPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  if (!result.success) notFound();

  return <SettingsView projetoId={id} />;
}
