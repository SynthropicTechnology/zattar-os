# 🔄 Como Manter Documentação Chatwoot Sincronizada com Context7

**Objetivo:** Procedimento para atualizar documentação quando a API Chatwoot muda  
**Responsabilidade:** Tech lead ou documentador  
**Frequência:** Conforme novas features/mudanças na Chatwoot  
**Ferramentas:** Context7 MCP + GitHub

---

## 🎯 Quando Sincronizar?

Atualize a documentação quando:

- [ ] Chatwoot lança nova versão (verificar changelog)
- [ ] Você descobre que um endpoint mudou
- [ ] Um cliente encontra um erro na documentação
- [ ] Novascapabilities são adicionadas ao Chatwoot
- [ ] Você vai implementar uma nova feature

---

## 📋 Procedimento de Sincronização

### Step 1: Resolver Library ID no Context7

**Via Copilot:**

```javascript
// Use a ferramenta mcp_io_github_ups_resolve-library-id
// Isso já foi feito no setup, mas para referência:

{
  "libraryName": "Chatwoot API"
}

// Retorna:
{
  "context7CompatibleLibraryID": "/chatwoot/docs",
  "name": "Chatwoot",
  "description": "Developer Documentation",
  "codeSnippets": 1075,
  "sourceReputation": "High",
  "benchmarkScore": 71.75
}
```

### Step 2: Buscar Documentação Específica

**Comando:**

```typescript
mcp_io_github_ups_get -
  library -
  docs({
    context7CompatibleLibraryID: "/chatwoot/docs",
    mode: "code", // ou "info"
    topic: "Contacts API", // Seu tópico específico
    page: 1, // Se houver múltiplas páginas
  });
```

**Exemplos de tópicos:**

```
- Contacts API
- Conversations API
- Messages API
- Webhooks
- Authentication
- Rate Limiting
- Error Handling
- Custom Attributes
- Real-time Events
- [seu tópico aqui]
```

### Step 3: Preparar Update

Salve a resposta do Context7:

```bash
# Salvar em arquivo temporário para referência
curl "https://api.context7.com/..." > /tmp/chatwoot_update.json

# Revisar mudanças
cat /tmp/chatwoot_update.json | jq . | less
```

### Step 4: Atualizar Documentação Local

**Arquivo a atualizar:** `/docs/internal/chatwoot/CHATWOOT_API_OFFICIAL.md`

```markdown
## Seção Afetada

### [ANTES - Versão antiga]
```

DELETE /api/v1/accounts/{id}/contacts/{contact_id}

```

### [DEPOIS - Versão nova via Context7]
```

DELETE /api/v1/accounts/{id}/contacts/{contact_id}
Header: api_access_token
Response: { success: true }

```

---

## 🔄 Fluxo Completo: Exemplo Real

### Cenário: Chatwoot adicionou novo campo em Contact

**Step 1: Identificar mudança**

```

Você encontra erro em produção:
"custom_attributes não estão sendo salvos"

````

**Step 2: Buscar documentação atualizada**

```javascript
// Usar Copilot:
mcp_io_github_ups_get-library-docs({
  context7CompatibleLibraryID: "/chatwoot/docs",
  mode: "code",
  topic: "Contacts API custom attributes"
})

// Resposta traz novo campo:
{
  "custom_attributes": {
    "tipo_documento": string,  // NOVO!
    "documento_numero": string,
    ...
  }
}
````

**Step 3: Atualizar CHATWOOT_API_OFFICIAL.md**

```diff
  "custom_attributes": {
+   "tipo_documento": "cpf",      // NOVO
    "tipo_pessoa": "pf|pj",
    "tipo_entidade": "cliente",
    ...
  }
