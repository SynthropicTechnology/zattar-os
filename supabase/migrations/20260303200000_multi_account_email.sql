-- =============================================================================
-- migration: permitir multiplas contas de e-mail por usuario
-- descricao: remove UNIQUE(usuario_id), adiciona nome_conta, nova UNIQUE
-- =============================================================================

-- 1. Adicionar coluna nome_conta (label amigavel para o usuario)
alter table public.credenciais_email
  add column if not exists nome_conta text;

-- 2. Preencher nome_conta com imap_user para registros existentes
update public.credenciais_email
  set nome_conta = imap_user
  where nome_conta is null;

-- 3. Tornar nome_conta not null com default
alter table public.credenciais_email
  alter column nome_conta set not null,
  alter column nome_conta set default '';

-- 4. Remover constraint UNIQUE antiga (1 conta por usuario)
alter table public.credenciais_email
  drop constraint if exists credenciais_email_usuario_id_unique;

-- 5. Adicionar nova constraint (mesmo usuario nao pode ter mesmo e-mail duplicado)
alter table public.credenciais_email
  add constraint credenciais_email_usuario_email_unique unique (usuario_id, imap_user);
