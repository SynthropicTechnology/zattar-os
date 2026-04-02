import { err, ok, Result } from 'neverthrow';
import { DifyClient } from '../../lib/dify/client';
import {
  DifyChatResponse,
  DifyWorkflowResponse,
  DifyConversationsResponse,
  DifyMessagesResponse,
  DifyFileUploadResponse,
  DifyDataset,
  DifyDocument,
  DifyChatRequest,
  DifyWorkflowRequest,
  DifyFile,
  DifyConversationVariablesResponse,
  DifyWorkflowLogsResponse,
  DifyFileUploadWorkflowResponse,
  DifyAnnotation,
  DifyAnnotationsResponse,
  DifyAnnotationReplyStatusResponse,
  DifyAppFeedbacksResponse,
  DifyRetrieveResponse,
  DifyDocumentDetail,
  DifyBatchEmbeddingStatusResponse,
  DifySegment,
  DifySegmentsResponse,
  DifyChunk,
  DifyChunksResponse,
  DifyTag,
  DifyTagsResponse,
  DifyEmbeddingModelsResponse,
} from '../../lib/dify/types';
import {
  enviarMensagemSchema,
  executarWorkflowSchema,
  feedbackSchema
} from './domain';
import { z } from 'zod';
import { isDifyConfigured } from '../../lib/dify/config';

export class DifyService {
  private client: DifyClient;

  constructor(apiKey?: string, baseUrl?: string) {
    this.client = new DifyClient(apiKey, baseUrl);
  }

  static create(appKey?: string, baseUrl?: string): Result<DifyService, Error> {
    // Se baseUrl for passado, assume configuração explícita.
    // Se não, tenta usar config de ambiente (legacy/fallback).
    if (!baseUrl && !isDifyConfigured(appKey)) {
      // Permitir criar sem config se for usar depois (mas idealmente deve ter config)
      // Por enquanto, retorna erro se não tiver ENV config e não foi passado nada.
      // Mas se estivermos usando DB config, isso será chamado após o fetch.
    }
    return ok(new DifyService(appKey, baseUrl));
  }

  // Factory function para compatibilidade com MCP Tools e uso geral
  static async createAsync(userId: string, appId?: string): Promise<DifyService> {
    // 1. Tentar buscar configuração do banco
    const { difyRepository } = await import('./repository');

    let dbConfig = null;
    let configResult;

    if (appId) {
      configResult = await difyRepository.getDifyApp(appId);
    } else {
      // Se não passou ID, tenta pegar o primeiro ativo (padrão)
      // Poderíamos passar um tipo preferido aqui se soubéssemos, mas createAsync é genérico.
      configResult = await difyRepository.getActiveDifyApp();
    }

    if (configResult.isOk()) {
      dbConfig = configResult.value;
    }

    // 2. Determinar chaves e url
    // Se tiver no banco, usa. 
    // Se não, fallback para env vars (via DifyClient default logic) APENAS SE não foi solicitado um app específico que falhou.

    let apiKey: string | undefined = undefined;
    let baseUrl: string | undefined = undefined;

    if (dbConfig) {
      apiKey = dbConfig.api_key as string;
      baseUrl = dbConfig.api_url as string;
    } else if (appId) {
      // Se pediu um app específico e não achou, erro.
      throw new Error(`App Dify com ID ${appId} não encontrado.`);
    }

    const serviceResult = DifyService.create(apiKey, baseUrl);
    if (serviceResult.isErr()) {
      throw serviceResult.error;
    }
    return serviceResult.value;
  }

  // --- Chat ---