```

**Step 4: Atualizar código que usa API**

```typescript
// src/lib/chatwoot/contacts.ts
const createContactPayload = {
  custom_attributes: {
    tipo_documento: 'cpf',       // ← NOVO
    documento_numero: '123...',
    ...
  }
};
```

**Step 5: Testar e fazer PR**

```bash
git checkout -b update/chatwoot-custom-attributes
# ... faz mudanças ...
git commit -m "docs: atualizar Contact API com novo campo tipo_documento via Context7"
git push

# PR: Referencia o documento atualizado
# "Baseado em documentação oficial Context7 da Chatwoot"
```

---

## 📊 Checklist: Sincronização Completa

- [ ] **Identificar** seção que mudou
- [ ] **Resolver** library ID (`/chatwoot/docs`)
- [ ] **Buscar** documentação via Context7
- [ ] **Revisar** mudanças antes de aplicar
- [ ] **Atualizar** CHATWOOT_API_OFFICIAL.md
- [ ] **Atualizar** ARCHITECTURE.md (se estrutura mudou)
- [ ] **Atualizar** INTEGRATION_PLAN.md (se timeline mudou)
- [ ] **Atualizar** código que usa a API
- [ ] **Testar** localmente
- [ ] **Fazer commit** com referência a Context7
- [ ] **Notificar** time sobre mudanças

---

## 📝 Template de Commit Message

```git
docs: sincronizar Chatwoot API {TÓPICO} com Context7

- ✅ Atualizado CHATWOOT_API_OFFICIAL.md
- ✅ {descrição breve das mudanças}
- 🔗 Fonte: Context7 /chatwoot/docs
- 📌 Versão Chatwoot: {versão se disponível}

Exemplo:
- Novo campo: custom_attributes.tipo_documento
- Endpoints afetados: POST /contacts, PUT /contacts/{id}
- Breaking changes: none

Code update:
- src/lib/chatwoot/contacts.ts (linha 123)
```

---

## 🚨 Quando há Breaking Changes

**Se Chatwoot fez mudança incompatível:**

1. **Documenta em seção de aviso:**

```markdown
⚠️ BREAKING CHANGE na v1.5.0

**Antes:**
```

POST /api/v1/contacts
{ identifier: "user_123" }

```

**Depois:**
```

POST /api/v1/contacts
{ identifier: "user_123", inbox_id: 1 } // inbox_id agora obrigatório

```

**Ação:** Atualizar todas as chamadas para incluir inbox_id
```

2. **Atualiza código:**

```typescript
// SEM: erro em produção após update
const response = await chatwootClient.createContact({
  identifier: "user_123",
});

// COM: compatível com v1.5.0
const response = await chatwootClient.createContact({
  identifier: "user_123",
  inbox_id: CHATWOOT_DEFAULT_INBOX_ID, // ← OBRIGATÓRIO
});
```

3. **Notifica time:**

```markdown
## 🚨 Chatwoot API Breaking Change Detected

- **Data:** 2026-02-17
- **Versão:** Chatwoot v1.5.0
- **Mudança:** `inbox_id` agora obrigatório em POST /contacts
- **Impacto:** Alta (função sincronizarPartePara Chatwoot)
- **Ação:** PR aberto #1234 com fixes
- **Revisão:** Necessária antes de merge
```

---

## 🔍 Verificação Cruzada: Dados vs Código

**Garantir que código e docs estão sincronizados:**

```bash
#!/bin/bash
# scripts/verify-chatwoot-sync.sh

echo "🔍 Verificando sincronização Chatwoot..."

# 1. Extrair endpoints de CHATWOOT_API_OFFICIAL.md
endpoints_doc=$(grep "^### " docs/internal/chatwoot/CHATWOOT_API_OFFICIAL.md)

# 2. Extrair endpoints usados no código
endpoints_code=$(grep -r "CHATWOOT_API_URL" src/lib/chatwoot/ | grep -o "/api/v1/[^']*" | sort -u)

# 3. Comparar
echo "📄 Endpoints em docs:"
echo "$endpoints_doc"

echo ""
echo "💻 Endpoints no código:"
echo "$endpoints_code"

