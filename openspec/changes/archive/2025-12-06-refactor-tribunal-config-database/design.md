# Design: Refatoração de Configurações de Tribunais

## Context

O sistema Synthropic captura dados de 24 Tribunais Regionais do Trabalho (TRT1 a TRT24), cada um com URLs específicas para login, API e base. Atualmente essas configurações estão hardcoded em `backend/captura/services/trt/config.ts` (~400 linhas de código).

Existe uma tabela `TribunalConfig` (camelCase) no banco de dados herdada do projeto anterior, mas não está sendo utilizada. Esta refatoração visa migrar para uso da tabela do banco, renomeando-a para `tribunais_config` (snake_case) seguindo o padrão das novas tabelas.

**Stakeholders**: Backend de captura, serviço de agendamento, futuras interfaces administrativas

**Constraints**:
- Sistema em desenvolvimento (sem necessidade de retrocompatibilidade)
- Deve suportar timeouts customizados por tribunal (alguns TRTs são mais lentos)

## Goals / Non-Goals

**Goals**:
- Migrar configurações de tribunais de código para banco de dados
- Renomear tabela para seguir padrão snake_case
- Manter compatibilidade com código existente (mesma assinatura de função)
- Implementar cache em memória para performance
- Suportar timeouts customizados via JSONB

**Non-Goals**:
- Criar interface administrativa para edição (pode ser feito no futuro)
- Migrar timeouts de autenticação (continuam hardcoded em `trt-auth.service.ts`)
- Alterar estrutura de outras tabelas

## Decisions

### Decision 1: Renomear tabela para snake_case
**Rationale**: Todas as novas tabelas seguem snake_case (`acervo`, `usuarios`, `pendentes_manifestacao`). Manter camelCase criaria inconsistência.

**Implementation**:
```sql
ALTER TABLE "TribunalConfig" RENAME TO tribunais_config;
ALTER TABLE tribunais_config RENAME COLUMN "tribunalId" TO tribunal_id;
ALTER TABLE tribunais_config RENAME COLUMN "urlBase" TO url_base;
ALTER TABLE tribunais_config RENAME COLUMN "urlLoginSeam" TO url_login_seam;
ALTER TABLE tribunais_config RENAME COLUMN "urlApi" TO url_api;
ALTER TABLE tribunais_config RENAME COLUMN "customTimeouts" TO custom_timeouts;
ALTER TABLE tribunais_config RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE tribunais_config RENAME COLUMN "updatedAt" TO updated_at;
```

**Alternatives considered**:
- Manter `TribunalConfig` camelCase: rejeitado por inconsistência
- Criar nova tabela e migrar: rejeitado por complexidade desnecessária

### Decision 2: Atualizar enum de grau
**Rationale**: Campo `grau` atualmente usa strings '1g' e '2g', mas existe enum `grau_tribunal` ('primeiro_grau', 'segundo_grau') usado em outras tabelas.

**Implementation**:
```sql
-- Adicionar nova coluna com enum
ALTER TABLE tribunais_config ADD COLUMN grau_enum grau_tribunal;

-- Migrar dados
UPDATE tribunais_config SET grau_enum = 'primeiro_grau' WHERE grau = '1g';
UPDATE tribunais_config SET grau_enum = 'segundo_grau' WHERE grau = '2g';

-- Trocar colunas
ALTER TABLE tribunais_config DROP COLUMN grau;
ALTER TABLE tribunais_config RENAME COLUMN grau_enum TO grau;
ALTER TABLE tribunais_config ALTER COLUMN grau SET NOT NULL;
```

**Alternatives considered**:
- Manter '1g'/'2g': rejeitado por inconsistência com restante do sistema
- Criar novo enum específico: rejeitado por duplicação

### Decision 3: Implementar cache em memória
**Rationale**: Configurações de tribunais são lidas frequentemente mas raramente mudam. Cache reduz latência e carga no banco.

**Implementation**:
- Cache simples em memória usando `Map<string, ConfigTRT>`
- TTL de 5 minutos (mesmo padrão de `credential-cache.service.ts`)
- Chave do cache: `${trtCodigo}:${grau}`
- Invalidação manual via função `clearConfigCache()`

**Alternatives considered**:
- Redis: rejeitado por overhead desnecessário (configs são pequenas)
- Sem cache: rejeitado por performance (queries repetidas)
- TTL maior: rejeitado para permitir updates mais rápidos

### Decision 4: Função getTribunalConfig() assíncrona
**Rationale**: Buscar do banco requer operação assíncrona. Sistema em desenvolvimento permite mudança direta.

**Implementation**:
```typescript
// Antes (hardcoded)
export const getTribunalConfig = (trtCodigo: CodigoTRT, grau: GrauTRT): ConfigTRT => {
  const tribunal = tribunaisConfig.find(t => t.codigo === trtCodigo);
  // ... lógica hardcoded
};

// Depois (database)
export const getTribunalConfig = async (trtCodigo: CodigoTRT, grau: GrauTRT): Promise<ConfigTRT> => {
  return await tribunalConfigService.getConfig(trtCodigo, grau);
};
```

