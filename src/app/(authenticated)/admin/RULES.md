# Regras de Negócio - Admin

## Contexto
Módulo administrativo do Synthropic, focado em **observabilidade do banco de dados** e **gestão de infraestrutura**. Provê métricas de performance do Postgres (cache hit rate, queries lentas, bloat, índices não utilizados, disk I/O) e um assistente de decisão para upgrade de tier de compute do Supabase.

## Entidades Principais
- **MetricasDB**: Snapshot consolidado de métricas do banco — cache hit rate, queries lentas, sequential scans, bloat, índices não utilizados, status de Disk I/O
- **UpgradeRecommendation**: Recomendação de upgrade com tier sugerido, motivos, custo estimado e tempo de downtime
- **CacheHitRate**: Taxa de cache hit por tipo (heap, index)
- **QueryLenta**: Query identificada como lenta via `pg_stat_statements`
- **TabelaSequentialScan**: Tabela com alta proporção de sequential scans
- **BloatTabela**: Tabelas com bloat (espaço desperdiçado)
- **IndiceNaoUtilizado**: Índices criados mas nunca usados
- **MetricasDiskIO**: Consumo de Disk I/O Budget do Supabase

## Enums e Tipos

### DiskIOStatus
- `ok`: Consumo normal
- `warning`: Consumo elevado (atenção)
- `critical`: Consumo crítico (risco de throttling)
- `unknown`: Métrica indisponível

### Tiers de Compute
- `micro`, `small`, `medium`, `large` (alinhado à nomenclatura do Supabase Management API)

## Regras de Negócio

### Coleta de Métricas DB
1. Métricas são coletadas via SQL contra `pg_stat_*` views do Postgres
2. Resultado é cacheado via Redis (`withCache` + `CACHE_PREFIXES`)
3. Disk I/O é obtido via Supabase Management API (não é uma view local)
4. Status de Disk I/O é derivado: `< 70%` → ok, `70–90%` → warning, `> 90%` → critical
5. Métricas são consolidadas em `MetricasDB` com `timestamp` da coleta

### Avaliação de Upgrade
1. Coletar `cacheHitRate`, `diskIOBudgetPercent` e `computeAtual` em paralelo
2. Avaliar via `avaliarNecessidadeUpgrade()`:
   - Cache hit rate baixo (< 95%) sugere upgrade
   - Disk I/O budget alto (> 80%) sugere upgrade
   - Tier recomendado é o próximo acima do atual
3. Calcular custo incremental e downtime estimado
4. Retornar recomendação estruturada com motivos textuais

### Persistência da Decisão de Upgrade
- Recomendações podem ser persistidas em arquivo local (via `fs/promises`) para histórico
- Não usa Supabase para esse log — é metadata operacional

## Restrições de Acesso
- **Todas as actions exigem `is_super_admin = true`**
- Validação via `requireAuth([])` + checagem `user.roles?.includes("admin")`
- Ações de upgrade têm gate adicional explícito antes de executar

## Integrações
- **Supabase Management API**: `obterMetricasDiskIO()`, `obterComputeAtual()` via `@/lib/supabase/management-api`
- **Redis**: Cache de métricas com TTL controlado
- **pg_stat_statements**: Extensão Postgres usada para queries lentas
- **Filesystem**: Persistência de histórico de recomendações

## Cache
- Métricas DB usam `withCache` + `generateCacheKey` com prefixo dedicado
- Reduz carga em queries pesadas contra `pg_stat_*`
