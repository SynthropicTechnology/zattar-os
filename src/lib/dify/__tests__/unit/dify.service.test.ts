import { DifyService } from '../../service';

// Mock DifyClient
jest.mock('../../../../lib/dify/client');
jest.mock('../../../../lib/dify/config', () => ({
  isDifyConfigured: jest.fn().mockReturnValue(true),
}));

// Mock for createAsync path
jest.mock('../../repository', () => ({
  difyRepository: {
    getDifyApp: jest.fn(),
    getActiveDifyApp: jest.fn(),
  },
}));

// ============================================================================
// FIXTURES
// ============================================================================

const mockChatResponse = {
  message_id: 'msg-123',
  conversation_id: 'conv-456',
  answer: 'Resposta do assistente',
  created_at: 1700000000,
  metadata: {
    usage: { total_tokens: 100 },
  },
};

const mockWorkflowResponse = {
  workflow_run_id: 'wf-789',
  task_id: 'task-001',
  data: {
    id: 'run-001',
    status: 'succeeded',
    outputs: { text: 'Resultado do workflow' },
    elapsed_time: 2.5,
    total_tokens: 150,
    total_steps: 3,
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('DifyService', () => {
  let service: DifyService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create service and get reference to mocked client
    service = new DifyService('test-api-key', 'https://dify.example.com');
    // Access the private client to mock its methods
    mockClient = (service as unknown as { client: Record<string, jest.Mock> }).client;

    // Setup default mock implementations for commonly used methods
    mockClient.chatMessages = jest.fn().mockResolvedValue(mockChatResponse);
    mockClient.chatMessagesStream = jest.fn().mockResolvedValue(new ReadableStream());
    mockClient.workflowRun = jest.fn().mockResolvedValue(mockWorkflowResponse);
    mockClient.workflowRunStream = jest.fn().mockResolvedValue(new ReadableStream());
    mockClient.stopChatTask = jest.fn().mockResolvedValue({ result: 'success' });
    mockClient.stopWorkflowRun = jest.fn().mockResolvedValue({ result: 'success' });
    mockClient.getConversations = jest.fn().mockResolvedValue({ data: [], has_more: false });
    mockClient.getMessages = jest.fn().mockResolvedValue({ data: [], has_more: false });
    mockClient.sendFeedback = jest.fn().mockResolvedValue({ result: 'success' });
    mockClient.getAppInfo = jest.fn().mockResolvedValue({ name: 'Test App' });
    mockClient.getAppParameters = jest.fn().mockResolvedValue({ user_input_form: [] });
    mockClient.getAppMeta = jest.fn().mockResolvedValue({ tool_icons: {} });
    mockClient.completionMessages = jest.fn().mockResolvedValue({
      answer: 'Completion result',
      message_id: 'msg-comp',
      metadata: { usage: { total_tokens: 50 } },
    });
    mockClient.listDatasets = jest.fn().mockResolvedValue({ data: [], has_more: false, total: 0 });
    mockClient.createDataset = jest.fn().mockResolvedValue({ id: 'ds-1', name: 'Test' });
    mockClient.listAnnotations = jest.fn().mockResolvedValue({ data: [], has_more: false, total: 0 });
    mockClient.createAnnotation = jest.fn().mockResolvedValue({ id: 'ann-1' });
    mockClient.updateAnnotation = jest.fn().mockResolvedValue({ id: 'ann-1' });
    mockClient.deleteAnnotation = jest.fn().mockResolvedValue(undefined);
  });

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  describe('create (factory)', () => {
    it('deve criar instancia com sucesso', () => {
      const result = DifyService.create('key', 'https://url.com');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(DifyService);
      }
    });

    it('deve criar instancia sem parametros (fallback ENV)', () => {
      const result = DifyService.create();

      expect(result.isOk()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // CHAT
  // --------------------------------------------------------------------------

  describe('enviarMensagem', () => {
    it('deve enviar mensagem com sucesso', async () => {
      const result = await service.enviarMensagem(
        { query: 'Olá', inputs: {} },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.answer).toBe('Resposta do assistente');
        expect(result.value.conversation_id).toBe('conv-456');
      }
      expect(mockClient.chatMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Olá',
          user: 'user-1',
          response_mode: 'blocking',
        })
      );
    });

    it('deve retornar erro quando client falha', async () => {
      mockClient.chatMessages.mockRejectedValue(new Error('Network error'));

      const result = await service.enviarMensagem(
        { query: 'Olá', inputs: {} },
        'user-1'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Erro ao enviar mensagem Dify');
      }
    });
  });

  describe('enviarMensagemStream', () => {
    it('deve retornar stream com sucesso', async () => {
      const result = await service.enviarMensagemStream(
        { query: 'Olá', inputs: {} },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      expect(mockClient.chatMessagesStream).toHaveBeenCalledWith(
        expect.objectContaining({ response_mode: 'streaming' })
      );
    });

    it('deve retornar erro quando stream falha', async () => {
      mockClient.chatMessagesStream.mockRejectedValue(new Error('Stream failed'));

      const result = await service.enviarMensagemStream(
        { query: 'Olá', inputs: {} },
        'user-1'
      );

      expect(result.isErr()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOWS
  // --------------------------------------------------------------------------

  describe('executarWorkflow', () => {
    it('deve executar workflow com sucesso', async () => {
      const result = await service.executarWorkflow(
        { inputs: { campo: 'valor' } },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.workflow_run_id).toBe('wf-789');
      }
      expect(mockClient.workflowRun).toHaveBeenCalledWith(
        expect.objectContaining({
          inputs: { campo: 'valor' },
          user: 'user-1',
          response_mode: 'blocking',
        })
      );
    });

    it('deve retornar erro quando workflow falha', async () => {
      mockClient.workflowRun.mockRejectedValue(new Error('Workflow timeout'));

      const result = await service.executarWorkflow(
        { inputs: {} },
        'user-1'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Erro ao executar workflow Dify');
      }
    });
  });

  describe('stopChatGeneration', () => {
    it('deve parar geracao do chat', async () => {
      const result = await service.stopChatGeneration('task-123', 'user-1');

      expect(result.isOk()).toBe(true);
      expect(mockClient.stopChatTask).toHaveBeenCalledWith('task-123', 'user-1');
    });
  });

  describe('stopWorkflow', () => {
    it('deve parar workflow', async () => {
      const result = await service.stopWorkflow('task-456', 'user-1');

      expect(result.isOk()).toBe(true);
      expect(mockClient.stopWorkflowRun).toHaveBeenCalledWith('task-456', 'user-1');
    });
  });

  // --------------------------------------------------------------------------
  // CONVERSATIONS & MESSAGES
  // --------------------------------------------------------------------------

  describe('listarConversas', () => {
    it('deve listar conversas', async () => {
      mockClient.getConversations.mockResolvedValue({
        data: [{ id: 'conv-1', name: 'Test' }],
        has_more: false,
      });

      const result = await service.listarConversas({ limite: 10 }, 'user-1');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.conversas).toHaveLength(1);
        expect(result.value.temMais).toBe(false);
      }
    });

    it('deve retornar erro quando falha', async () => {
      mockClient.getConversations.mockRejectedValue(new Error('API error'));

      const result = await service.listarConversas({ limite: 10 });

      expect(result.isErr()).toBe(true);
    });
  });

  describe('obterHistorico', () => {
    it('deve obter historico de mensagens', async () => {
      mockClient.getMessages.mockResolvedValue({
        data: [{ id: 'msg-1', query: 'Ola', answer: 'Oi' }],
        has_more: true,
      });

      const result = await service.obterHistorico(
        { conversationId: 'conv-1', limite: 20 },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.mensagens).toHaveLength(1);
        expect(result.value.temMais).toBe(true);
      }
    });
  });

  describe('enviarFeedback', () => {
    it('deve enviar feedback com sucesso', async () => {
      const result = await service.enviarFeedback(
        { message_id: 'msg-1', rating: 'like' },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      expect(mockClient.sendFeedback).toHaveBeenCalledWith('msg-1', {
        rating: 'like',
        user: 'user-1',
        content: undefined,
      });
    });
  });

  // --------------------------------------------------------------------------
  // APP INFO
  // --------------------------------------------------------------------------

  describe('obterInfoApp', () => {
    it('deve obter info do app', async () => {
      const result = await service.obterInfoApp();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'Test App' });
      }
    });

    it('deve retornar erro quando falha', async () => {
      mockClient.getAppInfo.mockRejectedValue(new Error('Unauthorized'));

      const result = await service.obterInfoApp();

      expect(result.isErr()).toBe(true);
    });
  });

  describe('obterMetadataCompleta', () => {
    it('deve obter metadata completa em paralelo', async () => {
      const result = await service.obterMetadataCompleta();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty('info');
        expect(result.value).toHaveProperty('parameters');
        expect(result.value).toHaveProperty('meta');
      }
      expect(mockClient.getAppInfo).toHaveBeenCalled();
      expect(mockClient.getAppParameters).toHaveBeenCalled();
      expect(mockClient.getAppMeta).toHaveBeenCalled();
    });

    it('deve retornar erro se qualquer chamada falha', async () => {
      mockClient.getAppParameters.mockRejectedValue(new Error('Fail'));

      const result = await service.obterMetadataCompleta();

      expect(result.isErr()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // COMPLETION
  // --------------------------------------------------------------------------

  describe('completar', () => {
    it('deve completar mensagem com sucesso', async () => {
      const result = await service.completar(
        { inputs: { texto: 'Complete isso' } },
        'user-1'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.answer).toBe('Completion result');
        expect(result.value.messageId).toBe('msg-comp');
      }
    });
  });

  // --------------------------------------------------------------------------
  // DATASETS
  // --------------------------------------------------------------------------

  describe('listarDatasets', () => {
    it('deve listar datasets', async () => {
      const result = await service.listarDatasets(1, 10);

      expect(result.isOk()).toBe(true);
      expect(mockClient.listDatasets).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('criarDataset', () => {
    it('deve criar dataset com sucesso', async () => {
      const result = await service.criarDataset({ name: 'Novo Dataset' });

      expect(result.isOk()).toBe(true);
      expect(mockClient.createDataset).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Novo Dataset' })
      );
    });
  });

  // --------------------------------------------------------------------------
  // ANNOTATIONS
  // --------------------------------------------------------------------------

  describe('criarAnotacao', () => {
    it('deve criar anotacao com sucesso', async () => {
      const result = await service.criarAnotacao({
        pergunta: 'O que e isso?',
        resposta: 'Isso e um teste',
      });

      expect(result.isOk()).toBe(true);
      expect(mockClient.createAnnotation).toHaveBeenCalledWith({
        question: 'O que e isso?',
        answer: 'Isso e um teste',
      });
    });
  });

  describe('deletarAnotacao', () => {
    it('deve deletar anotacao com sucesso', async () => {
      const result = await service.deletarAnotacao('ann-1');

      expect(result.isOk()).toBe(true);
      expect(mockClient.deleteAnnotation).toHaveBeenCalledWith('ann-1');
    });

    it('deve retornar erro quando falha', async () => {
      mockClient.deleteAnnotation.mockRejectedValue(new Error('Not found'));

      const result = await service.deletarAnotacao('invalid');

      expect(result.isErr()).toBe(true);
    });
  });
});
