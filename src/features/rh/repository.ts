
import { createServiceClient } from '@/lib/supabase/service-client';
import { todayDateString, toDateString } from '@/lib/date-utils';
import {
  Salario,
  SalarioComDetalhes,
  ListarSalariosParams,
  ListarSalariosResponse,
  UsuarioResumo,
  CargoResumo,
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento,
  ItemFolhaComDetalhes,
  ListarFolhasParams,
  ListarFolhasResponse,
  StatusFolhaPagamento,
  TotaisFolhasPorStatus,
  LancamentoFinanceiroResumo,
  CriarSalarioDTO as CriarSalarioData,
  AtualizarSalarioDTO as AtualizarSalarioData
} from './domain';
import { isTransicaoStatusValida } from './domain';

// ============================================================================
// Column Selection Helpers (Disk I/O Optimization)
// ============================================================================

const SALARIO_COLUMNS_BASIC = `
  id,
  usuario_id,
  cargo_id,
  salario_bruto,
  data_inicio_vigencia,
  data_fim_vigencia,
  ativo,
  created_at,
  updated_at
`.trim().replace(/\s+/g, ' ');

const _SALARIO_COLUMNS_WITH_DETAILS = `
  ${SALARIO_COLUMNS_BASIC},
  observacoes,
  created_by,
  usuarios!usuario_id(id, nome_completo, nome_exibicao, cpf, cargo_id),
  cargos!usuarios.cargo_id(id, nome, descricao)
`.trim().replace(/\s+/g, ' ');

const _FOLHA_COLUMNS_BASIC = `
  id,
  mes_referencia,
  ano_referencia,
  status,
  valor_total,
  observacoes,
  created_at,
  updated_at
`.trim().replace(/\s+/g, ' ');

const _ITEM_FOLHA_COLUMNS_BASIC = `
  id,
  folha_pagamento_id,
  usuario_id,
  salario_id,
  valor_bruto,
  observacoes,
  created_at
`.trim().replace(/\s+/g, ' ');

// ============================================================================
// Mappers
// ============================================================================

const mapearSalario = (registro: Record<string, unknown>): Salario => {
  return {
    id: registro.id as number,
    usuarioId: registro.usuario_id as number,
    cargoId: (registro.cargo_id as number | null) ?? null,
    salarioBruto: Number(registro.salario_bruto),
    dataInicioVigencia: registro.data_inicio_vigencia as string,
    dataFimVigencia: (registro.data_fim_vigencia as string | null) ?? null,
    observacoes: (registro.observacoes as string | null) ?? null,
    ativo: registro.ativo as boolean,
    createdBy: (registro.created_by as number | null) ?? null,
    createdAt: registro.created_at as string,
    updatedAt: registro.updated_at as string,
  };
};

const mapearSalarioComDetalhes = (registro: Record<string, unknown>): SalarioComDetalhes => {
  const salario = mapearSalario(registro);

  const usuarios = registro.usuarios as Record<string, unknown> | undefined;
  const usuario: UsuarioResumo | undefined = usuarios
    ? {
      id: usuarios.id as number,
      nomeExibicao: usuarios.nome_exibicao as string,
      email: (usuarios.email_corporativo as string) || (usuarios.email_pessoal as string), // Fallback
      cargo: ((usuarios.cargos as Record<string, unknown> | undefined)?.nome as string) || undefined, // Cargo do usuário via join
    }
    : undefined;

  const cargos = registro.cargos as Record<string, unknown> | undefined;
  const cargo: CargoResumo | undefined = cargos
    ? {
      id: cargos.id as number,
      nome: cargos.nome as string,
      descricao: (cargos.descricao as string | null) ?? null,
    }
    : undefined;

  return {
    ...salario,
    usuario,
    cargo,
  };
};

