-- ============================================================================
-- Migration: Limpeza retroativa de processos atribuídos a usuários inativos
-- ============================================================================
-- Data: 2026-04-09
-- Problema: O trigger desativar_usuario_auto_desatribuir só executa quando
--           um usuário é desativado APÓS o trigger existir. Processos que
--           já estavam atribuídos a usuários desativados antes da criação
--           do trigger permaneceram com responsavel_id apontando para
--           usuários inativos.
--
-- Solução: One-shot cleanup que limpa todas as atribuições órfãs.
-- ============================================================================

-- Limpar processos atribuídos a usuários inativos
UPDATE public.acervo
SET responsavel_id = NULL
WHERE responsavel_id IN (
  SELECT id FROM public.usuarios WHERE ativo = false
);

-- Limpar audiências atribuídas a usuários inativos
UPDATE public.audiencias
SET responsavel_id = NULL
WHERE responsavel_id IN (
  SELECT id FROM public.usuarios WHERE ativo = false
);

-- Limpar expedientes manuais atribuídos a usuários inativos
UPDATE public.expedientes_manuais
SET responsavel_id = NULL
WHERE responsavel_id IN (
  SELECT id FROM public.usuarios WHERE ativo = false
);

-- Limpar contratos atribuídos a usuários inativos
UPDATE public.contratos
SET responsavel_id = NULL
WHERE responsavel_id IN (
  SELECT id FROM public.usuarios WHERE ativo = false
);

-- Limpar pendentes de manifestação atribuídos a usuários inativos
UPDATE public.pendentes_manifestacao
SET responsavel_id = NULL
WHERE responsavel_id IN (
  SELECT id FROM public.usuarios WHERE ativo = false
);
