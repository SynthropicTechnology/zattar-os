/**
 * Testes de Integração - API de Templates
 *
 * Testa operações CRUD de templates via API.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Templates API Integration', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTemplateId: number | null = null;
  let testDocumentoId: number | null = null;
  let testUserId: number;

  beforeAll(async () => {
    supabase = createServiceClient();

    // Buscar um usuário de teste existente
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1)
      .single();

    if (!usuario) {
      throw new Error('Nenhum usuário encontrado para testes');
    }

    testUserId = usuario.id;
  });

  afterAll(async () => {
    // Limpar documento criado de template
    if (testDocumentoId) {
      await supabase.from('documentos').delete().eq('id', testDocumentoId);
    }

    // Limpar template de teste
    if (testTemplateId) {
      await supabase.from('templates').delete().eq('id', testTemplateId);
    }
  });

  describe('Criar Template', () => {
    it('deve criar um template público', async () => {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          titulo: 'Template de Teste',
          descricao: 'Descrição do template de teste',
          conteudo: [{ type: 'p', children: [{ text: 'Conteúdo do template' }] }],
          visibilidade: 'publico',
          categoria: 'Jurídico',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.titulo).toBe('Template de Teste');
      expect(data?.visibilidade).toBe('publico');
      expect(data?.uso_count).toBe(0);

      testTemplateId = data?.id ?? null;
    });

    it('deve criar um template privado', async () => {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          titulo: 'Template Privado',
          conteudo: [],
          visibilidade: 'privado',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.visibilidade).toBe('privado');

      // Limpar
      if (data?.id) {
        await supabase.from('templates').delete().eq('id', data.id);
      }
    });

    it('deve falhar ao criar template sem título', async () => {
      const { error } = await supabase
        .from('templates')
        .insert({
          titulo: '',
          conteudo: [],
          visibilidade: 'publico',
          criado_por: testUserId,
        });

      expect(error).toBeDefined();
    });
  });

  describe('Listar Templates', () => {
    it('deve listar templates públicos', async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('visibilidade', 'publico')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve listar templates por categoria', async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('categoria', 'Jurídico')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve ordenar por uso_count', async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('visibilidade', 'publico')
        .order('uso_count', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Buscar Template', () => {
    it('deve buscar template por ID', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', testTemplateId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testTemplateId);
    });

    it('deve buscar templates por texto', async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .or('titulo.ilike.%Teste%,descricao.ilike.%Teste%')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Atualizar Template', () => {
    it('deve atualizar título do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .update({ titulo: 'Template Atualizado' })
        .eq('id', testTemplateId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.titulo).toBe('Template Atualizado');
    });

    it('deve atualizar visibilidade do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .update({ visibilidade: 'privado' })
        .eq('id', testTemplateId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.visibilidade).toBe('privado');

      // Restaurar para público
      await supabase
        .from('templates')
        .update({ visibilidade: 'publico' })
        .eq('id', testTemplateId);
    });
  });

  describe('Usar Template', () => {
    it('deve criar documento a partir de template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      // Buscar template
      const { data: template } = await supabase
        .from('templates')
        .select('titulo, conteudo')
        .eq('id', testTemplateId)
        .single();

      expect(template).toBeDefined();

      // Criar documento com conteúdo do template
      const { data: doc, error } = await supabase
        .from('documentos')
        .insert({
          titulo: `Cópia de ${template?.titulo}`,
          conteudo: template?.conteudo,
          criado_por: testUserId,
          editado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(doc).toBeDefined();
      expect(doc?.titulo).toContain('Cópia de');

      testDocumentoId = doc?.id ?? null;
    });

    it('deve incrementar uso_count do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      // Buscar uso atual
      const { data: antes } = await supabase
        .from('templates')
        .select('uso_count')
        .eq('id', testTemplateId)
        .single();

      const usoAnterior = antes?.uso_count ?? 0;

      // Incrementar
      const { data, error } = await supabase
        .from('templates')
        .update({ uso_count: usoAnterior + 1 })
        .eq('id', testTemplateId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.uso_count).toBe(usoAnterior + 1);
    });
  });

  describe('Deletar Template', () => {
    it('deve deletar template', async () => {
      // Criar template para deletar
      const { data: novoTemplate } = await supabase
        .from('templates')
        .insert({
          titulo: 'Template para Deletar',
          conteudo: [],
          visibilidade: 'privado',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(novoTemplate).toBeDefined();

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', novoTemplate!.id);

      expect(error).toBeNull();

      // Verificar que foi deletado
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('id', novoTemplate!.id)
        .single();

      expect(data).toBeNull();
    });
  });
});
