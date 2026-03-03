-- =============================================================================
-- TABELA: agenda_eventos
-- Eventos criados diretamente pelo usuário na agenda (não importados de outras fontes)
-- =============================================================================

create table public.agenda_eventos (
  id              bigint generated always as identity primary key,
  titulo          text not null,
  descricao       text,
  data_inicio     timestamptz not null,
  data_fim        timestamptz not null,
  dia_inteiro     boolean not null default false,
  local           text,
  cor             text not null default 'sky',
  responsavel_id  bigint references public.usuarios(id) on delete set null,
  criado_por      bigint not null references public.usuarios(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deletado_em     timestamptz
);

comment on table public.agenda_eventos is 'Eventos criados diretamente na agenda pelos usuários';
comment on column public.agenda_eventos.responsavel_id is 'Usuário responsável pelo evento';
comment on column public.agenda_eventos.criado_por is 'Usuário que criou o evento';
comment on column public.agenda_eventos.deletado_em is 'Soft delete: se preenchido, evento foi excluído';

-- Indexes
create index idx_agenda_eventos_periodo
  on public.agenda_eventos (data_inicio, data_fim)
  where deletado_em is null;

create index idx_agenda_eventos_responsavel
  on public.agenda_eventos (responsavel_id)
  where deletado_em is null;

-- Trigger para updated_at automático
create trigger update_agenda_eventos_updated_at
  before update on public.agenda_eventos
  for each row execute function update_updated_at_column();

-- RLS
alter table public.agenda_eventos enable row level security;

create policy "Service role: acesso total a agenda_eventos"
  on public.agenda_eventos
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem ler agenda_eventos"
  on public.agenda_eventos
  for select
  to authenticated
  using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem criar agenda_eventos"
  on public.agenda_eventos
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "Usuários autenticados podem atualizar agenda_eventos"
  on public.agenda_eventos
  for update
  to authenticated
  using (auth.role() = 'authenticated');
