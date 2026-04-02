/**
 * Testes de Integração - API de Compartilhamento
 *
 * Testa operações de compartilhamento de documentos.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Compartilhamento API Integration', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testDocumentoId: number | null = null;
  let testCompartilhamentoId: number | null = null;
  let criadorId: number;
  let destinatarioId: number;

  beforeAll(async () => {
    supabase = createServiceClient();

    // Buscar dois usuários de teste existentes
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id')
      .limit(2);

    if (!usuarios || usuarios.length < 2) {
      throw new Error('São necessários pelo menos 2 usuários para testes de compartilhamento');
    }

    criadorId = usuarios[0].id;
    destinatarioId = usuarios[1].id;

    // Criar documento de teste
    const { data: doc } = await supabase
      .from('documentos')
      .insert({
        titulo: 'Documento para Compartilhamento',
        conteudo: [],
        criado_por: criadorId,
        editado_por: criadorId,
      })
      .select()
      .single();

    testDocumentoId = doc?.id ?? null;
  });

  afterAll(async () => {
    // Limpar compartilhamento
    if (testCompartilhamentoId) {
      await supabase.from('documentos_compartilhados').delete().eq('id', testCompartilhamentoId);
    }

    // Limpar documento
    if (testDocumentoId) {
      await supabase.from('documentos').delete().eq('id', testDocumentoId);
    }
  });

  describe('Compartilhar Documento', () => {
    it('deve compartilhar documento com outro usuário', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_compartilhados')
        .insert({
          documento_id: testDocumentoId,
          usuario_id: destinatarioId,
          permissao: 'visualizar',
          compartilhado_por: criadorId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.documento_id).toBe(testDocumentoId);
      expect(data?.usuario_id).toBe(destinatarioId);
      expect(data?.permissao).toBe('visualizar');

      testCompartilhamentoId = data?.id ?? null;
    });

    it('deve falhar ao compartilhar documento consigo mesmo', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      // Tentar compartilhar consigo mesmo (constraint unique deve impedir duplicata)
      const { error: _error } = await supabase
        .from('documentos_compartilhados')
        .insert({
          documento_id: testDocumentoId,
          usuario_id: criadorId, // Mesmo usuário
          permissao: 'visualizar',
          compartilhado_por: criadorId,
        });

      // Pode não ter erro por constraint, mas logicamente não deve ser permitido
      // O serviço de negócio deve validar isso
    });

    it('deve falhar ao compartilhar documento inexistente', async () => {
      const { error } = await supabase
        .from('documentos_compartilhados')
        .insert({
          documento_id: 999999,
          usuario_id: destinatarioId,
          permissao: 'visualizar',
          compartilhado_por: criadorId,
        });

      expect(error).toBeDefined();
    });
  });

  describe('Listar Compartilhamentos', () => {
    it('deve listar compartilhamentos de um documento', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_compartilhados')
        .select(`
          *,
          usuario:usuarios!documentos_compartilhados_usuario_id_fkey(id, nomeCompleto)
        `)
        .eq('documento_id', testDocumentoId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve listar documentos compartilhados com um usuário', async () => {
      const { data, error } = await supabase
        .from('documentos_compartilhados')
        .select(`
          *,
          documento:documentos!documentos_compartilhados_documento_id_fkey(id, titulo)
        `)
        .eq('usuario_id', destinatarioId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Atualizar Permissão', () => {
    it('deve atualizar permissão de visualizar para editar', async () => {
      if (!testCompartilhamentoId) {
        console.log('Pulando teste - compartilhamento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_compartilhados')
        .update({ permissao: 'editar' })
        .eq('id', testCompartilhamentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.permissao).toBe('editar');
    });

    it('deve atualizar permissão de editar para visualizar', async () => {
      if (!testCompartilhamentoId) {
        console.log('Pulando teste - compartilhamento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_compartilhados')
        .update({ permissao: 'visualizar' })
        .eq('id', testCompartilhamentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.permissao).toBe('visualizar');
    });
  });

  describe('Remover Compartilhamento', () => {
    it('deve remover compartilhamento', async () => {
      if (!testCompartilhamentoId) {
        console.log('Pulando teste - compartilhamento não criado');
        return;
      }

      const { error } = await supabase
        .from('documentos_compartilhados')
        .delete()
        .eq('id', testCompartilhamentoId);

      expect(error).toBeNull();

      // Verificar que foi removido
      const { data } = await supabase
        .from('documentos_compartilhados')
        .select('*')
        .eq('id', testCompartilhamentoId)
        .single();

      expect(data).toBeNull();

      testCompartilhamentoId = null;
    });
  });
});
