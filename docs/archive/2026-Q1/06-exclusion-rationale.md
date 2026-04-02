# Justificativa de Exclusão de Actions do MCP

> **Objetivo:** Explicar com exemplos concretos por que certas categorias de Server Actions foram excluídas do MCP Tools.

---

## ❌ Categoria 1: Buscar por ID Interno

### Problema

Agentes de IA **não conhecem IDs internos** do banco de dados. Eles operam com informações que o usuário fornece em linguagem natural (CPF, CNPJ, email, número de processo), não com IDs numéricos gerados automaticamente pelo banco.

### Exemplo Falho: `actionBuscarProcesso(id: number)`

**Cenário de Uso Impossível:**

```typescript
// ❌ Tentativa de uso pelo agente
Usuário: "Mostre-me o processo 12345"
Agente tenta: actionBuscarProcesso(12345)

// Problemas:
// 1. Como o agente sabe que ID 12345 é válido?
// 2. Como o agente sabe que 12345 se refere a um processo (e não a outro número)?
// 3. Como o agente sabe se 12345 pertence ao cliente correto?
// 4. O número 12345 pode ser:
//    - ID interno do banco (ex: processo.id)
//    - Número CNJ do processo (ex: 0001234-56.2023.5.15.0001)
//    - Número de protocolo
//    - Outro identificador
```

**Resultado:** Agente não consegue usar a action de forma confiável.

---

### Solução Correta: `actionBuscarProcessoPorNumero(numeroProcesso: string)`

**Cenário de Uso Possível:**

```typescript
// ✅ Uso correto pelo agente
Usuário: "Mostre-me o processo 0001234-56.2023.5.15.0001"
Agente usa: actionBuscarProcessoPorNumero("0001234-56.2023.5.15.0001")

// Benefícios:
// 1. Número CNJ é identificador externo conhecido
// 2. Usuário fornece o número diretamente
// 3. Não há ambiguidade (número CNJ é único)
// 4. Agente pode validar formato do número CNJ
```

**Resultado:** Agente usa a action com sucesso.

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Alternativa Útil |
|----------------|--------|------------------|
| `actionBuscarCliente(id)` | ID interno desconhecido | `actionBuscarClientePorCPF(cpf)` ✅ |
| `actionBuscarUsuario(id)` | ID interno desconhecido | `actionBuscarPorEmail(email)` ✅ |
| `actionBuscarProcesso(id)` | ID interno desconhecido | `actionBuscarProcessoPorNumero(numero)` ✅ |
| `actionBuscarDocumento(id)` | ID interno desconhecido | `actionListarDocumentos({ busca })` ✅ |
| `actionBuscarContrato(id)` | ID interno desconhecido | `actionBuscarContratosPorCPF(cpf)` ✅ |

---

### Exceção: IDs Após Busca Prévia

**Quando é aceitável usar IDs internos:**

Actions que recebem IDs são aceitáveis se:
1. O agente obtém o ID de uma busca prévia
2. A action é uma operação de negócio sobre entidade já conhecida

**Exemplo de Fluxo Aceitável:**

```typescript
// 1. Agente busca processo por número CNJ
const resultado = await actionBuscarProcessoPorNumero("0001234-56.2023.5.15.0001")
const processoId = resultado.data.id // 12345

// 2. Agente usa ID para operação de negócio
await actionBuscarTimeline(processoId) // ✅ OK - ID obtido de busca prévia

// 3. Agente usa ID para confirmar lançamento
await actionConfirmarLancamento(lancamentoId) // ✅ OK - após buscar lançamento
```

**Critério:**
- ✅ Action aceita ID **E** é usada após busca prévia → **ÚTIL**
- ❌ Action aceita ID **E** é único ponto de entrada → **INÚTIL**

---

## ❌ Categoria 2: Upload de Arquivos

### Problema

MCP trabalha com **JSON/texto**, não com dados binários. Operações de upload requerem FormData com arquivos binários, e agentes de IA não têm acesso ao filesystem local do usuário.

### Exemplo Falho: `actionUploadAvatar(usuarioId, formData)`

**Limitações Técnicas:**

```typescript
// ❌ Impossível para um agente MCP
Usuário: "Atualize minha foto de perfil"
Agente tenta: actionUploadAvatar(usuarioId, formData)

// Problemas:
// 1. MCP tools recebem JSON, não FormData
// 2. Agente não tem acesso a arquivos locais do usuário
// 3. Não há forma de representar uma imagem binária em JSON de forma útil
// 4. Upload requer interação com filesystem (file picker)
```

**Resultado:** Operação impossível via MCP.

---

### Alternativa Correta

Operações de upload devem ser feitas via **UI tradicional**:

