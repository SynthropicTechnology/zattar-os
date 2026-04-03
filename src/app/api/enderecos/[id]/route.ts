// Rota de API para operações em endereço específico
// GET: Buscar endereço por ID | PATCH: Atualizar endereço | DELETE: Deletar endereço

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  buscarEnderecoPorId,
  atualizarEndereco,
  deletarEndereco,
} from '@/app/(authenticated)/enderecos';
import type { AtualizarEnderecoParams } from '@/app/(authenticated)/enderecos/types';

/**
 * @swagger
 * /api/enderecos/{id}:
 *   get:
 *     summary: Busca um endereço por ID
 *     tags:
 *       - Endereços
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *       404:
 *         description: Endereço não encontrado
 *   patch:
 *     summary: Atualiza um endereço parcialmente
 *     tags:
 *       - Endereços
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Endereço atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Endereço não encontrado
 *   delete:
 *     summary: Deleta um endereço
 *     tags:
 *       - Endereços
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Endereço deletado com sucesso
 *       404:
 *         description: Endereço não encontrado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enderecoId = parseInt(id, 10);

    if (isNaN(enderecoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const endereco = await buscarEnderecoPorId(enderecoId);

    if (!endereco) {
      return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: endereco,
    });
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enderecoId = parseInt(id, 10);

    if (isNaN(enderecoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const dadosAtualizacao = body as Omit<AtualizarEnderecoParams, 'id'>;

    const resultado = await atualizarEndereco({ id: enderecoId, ...dadosAtualizacao });

    if (!resultado.success) {
      const errorMsg = resultado.error?.message || 'Erro ao atualizar endereço';
      if (errorMsg.includes('não encontrado')) {
        return NextResponse.json({ error: errorMsg }, { status: 404 });
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enderecoId = parseInt(id, 10);

    if (isNaN(enderecoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const resultado = await deletarEndereco(enderecoId);

    if (!resultado.success) {
      const errorMsg = resultado.error?.message || 'Erro ao deletar endereço';
      if (errorMsg.includes('não encontrado')) {
        return NextResponse.json({ error: errorMsg }, { status: 404 });
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Endereço deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
