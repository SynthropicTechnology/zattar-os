-- Migration: Corrigir políticas RLS para alinhamento com sistema de permissões granulares
-- 
-- IMPORTANTE: O sistema Synthropic usa permissões granulares por usuário (não baseado em roles)
-- Cada operação é verificada no backend via checkPermission(usuarioId, recurso, operacao)
-- 
-- As políticas RLS servem como camada de segurança ADICIONAL, mas a autorização principal
-- é feita no backend consultando a tabela `permissoes` e verificando `is_super_admin`.
--
-- Estratégia:
-- 1. Service Role: Acesso total (usado pelas APIs backend)
-- 2. Authenticated: Acesso de leitura para colaboração
-- 3. Backend faz a verificação granular de permissões antes de permitir INSERT/UPDATE/DELETE

-- ============================================================================
-- FUNÇÃO HELPER: Obter ID do usuário a partir do auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_usuario_id_from_auth()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_usuario_id_from_auth() IS 
'Retorna o ID do usuário (tabela usuarios) a partir do auth.uid() do Supabase Auth';

-- ============================================================================
-- TABELA: acervo (6.140 registros)
-- Processos capturados do PJE
-- ============================================================================

CREATE POLICY "Service role: acesso total ao acervo"
  ON public.acervo
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler acervo"
  ON public.acervo
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total ao acervo" ON public.acervo IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares via checkPermission()';

COMMENT ON POLICY "Usuários autenticados podem ler acervo" ON public.acervo IS
'Leitura permitida para colaboração. Backend controla INSERT/UPDATE/DELETE via permissões granulares';

-- ============================================================================
-- TABELA: advogados (2 registros)
-- Cadastro de advogados do sistema
-- ============================================================================

CREATE POLICY "Service role: acesso total a advogados"
  ON public.advogados
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler advogados"
  ON public.advogados
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a advogados" ON public.advogados IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler advogados" ON public.advogados IS
'Leitura para todos (necessário para dropdowns, atribuições, etc)';

-- ============================================================================
-- TABELA: credenciais (48 registros)
-- Credenciais de acesso aos tribunais
-- ============================================================================

CREATE POLICY "Service role: acesso total a credenciais"
  ON public.credenciais
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler credenciais"
  ON public.credenciais
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a credenciais" ON public.credenciais IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler credenciais" ON public.credenciais IS
'Leitura para selecionar credenciais em capturas. Senhas são sensíveis, mas necessárias';

-- ============================================================================
-- TABELA: audiencias (135 registros)
-- Audiências agendadas
-- ============================================================================

CREATE POLICY "Service role: acesso total a audiências"
  ON public.audiencias
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler audiências"
  ON public.audiencias
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a audiências" ON public.audiencias IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler audiências" ON public.audiencias IS
'Leitura para calendário compartilhado e colaboração';

-- ============================================================================
-- TABELA: pendentes_manifestacao (363 registros)
-- Expedientes pendentes de manifestação
-- ============================================================================

CREATE POLICY "Service role: acesso total a pendentes"
  ON public.pendentes_manifestacao
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler pendentes"
  ON public.pendentes_manifestacao
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a pendentes" ON public.pendentes_manifestacao IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler pendentes" ON public.pendentes_manifestacao IS
'Leitura para visualização de pendências e distribuição de trabalho';

-- ============================================================================
-- TABELA: clientes (0 registros)
-- Cadastro de clientes (PF e PJ)
-- ============================================================================

CREATE POLICY "Service role: acesso total a clientes"
  ON public.clientes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler clientes"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a clientes" ON public.clientes IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler clientes" ON public.clientes IS
'Leitura para selecionar clientes em contratos e processos';

-- ============================================================================
-- TABELA: partes_contrarias (0 registros)
-- Cadastro de partes contrárias
-- ============================================================================

CREATE POLICY "Service role: acesso total a partes contrárias"
  ON public.partes_contrarias
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler partes contrárias"
  ON public.partes_contrarias
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a partes contrárias" ON public.partes_contrarias IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler partes contrárias" ON public.partes_contrarias IS
'Leitura para selecionar em contratos';

-- ============================================================================
-- TABELA: contratos (0 registros)
-- Contratos jurídicos do escritório
-- ============================================================================

CREATE POLICY "Service role: acesso total a contratos"
  ON public.contratos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler contratos"
  ON public.contratos
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a contratos" ON public.contratos IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler contratos" ON public.contratos IS
'Leitura para visualização de contratos e colaboração';

-- ============================================================================
-- TABELA: contrato_processos
-- Relacionamento entre contratos e processos
-- ============================================================================

CREATE POLICY "Service role: acesso total a contrato_processos"
  ON public.contrato_processos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler contrato_processos"
  ON public.contrato_processos
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a contrato_processos" ON public.contrato_processos IS
'Service role (backend) tem acesso total. Backend verifica permissões granulares';

COMMENT ON POLICY "Usuários autenticados podem ler contrato_processos" ON public.contrato_processos IS
'Leitura para visualização de processos vinculados a contratos';

-- ============================================================================
-- TABELA: orgao_julgador (102 registros)
-- Órgãos julgadores dos processos
-- ============================================================================

CREATE POLICY "Service role: acesso total a orgao_julgador"
  ON public.orgao_julgador
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler orgao_julgador"
  ON public.orgao_julgador
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a orgao_julgador" ON public.orgao_julgador IS
'Service role (backend) tem acesso total';

COMMENT ON POLICY "Usuários autenticados podem ler orgao_julgador" ON public.orgao_julgador IS
'Dados públicos necessários para filtros e visualização';

