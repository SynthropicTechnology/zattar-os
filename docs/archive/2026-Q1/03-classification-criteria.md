# Critérios de Classificação de Server Actions para MCP

> **Objetivo:** Definir critérios objetivos para classificar Server Actions como ÚTIL, INÚTIL ou REQUER ADAPTAÇÃO para registro no MCP Tools.

---

## ✅ ÚTIL para MCP

Actions que agentes de IA podem executar autonomamente e que fazem sentido no contexto de ferramentas MCP.

### 1. Listagens com Filtros Semânticos

**Padrão:** `actionListar*` com parâmetros de filtro textuais/semânticos

**Exemplos:**
- ✅ `actionListarProcessos({ trt?, status?, periodo?, limite? })`
- ✅ `actionListarClientes({ busca?, tipo_pessoa?, ativo?, limite? })`
- ✅ `actionListarAudiencias({ data?, processo?, status?, limite? })`
- ✅ `actionListarExpedientes({ responsavel?, status?, prazo?, limite? })`
- ✅ `actionListarLancamentos({ periodo?, tipo?, status?, busca?, limite? })`

**Justificativa:** Agentes podem explorar dados usando filtros textuais e semânticos. Eles conseguem formular consultas baseadas em contexto natural (ex: "processos ativos no TRT15", "clientes pessoa física ativos", "audiências de janeiro").

**Critério de Inclusão:**
- ✅ Aceita filtros textuais (busca, nome, descrição)
- ✅ Aceita filtros semânticos (status, tipo, categoria)
- ✅ Aceita filtros temporais (período, data_inicio, data_fim)
- ✅ Retorna lista com metadados úteis (total, paginação)

---

### 2. Buscas por Identificadores Externos

**Padrão:** `actionBuscar*Por{CPF|CNPJ|Email|Numero|Protocolo}`

**Exemplos:**
- ✅ `actionBuscarClientePorCPF(cpf: string)`
- ✅ `actionBuscarClientePorCNPJ(cnpj: string)`
- ✅ `actionBuscarProcessoPorNumero(numeroProcesso: string)`
- ✅ `actionBuscarUsuarioPorEmail(email: string)`
- ✅ `actionBuscarAudienciasPorNumeroProcesso(numeroProcesso: string)`

**Justificativa:** Agentes conhecem identificadores externos (CPF, CNPJ, emails, números de processo), mas **não conhecem IDs internos** do banco de dados. Buscas por identificadores externos permitem que agentes encontrem entidades sem precisar saber seus IDs numéricos internos.

**Critério de Inclusão:**
- ✅ Parâmetro é identificador externo (CPF, CNPJ, email, número CNJ, protocolo)
- ✅ Identificador é conhecido publicamente ou pode ser extraído de contexto
- ❌ Parâmetro é ID numérico interno do banco de dados

**Contra-exemplo (INÚTIL):**
- ❌ `actionBuscarCliente(id: number)` - Agente não conhece IDs internos

---

### 3. Operações de Negócio

**Padrão:** `action{Confirmar|Cancelar|Estornar|Baixar|Aprovar|Rejeitar}*`

**Exemplos:**
- ✅ `actionConfirmarLancamento(id: number)`
- ✅ `actionCancelarLancamento(id: number)`
- ✅ `actionEstornarLancamento(id: number)`
- ✅ `actionBaixarExpediente(id: number, protocoloId?, justificativa?, data?)`
- ✅ `actionConfirmarRecebimento(id: number, valorRecebido, dataRecebimento)`
- ✅ `actionAprovarFolhaPagamento(id: number)`

**Justificativa:** Operações de negócio que agentes podem executar **após** buscar entidades usando identificadores externos. Por exemplo:
1. Agente busca lancamento por filtros semânticos
2. Agente confirma o lancamento usando seu ID

**Critério de Inclusão:**
- ✅ Operação é atômica e tem semântica clara (confirmar, cancelar, estornar)
- ✅ Operação pode ser executada após busca prévia
- ✅ Operação não requer interação contínua do usuário

**Contra-exemplo (INÚTIL):**
- ❌ `actionAutoSalvar(id, formData)` - Operação de UI, não de negócio