const mapearFolhaPagamento = (registro: Record<string, unknown>): FolhaPagamento => {
  return {
    id: registro.id as number,
    mesReferencia: registro.mes_referencia as number,
    anoReferencia: registro.ano_referencia as number,
    dataGeracao: registro.data_geracao as string,
    dataPagamento: (registro.data_pagamento as string | null) ?? null,
    valorTotal: Number(registro.valor_total),
    status: registro.status as StatusFolhaPagamento,
    observacoes: (registro.observacoes as string | null) ?? null,
    createdBy: (registro.created_by as number | null) ?? null,
    createdAt: registro.created_at as string,
    updatedAt: registro.updated_at as string,
  };
};

const mapearItemFolha = (registro: Record<string, unknown>): ItemFolhaPagamento => {
  return {
    id: registro.id as number,
    folhaPagamentoId: registro.folha_pagamento_id as number,
    usuarioId: registro.usuario_id as number,
    salarioId: registro.salario_id as number,
    valorBruto: Number(registro.valor_bruto),
    lancamentoFinanceiroId: (registro.lancamento_financeiro_id as number | null) ?? null,
    observacoes: (registro.observacoes as string | null) ?? null,
    createdAt: registro.created_at as string,
    updatedAt: registro.updated_at as string,
  };
};

const mapearItemFolhaComDetalhes = (registro: Record<string, unknown>): ItemFolhaComDetalhes => {
  const item = mapearItemFolha(registro);

  const usuarios = registro.usuarios as Record<string, unknown> | undefined;
  const usuario: UsuarioResumo | undefined = usuarios
    ? {
      id: usuarios.id as number,
      nomeExibicao: usuarios.nome_exibicao as string,
      email: (usuarios.email_corporativo as string) || (usuarios.email_pessoal as string),
      cargo: ((usuarios.cargos as Record<string, unknown> | undefined)?.nome as string) || undefined,
    }
    : undefined;

  const salarios = registro.salarios as Record<string, unknown> | undefined;
  const salario: Salario | undefined = salarios
    ? mapearSalario(salarios)
    : undefined;

  const lancamentosFinanceiros = registro.lancamentos_financeiros as Record<string, unknown> | undefined;
  const lancamento: LancamentoFinanceiroResumo | undefined = lancamentosFinanceiros
    ? {
      id: lancamentosFinanceiros.id as number,
      descricao: lancamentosFinanceiros.descricao as string,
      valor: Number(lancamentosFinanceiros.valor),
      status: lancamentosFinanceiros.status as string,
      dataVencimento: (lancamentosFinanceiros.data_vencimento as string | null) ?? null,
      dataEfetivacao: (lancamentosFinanceiros.data_efetivacao as string | null) ?? null,
    }
    : undefined;

  return {
    ...item,
    usuario,
    salario,
    lancamento,
  };
};

const mapearFolhaComDetalhes = (registro: Record<string, unknown>): FolhaPagamentoComDetalhes => {
  const folha = mapearFolhaPagamento(registro);
  const itensFolhaPagamento = (registro.itens_folha_pagamento as Record<string, unknown>[] | undefined) ?? [];
  const itens = itensFolhaPagamento.map(mapearItemFolhaComDetalhes);

  return {
    ...folha,
    itens,
    totalFuncionarios: itens.length,
  };
};

// ============================================================================
// Salários Repository
// ============================================================================

export const listarSalarios = async (params: ListarSalariosParams): Promise<ListarSalariosResponse> => {
  const {
    pagina = 1,
    limite = 50,
    busca,
    usuarioId,
    cargoId,
    ativo,
    vigente,
    ordenarPor = 'data_inicio_vigencia',
    ordem = 'desc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('salarios')
    .select(
      `
      id,
      usuario_id,
      cargo_id,
      salario_bruto,
      data_inicio_vigencia,
      data_fim_vigencia,
      observacoes,
      ativo,
      created_by,
      created_at,
      updated_at,
      usuarios!salarios_usuario_id_fkey(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
      cargos(id, nome, descricao)
    `,
      { count: 'exact' }
    );

  if (busca) {
    query = query.or(`observacoes.ilike.%${busca}%,usuarios.nome_exibicao.ilike.%${busca}%`);
  }

  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }

  if (cargoId) {
    query = query.eq('cargo_id', cargoId);
  }

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  if (vigente) {
    const hoje = todayDateString();
    query = query
      .lte('data_inicio_vigencia', hoje)
      .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);
  }

  let campoOrdenacao: 'created_at' | 'usuario' | 'data_inicio_vigencia' | 'salario_bruto' = ordenarPor;
  if (ordenarPor === 'usuario') {
    campoOrdenacao = 'created_at'; // Fallback para campo válido
  }
  query = query.order(campoOrdenacao, { ascending: ordem === 'asc', nullsFirst: false });

  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar salários: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    items: (data || []).map(mapearSalarioComDetalhes),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
  };
};

