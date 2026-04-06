# Migracacao para Colocation por Rota

**Data:** 2026-04-02
**Status:** Aprovado
**Escopo:** Eliminar `src/features/`, colocar tudo dentro das pastas de rota em `src/app/`

## Objetivo

Migrar de Feature-Sliced Design (FSD) com pasta `features/` separada para um modelo de **colocation total**, onde cada modulo de rota em `app/` contem todos os seus arquivos: domain, service, repository, actions, components, hooks, barrel export.

Modulos sem rota vao para `lib/` (infraestrutura) ou `lib/domain/` (dominio transversal).

## Principios

1. **Sem reescrita de codigo** — apenas `mv` de arquivos + atualizacao de imports
2. **Migracao atomica** — um modulo por vez, com testes entre cada um
3. **Barrel exports mantidos** — `index.ts` continua como ponto de entrada publico
4. **Ciclo por modulo:** mover → atualizar imports → type-check → testes → commit

## Estrutura Final

```
src/
├── app/                          # Modulos colocados (rota + dominio + logica)
│   ├── audiencias/
│   │   ├── page.tsx              # Rota Next.js
│   │   ├── domain.ts             # Schemas Zod, tipos, constantes
│   │   ├── service.ts            # Casos de uso
│   │   ├── repository.ts         # Acesso a dados Supabase
│   │   ├── actions/              # Server Actions
│   │   ├── components/           # Componentes React
│   │   ├── hooks/                # Hooks do modulo
│   │   ├── index.ts              # Barrel export
│   │   └── RULES.md              # Regras de negocio
│   ├── processos/                # Idem
│   ├── partes/                   # Idem
│   ├── api/                      # API routes (nao muda)
│   ├── portal/                   # Portal (nao muda)
│   └── ...
│
├── lib/
│   ├── supabase/                 # Infraestrutura existente (nao muda)
│   ├── redis/                    # (nao muda)
│   ├── ai/                       # <- features/ai
│   ├── busca/                    # <- features/busca
│   ├── chatwoot/                 # <- features/chatwoot
│   ├── dify/                     # <- features/dify
│   ├── integracoes/              # <- features/integracoes
│   ├── system-prompts/           # <- features/system-prompts
│   ├── twofauth/                 # <- features/twofauth
│   └── domain/                   # Dominio transversal sem rota
│       ├── tags/                 # <- features/tags
│       ├── audit/                # <- features/audit
│       ├── profiles/             # <- features/profiles
│       ├── config-atribuicao/    # <- features/config-atribuicao
│       └── tasks/                # <- features/tasks
│
├── components/                   # Componentes compartilhados (nao muda)
├── hooks/                        # Hooks globais (nao muda)
├── types/                        # Tipos compartilhados (nao muda)
├── providers/                    # (nao muda)
├── contexts/                     # (nao muda)
└── middleware/                   # (nao muda)
```

## Classificacao dos 42 Modulos

### Onda 1 — Infraestrutura → `lib/`

| Feature | Destino | Razao |
|---------|---------|-------|
| ai | lib/ai/ | Wrappers OpenAI, embeddings, RAG |
| busca | lib/busca/ | Busca semantica |
| chatwoot | lib/chatwoot/ | Integracao chat externo |
| dify | lib/dify/ | Integracao plataforma AI |
| integracoes | lib/integracoes/ | Conexoes externas |
| system-prompts | lib/system-prompts/ | Config prompts AI |
| twofauth | lib/twofauth/ | Integracao 2FA |

**Import update:** `@/features/{mod}` → `@/lib/{mod}`

### Onda 2 — Dominio transversal → `lib/domain/`

| Feature | Destino | Razao |
|---------|---------|-------|
| tags | lib/domain/tags/ | Sistema tagging cross-cutting |
| audit | lib/domain/audit/ | Logs de auditoria |
| profiles | lib/domain/profiles/ | Perfis do sistema |
| config-atribuicao | lib/domain/config-atribuicao/ | Regras atribuicao |
| tasks | lib/domain/tasks/ | Tarefas cross-cutting |