-- ============================================================================
-- TABELA: logs_alteracao (124 registros)
-- Logs de auditoria de alterações
-- ============================================================================

CREATE POLICY "Service role: acesso total a logs_alteracao"
  ON public.logs_alteracao
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler logs_alteracao"
  ON public.logs_alteracao
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Service role: acesso total a logs_alteracao" ON public.logs_alteracao IS
'Service role (backend) tem acesso total para gravar logs';

COMMENT ON POLICY "Usuários autenticados podem ler logs_alteracao" ON public.logs_alteracao IS
'Leitura para auditoria e histórico de alterações';

-- ============================================================================
-- TABELA: capturas_log (2 registros)
-- Histórico de execuções de captura
-- ============================================================================

-- Política já existe: "Usuários autenticados podem visualizar histórico de capturas"
-- Apenas adicionar a política de service role

CREATE POLICY "Service role: acesso total a capturas_log"
  ON public.capturas_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Service role: acesso total a capturas_log" ON public.capturas_log IS
'Service role (backend) tem acesso total para gravar logs de captura';

-- ============================================================================
-- ATUALIZAR POLÍTICAS EXISTENTES PARA REMOVER auth.role()
-- ============================================================================

-- A função auth.role() não funciona bem com autenticação por sessão do Next.js
-- Substituir por verificação mais robusta

-- Remover políticas antigas das tabelas que já têm políticas
DROP POLICY IF EXISTS "Usuários autenticados podem ler agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar agendamentos" ON public.agendamentos;

DROP POLICY IF EXISTS "Usuários autenticados podem ler acordos/condenações" ON public.acordos_condenacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem criar acordos/condenações" ON public.acordos_condenacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar acordos/condenações" ON public.acordos_condenacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar acordos/condenações" ON public.acordos_condenacoes;

DROP POLICY IF EXISTS "Usuários autenticados podem ler parcelas" ON public.parcelas;
DROP POLICY IF EXISTS "Usuários autenticados podem criar parcelas" ON public.parcelas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar parcelas" ON public.parcelas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar parcelas" ON public.parcelas;

DROP POLICY IF EXISTS "Usuários autenticados podem ler cargos" ON public.cargos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar cargos" ON public.cargos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar cargos" ON public.cargos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar cargos" ON public.cargos;

-- Recriar políticas sem auth.role()
-- AGENDAMENTOS
CREATE POLICY "Service role: acesso total a agendamentos"
  ON public.agendamentos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler agendamentos"
  ON public.agendamentos
  FOR SELECT
  TO authenticated
  USING (true);

-- ACORDOS/CONDENAÇÕES
CREATE POLICY "Service role: acesso total a acordos_condenacoes"
  ON public.acordos_condenacoes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler acordos_condenacoes"
  ON public.acordos_condenacoes
  FOR SELECT
  TO authenticated
  USING (true);

-- PARCELAS
CREATE POLICY "Service role: acesso total a parcelas"
  ON public.parcelas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler parcelas"
  ON public.parcelas
  FOR SELECT
  TO authenticated
  USING (true);

-- CARGOS
CREATE POLICY "Service role: acesso total a cargos"
  ON public.cargos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler cargos"
  ON public.cargos
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ATUALIZAR POLÍTICA DE PERMISSÕES
-- ============================================================================

-- Remover política antiga que usa auth.role()
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar permissões" ON public.permissoes;

-- Recriar sem auth.role()
CREATE POLICY "Service role: acesso total a permissoes"
  ON public.permissoes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Service role: acesso total a permissoes" ON public.permissoes IS
'Service role (backend) tem acesso total para gerenciar permissões';

COMMENT ON POLICY "Usuários podem ler suas próprias permissões" ON public.permissoes IS
'Usuários podem ver suas próprias permissões (usado pelo frontend para UI condicional)';

-- ============================================================================
-- DOCUMENTAÇÃO FINAL
-- ============================================================================

COMMENT ON TABLE public.acervo IS 'Acervo completo de processos capturados do PJE. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares para escrita.';

COMMENT ON TABLE public.advogados IS 'Cadastro de advogados do sistema. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.credenciais IS 'Credenciais de acesso aos tribunais. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.audiencias IS 'Audiências agendadas dos processos. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.pendentes_manifestacao IS 'Processos pendentes de manifestação. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.clientes IS 'Cadastro de clientes (PF e PJ). RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.partes_contrarias IS 'Cadastro de partes contrárias. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.contratos IS 'Contratos jurídicos do escritório. RLS: Service role tem acesso total. Usuários autenticados podem ler. Backend verifica permissões granulares.';

COMMENT ON TABLE public.logs_alteracao IS 'Logs de auditoria de alterações. RLS: Service role tem acesso total. Usuários autenticados podem ler.';

COMMENT ON TABLE public.permissoes IS 'Permissões granulares por usuário. RLS: Service role tem acesso total. Usuários podem ler suas próprias permissões. Backend verifica is_super_admin.';

-- ============================================================================
-- RESUMO DA ESTRATÉGIA DE SEGURANÇA
-- ============================================================================

-- 1. RLS está HABILITADO em todas as tabelas principais
-- 2. Service Role (backend) tem ACESSO TOTAL via políticas RLS
-- 3. Usuários autenticados têm LEITURA para colaboração
-- 4. Backend verifica permissões granulares via checkPermission(usuarioId, recurso, operacao)
--    antes de permitir INSERT/UPDATE/DELETE
-- 5. Super admins (is_super_admin = true) fazem bypass de permissões no backend
-- 6. Tabela `permissoes` contém as regras granulares por usuário
-- 7. Cache de permissões no backend (TTL 5 minutos) para performance
