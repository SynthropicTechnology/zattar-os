import { AssinaturaDigitalService } from '../../service';
import { AssinaturaDigitalRepository } from '../../repository';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('../../repository');
jest.mock('@supabase/supabase-js');

describe('AssinaturaDigitalService', () => {
  let service: AssinaturaDigitalService;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockRepository: jest.Mocked<AssinaturaDigitalRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = new SupabaseClient('url', 'key') as jest.Mocked<SupabaseClient>;
    
    // Setup repository mock instance
    // Since service instantiates repository with new, we need to ensure the mock constructor returns our mock instance
    mockRepository = {
      listarSegmentos: jest.fn(),
      buscarSegmentoPorSlug: jest.fn(),
      criarSegmento: jest.fn(),
      atualizarSegmento: jest.fn(),
      listarTemplates: jest.fn(),
      buscarTemplatePorId: jest.fn(),
      criarTemplate: jest.fn(),
    } as unknown as jest.Mocked<AssinaturaDigitalRepository>;

    (AssinaturaDigitalRepository as jest.Mock).mockImplementation(() => mockRepository);

    service = new AssinaturaDigitalService(mockSupabase);
  });

  describe('criarSegmento', () => {
    const validInput = {
      nome: 'Contratos RH',
      descricao: 'Segmento para RH',
      ativo: true
    };

    it('deve criar segmento com sucesso', async () => {
      // Arrange
      (mockRepository.buscarSegmentoPorSlug as jest.Mock).mockResolvedValue(null);
      (mockRepository.criarSegmento as jest.Mock).mockResolvedValue({ id: 1, ...validInput, slug: 'contratos-rh' });

      // Act
      const result = await service.criarSegmento(validInput);

      // Assert
      expect(result.id).toBe(1);
      expect(mockRepository.criarSegmento).toHaveBeenCalledWith(expect.objectContaining({
        nome: validInput.nome,
        slug: 'contratos-rh'
      }));
    });

    it('deve falhar se slug ja existe', async () => {
      // Arrange
      (mockRepository.buscarSegmentoPorSlug as jest.Mock).mockResolvedValue({ id: 2, ...validInput, slug: 'contratos-rh' });

      // Act & Assert
      await expect(service.criarSegmento(validInput))
        .rejects
        .toThrow(/Já existe um segmento com este nome ou slug/);
    });
  });

  describe('criarTemplate', () => {
    const validTemplate = {
      nome: 'Template Base',
      descricao: 'Desc',
      segmento_id: 1,
      tipo_template: 'markdown' as const,
      conteudo_markdown: '# Titulo',
      ativo: true
    };

    it('deve criar template com sucesso', async () => {
      // Arrange
      (mockRepository.criarTemplate as jest.Mock).mockResolvedValue({ id: 1, ...validTemplate });

      // Act
      const result = await service.criarTemplate(validTemplate);

      // Assert
      expect(result.id).toBe(1);
      expect(mockRepository.criarTemplate).toHaveBeenCalled();
    });

    it('deve falhar se markdown estiver vazio para tipo markdown', async () => {
      // Arrange
      const invalid = { ...validTemplate, conteudo_markdown: '' };

      // Act & Assert
      await expect(service.criarTemplate(invalid))
        .rejects
        .toThrow(/Conteúdo Markdown é obrigatório/);
    });
  });

  describe('processarVariaveisMarkdown', () => {
    it('deve substituir variaveis no markdown', async () => {
      const template = {
        id: 1,
        nome: 'T',
        tipo_template: 'markdown' as const,
        conteudo_markdown: 'Ola {{nome}}',
        ativo: true
      };

      const result = await service.processarVariaveisMarkdown(template as unknown as Parameters<typeof service.processarVariaveisMarkdown>[0], { nome: 'Mundo' });
      expect(result).toBe('Ola Mundo');
    });
  });
});
