-- ============================================================================
-- Enums do Sistema Sinesys
-- Gerado automaticamente do banco de dados em produção
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums de Tribunal
-- ----------------------------------------------------------------------------

-- Código do Tribunal (TRT1 a TRT24 e TST)
create type public.codigo_tribunal as enum (
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
  'TST'
);
comment on type public.codigo_tribunal is 'Código do tribunal trabalhista. Inclui TRT1 a TRT24 (Tribunais Regionais) e TST (Tribunal Superior do Trabalho).';

-- Grau do processo no tribunal
create type public.grau_tribunal as enum (
  'primeiro_grau',
  'segundo_grau',
  'tribunal_superior'
);
comment on type public.grau_tribunal is 'Grau do processo no tribunal (primeiro grau, segundo grau ou tribunal superior)';

-- Tipo de acesso ao tribunal
create type public.tipo_acesso_tribunal as enum (
  'primeiro_grau',
  'segundo_grau',
  'unificado',
  'unico'
);
comment on type public.tipo_acesso_tribunal is 'Tipo de acesso ao sistema: primeiro_grau, segundo_grau, unificado ou unico';

-- Tipo de tribunal
create type public."TipoTribunal" as enum (
  'TRT', 'TJ', 'TRF', 'TST', 'STF', 'STJ'
);
comment on type public."TipoTribunal" is 'Tipo de tribunal (TRT, TJ, TRF, TST, STF, STJ)';

-- Instância do processo (enum legado - usar grau_tribunal para novos desenvolvimentos)
create type public."Instancia" as enum (
  'PRIMEIRO_GRAU',
  'SEGUNDO_GRAU',
  'TRIBUNAL_SUPERIOR'
);
comment on type public."Instancia" is 'Instância do processo (primeiro grau, segundo grau, tribunal superior). LEGADO: Preferir usar grau_tribunal para novos desenvolvimentos.';

-- ----------------------------------------------------------------------------
-- Enums de Pessoa
-- ----------------------------------------------------------------------------

-- Tipo de pessoa (física ou jurídica)
create type public.tipo_pessoa as enum ('pf', 'pj');
comment on type public.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';

-- Gênero do usuário
create type public.genero_usuario as enum (
  'masculino',
  'feminino',
  'outro',
  'prefiro_nao_informar'
);
comment on type public.genero_usuario is 'Gênero do usuário do sistema';

-- Estado civil
create type public.estado_civil as enum (
  'solteiro',
  'casado',
  'divorciado',
  'viuvo',
  'uniao_estavel',
  'outro'
);
comment on type public.estado_civil is 'Estado civil da pessoa física';

-- ----------------------------------------------------------------------------
-- Enums de Contrato
-- ----------------------------------------------------------------------------

-- NOTA: area_direito foi removido e substituído pela tabela 'segmentos'
-- Migração: 20251210_drop_area_direito_enum

-- Tipo de contrato
create type public.tipo_contrato as enum (
  'ajuizamento',
  'defesa',
  'ato_processual',
  'assessoria',
  'consultoria',
  'extrajudicial',
  'parecer'
);
comment on type public.tipo_contrato is 'Tipo de contrato jurídico';

-- Tipo de cobrança
create type public.tipo_cobranca as enum (
  'pro_exito',
  'pro_labore'
);
comment on type public.tipo_cobranca is 'Tipo de cobrança do contrato';

-- Status do contrato
create type public.status_contrato as enum (
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia'
);
comment on type public.status_contrato is 'Status do contrato no sistema';

-- Papel contratual (papel do cliente/parte no contrato)
create type public.papel_contratual as enum ('autora', 're');
comment on type public.papel_contratual is 'Papel contratual (autora ou ré)';

-- Polo processual
create type public.polo_processual as enum ('autor', 're');
comment on type public.polo_processual is 'Polo processual (autor ou ré)';

-- ----------------------------------------------------------------------------
-- Enums de Audiência
-- ----------------------------------------------------------------------------

-- Status de audiência
create type public.status_audiencia as enum (
  'C',  -- Cancelada
  'M',  -- Designada (Marcada)
  'F'   -- Realizada (Finalizada)
);
comment on type public.status_audiencia is 'Status da audiência: C=Cancelada, M=Designada, F=Realizada';

-- Modalidade de audiência
create type public.modalidade_audiencia as enum (
  'virtual',      -- Audiência por videoconferência
  'presencial',   -- Audiência física
  'hibrida'       -- Audiência híbrida (parte presencial, parte virtual)
);
comment on type public.modalidade_audiencia is 'Modalidade de participação na audiência: virtual (videoconferência), presencial (física) ou híbrida (mista)';

-- Situação de perícia
create type public.situacao_pericia as enum (
  'S',  -- Aguardando Esclarecimentos
  'L',  -- Aguardando Laudo
  'C',  -- Cancelada
  'F',  -- Finalizada
  'P',  -- Laudo Juntado
  'R'   -- Redesignada
);
comment on type public.situacao_pericia is 'Situação da perícia: S=Aguardando Esclarecimentos, L=Aguardando Laudo, C=Cancelada, F=Finalizada, P=Laudo Juntado, R=Redesignada';