export const buscarSalarioPorId = async (id: number): Promise<SalarioComDetalhes | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      id,
      usuario_id,
      cargo_id,
      salario_bruto,
      data_inicio_vigencia,
      data_fim_vigencia,
      observacoes,
      ativo,
      created_by,
      created_at,
      updated_at,
      usuarios!salarios_usuario_id_fkey(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
      cargos(id, nome, descricao)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar salário: ${error.message}`);
  }

  return mapearSalarioComDetalhes(data);
};

export const buscarSalariosDoUsuario = async (usuarioId: number): Promise<SalarioComDetalhes[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      id,
      usuario_id,
      cargo_id,
      salario_bruto,
      data_inicio_vigencia,
      data_fim_vigencia,
      observacoes,
      ativo,
      created_by,
      created_at,
      updated_at,
      usuarios!salarios_usuario_id_fkey(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
      cargos(id, nome, descricao)
    `
    )
    .eq('usuario_id', usuarioId)
    .order('data_inicio_vigencia', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar salários do usuário: ${error.message}`);
  }

  return (data || []).map(mapearSalarioComDetalhes);
};

export const buscarSalarioVigente = async (
  usuarioId: number,
  dataReferencia?: string
): Promise<SalarioComDetalhes | null> => {
  const dataRef = dataReferencia || todayDateString();
  const supabase = createServiceClient();

  const { data: salarios, error } = await supabase
    .from('salarios')
    .select(
      `
      id,
      usuario_id,
      cargo_id,
      salario_bruto,
      data_inicio_vigencia,
      data_fim_vigencia,
      observacoes,
      ativo,
      created_by,
      created_at,
      updated_at,
      usuarios!salarios_usuario_id_fkey(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
      cargos(id, nome, descricao)
    `
    )
    .eq('usuario_id', usuarioId)
    .eq('ativo', true)
    .lte('data_inicio_vigencia', dataRef)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${dataRef}`)
    .order('data_inicio_vigencia', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Erro ao buscar salário vigente: ${error.message}`);
  }

  if (!salarios || salarios.length === 0) {
    return null;
  }

  return mapearSalarioComDetalhes(salarios[0]);
};

export const buscarSalariosVigentesNoMes = async (mes: number, ano: number): Promise<SalarioComDetalhes[]> => {
  const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = toDateString(new Date(ano, mes, 0));

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      id,
      usuario_id,
      cargo_id,
      salario_bruto,
      data_inicio_vigencia,
      data_fim_vigencia,
      observacoes,
      ativo,
      created_by,
      created_at,
      updated_at,
      usuarios!salarios_usuario_id_fkey(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
      cargos(id, nome, descricao)
    `
    )
    .eq('ativo', true)
    .lte('data_inicio_vigencia', ultimoDia)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${primeiroDia}`)
    .order('usuario_id', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar salários vigentes no mês: ${error.message}`);
  }

  // Agrupar por usuário e pegar o salário mais recente de cada um
  const salariosPorUsuario = new Map<number, SalarioComDetalhes>();
  for (const registro of data || []) {
    const salario = mapearSalarioComDetalhes(registro);
    const existente = salariosPorUsuario.get(salario.usuarioId);
    if (!existente || salario.dataInicioVigencia > existente.dataInicioVigencia) {
      salariosPorUsuario.set(salario.usuarioId, salario);
    }
  }

  return Array.from(salariosPorUsuario.values());
};

