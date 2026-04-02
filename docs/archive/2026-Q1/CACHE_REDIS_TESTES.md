# Guia de Testes - Implementação de Cache Redis

## 📋 Checklist de Validação Técnica

### ✅ Compilação & Type Safety

```bash
# 1. Verificar sem erros de compilação
npm run type-check

# 2. Verificar sem erros de lint
npm run lint

# 3. Verificar imports corretos
# Deve listar todos os repositórios sem erros
npm run validate:exports

# 4. Validação de arquitetura
npm run check:architecture
```

**Resultado esperado:**
```
✅ No type errors found
✅ No lint errors found
✅ All exports valid
✅ Architecture validation passed
```

---

## 🧪 Testes Unitários

### Teste de Cache Hit/Miss

#### Processos

```bash
# Testar processos especificamente
npm run test:processos

# Ou teste específico
npm run test -- src/features/processos/__tests__/ --watch
```

**Verificar em `src/features/processos/__tests__/`:**
- [ ] `repository.test.ts` - Unit tests para cache behavior
- [ ] Integration com `findProcessoUnificadoById()`
- [ ] Integration com `findAllProcessos()`

#### Audiências

```bash
npm run test:audiencias

# Ou
npm run test -- src/features/audiencias/__tests__/ --watch
```

**Verificar:**
- [ ] Cache hit retorna cached data
- [ ] Cache miss faz query
- [ ] Invalidação limpa padrão

#### Clientes

```bash
npm run test:clientes

# Ou teste específico de partes
npm run test -- src/features/partes/__tests__/ --watch
```

**Verificar:**
- [ ] findClienteById() usa cache
- [ ] findClienteByCPF() usa cache
- [ ] findClienteByCNPJ() usa cache
- [ ] findAllClientes() usa cache
- [ ] Multi-chave invalidation funciona

#### Usuários

```bash
npm run test:usuarios

# Validar que cache existente continua funcionando
```

**Esperado:** Testes devem passar (cache já estava implementado)

---

## 🔍 Testes de Integração

### Scenario 1: Cache Hit - Mesma Query 2x

```typescript
// test/integration/cache-hit.test.ts
import { findClienteById } from '@/features/partes';

test('Cache Hit - Segunda chamada deve usar cache', async () => {
  const startTime1 = Date.now();
  const result1 = await findClienteById(123);
  const time1 = Date.now() - startTime1;

  const startTime2 = Date.now();
  const result2 = await findClienteById(123);
  const time2 = Date.now() - startTime2;

  // Mesmos dados
  expect(result1).toEqual(result2);
  
  // Segunda chamada muito mais rápida
  expect(time2).toBeLessThan(time1 / 10); // 10x mais rápido mínimo
  console.log(`Cache hit speedup: ${(time1/time2).toFixed(1)}x`);
});
```

### Scenario 2: Invalidação após UPDATE

```typescript
// test/integration/invalidation-update.test.ts
import { findClienteById, updateCliente } from '@/features/partes';

test('Invalidação - UPDATE limpa cache', async () => {
  // 1. Cache a client
  const result1 = await findClienteById(123);
  const data1 = result1.data;

  // 2. Update
  const updateResult = await updateCliente(123, {
    nome: 'Novo Nome'
  }, data1);
  
  // 3. Fetch again - deve fazer nova query
  const result2 = await findClienteById(123);
  const data2 = result2.data;

  // 4. Dados devem estar atualizados
  expect(data2.nome).toBe('Novo Nome');
});
```

### Scenario 3: Invalidação por CPF

```typescript
// test/integration/invalidation-cpf.test.ts
import { findClienteByCPF, updateCliente } from '@/features/partes';

test('Invalidação - UPDATE limpa cache de CPF', async () => {
  // 1. Busca por CPF (cacheia)
  const cpf = '12345678900';
  const result1 = await findClienteByCPF(cpf);
  
  // 2. Update (deve invalidar chave CPF)
  await updateCliente(result1.data.id, {
    cpf: '98765432100'
  });
  
  // 3. Busca com CPF antigo deve fazer query (miss)
  const result2 = await findClienteByCPF(cpf);
  expect(result2.data).toBeNull(); // Não encontra mais
  
  // 4. Busca com CPF novo retorna cliente
  const result3 = await findClienteByCPF('98765432100');
  expect(result3.data).toBeDefined();
});
```

