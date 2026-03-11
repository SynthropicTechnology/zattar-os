-- ============================================================================
-- Entrevistas Trabalhistas
-- Ficha de entrevista de investigação trabalhista vinculada ao contrato
-- ============================================================================

-- Tabela principal de entrevistas
create table if not exists public.entrevistas_trabalhistas (
  id bigint generated always as identity primary key,

  -- Vínculo com contrato (1:1)
  contrato_id bigint not null references public.contratos(id) on delete cascade,

  -- Classificação do litígio (Nó Zero)
  tipo_litigio public.tipo_litigio_trabalhista not null,
  perfil_reclamante text,

  -- Status e progresso
  status public.status_entrevista not null default 'rascunho',
  modulo_atual text default 'no_zero',

  -- Dados da entrevista (JSONB flexível por trilha)
  respostas jsonb not null default '{}'::jsonb,
  notas_operador jsonb default '{}'::jsonb,

  -- Mapeamento de testemunhas
  testemunhas_mapeadas boolean not null default false,

  -- Auditoria
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.entrevistas_trabalhistas is 'Ficha de entrevista de investigação trabalhista vinculada ao contrato';
comment on column public.entrevistas_trabalhistas.contrato_id is 'ID do contrato ao qual a entrevista está vinculada (relação 1:1)';
comment on column public.entrevistas_trabalhistas.tipo_litigio is 'Tipo de litígio: trabalhista_classico, gig_economy ou pejotizacao';
comment on column public.entrevistas_trabalhistas.perfil_reclamante is 'Perfil do reclamante: domestica, comerciario, industrial, rural, etc.';
comment on column public.entrevistas_trabalhistas.status is 'Status da entrevista: rascunho, em_andamento ou concluida';
comment on column public.entrevistas_trabalhistas.modulo_atual is 'Último módulo preenchido (para retomada): no_zero, vinculo, jornada, saude_ambiente, ruptura';
comment on column public.entrevistas_trabalhistas.respostas is 'Respostas estruturadas por módulo em formato JSONB';
comment on column public.entrevistas_trabalhistas.notas_operador is 'Anotações livres do entrevistador por módulo em JSONB';
comment on column public.entrevistas_trabalhistas.testemunhas_mapeadas is 'Indica se testemunhas foram mapeadas durante a entrevista';
comment on column public.entrevistas_trabalhistas.created_by is 'ID do usuário que conduziu a entrevista';

-- Constraint de unicidade: uma entrevista por contrato
alter table public.entrevistas_trabalhistas
  add constraint uq_entrevistas_trabalhistas_contrato_id unique (contrato_id);

-- Indexes
create index idx_entrevistas_trab_contrato_id on public.entrevistas_trabalhistas using btree (contrato_id);
create index idx_entrevistas_trab_status on public.entrevistas_trabalhistas using btree (status);
create index idx_entrevistas_trab_tipo_litigio on public.entrevistas_trabalhistas using btree (tipo_litigio);
create index idx_entrevistas_trab_created_by on public.entrevistas_trabalhistas using btree (created_by);

-- Trigger para atualizar updated_at automaticamente
create trigger update_entrevistas_trabalhistas_updated_at
before update on public.entrevistas_trabalhistas
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.entrevistas_trabalhistas enable row level security;

-- RLS Policies
create policy "service role full access - entrevistas_trabalhistas"
  on public.entrevistas_trabalhistas for all
  to service_role
  using (true) with check (true);

-- ============================================================================
-- Anexos de Entrevista Trabalhista
-- Anexos probatórios contextualizados por módulo e nó de referência
-- ============================================================================

create table if not exists public.entrevista_anexos (
  id bigint generated always as identity primary key,

  -- Vínculo com entrevista
  entrevista_id bigint not null references public.entrevistas_trabalhistas(id) on delete cascade,

  -- Contexto do anexo
  modulo text not null,
  no_referencia text,
  tipo_anexo text not null,

  -- Arquivo
  arquivo_url text not null,
  descricao text,

  -- Auditoria
  created_at timestamptz not null default now()
);

comment on table public.entrevista_anexos is 'Anexos probatórios da entrevista trabalhista, vinculados por módulo e nó';
comment on column public.entrevista_anexos.entrevista_id is 'ID da entrevista à qual o anexo pertence';
comment on column public.entrevista_anexos.modulo is 'Módulo da entrevista: vinculo, jornada, saude_ambiente, ruptura';
comment on column public.entrevista_anexos.no_referencia is 'Nó de referência no fluxo: A.1.1, A.2.1, A.3.2, A.4.2, etc.';
comment on column public.entrevista_anexos.tipo_anexo is 'Tipo do anexo: foto_ctps, print_whatsapp, audio_relato, trct, extrato_fgts, etc.';
comment on column public.entrevista_anexos.arquivo_url is 'URL do arquivo no storage B2';
comment on column public.entrevista_anexos.descricao is 'Descrição livre do anexo';

-- Indexes
create index idx_entrevista_anexos_entrevista_id on public.entrevista_anexos using btree (entrevista_id);
create index idx_entrevista_anexos_modulo on public.entrevista_anexos using btree (modulo);

-- Habilitar RLS
alter table public.entrevista_anexos enable row level security;

-- RLS Policies
create policy "service role full access - entrevista_anexos"
  on public.entrevista_anexos for all
  to service_role
  using (true) with check (true);
