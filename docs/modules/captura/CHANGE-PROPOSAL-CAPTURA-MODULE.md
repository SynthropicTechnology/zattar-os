# Change Proposal: Modulo de Captura - Refatoracao Completa

**Data:** 2026-03-06
**Autor:** Auditoria automatizada (10 agentes)
**Escopo:** Eficiencia, logs, codigo morto, fallbacks, consistencia
**Restricao:** NAO alterar seletores de pagina/DOM (validados e funcionando)

---

## Sumario Executivo

Auditoria completa do modulo de captura (`src/features/captura/`) identificou **39 problemas categorizados** em **~35 arquivos**. Os mais criticos: timeline sobrescrita sem merge (ja corrigido), zero retry em toda a camada de scraping, logs detalhados nunca persistidos, resource leak no browser, e undefined propagado silenciosamente na persistencia.

---

## Tabela de Prioridades

| Prio | Qtd | Descricao |
|------|-----|-----------|
| P0   | 7   | Bugs que causam perda de dados ou crash + seguranca |
| P1   | 10  | Eficiencia critica e resource leaks |
| P2   | 16  | Logs, observabilidade, codigo morto |
| P3   | 12  | Code quality, DRY, naming |

---

## P0 - CRITICO (Bugs / Perda de Dados)

### P0-1: Timeline sobrescrita sem merge incremental
- **Status:** JA CORRIGIDO nesta sessao
- **Arquivos:** `timeline-capture.service.ts`, `timeline-merge.service.ts` (novo)
- **O que foi feito:** Implementado `carregarBackblazeExistente()` que consulta timeline_jsonb existente antes de re-baixar documentos. Documentos com backblaze no banco sao reaproveitados.

### P0-2: File naming com data cria duplicatas no Backblaze
- **Status:** JA CORRIGIDO nesta sessao
- **Arquivo:** `lib/storage/file-naming.utils.ts:34`
- **O que foi feito:** `gerarNomeDocumentoTimeline` mudou de `doc_{id}_{YYYYMMDD}.pdf` para `doc_{id}.pdf` (nome estavel).
- **Pendente:** Aplicar mesmo padrao para `gerarNomeDocumentoPendente` (linha 46), `gerarNomeDocumentoAudiencia` (linha 61), `gerarNomeDocumentoExpediente` (linha 74) - todos ainda usam data no nome.

### P0-3: idAcervo undefined usado sem check na persistencia de partes
- **Arquivo:** `captura-combinada.service.ts:690`
- **Problema:** `mapeamentoIds.get(processoId)` retorna `undefined` se processo nao esta no mapa. O valor e passado diretamente para `persistirPartesProcesso()` sem validacao.
- **Impacto:** Partes podem ser salvas com acervo_id=null, criando registros orfaos.
- **Fix:**
```typescript
const idAcervo = mapeamentoIds.get(processoId);
if (!idAcervo) {
  console.warn(`[capturaCombinada] Processo ${processoId} sem acervo_id, pulando partes`);
  continue;
}
```

### P0-4: numero=0 silencioso para processos fallback
- **Arquivo:** `captura-combinada.service.ts:598`
- **Problema:** `parseInt(numeroProcesso.split("-")[0] ?? "", 10) || 0` gera numero=0 se parsing falhar, criando processos impossíveis de encontrar.
- **Fix:** Logar warning e usar valor original como string, ou pular o processo.

### P0-5: Casts inseguros sem validacao de tipo
- **Arquivo:** `captura-combinada.service.ts:793,823`
- **Problema:** `todosExpedientes as ProcessoPendente[]` e `todasPericias as Pericia[]` sem validacao. Se upstream retornar shape diferente, causa crash em runtime.
- **Fix:** Adicionar type guard basico antes do cast, ou tipar corretamente desde a origem.

### P0-6: Dados sensiveis expostos em logs (CPF, OTP, JWT)
- **Arquivo:** `trt-auth.service.ts`
- **Problema critico de seguranca:**
  1. **Linha 533:** CPF completo logado: `log('info', 'CPF do JWT: ${payload.cpf}')`
  2. **Linha 189:** OTP logado em texto claro: `log('success', 'OTP obtido: ${currentOtp}')`
  3. **Linhas 442-444:** Primeiros 30 chars do JWT access_token logados
