# Lista Priorizada de Actions para Implementação MCP

> **Data:** 2025-12-31
> **Total de Actions Úteis Identificadas:** 78
> **Actions Já Registradas:** 51
> **Actions Não Registradas (A Implementar):** 27
> **Adaptações Necessárias (FormData → JSON):** 7
> **Total de Implementações Planejadas:** 34 (27 novas + 7 adaptações)

---

## 🎯 Critérios de Priorização

### 1. **Impacto**
Features mais usadas e críticas para o negócio:
- **Alta:** Processos, Partes, Financeiro, Audiências
- **Média:** Expedientes, Documentos, Contratos, Honorários
- **Baixa:** Dashboard, Notificações, Usuários, Acervo

### 2. **Completude**
Features com conjunto completo de operações (listar + buscar + operações de negócio):
- **Alta:** Features com múltiplas buscas por identificadores externos
- **Média:** Features com listagens e filtros semânticos
- **Baixa:** Features com apenas uma ou duas operações

### 3. **Dependências**
Features base antes de features derivadas:
- **Base:** Processos, Partes (clientes)
- **Derivadas:** Audiências (depende de processos), Contratos (depende de partes)

### 4. **Complexidade**
Actions simples antes de complexas:
- **Simples:** Listagens, buscas por identificador
- **Média:** Operações de negócio atômicas
- **Complexa:** Operações que requerem múltiplos passos

---

## 📊 PRIORIDADE ALTA - Fase 1 (Implementar Primeiro)

### **1.1 Busca Semântica (AI)** 🔥

**Justificativa:** Core do sistema de IA, habilita agentes a buscar conhecimento com linguagem natural.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 1 | `actionBuscaSemantica` | `src/features/busca/actions/busca-actions.ts` | `{ query: string, options?: { limite?, tipo_entidade? } }` | `{ data: Resultado[], relevance_scores }` |
| 2 | `actionBuscaHibrida` | `src/features/busca/actions/busca-actions.ts` | `{ query: string, options?: { limite?, modo? } }` | `{ data: Resultado[], scores }` |
| 3 | `actionObterContextoRAG` | `src/features/busca/actions/busca-actions.ts` | `{ query: string, params?: { max_tokens?, threshold? } }` | `{ contexto: string, sources: Fonte[] }` |
| 4 | `actionBuscarSimilares` | `src/features/busca/actions/busca-actions.ts` | `{ embeddings: number[], limite?: number }` | `{ data: Resultado[] }` |

**Impacto:** Habilita agentes a fazer perguntas e obter respostas contextualizadas sobre qualquer entidade do sistema.

**Exemplo de Uso:**
```typescript
// Agente pergunta: "Quais processos mencionam acidente de trabalho?"
actionBuscaSemantica({ query: "acidente de trabalho", options: { tipo_entidade: "processo", limite: 10 } })
```

---

### **1.2 Busca AI em Entidades Específicas**

**Justificativa:** Complementa busca semântica, permite buscar dentro de processos ou tipos específicos.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 5 | `actionBuscarConhecimento` | `src/features/ai/actions/search-actions.ts` | `{ query: string, params?: { fonte?, limite? } }` | `{ data: Conhecimento[], scores }` |
| 6 | `actionBuscarNoProcesso` | `src/features/ai/actions/search-actions.ts` | `{ processoId: number, query: string }` | `{ data: Resultado[], contexto }` |
| 7 | `actionBuscarPorTipoEntidade` | `src/features/ai/actions/search-actions.ts` | `{ tipo: string, query: string }` | `{ data: Resultado[] }` |

**Impacto:** Permite buscas mais específicas e contextualizadas em processos individuais.

---

### **1.3 Documentos - Geração**

**Justificativa:** Agentes podem gerar PDFs e DOCX de documentos.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 8 | `actionGerarPDF` | `src/features/documentos/actions/documentos-actions.ts` | `{ documentoId: number }` | `{ data: { url: string, filename: string } }` |
| 9 | `actionGerarDOCX` | `src/features/documentos/actions/documentos-actions.ts` | `{ documentoId: number }` | `{ data: { url: string, filename: string } }` |

**Impacto:** Agentes podem gerar documentos prontos para download.

---

### **1.4 Acervo - Listagem e Exportação**

