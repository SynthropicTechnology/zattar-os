create table if not exists comunica_cnj_sync_log (
  id bigserial primary key,
  tipo text not null check (tipo in ('automatica', 'manual')),
  status text not null check (status in ('sucesso', 'erro', 'em_andamento')),
  total_processados int not null default 0,
  novos int not null default 0,
  duplicados int not null default 0,
  vinculados_auto int not null default 0,
  orfaos int not null default 0,
  erros jsonb not null default '[]',
  parametros jsonb not null default '{}',
  duracao_ms int,
  executado_por bigint not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table comunica_cnj_sync_log enable row level security;

create policy "Usuarios autenticados podem ver logs de sync"
  on comunica_cnj_sync_log for select
  using (true);

create policy "Usuarios autenticados podem criar logs"
  on comunica_cnj_sync_log for insert
  with check (executado_por = (select auth.uid()::bigint));
