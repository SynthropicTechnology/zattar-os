/**
 * @swagger
 * /api/pendentes-manifestacao/cliente/cpf/{cpf}:
 *   get:
 *     summary: Busca pendentes de manifestação por CPF do cliente
 *     description: Retorna todos os pendentes dos processos relacionados ao cliente com o CPF informado
 *     tags:
 *       - Pendentes de Manifestação
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Lista de pendentes encontrados (pode ser vazia)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: CPF inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { checkPermission } from '@/lib/auth/authorization';
import { buscarExpedientesPorClienteCPF } from '@/app/app/expedientes/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cpf: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Permissão
    const temPermissao = await checkPermission(authResult.usuarioId, 'pendentes', 'visualizar');
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar pendentes de manifestação' },
        { status: 403 }
      );
    }

    // 3. Obter CPF do parâmetro
    const { cpf } = await params;

    if (!cpf || !cpf.trim()) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // 4. Buscar pendentes
    const result = await buscarExpedientesPorClienteCPF(cpf);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao buscar pendentes por CPF do cliente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
      { status: 500 }
    );
  }
}