**Justificativa:** Listagem unificada de acervo + exportação CSV são úteis para análise e relatórios.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 10 | `actionListarAcervoUnificado` | `src/features/acervo/actions/acervo-actions.ts` | `{ filtros?: { trt?, status?, busca? } }` | `{ data: AcervoItem[], total }` |
| 11 | `actionExportarAcervoCSV` | `src/features/acervo/actions/acervo-actions.ts` | `{ params?: { filtros?, colunas? } }` | `{ data: { url: string, csv_text: string } }` |

**Impacto:** Agentes podem visualizar acervo completo e exportar para análise externa.

---

### **1.5 Contratos - Processos Vinculados**

**Justificativa:** Útil para visualizar todos os processos vinculados a um contrato.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 12 | `actionListarProcessosVinculados` | `src/features/contratos/actions/vinculos-actions.ts` | `{ contratoId: number }` | `{ data: Processo[] }` |

**Impacto:** Agentes podem explorar relação contrato-processos.

---

**Total Fase 1: 12 actions**

---

## 📊 PRIORIDADE MÉDIA - Fase 2 (Implementar Depois)

### **2.1 Captura de Dados Externos**

**Justificativa:** Automação de consultas e sincronizações com APIs externas (Comunica CNJ).

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 13 | `actionConsultarComunicacoes` | `src/features/captura/actions/comunica-cnj-actions.ts` | `{ params: { numero_processo?, data_inicio?, data_fim? } }` | `{ data: Comunicacao[] }` |
| 14 | `actionSincronizarComunicacoes` | `src/features/captura/actions/comunica-cnj-actions.ts` | `{ params: { processos_ids?: number[] } }` | `{ data: { sincronizadas: number, erros: Error[] } }` |
| 15 | `actionObterCertidao` | `src/features/captura/actions/comunica-cnj-actions.ts` | `{ comunicacaoId: number }` | `{ data: { url: string, conteudo: string } }` |
| 16 | `actionCapturarTimeline` | `src/features/captura/actions/timeline-actions.ts` | `{ processoId: number }` | `{ data: TimelineItem[] }` |

**Impacto:** Agentes podem consultar APIs externas e sincronizar dados automaticamente.

---

### **2.2 Usuários - Atividades e Atribuições**

**Justificativa:** Estatísticas e atribuições de usuários são úteis para gestão de tarefas.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 17 | `actionBuscarEstatisticasAtividades` | `src/features/usuarios/actions/atividades-actions.ts` | `{ usuarioId: number }` | `{ data: Estatisticas }` |
| 18 | `actionBuscarProcessosAtribuidos` | `src/features/usuarios/actions/atividades-actions.ts` | `{ usuarioId: number }` | `{ data: Processo[] }` |
| 19 | `actionBuscarAudienciasAtribuidas` | `src/features/usuarios/actions/atividades-actions.ts` | `{ usuarioId: number }` | `{ data: Audiencia[] }` |
| 20 | `actionBuscarPendentesAtribuidos` | `src/features/usuarios/actions/atividades-actions.ts` | `{ usuarioId: number }` | `{ data: Pendente[] }` |
| 21 | `actionBuscarContratosAtribuidos` | `src/features/usuarios/actions/atividades-actions.ts` | `{ usuarioId: number }` | `{ data: Contrato[] }` |

**Impacto:** Agentes podem responder "Quais processos estão atribuídos ao João?" e similar.

---

### **2.3 RH - Folhas de Pagamento**

**Justificativa:** Consulta e geração de folhas de pagamento.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 22 | `actionBuscarFolhaPorPeriodo` | `src/features/rh/actions/folhas-pagamento-actions.ts` | `{ periodo: string }` | `{ data: FolhaPagamento }` |
| 23 | `actionObterResumoPagamento` | `src/features/rh/actions/folhas-pagamento-actions.ts` | `{ id: number }` | `{ data: ResumoPagamento }` |
| 24 | `actionGerarFolhaPagamento` | `src/features/rh/actions/folhas-pagamento-actions.ts` | `{ periodo: string, usuarioIds: number[] }` | `{ data: FolhaPagamento }` |

**Impacto:** Agentes podem consultar folhas de pagamento por período e gerar novas folhas.

**Nota:** `actionGerarFolhaPagamento` requer cuidado - operação sensível.

---

### **2.4 Chat - Listagens**

**Justificativa:** Listagem de conversas e histórico de chamadas.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 25 | `actionListarConversas` | `src/features/chat/actions/chat-actions.ts` | `{ params?: { busca?, status?, limite? } }` | `{ data: Conversa[] }` |
| 26 | `actionListarHistoricoGlobal` | `src/features/chat/actions/chamadas-actions.ts` | `{ params?: { data_inicio?, data_fim?, limite? } }` | `{ data: Chamada[] }` |

