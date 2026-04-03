/**
 * API routes para gerenciamento de configuração de tribunal específico
 * PUT: Atualizar configuração existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createServiceClient } from '@/lib/supabase/service-client';
import { clearConfigCache } from '@/app/(authenticated)/captura/services/trt/config';
import type { TipoAcessoTribunal, CustomTimeouts, CodigoTRT } from '@/app/(authenticated)/captura';

interface UpdateTribunalBody {
  tipo_acesso?: TipoAcessoTribunal;
  url_base?: string;
  url_login_seam?: string;
  url_api?: string;
  custom_timeouts?: CustomTimeouts | null;
}

/**
 * @swagger
 * /api/captura/tribunais/{id}:
 *   put:
 *     summary: Atualiza configuração de um tribunal
 *     description: Atualiza URLs e timeouts de uma configuração existente. Invalida cache automaticamente.
 *     tags:
 *       - Tribunais Config
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da configuração de tribunal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *                   redirect:
 *                     type: number
 *                   networkIdle:
 *                     type: number
 *                   api:
 *                     type: number
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Configuração não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;

    // 3. Validar body
    const body: UpdateTribunalBody = await request.json();

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // 4. Buscar configuração atual para obter código do tribunal (para invalidar cache)
    const supabase = createServiceClient();

    const { data: configAtual, error: errorBusca } = await supabase
      .from('tribunais_config')
      .select(`
        id,
        tipo_acesso,
        tribunais!inner (
          codigo
        )
      `)
      .eq('id', id)
      .single();

    if (errorBusca || !configAtual) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // 5. Atualizar no banco
    const { data, error } = await supabase
      .from('tribunais_config')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      console.error('Erro ao atualizar configuração:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração de tribunal' },
        { status: 500 }
      );
    }

    // 6. Invalidar cache para este tribunal
    const tribunal = Array.isArray(configAtual.tribunais)
      ? configAtual.tribunais[0]
      : configAtual.tribunais;

    if (!tribunal || !tribunal.codigo) {
      console.error('Erro: dados do tribunal não encontrados na configuração');
      return NextResponse.json(
        { error: 'Dados do tribunal não encontrados' },
        { status: 500 }
      );
    }

    const tribunalCodigo = tribunal.codigo as CodigoTRT;

    // Limpar cache para todas as combinações deste tribunal
    clearConfigCache(tribunalCodigo);

    console.log(`✅ Cache invalidado para tribunal ${tribunalCodigo}`);

    // 7. Retornar resultado
    return NextResponse.json({
      success: true,
      data: {
        tribunal: data,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar tribunal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