echo ""
echo "⚠️ Endpoints não documentados:"
comm -23 <(sort <<< "$endpoints_code") <(sort <<< "$endpoints_doc")
```

---

## 📅 Calendário de Sincronização

```
MENSAL (Primeira semana)
  ├─ Verificar Chatwoot changelog
  ├─ Atualizar versão se mudou
  └─ Rodar verify-chatwoot-sync.sh

TRIMESTRAL (Começo do trimestre)
  ├─ Review ARCHITECTURE.md
  ├─ Revisão completa do CHATWOOT_API_OFFICIAL.md
  └─ Atualizar INTEGRATION_PLAN.md se timeline mudou

AD HOC (Quando necessário)
  ├─ Cliente encontra erro
  ├─ Nova feature implementada
  ├─ Breaking change detectado
  └─ Code review sugere atualização
```

---

## 🛠️ Ferramentas Disponíveis

### Para Subagentes

```typescript
// Ferramentas MCP usadas neste projeto

// 1. Resolver biblioteca
mcp_io_github_ups_resolve -
  library -
  id({
    libraryName: "Chatwoot API",
  });

// 2. Buscar documentação
mcp_io_github_ups_get -
  library -
  docs({
    context7CompatibleLibraryID: "/chatwoot/docs",
    mode: "code" | "info",
    topic: "seu tópico",
  });

// 3. Atualizar documentação em repo
mcp_io_github_git_create_or_update_file({
  owner: "SynthropicTech",
  repo: "zattar-os",
  path: "docs/internal/chatwoot/CHATWOOT_API_OFFICIAL.md",
  content: "novo conteúdo",
  message: "docs: atualizar API via Context7",
});
```

---

## 📚 Onde os Tipos são Documentados?

Cada tipo em seu lugar:

```
TypeScript Types
  ↓
  src/lib/chatwoot/types.ts
  └─ Interface ChatwootContact { ... }
  └─ Interface ChatwootMessage { ... }
  └─ ...

API Endpoints
  ↓
  docs/internal/chatwoot/CHATWOOT_API_OFFICIAL.md
  └─ GET /api/v1/contacts
  └─ POST /api/v1/messages
  └─ ...

Fluxos de Implementação
  ↓
  docs/internal/chatwoot/ARCHITECTURE.md
  └─ Service patterns
  └─ Repository patterns
  └─ ...

Timeline da Integração
  ↓
  docs/internal/chatwoot/INTEGRATION_PLAN.md
  └─ Fases 1-4
  └─ Tasks por fase
  └─ Timelines
```

---

## 🎓 Exemplo: Atualização Passo a Passo

### Cenário Real: Novo Endpoint de Bulk Operations

**Chatwoot Release Notes:** "Adicionado POST /bulk_operations"

**Step 1: Buscar Documentação**

```javascript
// Usar Copilot:
const result = await mcp_io_github_ups_get_library_docs({
  context7CompatibleLibraryID: "/chatwoot/docs",
  mode: "code",
  topic: "Bulk Operations API",
});

// Resultado traz:
/**
POST /api/v1/accounts/{accountId}/bulk_operations
{
  "operation_type": "update_contacts",
  "ids": [1, 2, 3],
  "attributes": {
    "status": "active"
  }
}
Response: { job_id: "xyz", status: "enqueued" }
*/
```

**Step 2: Adicionar em CHATWOOT_API_OFFICIAL.md**

````markdown
## 📦 Bulk Operations API (NEW)

### Realizar Operação em Lote

**Endpoint:** `POST /api/v1/accounts/{accountId}/bulk_operations`

**Supported Operations:**

- `update_contacts` - Atualizar múltiplos contatos
- `delete_contacts` - Deletar múltiplos
- `add_labels` - Adicionar labels em massa

**Request:**

```json
{
  "operation_type": "update_contacts",
  "ids": [1, 2, 3],
  "attributes": {
    "status": "active"
  }
}
```
````

**Response:**

```json
{
  "job_id": "bulk_job_abc123",
  "status": "enqueued"
}
```

**Rastrear Operação:**

```bash
curl -X GET "https://seu-chatwoot.com/api/v1/bulk_operations/bulk_job_abc123" \
  -H "api_access_token: sua_chave"