**Import update:** `@/features/{mod}` → `@/lib/domain/{mod}`

### Onda 3 — Features com rota → merge em `app/{rota}/`

| Feature | Rota app/app/ | Operacao |
|---------|---------------|----------|
| acervo | (criar) | mv direto |
| advogados | (criar) | mv direto |
| agenda-eventos | agenda/ | merge |
| assistentes-tipos | assistentes/ | merge |
| audiencias | audiencias/ | merge |
| calculadoras | (criar) | mv direto |
| calendar | calendar/ | merge |
| captura | captura/ | merge |
| cargos | (criar) | mv direto |
| chat | chat/ | merge |
| contratos | contratos/ | merge |
| documentos | documentos/ | merge |
| enderecos | (criar) | mv direto |
| entrevistas-trabalhistas | (criar) | mv direto |
| expedientes | expedientes/ | merge |
| financeiro | financeiro/ | merge |
| notificacoes | notificacoes/ | merge |
| obrigacoes | (criar) | mv direto |
| partes | partes/ | merge |
| pecas-juridicas | pecas-juridicas/ | merge |
| perfil | perfil/ | merge |
| pericias | pericias/ | merge |
| portal | portal/ (raiz app) | merge |
| processos | processos/ | merge |
| repasses | repasses/ | merge |
| rh | rh/ | merge |
| tipos-expedientes | tipos-expedientes/ | merge |
| usuarios | usuarios/ | merge |
| website | (paginas publicas raiz) | merge |

**Import update:** `@/features/{mod}` → `@/app/app/{mod}` (ou `@/app/{mod}` apos achatamento)

### Onda 4 — Limpeza final

- Remover `src/features/` vazio
- Atualizar `tsconfig.json` paths
- Atualizar regras ESLint de import
- Atualizar `CLAUDE.md` com nova arquitetura
- Rodar `npm run build` completo
- Atualizar `check:architecture` script

## Operacao de Merge (quando rota ja existe)

Quando `features/X/` tem componentes e `app/app/X/` tambem tem componentes:

1. Verificar se ha arquivos com mesmo nome em ambos (colisao)
2. Se nao ha colisao: mover direto
3. Se ha colisao: os arquivos da feature tem precedencia (sao os canonicos)
4. Componentes que ja estavam em app/app/X/components/ sao provavelmente duplicatas ou wrappers finos — verificar antes de sobrescrever

## Atualizacao de Imports

Para cada modulo migrado, executar:

```bash
# Encontrar todos os arquivos que importam do modulo
grep -rl "@/features/{modulo}" src/ --include="*.ts" --include="*.tsx"

# Substituir o path
sed -i '' 's|@/features/{modulo}|@/app/app/{modulo}|g' <arquivos>
```

Tambem tratar:
- Deep imports: `@/features/{modulo}/domain` → `@/app/app/{modulo}/domain`
- Re-exports em `src/types/index.ts`
- Imports nos testes em `__tests__/`
- Imports no MCP registry em `lib/mcp/registries/`

## Verificacao

Apos cada modulo:
1. `npm run type-check` — deve passar sem erros
2. `npm test` — testes existentes devem passar
3. `grep -r "@/features/{modulo}" src/` — deve retornar zero resultados

Apos migracao completa:
1. `npm run build` — build completo
2. `npm run check:architecture` — validacao arquitetural
3. `grep -r "@/features/" src/` — nenhuma referencia restante

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|----------|
| Imports circulares entre modulos app/ | Barrel exports isolam dependencias |
| Colisao de arquivos no merge | Verificar antes de mover, feature prevalece |
| Next.js tratar arquivos como rotas | Apenas page/layout/loading/error sao rotas, resto e ignorado |
| Path aliases quebram | Atualizar tsconfig.json na Onda 4 |
| Testes com paths hardcoded | Atualizar junto com imports |

## Nota sobre Achatamento app/app/

O usuario pretende achatar `app/app/` para `app/` antes ou durante a migracao. Isso muda o path final de `@/app/app/{mod}` para `@/app/{mod}`. A operacao de achatamento e independente desta migracao e sera tratada separadamente.
