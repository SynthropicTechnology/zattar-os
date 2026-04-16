create table if not exists comunica_cnj_resumos (
  id bigserial primary key,
  comunicacao_id bigint not null references comunica_cnj(id) on delete cascade,
  resumo text not null,
  tags jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(comunicacao_id)
);

alter table comunica_cnj_resumos enable row level security;

create policy "Usuarios autenticados podem ver resumos"
  on comunica_cnj_resumos for select
  using (true);

create policy "Usuarios autenticados podem criar/atualizar resumos"
  on comunica_cnj_resumos for insert
  with check (true);

create policy "Usuarios autenticados podem atualizar resumos"
  on comunica_cnj_resumos for update
  using (true);
