import {
  iniciarEntrevista,
  salvarModulo,
  finalizarEntrevista,
  reabrirEntrevista,
  buscarEntrevistaPorContrato,
  buscarEntrevista,
} from '../../service';
import {
  findByContratoId,
  findById,
  create,
  updateRespostas,
  updateStatus,
  updateModuloAtual,
  updateTestemunhas,
} from '../../repository';
import { ok, err, appError } from '@/types';
import type { EntrevistaTrabalhista } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(),
}));

describe('Entrevistas Trabalhistas Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // FIXTURES
  // =========================================================================

  function mockEntrevista(overrides: Partial<EntrevistaTrabalhista> = {}): EntrevistaTrabalhista {
    return {
      id: 1,
      contratoId: 100,
      tipoLitigio: 'trabalhista_classico',
      perfilReclamante: 'comerciario',
      status: 'em_andamento',
      moduloAtual: 'vinculo',
      respostas: {},
      notasOperador: null,
      testemunhasMapeadas: false,
      createdBy: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  const entrevistaEmAndamento = mockEntrevista();

  const entrevistaConcluida = mockEntrevista({
    status: 'concluida',
    respostas: {
      vinculo: {
        ctps_assinada: 'sim_ok',
        funcao_cargo: 'Vendedor',
        remuneracao_mensal: 'R$ 2.000',
        data_admissao: '2020-01-01',
      },
      ruptura: {
        motivo: 'demissao_sem_justa_causa',
        data_demissao: '2023-12-01',
      },
      consolidacao_final: {
        relato_completo_texto: 'Relato completo do caso trabalhista.',
      },
    },
  });

  // =========================================================================
  // INICIAR ENTREVISTA
  // =========================================================================

  describe('iniciarEntrevista', () => {
    it('deve criar entrevista com dados validos', async () => {
      const input = {
        contratoId: 100,
        tipoLitigio: 'trabalhista_classico' as const,
        perfilReclamante: 'comerciario' as const,
      };
      (findByContratoId as jest.Mock).mockResolvedValue(ok(null));
      (create as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      const result = await iniciarEntrevista(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contratoId).toBe(100);
      }
      expect(create).toHaveBeenCalled();
    });

    it('deve falhar quando ja existe entrevista para o contrato', async () => {
      const input = {
        contratoId: 100,
        tipoLitigio: 'trabalhista_classico' as const,
      };
      (findByContratoId as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      const result = await iniciarEntrevista(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Já existe');
      }
      expect(create).not.toHaveBeenCalled();
    });

    it('deve falhar com contratoId invalido', async () => {
      const input = {
        contratoId: -1,
        tipoLitigio: 'trabalhista_classico' as const,
      };

      const result = await iniciarEntrevista(input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(create).not.toHaveBeenCalled();
    });

    it('deve falhar com tipoLitigio invalido', async () => {
      const input = {
        contratoId: 100,
        tipoLitigio: 'invalido' as any,
      };

      const result = await iniciarEntrevista(input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve propagar erro do repository ao verificar existente', async () => {
      const input = {
        contratoId: 100,
        tipoLitigio: 'trabalhista_classico' as const,
      };
      (findByContratoId as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro no banco')),
      );

      const result = await iniciarEntrevista(input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  // =========================================================================
  // SALVAR MODULO
  // =========================================================================

  describe('salvarModulo', () => {
    it('deve salvar respostas de um modulo', async () => {
      const respostas = { ctps_assinada: 'sim_ok', funcao_cargo: 'Analista' };
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));
      (updateRespostas as jest.Mock).mockResolvedValue(
        ok(mockEntrevista({ respostas: { vinculo: respostas } })),
      );

      const result = await salvarModulo(1, 'vinculo', respostas);

      expect(result.success).toBe(true);
      expect(updateRespostas).toHaveBeenCalledWith(1, 'vinculo', respostas, undefined);
    });

    it('deve avancar para proximo modulo quando solicitado', async () => {
      const respostas = { ctps_assinada: 'sim_ok' };
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));
      (updateRespostas as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));
      (updateModuloAtual as jest.Mock).mockResolvedValue(
        ok(mockEntrevista({ moduloAtual: 'jornada' })),
      );

      const result = await salvarModulo(1, 'vinculo', respostas, true);

      expect(result.success).toBe(true);
      // Proximo modulo apos 'vinculo' na trilha classico e 'jornada'
      expect(updateModuloAtual).toHaveBeenCalledWith(1, 'jornada');
    });

    it('nao deve avancar se esta no ultimo modulo', async () => {
      const entrevistaUltimoModulo = mockEntrevista({ moduloAtual: 'consolidacao_final' });
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaUltimoModulo));
      (updateRespostas as jest.Mock).mockResolvedValue(ok(entrevistaUltimoModulo));

      const result = await salvarModulo(1, 'consolidacao_final', {}, true);

      expect(result.success).toBe(true);
      expect(updateModuloAtual).not.toHaveBeenCalled();
    });

    it('deve falhar quando entrevista nao existe', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(null));

      const result = await salvarModulo(999, 'vinculo', {});

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('deve falhar quando entrevista esta concluida', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaConcluida));

      const result = await salvarModulo(1, 'vinculo', {});

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve salvar nota do operador', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));
      (updateRespostas as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      await salvarModulo(1, 'vinculo', {}, false, 'Nota do operador');

      expect(updateRespostas).toHaveBeenCalledWith(1, 'vinculo', {}, 'Nota do operador');
    });

    it('deve propagar erro do repository', async () => {
      (findById as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro')),
      );

      const result = await salvarModulo(1, 'vinculo', {});

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // FINALIZAR ENTREVISTA
  // =========================================================================

  describe('finalizarEntrevista', () => {
    const entrevistaCompleta = mockEntrevista({
      status: 'em_andamento',
      tipoLitigio: 'trabalhista_classico',
      respostas: {
        vinculo: {
          ctps_assinada: 'sim_ok',
          funcao_cargo: 'Vendedor',
          remuneracao_mensal: 'R$ 2.000',
          data_admissao: '2020-01-01',
        },
        ruptura: {
          motivo: 'demissao_sem_justa_causa',
          data_demissao: '2023-12-01',
        },
        consolidacao_final: {
          relato_completo_texto: 'Relato completo do caso.',
        },
      },
    });

    it('deve finalizar entrevista com todos os campos obrigatorios', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaCompleta));
      (updateTestemunhas as jest.Mock).mockResolvedValue(ok(entrevistaCompleta));
      (updateStatus as jest.Mock).mockResolvedValue(
        ok(mockEntrevista({ ...entrevistaCompleta, status: 'concluida' })),
      );

      const result = await finalizarEntrevista(1, true);

      expect(result.success).toBe(true);
      expect(updateTestemunhas).toHaveBeenCalledWith(1, true);
      expect(updateStatus).toHaveBeenCalledWith(1, 'concluida');
    });

    it('deve falhar quando entrevista nao existe', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(null));

      const result = await finalizarEntrevista(999, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('deve falhar quando ja esta concluida', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaConcluida));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve falhar sem campo CTPS (trabalhista classico)', async () => {
      const semCtps = mockEntrevista({
        status: 'em_andamento',
        respostas: {
          vinculo: { funcao_cargo: 'X', remuneracao_mensal: '1000', data_admissao: '2020-01-01' },
          ruptura: { motivo: 'demissao_sem_justa_causa', data_demissao: '2023-01-01' },
          consolidacao_final: { relato_completo_texto: 'Texto' },
        },
      });
      (findById as jest.Mock).mockResolvedValue(ok(semCtps));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('CTPS');
    });

    it('deve falhar sem relato consolidacao final', async () => {
      const semRelato = mockEntrevista({
        status: 'em_andamento',
        respostas: {
          vinculo: {
            ctps_assinada: 'sim_ok',
            funcao_cargo: 'Vendedor',
            remuneracao_mensal: '2000',
            data_admissao: '2020-01-01',
          },
          ruptura: { motivo: 'demissao_sem_justa_causa', data_demissao: '2023-01-01' },
          consolidacao_final: {},
        },
      });
      (findById as jest.Mock).mockResolvedValue(ok(semRelato));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('relato completo');
    });

    it('deve falhar sem motivo da ruptura (trabalhista classico)', async () => {
      const semMotivo = mockEntrevista({
        status: 'em_andamento',
        respostas: {
          vinculo: {
            ctps_assinada: 'sim_ok',
            funcao_cargo: 'Vendedor',
            remuneracao_mensal: '2000',
            data_admissao: '2020-01-01',
          },
          ruptura: { data_demissao: '2023-01-01' },
          consolidacao_final: { relato_completo_texto: 'Texto' },
        },
      });
      (findById as jest.Mock).mockResolvedValue(ok(semMotivo));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('motivo');
    });

    // Gig economy validation
    it('deve falhar sem tipo_plataforma (gig economy)', async () => {
      const gigIncompleto = mockEntrevista({
        status: 'em_andamento',
        tipoLitigio: 'gig_economy',
        respostas: {
          controle_algoritmico: {},
          condicoes_trabalho_gig: { horas_dia: 'ate_8' },
          desligamento_plataforma: { forma_desligamento: 'bloqueio_definitivo', data_fim_plataforma: '2023-12-01' },
          consolidacao_final: { relato_completo_texto: 'Texto' },
        },
      });
      (findById as jest.Mock).mockResolvedValue(ok(gigIncompleto));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('plataforma');
    });

    // Pejotizacao validation
    it('deve falhar sem origem_pj (pejotizacao)', async () => {
      const pjIncompleto = mockEntrevista({
        status: 'em_andamento',
        tipoLitigio: 'pejotizacao',
        respostas: {
          contrato_pj: {},
          fraude_verbas: { regime_ferias: 'nao_tirava' },
          consolidacao_final: { relato_completo_texto: 'Texto' },
        },
      });
      (findById as jest.Mock).mockResolvedValue(ok(pjIncompleto));

      const result = await finalizarEntrevista(1, false);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('origem do PJ');
    });
  });

  // =========================================================================
  // REABRIR ENTREVISTA
  // =========================================================================

  describe('reabrirEntrevista', () => {
    it('deve reabrir entrevista concluida', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaConcluida));
      (updateStatus as jest.Mock).mockResolvedValue(
        ok(mockEntrevista({ status: 'em_andamento' })),
      );

      const result = await reabrirEntrevista(1);

      expect(result.success).toBe(true);
      expect(updateStatus).toHaveBeenCalledWith(1, 'em_andamento');
    });

    it('deve falhar quando entrevista nao existe', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(null));

      const result = await reabrirEntrevista(999);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('deve falhar quando entrevista nao esta concluida', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      const result = await reabrirEntrevista(1);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // BUSCAS
  // =========================================================================

  describe('buscarEntrevistaPorContrato', () => {
    it('deve retornar entrevista existente', async () => {
      (findByContratoId as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      const result = await buscarEntrevistaPorContrato(100);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data?.contratoId).toBe(100);
    });

    it('deve retornar null quando nao existe', async () => {
      (findByContratoId as jest.Mock).mockResolvedValue(ok(null));

      const result = await buscarEntrevistaPorContrato(999);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });

    it('deve falhar com contratoId invalido', async () => {
      const result = await buscarEntrevistaPorContrato(0);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve falhar com contratoId negativo', async () => {
      const result = await buscarEntrevistaPorContrato(-5);

      expect(result.success).toBe(false);
    });
  });

  describe('buscarEntrevista', () => {
    it('deve retornar entrevista por ID', async () => {
      (findById as jest.Mock).mockResolvedValue(ok(entrevistaEmAndamento));

      const result = await buscarEntrevista(1);

      expect(result.success).toBe(true);
      expect(findById).toHaveBeenCalledWith(1);
    });

    it('deve falhar com ID invalido', async () => {
      const result = await buscarEntrevista(0);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