---

### 4. Relatórios e Agregações

**Padrão:** `action{Gerar|Obter|Calcular}*`

**Exemplos:**
- ✅ `actionGerarDRE(params: { dataInicio, dataFim, tipo? })`
- ✅ `actionObterFluxoCaixa(filtros: { dataInicio, dataFim })`
- ✅ `actionObterDashboardFinanceiro(usuarioId?: number)`
- ✅ `actionObterResumoPagamento(id: number)`
- ✅ `actionBuscarEstatisticasAtividades(usuarioId: number)`

**Justificativa:** Agentes podem gerar insights, relatórios e agregações de dados que ajudam o usuário a tomar decisões. São operações de leitura que produzem dados processados.

**Critério de Inclusão:**
- ✅ Operação é de leitura (não modifica dados)
- ✅ Retorna dados agregados, processados ou estatísticas
- ✅ Útil para análise e tomada de decisão

---

### 5. Buscas Semânticas e RAG (AI)

**Padrão:** `actionBusca{Semantica|Hibrida|RAG}*`

**Exemplos:**
- ✅ `actionBuscaSemantica(query: string, options?)`
- ✅ `actionBuscaHibrida(query: string, options?)`
- ✅ `actionObterContextoRAG(query: string, params?)`
- ✅ `actionBuscarSimilares(embeddings, limite?)`
- ✅ `actionBuscarConhecimento(query: string, params?)`
- ✅ `actionBuscarNoProcesso(processoId: number, query: string)`

**Justificativa:** Agentes de IA podem executar buscas semânticas para encontrar informações relevantes usando linguagem natural. Essas operações são o core do RAG (Retrieval-Augmented Generation).

**Critério de Inclusão:**
- ✅ Aceita query em linguagem natural
- ✅ Retorna resultados com relevância semântica
- ✅ Útil para contextualizar respostas do agente

---

## ❌ INÚTIL para MCP

Actions muito específicas de UI, que requerem contexto interno impossível de obter, ou que não fazem sentido para agentes de IA.

### 1. Buscar por ID sem Contexto

**Padrão:** `actionBuscar*(id: number)` onde ID é numérico interno

**Exemplos:**
- ❌ `actionBuscarUsuario(id: number)`
- ❌ `actionBuscarDocumento(id: number)`
- ❌ `actionBuscarCliente(id: number)`
- ❌ `actionBuscarProcesso(id: number)`
- ❌ `actionBuscarCargo(id: number)`

**Justificativa:** Agentes de IA **não conhecem IDs internos** do banco de dados. Não faz sentido expor uma action que requer um ID que o agente não tem como obter sem antes fazer uma busca.

**Problema:**
```typescript
// ❌ Impossível para um agente
Usuário: "Mostre-me o cliente 12345"
Agente tenta: actionBuscarCliente(12345)
// Como o agente sabe que ID 12345 é válido?
```

**Solução Correta:**
```typescript
// ✅ Possível para um agente
Usuário: "Mostre-me o cliente com CPF 123.456.789-00"
Agente usa: actionBuscarClientePorCPF("12345678900")
// CPF é identificador externo conhecido
```

**Critério de Exclusão:**
- ❌ Único parâmetro é ID numérico interno
- ❌ Não há forma de obter o ID sem busca prévia
- ❌ Existe alternativa com identificador externo

**Exceções (quando incluir mesmo com ID):**
- ✅ Action aceita ID **E** é usada após busca prévia (ex: operações de negócio)
- ✅ Action retorna dados relacionados úteis (ex: `actionBuscarTimeline(processoId)`)

---

### 2. Upload de Arquivos

**Padrão:** `actionUpload*`

**Exemplos:**
- ❌ `actionUploadAvatar(usuarioId, formData)`
- ❌ `actionUploadCover(usuarioId, formData)`
- ❌ `actionUploadArquivo(formData)`
- ❌ `actionUploadDocumento(contratoId, file)`
- ❌ `actionUploadComprovante(lancamentoId, file)`

**Justificativa:** MCP não é adequado para transferência de arquivos binários. Operações de upload requerem FormData com binários, e agentes não têm acesso a arquivos locais do usuário.

