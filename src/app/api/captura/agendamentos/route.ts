// Rota de API para agendamentos de captura
// GET: Listar agendamentos | POST: Criar agendamento

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { listarAgendamentos } from '@/app/(authenticated)/captura/services/agendamentos/listar-agendamentos.service';
import { criarAgendamento } from '@/app/(authenticated)/captura/services/agendamentos/criar-agendamento.service';
import type { CriarAgendamentoParams, ListarAgendamentosParams } from '@/app/(authenticated)/captura';

/**
 * @swagger
 * /api/captura/agendamentos:
 *   get:
 *     summary: Lista agendamentos de captura
 *     description: Retorna lista de agendamentos com filtros e paginação
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: advogado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do advogado
 *       - in: query
 *         name: tipo_captura
 *         schema:
 *           type: string
 *           enum: [acervo_geral, arquivados, audiencias, pendentes, pericias, combinada]
 *         description: Filtrar por tipo de captura
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo agendamento de captura
 *     description: Cria um agendamento para execução automática de captura
 *     tags:
 *       - Agendamentos
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
 *               - tipo_captura
 *               - advogado_id
 *               - credencial_ids
 *               - periodicidade
 *               - horario
 *             properties:
 *               tipo_captura:
 *                 type: string
 *                 enum: [acervo_geral, arquivados, audiencias, pendentes, pericias, combinada]
 *               advogado_id:
 *                 type: integer
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               periodicidade:
 *                 type: string
 *                 enum: [diario, a_cada_N_dias]
 *               dias_intervalo:
 *                 type: integer
 *                 description: Obrigatório quando periodicidade = a_cada_N_dias
 *               horario:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "07:00"
 *               ativo:
 *                 type: boolean
 *                 default: true
 *               parametros_extras:
 *                 type: object
 *                 properties:
 *                   dataInicio:
 *                     type: string
 *                     format: date
 *                   dataFim:
 *                     type: string
 *                     format: date
 *                   filtroPrazo:
 *                     type: string
 *                     enum: [no_prazo, sem_prazo]
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       400:
 *         description: Dados inválidos
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

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarAgendamentosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      advogado_id: searchParams.get('advogado_id') ? parseInt(searchParams.get('advogado_id')!, 10) : undefined,
      tipo_captura: searchParams.get('tipo_captura') as ListarAgendamentosParams['tipo_captura'],
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
      proxima_execucao_min: searchParams.get('proxima_execucao_min') || undefined,
      proxima_execucao_max: searchParams.get('proxima_execucao_max') || undefined,
      ordenar_por: searchParams.get('ordenar_por') as ListarAgendamentosParams['ordenar_por'],
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,
    };

    // 3. Listar agendamentos
    const resultado = await listarAgendamentos(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

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

    // 2. Obter e validar body
    const body = await request.json();
    const params: CriarAgendamentoParams = {
      tipo_captura: body.tipo_captura,
      advogado_id: body.advogado_id,
      credencial_ids: body.credencial_ids,
      periodicidade: body.periodicidade,
      dias_intervalo: body.dias_intervalo,
      horario: body.horario,
      ativo: body.ativo !== undefined ? body.ativo : true,
      parametros_extras: body.parametros_extras || undefined,
    };

    // Validações básicas
    if (!params.tipo_captura || !params.advogado_id || !params.credencial_ids || !Array.isArray(params.credencial_ids) || params.credencial_ids.length === 0) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo_captura, advogado_id, credencial_ids (array não vazio)' },
        { status: 400 }
      );
    }

    if (!params.periodicidade || !params.horario) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: periodicidade, horario' },
        { status: 400 }
      );
    }

    if (params.periodicidade === 'a_cada_N_dias' && (!params.dias_intervalo || params.dias_intervalo <= 0)) {
      return NextResponse.json(
        { error: 'dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias' },
        { status: 400 }
      );
    }

    // 3. Criar agendamento
    const agendamento = await criarAgendamento(params);

    return NextResponse.json(
      {
        success: true,
        data: agendamento,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    if (erroMsg.includes('obrigatório') || erroMsg.includes('inválido') || erroMsg.includes('formato')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