- **Impacto:** Qualquer pessoa com acesso a logs (CloudWatch, console, backups) ve dados sensiveis. CPF e dado protegido por LGPD.
- **Fix imediato:**
```typescript
// CPF: mascarar
const maskedCpf = payload.cpf.slice(-4).padStart(11, '*');
log('debug', `CPF carregado: ***${maskedCpf}`);

// OTP: nao logar valor
log('success', 'OTP obtido e preenchido');

// JWT: apenas confirmar presenca
log('success', 'Tokens capturados', {
  accessToken: 'presente',
  xsrfToken: xsrfTokenCookie ? 'presente' : 'ausente',
});
```

### P0-7: Scheduler sem protecao contra execucao duplicada
- **Arquivo:** `agendamento-scheduler.service.ts:10-40`
- **Problema:** Se cron dispara a cada 1 minuto e uma captura demora 2+ minutos, o mesmo agendamento sera executado 2x em paralelo. `buscarAgendamentosParaExecutar()` nao usa lock.
- **Impacto:** Dados duplicados no banco, uploads duplicados no Backblaze, desperdicio de recursos.
- **Fix:** Usar `FOR UPDATE SKIP LOCKED` no SQL de busca de agendamentos:
```sql
SELECT * FROM agendamentos
WHERE proxima_execucao <= NOW() AND ativo = true
FOR UPDATE SKIP LOCKED
LIMIT 1;
```
Ou implementar flag `em_execucao` no registro do agendamento com timestamp.

---

## P1 - ALTO (Eficiencia / Resource Leaks)

### P1-1: Zero retry em toda a camada de scraping
- **Arquivo:** `pje-trt/shared/fetch.ts:186-189`
- **Problema:** `fetchPJEAPI` faz throw imediato em qualquer HTTP error. Nenhum retry, nenhum backoff. Um erro 503 transitorio mata toda a operacao.
- **Impacto:** Em escala (100+ processos), qualquer instabilidade da rede causa falha completa.
- **Fix:** Adicionar retry com exponential backoff no `fetchPJEAPI`:
```typescript
async function fetchPJEAPI<T>(page, path, params, options?) {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // ... fetch existente ...
      if (!response.ok) {
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return data;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      // retry on network errors
    }
  }
}
```
- **NAO retry em:** 401, 403, 404 (erros permanentes)

### P1-2: Resource leak - browser nao fechado em erro de auth
- **Arquivo:** `trt-auth.service.ts:591-639`
- **Problema:** `autenticarPJE` adquire browser via `getFirefoxConnection` mas nao tem try/finally. Se login/OTP falhar, browser fica aberto.
- **Fix:** Wrap em try/finally:
```typescript
export async function autenticarPJE(params) {
  const conn = await getFirefoxConnection(params);
  try {
    // ... logica de auth ...
    return { page, browser: conn.browser, ... };
  } catch (error) {
    await conn.browser?.close();
    throw error;
  }
}
```

### P1-3: Fetches sequenciais + delay duplicado por processo
- **Arquivo:** `dados-complementares.service.ts:189-247`
- **Problema duplo:**
  1. Timeline e partes sao buscados sequencialmente para cada processo.
  2. Ha 2 delays de 300ms por processo (um apos timeline, outro apos partes) = 600ms de espera quando 300ms bastaria.
- **Impacto:** 100 processos x 600ms = ~60s so de delays. Com fix, cai para ~30s.
- **Fix:** Buscar timeline + partes em paralelo E consolidar em um unico delay ao final:
```typescript
const [timeline, partes] = await Promise.all([
  obterTimeline(page, processoId, opcoes),
  buscarPartes ? obterPartesProcesso(page, processoId) : Promise.resolve(null),
]);
// UM UNICO delay apos ambas as chamadas
await delay(delayEntreRequisicoes);
```
- **Reducao estimada:** ~50-66% do tempo de dados complementares.

