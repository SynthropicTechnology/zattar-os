import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createChatService } from '../../service';
import {
  actionCriarSala,
  actionCriarGrupo,
  actionListarSalas,
  actionArquivarSala,
  actionDesarquivarSala,
  actionRemoverConversa,
  actionDeletarSala,
  actionAtualizarNomeSala,
  actionEnviarMensagem,
  actionBuscarHistorico,
  actionAtualizarStatusMensagem,
} from '../../actions/chat-actions';
import { criarSalaMock, criarMensagemMock } from '../fixtures';
import { TipoSalaChat, TipoMensagemChat } from '../../domain';

// Mocks
jest.mock('@/lib/supabase/server');
jest.mock('../../service');
jest.mock('next/cache');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateChatService = createChatService as jest.MockedFunction<typeof createChatService>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('Chat Actions - Unit Tests', () => {
  const mockUserId = 1;
  const mockAuthUser = { id: 'auth-123' };
  const mockSala = criarSalaMock();
  const mockMensagem = criarMensagemMock();

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  const mockChatService = {
    criarSala: jest.fn(),
    criarGrupo: jest.fn(),
    listarSalasDoUsuario: jest.fn(),
    arquivarSala: jest.fn(),
    desarquivarSala: jest.fn(),
    removerConversa: jest.fn(),
    deletarSala: jest.fn(),
    atualizarNomeSala: jest.fn(),
    enviarMensagem: jest.fn(),
    buscarHistorico: jest.fn(),
    buscarHistoricoMensagens: jest.fn(),
    atualizarStatusMensagem: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockAuthUser }, error: null } as any);
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: mockUserId }, error: null }),
        }),
      }),
    } as any);
    mockCreateChatService.mockResolvedValue(mockChatService as any);
  });

  describe('actionCriarSala', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const formData = new FormData();
      formData.append('nome', 'Sala Teste');
      formData.append('tipo', TipoSalaChat.Geral);

      const result = await actionCriarSala(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve retornar erro de validação quando dados inválidos', async () => {
      const formData = new FormData();
      formData.append('nome', '');
      formData.append('tipo', TipoSalaChat.Geral);

      const result = await actionCriarSala(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro de validação.');
    });

    it('deve criar sala com sucesso', async () => {
      mockChatService.criarSala.mockResolvedValue({ isErr: () => false, value: mockSala } as any);

      const formData = new FormData();
      formData.append('nome', 'Sala Teste');
      formData.append('tipo', TipoSalaChat.Geral);

      const result = await actionCriarSala(null, formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSala);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });

    it('deve criar sala com documentoId', async () => {
      mockChatService.criarSala.mockResolvedValue({ isErr: () => false, value: mockSala } as any);

      const formData = new FormData();
      formData.append('nome', 'Sala Documento');
      formData.append('tipo', TipoSalaChat.Documento);
      formData.append('documentoId', '5');

      const result = await actionCriarSala(null, formData);

      expect(result.success).toBe(true);
      expect(mockChatService.criarSala).toHaveBeenCalledWith(
        expect.objectContaining({ documentoId: 5 }),
        mockUserId
      );
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.criarSala.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Erro ao criar sala' },
      } as any);

      const formData = new FormData();
      formData.append('nome', 'Sala Teste');
      formData.append('tipo', TipoSalaChat.Geral);

      const result = await actionCriarSala(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao criar sala');
    });
  });

  describe('actionCriarGrupo', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionCriarGrupo('Grupo Teste', [2, 3]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve retornar erro quando nome vazio', async () => {
      const result = await actionCriarGrupo('', [2, 3]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nome do grupo é obrigatório.');
    });

    it('deve retornar erro quando membrosIds vazio', async () => {
      const result = await actionCriarGrupo('Grupo Teste', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Adicione pelo menos um membro ao grupo.');
    });

    it('deve criar grupo com sucesso', async () => {
      mockChatService.criarGrupo.mockResolvedValue({ isErr: () => false, value: mockSala } as any);

      const result = await actionCriarGrupo('Grupo Teste', [2, 3]);

      expect(result.success).toBe(true);
      expect(mockChatService.criarGrupo).toHaveBeenCalledWith('Grupo Teste', [2, 3], mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });
  });

  describe('actionEnviarMensagem', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionEnviarMensagem(1, 'Mensagem', TipoMensagemChat.Texto);

      expect(result.success).toBe(false);
    });

    it('deve enviar mensagem de texto com sucesso', async () => {
      mockChatService.enviarMensagem.mockResolvedValue({
        isErr: () => false,
        value: mockMensagem,
      } as any);

      const result = await actionEnviarMensagem(1, 'Mensagem', TipoMensagemChat.Texto);

      expect(result.success).toBe(true);
      expect(mockChatService.enviarMensagem).toHaveBeenCalledWith(
        expect.objectContaining({
          salaId: 1,
          conteudo: 'Mensagem',
          tipo: TipoMensagemChat.Texto,
        }),
        mockUserId
      );
    });

    it('deve enviar mensagem com data', async () => {
      mockChatService.enviarMensagem.mockResolvedValue({
        isErr: () => false,
        value: mockMensagem,
      } as any);

      const data = { fileName: 'arquivo.pdf', fileUrl: 'https://example.com/arquivo.pdf' };
      const result = await actionEnviarMensagem(1, 'Arquivo', TipoMensagemChat.Arquivo, data);

      expect(result.success).toBe(true);
      expect(mockChatService.enviarMensagem).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
        mockUserId
      );
    });
  });

  describe('actionAtualizarStatusMensagem', () => {
    it('deve rejeitar status não permitido', async () => {
      const result = await actionAtualizarStatusMensagem(1, 'pending' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('não pode ser persistido');
    });

    it('deve atualizar status permitido', async () => {
      mockChatService.atualizarStatusMensagem.mockResolvedValue({
        isErr: () => false,
        value: mockMensagem,
      } as any);

      const result = await actionAtualizarStatusMensagem(1, 'read');

      expect(result.success).toBe(true);
      expect(mockChatService.atualizarStatusMensagem).toHaveBeenCalledWith(1, 'read');
    });
  });

  describe('actionArquivarSala', () => {
    it('deve arquivar sala com sucesso', async () => {
      mockChatService.arquivarSala.mockResolvedValue({ isErr: () => false, value: mockSala } as any);

      const result = await actionArquivarSala(1);

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });
  });

  describe('actionDeletarSala', () => {
    it('deve deletar sala com sucesso', async () => {
      mockChatService.deletarSala.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionDeletarSala(1);

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });
  });

  describe('actionListarSalas', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionListarSalas({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve listar salas com sucesso', async () => {
      const mockSalas = { salas: [mockSala], total: 1 };
      mockChatService.listarSalasDoUsuario.mockResolvedValue({ isErr: () => false, value: mockSalas } as any);

      const result = await actionListarSalas({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSalas);
      expect(mockChatService.listarSalasDoUsuario).toHaveBeenCalledWith(mockUserId, {});
    });

    it('deve listar salas com parâmetros de filtro', async () => {
      const mockSalas = { salas: [mockSala], total: 1 };
      mockChatService.listarSalasDoUsuario.mockResolvedValue({ isErr: () => false, value: mockSalas } as any);

      const params = { arquivada: false, tipo: TipoSalaChat.Geral };
      const result = await actionListarSalas(params);

      expect(result.success).toBe(true);
      expect(mockChatService.listarSalasDoUsuario).toHaveBeenCalledWith(mockUserId, params);
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.listarSalasDoUsuario.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Erro ao listar salas' },
      } as any);

      const result = await actionListarSalas({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao listar salas');
    });
  });

  describe('actionDesarquivarSala', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionDesarquivarSala(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve desarquivar sala com sucesso', async () => {
      mockChatService.desarquivarSala.mockResolvedValue({ isErr: () => false, value: mockSala } as any);

      const result = await actionDesarquivarSala(1);

      expect(result.success).toBe(true);
      expect(mockChatService.desarquivarSala).toHaveBeenCalledWith(1, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.desarquivarSala.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Sala não encontrada' },
      } as any);

      const result = await actionDesarquivarSala(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sala não encontrada');
    });
  });

  describe('actionRemoverConversa', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionRemoverConversa(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve remover conversa com sucesso', async () => {
      mockChatService.removerConversa.mockResolvedValue({ isErr: () => false, value: undefined } as any);

      const result = await actionRemoverConversa(1);

      expect(result.success).toBe(true);
      expect(mockChatService.removerConversa).toHaveBeenCalledWith(1, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.removerConversa.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Permissão negada' },
      } as any);

      const result = await actionRemoverConversa(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });
  });

  describe('actionBuscarHistorico', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionBuscarHistorico(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve buscar histórico com sucesso', async () => {
      const mockHistorico = { mensagens: [mockMensagem], hasMore: false };
      mockChatService.buscarHistoricoMensagens.mockResolvedValue({
        isErr: () => false,
        value: mockHistorico,
      } as any);

      const result = await actionBuscarHistorico(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistorico);
      expect(mockChatService.buscarHistoricoMensagens).toHaveBeenCalledWith(
        1,
        mockUserId,
        undefined,
        undefined
      );
    });

    it('deve buscar histórico com limite e offset', async () => {
      const mockHistorico = { mensagens: [mockMensagem], hasMore: true };
      mockChatService.buscarHistoricoMensagens.mockResolvedValue({
        isErr: () => false,
        value: mockHistorico,
      } as any);

      const result = await actionBuscarHistorico(1, 50, '2024-01-01T00:00:00Z');

      expect(result.success).toBe(true);
      expect(mockChatService.buscarHistoricoMensagens).toHaveBeenCalledWith(
        1,
        mockUserId,
        50,
        '2024-01-01T00:00:00Z'
      );
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.buscarHistoricoMensagens.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Sala não encontrada' },
      } as any);

      const result = await actionBuscarHistorico(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sala não encontrada');
    });
  });

  describe('actionAtualizarNomeSala', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionAtualizarNomeSala(1, 'Novo Nome');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado.');
    });

    it('deve atualizar nome da sala com sucesso', async () => {
      const mockSalaAtualizada = { ...mockSala, nome: 'Novo Nome' };
      mockChatService.atualizarNomeSala.mockResolvedValue({
        isErr: () => false,
        value: mockSalaAtualizada,
      } as any);

      const result = await actionAtualizarNomeSala(1, 'Novo Nome');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSalaAtualizada);
      expect(mockChatService.atualizarNomeSala).toHaveBeenCalledWith(1, 'Novo Nome', mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/chat');
    });

    it('deve retornar erro quando service falha', async () => {
      mockChatService.atualizarNomeSala.mockResolvedValue({
        isErr: () => true,
        error: { message: 'Apenas criadores podem alterar o nome' },
      } as any);

      const result = await actionAtualizarNomeSala(1, 'Novo Nome');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Apenas criadores podem alterar o nome');
    });
  });
});
