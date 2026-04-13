# Pedrinho System Prompt + Permission-Based Tool Filtering

**Data:** 2026-04-13
**Abordagem:** C — Prompt Estratégico + Auto-Descrição + Catálogo Leve

## Resumo

Redesign completo do system prompt do agente Pedrinho (CopilotKit v2) e introdução de filtragem de ferramentas MCP baseada nas permissões granulares do usuário logado. O objetivo é melhorar a qualidade das respostas do Gemini (menos tools = mais precisão), garantir segurança multi-tenant, e dar ao agente instruções claras alinhadas às best practices do Google.

## Decisões Tomadas

| Decisão | Escolha |
|---------|---------|
| Filtragem de ferramentas | Híbrido: server-side (filtro na route) + validação no handler (safety net) |
| Dify tools | Mantidas — chat/workflow/knowledge leitura para todos, CRUD admin-only |
| Chatwoot tools | Leitura/consulta para todos, escrita/exclusão/sync admin-only |
| Persona do prompt | Manter e melhorar o prompt de referência original (Pedrinho irreverente) |
| Contexto dinâmico por módulo | Mantido no hook (separação de responsabilidades) |
| Mapeamento tool→permissão | Convenção automática (prefixo nome → operação, feature → recurso) + overrides explícitos |
| Arquitetura CopilotKit | Per-request agent creation com beforeRequestMiddleware para auth (cookies Supabase, sem headers extras) |

## Arquitetura

```
Frontend (CopilotKit provider — sem mudanças, cookies Supabase já são enviados)
  │ cookies: sb-*-auth-token (automático via @supabase/ssr)
  ▼
API Route /api/copilotkit
  │
  ├─ beforeRequestMiddleware:
  │   ├─ createClient() (server) → auth.getUser() via cookies
  │   ├─ Busca userId numérico: usuarios.id WHERE auth_user_id = user.id
  │   └─ Injeta x-user-id no request header
  │
  ├─ getMcpToolsForUser(usuarioId) → filtra 172 tools → ~50-80 tools
  │   └─ Usa checkPermission() existente (cache 5min)
  │
  ├─ new BuiltInAgent({ model, tools: filteredTools, prompt })
  │
  └─ CopilotRuntime({ agents: { default: agent } })
```

**Nota**: O Supabase SSR envia cookies automaticamente — o frontend NÃO precisa
passar headers de Authorization. A API route lê os cookies via `createClient()`
do `@/lib/supabase/server`. O padrão é idêntico ao `requireAuth()` existente
em `src/app/(authenticated)/usuarios/actions/utils.ts`.

### Hooks dinâmicos (inalterados)

- `useCopilotDomainContext` — instruções de especialista por módulo
- `useCopilotRouteContext` — módulo e página atual
- `useCopilotRenderActions` — ações visuais (mostrar_*)
- `useCopilotHITLActions` — confirmação para destrutivas

## Parte 1: Filtragem de Ferramentas por Permissão

### 1.1 Novo campo em MCPToolConfig

Arquivo: `src/lib/mcp/types.ts`

Adicionar campo opcional `permissao` ao `MCPToolConfig`:

```typescript
export interface MCPToolConfig<TArgs = unknown> {
  name: string;
  description: string;
  schema: ZodSchema<TArgs>;
  handler: (args: TArgs) => Promise<MCPToolResult>;
  feature: string;
  requiresAuth: boolean;
  /** Override explícito de permissão. Se ausente, derivado por convenção. */
  permissao?: { recurso: string; operacao: string } | 'public' | 'admin';
}
```

### 1.2 Permission Map (novo arquivo)

Arquivo: `src/lib/mcp/permission-map.ts`

**Mapa feature → recurso:**

| Feature | Recurso |
|---------|---------|
| processos | acervo |
| partes | clientes |
| contratos | contratos |
| financeiro | lancamentos_financeiros |
| chat | (público) |
| documentos | documentos |
| expedientes | pendentes |
| audiencias | audiencias |
| obrigacoes | obrigacoes |
| rh | salarios |
| dashboard | (público) |
| busca_semantica | (público) |
| captura | captura |
| usuarios | usuarios |
| acervo | acervo |
| assistentes | assistentes |
| cargos | cargos |
| advogados | advogados |
| pericias | (público) |
| assinatura_digital | assinatura_digital |
| tarefas | projetos |

**Derivação nome → operação:**

| Prefixo | Operação |
|---------|----------|
| listar_, buscar_, obter_, ver_ | listar |
| criar_ | criar |
| atualizar_, editar_ | editar |
| excluir_, deletar_, remover_ | deletar |
| confirmar_ | confirmar |
| cancelar_ | cancelar |
| estornar_ | estornar |
| conciliar_ | conciliar |
| desconciliar | desconciliar |
| exportar_ | exportar |
| gerar_ | listar |
| resetar_ | editar |

**Overrides explícitos:**

- Chatwoot: 8 tools públicas (leitura), 8 admin-only (escrita)
- Dify: ~15 públicas (chat/workflow/knowledge leitura), ~35 admin (CRUD knowledge/chunks/anotações/tags)
- Financeiro: DRE → recurso `dre`, conciliação → recurso `conciliacao_bancaria`

**Lógica de resolução:**

1. Override explícito? → `'public'` (sempre), `'admin'` (só super_admin), ou `{ recurso, operacao }` (checkPermission)
2. Senão convenção: feature→recurso + nome→operação → checkPermission
3. Se recurso não existe na matriz ou permissão inválida → público (fallback seguro)