### P1-4: Acervo persistence failures silenciadas com mapeamentoIds incompleto
- **Arquivo:** `captura-combinada.service.ts:535,555,631`
- **Problema:** Erros em `salvarAcervoBatch()` sao logados mas engolidos. O `mapeamentoIds` fica incompleto, causando falhas cascata em timeline/partes/audiencias.
- **Fix:** Se salvarAcervoBatch falha, marcar processos como "nao persistidos" e pular nas fases seguintes, em vez de tentar com IDs faltantes.

### P1-5: Scheduler sem circuit breaker
- **Arquivo:** `agendamento-scheduler.service.ts:10-41`
- **Problema:** Se PJE estiver fora do ar, scheduler continua tentando a cada minuto indefinidamente.
- **Fix:** Implementar circuit breaker simples: apos N falhas consecutivas, aumentar intervalo exponencialmente (1min -> 5min -> 15min -> 30min). Reset apos sucesso.

### P1-6: N+1 query em pendentes-manifestacao
- **Arquivo:** `pendentes/persistencia/salvar-pendentes.service.ts` (linhas ~294-306 conforme auditoria anterior)
- **Problema:** Para cada pendente, faz query individual ao banco para verificar existencia. Com 50+ pendentes, sao 50+ queries.
- **Fix:** Buscar todos os pendentes existentes em batch (WHERE id_pje IN (...)) e comparar em memoria.

### P1-7: Logs detalhados (capture-log.service) nunca persistidos
- **Arquivo:** `persistence/capture-log.service.ts:49,176-191`
- **Problema:** `captureLogService` acumula logs detalhados (inserido/atualizado/nao-atualizado/erro) em memoria, mas apenas imprime no console via `imprimirResumo()`. Dados perdidos apos execucao.
- **Fix:** Persistir no campo `resultado` do `capturas_log` (ja existe a coluna JSONB). Ou criar tabela `captura_log_detalhes`.

### P1-8: Resposta vazia da API nao validada
- **Arquivo:** `pje-trt/shared/fetch.ts:192-193`
- **Problema:** Se API retorna HTTP 200 mas corpo vazio/nulo, `response.json()` pode retornar null que propaga silenciosamente. Callers assumem resposta valida.
- **Fix:** Adicionar check apos parse:
```typescript
const result = await response.json();
if (result === null || result === undefined) {
  throw new Error(`HTTP ${response.status}: Empty response body for ${path}`);
}
return result;
```

### P1-9: Sem retry no nivel de autenticarPJE
- **Arquivo:** `trt-auth.service.ts:591-639`
- **Problema:** Se autenticacao falha (erro OTP, timeout SSO), nao ha retry no nivel superior. Captura inteira falha. Retry existe apenas para o clique SSO (linhas 355-387), nao para o fluxo completo.
- **Fix:** Wrapper com retry + backoff exponencial:
```typescript
async function autenticarComRetry(options, maxAttempts = 2) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await autenticarPJE(options);
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await delay(5000 * (i + 1));
    }
  }
}
```

### P1-10: origin re-fetched a cada request
- **Arquivo:** `pje-trt/shared/fetch.ts:150`
- **Problema:** `page.evaluate(() => window.location.origin)` e chamado em CADA request. O origin nunca muda durante uma sessao.
- **Fix:** Cachear origin na primeira chamada:
```typescript
let cachedOrigin: string | null = null;
// dentro de fetchPJEAPI:
if (!cachedOrigin) cachedOrigin = await page.evaluate(() => window.location.origin);
```

---

## P2 - MEDIO (Logs / Observabilidade / Codigo Morto)

### P2-1: 3 servicos de log redundantes
- **Arquivos:**
  - `captura-log.service.ts` (wrapper sem valor agregado)
  - `persistence/captura-log-persistence.service.ts` (CRUD no banco)
  - `persistence/capture-log.service.ts` (in-memory, nao persiste)
- **Fix:** Eliminar `captura-log.service.ts` (re-export puro). Unificar capture-log.service dentro de captura-log-persistence, salvando detalhes no campo `resultado` JSONB.