export const verificarSobreposicaoVigencia = async (
  usuarioId: number,
  dataInicioVigencia: string,
  dataFimVigencia: string | null,
  excluirSalarioId?: number
): Promise<boolean> => {
  const supabase = createServiceClient();

  let query = supabase
    .from('salarios')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('ativo', true);

  if (excluirSalarioId) {
    query = query.neq('id', excluirSalarioId);
  }

  if (dataFimVigencia) {
    query = query
      .lte('data_inicio_vigencia', dataFimVigencia)
      .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${dataInicioVigencia}`);
  } else {
    query = query.or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${dataInicioVigencia}`);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao verificar sobreposição de vigência: ${error.message}`);
  }

  return (count || 0) > 0;
};

export const criarSalario = async (dados: CriarSalarioData, createdBy: number): Promise<Salario> => {
  const supabase = createServiceClient();

  const { data: usuario, error: erroUsuario } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao, ativo')
    .eq('id', dados.usuarioId)
    // .single() // omit single check for robustness, relying on ID
    .maybeSingle();

  if (erroUsuario || !usuario) {
    throw new Error('Usuário não encontrado');
  }

  if (!usuario.ativo) {
    throw new Error('Usuário está inativo');
  }

  const temSobreposicao = await verificarSobreposicaoVigencia(
    dados.usuarioId,
    dados.dataInicioVigencia,
    null
  );

  if (temSobreposicao) {
    throw new Error('Já existe um salário vigente para este usuário no período informado. Encerre a vigência do salário atual antes de criar um novo.');
  }

  if (dados.cargoId) {
    const { data: cargo, error: erroCargo } = await supabase
      .from('cargos')
      .select('id, nome')
      .eq('id', dados.cargoId)
      .maybeSingle();

    if (erroCargo || !cargo) {
      throw new Error('Cargo não encontrado');
    }
  }

  const { data, error } = await supabase
    .from('salarios')
    .insert({
      usuario_id: dados.usuarioId,
      cargo_id: dados.cargoId || null,
      salario_bruto: dados.salarioBruto,
      data_inicio_vigencia: dados.dataInicioVigencia,
      data_fim_vigencia: null,
      observacoes: dados.observacoes?.trim() || null,
      ativo: true,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um salário cadastrado para este usuário com esta data de início');
    }
    throw new Error(`Erro ao criar salário: ${error.message}`);
  }

  return mapearSalario(data);
};

export const atualizarSalario = async (id: number, dados: AtualizarSalarioData): Promise<Salario> => {
  const supabase = createServiceClient();

  const { data: salarioAtual, error: erroConsulta } = await supabase
    .from('salarios')
    .select(SALARIO_COLUMNS_BASIC)
    .eq('id', id)
    .single();

  if (erroConsulta || !salarioAtual) {
    throw new Error('Salário não encontrado');
  }

  const { count: contaFolhas, error: erroFolhas } = await supabase
    .from('itens_folha_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('salario_id', id);

  if (erroFolhas) {
    throw new Error(`Erro ao verificar uso do salário: ${erroFolhas.message}`);
  }

  if ((contaFolhas || 0) > 0 && dados.salarioBruto !== undefined && dados.salarioBruto !== (salarioAtual as unknown as { salario_bruto: number }).salario_bruto) {
    throw new Error('Não é possível alterar o valor de um salário que já foi usado em folha de pagamento. Encerre a vigência e crie um novo salário.');
  }

  if (dados.dataFimVigencia !== undefined && dados.dataFimVigencia !== null) {
    if (dados.dataFimVigencia <= (salarioAtual as unknown as { data_inicio_vigencia: string }).data_inicio_vigencia) {
      throw new Error('Data de fim da vigência deve ser posterior à data de início');
    }
  }

  const updateData: Record<string, unknown> = {};

  if (dados.salarioBruto !== undefined) updateData.salario_bruto = dados.salarioBruto;
  if (dados.cargoId !== undefined) updateData.cargo_id = dados.cargoId;
  if (dados.dataFimVigencia !== undefined) updateData.data_fim_vigencia = dados.dataFimVigencia;
  if (dados.observacoes !== undefined) updateData.observacoes = dados.observacoes?.trim() || null;
  if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

  const { data, error } = await supabase
    .from('salarios')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar salário: ${error.message}`);
  }

  return mapearSalario(data);
};