**Limitações técnicas:**
- MCP trabalha com JSON/texto
- Upload requer FormData com binário
- Agentes não têm acesso ao filesystem local do usuário

**Alternativa:** Operações de upload devem ser feitas via UI tradicional.

**Critério de Exclusão:**
- ❌ Aceita FormData com arquivos binários
- ❌ Transfere dados binários (imagens, PDFs, etc.)
- ❌ Não há forma de representar o arquivo como texto/JSON

---

### 3. Auto-Save e Operações de UI

**Padrão:** `actionAutoSalvar*`, `actionAlterarSenha*`

**Exemplos:**
- ❌ `actionAutoSalvar(id, formData)`
- ❌ `actionAlterarSenhaComVerificacao(usuarioId, senhaAtual, novaSenha)`

**Justificativa:** Operações específicas de interface do usuário que não fazem sentido para agentes.

**Contexto:**
- **Auto-save:** Triggered automaticamente pela UI durante edição incremental. Agentes criam/atualizam documentos de forma **atômica**, não incremental.
- **Alterar senha:** Requer verificação da senha atual, operação sensível que deve ser feita pelo usuário via UI.

**Alternativa:**
- Agentes usam `actionCriarDocumento` ou `actionAtualizarDocumento` diretamente
- Alteração de senha permanece exclusiva da UI

**Critério de Exclusão:**
- ❌ Operação é específica de UI (auto-save, drag-and-drop, etc.)
- ❌ Operação requer interação contínua do usuário
- ❌ Operação é sensível e deve ser feita manualmente

---

### 4. Operações de Autenticação/Sessão

**Padrão:** `actionLogin*`, `actionLogout*`

**Exemplos:**
- ❌ `actionLoginPortal(cpf)`
- ❌ `actionLogout()`

**Justificativa:** Gerenciamento de sessão é responsabilidade do sistema, não de agentes. Agentes operam no contexto de um usuário **já autenticado**.

**Segurança:**
- Agentes não devem ter capacidade de autenticar usuários
- Login requer validação de credenciais e criação de sessão
- Operação sensível que deve ser controlada pela aplicação

**Critério de Exclusão:**
- ❌ Operação cria/destroi sessões de usuário
- ❌ Operação valida credenciais
- ❌ Operação sensível de autenticação/autorização

---

### 5. Operações Internas de Indexação (AI)

**Padrão:** `actionIndexar*`, `actionReindexar*`, `actionDeletarEmbeddings*`

**Exemplos:**
- ❌ `actionIndexarDocumento(documentoId)`
- ❌ `actionReindexarProcesso(processoId)`
- ❌ `actionDeletarEmbeddings(documentoId)`
- ❌ `actionIndexarPecaProcesso(processoId, pecaId)`

**Justificativa:** Operações internas do sistema de AI/RAG que devem ser executadas automaticamente pelo backend, não por agentes externos via MCP.

**Contexto:**
- Indexação é triggered automaticamente quando documentos são criados/atualizados
- Operações são de manutenção interna do sistema
- Não faz sentido para um agente MCP executar indexação manualmente

**Critério de Exclusão:**
- ❌ Operação é de manutenção interna (indexação, cache, cleanup)
- ❌ Operação é triggered automaticamente pelo sistema
- ❌ Não há benefício em expor para agentes MCP

**Exceção:**
- ✅ Operações de **busca** usando índices são úteis (ex: `actionBuscaSemantica`)

---

## 🔄 REQUER ADAPTAÇÃO

Actions que **podem ser úteis** mas precisam de ajustes para funcionar bem com MCP.

### 1. Criar/Atualizar com FormData

**Padrão:** `actionCriar*(formData)`, `actionAtualizar*(id, formData)`

**Problema:** FormData não é ideal para MCP. MCP trabalha melhor com objetos JSON.

**Exemplos:**
- 🔄 `actionCriarProcesso(prevState, formData)`
- 🔄 `actionAtualizarProcesso(id, formData)`
- 🔄 `actionCriarExpediente(formData)`
- 🔄 `actionAtualizarExpediente(id, formData)`