### P2-2: logId ?? -1 cria logs orfaos
- **Arquivo:** `executar-agendamento.service.ts:160,187,222,260,314,357,384,426`
- **Problema:** Se criacao do logId falha, usa `-1` como fallback. Raw logs com `captura_log_id: -1` ficam orfaos e inrastreáveis.
- **Fix:** Se logId falha, fazer early return ou criar um log de emergencia com status "log_creation_failed".

### P2-3: Erros coletados como string nao-parseavel
- **Arquivo:** `executar-agendamento.service.ts:547`
- **Problema:** `errosColetados.join('; ')` junta todos os erros em uma string. Impossivel parsear programaticamente.
- **Fix:** Salvar como array JSON no campo `resultado` do log.

### P2-4: Recovery service e read-only (sem re-processamento)
- **Arquivos:** `recovery/captura-recovery.service.ts`, `recovery/recovery-analysis.service.ts`
- **Problema:** Tipos `ReprocessarParams` e `ReprocessarResult` definidos mas nao implementados. Recovery apenas analisa gaps, nao corrige.
- **Fix:** Implementar funcao de re-persistencia que leia raw log e re-execute a persistencia. Prioridade media pois e feature nova, nao bug.

### P2-5: Parametro morto atas: {} em salvarAudiencias
- **Arquivo:** `captura-combinada.service.ts:766`
- **Problema:** `atas: {}` sempre vazio, nunca populado. Comentario diz "seriam processadas em captura especifica".
- **Fix:** Remover parametro se nao ha plano de implementar. Se houver, documentar o plano.

### P2-6: XSRF token stub nunca implementado
- **Arquivo:** `pje-trt/shared/fetch.ts:174-177,197`
- **Problema:** `xsrfToken: undefined` com TODO. Header condicional nunca executa (dead code path).
- **Fix:** Remover o stub. Se PJE adicionar CSRF no futuro, implementar de verdade.

### P2-7: File naming com data em pendentes/audiencias/expedientes
- **Arquivo:** `lib/storage/file-naming.utils.ts:46-79`
- **Problema:** `gerarNomeDocumentoPendente`, `gerarNomeDocumentoAudiencia`, `gerarNomeDocumentoExpediente` usam `{YYYYMMDD}` no nome, criando duplicatas se re-capturados em dias diferentes.
- **Fix:** Remover data do nome, seguindo padrao ja aplicado em timeline (`doc_{id}.pdf`). Usar: `exp_{pendenteId}_doc_{docId}.pdf`, `ata_{audienciaId}.pdf`, `exp_{expedienteId}_doc_{docId}.pdf`.

### P2-8: Validacao de tribunal code tardia
- **Arquivo:** `captura-combinada.service.ts:705-709`
- **Problema:** Verifica `!params.config.codigo` so na fase 5 (partes). Se ausente, pula silenciosamente a persistencia de partes.
- **Fix:** Validar na fase 1 (antes da autenticacao). Fail fast.

### P2-9: types.ts re-export sem valor
- **Arquivo:** `services/trt/types.ts:1-4`
- **Problema:** Apenas re-exporta de `../../types/trt-types`. Cria confusao sobre onde os tipos vivem.
- **Fix:** Remover arquivo. Importar diretamente de `types/trt-types` nos consumers.

### P2-10: Naming confuso da pasta expedientes
- **Arquivo:** `pje-trt/expedientes/`
- **Problema:** Pasta chama "expedientes" mas funcoes chamam `obterProcessosPendentesManifestacao`, docs dizem "pendentes de manifestacao", constante e `PENDENTES_MANIFESTACAO`. Nao e bug, mas confunde.
- **Fix:** Renomear funcoes exportadas para `obterExpedientes*` ou adicionar comentario explicativo no index.ts.

### P2-11: Console logs expostos em producao
- **Problema:** Todo o modulo usa `console.log/warn/error` diretamente. Em producao, gera ruido nos logs do servidor.
- **Fix:** Substituir por logger estruturado (ex: `pino` ou wrapper customizado) com niveis (debug/info/warn/error) e contexto automatico (timestamp, operacao, processoId).