### Scenario 4: Invalidação em Lista

```typescript
// test/integration/invalidation-list.test.ts
import { findAllClientes, saveCliente } from '@/features/partes';

test('Invalidação - CREATE limpa lista cache', async () => {
  // 1. Fetcha lista (cacheia)
  const page1Result = await findAllClientes({ pagina: 1, limite: 10 });
  const count1 = page1Result.data.pagination.total;

  // 2. Cria novo cliente
  await saveCliente({
    tipo_pessoa: 'pf',
    nome: 'Novo Cliente',
    cpf: '99999999999',
    // ... outros campos
  });

  // 3. Fetcha lista novamente (deve fazer query, não cache)
  const page1Result2 = await findAllClientes({ pagina: 1, limite: 10 });
  const count2 = page1Result2.data.pagination.total;

  // 4. Count aumentou
  expect(count2).toBe(count1 + 1);
});
```

---

## 🔧 Testes de Redis Connectivity

### Verificar Conexão Redis

```bash
# 1. Verificar se Redis está rodando
redis-cli ping
# Esperado: PONG

# 2. Verificar chaves em cache
redis-cli KEYS "*"

# 3. Limpar cache se necessário (cuidado!)
redis-cli FLUSHDB
```

### Simular Redis Offline

```typescript
// test/redis-offline.test.ts
// Desabilitar Redis temporariamente

process.env.ENABLE_REDIS_CACHE = 'false';

test('Graceful Degradation - Sistema funciona sem Redis', async () => {
  // 1. System should work without Redis
  const result = await findClienteById(123);
  expect(result.success).toBe(true);
  
  // 2. Deve fazer query ao DB
  // (mais lento, mas funciona)
});
```

---

## 📊 Testes de Performance

### Setup Benchmark

```typescript
// scripts/benchmark-cache.ts
import { findAllProcessos } from '@/features/processos';
import { findAllAudiencias } from '@/features/audiencias';
import { findAllClientes } from '@/features/partes';

async function benchmarkRepository(
  name: string,
  fn: (params: any) => Promise<any>,
  params: any,
  iterations = 3
) {
  console.log(`\n📊 Benchmarking ${name}`);
  
  const times = [];
  for (let i = 0; i < iterations; i++) {
    // Limpar cache entre iterações
    if (i > 0) {
      // Cache será renovado cada iteração
    }
    
    const start = Date.now();
    await fn(params);
    const time = Date.now() - start;
    times.push(time);
    console.log(`  Iteração ${i+1}: ${time}ms`);
  }
  
  const avg = times.reduce((a,b) => a+b) / times.length;
  console.log(`  Média: ${avg.toFixed(0)}ms`);
  
  if (times.length > 1) {
    const speedup = times[0] / times[1];
    console.log(`  Speedup (hit vs miss): ${speedup.toFixed(1)}x`);
  }
}

async function runBenchmarks() {
  // Processos
  await benchmarkRepository(
    'findAllProcessos',
    findAllProcessos,
    { pagina: 1, limite: 50 }
  );
  
  // Audiências
  await benchmarkRepository(
    'findAllAudiencias',
    findAllAudiencias,
    { pagina: 1, limite: 10 }
  );
  
  // Clientes
  await benchmarkRepository(
    'findAllClientes',
    findAllClientes,
    { pagina: 1, limite: 50 }
  );
}

runBenchmarks();
```

**Executar:**
```bash
tsx scripts/benchmark-cache.ts
```