Todos os consumers serão atualizados para usar `await`.

### Decision 5: Estrutura de customTimeouts
**Rationale**: Alguns TRTs são mais lentos que outros. Permitir customização via JSONB.

**Schema**:
```typescript
interface CustomTimeouts {
  login?: number;           // Timeout para login SSO
  redirect?: number;        // Timeout para redirects
  networkIdle?: number;     // Timeout para página estabilizar
  api?: number;             // Timeout para chamadas de API
}
```

**Validation**: Validar estrutura ao ler do banco. Se inválido, usar defaults.

**Alternatives considered**:
- Colunas separadas: rejeitado por flexibilidade (novos timeouts no futuro)
- Sem customização: rejeitado por necessidade real (TRT15 é notoriamente lento)

## Architecture

### Camadas

```
┌─────────────────────────────────────────┐
│  Serviços de Captura                    │
│  (acervo-geral, audiencias, etc)        │
└────────────────┬────────────────────────┘
                 │ getTribunalConfig()
                 ▼
┌─────────────────────────────────────────┐
│  Config Service (config.ts)              │
│  - Cache em memória (5 min TTL)         │
│  - Wrapper para persistence service     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Tribunal Config Persistence Service    │
│  - CRUD operations                      │
│  - Query com JOIN tribunais             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  PostgreSQL (tribunais_config)          │
│  - Configurações persistidas            │
│  - customTimeouts em JSONB              │
└─────────────────────────────────────────┘
```

### Fluxo de Busca

1. Serviço de captura chama `getTribunalConfig('TRT1', 'primeiro_grau')`
2. Config service verifica cache em memória
3. Se cache miss, chama persistence service
4. Persistence service:
   - Query: `SELECT tc.*, t.codigo, t.nome FROM tribunais_config tc JOIN tribunais t ON tc.tribunal_id = t.id WHERE t.codigo = ? AND tc.grau = ?`
   - Valida `customTimeouts` JSONB
   - Retorna objeto ConfigTRT
5. Config service cacheia resultado (5 min)
6. Retorna para serviço de captura

## Risks / Trade-offs

### Risk 1: Configurações incorretas no banco
**Impact**: Capturas falham para tribunais específicos
**Mitigation**:
- Migration popula tabela com dados validados atuais
- Schema validation no TypeScript antes de usar
- Logs detalhados de erro indicando tribunal/grau

### Risk 2: Performance degradation
**Impact**: Queries adicionais ao banco podem aumentar latência
**Mitigation**:
- Cache em memória com TTL de 5 min
- Queries são simples (index em `tribunal_id` e `grau`)
- Configurações raramente mudam (poucas cache misses)

### Risk 3: Consumers não atualizados
**Impact**: TypeScript vai mostrar erro em chamadas sem `await`
**Mitigation**:
- TypeScript detecta todas as chamadas que precisam de await
- Atualizar todos os consumers na mesma implementação

### Risk 4: Cache stale durante updates
**Impact**: Updates de config levam até 5 min para propagar
**Mitigation**:
- TTL de 5 min é aceitável (configs mudam raramente)
- Função `clearConfigCache()` para invalidação manual
- Restart da aplicação limpa cache se necessário

## Migration Plan

### Phase 1: Database Migration
1. Criar migration SQL que:
   - Renomeia tabela e colunas para snake_case
   - Adiciona comentários descritivos
   - Converte grau '1g'/'2g' para enum 'primeiro_grau'/'segundo_grau'
   - Valida que todos os 48 registros (24 TRTs × 2 graus) existem
2. Aplicar migration

### Phase 2: Code Implementation
1. Criar `backend/captura/services/persistence/tribunal-config-persistence.service.ts`
2. Refatorar `config.ts`:
   - Remover array hardcoded
   - Adicionar cache em memória
   - Implementar `getTribunalConfig()` assíncrona
3. Atualizar todos os consumers para usar `await`
4. Adicionar testes unitários e de integração

### Phase 3: Testing
1. Testes unitários: mock do banco, validar cache
2. Testes de integração: captura real com configs do banco
3. Smoke tests locais: rodar capturas para 3-4 TRTs diferentes
4. Validar logs: nenhum erro de config

## Open Questions

1. **Q**: Devemos criar endpoint administrativo para editar configs agora?
   **A**: Não. Por enquanto, configs são editadas via SQL direto. Interface administrativa pode ser próximo change.

2. **Q**: Como lidar com novos TRTs no futuro (TRT25+)?
   **A**: Adicionar via INSERT manual no banco. Futura interface administrativa simplificará isso.

3. **Q**: Cache deve ser compartilhado entre instâncias da aplicação?
   **A**: Não por enquanto. Com 5 min TTL e configs que raramente mudam, cache local é suficiente. Se escalarmos horizontalmente, podemos adicionar Redis depois.

4. **Q**: Timeouts de autenticação (`trt-auth.service.ts`) devem vir do banco também?
   **A**: Não neste change. Timeouts de auth são mais complexos (múltiplos pontos) e podem ser refatorados separadamente no futuro.