### P2-12: Sem validacao de env vars no startup do browser
- **Arquivo:** `browser-connection.service.ts:59-68`
- **Problema:** `BROWSER_WS_ENDPOINT` e `BROWSER_SERVICE_TOKEN` nao validados (formato, non-empty).
- **Fix:** Validar no startup, nao no primeiro uso.

### P2-13: Funcao `salvarAcervo()` deprecated ainda presente
- **Arquivo:** `persistence/acervo-persistence.service.ts:115-304`
- **Problema:** Funcao sequencial `salvarAcervo()` (~190 linhas) coexiste com `salvarAcervoBatch()` que faz o mesmo de forma mais eficiente. Ninguem deveria usar a versao sequencial.
- **Fix:** Remover `salvarAcervo()` inteira, manter apenas `salvarAcervoBatch()`.

### P2-14: Funcoes mortas exportadas em dados-complementares
- **Arquivo:** `dados-complementares.service.ts:268-287`
- **Problema:** `extrairProcessosUnicos()` e `filtrarDocumentos()` sao exportadas mas nunca importadas em nenhum lugar do projeto.
- **Fix:** Remover ambas as funcoes.

### P2-15: Validacao de permissao de credenciais incompleta (TODO)
- **Arquivo:** `credential.service.ts:74`
- **Problema:** Comentario TODO indica que validacao de permissao por userId nao foi implementada. Qualquer usuario pode buscar qualquer credencial.
- **Fix:** Implementar check de permissao ou remover o TODO se nao for necessario.

### P2-16: Logica duplicada de parsing OAB/telefones/emails
- **Arquivo:** `pje-trt/partes/obter-partes.ts:143-165` e `pje-trt/partes/obter-representantes.ts:134-155`
- **Problema:** Funcoes `extrairOabEUf()`, `extrairEmails()`, `extrairTelefones()` duplicadas nos dois arquivos.
- **Fix:** Extrair para `pje-trt/partes/parsers.ts` e importar em ambos.

---

## P3 - BAIXO (Code Quality / DRY)

### P3-1: idAdvogado parseado 3x no mesmo arquivo
- **Arquivo:** `captura-combinada.service.ts:365,516,725`
- **Problema:** `parseInt(advogadoInfo.idAdvogado, 10)` repetido 3 vezes.
- **Fix:** Parsear uma vez no inicio da fase 5 e reusar.

### P3-2: Loop duplicado para encontrar numeroProcesso
- **Arquivo:** `captura-combinada.service.ts:694-702` e `854-862`
- **Problema:** Mesmo loop copy-paste para encontrar numeroProcesso por processoId.
- **Fix:** Extrair helper `findNumeroProcesso(processoId, capturas)`.

### P3-3: Array.isArray check repetido 4x em buscar-processos-painel
- **Arquivo:** `buscar-processos-painel.service.ts:53,80,106,127`
- **Fix:** Extrair `normalizeResult(response)` helper.

### P3-4: Health check URL construction fragil
- **Arquivo:** `browser-connection.service.ts:241-243`
- **Problema:** Regex replace de ws:// para http:// nao lida corretamente com wss:// com porta.
- **Fix:** Usar `new URL()` para parsing correto.

### P3-5: usuario vs cpf confusao em credentials
- **Arquivo:** `credential.service.ts:89-90`
- **Problema:** `(credencial as { usuario?: string | null }).usuario || advogado.cpf` - naming inconsistente.
- **Fix:** Documentar qual campo cada tribunal usa, ou unificar em tipo `CredentialLogin`.

### P3-6: .single() seguido de Array.isArray check
- **Arquivo:** `credential.service.ts:79-82,169-171,246,320,392`
- **Problema:** Supabase `.single()` sempre retorna objeto, nunca array. Check e desnecessario.
- **Fix:** Remover checks redundantes.