### 1.3 MCP Bridge atualizado

Arquivo: `src/lib/copilotkit/mcp-bridge.ts`

Nova função `getMcpToolsForUser(usuarioId: number)`:

1. Lista todas as tools registradas
2. Para cada tool, resolve a permissão (override ou convenção)
3. Se `'public'` → inclui
4. Se `'admin'` → inclui só se `is_super_admin`
5. Se `{ recurso, operacao }` → `checkPermission(usuarioId, recurso, operacao)`
6. Converte tools filtradas em `ToolDefinition[]` via `defineTool()`

Mantém `getMcpToolsAsDefinitions()` existente para compatibilidade (MCP server externo).

### 1.4 API Route reescrita

Arquivo: `src/app/api/copilotkit/[[...copilotkit]]/route.ts`

Mudanças:

1. Remove lazy-init cacheado (`cachedApp`)
2. Adiciona `beforeRequestMiddleware` para autenticação via Supabase session
3. Cria `BuiltInAgent` por request com tools filtradas
4. Busca prompt do DB via `getPromptContent('copilotkit_pedrinho')` com fallback

### 1.5 Frontend (sem mudanças necessárias)

O `CopilotKitProvider` em `src/components/layout/copilot-dashboard.tsx` já envia
cookies Supabase automaticamente via `@supabase/ssr`. A API route usa
`createClient()` server-side para ler a sessão dos cookies — não precisa de
headers adicionais.

## Parte 2: System Prompt Redesenhado

### Estrutura (8 seções)

1. **Identidade Central** — Persona Pedrinho, propósito, missão (do prompt original)
2. **Contexto do Escritório** — Chefia, equipe jurídica completa (do prompt original)
3. **Tons de Comunicação** — Geral (irreverente) + Específico (formal para peças) (do prompt original, refinado)
4. **Catálogo de Módulos** — Visão estratégica por domínio + regras mostrar_* vs listar_* + protocolo HITL (NOVO)
5. **Protocolo de Confiabilidade** — Não-invenção, citações obrigatórias, incerteza explícita (do prompt original)
6. **Strong Reasoner** — Template Google adaptado: planejamento antes da ação, avaliação de risco, persistência (NOVO)
7. **Algoritmo de Resposta** — 9 passos estruturados (do prompt original, refinado)
8. **Regras de Formatação e Execução** — Markdown, BRL, datas PT-BR, feedback (do prompt original)

### Catálogo de módulos (seção 4)

Descreve o que cada domínio permite fazer sem listar cada tool individual. As tools se auto-descrevem via seus schemas Zod. Inclui:

- Processos e Contencioso
- Audiências
- Expedientes e Prazos
- Financeiro (com nota sobre formatação BRL)
- Documentos e Contratos
- Tarefas e Projetos
- Comunicação (Chatwoot)
- IA e Automação (Dify — geração de peças)
- Exibição Visual (mostrar_*)
- Ações Destrutivas (HITL — confirmar_acao)
- Navegação e Visualização (tools frontend)

### Strong Reasoner (seção 6)

Adaptação do template oficial do Google para contexto jurídico:

- Antes de qualquer ação, planejar: dependências lógicas, risco, informação disponível
- Em erros transitórios, retry com nova estratégia
- Não desistir prematuramente — persistência inteligente
- Usar raciocínio abdutivo para diagnósticos

### Nota sobre permissões no prompt

```
Você tem acesso apenas às ferramentas autorizadas para o usuário atual.
Se uma ferramenta necessária não estiver disponível, informe o usuário
que ele pode não ter permissão para essa operação.
```

## Arquivos Afetados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/lib/mcp/types.ts` | Editar | Adicionar campo `permissao?` |
| `src/lib/mcp/permission-map.ts` | Criar | Mapeamento convenção + overrides |
| `src/lib/copilotkit/mcp-bridge.ts` | Editar | Adicionar `getMcpToolsForUser()` |
| `src/app/api/copilotkit/[[...copilotkit]]/route.ts` | Reescrever | Per-request agent + middleware auth |
| `src/components/layout/copilot-dashboard.tsx` | Inalterado | Cookies Supabase já são enviados automaticamente |
| `src/lib/system-prompts/defaults.ts` | Editar | Reescrever `copilotkit_pedrinho` |

## Arquivos Inalterados

- `src/lib/copilotkit/hooks/use-copilot-domain-context.ts`
- `src/lib/copilotkit/hooks/use-copilot-route-context.ts`
- `src/lib/copilotkit/components/copilot-render-actions.tsx`
- `src/lib/copilotkit/components/copilot-hitl-actions.tsx`
- `src/lib/copilotkit/components/copilot-global-actions.tsx`
- `src/lib/copilotkit/actions/*.ts`
- `src/lib/mcp/registries/*.ts` (todas as 23 registries)
- `src/lib/auth/authorization.ts`
- `src/lib/copilotkit/system-prompt.ts` (exporta de defaults.ts)

## Performance

- `registerAllTools()` continua idempotente (registra 1x)
- `getMcpToolsForUser()` usa `checkPermission()` com cache de 5min
- `BuiltInAgent` é leve (monta config, não pré-aquece modelo)
- Gemini recebe ~50-80 tools ao invés de 172 → respostas mais rápidas e precisas
