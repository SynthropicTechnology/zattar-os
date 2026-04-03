/**
 * API Routes para templates
 *
 * GET /api/templates - Lista templates
 * POST /api/templates - Cria novo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  listarTemplates,
  criarTemplate,
  listarTemplatesMaisUsados,
  listarCategoriasTemplates,
} from '@/app/(authenticated)/documentos/service';
import type {
  CriarTemplateParams,
  ListarTemplatesParams,
} from '@/app/(authenticated)/documentos';

/**
 * GET /api/templates
 * Lista templates com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const modo = searchParams.get('modo') ?? 'lista'; // 'lista', 'mais_usados', 'categorias'

    // Modo: Categorias
    if (modo === 'categorias') {
      const categorias = await listarCategoriasTemplates(authResult.usuario.id);
      return NextResponse.json({
        success: true,
        data: categorias,
      });
    }

    // Modo: Mais usados
    if (modo === 'mais_usados') {
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;

      const templates = await listarTemplatesMaisUsados(limit, authResult.usuario.id);

      return NextResponse.json({
        success: true,
        data: templates,
      });
    }

    // Modo: Lista (padrão)
    const params: ListarTemplatesParams = {
      visibilidade: (searchParams.get('visibilidade') as 'publico' | 'privado') ?? undefined,
      categoria: searchParams.get('categoria') ?? undefined,
      criado_por: searchParams.get('criado_por')
        ? parseInt(searchParams.get('criado_por')!)
        : undefined,
      busca: searchParams.get('busca') ?? undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : undefined,
    };

    const { templates, total } = await listarTemplates(params, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        total,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        hasMore: (params.offset ?? 0) + templates.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Cria um novo template
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CriarTemplateParams = await request.json();

    // Validação
    if (!body.titulo || body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (body.titulo.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Título muito longo (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    if (!body.visibilidade || !['publico', 'privado'].includes(body.visibilidade)) {
      return NextResponse.json(
        { success: false, error: 'Visibilidade inválida (publico ou privado)' },
        { status: 400 }
      );
    }

    if (!body.conteudo) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    const template = await criarTemplate(body, authResult.usuario.id);

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