**Impacto:** Agentes podem buscar conversas e histórico de chamadas.

---

**Total Fase 2: 14 actions**

---

## 📊 PRIORIDADE BAIXA - Fase 3 (Implementar Por Último)

### **3.1 Portal de Clientes**

**Justificativa:** Busca de clientes do portal por CPF.

| # | Action | Arquivo | Parâmetros | Retorno |
|---|--------|---------|-----------|---------|
| 27 | `actionBuscarClientePortal` | `src/features/clientes-portal/actions/clientes-portal-actions.ts` | `{ cpf: string }` | `{ data: ClientePortal }` |

**Impacto:** Agentes podem buscar dados de clientes do portal.

---

**Total Fase 3: 1 action**

---

## 🔄 ADAPTAÇÕES NECESSÁRIAS (Backlog)

### Actions que Requerem Versões JSON

Estas actions precisam de versões alternativas que aceitem JSON ao invés de FormData:

| Prioridade | Feature | Action Original | Versão Adaptada Necessária | Arquivo |
|-----------|---------|----------------|---------------------------|---------|
| **Alta** | **processos** | `actionCriarProcesso(formData)` | `actionCriarProcessoPayload(payload)` | `src/features/processos/actions/index.ts` |
| **Alta** | **processos** | `actionAtualizarProcesso(id, formData)` | `actionAtualizarProcessoPayload(id, payload)` | `src/features/processos/actions/index.ts` |
| **Média** | **expedientes** | `actionCriarExpediente(formData)` | `actionCriarExpedientePayload(payload)` | `src/features/expedientes/actions/expedientes-actions.ts` |
| **Média** | **expedientes** | `actionAtualizarExpediente(id, formData)` | `actionAtualizarExpedientePayload(id, payload)` | `src/features/expedientes/actions/expedientes-actions.ts` |
| **Média** | **audiencias** | `actionAtualizarAudiencia(id, formData)` | `actionAtualizarAudienciaPayload(id, payload)` | `src/features/audiencias/actions/audiencias-actions.ts` |
| **Baixa** | **documentos** | `actionCriarDocumento(formData)` | `actionCriarDocumentoPayload(payload)` | `src/features/documentos/actions/documentos-actions.ts` |
| **Baixa** | **documentos** | `actionAtualizarDocumento(id, formData)` | `actionAtualizarDocumentoPayload(id, payload)` | `src/features/documentos/actions/documentos-actions.ts` |

**Nota:** A maioria das outras features (Partes, Contratos, Financeiro, Obrigações) **já têm** versões registradas, o que indica que já foram adaptadas ou aceitam JSON.

**Exemplo de Implementação:**

```typescript
// ✅ Versão JSON (para MCP)
export async function actionCriarProcessoPayload(
  payload: CreateProcessoInput
): Promise<ActionResult<Processo>> {
  try {
    // Validação com Zod
    const validated = createProcessoSchema.parse(payload)

    // Lógica de criação (reutilizar do FormData)
    const processo = await criarProcesso(validated)

    return {
      success: true,
      data: processo,
      message: "Processo criado com sucesso"
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Erro ao criar processo"
    }
  }
}

// ❌ Versão FormData existente (continua funcionando para UI)
export async function actionCriarProcesso(
  prevState: any,
  formData: FormData
): Promise<ActionResult<Processo>> {
  // Converte FormData para objeto
  const payload = formDataToObject(formData)

  // Delega para versão JSON
  return actionCriarProcessoPayload(payload)
}
```

---

## 📈 Resumo de Priorização

### Por Prioridade

| Prioridade | Fases | Total Actions | Features |
|-----------|-------|---------------|----------|
| **ALTA** | 1.1 - 1.5 | **12** | Busca (AI), Documentos, Acervo, Contratos |
| **MÉDIA** | 2.1 - 2.4 | **14** | Captura, Usuários (atividades), RH, Chat |
| **BAIXA** | 3.1 | **1** | Portal de Clientes |
| **ADAPTAÇÕES** | Backlog | **7** | Processos, Expedientes, Audiências, Documentos |
| **TOTAL** | | **34** | **12 features** |

---

### Por Feature (Actions Não Registradas)