```typescript
// ✅ Via UI (React/Next.js)
<input type="file" onChange={handleUpload} />

function handleUpload(e: ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (file) {
    const formData = new FormData()
    formData.append('avatar', file)
    await actionUploadAvatar(usuarioId, formData)
  }
}
```

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Alternativa |
|----------------|--------|-------------|
| `actionUploadAvatar` | Upload de imagem binária | UI tradicional |
| `actionUploadCover` | Upload de imagem binária | UI tradicional |
| `actionUploadArquivo` | Upload de arquivo binário | UI tradicional |
| `actionUploadComprovante` | Upload de PDF/imagem binária | UI tradicional |
| `actionUploadDocumento` | Upload de arquivo binário | UI tradicional |
| `actionUploadFile` | Upload de arquivo binário (chat) | UI tradicional |

---

## ❌ Categoria 3: Auto-Save e Operações de UI

### Problema

Operações específicas de interface do usuário que não fazem sentido para agentes de IA. Agentes criam/atualizam entidades de forma **atômica**, não incremental.

### Exemplo Falho: `actionAutoSalvar(id, formData)`

**Contexto de UI:**

```typescript
// ❌ Não faz sentido para agente
// Auto-save é triggered automaticamente pela UI durante edição

// Editor de documento (React)
function DocumentEditor() {
  const [content, setContent] = useState('')

  useEffect(() => {
    // Auto-save a cada 5 segundos
    const interval = setInterval(() => {
      actionAutoSalvar(documentoId, { content })
    }, 5000)

    return () => clearInterval(interval)
  }, [content])

  return <textarea value={content} onChange={e => setContent(e.target.value)} />
}
```

**Por que agentes não usam auto-save:**

1. Agentes não "editam" documentos de forma incremental
2. Agentes criam/atualizam documentos de forma **atômica** (tudo de uma vez)
3. Auto-save é uma otimização de UX para humanos digitando

---

### Solução Correta para Agentes

Agentes usam operações atômicas:

```typescript
// ✅ Agente cria documento completo de uma vez
Usuário: "Crie um documento de proposta comercial"
Agente usa: actionCriarDocumento({
  titulo: "Proposta Comercial - Cliente XYZ",
  conteudo: "...", // conteúdo completo gerado pelo agente
  pasta_id: 123,
  tags: ["proposta", "comercial"]
})

// ✅ Agente atualiza documento completo de uma vez
Usuário: "Atualize a proposta para incluir desconto de 10%"
Agente usa: actionAtualizarDocumento(documentoId, {
  conteudo: "..." // conteúdo completo atualizado
})
```

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Alternativa para Agentes |
|----------------|--------|--------------------------|
| `actionAutoSalvar` | Operação incremental de UI | `actionAtualizarDocumento` ✅ |
| `actionAlterarSenhaComVerificacao` | Requer senha atual (UI) | Não aplicável a agentes |

---

## ❌ Categoria 4: Autenticação e Sessão

### Problema

Gerenciamento de sessão é responsabilidade do **sistema**, não de agentes. Agentes operam no contexto de um usuário **já autenticado**.

### Exemplo Falho: `actionLoginPortal(cpf)`

**Problema de Segurança:**

```typescript
// ❌ NUNCA permitir agentes autenticarem usuários
Usuário: "Faça login no portal com meu CPF"
Agente tenta: actionLoginPortal("12345678900")

// Problemas de Segurança:
// 1. Agentes não devem ter poder de criar sessões de usuário
// 2. Login requer validação de credenciais (senha, 2FA)
// 3. Operação sensível que deve ser controlada pela aplicação
// 4. Risco de impersonation se agente puder fazer login como qualquer usuário
```

**Resultado:** Operação bloqueada por motivos de segurança.

---

### Contexto Correto para Agentes

Agentes operam **dentro** de sessão já autenticada:

```typescript
// ✅ Agente opera no contexto do usuário autenticado

// 1. Usuário faz login via UI tradicional
// POST /api/auth/login
// { email: "usuario@example.com", password: "***" }
// → Cria sessão autenticada

// 2. Agente MCP opera com sessão do usuário
// MCP server lê sessão do usuário autenticado
const userId = await getAuthenticatedUserId()

// 3. Agente executa operações com permissões do usuário
await actionListarProcessos({ usuarioId }) // ✅ OK - usa sessão existente
```

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Como o Sistema Funciona |
|----------------|--------|-------------------------|
| `actionLoginPortal` | Cria sessão de usuário | UI tradicional com senha/2FA |
| `actionLogout` | Destroi sessão de usuário | UI tradicional |

---

## ❌ Categoria 5: Operações Internas de Indexação (AI)

### Problema

Operações internas do sistema de AI/RAG que devem ser executadas **automaticamente** pelo backend, não por agentes externos via MCP.

### Exemplo Falho: `actionIndexarDocumento(documentoId)`