```

````

**Step 3: Atualizar tipos TypeScript**

```typescript
// types.ts
export type BulkOperationType = 'update_contacts' | 'delete_contacts' | 'add_labels';

export interface BulkOperationRequest {
  operation_type: BulkOperationType;
  ids: number[];
  attributes: Record<string, unknown>;
}

export interface BulkOperationResponse {
  job_id: string;
  status: 'enqueued' | 'processing' | 'completed' | 'failed';
}
````

**Step 4: Implementar em Service**

```typescript
// src/lib/chatwoot/bulk.ts (NEW)
export async function realizarBulkOperation(
  request: BulkOperationRequest,
): Promise<Result<BulkOperationResponse>> {
  const response = await fetch(
    `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/bulk_operations`,
    {
      method: "POST",
      headers: {
        api_access_token: CHATWOOT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    return err(appError("BULK_OP_FAILED", await response.text()));
  }

  return ok(await response.json());
}
```

**Step 5: Fazer PR**

```
commit message:
docs/feat: adicionar Bulk Operations API

- ✅ CHATWOOT_API_OFFICIAL.md: novo endpoint POST /bulk_operations
- ✅ src/lib/chatwoot/types.ts: novos tipos BulkOperationRequest, BulkOperationResponse
- ✅ src/lib/chatwoot/bulk.ts: nova função realizarBulkOperation
- 🔗 Fonte: Context7 /chatwoot/docs (via MCP resolve-library-id)
- ✅ Testes: 3 novos testes em tests/chatwoot/bulk.test.ts

Breaking changes: none
Versão Chatwoot: v1.6.0+
```

---

## 🎯 Metricas: Como Saber Se Está Sincronizado?

```
✅ Bem sincronizado:
  ├─ Documentação atualizada há < 2 semanas
  ├─ Código espelha exemplos da API
  ├─ Testes verificam endpoints
  └─ Breaking changes documentados

⚠️ Parcialmente sincronizado:
  ├─ Alguns endpoints sem examplos
  ├─ Novos campos ainda não em tipos
  └─ Documentação tem TODO comments

❌ Desincronizado:
  ├─ Documentação > 1 mês desatualizada
  ├─ Código usa endpoints descontinuados
  ├─ Tipos não matcham API
  └─ Testes falhando
```

---

## 📞 FAQ

### P: Quanto tempo leva sincronizar?

**R:** Depende da mudança:

- Novo endpoint: 30-45 min (docs + código + testes)
- Breaking change: 2-4 horas (análise + propagação)
- Revisão completa: 4-8 horas

### P: Faço PR pequeno ou grande?

**R:** Regra geral:

- Mudança em 1 endpoint → 1 PR pequeno
- Mudança em 3+ endpoints → 1 PR de feature
- Breaking change → Separado, com migration guide

### P: Quem aprova sincronizações?

**R:** Priority:

1. Tech lead (arquitetura)
2. Dev que usa a API (contexto)
3. QA (testar em staging)

### P: E documentação descontinuada?

**R:**

1. Mover para seção "Deprecated"
2. Adicionar data de deprecação
3. Indicar alternativa nova
4. Manter código exemplo por 1 versão Chatwoot

---

## 🚀 Próximos Passos

1. **Agendar sincronização mensal** na calendar
2. **Designar responsável** por mês
3. **Criar alertas** no GitHub para Chatwoot releases
4. **Run verify-chatwoot-sync.sh** em CI/CD

---

**Mantido por:** Jordan Medeiros  
**Baseado em:** Chatwoot Official Docs via Context7  
**Última revisão:** 17/02/2026  
**Status:** 🟢 Pronto para uso
