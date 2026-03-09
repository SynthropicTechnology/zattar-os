
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  buscarFolhaPorId,
  buscarSalariosVigentesNoMes,
  verificarFolhaExistente,
  criarFolhaPagamento,
  criarItemFolha,
  deletarFolhaPagamento,
  atualizarValorTotalFolha,
  atualizarStatusFolha,
  vincularLancamentoAoItem,
} from './repository';
import {
  GerarFolhaDTO,
  FolhaPagamentoComDetalhes,
  ItemFolhaComDetalhes,
  AprovarFolhaDTO,
  PagarFolhaDTO
} from './domain';
import {
  validarPeriodoFolha,
  ultimoDiaDoMes
} from './utils';
import { MESES_LABELS } from './domain';
import { todayDateString } from '@/lib/date-utils';

// Re-export Salary functions from repository as they contain the business logic
export {
  listarSalarios,
  buscarSalarioPorId,
  buscarSalariosDoUsuario,
  buscarSalarioVigente,
  criarSalario,
  atualizarSalario,
  encerrarVigenciaSalario,
  inativarSalario,
  deletarSalario,
  calcularTotaisSalariosAtivos,
  listarUsuariosSemSalarioVigente,
  buscarFolhaPorId,
  buscarFolhaPorPeriodo,
  listarFolhasPagamento,
  deletarFolhaPagamento,
  calcularTotaisPorStatus
} from './repository';

// ============================================================================
// Folha de Pagamento Services
// ============================================================================

/**
 * Gera uma nova folha de pagamento para o período especificado
 */
