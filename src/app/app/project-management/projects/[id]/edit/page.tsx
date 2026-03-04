import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import { createDbClient } from "@/lib/supabase";
import * as projectService from "../../../lib/services/project.service";
import { ProjectForm } from "../../../components/projects/project-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success ? `Editar — ${result.data.nome}` : "Editar Projeto";
  return generateMeta({
    title,
    canonical: `/app/project-management/projects/${id}/edit`,
  });
}

async function fetchFormOptions() {
  const db = createDbClient();

  const [clientesRes, usuariosRes] = await Promise.all([
    db.from("clientes").select("id, nome").order("nome"),
    db
      .from("usuarios")
      .select("id, nome_completo")
      .eq("ativo", true)
      .order("nome_completo"),
  ]);

  const clientes = (clientesRes.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.nome as string,
  }));

  const usuarios = (usuariosRes.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.nome_completo as string,
  }));

  return { clientes, usuarios };
}

export default async function EditProjectPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projetoResult, { clientes, usuarios }] = await Promise.all([
    projectService.buscarProjeto(id),
    fetchFormOptions(),
  ]);

  if (!projetoResult.success) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ProjectForm
        projeto={projetoResult.data}
        clientes={clientes}
        usuarios={usuarios}
        usuarioAtualId={user.id}
      />
    </div>
  );
}
