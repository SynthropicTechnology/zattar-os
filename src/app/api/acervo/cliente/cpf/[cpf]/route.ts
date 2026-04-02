/**
 * @swagger
 * /api/acervo/cliente/cpf/{cpf}:
 *   get:
 *     summary: Buscar processos por CPF do cliente
 *     description: |
 *       Retorna todos os processos relacionados a um cliente pelo CPF.
 *       Endpoint otimizado para consumo pelo Agente IA WhatsApp.
 *
 *       **Características:**
 *       - Busca apenas em clientes cadastrados (não em partes contrárias ou terceiros)
 *       - Inclui timeline completa de cada processo (movimentações e documentos)
 *       - Dados sanitizados (sem IDs internos ou campos de sistema)
 *       - Formatos amigáveis para humanos (datas, nomes de tribunais, etc.)
 *       - Processos agrupados por número (primeiro e segundo grau juntos)
 *
 *       **Sincronização Lazy de Timeline:**
 *       Se um processo não possui timeline, o endpoint dispara automaticamente
 *       a captura em background e retorna `timeline_status: "sincronizando"`.
 *       Nesse caso, o campo `timeline_mensagem` instrui o agente a aguardar
 *       1-2 minutos e consultar novamente.
 *
 *     tags:
 *       - Acervo
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: cpf
 *         in: path
 *         required: true
 *         description: CPF do cliente (aceita com ou sem pontuação)
 *         schema:
 *           type: string
 *           example: "123.456.789-01"
 *     responses:
 *       200:
 *         description: Processos encontrados com sucesso
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
 *                     cliente:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                           example: "João da Silva"
 *                         cpf:
 *                           type: string
 *                           example: "123.456.789-01"
 *                     resumo:
 *                       type: object
 *                       properties:
 *                         total_processos:
 *                           type: integer
 *                           example: 3
 *                         com_audiencia_proxima:
 *                           type: integer
 *                           example: 1
 *                     processos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           numero:
 *                             type: string
 *                             example: "0001234-56.2024.5.03.0001"
 *                           tipo:
 *                             type: string
 *                             example: "Ação Trabalhista - Rito Ordinário"
 *                           papel_cliente:
 *                             type: string
 *                             example: "Reclamante"
 *                           parte_contraria:
 *                             type: string
 *                             example: "Empresa XYZ Ltda"
 *                           tribunal:
 *                             type: string
 *                             example: "TRT da 3ª Região (MG)"
 *                           sigilo:
 *                             type: boolean
 *                             example: false
 *                           instancias:
 *                             type: object
 *                             properties:
 *                               primeiro_grau:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   vara:
 *                                     type: string
 *                                     example: "1ª Vara do Trabalho de Belo Horizonte"
 *                                   data_inicio:
 *                                     type: string
 *                                     example: "10/01/2024"
 *                                   proxima_audiencia:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "15/03/2025 às 14:00"
 *                               segundo_grau:
 *                                 type: object
 *                                 nullable: true
 *                           timeline:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 data:
 *                                   type: string
 *                                   example: "20/11/2024"
 *                                 evento:
 *                                   type: string
 *                                   example: "Audiência designada"
 *                                 descricao:
 *                                   type: string
 *                                   example: "Audiência de instrução designada para 15/03/2025"
 *                                 tem_documento:
 *                                   type: boolean
 *                                   example: false
 *                           timeline_status:
 *                             type: string
 *                             enum: [disponivel, sincronizando, indisponivel]
 *                             description: |
 *                               Status da timeline:
 *                               - `disponivel`: Timeline carregada com sucesso
 *                               - `sincronizando`: Captura em andamento, aguarde 1-2 min
 *                               - `indisponivel`: Não foi possível capturar
 *                             example: "disponivel"
 *                           timeline_mensagem:
 *                             type: string
 *                             nullable: true
 *                             description: Mensagem para o agente quando timeline não disponível
 *                             example: "A timeline deste processo está sendo sincronizada. Por favor, aguarde 1-2 minutos e consulte novamente."
 *                           ultima_movimentacao:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               data:
 *                                 type: string
 *                                 example: "20/11/2024"
 *                               evento:
 *                                 type: string
 *                                 example: "Audiência designada"
 *       400:
 *         description: CPF inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "CPF inválido. Deve conter 11 dígitos."
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Nenhum processo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Nenhum processo encontrado para este CPF."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro interno ao buscar processos"
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { buscarProcessosClientePorCpf } from '@/app/app/acervo/service';

interface RouteParams {
  params: Promise<{
    cpf: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extrair CPF da URL
    const { cpf } = await params;

    if (!cpf) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar processos usando o serviço da feature
    const resultado = await buscarProcessosClientePorCpf(cpf);

    // Determinar status HTTP baseado no resultado
    if (resultado.success === false) {
      const errorMessage = resultado.error || 'Erro desconhecido';
      // CPF inválido
      if (errorMessage.includes('inválido')) {
        return NextResponse.json(resultado, { status: 400 });
      }
      // Nenhum processo encontrado
      if (errorMessage.includes('Nenhum processo')) {
        return NextResponse.json(resultado, { status: 404 });
      }
      // Erro genérico
      return NextResponse.json(resultado, { status: 500 });
    }

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ [API] Erro em /api/acervo/cliente/cpf:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