| Feature | Actions Úteis | Não Registradas | % Não Registrado | Prioridade |
|---------|---------------|-----------------|------------------|------------|
| **busca** | 4 | 4 | 100% | Alta |
| **ai** | 3 | 3 | 100% | Alta |
| **documentos** | 4 | 2 | 50% | Alta |
| **acervo** | 2 | 2 | 100% | Alta |
| **contratos** | 4 | 1 | 25% | Alta |
| **captura** | 4 | 4 | 100% | Média |
| **usuarios** (atividades) | 5 | 5 | 100% | Média |
| **rh** | 3 | 3 | 100% | Média |
| **chat** | 2 | 2 | 100% | Média |
| **clientes-portal** | 1 | 1 | 100% | Baixa |

---

## 🎯 Plano de Implementação Sugerido

### **Sprint 1: Busca AI (Prioridade Crítica)** 🔥
- Implementar 7 actions de busca semântica (busca + ai features)
- **Impacto:** Habilita agentes a fazer perguntas e obter respostas contextualizadas
- **Duração Estimada:** Foco em qualidade, não em tempo

### **Sprint 2: Documentos e Acervo (Complementar Core)**
- Implementar 4 actions (geração de documentos + listagem de acervo)
- **Impacto:** Agentes podem gerar PDFs/DOCX e visualizar acervo completo
- **Duração Estimada:** Foco em qualidade, não em tempo

### **Sprint 3: Captura e Integrações Externas (Automação)**
- Implementar 4 actions de captura (Comunica CNJ + Timeline)
- **Impacto:** Agentes podem consultar APIs externas e sincronizar dados
- **Duração Estimada:** Foco em qualidade, não em tempo

### **Sprint 4: Usuários e RH (Gestão)**
- Implementar 8 actions (atividades de usuários + folhas de pagamento)
- **Impacto:** Agentes podem responder perguntas sobre atribuições e folhas
- **Duração Estimada:** Foco em qualidade, não em tempo

### **Sprint 5: Chat e Portal de Clientes (Complementar)**
- Implementar 3 actions (conversas + histórico + portal)
- **Impacto:** Agentes podem buscar conversas e dados do portal
- **Duração Estimada:** Foco em qualidade, não em tempo

### **Sprint 6: Adaptações (FormData → JSON)**
- Criar 7 versões JSON de actions existentes
- **Impacto:** Agentes podem criar/atualizar processos, expedientes, etc. via MCP
- **Duração Estimada:** Foco em qualidade, não em tempo

---

## 📋 Checklist de Implementação por Action

Para cada action a ser implementada:

- [ ] **1. Revisar código fonte existente**
  - Ler arquivo fonte completo
  - Entender parâmetros e retorno
  - Validar se action já está pronta para MCP

- [ ] **2. Criar entrada no registry (`src/lib/mcp/registry.ts`)**
  - Definir nome da tool
  - Definir descrição clara e detalhada
  - Mapear parâmetros para JSON Schema
  - Mapear handler para action existente

- [ ] **3. Escrever testes (se aplicável)**
  - Testar com parâmetros válidos
  - Testar com parâmetros inválidos
  - Testar edge cases

- [ ] **4. Validar via `npm run mcp:check`**
  - Confirmar que action aparece no registry
  - Confirmar que não há erros de validação

- [ ] **5. Testar via cliente MCP**
  - Testar chamada real da tool
  - Validar retorno esperado
  - Validar erros são tratados corretamente

- [ ] **6. Documentar**
  - Atualizar documentação do MCP
  - Adicionar exemplos de uso

---

## 🔍 Actions Já Registradas (Referência)

Para comparação, aqui estão as **51 actions já registradas** no MCP:

### Processos (5)
- ✅ `actionListarProcessos`
- ✅ `actionBuscarProcessoPorNumero`
- ✅ `actionBuscarProcessosPorCPF`
- ✅ `actionBuscarProcessosPorCNPJ`
- ✅ `actionBuscarTimeline`

### Partes (6)
- ✅ `actionListarClientes`
- ✅ `actionBuscarClientePorCPF`
- ✅ `actionBuscarClientePorCNPJ`
- ✅ `actionCriarCliente`
- ✅ `actionAtualizarCliente`
- ✅ `actionListarPartesContrarias`
- ✅ `actionCriarParteContraria`
- ✅ `actionAtualizarParteContraria`
- ✅ `actionListarTerceiros`
- ✅ `actionCriarTerceiro`
- ✅ `actionAtualizarTerceiro`
- ✅ `actionListarRepresentantes`
- ✅ `actionCriarRepresentante`
- ✅ `actionAtualizarRepresentante`

