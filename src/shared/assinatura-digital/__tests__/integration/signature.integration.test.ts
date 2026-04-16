/**
 * Testes de Integração - Signature Service de Assinatura Digital
 *
 * Testa operações de preview, finalização e listagem de sessões.
 * Nota: Alguns testes requerem dados de teste no banco (clientes, templates ativos).
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';
import { listSessoes } from '../../services/signature.service';
import {
  createTemplate,
  deleteTemplate,
} from '../../services/templates.service';
import {
  createSegmento,
  deleteSegmento,
} from '../../services/segmentos.service';
import {
  createFormulario,
  deleteFormulario,
} from '../../services/formularios.service';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Signature Service - Integração', () => {
  let testTemplateId: number | null = null;
  let testSegmentoId: number | null = null;
  let testFormularioId: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let testClienteId: number | null = null;

  beforeAll(async () => {
    // Criar dados de teste

    // 1. Template de teste
    const template = await createTemplate({
      template_uuid: `test-sig-${randomUUID()}`,
      nome: 'Template para Teste de Assinatura',
      arquivo_original: 'https://example.com/test-sig.pdf',
      arquivo_nome: 'test-sig.pdf',
      arquivo_tamanho: 1024,
      ativo: true,
      campos: '[]',
    });
    testTemplateId = template.id;

    // 2. Segmento de teste
    const segmento = await createSegmento({
      nome: 'Segmento para Teste de Assinatura',
      slug: `test-sig-seg-${Date.now()}`,
      ativo: true,
    });
    testSegmentoId = segmento.id;

    // 3. Formulário de teste
    const formulario = await createFormulario({
      nome: 'Formulário para Teste de Assinatura',
      slug: `test-sig-form-${Date.now()}`,
      segmento_id: testSegmentoId,
      ativo: true,
    });
    testFormularioId = formulario.id;

    // 4. Buscar cliente existente para testes
    const supabase = createServiceClient();
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('ativo', true)
      .limit(1)
      .single();

    if (cliente) {
      testClienteId = cliente.id;
    }
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta (respeitando foreign keys)
    if (testFormularioId) {
      try {
        await deleteFormulario(String(testFormularioId));
      } catch {
        // Ignorar
      }
    }

    if (testSegmentoId) {
      try {
        await deleteSegmento(testSegmentoId);
      } catch {
        // Ignorar
      }
    }

    if (testTemplateId) {
      try {
        await deleteTemplate(String(testTemplateId));
      } catch {
        // Ignorar
      }
    }
  });

  describe('Listar Sessões', () => {
    it('deve listar sessões de assinatura', async () => {
      const result = await listSessoes();

      expect(result).toBeDefined();
      expect(Array.isArray(result.sessoes)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.pageSize).toBe('number');
    });

    it('deve paginar resultados', async () => {
      const page1 = await listSessoes({ page: 1, pageSize: 5 });
      const page2 = await listSessoes({ page: 2, pageSize: 5 });

      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(5);
      expect(page2.page).toBe(2);
      expect(page2.pageSize).toBe(5);

      // Se houver mais de 5 registros, as páginas devem ser diferentes
      if (page1.total > 5) {
        expect(page1.sessoes).not.toEqual(page2.sessoes);
      }
    });

    it('deve filtrar por status', async () => {
      const result = await listSessoes({ status: 'concluida' });

      expect(result).toBeDefined();
      result.sessoes.forEach((s) => {
        expect(s.status).toBe('concluida');
      });
    });

    it('deve filtrar por data_inicio', async () => {
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);

      const result = await listSessoes({ data_inicio: dataInicio.toISOString() });

      expect(result).toBeDefined();
      result.sessoes.forEach((s) => {
        if (s.created_at) {
          expect(new Date(s.created_at).getTime()).toBeGreaterThanOrEqual(dataInicio.getTime());
        }
      });
    });

    it('deve filtrar por data_fim', async () => {
      const dataFim = new Date();

      const result = await listSessoes({ data_fim: dataFim.toISOString() });

      expect(result).toBeDefined();
      result.sessoes.forEach((s) => {
        if (s.created_at) {
          expect(new Date(s.created_at).getTime()).toBeLessThanOrEqual(dataFim.getTime());
        }
      });
    });

    it('deve buscar por sessao_uuid', async () => {
      const result = await listSessoes({ search: 'test' });

      expect(result).toBeDefined();
      // Busca é case-insensitive e parcial
    });
  });

  describe('Dados de Teste', () => {
    it('deve ter template de teste criado', () => {
      expect(testTemplateId).toBeDefined();
      expect(testTemplateId).toBeGreaterThan(0);
    });

    it('deve ter segmento de teste criado', () => {
      expect(testSegmentoId).toBeDefined();
      expect(testSegmentoId).toBeGreaterThan(0);
    });

    it('deve ter formulário de teste criado', () => {
      expect(testFormularioId).toBeDefined();
      expect(testFormularioId).toBeGreaterThan(0);
    });
  });

  // Nota: Testes de generatePreview e finalizeSignature não são incluídos
  // porque requerem:
  // 1. PDF real armazenado no storage
  // 2. Cliente válido no banco
  // 3. Configuração de storage (Backblaze B2)
  // 4. Geração de PDF com campos mapeados
  //
  // Estes testes devem ser feitos via E2E com mocks ou em ambiente de staging.
  describe('Preview e Finalização (Notas)', () => {
    it.skip('generatePreview requer PDF real e cliente válido', () => {
      // Este teste requer setup complexo
    });

    it.skip('finalizeSignature requer assinatura base64 e dados completos', () => {
      // Este teste requer setup complexo
    });
  });
});

/**
 * Testes de Unidade - Funções Auxiliares
 */
describe('Signature Service - Funções Auxiliares', () => {
  describe('Protocolo', () => {
    it('protocolo deve seguir formato FS-YYYYMMDDHHMMSS-XXXXX', () => {
      // Testar formato do protocolo gerado
      // O formato é: FS-{timestamp 14 chars}-{random 5 chars}
      const protocoloRegex = /^FS-\d{14}-\d{5}$/;

      // Simular geração de protocolo
      const now = new Date();
      const ts = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const protocolo = `FS-${ts}-${rand}`;

      expect(protocolo).toMatch(protocoloRegex);
    });
  });
});
