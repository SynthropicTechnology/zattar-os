import { createClient } from '@/lib/supabase/server';
import { DifyConversation, DifyWorkflowExecution, DifyApp } from './domain';
import { Result, err, ok } from 'neverthrow';

export class DifyRepository {
  async salvarExecucaoWorkflow(data: Partial<DifyWorkflowExecution>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase.from('dify_execucoes').insert(data);
      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao salvar execução de workflow: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async atualizarExecucaoWorkflow(workflowRunId: string, data: Partial<DifyWorkflowExecution>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_execucoes')
        .update(data)
        .eq('workflow_run_id', workflowRunId);
      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao atualizar execução de workflow: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async salvarConversa(data: Partial<DifyConversation> & { usuario_id: string; app_key: string; conversation_id: string }): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      // Upsert para salvar ou atualizar se já existir
      const { error } = await supabase.from('dify_conversas').upsert(data, { onConflict: 'conversation_id' });
      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao salvar conversa Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async listarConversasUsuario(usuarioId: string): Promise<Result<DifyConversation[], Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_conversas')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return ok(data as unknown as DifyConversation[]);
    } catch (error: unknown) {
      return err(new Error(`Erro ao listar conversas do usuário: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async listDifyApps(): Promise<Result<DifyApp[], Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ok((data || []) as DifyApp[]);
    } catch (error: unknown) {
      return err(new Error(`Erro ao listar apps Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async getDifyApp(id: string): Promise<Result<DifyApp | null, Error>> {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('dify_apps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return ok(data as DifyApp | null);
    } catch (error: unknown) {
      return err(new Error(`Erro ao buscar app Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async getActiveDifyApp(type?: string): Promise<Result<DifyApp | null, Error>> {
    const supabase = await createClient();
    try {
      let query = supabase
        .from('dify_apps')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('app_type', type);
      }

      // Pega o primeiro ativo encontrado
      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;
      return ok(data as DifyApp | null);
    } catch (error: unknown) {
      return err(new Error(`Erro ao buscar app Dify ativo: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async createDifyApp(data: { name: string; api_url: string; api_key: string; app_type: string; is_active?: boolean }): Promise<Result<DifyApp, Error>> {
    const supabase = await createClient();
    try {
      const { data: newApp, error } = await supabase
        .from('dify_apps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return ok(newApp as DifyApp);
    } catch (error: unknown) {
      return err(new Error(`Erro ao criar app Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async updateDifyApp(id: string, data: Partial<{ name: string; api_url: string; api_key: string; app_type: string; is_active: boolean }>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_apps')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao atualizar app Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async updateDifyAppMetadata(id: string, metadata: Record<string, unknown>): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_apps')
        .update({
          metadata,
          metadata_updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao atualizar metadata do app Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }

  async deleteDifyApp(id: string): Promise<Result<void, Error>> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('dify_apps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new Error(`Erro ao deletar app Dify: ${error instanceof Error ? error.message : String(error)}`, { cause: error }));
    }
  }
}

export const difyRepository = new DifyRepository();