### Audiências (4)
- ✅ `actionListarAudiencias`
- ✅ `actionBuscarAudienciasPorCPF`
- ✅ `actionBuscarAudienciasPorCNPJ`
- ✅ `actionBuscarAudienciasPorNumeroProcesso`
- ✅ `actionCriarAudiencia`
- ✅ `actionCriarAudienciaPayload`
- ✅ `actionAtualizarAudiencia`
- ✅ `actionDeletarAudiencia`

### Financeiro (7)
- ✅ `actionListarLancamentos`
- ✅ `actionCriarLancamento`
- ✅ `actionAtualizarLancamento`
- ✅ `actionConfirmarLancamento`
- ✅ `actionCancelarLancamento`
- ✅ `actionEstornarLancamento`
- ✅ `actionListarPlanoContas`
- ✅ `actionGerarDRE`
- ✅ `actionObterFluxoCaixa`

### Expedientes (3)
- ✅ `actionListarExpedientes`
- ✅ `actionBaixarExpediente`
- ✅ `actionReverterBaixa`

### Contratos (3)
- ✅ `actionListarContratos`
- ✅ `actionBuscarContratosPorCPF`
- ✅ `actionBuscarContratosPorCNPJ`
- ✅ `actionCriarContrato`
- ✅ `actionAtualizarContrato`

### Honorários (3)
- ✅ `actionListarHonorarios`
- ✅ `actionConfirmarRecebimento`
- ✅ `actionCancelarRecebimento`

### Obrigações (9)
- ✅ `actionListarAcordos`
- ✅ `actionCriarAcordo`
- ✅ `actionAtualizarAcordo`
- ✅ `actionListarCondenacoes`
- ✅ `actionCriarCondenacao`
- ✅ `actionAtualizarCondenacao`
- ✅ `actionListarPagamentos`
- ✅ `actionCriarPagamento`
- ✅ `actionAtualizarPagamento`
- ✅ `actionConfirmarPagamento`
- ✅ `actionCancelarPagamento`
- ✅ `actionListarRepasses`
- ✅ `actionListarRepassesPendentes`
- ✅ `actionCriarRepasse`
- ✅ `actionAtualizarRepasse`
- ✅ `actionConfirmarRepasse`
- ✅ `actionCancelarRepasse`

### Usuários (3)
- ✅ `actionListarUsuarios`
- ✅ `actionBuscarPorEmail`
- ✅ `actionBuscarPorCpf`
- ✅ `actionCriarUsuario`
- ✅ `actionAtualizarUsuario`
- ✅ `actionDesativarUsuario`

### Documentos (2)
- ✅ `actionListarDocumentos`
- ✅ `actionListarTemplates`

### Notificações (3)
- ✅ `actionListarNotificacoes`
- ✅ `actionMarcarComoLida`
- ✅ `actionMarcarTodasComoLidas`

### Dashboard (1)
- ✅ `actionObterDashboardFinanceiro`

### Formas de Pagamento (1)
- ✅ `actionListarFormasPagamento`

### Tipos de Expedientes (1)
- ✅ `actionListarTiposExpedientes`

---

## 📝 Observações Finais

### Actions de Busca Semântica são Críticas
As 7 actions de busca semântica (busca + ai features) são **CRÍTICAS** para habilitar agentes de IA. Sem elas, agentes não podem fazer perguntas complexas ou obter contexto RAG.

### Maioria das Actions CRUD Já Estão Registradas
Das 78 actions úteis, **51 já estão registradas** (65%). A maioria das operações de listar, criar, atualizar e operações de negócio já estão disponíveis.

### Foco em Buscas e Integrações
As 27 actions não registradas se concentram em:
- **Busca AI (7 actions)** - Alta prioridade
- **Captura/Integrações (4 actions)** - Média prioridade
- **Usuários/RH (8 actions)** - Média prioridade
- **Documentos/Acervo (4 actions)** - Alta prioridade
- **Chat (2 actions)** - Média prioridade
- **Contratos (1 action)** - Alta prioridade
- **Portal (1 action)** - Baixa prioridade

### Adaptações são Opcionais
As 7 adaptações de FormData → JSON são **opcionais** para a primeira fase. Muitas features já têm versões registradas, sugerindo que já foram adaptadas. Foco inicial deve ser nas 27 actions não registradas.

---

**Próximo documento:** `06-exclusion-rationale.md` - Justificativas detalhadas de exclusão
