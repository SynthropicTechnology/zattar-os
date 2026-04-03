/**
 * API routes para gerenciamento de configurações de tribunais
 * GET: Listar todas as configurações de tribunais
 * POST: Criar nova configuração de tribunal
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { listAllConfigs } from '@/app/(authenticated)/captura/services/persistence/tribunal-config-persistence.service';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { TipoAcessoTribunal, CustomTimeouts } from '@/app/(authenticated)/captura';

/**
 * @swagger
 * /api/captura/tribunais:
 *   get:
 *     summary: Lista todas as configurações de tribunais
 *     description: Retorna lista completa de configurações de tribunais para captura (URLs, tipo de acesso, timeouts customizados)
 *     tags:
 *       - Tribunais Config
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     responses:
 *       200:
 *         description: Lista de configurações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tribunais:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           tribunal_codigo:
 *                             type: string
 *                             example: TRT3
 *                           tribunal_nome:
 *                             type: string
 *                             example: Tribunal Regional do Trabalho da 3ª Região
 *                           tipo_acesso:
 *                             type: string
 *                             enum: [primeiro_grau, segundo_grau, unificado, unico]
 *                           url_base:
 *                             type: string
 *                             example: https://pje.trt3.jus.br
 *                           url_login_seam:
 *                             type: string
 *                             example: https://pje.trt3.jus.br/primeirograu/login.seam
 *                           url_api:
 *                             type: string
 *                             example: https://pje.trt3.jus.br/pje-comum-api/api
 *                           custom_timeouts:
 *                             type: object
 *                             nullable: true
 *                     tribunais_codigos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tipos_acesso:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Buscar todas as configurações do banco
    const configs = await listAllConfigs();

    // 3. Extrair códigos e tipos únicos para filtros
    const tribunaisCodigos = Array.from(
      new Set(configs.map((c) => c.tribunal_codigo))
    ).sort();

    const tiposAcesso = Array.from(
      new Set(configs.map((c) => c.tipo_acesso))
    ).sort();

    // 4. Retornar resultado
    return NextResponse.json({
      success: true,
      data: {
        tribunais: configs,
        tribunais_codigos: tribunaisCodigos,
        tipos_acesso: tiposAcesso,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar tribunais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tribunais' },
      { status: 500 }
    );
  }
}

interface CreateTribunalBody {
  tribunal_id: string;
  tipo_acesso: TipoAcessoTribunal;
  url_base: string;
  url_login_seam: string;
  url_api: string;
  custom_timeouts?: CustomTimeouts | null;
}

/**
 * @swagger
 * /api/captura/tribunais:
 *   post:
 *     summary: Cria nova configuração de tribunal
 *     description: Adiciona nova configuração de acesso a um tribunal
 *     tags:
 *       - Tribunais Config
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tribunal_id
 *               - tipo_acesso
 *               - url_base
 *               - url_login_seam
 *               - url_api
 *             properties:
 *               tribunal_id:
 *                 type: string
 *                 description: UUID do tribunal na tabela tribunais
 *               tipo_acesso:
 *                 type: string
 *                 enum: [primeiro_grau, segundo_grau, unificado, unico]
 *               url_base:
 *                 type: string
 *                 example: https://pje.trt3.jus.br
 *               url_login_seam:
 *                 type: string
 *                 example: https://pje.trt3.jus.br/primeirograu/login.seam
 *               url_api:
 *                 type: string
 *                 example: https://pje.trt3.jus.br/pje-comum-api/api
 *               custom_timeouts:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   login:
 *                     type: number
 *                     description: Timeout para login SSO em ms
 *                   redirect:
 *                     type: number
 *                     description: Timeout para redirects em ms
 *                   networkIdle:
 *                     type: number
 *                     description: Timeout para página estabilizar em ms
 *                   api:
 *                     type: number
 *                     description: Timeout para chamadas de API em ms
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar body
    const body: CreateTribunalBody = await request.json();
    const {
      tribunal_id,
      tipo_acesso,
      url_base,
      url_login_seam,
      url_api,
      custom_timeouts,
    } = body;

    if (!tribunal_id || !tipo_acesso || !url_base || !url_login_seam || !url_api) {
      return NextResponse.json(
        {
          error: 'Campos obrigatórios: tribunal_id, tipo_acesso, url_base, url_login_seam, url_api',
        },
        { status: 400 }
      );
    }

    // 3. Criar no banco
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('tribunais_config')
      .insert({
        tribunal_id,
        sistema: 'PJE', // Default, pode ser configurável no futuro
        tipo_acesso,
        url_base,
        url_login_seam,
        url_api,
        custom_timeouts: custom_timeouts || null,
      })
      .select(`
        id,
        sistema,
        tipo_acesso,
        url_base,
        url_login_seam,
        url_api,
        custom_timeouts,
        created_at,
        updated_at,
        tribunal_id,
        tribunais!inner (
          codigo,
          nome
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao criar configuração:', error);
      return NextResponse.json(
        { error: 'Erro ao criar configuração de tribunal' },
        { status: 500 }
      );
    }

    // 4. Retornar resultado
    return NextResponse.json(
      {
        success: true,
        data: {
          tribunal: data,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar tribunal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