**Contexto de Sistema Interno:**

```typescript
// ❌ Agente MCP não deve triggerar indexação manualmente

// Sistema interno (backend)
async function criarDocumento(data: CreateDocumentoInput) {
  // 1. Criar documento no banco
  const documento = await db.documento.create({ data })

  // 2. Indexar automaticamente (background job)
  await queueIndexacao.add({
    documentoId: documento.id,
    tipo: 'documento'
  })

  return documento
}
```

**Por que agentes não devem indexar:**

1. Indexação é triggered automaticamente quando documentos são criados/atualizados
2. Operação é de manutenção interna do sistema
3. Não há benefício em expor para agentes MCP
4. Agentes devem **usar** índices (busca semântica), não **gerenciar** índices

---

### Operações de Busca são Úteis

**O que agentes DEVEM fazer:**

```typescript
// ✅ Agente usa índices para buscar
Usuário: "Busque documentos sobre acidente de trabalho"
Agente usa: actionBuscaSemantica({
  query: "acidente de trabalho",
  options: { tipo_entidade: "documento", limite: 10 }
})

// Sistema retorna resultados usando índices (já criados automaticamente)
```

**Separação de Responsabilidades:**
- **Backend:** Cria e mantém índices automaticamente
- **Agentes MCP:** Usam índices para buscar informações

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Alternativa para Agentes |
|----------------|--------|--------------------------|
| `actionIndexarDocumento` | Operação interna (auto) | `actionBuscaSemantica` ✅ |
| `actionReindexarProcesso` | Operação interna (manutenção) | `actionBuscarNoProcesso` ✅ |
| `actionDeletarEmbeddings` | Operação interna (limpeza) | Não aplicável |
| `actionVerificarIndexacao` | Verificação interna | Não aplicável |
| `actionIndexarPecaProcesso` | Operação interna (auto) | `actionBuscarNoProcesso` ✅ |

---

## ❌ Categoria 6: Operações Destrutivas (Deletar)

### Problema

Operações de deletar são **muito destrutivas** e requerem IDs internos. Agentes não devem ter poder de deletar entidades.

### Exemplo Falho: `actionDeletarCliente(id)`

**Riscos de Segurança:**

```typescript
// ❌ NUNCA permitir agentes deletarem entidades
Usuário: "Delete todos os clientes inativos"
Agente tenta:
  const clientes = await actionListarClientes({ ativo: false })
  for (const cliente of clientes.data) {
    await actionDeletarCliente(cliente.id) // ❌ PERIGOSO
  }

// Problemas:
// 1. Operação irreversível
// 2. Pode causar perda de dados acidental
// 3. Agente pode interpretar incorretamente instrução do usuário
// 4. Não há confirmação adicional de segurança
```

**Resultado:** Risco de perda de dados.

---

### Alternativa Correta

Operações destrutivas devem ter **confirmação manual** via UI:

```typescript
// ✅ Via UI com confirmação
function DeletarClienteButton({ clienteId }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    await actionDeletarCliente(clienteId)
    setShowConfirm(false)
  }

  return (
    <div>
      <button onClick={handleDelete}>
        {showConfirm ? "Confirmar Exclusão?" : "Deletar"}
      </button>
      {showConfirm && (
        <p className="text-red-500">
          Esta ação é irreversível. Clique novamente para confirmar.
        </p>
      )}
    </div>
  )
}
```

---

### Operações de Negócio Reversíveis são Úteis

**O que agentes PODEM fazer:**

```typescript
// ✅ Operações de negócio reversíveis
await actionDesativarUsuario(usuarioId) // ✅ Reversível (pode reativar)
await actionCancelarLancamento(lancamentoId) // ✅ Reversível (pode estornar/recriar)
await actionReverterBaixa(expedienteId) // ✅ Reversível (já é operação de reversão)

// ❌ Operações destrutivas irreversíveis
await actionDeletarCliente(clienteId) // ❌ Irreversível
await actionExcluirFolhaPagamento(folhaId) // ❌ Irreversível
```

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo | Alternativa Reversível |
|----------------|--------|------------------------|
| `actionDeletarCliente` | Destrutiva, irreversível | `actionDesativarCliente` (se existir) |
| `actionDeletarExpediente` | Destrutiva, irreversível | Não aplicável |
| `actionDeletarLancamento` | Destrutiva, irreversível | `actionCancelarLancamento` ✅ |
| `actionDeletarDocumento` | Destrutiva, irreversível | Não aplicável |
| `actionExcluirFolhaPagamento` | Destrutiva, irreversível | Não aplicável |

---

## ❌ Categoria 7: Operações Muito Específicas ou Sensíveis

### Problema

Operações que requerem contexto muito específico, múltiplos IDs, ou são sensíveis demais para agentes.

### Exemplos

