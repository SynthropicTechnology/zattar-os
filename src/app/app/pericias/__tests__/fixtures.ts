import { SituacaoPericiaCodigo } from '../domain';
import type { Pericia, GrauTribunal } from '../domain';
import type { PaginatedResponse } from '@/types';

export function criarPericiaMock(overrides: Partial<Pericia> = {}): Pericia {
  return {
    id: 1,
    idPje: 12345,
    advogadoId: 1,
    processoId: 100,
    orgaoJulgadorId: 1,
    trt: 'TRT2',
    grau: 'primeiro_grau' as GrauTribunal,
    numeroProcesso: '0001234-56.2023.5.02.0001',
    prazoEntrega: '2024-12-31',
    dataAceite: '2024-01-15',
    dataCriacao: '2024-01-10',
    situacaoCodigo: SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
    situacaoDescricao: 'Aguardando Laudo',
    situacaoPericia: 'Aguardando Laudo',
    idDocumentoLaudo: null,
    laudoJuntado: false,
    especialidadeId: 1,
    peritoId: 10,
    classeJudicialSigla: 'AT',
    dataProximaAudiencia: null,
    segredoJustica: false,
    juizoDigital: true,
    arquivado: false,
    prioridadeProcessual: false,
    permissoesPericia: null,
    funcionalidadeEditor: null,
    responsavelId: 5,
    observacoes: 'Observações da perícia',
    dadosAnteriores: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    especialidade: { descricao: 'Medicina do Trabalho' },
    perito: { nome: 'Dr. João Silva' },
    responsavel: { nomeExibicao: 'Maria Santos' },
    processo: {
      numeroProcesso: '0001234-56.2023.5.02.0001',
      nomeParteAutora: 'João da Silva',
      nomeParteRe: 'Empresa XPTO Ltda',
    },
    ...overrides,
  };
}

export function criarEspecialidadeMock(
  overrides: Partial<{ id: number; descricao: string }> = {}
): { id: number; descricao: string } {
  return {
    id: 1,
    descricao: 'Medicina do Trabalho',
    ...overrides,
  };
}

export function criarListarPericiasResultMock(
  numeroPericias: number = 2,
  overrides: Partial<PaginatedResponse<Pericia>> = {}
): PaginatedResponse<Pericia> {
  const pericias = Array.from({ length: numeroPericias }, (_, index) =>
    criarPericiaMock({
      id: index + 1,
      numeroProcesso: `000${index + 1}234-56.2023.5.02.0001`,
    })
  );

  return {
    data: pericias,
    pagination: {
      page: 1,
      limit: 50,
      total: numeroPericias,
      totalPages: 1,
      hasMore: false,
    },
    ...overrides,
  };
}

export const mockSituacaoPericia: Record<string, SituacaoPericiaCodigo> = {
  aguardandoEsclarecimentos: SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS,
  aguardandoLaudo: SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
  cancelada: SituacaoPericiaCodigo.CANCELADA,
  finalizada: SituacaoPericiaCodigo.FINALIZADA,
  laudoJuntado: SituacaoPericiaCodigo.LAUDO_JUNTADO,
  redesignada: SituacaoPericiaCodigo.REDESIGNADA,
};

export const mockCodigoTribunal = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09',
  '10', '11', '12', '13', '14', '15', '16', '17', '18',
  '19', '20', '21', '22', '23', '24',
] as const;

export const mockGrauTribunal = {
  primeiroGrau: 'primeiro_grau',
  segundoGrau: 'segundo_grau',
  tribunalSuperior: 'tribunal_superior',
} as const;
