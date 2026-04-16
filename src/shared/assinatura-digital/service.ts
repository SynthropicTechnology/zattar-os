/**
 * ASSINATURA DIGITAL - Service
 *
 * Camada de serviço com lógica de negócio para o módulo de assinatura digital.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AssinaturaDigitalRepository } from './repository';
import {
  createSegmentoSchema,
  updateSegmentoSchema,
  createTemplateSchema,
  updateTemplateSchema,
} from './types';
import type {
  Segmento,
  Template,
  CreateSegmentoInput,
  UpdateSegmentoInput,
  CreateTemplateInput,
  UpdateTemplateInput,
} from './types';
import Mustache from 'mustache';
// pdf-lib is imported dynamically in gerarPdfDeMarkdown to avoid SSR DOMMatrix error
/**
 * Gera um slug URL-friendly a partir de uma string.
 */
function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export class AssinaturaDigitalService {
  private repository: AssinaturaDigitalRepository;

  constructor(supabase: SupabaseClient) {
    this.repository = new AssinaturaDigitalRepository(supabase);
  }

  // ==========================================================================
  // SEGMENTOS
  // ==========================================================================

  async listarSegmentos(filtros?: {
    ativo?: boolean;
  }): Promise<Segmento[]> {
    return this.repository.listarSegmentos(filtros);
  }

  async criarSegmento(input: CreateSegmentoInput): Promise<Segmento> {
    const validated = createSegmentoSchema.parse(input);
    const slug = generateSlug(validated.nome);

    const existingSegmento = await this.repository.buscarSegmentoPorSlug(slug);
    if (existingSegmento) {
      throw new Error('Já existe um segmento com este nome ou slug.');
    }

    return this.repository.criarSegmento({ ...validated, slug });
  }

  async atualizarSegmento(
    id: number,
    input: UpdateSegmentoInput
  ): Promise<Segmento> {
    const validated = updateSegmentoSchema.parse(input);

    if (validated.nome) {
      const slug = generateSlug(validated.nome);
      const existingSegmento = await this.repository.buscarSegmentoPorSlug(slug);
      if (existingSegmento && existingSegmento.id !== id) {
        throw new Error('Já existe outro segmento com este nome ou slug.');
      }
      return this.repository.atualizarSegmento(id, { ...validated, slug });
    }

    return this.repository.atualizarSegmento(id, validated);
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async listarTemplates(filtros?: {
    segmento_id?: number;
    tipo_template?: 'pdf' | 'markdown';
    ativo?: boolean;
    status?: string;
  }): Promise<Template[]> {
    return this.repository.listarTemplates(filtros);
  }

  async buscarTemplate(id: number): Promise<Template | null> {
    return this.repository.buscarTemplatePorId(id);
  }

  async buscarTemplatePorUuid(uuid: string): Promise<Template | null> {
    return this.repository.buscarTemplatePorUuid(uuid);
  }

  async criarTemplate(input: CreateTemplateInput): Promise<Template> {
    const validated = createTemplateSchema.parse(input);

    // Validações específicas por tipo
    if (validated.tipo_template === 'pdf' && !validated.pdf_url) {
      throw new Error('URL do PDF é obrigatória para templates PDF.');
    }
    if (validated.tipo_template === 'markdown' && !validated.conteudo_markdown) {
      throw new Error('Conteúdo Markdown é obrigatório para templates Markdown.');
    }

    return this.repository.criarTemplate(validated);
  }

  async atualizarTemplate(
    id: number,
    input: UpdateTemplateInput
  ): Promise<Template> {
    const validated = updateTemplateSchema.parse(input);
    return this.repository.atualizarTemplate(id, validated);
  }

  // ==========================================================================
  // PROCESSAMENTO DE TEMPLATES (MARKDOWN / PDF)
  // ==========================================================================

  async processarVariaveisMarkdown(
    template: Template,
    data: Record<string, unknown>
  ): Promise<string> {
    if (template.tipo_template !== 'markdown' || !template.conteudo_markdown) {
      throw new Error(
        'Template não é do tipo Markdown ou não possui conteúdo Markdown.'
      );
    }
    // Usar Mustache.js para interpolação simples
    return Mustache.render(template.conteudo_markdown, data);
  }

  async gerarPdfDeMarkdown(
    markdownContent: string,
    data: Record<string, unknown>
  ): Promise<Buffer> {
    // Dynamic import to avoid SSR DOMMatrix error
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

    const renderedMarkdown = Mustache.render(markdownContent, data);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(renderedMarkdown, {
      x: 50,
      y: page.getHeight() - 50,
      font,
      size: 12,
      color: rgb(0, 0, 0),
      maxWidth: page.getWidth() - 100,
      lineHeight: 18,
    });

    // Retorna Uint8Array, que pode ser convertido para Buffer se necessário pelo caller
    // No ambiente Node (Actions), Uint8Array geralmente é compatível
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

// ==========================================================================
// FUNÇÕES STANDALONE (para uso sem instância)
// ==========================================================================

/**
 * Cria uma instância do service com o cliente Supabase fornecido.
 */
export function createAssinaturaDigitalService(
  supabase: SupabaseClient
): AssinaturaDigitalService {
  return new AssinaturaDigitalService(supabase);
}
