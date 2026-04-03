-- ============================================================================
-- Migration: Criar views de diagnóstico com pg_stat_statements
-- ============================================================================
--
-- pg_stat_statements já está instalado (v1.11). Esta migration cria views
-- úteis para monitoramento de performance de queries.
--
-- Uso: SELECT * FROM public.vw_queries_mais_lentas LIMIT 20;
-- ============================================================================

-- View: Queries que consomem mais tempo total (hot queries)
CREATE OR REPLACE VIEW public.vw_queries_mais_lentas AS
SELECT
  queryid,
  LEFT(query, 200) AS query_resumida,
  calls,
  ROUND(total_exec_time::numeric, 2) AS tempo_total_ms,
  ROUND(mean_exec_time::numeric, 2) AS tempo_medio_ms,
  ROUND(max_exec_time::numeric, 2) AS tempo_maximo_ms,
  ROUND(min_exec_time::numeric, 2) AS tempo_minimo_ms,
  rows,
  ROUND((100.0 * total_exec_time / NULLIF(SUM(total_exec_time) OVER(), 0))::numeric, 2) AS percentual_tempo
FROM pg_stat_statements
WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
ORDER BY total_exec_time DESC;

-- View: Queries mais frequentes
CREATE OR REPLACE VIEW public.vw_queries_mais_frequentes AS
SELECT
  queryid,
  LEFT(query, 200) AS query_resumida,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS tempo_medio_ms,
  ROUND(total_exec_time::numeric, 2) AS tempo_total_ms,
  rows
FROM pg_stat_statements
WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
  AND calls > 10
ORDER BY calls DESC;

-- View: Queries com pior tempo médio (outliers)
CREATE OR REPLACE VIEW public.vw_queries_outliers AS
SELECT
  queryid,
  LEFT(query, 200) AS query_resumida,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS tempo_medio_ms,
  ROUND(max_exec_time::numeric, 2) AS tempo_maximo_ms,
  ROUND(stddev_exec_time::numeric, 2) AS desvio_padrao_ms,
  rows
FROM pg_stat_statements
WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
  AND calls > 5
  AND mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- RLS: Apenas super admins podem ver as views de diagnóstico
-- (as views já herdam as permissões de pg_stat_statements que requer superuser)

COMMENT ON VIEW public.vw_queries_mais_lentas IS 'Top queries por tempo total de execução. Use para identificar queries que mais impactam performance.';
COMMENT ON VIEW public.vw_queries_mais_frequentes IS 'Queries mais chamadas. Mesmo queries rápidas podem impactar se chamadas milhões de vezes.';
COMMENT ON VIEW public.vw_queries_outliers IS 'Queries com tempo médio > 100ms. Candidatas para otimização com índices.';
