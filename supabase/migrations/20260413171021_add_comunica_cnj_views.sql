create table if not exists comunica_cnj_views (
  id bigserial primary key,
  nome text not null,
  icone text default 'bookmark',
  filtros jsonb not null default '{}',
  colunas jsonb not null default '[]',
  sort jsonb not null default '{}',
  densidade text not null default 'padrao' check (densidade in ('compacto', 'padrao', 'confortavel')),
  modo_visualizacao text not null default 'tabela' check (modo_visualizacao in ('tabela', 'cards')),
  visibilidade text not null default 'pessoal' check (visibilidade in ('pessoal', 'equipe')),
  criado_por bigint not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table comunica_cnj_views enable row level security;

create policy "Usuarios podem ver views pessoais e de equipe"
  on comunica_cnj_views for select
  using (
    criado_por = get_current_user_id()
    or visibilidade = 'equipe'
  );

create policy "Usuarios podem criar views"
  on comunica_cnj_views for insert
  with check (criado_por = get_current_user_id());

create policy "Usuarios podem editar suas views"
  on comunica_cnj_views for update
  using (criado_por = get_current_user_id());

create policy "Usuarios podem deletar suas views"
  on comunica_cnj_views for delete
  using (criado_por = get_current_user_id());