-- ----------------------------------------------------------------------------
-- Enums de Captura
-- ----------------------------------------------------------------------------

-- Tipo de captura
create type public.tipo_captura as enum (
  'acervo_geral',
  'arquivados',
  'audiencias',
  'pendentes',
  'partes',
  'comunica_cnj',
  'combinada',
  'pericias'
);
comment on type public.tipo_captura is 'Tipo de captura: acervo_geral, arquivados, audiencias, pendentes, partes';

-- Status de captura
create type public.status_captura as enum (
  'pending',
  'in_progress',
  'completed',
  'failed'
);
comment on type public.status_captura is 'Status da captura: pending, in_progress, completed, failed';

-- ----------------------------------------------------------------------------
-- Enums de Expediente
-- ----------------------------------------------------------------------------

-- Status de expediente
create type public."StatusExpediente" as enum (
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDO',
  'CANCELADO'
);
comment on type public."StatusExpediente" is 'Status do expediente';

-- Tipo de expediente (enum legado)
create type public."TipoExpedienteEnum" as enum (
  'IMPUGNACAO_A_CONTESTACAO',
  'RAZOES_FINAIS',
  'RECURSO_ORDINARIO',
  'MANIFESTACAO',
  'RECURSO_DE_REVISTA',
  'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO',
  'CONTRARRAZOES_AOS_EMBARGOS_DE_DECLARACAO',
  'CONTRARRAZOES_AO_RECURSO_ORDINARIO',
  'EMENDA_A_INICIAL',
  'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA',
  'CONTRARRAZOES_AO_RECURSO_DE_REVISTA',
  'AGRAVO_INTERNO',
  'ADITAMENTO_A_INICIAL',
  'IMPUGNACAO_AO_CUMPRIMENTO_DE_SENTENCA',
  'IMPUGNACAO_AO_LAUDO_PERICIAL',
  'IMPUGNACAO_AO_CALCULO_PERICIAL',
  'APRESENTACAO_DE_CALCULOS',
  'IMPUGNACAO_AOS_EMBARGOS_DE_EXECUCAO',
  'APRESENTACAO_DE_QUESITOS',
  'AUDIENCIA',
  'CONTRARRAZOES_AO_RECURSO_ORDINARIO_ADESIVO',
  'CONTRAMINUTA_AO_AGRAVO_DE_PETICAO',
  'CONTRAMINUTA_AO_AGRAVO_INTERNO',
  'PERICIA',
  'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA',
  'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO',
  'SESSAO_DE_JULGAMENTO',
  'CEJUSC',
  'VERIFICAR'
);
comment on type public."TipoExpedienteEnum" is 'Tipos de expediente predefinidos';

-- Tipo de ação no histórico
create type public."TipoAcaoHistorico" as enum (
  'ATRIBUIDO',
  'TRANSFERIDO',
  'BAIXADO',
  'REVERSAO_BAIXA',
  'PROTOCOLO_ADICIONADO',
  'OBSERVACAO_ADICIONADA'
);
comment on type public."TipoAcaoHistorico" is 'Tipo de ação registrada no histórico';

-- ----------------------------------------------------------------------------
-- Enums de Sincronização
-- ----------------------------------------------------------------------------

-- Status de sincronização
create type public."SyncStatus" as enum (
  'PENDING',
  'SYNCING',
  'SYNCED',
  'PARTIAL',
  'FAILED',
  'DELETED'
);
comment on type public."SyncStatus" is 'Status de sincronização';

-- Status de arquivamento
create type public."StatusArquivamento" as enum (
  'ATIVO',
  'ARQUIVADO',
  'BAIXADO'
);
comment on type public."StatusArquivamento" is 'Status de arquivamento do processo';

-- ----------------------------------------------------------------------------
-- Enums de Notificação
-- ----------------------------------------------------------------------------

-- Tipo de notificação
create type public."NotificationType" as enum (
  'SYNC_FAILED',
  'SYNC_EXHAUSTED',
  'SCRAPE_EXECUTION_FAILED',
  'TRIBUNAL_SCRAPE_FAILED',
  'STORAGE_FULL',
  'CLEANUP_ERROR',
  'EXTERNAL_STORAGE_DOWN'
);
comment on type public."NotificationType" is 'Tipo de notificação do sistema';

-- Severidade de notificação
create type public."NotificationSeverity" as enum (
  'LOW',
  'MEDIUM',
  'HIGH'
);
comment on type public."NotificationSeverity" is 'Severidade da notificação';

-- Tipo de notificação de usuário (diferente de NotificationType que é para sistema)
create type public.tipo_notificacao_usuario as enum (
  'processo_atribuido',
  'processo_movimentacao',
  'audiencia_atribuida',
  'audiencia_alterada',
  'expediente_atribuido',
  'expediente_alterado',
  'prazo_vencendo',
  'prazo_vencido'
);
comment on type public.tipo_notificacao_usuario is 'Tipo de notificação para usuários do sistema (processos, audiências, expedientes)';

