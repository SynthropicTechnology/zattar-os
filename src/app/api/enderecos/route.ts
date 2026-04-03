// Rota de API para endereços
// GET: Listar endereços | POST: Criar endereço

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  listarEnderecos,
  criarEndereco,
} from '@/app/(authenticated)/enderecos';
import type { CriarEnderecoParams, ListarEnderecosParams } from '@/app/(authenticated)/enderecos/types';

/**
 * @swagger
 * /api/enderecos:
 *   get:
 *     summary: Lista endereços
 *     description: Retorna uma lista paginada de endereços com filtros opcionais
 *     tags:
 *       - Endereços
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
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: entidade_tipo
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *       - in: query
 *         name: entidade_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [A, I, P, H]
 *     responses:
 *       200:
 *         description: Lista de endereços retornada com sucesso
 *       401:
 *         description: Não autenticado
 *   post:
 *     summary: Cria um novo endereço
 *     description: Cadastra um novo endereço vinculado a uma entidade
 *     tags:
 *       - Endereços
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
 *               - entidade_tipo
 *               - entidade_id
 *             properties:
 *               entidade_tipo:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro]
 *               entidade_id:
 *                 type: integer
 *               id_pje:
 *                 type: integer
 *               tipo_logradouro:
 *                 type: string
 *               logradouro:
 *                 type: string
 *               numero:
 *                 type: string
 *               complemento:
 *                 type: string
 *               bairro:
 *                 type: string
 *               municipio:
 *                 type: string
 *               uf:
 *                 type: string
 *               cep:
 *                 type: string
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: ListarEnderecosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      entidade_tipo: (searchParams.get('entidade_tipo') as 'cliente' | 'parte_contraria' | 'terceiro' | null) || undefined,
      entidade_id: searchParams.get('entidade_id') ? parseInt(searchParams.get('entidade_id')!, 10) : undefined,
      situacao: (searchParams.get('situacao') as 'A' | 'I' | 'P' | 'H' | null) || undefined,
    };

    const resultado = await listarEnderecos(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const dadosEndereco = body as CriarEnderecoParams;

    if (!dadosEndereco.entidade_tipo || !dadosEndereco.entidade_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entidade_tipo, entidade_id' },
        { status: 400 }
      );
    }

    const resultado = await criarEndereco(dadosEndereco);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error?.message || 'Erro ao criar endereço' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