export const gerarFolhaPagamento = async (
  dados: GerarFolhaDTO,
  usuarioId: number
): Promise<FolhaPagamentoComDetalhes> => {
  // 1. Validar período
  const validacao = validarPeriodoFolha(dados.mesReferencia, dados.anoReferencia);
  if (!validacao.valido) {
    throw new Error(validacao.erro || 'Período inválido');
  }

  // 2. Verificar se já existe folha para o período
  const existe = await verificarFolhaExistente(dados.mesReferencia, dados.anoReferencia);
  if (existe) {
    const mesNome = MESES_LABELS[dados.mesReferencia] || dados.mesReferencia;
    throw new Error(`Já existe uma folha de pagamento para ${mesNome}/${dados.anoReferencia}`);
  }

  // 3. Buscar salários vigentes no período
  const salariosVigentes = await buscarSalariosVigentesNoMes(
    dados.mesReferencia,
    dados.anoReferencia
  );

  // 4. Validar que existem salários
  if (salariosVigentes.length === 0) {
    throw new Error(
      'Não há funcionários com salário vigente para este período. ' +
      'Cadastre salários antes de gerar a folha de pagamento.'
    );
  }

  // 5. Validar data de pagamento se fornecida
  if (dados.dataPagamento) {
    const primeiroDia = new Date(dados.anoReferencia, dados.mesReferencia - 1, 1);
    const dataPagamento = new Date(dados.dataPagamento);

    if (dataPagamento < primeiroDia) {
      throw new Error('Data de pagamento não pode ser anterior ao mês de referência');
    }
  }

  // 6. Criar a folha de pagamento (status = rascunho)
  let folha;
  try {
    folha = await criarFolhaPagamento(
      {
        mesReferencia: dados.mesReferencia,
        anoReferencia: dados.anoReferencia,
        dataPagamento: dados.dataPagamento,
        observacoes: dados.observacoes,
      },
      usuarioId
    );
  } catch (error) {
    throw new Error(`Erro ao criar folha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  // 7. Criar itens para cada salário vigente
  const erros: Array<{ usuarioId: number; nome: string; erro: string }> = [];

  for (const salario of salariosVigentes) {
    try {
      await criarItemFolha(
        folha.id,
        salario.usuarioId,
        salario.id,
        salario.salarioBruto,
        undefined
      );
    } catch (error) {
      erros.push({
        usuarioId: salario.usuarioId,
        nome: salario.usuario?.nomeExibicao || `Usuário ${salario.usuarioId}`,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  // 8. Se houve erros em todos os itens, cancelar a folha
  if (erros.length === salariosVigentes.length) {
    try {
      await deletarFolhaPagamento(folha.id);
    } catch {
      // Ignorar erro de rollback
    }
    throw new Error(
      `Não foi possível adicionar nenhum funcionário à folha. Erros: ${erros.map(e => `${e.nome}: ${e.erro}`).join('; ')}`
    );
  }

  // 9. Atualizar valor total da folha
  await atualizarValorTotalFolha(folha.id);

  // 10. Buscar folha completa com itens
  const folhaCompleta = await buscarFolhaPorId(folha.id);

  if (!folhaCompleta) {
    throw new Error('Folha criada mas não encontrada');
  }

  if (erros.length > 0) {
    console.warn(
      `Folha ${folha.id} gerada com ${erros.length} erros parciais:`,
      erros
    );
  }

  return folhaCompleta;
};

/**
 * Pré-visualização de geração de folha
 */
export const previewGerarFolha = async (
  mesReferencia: number,
  anoReferencia: number
): Promise<{
  salariosVigentes: Array<{
    usuarioId: number;
    nomeExibicao: string;
    cargo?: string;
    salarioBruto: number;
  }>;
  valorTotal: number;
  totalFuncionarios: number;
  periodoLabel: string;
}> => {
  const validacao = validarPeriodoFolha(mesReferencia, anoReferencia);
  if (!validacao.valido) {
    throw new Error(validacao.erro || 'Período inválido');
  }

  const existe = await verificarFolhaExistente(mesReferencia, anoReferencia);
  if (existe) {
    throw new Error(`Já existe uma folha de pagamento para ${MESES_LABELS[mesReferencia]}/${anoReferencia}`);
  }

  const salariosVigentes = await buscarSalariosVigentesNoMes(mesReferencia, anoReferencia);
  const valorTotal = salariosVigentes.reduce((acc, s) => acc + s.salarioBruto, 0);

  return {
    salariosVigentes: salariosVigentes.map(s => ({
      usuarioId: s.usuarioId,
      nomeExibicao: s.usuario?.nomeExibicao || `Usuário ${s.usuarioId}`,
      cargo: s.usuario?.cargo || s.cargo?.nome,
      salarioBruto: s.salarioBruto,
    })),
    valorTotal,
    totalFuncionarios: salariosVigentes.length,
    periodoLabel: `${MESES_LABELS[mesReferencia]}/${anoReferencia}`,
  };
};

/**
 * Aprova uma folha de pagamento e cria lançamentos financeiros
 */
export const aprovarFolhaPagamento = async (
  folhaId: number,
  dados: AprovarFolhaDTO,
  usuarioId: number
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folha.status !== 'rascunho') {
    throw new Error(`Apenas folhas em rascunho podem ser aprovadas. Status atual: ${folha.status}`);
  }

  if (folha.itens.length === 0) {
    throw new Error('Não é possível aprovar uma folha sem itens');
  }

  const { data: contaContabil, error: erroContaContabil } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome, nivel, aceita_lancamento, ativo')
    .eq('id', dados.contaContabilId)
    .single();

  if (erroContaContabil || !contaContabil) {
    throw new Error('Conta contábil não encontrada');
  }

  if (!contaContabil.ativo) {
    throw new Error('Conta contábil está inativa');
  }

  if (!contaContabil.aceita_lancamento) {
    throw new Error(
      `Conta contábil "${contaContabil.codigo} - ${contaContabil.nome}" é sintética e não aceita lançamentos. Selecione uma conta analítica.`
    );
  }

  const { data: contaBancaria, error: erroContaBancaria } = await supabase
    .from('contas_bancarias')
    .select('id, nome, ativo')
    .eq('id', dados.contaBancariaId)
    .single();

  if (erroContaBancaria || !contaBancaria) {
    throw new Error('Conta bancária não encontrada');
  }

  if (!contaBancaria.ativo) {
    throw new Error('Conta bancária está inativa');
  }

  if (dados.centroCustoId) {
    const { data: centroCusto, error: erroCentroCusto } = await supabase
      .from('centros_custo')
      .select('id, nome, ativo')
      .eq('id', dados.centroCustoId)
      .single();

    if (erroCentroCusto || !centroCusto) {
      throw new Error('Centro de custo não encontrado');
    }

    if (!centroCusto.ativo) {
      throw new Error('Centro de custo está inativo');
    }
  }

  const mesNome = MESES_LABELS[folha.mesReferencia] || String(folha.mesReferencia);
  const dataVencimento = folha.dataPagamento || ultimoDiaDoMes(folha.mesReferencia, folha.anoReferencia);
  const dataCompetencia = `${folha.anoReferencia}-${String(folha.mesReferencia).padStart(2, '0')}-01`;
  const hoje = todayDateString();

  const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

  for (const item of folha.itens) {
    try {
      const descricao = `Salário ${item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`} - ${mesNome}/${folha.anoReferencia}`;

      const { data: lancamento, error: erroLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'despesa',
          descricao,
          valor: item.valorBruto,
          data_lancamento: hoje,
          data_competencia: dataCompetencia,
          data_vencimento: dataVencimento,
          status: 'pendente',
          origem: 'folha_pagamento',
          forma_pagamento: null,
          conta_bancaria_id: dados.contaBancariaId,
          conta_contabil_id: dados.contaContabilId,
          centro_custo_id: dados.centroCustoId || null,
          categoria: 'salarios',
          documento: null,
          observacoes: `Folha de Pagamento ${mesNome}/${folha.anoReferencia}`,
          anexos: [],
          dados_adicionais: {
            folhaId: folha.id,
            itemFolhaId: item.id,
            mesReferencia: folha.mesReferencia,
            anoReferencia: folha.anoReferencia,
          },
          recorrente: false,
          created_by: usuarioId,
        })
        .select()
        .single();

      if (erroLancamento) {
        throw new Error(erroLancamento.message);
      }

      await vincularLancamentoAoItem(item.id, lancamento.id);

    } catch (error) {
      erros.push({
        itemId: item.id,
        usuario: item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  if (erros.length === folha.itens.length) {
    throw new Error(
      `Não foi possível criar lançamentos financeiros. Erros: ${erros.map(e => `${e.usuario}: ${e.erro}`).join('; ')}`
    );
  }

  const observacoesAprovacao = dados.observacoes
    ? `[Aprovação em ${new Date().toLocaleDateString('pt-BR')}] ${dados.observacoes}`
    : `[Aprovação em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'aprovada', {
    observacoes: observacoesAprovacao,
  });

  if (erros.length > 0) {
    console.warn(
      `Folha ${folhaId} aprovada com ${erros.length} erros parciais:`,
      erros
    );
  }

  const folhaAtualizada = await buscarFolhaPorId(folhaId);
  return folhaAtualizada!;
};

/**
 * Paga uma folha de pagamento (marca lançamentos como confirmados)
 */
export const pagarFolhaPagamento = async (
  folhaId: number,
  dados: PagarFolhaDTO
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folha.status !== 'aprovada') {
    throw new Error(`Apenas folhas aprovadas podem ser pagas. Status atual: ${folha.status}`);
  }

  const itensSemLancamento = folha.itens.filter((item: ItemFolhaComDetalhes) => !item.lancamentoFinanceiroId);
  if (itensSemLancamento.length > 0) {
    throw new Error(
      `Existem ${itensSemLancamento.length} itens sem lançamento financeiro vinculado. ` +
      'Isso indica um problema na aprovação. Por favor, cancele e reaprove a folha.'
    );
  }

  const { data: contaBancaria, error: erroContaBancaria } = await supabase
    .from('contas_bancarias')
    .select('id, nome, ativo')
    .eq('id', dados.contaBancariaId)
    .single();

  if (erroContaBancaria || !contaBancaria) {
    throw new Error('Conta bancária não encontrada');
  }

  if (!contaBancaria.ativo) {
    throw new Error('Conta bancária está inativa');
  }

  const dataEfetivacao = dados.dataEfetivacao || new Date().toISOString();
  const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

  for (const item of folha.itens) {
    try {
      let observacoesLancamento = item.lancamento?.descricao || '';
      if (dados.observacoes) {
        observacoesLancamento = observacoesLancamento
          ? `${observacoesLancamento}\n\n[Pagamento] ${dados.observacoes}`
          : `[Pagamento] ${dados.observacoes}`;
      }

      const { error: erroUpdate } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status: 'confirmado',
          forma_pagamento: dados.formaPagamento,
          conta_bancaria_id: dados.contaBancariaId,
          data_efetivacao: dataEfetivacao,
        })
        .eq('id', item.lancamentoFinanceiroId);

      if (erroUpdate) {
        throw new Error(erroUpdate.message);
      }

    } catch (error) {
      erros.push({
        itemId: item.id,
        usuario: item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  if (erros.length === folha.itens.length) {
    throw new Error(
      `Não foi possível confirmar os lançamentos financeiros. Erros: ${erros.map(e => `${e.usuario}: ${e.erro}`).join('; ')}`
    );
  }

  const observacoesPagamento = dados.observacoes
    ? `[Pagamento em ${new Date().toLocaleDateString('pt-BR')}] ${dados.observacoes}`
    : `[Pagamento em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'paga', {
    dataPagamento: dataEfetivacao.split('T')[0],
    observacoes: observacoesPagamento,
  });

  if (erros.length > 0) {
    console.warn(
      `Folha ${folhaId} paga com ${erros.length} erros parciais:`,
      erros
    );
  }

  const folhaAtualizada = await buscarFolhaPorId(folhaId);
  return folhaAtualizada!;
};

export const calcularTotalAPagar = async (folhaId: number): Promise<{
  totalBruto: number;
  totalItens: number;
  itensPendentes: number;
  itensConfirmados: number;
}> => {
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  let totalBruto = 0;
  let itensPendentes = 0;
  let itensConfirmados = 0;

  for (const item of folha.itens) {
    totalBruto += item.valorBruto;

    if (item.lancamento?.status === 'confirmado') {
      itensConfirmados++;
    } else {
      itensPendentes++;
    }
  }

  return {
    totalBruto,
    totalItens: folha.itens.length,
    itensPendentes,
    itensConfirmados,
  };
};

/**
 * Cancela uma folha de pagamento
 */
export const cancelarFolhaPagamento = async (
  folhaId: number,
  motivo?: string
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folha.status === 'paga') {
    throw new Error(
      'Não é possível cancelar uma folha já paga. ' +
      'Para desfazer pagamentos, utilize o estorno individual dos lançamentos financeiros.'
    );
  }

  if (folha.status === 'cancelada') {
    throw new Error('Esta folha já está cancelada');
  }

  if (folha.status === 'aprovada') {
    const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

    for (const item of folha.itens) {
      if (!item.lancamentoFinanceiroId) continue;

      try {
        const { data: lancamento, error: erroConsulta } = await supabase
          .from('lancamentos_financeiros')
          .select('status, observacoes')
          .eq('id', item.lancamentoFinanceiroId)
          .single();

        if (erroConsulta || !lancamento) {
          throw new Error('Lançamento não encontrado');
        }

        if (lancamento.status === 'confirmado') {
          throw new Error('Lançamento já foi pago e não pode ser cancelado por aqui');
        }

        let observacoes = lancamento.observacoes || '';
        const textoMotivo = motivo
          ? `[Cancelamento - Folha ${folhaId}] ${motivo}`
          : `[Cancelamento - Folha ${folhaId}]`;

        observacoes = observacoes ? `${observacoes}\n\n${textoMotivo}` : textoMotivo;

        const { error: erroUpdate } = await supabase
          .from('lancamentos_financeiros')
          .update({
            status: 'cancelado',
            observacoes,
          })
          .eq('id', item.lancamentoFinanceiroId);

        if (erroUpdate) {
          throw new Error(erroUpdate.message);
        }

      } catch (error) {
        erros.push({
          itemId: item.id,
          usuario: item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    if (erros.length > 0) {
      console.warn(
        `Cancelamento da folha ${folhaId} com ${erros.length} erros ao cancelar lançamentos:`,
        erros
      );
    }
  }

  const observacoesCancelamento = motivo
    ? `[Cancelamento em ${new Date().toLocaleDateString('pt-BR')}] ${motivo}`
    : `[Cancelamento em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'cancelada', {
    observacoes: observacoesCancelamento,
  });

  const folhaAtualizada = await buscarFolhaPorId(folhaId);
  return folhaAtualizada!;
};

export const podeCancelarFolha = async (
  folhaId: number
): Promise<{
  podeCancelar: boolean;
  motivo?: string;
  status: string;
  temLancamentosPagos: boolean;
}> => {
  const supabase = createServiceClient();
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    return {
      podeCancelar: false,
      motivo: 'Folha não encontrada',
      status: 'desconhecido',
      temLancamentosPagos: false,
    };
  }

  let temLancamentosPagos = false;
  if (folha.status === 'aprovada') {
    for (const item of folha.itens) {
      if (item.lancamentoFinanceiroId) {
        const { data: lancamento } = await supabase
          .from('lancamentos_financeiros')
          .select('status')
          .eq('id', item.lancamentoFinanceiroId)
          .single();

        if (lancamento?.status === 'confirmado') {
          temLancamentosPagos = true;
          break;
        }
      }
    }
  }

  if (folha.status === 'paga') {
    return {
      podeCancelar: false,
      motivo: 'Folhas pagas não podem ser canceladas. Utilize estorno individual dos lançamentos.',
      status: folha.status,
      temLancamentosPagos: true,
    };
  }

  if (folha.status === 'cancelada') {
    return {
      podeCancelar: false,
      motivo: 'Esta folha já está cancelada',
      status: folha.status,
      temLancamentosPagos: false,
    };
  }

  if (temLancamentosPagos) {
    return {
      podeCancelar: false,
      motivo: 'Existem lançamentos já pagos vinculados a esta folha. Estorne os lançamentos primeiro.',
      status: folha.status,
      temLancamentosPagos: true,
    };
  }


  return {
    podeCancelar: true,
    status: folha.status,
    temLancamentosPagos: false,
  };
};

/**
 * Atualizar dados básicos da folha (apenas rascunho)
 */
export const atualizarFolhaPagamento = async (
  folhaId: number,
  dados: { dataPagamento?: string; observacoes?: string }
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folha.status !== 'rascunho') {
    throw new Error(`Apenas folhas em rascunho podem ser editadas. Status atual: ${folha.status}`);
  }

  const updateData: Record<string, unknown> = {};
  if (dados.dataPagamento !== undefined) updateData.data_pagamento = dados.dataPagamento;
  if (dados.observacoes !== undefined) updateData.observacoes = dados.observacoes;

  if (Object.keys(updateData).length === 0) {
    return folha;
  }

  const { error } = await supabase
    .from('folhas_pagamento')
    .update(updateData)
    .eq('id', folhaId);

  if (error) {
    throw new Error(`Erro ao atualizar folha: ${error.message}`);
  }

  const atualizada = await buscarFolhaPorId(folhaId);
  return atualizada!;
};