### P3-7: Paginas armazenadas mas nunca acessadas
- **Arquivo:** `captura-combinada.service.ts:291,315,341`
- **Problema:** `paginasDesignadas`, `paginasRealizadas`, `paginasCanceladas` guardados no resultado mas nunca usados downstream.
- **Fix:** Remover do resultado se ninguem consome.

### P3-8: Cache TTL hardcoded para config de tribunais
- **Arquivo:** `services/trt/config.ts:33`
- **Problema:** `CACHE_TTL_MS = 5 * 60 * 1000` hardcoded.
- **Fix:** Mover para env var com fallback para 5 min.

### P3-9: obterRepresentantesPartePorID() potencialmente morta
- **Arquivo:** `pje-trt/partes/obter-representantes.ts`
- **Problema:** Representantes ja vem no JSON de partes (obter-partes.ts:139). A funcao separada pode ser codigo morto se nunca chamada diretamente.
- **Fix:** Verificar imports. Se nao usada, remover.

### P3-10: Timeouts magicos sem constantes em trt-auth
- **Arquivo:** `trt-auth.service.ts` (linhas 97, 275, 284)
- **Problema:** Timeouts de 30s, 60s, 120s espalhados como numeros magicos.
- **Fix:** Extrair constantes nomeadas: `TIMEOUT_PAGE_LOAD`, `TIMEOUT_SSO_EXIT`, `OTP_CHECK_INTERVAL`.

### P3-11: ~150 linhas de paginacao duplicada em 5 modulos
- **Arquivos:** `acervo-geral/obter-todos-processos.ts`, `arquivados/obter-todos-processos.ts`, `expedientes/obter-todos-processos.ts`, `audiencias/obter-todas.ts`, `pericias/obter-pericias.ts`
- **Problema:** Todos implementam o mesmo loop: buscar pagina 1, calcular qtdPaginas, loop p=2..N com delay. ~30 linhas identicas em cada.
- **Fix:** Extrair para `shared/pagination.ts`:
```typescript
export async function obterTodosPaginado<T>(
  buscarPagina: (pagina: number) => Promise<PagedResponse<T>>,
  options?: { delayEntrePaginas?: number }
): Promise<T[]>
```

### P3-12: Logs de progresso com gaps de 9 processos
- **Arquivo:** `captura-combinada.service.ts:474-478`
- **Problema:** Progress callback so dispara a cada 10 processos. Se um processo travar, nenhum log aparece por longos periodos.
- **Fix:** Logar a cada processo ou reduzir intervalo para 5, com contexto (processoId, erros ate agora).

---

## Ordem de Implementacao Recomendada

### Fase 1: Fixes criticos (P0) - ~3-4h
1. ~~P0-6: Mascarar CPF/OTP/JWT nos logs (SEGURANCA - PRIMEIRO)~~ ✅
2. ~~P0-7: Lock no scheduler contra execucao duplicada~~ ✅
3. ~~P0-3: Check idAcervo antes de persistir partes~~ ✅
4. ~~P0-4: Tratar numero=0 em processos fallback~~ ✅
5. ~~P0-5: Adicionar type guards para casts inseguros~~ ✅

### Fase 2: Eficiencia core (P1) - ~5-7h
5. ~~P1-1: Retry com backoff em fetchPJEAPI~~ ✅
6. ~~P1-2: try/finally em autenticarPJE~~ ✅
7. ~~P1-9: Retry no nivel de autenticarPJE (wrapper)~~ ✅
8. ~~P1-3: Promise.all para timeline+partes + consolidar delay~~ ✅
9. ~~P1-6: Batch query em pendentes (N+1)~~ ✅
10. ~~P1-8: Validacao de resposta vazia~~ ✅
11. ~~P1-10: Cache de origin~~ ✅

### Fase 3: Logs e observabilidade (P1+P2) - ~3-4h
9. ~~P1-7: Persistir capture-log detalhado~~ ✅
10. P2-1: Unificar servicos de log (DIFERIDO - refactor maior)
11. ~~P2-2: Tratar logId=-1~~ ✅
12. ~~P2-3: Erros como JSON array~~ ✅
13. P2-11: Logger estruturado (DIFERIDO - refactor maior)