**Solução:** Criar versões alternativas que aceitam objetos JSON ao invés de FormData.

**Padrão de Adaptação:**
```typescript
// ❌ Existente (FormData - não ideal para MCP)
export async function actionCriarProcesso(
  prevState: any,
  formData: FormData
): Promise<ActionResult<Processo>> {
  // ...
}

// ✅ Nova versão (JSON - ideal para MCP)
export async function actionCriarProcessoPayload(
  payload: CreateProcessoInput
): Promise<ActionResult<Processo>> {
  // Mesma lógica de validação e criação
  // Mas aceita JSON ao invés de FormData
}
```

**Exemplo já implementado:**
- ✅ `actionCriarAudienciaPayload(payload)` - Audiências já tem versão JSON

**Critério de Adaptação:**
- 🔄 Action usa FormData mas não envolve upload de arquivos
- 🔄 Dados do FormData são serializáveis como JSON
- 🔄 Action é útil para agentes (criar/atualizar entidades via MCP)

**Backlog de Adaptações:**
1. Processos: `actionCriarProcessoPayload`, `actionAtualizarProcessoPayload`
2. Expedientes: `actionCriarExpedientePayload`, `actionAtualizarExpedientePayload`
3. Partes: `actionCriarClientePayload`, `actionAtualizarClientePayload`
4. Contratos: `actionCriarContratoPayload`, `actionAtualizarContratoPayload`
5. Documentos: `actionCriarDocumentoPayload`, `actionAtualizarDocumentoPayload`

---

### 2. Operações Bulk

**Padrão:** `actionBulk*`, `action*Todas*`

**Exemplos:**
- 🔄 `actionMarcarTodasComoLidas()` - Notificações
- 🔄 `actionDeletarTodasLidas()` - Notificações

**Avaliação:** Analisar caso a caso se faz sentido para agentes.

**Critérios para Inclusão:**
- ✅ Operação bulk tem semântica clara e útil
- ✅ Operação é segura (não é destrutiva em massa)
- ✅ Agente pode decidir quando executar baseado em contexto

**Critérios para Exclusão:**
- ❌ Operação é muito destrutiva (ex: deletar tudo)
- ❌ Operação não tem filtros (age sobre todo o banco)
- ❌ Operação deve ser feita manualmente pelo usuário

**Decisão:**
- ✅ `actionMarcarTodasComoLidas()` - Útil, segura, reversível
- ❌ `actionDeletarTodasLidas()` - Destrutiva demais para agente

---

## 📊 Resumo dos Critérios

| Classificação | Critérios-Chave | Ação |
|---------------|-----------------|------|
| ✅ **ÚTIL** | Filtros semânticos, identificadores externos, operações de negócio, relatórios, busca AI | Registrar no MCP imediatamente |
| ❌ **INÚTIL** | Busca por ID interno, uploads, auto-save, autenticação, indexação interna | NÃO registrar no MCP |
| 🔄 **ADAPTAR** | FormData sem binários, operações bulk avaliadas caso a caso | Criar versões JSON e registrar |

---

## 🎯 Perguntas para Classificar uma Action

Ao avaliar uma action, pergunte:

1. **O agente tem os parâmetros necessários?**
   - ✅ Identificador externo (CPF, CNPJ, email, número) → ÚTIL
   - ❌ ID interno do banco → INÚTIL

2. **A operação faz sentido para um agente?**
   - ✅ Listar, buscar, gerar relatório → ÚTIL
   - ❌ Upload, auto-save, autenticação → INÚTIL

3. **A operação requer contexto impossível de obter?**
   - ✅ Filtros textuais, dados públicos → ÚTIL
   - ❌ Dados binários, sessão do usuário → INÚTIL

4. **A operação é segura para um agente executar?**
   - ✅ Leitura, operações de negócio atômicas → ÚTIL
   - ❌ Operações destrutivas em massa → INÚTIL

5. **A operação está no formato correto?**
   - ✅ JSON → ÚTIL
   - 🔄 FormData sem binários → ADAPTAR
   - ❌ FormData com binários → INÚTIL

---

**Próximo passo:** Aplicar estes critérios para classificar todas as 332 actions do inventário.