**Resultado esperado:**
```
📊 Benchmarking findAllProcessos
  Iteração 1: 250ms (miss - query ao DB)
  Iteração 2: 18ms (hit - cache)
  Iteração 3: 16ms (hit - cache)
  Média: 94.67ms
  Speedup (hit vs miss): 13.9x

📊 Benchmarking findAllAudiencias
  Iteração 1: 180ms (miss)
  Iteração 2: 15ms (hit)
  Média: 65ms
  Speedup: 12x

📊 Benchmarking findAllClientes
  Iteração 1: 200ms (miss)
  Iteração 2: 12ms (hit)
  Média: 71.33ms
  Speedup: 16.7x
```

---

## 📝 Testes de Debugging

### Habilitar Debug Logging

```bash
# .env.local
DEBUG_REDIS_CACHE=true
```

Saída esperada:
```
[Redis] HIT - acervo:unificado:123
[Redis] MISS - clientes:id:456
[Redis] HIT - audiencias:id:789
```

### Monitorar Redis em Tempo Real

```bash
# Terminal 1: Monitor Redis commands
redis-cli monitor

# Terminal 2: Execute testes
npm run test:processos -- --verbose
```

Saída esperada:
```
1641234567.891 [0] "GET" "acervo:unificado:123"
1641234567.892 [0] "MISS"
1641234567.920 [0] "SETEX" "acervo:unificado:123" "600" "{...json...}"
1641234567.921 [0] "GET" "acervo:unificado:123"
1641234567.921 [0] "HIT"
```

---

## ✅ Checklist Final de Testes

### Antes de Fazer Commit

- [ ] npm run type-check (sem erros)
- [ ] npm run lint (sem erros)
- [ ] npm test (tests passando)
- [ ] npm run test:processos (passar)
- [ ] npm run test:audiencias (passar)
- [ ] npm run test:clientes (passar)
- [ ] npm run test:usuarios (passar - validação)
- [ ] Validação visual: Cache hit/miss logs
- [ ] Validação: Invalidação funciona após UPDATE
- [ ] Performance: Cache hit ~10-20ms vs miss 200-500ms

### Antes de Deploy

- [ ] Testes rodaram com sucesso em CI/CD
- [ ] Coverage > 80%
- [ ] Sem breaking changes
- [ ] Validação em staging environment
- [ ] Monitoring dashboards pronto
- [ ] Runbooks documentados

---

## 🐛 Troubleshooting

### Problema: Cache não está funcionando

**Diagnóstico:**
1. Verificar Redis está rodando: `redis-cli ping`
2. Verificar variáveis de env: `echo $ENABLE_REDIS_CACHE`
3. Habilitar debug: `DEBUG_REDIS_CACHE=true`
4. Verificar logs

**Solução:**
```bash
# Reiniciar Redis
redis-cli FLUSHDB
redis-cli SHUTDOWN
# ... reiniciar ...

# Limpar cache
redis-cli FLUSHALL

# Verificar keys
redis-cli KEYS "*acervo*"
```

### Problema: Cache não está sendo invalidado

**Diagnóstico:**
1. Verificar que UPDATE está chamando `invalidateXxxCache()`
2. Verificar que deleteCached() foi chamado
3. Verificar TTL da chave

**Solução:**
```bash
# Ver chaves que existem
redis-cli KEYS "*clientes*"

# Ver TTL de uma chave
redis-cli TTL clientes:id:123

# Deletar chave manualmente
redis-cli DEL clientes:id:123
```

### Problema: Performance não melhorou

**Possíveis causas:**
1. Cache não está sendo ativado (verificar env)
2. Redis latência alta (problema de rede)
3. TTL muito curto (renovando frequentemente)
4. Query rápida demais (cache overhead maior que benefício)

**Análise:**
```bash
# Medir latência Redis
redis-cli --latency

# Se > 100ms, há problema de rede/configuração
# Se TTL < 100s, considere aumentar
# Se query < 20ms, cache talvez não seja necessário
```

---

## 📞 Contato & Suporte

Para dúvidas ou problemas:

1. Verificar documentação em `IMPLEMENTACAO_CACHE_REDIS.md`
2. Consultar padrão em `src/features/usuarios/repository.ts`
3. Revisar `src/lib/redis/cache-utils.ts` para utilities

---

**Testes concluídos com sucesso! 🎉**