### Fase 4: Limpeza (P2+P3) - ~3-4h
14. P0-2 pendente: File naming sem data para pendentes/audiencias/expedientes
15. P2-5: Remover atas: {}
16. P2-6: Remover XSRF stub
17. P2-9: Remover types.ts re-export
18. P2-13: Remover salvarAcervo() deprecated
19. P2-14: Remover funcoes mortas em dados-complementares
20. P2-15: Extrair parsers duplicados de partes
21. P3-1 a P3-10: Refatoracoes menores

### Fase 5: Features novas (P1+P2) - ~4-6h
19. P1-4: Tracking de processos nao-persistidos
20. P1-5: Circuit breaker no scheduler
21. P2-4: Implementar re-processamento no recovery

---

## Arquivos Afetados (por fase)

### Fase 1
- `src/features/captura/services/captura-combinada.service.ts`
- `src/features/captura/services/trt/trt-auth.service.ts` (mascarar dados sensiveis)
- `src/features/captura/services/scheduler/agendamento-scheduler.service.ts` (lock anti-duplicata)

### Fase 2
- `src/features/captura/pje-trt/shared/fetch.ts`
- `src/features/captura/services/trt/trt-auth.service.ts`
- `src/features/captura/services/dados-complementares.service.ts`
- `src/features/captura/services/pendentes/persistencia/salvar-pendentes.service.ts`

### Fase 3
- `src/features/captura/services/captura-log.service.ts` (remover)
- `src/features/captura/services/persistence/capture-log.service.ts`
- `src/features/captura/services/persistence/captura-log-persistence.service.ts`
- `src/features/captura/services/scheduler/executar-agendamento.service.ts`

### Fase 4
- `src/lib/storage/file-naming.utils.ts`
- `src/features/captura/services/trt/types.ts` (remover)
- `src/features/captura/services/storage/upload-documento-timeline.service.ts`
- `src/features/captura/services/browser/browser-connection.service.ts`
- `src/features/captura/credentials/credential.service.ts`
- `src/features/captura/services/buscar-processos-painel.service.ts`
- `src/features/captura/services/persistence/acervo-persistence.service.ts` (remover salvarAcervo)
- `src/features/captura/services/trt/dados-complementares.service.ts` (remover funcoes mortas)
- `src/features/captura/pje-trt/partes/parsers.ts` (novo - extrair parsers)
- `src/features/captura/pje-trt/partes/obter-partes.ts`
- `src/features/captura/pje-trt/partes/obter-representantes.ts`

### Fase 5
- `src/features/captura/services/scheduler/agendamento-scheduler.service.ts`
- `src/features/captura/services/recovery/captura-recovery.service.ts`
- `src/features/captura/services/recovery/recovery-analysis.service.ts`

---

## O que NAO alterar

- **Seletores de pagina/DOM:** Todos os `page.click()`, `page.fill()`, `page.waitForSelector()`, `page.evaluate()` que interagem com elementos HTML do PJE estao validados e funcionando. NAO modificar.
- **Endpoints PJE:** Os paths das APIs (`/pje-comum-api/api/...`) estao corretos. NAO alterar.
- **Fluxo OTP/SSO:** A logica de autenticacao OTP em `processOTP` funciona. NAO refatorar o fluxo, apenas adicionar cleanup no caller.
- **Logica de partes/representantes:** O parsing de polos, representantes e OAB em `obter-partes.ts` e `obter-representantes.ts` esta correto e bem implementado.

---

## Metricas de Sucesso

Apos implementacao completa:
1. **Zero re-downloads** de documentos ja capturados (ja alcancado para timeline)
2. **Retry automatico** em erros transitorios (429, 5xx) - atualmente 0 retries
3. **Logs persistidos** com detalhes de cada item (inserido/atualizado/erro) - atualmente perdidos
4. **Zero undefined propagados** na persistencia (idAcervo, numero, tipos)
5. **~50% reducao** no tempo de dados complementares (parallel fetch)
6. **Circuit breaker** evita martelar PJE quando fora do ar
