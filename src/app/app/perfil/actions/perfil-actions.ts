"use server";

import { createClient } from "@/lib/supabase/server";
// FSD: server-only action — intentional deep import to avoid bundling Redis/Node.js deps in client barrel
import { service as usuariosService } from "@/app/app/usuarios/service";
import { revalidatePath } from "next/cache";
import type { Usuario, UsuarioDados } from "@/app/app/usuarios";

export async function actionObterPerfil(): Promise<
  { success: true; data: Usuario & { podeGerenciarPermissoes: boolean } } | { success: false; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const { data: usuarioDb, error: dbError } = await supabase
      .from("usuarios")
      .select("*, cargos!cargo_id(id, nome, descricao, ativo)")
      .eq("auth_user_id", user.id)
      .single();

    if (dbError || !usuarioDb) {
      return { success: false, error: "Perfil não encontrado" };
    }

    // Buscar permissões do usuário
    const { data: permissoes } = await supabase
      .from("permissoes_usuarios")
      .select("permissao")
      .eq("usuario_id", usuarioDb.id);

    const permissoesArray = permissoes?.map((p) => p.permissao) || [];
    const podeGerenciarPermissoes = permissoesArray.includes(
      "usuarios:gerenciar_permissoes"
    );

    // Converter para formato Usuario
    const usuario: Usuario & { podeGerenciarPermissoes: boolean } = {
      id: usuarioDb.id,
      authUserId: usuarioDb.auth_user_id,
      nomeCompleto: usuarioDb.nome_completo,
      nomeExibicao: usuarioDb.nome_exibicao,
      cpf: usuarioDb.cpf,
      rg: usuarioDb.rg,
      dataNascimento: usuarioDb.data_nascimento,
      genero: usuarioDb.genero,
      oab: usuarioDb.oab,
      ufOab: usuarioDb.uf_oab,
      emailPessoal: usuarioDb.email_pessoal,
      emailCorporativo: usuarioDb.email_corporativo,
      telefone: usuarioDb.telefone,
      ramal: usuarioDb.ramal,
      endereco: usuarioDb.endereco,
      cargoId: usuarioDb.cargo_id,
      cargo: usuarioDb.cargos
        ? {
            id: usuarioDb.cargos.id,
            nome: usuarioDb.cargos.nome,
            descricao: usuarioDb.cargos.descricao,
          }
        : null,
      avatarUrl: (usuarioDb.avatar_url as string | null) ?? null,
      coverUrl: (usuarioDb.cover_url as string | null) ?? null,
      isSuperAdmin: usuarioDb.is_super_admin,
      ativo: usuarioDb.ativo,
      createdAt: usuarioDb.created_at,
      updatedAt: usuarioDb.updated_at,
      podeGerenciarPermissoes, // Incluir permissão
    };

    return { success: true, data: usuario };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao obter perfil",
    };
  }
}

export async function actionAtualizarPerfil(dados: Partial<UsuarioDados>) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Buscar ID do usuário
    const { data: usuarioDb } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!usuarioDb) {
      return { success: false, error: "Perfil não encontrado" };
    }

    // Atualizar usando o service
    const result = await usuariosService.atualizarUsuario(usuarioDb.id, dados);

    if (result.sucesso) {
      revalidatePath("/app/perfil");
    }

    return {
      success: result.sucesso,
      data: result.usuario,
      error: result.erro,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar perfil",
    };
  }
}