export const encerrarVigenciaSalario = async (id: number, dataFim: string): Promise<Salario> => {
  return atualizarSalario(id, { dataFimVigencia: dataFim });
};

export const inativarSalario = async (id: number): Promise<Salario> => {
  return atualizarSalario(id, { ativo: false });
};

export const deletarSalario = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  const { count, error: erroCount } = await supabase
    .from('itens_folha_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('salario_id', id);

  if (erroCount) {
    throw new Error(`Erro ao verificar uso do salário: ${erroCount.message}`);
  }

  if ((count || 0) > 0) {
    throw new Error('Não é possível excluir um salário que já foi usado em folha de pagamento');
  }

  const { error } = await supabase
    .from('salarios')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir salário: ${error.message}`);
  }
};

export const calcularTotaisSalariosAtivos = async (): Promise<{
  totalFuncionarios: number;
  totalBrutoMensal: number;
}> => {
  const hoje = todayDateString();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select('usuario_id, salario_bruto')
    .eq('ativo', true)
    .lte('data_inicio_vigencia', hoje)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);

  if (error) {
    throw new Error(`Erro ao calcular totais: ${error.message}`);
  }

  const salariosPorUsuario = new Map<number, number>();
  for (const item of data || []) {
    salariosPorUsuario.set(item.usuario_id, Number(item.salario_bruto));
  }

  return {
    totalFuncionarios: salariosPorUsuario.size,
    totalBrutoMensal: Array.from(salariosPorUsuario.values()).reduce((a, b) => a + b, 0),
  };
};

export const listarUsuariosSemSalarioVigente = async (): Promise<UsuarioResumo[]> => {
  const hoje = todayDateString();
  const supabase = createServiceClient();

  const { data: usuarios, error: erroUsuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao, email, cargo')
    .eq('ativo', true);

  if (erroUsuarios) {
    throw new Error(`Erro ao buscar usuários: ${erroUsuarios.message}`);
  }

  const { data: salarios, error: erroSalarios } = await supabase
    .from('salarios')
    .select('usuario_id')
    .eq('ativo', true)
    .lte('data_inicio_vigencia', hoje)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);

  if (erroSalarios) {
    throw new Error(`Erro ao buscar salários: ${erroSalarios.message}`);
  }

  const idsComSalario = new Set((salarios || []).map((s) => s.usuario_id));

  return (usuarios || [])
    .filter((u) => !idsComSalario.has(u.id))
    .map((u) => ({
      id: u.id,
      nomeExibicao: u.nome_exibicao,
      email: u.email,
      cargo: u.cargo,
    }));
};

export const invalidateSalariosCache = async (): Promise<void> => {
  // Ignorado em favor do Next.js cache revalidation
  return Promise.resolve();
};

// ============================================================================
// Folhas de Pagamento Repository
// ============================================================================

export const listarFolhasPagamento = async (params: ListarFolhasParams): Promise<ListarFolhasResponse> => {
  const {
    pagina = 1,
    limite = 50,
    mesReferencia,
    anoReferencia,
    status,
    ordenarPor = 'periodo',
    ordem = 'desc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('folhas_pagamento')
    .select(
      `
      id,
      mes_referencia,
      ano_referencia,
      data_geracao,
      data_pagamento,
      status,
      valor_total,
      observacoes,
      created_by,
      created_at,
      updated_at,
      itens_folha_pagamento(
        id,
        folha_pagamento_id,
        usuario_id,
        salario_id,
        valor_bruto,
        lancamento_financeiro_id,
        observacoes,
        created_at,
        updated_at,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `,
      { count: 'exact' }
    );

  if (mesReferencia) query = query.eq('mes_referencia', mesReferencia);
  if (anoReferencia) query = query.eq('ano_referencia', anoReferencia);

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  if (ordenarPor === 'periodo') {
    query = query
      .order('ano_referencia', { ascending: ordem === 'asc' })
      .order('mes_referencia', { ascending: ordem === 'asc' });
  } else {
    query = query.order(ordenarPor, { ascending: ordem === 'asc' });
  }

  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar folhas de pagamento: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    items: (data || []).map(mapearFolhaComDetalhes),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
  };
};

export const buscarFolhaPorId = async (id: number): Promise<FolhaPagamentoComDetalhes | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select(
      `
      id,
      mes_referencia,
      ano_referencia,
      data_geracao,
      data_pagamento,
      status,
      valor_total,
      observacoes,
      created_by,
      created_at,
      updated_at,
      itens_folha_pagamento(
        id,
        folha_pagamento_id,
        usuario_id,
        salario_id,
        valor_bruto,
        lancamento_financeiro_id,
        observacoes,
        created_at,
        updated_at,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar folha de pagamento: ${error.message}`);
  }

  return mapearFolhaComDetalhes(data);
};

export const buscarFolhaPorPeriodo = async (mes: number, ano: number): Promise<FolhaPagamentoComDetalhes | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select(
      `
      id,
      mes_referencia,
      ano_referencia,
      data_geracao,
      data_pagamento,
      status,
      valor_total,
      observacoes,
      created_by,
      created_at,
      updated_at,
      itens_folha_pagamento(
        id,
        folha_pagamento_id,
        usuario_id,
        salario_id,
        valor_bruto,
        lancamento_financeiro_id,
        observacoes,
        created_at,
        updated_at,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos!cargo_id(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `
    )
    .eq('mes_referencia', mes)
    .eq('ano_referencia', ano)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar folha por período: ${error.message}`);
  }

  if (!data) return null;

  return mapearFolhaComDetalhes(data);
};

export const verificarFolhaExistente = async (mes: number, ano: number): Promise<boolean> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('folhas_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('mes_referencia', mes)
    .eq('ano_referencia', ano);

  if (error) {
    throw new Error(`Erro ao verificar folha existente: ${error.message}`);
  }

  return (count || 0) > 0;
};

export const calcularTotaisPorStatus = async (): Promise<TotaisFolhasPorStatus> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select('status, valor_total');

  if (error) {
    throw new Error(`Erro ao calcular totais: ${error.message}`);
  }

  const totais: TotaisFolhasPorStatus = {
    rascunho: { quantidade: 0, valorTotal: 0 },
    aprovada: { quantidade: 0, valorTotal: 0 },
    paga: { quantidade: 0, valorTotal: 0 },
    cancelada: { quantidade: 0, valorTotal: 0 },
  };

  for (const item of data || []) {
    const status = item.status as StatusFolhaPagamento;
    if (totais[status]) {
      totais[status].quantidade++;
      totais[status].valorTotal += Number(item.valor_total);
    }
  }

  return totais;
};

export const criarFolhaPagamento = async (
  dados: {
    mesReferencia: number;
    anoReferencia: number;
    dataPagamento?: string;
    observacoes?: string;
  },
  createdBy: number
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  const existe = await verificarFolhaExistente(dados.mesReferencia, dados.anoReferencia);
  if (existe) {
    throw new Error(`Já existe uma folha de pagamento para ${dados.mesReferencia}/${dados.anoReferencia}`);
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .insert({
      mes_referencia: dados.mesReferencia,
      ano_referencia: dados.anoReferencia,
      data_geracao: new Date().toISOString(),
      data_pagamento: dados.dataPagamento || null,
      valor_total: 0,
      status: 'rascunho',
      observacoes: dados.observacoes?.trim() || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Já existe uma folha de pagamento para ${dados.mesReferencia}/${dados.anoReferencia}`);
    }
    throw new Error(`Erro ao criar folha de pagamento: ${error.message}`);
  }

  return mapearFolhaPagamento(data);
};

export const criarItemFolha = async (
  folhaId: number,
  usuarioId: number,
  salarioId: number,
  valorBruto: number,
  observacoes?: string
): Promise<ItemFolhaPagamento> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('itens_folha_pagamento')
    .insert({
      folha_pagamento_id: folhaId,
      usuario_id: usuarioId,
      salario_id: salarioId,
      valor_bruto: valorBruto,
      lancamento_financeiro_id: null,
      observacoes: observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este funcionário já está incluído nesta folha de pagamento');
    }
    throw new Error(`Erro ao criar item da folha: ${error.message}`);
  }

  return mapearItemFolha(data);
};

export const atualizarValorTotalFolha = async (folhaId: number): Promise<void> => {
  const supabase = createServiceClient();

  const { data: itens, error: erroItens } = await supabase
    .from('itens_folha_pagamento')
    .select('valor_bruto')
    .eq('folha_pagamento_id', folhaId);

  if (erroItens) {
    throw new Error(`Erro ao calcular total: ${erroItens.message}`);
  }

  const valorTotal = (itens || []).reduce((acc, item) => acc + Number(item.valor_bruto), 0);

  const { error } = await supabase
    .from('folhas_pagamento')
    .update({ valor_total: valorTotal })
    .eq('id', folhaId);

  if (error) {
    throw new Error(`Erro ao atualizar valor total: ${error.message}`);
  }
};

export const atualizarFolhaPagamento = async (
  id: number,
  dados: {
    dataPagamento?: string | null;
    observacoes?: string | null;
  }
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folhaAtual.status !== 'rascunho') {
    throw new Error('Apenas folhas em rascunho podem ser editadas');
  }

  const updateData: Record<string, unknown> = {};
  if (dados.dataPagamento !== undefined) updateData.data_pagamento = dados.dataPagamento;
  if (dados.observacoes !== undefined) updateData.observacoes = dados.observacoes?.trim() || null;

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar folha: ${error.message}`);
  }

  return mapearFolhaPagamento(data);
};

export const atualizarStatusFolha = async (
  id: number,
  novoStatus: StatusFolhaPagamento,
  dadosAdicionais?: {
    dataPagamento?: string;
    observacoes?: string;
  }
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status, observacoes')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (!isTransicaoStatusValida(folhaAtual.status as StatusFolhaPagamento, novoStatus)) {
    throw new Error(`Transição de status inválida: ${folhaAtual.status} -> ${novoStatus}`);
  }

  const updateData: Record<string, unknown> = { status: novoStatus };

  if (dadosAdicionais?.dataPagamento) {
    updateData.data_pagamento = dadosAdicionais.dataPagamento;
  }

  if (dadosAdicionais?.observacoes) {
    const obsAtuais = folhaAtual.observacoes || '';
    const novasObs = dadosAdicionais.observacoes;
    updateData.observacoes = obsAtuais ? `${obsAtuais}\n\n${novasObs}` : novasObs;
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }

  return mapearFolhaPagamento(data);
};

export const vincularLancamentoAoItem = async (itemId: number, lancamentoId: number): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('itens_folha_pagamento')
    .update({ lancamento_financeiro_id: lancamentoId })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Erro ao vincular lançamento: ${error.message}`);
  }
};

export const deletarFolhaPagamento = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folhaAtual.status !== 'rascunho') {
    throw new Error('Apenas folhas em rascunho podem ser excluídas. Para folhas aprovadas ou pagas, use a opção de cancelamento.');
  }

  // Deletar itens primeiro (cascade)
  await supabase
    .from('itens_folha_pagamento')
    .delete()
    .eq('folha_pagamento_id', id);

  const { error } = await supabase
    .from('folhas_pagamento')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir folha: ${error.message}`);
  }
};

export const invalidateFolhasCache = async (): Promise<void> => {
  // Ignorado em favor do Next.js cache revalidation
  return Promise.resolve();
};
