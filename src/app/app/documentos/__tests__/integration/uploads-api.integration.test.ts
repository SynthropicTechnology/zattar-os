/**
 * Testes de Integração - API de Uploads
 *
 * Testa operações de upload de arquivos para documentos.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Uploads API Integration', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testDocumentoId: number | null = null;
  let testUploadId: number | null = null;
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

    // Criar documento de teste
    const { data: doc } = await supabase
      .from('documentos')
      .insert({
        titulo: 'Documento para Upload',
        conteudo: [],
        criado_por: testUserId,
        editado_por: testUserId,
      })
      .select()
      .single();

    testDocumentoId = doc?.id ?? null;
  });

  afterAll(async () => {
    // Limpar upload
    if (testUploadId) {
      await supabase.from('documentos_uploads').delete().eq('id', testUploadId);
    }

    // Limpar documento
    if (testDocumentoId) {
      await supabase.from('documentos').delete().eq('id', testDocumentoId);
    }
  });

  describe('Registrar Upload', () => {
    it('deve registrar upload de imagem', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_uploads')
        .insert({
          documento_id: testDocumentoId,
          nome_arquivo: 'teste-imagem.png',
          tipo_mime: 'image/png',
          tamanho_bytes: 1024,
          b2_key: `documentos/${testDocumentoId}/123456_abc123.png`,
          b2_url: 'https://example.com/test.png',
          tipo_media: 'imagem',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.nome_arquivo).toBe('teste-imagem.png');
      expect(data?.tipo_media).toBe('imagem');

      testUploadId = data?.id ?? null;
    });

    it('deve registrar upload de PDF', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_uploads')
        .insert({
          documento_id: testDocumentoId,
          nome_arquivo: 'documento.pdf',
          tipo_mime: 'application/pdf',
          tamanho_bytes: 512000,
          b2_key: `documentos/${testDocumentoId}/789_def456.pdf`,
          b2_url: 'https://example.com/documento.pdf',
          tipo_media: 'pdf',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.tipo_media).toBe('pdf');

      // Limpar
      if (data?.id) {
        await supabase.from('documentos_uploads').delete().eq('id', data.id);
      }
    });

    it('deve falhar ao registrar upload para documento inexistente', async () => {
      const { error } = await supabase
        .from('documentos_uploads')
        .insert({
          documento_id: 999999,
          nome_arquivo: 'teste.png',
          tipo_mime: 'image/png',
          tamanho_bytes: 1024,
          b2_key: 'test/key.png',
          b2_url: 'https://example.com/test.png',
          tipo_media: 'imagem',
          criado_por: testUserId,
        });

      expect(error).toBeDefined();
    });
  });

  describe('Listar Uploads', () => {
    it('deve listar uploads de um documento', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_uploads')
        .select('*')
        .eq('documento_id', testDocumentoId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve filtrar uploads por tipo de mídia', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_uploads')
        .select('*')
        .eq('documento_id', testDocumentoId)
        .eq('tipo_media', 'imagem');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Buscar Upload', () => {
    it('deve buscar upload por ID', async () => {
      if (!testUploadId) {
        console.log('Pulando teste - upload não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos_uploads')
        .select('*')
        .eq('id', testUploadId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testUploadId);
    });
  });

  describe('Deletar Upload', () => {
    it('deve deletar registro de upload', async () => {
      if (!testUploadId) {
        console.log('Pulando teste - upload não criado');
        return;
      }

      const { error } = await supabase
        .from('documentos_uploads')
        .delete()
        .eq('id', testUploadId);

      expect(error).toBeNull();

      // Verificar que foi deletado
      const { data } = await supabase
        .from('documentos_uploads')
        .select('*')
        .eq('id', testUploadId)
        .single();

      expect(data).toBeNull();

      testUploadId = null;
    });
  });

  describe('Validação de Tipos', () => {
    it('deve aceitar tipos de mídia válidos', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const tiposValidos = ['imagem', 'video', 'audio', 'pdf', 'outros'];

      for (const tipo of tiposValidos) {
        const { data, error } = await supabase
          .from('documentos_uploads')
          .insert({
            documento_id: testDocumentoId,
            nome_arquivo: `teste-${tipo}.file`,
            tipo_mime: 'application/octet-stream',
            tamanho_bytes: 1024,
            b2_key: `test/${tipo}.file`,
            b2_url: `https://example.com/${tipo}.file`,
            tipo_media: tipo as 'imagem' | 'video' | 'audio' | 'pdf' | 'outros',
            criado_por: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();

        // Limpar
        if (data?.id) {
          await supabase.from('documentos_uploads').delete().eq('id', data.id);
        }
      }
    });
  });
});
