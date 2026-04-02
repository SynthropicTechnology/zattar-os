
// Rota de API para pendentes de manifestação
// GET: Listar processos pendentes de manifestação com filtros, paginação, ordenação e agrupamento

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { listarExpedientes } from '@/app/app/expedientes/service';
import type { ListarExpedientesParams } from '@/app/app/expedientes';

/**
 * @swagger
 * /api/pendentes-manifestacao:
 *   get:
 *     summary: Lista processos pendentes de manifestação
 *     description: |
 *       Retorna uma lista paginada de processos pendentes de manifestação com filtros avançados, ordenação e agrupamento.
 *       
 *       **Filtros disponíveis:**
 *       - Filtros básicos: TRT, grau, responsável
 *       - Busca textual em múltiplos campos
 *       - Filtros específicos por campo
 *       - Filtros específicos de pendentes: prazo_vencido, datas de prazo legal, ciência, criação de expediente
 *       - Filtros de data (ranges)
 *       
 *       **Agrupamento:**
 *       - Quando `agrupar_por` está presente, retorna dados agrupados por campo específico
 *       - Use `incluir_contagem = true` para retornar apenas contagens (padrão)
 *       - Use `incluir_contagem = false` para retornar pendentes completos por grupo
 *     tags:
 *       - Pendentes de Manifestação
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
 *         description: Número da página (começa em 1)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: "Filtrar por código do TRT (ex: TRT3, TRT1)"
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Filtrar por grau do processo
 *       - in: query
 *         name: responsavel_id
 *         schema:
 *           type: string
 *         description: |
 *           Filtrar por ID do responsável.
 *           Use número para processos com responsável específico.
 *           Use string 'null' para processos sem responsável.
 *       - in: query
 *         name: sem_responsavel
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas processos sem responsável (true)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: |
 *           Busca textual em múltiplos campos:
 *           - numero_processo
 *           - nome_parte_autora
 *           - nome_parte_re
 *           - descricao_orgao_julgador
 *           - classe_judicial
 *           - sigla_orgao_julgador
 *       - in: query
 *         name: numero_processo
 *         schema:
 *           type: string
 *         description: Filtrar por número do processo (busca parcial)
 *       - in: query
 *         name: nome_parte_autora
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte autora (busca parcial)
 *       - in: query
 *         name: nome_parte_re
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte ré (busca parcial)
 *       - in: query
 *         name: descricao_orgao_julgador
 *         schema:
 *           type: string
 *         description: Filtrar por descrição do órgão julgador (busca parcial)
 *       - in: query
 *         name: sigla_orgao_julgador
 *         schema:
 *           type: string
 *         description: "Filtrar por sigla do órgão julgador (busca parcial, ex: VT33RJ)"
 *       - in: query
 *         name: classe_judicial
 *         schema:
 *           type: string
 *         description: "Filtrar por classe judicial (exata, ex: ATOrd, ATSum)"
 *       - in: query
 *         name: codigo_status_processo
 *         schema:
 *           type: string
 *         description: "Filtrar por código do status (exata, ex: DISTRIBUIDO)"
 *       - in: query
 *         name: segredo_justica
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos em segredo de justiça
 *       - in: query
 *         name: juizo_digital
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos de juízo digital
 *       - in: query
 *         name: processo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por processo relacionado no acervo (apenas filtro, não agrupamento)
 *       - in: query
 *         name: prazo_vencido
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos com prazo vencido (true) ou no prazo (false)
 *       - in: query
 *         name: data_prazo_legal_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data do prazo legal (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_prazo_legal_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data do prazo legal (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_ciencia_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de ciência da parte (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_ciencia_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de ciência da parte (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_criacao_expediente_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de criação do expediente (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_criacao_expediente_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de criação do expediente (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_autuacao_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de autuação (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_autuacao_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de autuação (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_arquivamento_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de arquivamento (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_arquivamento_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de arquivamento (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [data_prazo_legal_parte, data_autuacao, numero_processo, nome_parte_autora, nome_parte_re, data_arquivamento, data_ciencia_parte, data_criacao_expediente, prioridade_processual, created_at, updated_at]
 *           default: data_prazo_legal_parte
 *         description: "Campo para ordenação (padrão: data_prazo_legal_parte)"
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: |
 *           Direção da ordenação.
 *           Padrão: 'asc' para data_prazo_legal_parte (mais urgentes primeiro), 'desc' para outros campos.
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [trt, grau, responsavel_id, classe_judicial, codigo_status_processo, orgao_julgador, mes_autuacao, ano_autuacao, prazo_vencido, mes_prazo_legal]
 *         description: |
 *           Campo para agrupamento dos resultados.
 *           Quando presente, retorna dados agrupados ao invés de lista paginada.
 *           - trt: Agrupar por TRT
 *           - grau: Agrupar por grau
 *           - responsavel_id: Agrupar por responsável
 *           - classe_judicial: Agrupar por classe judicial
 *           - codigo_status_processo: Agrupar por status
 *           - orgao_julgador: Agrupar por órgão julgador
 *           - mes_autuacao: Agrupar por mês/ano de autuação
 *           - ano_autuacao: Agrupar por ano de autuação
 *           - prazo_vencido: Agrupar por prazo vencido/no prazo
 *           - mes_prazo_legal: Agrupar por mês/ano do prazo legal
 *       - in: query
 *         name: incluir_contagem
 *         schema:
 *           type: boolean
 *           default: true
 *         description: |
 *           Quando agrupar_por está presente:
 *           - true: Retorna apenas grupos com contagens (padrão)
 *           - false: Retorna grupos com lista completa de pendentes
 *     responses:
 *       200:
 *         description: Lista de pendentes retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       description: Resposta padrão (sem agrupamento)
 *                       properties:
 *                         pendentes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Expediente'
 *                         paginacao:
 *                           type: object
 *                           properties:
 *                             pagina:
 *                               type: integer
 *                             limite:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPaginas:
 *                               type: integer
 *                     - type: object
 *                       description: Resposta com agrupamento
 *                       properties:
 *                         agrupamentos:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               grupo:
 *                                 type: string
 *                               quantidade:
 *                                 type: integer
 *                               pendentes:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Expediente'
 *                         total:
 *                           type: integer
 *             examples:
 *               listagemPadrao:
 *                 summary: Listagem padrão paginada
 *                 value:
 *                   success: true
 *                   data:
 *                     pendentes:
 *                       - id: 1
 *                         numero_processo: "0010014-94.2025.5.03.0022"
 *                         nome_parte_autora: "João Silva"
 *                         nome_parte_re: "Empresa XYZ"
 *                         data_prazo_legal_parte: "2025-01-20T10:00:00.000Z"
 *                         prazo_vencido: false
 *                     paginacao:
 *                       pagina: 1
 *                       limite: 50
 *                       total: 100
 *                       totalPaginas: 2
 *               agrupamentoPrazoVencido:
 *                 summary: Agrupamento por prazo vencido
 *                 value:
 *                   success: true
 *                   data:
 *                     agrupamentos:
 *                       - grupo: "vencido"
 *                         quantidade: 15
 *                       - grupo: "no_prazo"
 *                         quantidade: 85
 *                     total: 100
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Parâmetro 'pagina' deve ser maior ou igual a 1"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    // Função auxiliar para converter string para boolean
    const parseBoolean = (value: string | null): boolean | undefined => {
      if (value === null) return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    };

    // Função auxiliar para converter string para number ou 'null'
    const parseResponsavelId = (value: string | null): number | 'null' | undefined => {
      if (value === null) return undefined;
      if (value === 'null') return 'null';
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    };

    // Função auxiliar para converter tipoExpedienteId para number
    const parseTipoExpedienteId = (value: string | null): number | undefined => {
      if (value === null) return undefined;
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    };

    const params: ListarExpedientesParams = {
      // Paginação
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,

      // Filtros básicos
      trt: (searchParams.get('trt') as ListarExpedientesParams['trt']) || undefined,
      grau: (searchParams.get('grau') as ListarExpedientesParams['grau']) || undefined,
      responsavelId: parseResponsavelId(searchParams.get('responsavelId')),
      semResponsavel: parseBoolean(searchParams.get('semResponsavel')),

      // Busca textual
      busca: searchParams.get('busca') || undefined,

      // Filtros (camelCase)
      classeJudicial: searchParams.get('classeJudicial') || undefined,
      codigoStatusProcesso: searchParams.get('codigoStatusProcesso') || undefined,
      segredoJustica: parseBoolean(searchParams.get('segredoJustica')),
      juizoDigital: parseBoolean(searchParams.get('juizoDigital')),
      processoId: searchParams.get('processoId') ? parseInt(searchParams.get('processoId')!, 10) : undefined,

      baixado: parseBoolean(searchParams.get('baixado')),
      prazoVencido: parseBoolean(searchParams.get('prazoVencido')),
      tipoExpedienteId: parseTipoExpedienteId(searchParams.get('tipoExpedienteId')),
      semTipo: parseBoolean(searchParams.get('semTipo')),

      dataPrazoLegalInicio: searchParams.get('dataPrazoLegalInicio') || undefined,
      dataPrazoLegalFim: searchParams.get('dataPrazoLegalFim') || undefined,
      dataCienciaInicio: searchParams.get('dataCienciaInicio') || undefined,
      dataCienciaFim: searchParams.get('dataCienciaFim') || undefined,
      dataCriacaoExpedienteInicio: searchParams.get('dataCriacaoExpedienteInicio') || undefined,
      dataCriacaoExpedienteFim: searchParams.get('dataCriacaoExpedienteFim') || undefined,
      dataAutuacaoInicio: searchParams.get('dataAutuacaoInicio') || undefined,
      dataAutuacaoFim: searchParams.get('dataAutuacaoFim') || undefined,
      dataArquivamentoInicio: searchParams.get('dataArquivamentoInicio') || undefined,
      dataArquivamentoFim: searchParams.get('dataArquivamentoFim') || undefined,

      ordenarPor: (searchParams.get('ordenarPor') as ListarExpedientesParams['ordenarPor']) || undefined,
      ordem: (searchParams.get('ordem') as ListarExpedientesParams['ordem']) || undefined,
    };

    // 3. Validações básicas
    if (params.pagina !== undefined && params.pagina < 1) {
      return NextResponse.json(
        { error: "Parâmetro 'pagina' deve ser maior ou igual a 1" },
        { status: 400 }
      );
    }

    if (params.limite !== undefined && (params.limite < 1 || params.limite > 100)) {
      return NextResponse.json(
        { error: "Parâmetro 'limite' deve estar entre 1 e 100" },
        { status: 400 }
      );
    }

    // 4. Listar pendentes
    const result = await listarExpedientes(params);

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao listar pendentes de manifestação:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