-- ----------------------------------------------------------------------------
-- Enums de Tarefas
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Enums Financeiros - Sistema de Gestão Financeira (SGF)
-- ----------------------------------------------------------------------------

-- Tipo de conta contábil no plano de contas
create type public.tipo_conta_contabil as enum (
  'ativo',
  'passivo',
  'receita',
  'despesa',
  'patrimonio_liquido'
);
comment on type public.tipo_conta_contabil is 'Tipo de conta no plano de contas: ativo (bens e direitos), passivo (obrigações), receita (entradas), despesa (saídas), patrimonio_liquido (capital próprio)';

-- Natureza da conta contábil (devedora ou credora)
create type public.natureza_conta as enum (
  'devedora',
  'credora'
);
comment on type public.natureza_conta is 'Natureza da conta: devedora (aumenta com débito) ou credora (aumenta com crédito)';

-- Nível da conta no plano de contas
create type public.nivel_conta as enum (
  'sintetica',
  'analitica'
);
comment on type public.nivel_conta is 'Nível da conta: sintetica (agrupa outras contas) ou analitica (recebe lançamentos diretos)';

-- Tipo de lançamento financeiro
create type public.tipo_lancamento as enum (
  'receita',
  'despesa',
  'transferencia',
  'aplicacao',
  'resgate'
);
comment on type public.tipo_lancamento is 'Tipo de lançamento: receita (entrada), despesa (saída), transferencia (entre contas), aplicacao (investimento), resgate (resgate de investimento)';

-- Status do lançamento financeiro
create type public.status_lancamento as enum (
  'pendente',
  'confirmado',
  'cancelado',
  'estornado'
);
comment on type public.status_lancamento is 'Status do lançamento: pendente (não efetivado), confirmado (efetivado), cancelado (não será efetivado), estornado (revertido após efetivação)';

-- Origem do lançamento financeiro
create type public.origem_lancamento as enum (
  'manual',
  'acordo_judicial',
  'contrato',
  'folha_pagamento',
  'importacao_bancaria',
  'recorrente'
);
comment on type public.origem_lancamento is 'Origem do lançamento: manual (digitado), acordo_judicial (de acordos/condenações), contrato (de contrato), folha_pagamento (de folha), importacao_bancaria (de extrato), recorrente (gerado automaticamente)';

-- Tipo de conta bancária
create type public.tipo_conta_bancaria as enum (
  'corrente',
  'poupanca',
  'investimento',
  'caixa'
);
comment on type public.tipo_conta_bancaria is 'Tipo de conta: corrente, poupanca, investimento ou caixa (dinheiro em espécie)';

-- Status da conta bancária
create type public.status_conta_bancaria as enum (
  'ativa',
  'inativa',
  'encerrada'
);
comment on type public.status_conta_bancaria is 'Status da conta: ativa (em uso), inativa (pausada temporariamente), encerrada (fechada definitivamente)';

-- Forma de pagamento financeiro
create type public.forma_pagamento_financeiro as enum (
  'dinheiro',
  'transferencia_bancaria',
  'ted',
  'pix',
  'boleto',
  'cartao_credito',
  'cartao_debito',
  'cheque',
  'deposito_judicial'
);
comment on type public.forma_pagamento_financeiro is 'Forma de pagamento: dinheiro, transferencia_bancaria, ted, pix, boleto, cartao_credito, cartao_debito, cheque, deposito_judicial';

-- Status de conciliação bancária
create type public.status_conciliacao as enum (
  'pendente',
  'conciliado',
  'divergente',
  'ignorado'
);
comment on type public.status_conciliacao is 'Status de conciliação: pendente (não verificado), conciliado (conferido), divergente (com diferenças), ignorado (desconsiderado)';

-- Período do orçamento
create type public.periodo_orcamento as enum (
  'mensal',
  'trimestral',
  'semestral',
  'anual'
);
comment on type public.periodo_orcamento is 'Período de referência do orçamento: mensal, trimestral, semestral ou anual';

-- Status do orçamento
create type public.status_orcamento as enum (
  'rascunho',
  'aprovado',
  'em_execucao',
  'encerrado'
);
comment on type public.status_orcamento is 'Status do orçamento: rascunho (em elaboração), aprovado (validado), em_execucao (período corrente), encerrado (período finalizado)';

-- ----------------------------------------------------------------------------
-- Enums de Entrevista Trabalhista
-- ----------------------------------------------------------------------------

-- Tipo de litígio trabalhista (bifurcação ontológica)
create type public.tipo_litigio_trabalhista as enum (
  'trabalhista_classico',
  'gig_economy',
  'pejotizacao'
);
comment on type public.tipo_litigio_trabalhista is 'Tipo de litígio trabalhista: trabalhista_classico (empresa física/tradicional), gig_economy (plataforma/aplicativo), pejotizacao (MEI para tomadora única)';

-- Status da entrevista trabalhista
create type public.status_entrevista as enum (
  'rascunho',
  'em_andamento',
  'concluida'
);
comment on type public.status_entrevista is 'Status da entrevista trabalhista: rascunho (iniciada mas vazia), em_andamento (módulos sendo preenchidos), concluida (finalizada)';