#### 7.1. Vincular/Desvincular Entidades

**Problema:**

```typescript
// ❌ Requer IDs de ambas entidades
Usuário: "Vincule o processo ao contrato"
Agente tenta: actionVincularProcesso(contratoId, processoId)

// Problemas:
// 1. Como agente obtém contratoId?
// 2. Como agente obtém processoId?
// 3. Como agente sabe qual processo vincular a qual contrato?
// 4. Operação requer contexto muito específico
```

---

#### 7.2. Operações de Tempo Real (Chat/Chamadas)

**Problema:**

```typescript
// ❌ Operações de tempo real não fazem sentido para agentes
Usuário: "Entre na chamada"
Agente tenta: actionEntrarNaChamada(chamadaId)

// Problemas:
// 1. Agente não é um participante de chamada de vídeo
// 2. Operação requer conexão WebRTC em tempo real
// 3. Não há contexto de "estar em uma chamada" para um agente
```

---

#### 7.3. Operações Sensíveis de Autorização

**Problema:**

```typescript
// ❌ Operações sensíveis não devem ser expostas
Usuário: "Dê permissão de admin para João"
Agente tenta: actionSalvarPermissoes(joaoId, { admin: true })

// Problemas:
// 1. Operação extremamente sensível
// 2. Agente não deve ter poder de alterar permissões
// 3. Risco de escala de privilégios
```

---

### Exemplos de Actions Excluídas

| Action Excluída | Motivo |
|----------------|--------|
| `actionVincularProcesso` | Requer IDs de ambas entidades, contexto específico |
| `actionDesvincularProcesso` | Requer IDs de ambas entidades, contexto específico |
| `actionVincularExpediente` | Requer IDs de ambas entidades |
| `actionEntrarNaChamada` | Operação de tempo real (WebRTC) |
| `actionSairDaChamada` | Operação de tempo real (WebRTC) |
| `actionIniciarGravacao` | Operação de tempo real (WebRTC) |
| `actionSalvarPermissoes` | Operação sensível de autorização |
| `actionRedefinirSenha` | Operação sensível |
| `actionDesativarAcesso` | Operação sensível (portal de clientes) |
| `actionAprovarFolhaPagamento` | Operação sensível (financeiro) |
| `actionPagarFolhaPagamento` | Operação sensível (financeiro) |

---

## 📊 Resumo de Categorias Excluídas

| Categoria | Total | Motivo Principal | Solução |
|-----------|-------|------------------|---------|
| **Buscar por ID Interno** | ~35 | Agentes não conhecem IDs | Usar buscas por identificadores externos |
| **Upload de Arquivos** | 6 | MCP não suporta binários | UI tradicional |
| **Auto-Save e UI** | 2 | Operação incremental de UI | Operações atômicas (criar/atualizar) |
| **Autenticação/Sessão** | 2 | Segurança | Agentes operam em sessão existente |
| **Indexação Interna** | 13 | Operação automática do sistema | Agentes usam buscas (não gerenciam índices) |
| **Deletar** | ~22 | Operação destrutiva irreversível | UI com confirmação manual |
| **Operações Específicas/Sensíveis** | ~35 | Contexto específico ou sensível | UI tradicional |
| **TOTAL EXCLUÍDO** | **~115** | | |

---

## 🎯 Princípios de Exclusão

### 1. **Agentes devem ter informações que o usuário fornece**
- ✅ CPF, CNPJ, email, número de processo → **Útil**
- ❌ ID numérico interno → **Inútil**

### 2. **MCP trabalha com JSON/texto, não binários**
- ✅ Dados textuais, números, JSON → **Útil**
- ❌ Arquivos binários (imagens, PDFs) → **Inútil**

### 3. **Agentes operam de forma atômica, não incremental**
- ✅ Criar/atualizar completo → **Útil**
- ❌ Auto-save, edição incremental → **Inútil**

### 4. **Agentes operam em contexto de usuário autenticado**
- ✅ Operações com permissões do usuário → **Útil**
- ❌ Criar sessões, autenticar → **Inútil**

### 5. **Agentes usam recursos do sistema, não os gerenciam**
- ✅ Buscar usando índices → **Útil**
- ❌ Criar/deletar índices → **Inútil**

### 6. **Operações destrutivas requerem confirmação manual**
- ✅ Operações reversíveis (cancelar, desativar) → **Útil**
- ❌ Operações irreversíveis (deletar, excluir) → **Inútil**

### 7. **Operações sensíveis requerem intervenção humana**
- ✅ Operações de negócio padrão → **Útil**
- ❌ Alterar permissões, redefinir senhas → **Inútil**

---

**Conclusão:** A exclusão de ~115 actions (65% do total) é **intencional e necessária** para manter MCP Tools seguro, útil e alinhado com as capacidades reais de agentes de IA.