  async enviarMensagem(
    params: z.infer<typeof enviarMensagemSchema>,
    user: string
  ): Promise<Result<DifyChatResponse, Error>> {
    try {
      const requestPayload: DifyChatRequest = {
        ...params,
        user,
        response_mode: 'blocking',
        files: params.files as DifyFile[] | undefined,
      };
      const result = await this.client.chatMessages(requestPayload);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao enviar mensagem Dify: ${message}`));
    }
  }

  async enviarMensagemStream(
    params: z.infer<typeof enviarMensagemSchema>,
    user: string
  ): Promise<Result<ReadableStream<Uint8Array>, Error>> {
    try {
      const requestPayload: DifyChatRequest = {
        ...params,
        user,
        response_mode: 'streaming',
        files: params.files as DifyFile[] | undefined,
      };
      const stream = await this.client.chatMessagesStream(requestPayload);
      return ok(stream);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao iniciar stream de mensagem Dify: ${message}`));
    }
  }

  async stopChatGeneration(taskId: string, user: string): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.stopChatTask(taskId, user);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao parar geração do chat: ${message}`));
    }
  }

  // --- Workflows ---

  async executarWorkflow(
    params: z.infer<typeof executarWorkflowSchema>,
    user: string
  ): Promise<Result<DifyWorkflowResponse, Error>> {
    try {
      const requestPayload: DifyWorkflowRequest = {
        ...params,
        user,
        response_mode: 'blocking',
        files: params.files as DifyFile[] | undefined,
      };
      const result = await this.client.workflowRun(requestPayload);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao executar workflow Dify: ${message}`));
    }
  }

  async executarWorkflowStream(
    params: z.infer<typeof executarWorkflowSchema>,
    user: string
  ): Promise<Result<ReadableStream<Uint8Array>, Error>> {
    try {
      const requestPayload: DifyWorkflowRequest = {
        ...params,
        user,
        response_mode: 'streaming',
        files: params.files as DifyFile[] | undefined,
      };
      const stream = await this.client.workflowRunStream(requestPayload);
      return ok(stream);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao iniciar stream de workflow Dify: ${message}`));
    }
  }

  async stopWorkflow(taskId: string, user: string): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.stopWorkflowRun(taskId, user);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao parar workflow: ${message}`));
    }
  }


  // --- Conversas & Mensagens ---

  async listarConversas(params: { limite: number; ordenarPor?: string }, user: string = 'system'): Promise<Result<{ conversas: DifyConversationsResponse['data']; temMais: boolean }, Error>> {
    try {
      const result = await this.client.getConversations({
        user,
        limit: params.limite,
        // Dify API doesn't standardly support sort param in all versions, checking support or ignoring
      });
      return ok({
        conversas: result.data,
        temMais: result.has_more,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar conversas Dify: ${message}`));
    }
  }

  async obterHistorico(params: { conversationId: string; limite: number }, user: string = 'system'): Promise<Result<{ mensagens: DifyMessagesResponse['data']; temMais: boolean }, Error>> {
    try {
      const result = await this.client.getMessages({
        conversation_id: params.conversationId,
        user,
        limit: params.limite,
      });
      return ok({
        mensagens: result.data,
        temMais: result.has_more,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter histórico Dify: ${message}`));
    }
  }

  async enviarFeedback(
    params: z.infer<typeof feedbackSchema>,
    user: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.sendFeedback(params.message_id, {
        rating: params.rating,
        user,
        content: params.content,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao enviar feedback Dify: ${message}`));
    }
  }

  // --- Info ---

  async obterInfoApp(): Promise<Result<Record<string, unknown>, Error>> {
    try {
      const result = await this.client.getAppInfo();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter info do app Dify: ${message}`));
    }
  }

  async obterParametrosApp(): Promise<Result<Record<string, unknown>, Error>> {
    try {
      const result = await this.client.getAppParameters();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter parâmetros do app Dify: ${message}`));
    }
  }

  async obterMetaApp(): Promise<Result<Record<string, unknown>, Error>> {
    try {
      const result = await this.client.getAppMeta();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter meta do app Dify: ${message}`));
    }
  }

  async obterMetadataCompleta(): Promise<Result<{ info: Record<string, unknown>; parameters: Record<string, unknown>; meta: Record<string, unknown> }, Error>> {
    try {
      const [info, parameters, meta] = await Promise.all([
        this.client.getAppInfo(),
        this.client.getAppParameters(),
        this.client.getAppMeta(),
      ]);

      return ok({ info, parameters, meta });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter metadata completa do app Dify: ${message}`));
    }
  }

  async completar(params: { inputs: Record<string, unknown> }, user: string = 'system'): Promise<Result<{ answer: string; messageId: string; usage: DifyChatResponse['metadata']['usage'] }, Error>> {
    try {
      const result = await this.client.completionMessages({
        inputs: params.inputs,
        user,
        response_mode: 'blocking',
      });
      return ok({
        answer: result.answer,
        messageId: result.message_id,
        usage: result.metadata.usage as DifyChatResponse['metadata']['usage'],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao completar mensagem Dify: ${message}`));
    }
  }

  async completarStream(params: { inputs: Record<string, unknown> }, user: string = 'system'): Promise<Result<ReadableStream<Uint8Array>, Error>> {
    try {
      const stream = await this.client.completionMessagesStream({
        inputs: params.inputs,
        user,
        response_mode: 'streaming',
      });
      return ok(stream);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao stream completion Dify: ${message}`));
    }
  }

  async uploadArquivo(file: File, user: string): Promise<Result<DifyFileUploadResponse, Error>> {
    try {
      const result = await this.client.uploadFile(file, user);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao fazer upload de arquivo Dify: ${message}`));
    }
  }

  // --- Métodos Extras para MCP Tools ---

  async enviarMensagemCompleta(params: { query: string; conversationId?: string; inputs?: Record<string, unknown> }, user: string = 'system'): Promise<Result<{ answer: string; conversationId: string; messageId: string }, Error>> {
    try {
      const result = await this.client.chatMessages({
        query: params.query,
        conversation_id: params.conversationId,
        inputs: params.inputs || {},
        user,
        response_mode: 'blocking',
      });
      return ok({
        answer: result.answer,
        conversationId: result.conversation_id,
        messageId: result.message_id,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao enviar mensagem completa Dify: ${message}`));
    }
  }

  async executarWorkflowCompleto(params: { inputs: Record<string, unknown> }, user: string = 'system'): Promise<Result<{ workflowRunId: string; status: string; outputs: Record<string, unknown>; totalTokens: number; tempoDecorrido: number; totalPassos: number }, Error>> {
    try {
      const result = await this.client.workflowRun({
        inputs: params.inputs,
        user,
        response_mode: 'blocking',
      });
      const data = result.data;
      return ok({
        workflowRunId: result.workflow_run_id,
        status: data.status,
        outputs: data.outputs,
        totalTokens: data.total_tokens,
        tempoDecorrido: data.elapsed_time,
        totalPassos: data.total_steps,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao executar workflow completo Dify: ${message}`));
    }
  }

  async obterSugestoes(messageId: string, user: string = 'system'): Promise<Result<string[], Error>> {
    try {
      const result = await this.client.getSuggestedQuestions(messageId, user);
      return ok(result.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter sugestões Dify: ${message}`));
    }
  }

  async pararTarefa(taskId: string, user: string = 'system'): Promise<Result<boolean, Error>> {
    try {
      // Tenta parar como chat e como workflow, pois a API não distingue claramente pelo ID no endpoint de stop
      // Ou assume que é chat messages stop task
      await this.client.stopChatTask(taskId, user);
      return ok(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao parar tarefa Dify: ${message}`));
    }
  }

  async listarDatasets(page = 1, limit = 20): Promise<Result<{ datasets: DifyDataset[]; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listDatasets({ page, limit });
      return ok({
        datasets: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar datasets Dify: ${message}`));
    }
  }

  async criarDataset(params: { name: string; description?: string }): Promise<Result<DifyDataset, Error>> {
    try {
      const result = await this.client.createDataset({
        name: params.name,
        description: params.description,
        indexing_technique: 'high_quality',
      });
      return ok(result as unknown as DifyDataset);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar dataset Dify: ${message}`));
    }
  }

  async listarDocumentos(datasetId: string, page = 1, limit = 20): Promise<Result<{ documents: DifyDocument[]; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listDocuments(datasetId, { page, limit });
      return ok({
        documents: result.data as DifyDocument[],
        temMais: result.has_more as boolean,
        total: result.total as number,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar documentos Dify: ${message}`));
    }
  }

  async criarDocumento(params: { datasetId: string; nome: string; texto: string }): Promise<Result<DifyDocument, Error>> {
    try {
      const result = await this.client.createDocument(params.datasetId, {
        name: params.nome,
        text: params.texto,
        indexing_technique: 'high_quality',
        process_rule: {
          mode: 'automatic',
        },
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar documento Dify: ${message}`));
    }
  }

  // =========================================================================
  // Conversations Extended
  // =========================================================================

  async renomearConversa(
    params: { conversationId: string; nome?: string; autoGenerate?: boolean },
    user: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.renameConversation(params.conversationId, {
        name: params.nome || '',
        auto_generate: params.autoGenerate ?? false,
        user,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao renomear conversa Dify: ${message}`));
    }
  }

  async deletarConversa(conversationId: string, user: string): Promise<Result<void, Error>> {
    try {
      await this.client.deleteConversation(conversationId, user);
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar conversa Dify: ${message}`));
    }
  }

  async obterMensagensConversa(
    params: { conversationId: string; limite?: number; firstId?: string },
    user: string = 'system'
  ): Promise<Result<{ mensagens: DifyMessagesResponse['data']; temMais: boolean }, Error>> {
    try {
      const result = await this.client.getConversationMessages(params.conversationId, {
        user,
        limit: params.limite,
        first_id: params.firstId,
      });
      return ok({
        mensagens: result.data,
        temMais: result.has_more,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter mensagens da conversa Dify: ${message}`));
    }
  }

  async obterVariaveisConversa(
    conversationId: string,
    user: string = 'system'
  ): Promise<Result<DifyConversationVariablesResponse, Error>> {
    try {
      const result = await this.client.getConversationVariables(conversationId, { user });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter variáveis da conversa Dify: ${message}`));
    }
  }

  // =========================================================================
  // Completion Stop
  // =========================================================================

  async pararCompletion(taskId: string, user: string = 'system'): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.stopCompletionTask(taskId, user);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao parar completion Dify: ${message}`));
    }
  }

  // =========================================================================
  // Workflow Logs
  // =========================================================================

  async listarLogsWorkflow(
    params: { keyword?: string; status?: 'succeeded' | 'failed' | 'stopped' | 'running'; page?: number; limit?: number } = {}
  ): Promise<Result<{ logs: DifyWorkflowLogsResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.getWorkflowLogs(params);
      return ok({
        logs: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar logs de workflow Dify: ${message}`));
    }
  }

  // =========================================================================
  // Audio API
  // =========================================================================

  async transcreverAudio(file: File, user: string): Promise<Result<{ texto: string }, Error>> {
    try {
      const result = await this.client.speechToText(file, user);
      return ok({ texto: result.text });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao transcrever áudio Dify: ${message}`));
    }
  }

  async sintetizarAudio(
    params: { texto?: string; messageId?: string; streaming?: boolean },
    user: string = 'system'
  ): Promise<Result<ArrayBuffer, Error>> {
    try {
      const result = await this.client.textToAudio({
        text: params.texto,
        message_id: params.messageId,
        user,
        streaming: params.streaming,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao sintetizar áudio Dify: ${message}`));
    }
  }

  // =========================================================================
  // Files Extended
  // =========================================================================

  async previewArquivo(fileId: string): Promise<Result<ArrayBuffer, Error>> {
    try {
      const result = await this.client.getFilePreview(fileId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter preview de arquivo Dify: ${message}`));
    }
  }

  async uploadArquivoWorkflow(file: File, user: string): Promise<Result<DifyFileUploadWorkflowResponse, Error>> {
    try {
      const result = await this.client.uploadFileWorkflow(file, user);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao fazer upload de arquivo para workflow Dify: ${message}`));
    }
  }

  // =========================================================================
  // Annotations API
  // =========================================================================

  async listarAnotacoes(
    page = 1,
    limit = 20
  ): Promise<Result<{ anotacoes: DifyAnnotationsResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listAnnotations({ page, limit });
      return ok({
        anotacoes: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar anotações Dify: ${message}`));
    }
  }

  async criarAnotacao(params: { pergunta: string; resposta: string }): Promise<Result<DifyAnnotation, Error>> {
    try {
      const result = await this.client.createAnnotation({
        question: params.pergunta,
        answer: params.resposta,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar anotação Dify: ${message}`));
    }
  }

  async atualizarAnotacao(
    anotacaoId: string,
    params: { pergunta: string; resposta: string }
  ): Promise<Result<DifyAnnotation, Error>> {
    try {
      const result = await this.client.updateAnnotation(anotacaoId, {
        question: params.pergunta,
        answer: params.resposta,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar anotação Dify: ${message}`));
    }
  }

  async deletarAnotacao(anotacaoId: string): Promise<Result<void, Error>> {
    try {
      await this.client.deleteAnnotation(anotacaoId);
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar anotação Dify: ${message}`));
    }
  }

  async habilitarRespostaAnotacao(
    params: { embeddingProviderName: string; embeddingModelName: string; scoreThreshold: number }
  ): Promise<Result<{ jobId: string; jobStatus: string }, Error>> {
    try {
      const result = await this.client.enableAnnotationReply({
        embedding_provider_name: params.embeddingProviderName,
        embedding_model_name: params.embeddingModelName,
        score_threshold: params.scoreThreshold,
      });
      return ok({ jobId: result.job_id, jobStatus: result.job_status });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao habilitar resposta por anotação Dify: ${message}`));
    }
  }

  async desabilitarRespostaAnotacao(): Promise<Result<{ jobId: string; jobStatus: string }, Error>> {
    try {
      const result = await this.client.disableAnnotationReply();
      return ok({ jobId: result.job_id, jobStatus: result.job_status });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao desabilitar resposta por anotação Dify: ${message}`));
    }
  }

  async obterStatusRespostaAnotacao(
    action: 'enable' | 'disable',
    jobId: string
  ): Promise<Result<DifyAnnotationReplyStatusResponse, Error>> {
    try {
      const result = await this.client.getAnnotationReplyStatus(action, jobId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter status de resposta por anotação Dify: ${message}`));
    }
  }

  // =========================================================================
  // App Feedbacks
  // =========================================================================

  async listarFeedbacksApp(
    page = 1,
    limit = 20
  ): Promise<Result<{ feedbacks: DifyAppFeedbacksResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.getAppFeedbacks({ page, limit });
      return ok({
        feedbacks: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar feedbacks do app Dify: ${message}`));
    }
  }

  // =========================================================================
  // Knowledge Base Retrieve
  // =========================================================================

  async buscarDataset(
    params: { datasetId: string; query: string; searchMethod?: string; topK?: number; scoreThreshold?: number }
  ): Promise<Result<DifyRetrieveResponse, Error>> {
    try {
      const result = await this.client.retrieveDataset(params.datasetId, {
        query: params.query,
        retrieval_model: {
          search_method: (params.searchMethod as 'keyword_search' | 'semantic_search' | 'full_text_search' | 'hybrid_search') || 'semantic_search',
          top_k: params.topK || 5,
          score_threshold_enabled: params.scoreThreshold !== undefined,
          score_threshold: params.scoreThreshold,
        },
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao buscar no dataset Dify: ${message}`));
    }
  }

  // =========================================================================
  // Documents Extended
  // =========================================================================

  async criarDocumentoPorArquivo(
    datasetId: string,
    file: File,
    processRule?: Record<string, unknown>
  ): Promise<Result<{ document: DifyDocument; batch: string }, Error>> {
    try {
      const result = await this.client.createDocumentByFile(datasetId, file, {
        indexing_technique: 'high_quality',
        process_rule: processRule || { mode: 'automatic' },
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar documento por arquivo Dify: ${message}`));
    }
  }

  async obterDetalheDocumento(documentId: string): Promise<Result<DifyDocumentDetail, Error>> {
    try {
      const result = await this.client.getDocumentDetail(documentId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter detalhe do documento Dify: ${message}`));
    }
  }

  async atualizarDocumentoTexto(
    documentId: string,
    params: { nome?: string; texto?: string }
  ): Promise<Result<{ document: DifyDocument; batch: string }, Error>> {
    try {
      const result = await this.client.updateDocumentText(documentId, {
        name: params.nome,
        text: params.texto,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar documento Dify: ${message}`));
    }
  }

  async atualizarDocumentoArquivo(
    documentId: string,
    file: File,
    processRule?: Record<string, unknown>
  ): Promise<Result<{ document: DifyDocument; batch: string }, Error>> {
    try {
      const result = await this.client.updateDocumentFile(documentId, file, {
        process_rule: processRule,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar documento por arquivo Dify: ${message}`));
    }
  }

  async obterStatusEmbedding(
    datasetId: string,
    batch: string
  ): Promise<Result<DifyBatchEmbeddingStatusResponse, Error>> {
    try {
      const result = await this.client.getBatchEmbeddingStatus(datasetId, batch);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter status de embedding Dify: ${message}`));
    }
  }

  async deletarDocumento(
    datasetId: string,
    documentId: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.deleteDocument(datasetId, documentId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar documento Dify: ${message}`));
    }
  }

  // =========================================================================
  // Segments API
  // =========================================================================

  async listarSegmentos(
    datasetId: string,
    documentId: string,
    params: { keyword?: string; status?: string } = {}
  ): Promise<Result<{ segmentos: DifySegmentsResponse['data']; temMais: boolean; total: number; docForm: string }, Error>> {
    try {
      const result = await this.client.listSegments(datasetId, documentId, params);
      return ok({
        segmentos: result.data,
        temMais: result.has_more,
        total: result.total,
        docForm: result.doc_form,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar segmentos Dify: ${message}`));
    }
  }

  async criarSegmentos(
    datasetId: string,
    documentId: string,
    segmentos: Array<{ content: string; answer?: string; keywords?: string[] }>
  ): Promise<Result<{ data: DifySegment[]; docForm: string }, Error>> {
    try {
      const result = await this.client.createSegments(datasetId, documentId, { segments: segmentos });
      return ok({ data: result.data, docForm: result.doc_form });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar segmentos Dify: ${message}`));
    }
  }

  async atualizarSegmento(
    datasetId: string,
    documentId: string,
    segmentId: string,
    params: { content: string; answer?: string; keywords?: string[]; enabled?: boolean }
  ): Promise<Result<{ data: DifySegment; docForm: string }, Error>> {
    try {
      const result = await this.client.updateSegment(datasetId, documentId, segmentId, {
        segment: params,
      });
      return ok({ data: result.data, docForm: result.doc_form });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar segmento Dify: ${message}`));
    }
  }

  async deletarSegmento(
    datasetId: string,
    documentId: string,
    segmentId: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.deleteSegment(datasetId, documentId, segmentId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar segmento Dify: ${message}`));
    }
  }

  // =========================================================================
  // Chunks API
  // =========================================================================

  async obterDetalheChunk(chunkId: string): Promise<Result<DifyChunk, Error>> {
    try {
      const result = await this.client.getChunkDetail(chunkId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao obter detalhe do chunk Dify: ${message}`));
    }
  }

  async atualizarChunk(chunkId: string, content: string): Promise<Result<DifyChunk, Error>> {
    try {
      const result = await this.client.updateChunk(chunkId, { content });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar chunk Dify: ${message}`));
    }
  }

  async deletarChunk(chunkId: string): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.deleteChunk(chunkId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar chunk Dify: ${message}`));
    }
  }

  async criarChunkFilho(chunkId: string, content: string): Promise<Result<DifyChunk, Error>> {
    try {
      const result = await this.client.createChildChunk(chunkId, { content });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar chunk filho Dify: ${message}`));
    }
  }

  async listarChunksFilhos(
    chunkId: string,
    page = 1,
    limit = 20
  ): Promise<Result<{ chunks: DifyChunksResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listChildChunks(chunkId, { page, limit });
      return ok({
        chunks: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar chunks filhos Dify: ${message}`));
    }
  }

  async atualizarChunkFilho(
    parentChunkId: string,
    childChunkId: string,
    content: string
  ): Promise<Result<DifyChunk, Error>> {
    try {
      const result = await this.client.updateChildChunk(parentChunkId, childChunkId, { content });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar chunk filho Dify: ${message}`));
    }
  }

  async deletarChunkFilho(
    parentChunkId: string,
    childChunkId: string
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.deleteChildChunk(parentChunkId, childChunkId);
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar chunk filho Dify: ${message}`));
    }
  }

  // =========================================================================
  // Tags API
  // =========================================================================

  async listarTags(tipo?: string): Promise<Result<{ tags: DifyTagsResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listTags({ type: tipo });
      return ok({
        tags: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar tags Dify: ${message}`));
    }
  }

  async criarTag(params: { nome: string; tipo?: string }): Promise<Result<DifyTag, Error>> {
    try {
      const result = await this.client.createTag({ name: params.nome, type: params.tipo });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao criar tag Dify: ${message}`));
    }
  }

  async atualizarTag(tagId: string, nome: string): Promise<Result<DifyTag, Error>> {
    try {
      const result = await this.client.updateTag(tagId, { name: nome });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar tag Dify: ${message}`));
    }
  }

  async deletarTag(tagId: string): Promise<Result<void, Error>> {
    try {
      await this.client.deleteTag(tagId);
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao deletar tag Dify: ${message}`));
    }
  }

  async vincularTagDataset(datasetId: string, tagIds: string[]): Promise<Result<void, Error>> {
    try {
      await this.client.bindDatasetTag(datasetId, { tag_ids: tagIds });
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao vincular tag ao dataset Dify: ${message}`));
    }
  }

  async listarTagsDataset(datasetId: string): Promise<Result<{ tags: DifyTagsResponse['data']; temMais: boolean; total: number }, Error>> {
    try {
      const result = await this.client.listDatasetTags(datasetId);
      return ok({
        tags: result.data,
        temMais: result.has_more,
        total: result.total,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar tags do dataset Dify: ${message}`));
    }
  }

  async desvincularTagDataset(datasetId: string, tagId: string): Promise<Result<void, Error>> {
    try {
      await this.client.unbindDatasetTag(datasetId, tagId);
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao desvincular tag do dataset Dify: ${message}`));
    }
  }

  // =========================================================================
  // Models API
  // =========================================================================

  async listarModelosEmbedding(): Promise<Result<DifyEmbeddingModelsResponse, Error>> {
    try {
      const result = await this.client.listEmbeddingModels();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao listar modelos de embedding Dify: ${message}`));
    }
  }

  // =========================================================================
  // Batch Operations
  // =========================================================================

  async atualizarStatusDocumentos(
    documentIds: string[],
    habilitado: boolean
  ): Promise<Result<{ result: string }, Error>> {
    try {
      const result = await this.client.batchUpdateDocumentStatus({
        document_ids: documentIds,
        enabled: habilitado,
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new Error(`Erro ao atualizar status de documentos Dify: ${message}`));
    }
  }
}

// --- Factory Function para Compatibilidade ---

/**
 * Cria uma instância do DifyService
 * @param apiKey - Chave da API Dify
 * @param apiUrl - URL base da API Dify
 * @returns Instância do DifyService
 */
export function createDifyService(apiKey: string, apiUrl: string): DifyService {
  return new DifyService(apiKey, apiUrl);
}
