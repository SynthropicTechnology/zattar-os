/**
 * Rota de API para buscar documento PDF de pendente de manifestação do PJE
 * POST: Buscar documento, fazer upload para Backblaze B2 e atualizar banco de dados
 *
 * Este endpoint pode ser usado de duas formas:
 * 1. Standalone: Usuário clica em "Buscar Documento" na interface
 * 2. Integrado: Chamado automaticamente pelo scraper durante captura de pendentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { autenticarPJE } from '@/app/(authenticated)/captura/services/trt/trt-auth.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { downloadAndUploadDocumento } from '@/app/(authenticated)/captura/services/pje/pje-expediente-documento.service';
import type { FetchDocumentoParams, CodigoTRT, GrauTRT } from '@/app/(authenticated)/captura';

interface DocumentoRequestBody {
  expediente_id: number;
  processo_id: string;
  numero_processo: string;
  documento_id: string;
  credencial_id: number;
}

/**
 * @swagger
 * /api/pje/pendente-manifestacao/documento:
 *   post:
 *     summary: Busca documento PDF de um pendente de manifestação do PJE
 *     description: |
 *       Busca documento PDF de um expediente pendente do PJE, faz upload para Backblaze B2
 *       e atualiza as informações do arquivo no banco de dados.
 *
 *       **Fluxo:**
 *       1. Autentica no PJE usando credencial fornecida
 *       2. Busca metadados do documento (valida que é PDF)
 *       3. Busca conteúdo do documento (base64)
 *       4. Converte para Buffer e faz upload para Backblaze B2
 *       5. Atualiza banco com nome do arquivo e URL do Backblaze
 *
 *       **Uso:**
 *       - Standalone: Botão "Buscar Documento" na interface para pendentes sem documento
 *       - Integrado: Chamado automaticamente pelo scraper durante captura
 *     tags:
 *       - PJE - Pendentes de Manifestação
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
 *               - expediente_id
 *               - processo_id
 *               - numero_processo
 *               - documento_id
 *               - credencial_id
 *             properties:
 *               expediente_id:
 *                 type: integer
 *                 description: ID do expediente na tabela expedientes
 *               processo_id:
 *                 type: string
 *                 description: ID do processo no PJE (usado na URL da API)
 *               numero_processo:
 *                 type: string
 *                 description: Número do processo (ex. "0010702-80.2025.5.03.0111")
 *               documento_id:
 *                 type: string
 *                 description: ID do documento/expediente no PJE
 *               credencial_id:
 *                 type: integer
 *                 description: ID da credencial para autenticação no PJE (deve ser do tribunal correto)
 *           example:
 *             expediente_id: 999
 *             processo_id: "12345678"
 *             numero_processo: "0010702-80.2025.5.03.0111"
 *             documento_id: "87654321"
 *             credencial_id: 42
 *     responses:
 *       200:
 *         description: Documento capturado com sucesso
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
 *                     expediente_id:
 *                       type: integer
 *                       example: 999
 *                     arquivo_nome:
 *                       type: string
 *                       example: "exp_789_doc_234517663_20251121.pdf"
 *                     arquivo_url:
 *                       type: string
 *                       example: "https://s3.us-east-005.backblazeb2.com/zattar-advogados/processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf"
 *                     arquivo_key:
 *                       type: string
 *                       example: "processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf"
 *                     arquivo_bucket:
 *                       type: string
 *                       example: "zattar-advogados"
 *       400:
 *         description: Parâmetros inválidos ou documento não é PDF
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingParams:
 *                 value:
 *                   error: "Missing required parameters: expediente_id, processo_id, numero_processo, documento_id, credencial_id"
 *               invalidPdf:
 *                 value:
 *                   error: "Documento não é um PDF válido"
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Credencial ou documento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               credentialNotFound:
 *                 value:
 *                   error: "Credential not found"
 *               documentNotFound:
 *                 value:
 *                   error: "Documento não encontrado no PJE"
 *       500:
 *         description: Erro interno (autenticação PJE, upload Backblaze B2, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               authError:
 *                 value:
 *                   error: "Erro de autenticação no PJE"
 *               uploadError:
 *                 value:
 *                   error: "Erro ao fazer upload do documento"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar body da requisição
    const body: DocumentoRequestBody = await request.json();
    const { expediente_id, processo_id, numero_processo, documento_id, credencial_id } = body;

    if (
      !expediente_id ||
      !processo_id ||
      !numero_processo ||
      !documento_id ||
      !credencial_id
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: expediente_id, processo_id, numero_processo, documento_id, credencial_id',
        },
        { status: 400 }
      );
    }

    console.log('\n🚀 Iniciando busca de documento via API');
    console.log(`Expediente ID: ${expediente_id}`);
    console.log(`Processo ID: ${processo_id}`);
    console.log(`Número Processo: ${numero_processo}`);
    console.log(`Documento ID: ${documento_id}`);
    console.log(`Credencial ID: ${credencial_id}`);

    // 3. Buscar credencial completa
    const credential = await getCredentialComplete(credencial_id);

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // 4. Obter configuração do tribunal
    const trt = credential.tribunal as CodigoTRT;
    const grau = credential.grau as GrauTRT;

    let config;
    try {
      config = await getTribunalConfig(trt, grau);
    } catch (error) {
      return NextResponse.json(
        { error: `Configuração não encontrada para TRT ${trt} ${grau}: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
        { status: 404 }
      );
    }

    const cpfLog = (sanitizeForLogs({ cpf: credential.credenciais.cpf }) as { cpf: string }).cpf;
    console.log(`📋 Credencial: ${cpfLog} - ${trt} Grau ${grau}`);

    // 5. Autenticar no PJE (cria sessão temporária)
    let pjeAuthResult;
    try {
      pjeAuthResult = await autenticarPJE({
        credential: credential.credenciais,
        config,
        headless: true,
      });
    } catch (error) {
      console.error('❌ Erro ao autenticar no PJE:', error);
      return NextResponse.json(
        {
          error: `Erro de autenticação no PJE: ${error instanceof Error ? error.message : 'Erro desconhecido'
            }`,
        },
        { status: 500 }
      );
    }

    try {
      // 6. Preparar parâmetros para download/upload
      const params: FetchDocumentoParams = {
        processoId: processo_id,
        documentoId: documento_id,
        expedienteId: expediente_id,
        numeroProcesso: numero_processo,
        trt,
        grau,
      };

      // 7. Executar download e upload
      const result = await downloadAndUploadDocumento(pjeAuthResult.page, params);

      // 8. Verificar resultado
      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'Erro ao processar documento',
          },
          { status: 500 }
        );
      }

      console.log('✅ Documento capturado com sucesso!\n');

      // 9. Retornar resultado
      return NextResponse.json({
        success: true,
        data: {
          expediente_id: result.expedienteId,
          arquivo_nome: result.arquivoInfo?.arquivo_nome,
          arquivo_url: result.arquivoInfo?.arquivo_url,
          arquivo_key: result.arquivoInfo?.arquivo_key,
          arquivo_bucket: result.arquivoInfo?.arquivo_bucket,
        },
      });
    } finally {
      // 10. Limpar recursos (fechar navegador)
      if (pjeAuthResult?.browser) {
        await pjeAuthResult.browser.close();
        console.log('🧹 Navegador fechado');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar documento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
