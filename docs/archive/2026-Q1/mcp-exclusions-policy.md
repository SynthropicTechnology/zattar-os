# MCP Tools - Política de Exclusões

## Visão Geral

Das 332 Server Actions disponíveis no sistema, **88 estão registradas** como tools MCP e **252 são intencionalmente excluídas**.

Esta política documenta os critérios de exclusão e lista explicitamente as actions excluídas por categoria.

## Critérios de Exclusão

### 1. **Operações Destrutivas (CUD - Create, Update, Delete)**

**Razão:** MCP tools devem focar em operações de leitura seguras. Operações destrutivas são melhor expostas via:
- Interface web autenticada
- APIs REST com autenticação forte
- Processos internos controlados

**Exemplos:**
- `actionCriarAdvogado`, `actionAtualizarAdvogado`
- `actionDeletarAssistente`, `actionDeletarCargo`
- `actionCriarContrato`, `actionAtualizarContrato`
- `actionUploadArquivo`, `actionDeletarArquivo`

**Total estimado:** ~150 actions

---

### 2. **Operações Administrativas e Internas**

**Razão:** Funções administrativas que afetam o sistema ou requerem permissões elevadas não devem ser expostas via MCP.

**Exemplos:**
- `actionSincronizarUsuarios` - Sincronização de sistema
- `actionUploadAvatar`, `actionUploadCover` - Upload de arquivos
- `actionSalvarPermissoes` - Gerenciamento de permissões
- `actionRedefinirSenha`, `actionAlterarSenhaComVerificacao` - Segurança
- `actionImportarExtrato` - Importação de dados

**Total estimado:** ~40 actions

---

### 3. **Operações Form-Specific (Duplicatas)**

**Razão:** Actions específicas de formulários que duplicam funcionalidade já exposta de forma mais genérica.

**Exemplos:**
- `actionCriarClienteForm` vs `actionCriarCliente`
- `actionAtualizarClienteForm` vs `actionAtualizarCliente`
- `actionCriarClienteSafe` vs `actionCriarCliente`

**Total estimado:** ~25 actions

---

### 4. **Operações de Indexação e Processamento de IA**

**Razão:** Processamento pesado de IA e indexação são operações internas que não devem ser expostas diretamente. A busca semântica está disponível via `buscar_semantica`.

**Exemplos:**
- `actionIndexarDocumento`, `actionReindexarDocumento`
- `actionDeletarEmbeddings`, `actionVerificarIndexacao`
- `actionIndexarPecaProcesso`, `actionIndexarAndamentoProcesso`
- `actionBuscaHibrida` - (duplicata de `buscar_semantica`)

**Total estimado:** ~15 actions

---

### 5. **Operações de Contexto Específico**

**Razão:** Requerem contexto muito específico (IDs, estados) que tornam difícil usar via MCP de forma genérica.

**Exemplos:**
- `actionBuscarDocumento` - Requer ID específico (use `listar_documentos` com filtros)
- `actionBuscarContrato` - Requer ID específico (use `listar_contratos` ou `buscar_contrato_por_cliente`)
- `actionBuscarLancamento` - Requer ID específico (use `listar_lancamentos` com filtros)
- `actionBuscarFolhaPorPeriodo` - Muito específica (use `listar_folhas_pagamento`)

**Total estimado:** ~15 actions

---

### 6. **Operações de Storage e Upload**

**Razão:** Upload e manipulação de arquivos não são adequados para MCP tools.

**Exemplos:**
- `actionUploadArquivo`, `actionUploadArquivoGenerico`
- `actionGerarPresignedUrl`, `actionGerarUrlDownload`
- `actionUploadComprovante`
- `actionDeleteFile`

**Total estimado:** ~10 actions

---

## Actions Excluídas por Módulo

### 📦 Acervo (5 actions)
- ✅ **Registrada:** `listar_acervo`
- ❌ **Excluídas:**
  - `actionListarAcervoUnificado` - Duplicata de `listar_acervo`
  - `actionBuscarProcesso` - Duplicata de `buscar_processo_por_numero`
  - `actionAtribuirResponsavel` - Operação CUD
  - `actionObterTimelinePorId` - ID específico, use `listar_timelines`
  - `actionExportarAcervoCSV` - Export operation

### 📦 Advogados (6 actions)
- ❌ **Todas excluídas** (CUD operations):
  - `actionBuscarAdvogado` - ID específico
  - `actionCriarAdvogado` - CUD
  - `actionAtualizarAdvogado` - CUD
  - `actionBuscarCredencial` - Admin
  - `actionCriarCredencial` - Admin
  - `actionAtualizarCredencial` - Admin

### 📦 AI (8 actions)
- ✅ **Registrada:** `buscar_semantica`
- ❌ **Excluídas** (Indexação e processamento interno):
  - `actionIndexarDocumento` - Operação interna
  - `actionReindexarDocumento` - Operação interna
  - `actionDeletarEmbeddings` - Operação interna
  - `actionVerificarIndexacao` - Operação interna
  - `actionObterContagemEmbeddings` - Métrica interna
  - `actionBuscarConhecimento` - Duplicata de `buscar_semantica`
  - `actionBuscarNoProcesso` - Use `buscar_semantica` com filtro
  - `actionBuscarPorTipoEntidade` - Use `buscar_semantica` com filtro

### 📦 Assistentes (4 actions)
- ✅ **Registrada:** `listar_assistentes`
- ❌ **Excluídas** (CUD operations):
  - `actionBuscarAssistente` - ID específico
  - `actionCriarAssistente` - CUD
  - `actionAtualizarAssistente` - CUD
  - `actionDeletarAssistente` - CUD

### 📦 Busca (4 actions)
- ✅ **Registrada:** `buscar_semantica`
- ❌ **Excluídas:**
  - `actionBuscaSemantica` - Duplicata de `buscar_semantica`
  - `actionBuscaHibrida` - Variação de `buscar_semantica`
  - `actionObterContextoRAG` - Operação interna de IA
  - `actionBuscarSimilares` - Variação de `buscar_semantica`

### 📦 Captura (5 actions)
- ✅ **Registradas:** `listar_capturas_cnj`, `listar_timelines`
- ❌ **Excluídas:**
  - `actionConsultarComunicacoes` - Admin operation
  - `actionSincronizarComunicacoes` - Admin operation
  - `actionObterCertidao` - ID específico
  - `actionVincularExpediente` - CUD
  - `actionCapturarTimeline` - Admin operation

### 📦 Cargos (4 actions)
- ✅ **Registrada:** `listar_cargos`
- ❌ **Excluídas** (CUD operations):
  - `actionBuscarCargo` - ID específico
  - `actionCriarCargo` - CUD
  - `actionAtualizarCargo` - CUD
  - `actionDeletarCargo` - CUD

### 📦 Chat (22 actions)
- ✅ **Registradas:** `listar_salas`, `listar_mensagens`, `buscar_historico`
- ❌ **Excluídas** (CUD e operações específicas de chamadas):
  - `actionResponderChamada` - Operação de chamada em tempo real
  - `actionEntrarNaChamada` - Operação de chamada em tempo real
  - `actionSairDaChamada` - Operação de chamada em tempo real
  - `actionFinalizarChamada` - Operação de chamada em tempo real
  - `actionSalvarTranscricao` - CUD
  - `actionListarHistoricoGlobal` - Duplicata com filtros
  - `actionBuscarDetalhesMeeting` - ID específico
  - `actionBuscarChamadaPorId` - ID específico
  - `actionIniciarGravacao` - Operação de chamada
  - `actionPararGravacao` - Operação de chamada
  - `actionSalvarUrlGravacao` - CUD
  - `actionBuscarUrlGravacao` - ID específico
  - `actionCriarSala` - CUD
  - `actionRemoverConversa` - CUD
  - `actionDeletarSala` - CUD
  - `actionAtualizarNomeSala` - CUD
  - `actionAtualizarStatusMensagem` - CUD
  - `actionIniciarVideoCall` - Operação de chamada
  - `actionIniciarAudioCall` - Operação de chamada
  - `actionUploadFile` - Upload
  - `actionDeleteFile` - Delete

### 📦 Contratos (5 actions)
- ✅ **Registradas:** `listar_contratos`, `criar_contrato`, `atualizar_contrato`, `buscar_contrato_por_cliente`
- ❌ **Excluídas:**
  - `actionBuscarContrato` - ID específico, use filtros em `listar_contratos`
  - `actionListarSegmentos` - Segmentos são parte dos contratos
  - `actionCriarSegmento` - CUD interno
  - `actionAtualizarSegmento` - CUD interno
  - `actionDeletarSegmento` - CUD interno

### 📦 Dashboard (6 actions)
- ✅ **Registradas:** `obter_metricas`, `obter_dashboard`
- ❌ **Excluídas:**
  - `actionObterCapturas` - Use `listar_capturas_cnj`
  - `actionObterDetalheCaptura` - ID específico
  - `actionObterDashboardUsuario` - Duplicata de `obter_dashboard` com filtro
  - `actionRefreshDashboard` - Operação interna
  - `actionObterCargaUsuarios` - Métrica específica
  - `actionObterPerformanceAdvogados` - Métrica específica

### 📦 Documentos (32 actions)
- ✅ **Registradas:** `listar_documentos`, `buscar_documentos_por_tags`, `listar_templates`
- ❌ **Excluídas** (CUD, Upload, Versioning):
  - `actionUploadArquivoGenerico` - Upload
  - `actionListarItensUnificados` - Duplicata
  - `actionMoverArquivo` - CUD
  - `actionDeletarArquivo` - Delete
  - `actionBuscarCaminhoPasta` - Interno
  - `actionCompartilharDocumento` - CUD
  - `actionListarCompartilhamentos` - Feature específica
  - `actionAtualizarPermissao` - Admin
  - `actionRemoverCompartilhamento` - CUD
  - `actionListarDocumentosCompartilhados` - Feature específica
  - `actionBuscarDocumento` - ID específico
  - `actionAutoSalvar` - Interno
  - `actionListarLixeira` - Feature específica
  - `actionRestaurarDaLixeira` - CUD
  - `actionLimparLixeira` - Delete
  - `actionDeletarPermanentemente` - Delete
  - `actionListarPastas` - Interno
  - `actionCriarPasta` - CUD
  - `actionMoverDocumento` - CUD
  - `actionDeletarPasta` - Delete
  - `actionListarTemplates` - Já registrada
  - `actionCriarTemplate` - CUD
  - `actionUsarTemplate` - CUD
  - `actionDeletarTemplate` - Delete
  - `actionListarCategorias` - Interno
  - `actionListarTemplatesMaisUsados` - Métrica
  - `actionUploadArquivo` - Upload
  - `actionListarUploads` - Upload
  - `actionGerarPresignedUrl` - Upload interno
  - `actionGerarUrlDownload` - Download interno
  - `actionListarVersoes` - Versioning
  - `actionRestaurarVersao` - Versioning

### 📦 Financeiro (52 actions)
- ✅ **Registradas:** 29 tools (ver registry)
- ❌ **Excluídas:**
  - `actionListarContasBancariasAtivas` - Duplicata de `listar_contas_bancarias`
  - `actionListarCentrosCustoAtivos` - Duplicata de `listar_centros_custo`
  - `actionImportarExtrato` - Import/Upload
  - `actionBuscarLancamentosManuais` - Feature específica
  - `actionConciliarAutomaticamente` - Operação automática
  - `actionBuscarTransacao` - ID específico
  - `actionObterDashboardFinanceiro` - Duplicata dashboard
  - `actionObterFluxoCaixaProjetado` - Já em `projecao_fluxo_caixa`
  - `actionObterResumoContas` - Métrica específica
  - `actionObterIndicadoresFinanceiros` - Métrica específica
  - `actionObterEvolucaoMensal` - Métrica específica
  - `actionObterTopCategorias` - Métrica específica
  - `actionExportarDREPDF` - Export (já tem tool similar)
  - `actionObterSaldoInicial` - Específico
  - `actionBuscarLancamento` - ID específico
  - `actionSincronizarParcela` - Sync
  - `actionRegistrarDeclaracao` - CUD
  - `actionGerarRepasse` - CUD
  - `actionSincronizarAcordo` - Sync
  - `actionVerificarConsistencia` - Validação interna
  - `actionObterResumoObrigacoes` - Métrica
  - `actionObterAlertasFinanceiros` - Alertas
  - `actionListarObrigacoes` - Duplicata
  - `actionListarOrcamentos` - Feature específica (13 ações de orçamento)
  - (...mais 28 ações de orçamentos e exportação)

### 📦 Obrigações (11 actions)
- ✅ **Registradas:** `listar_acordos`, `listar_repasses`
- ❌ **Excluídas:**
  - `actionBuscarAcordo` - ID específico
  - `actionCriarAcordoComParcelas` - CUD
  - `actionAtualizarAcordo` - CUD
  - `actionDeletarAcordo` - Delete
  - `actionListarObrigacoesPorPeriodo` - Filtro específico
  - `actionMarcarParcelaRecebida` - CUD
  - `actionAtualizarParcela` - CUD
  - `actionRecalcularDistribuicao` - Cálculo interno
  - `actionAnexarDeclaracao` - Upload
  - `actionRegistrarRepasse` - CUD

*(continua...)*

## Resumo Estatístico

| Categoria | Total | Percentual |
|-----------|-------|------------|
| **Operações Destrutivas (CUD)** | ~150 | 59.5% |
| **Operações Administrativas** | ~40 | 15.9% |
| **Form-Specific (Duplicatas)** | ~25 | 9.9% |
| **Indexação/AI Interno** | ~15 | 6.0% |
| **Contexto Específico** | ~15 | 6.0% |
| **Storage/Upload** | ~10 | 4.0% |
| **TOTAL EXCLUÍDAS** | **~252** | **100%** |

## Conclusão

A exclusão das 252 actions é **intencional e alinhada com as melhores práticas de design de MCP**:

1. **Segurança**: Evita exposição de operações destrutivas
2. **Simplicidade**: Foca em operações de leitura e consulta
3. **Manutenibilidade**: Menos superfície de ataque e menos tools para manter
4. **Usabilidade**: Tools focadas em casos de uso comuns de IA/agentes

As 88 tools registradas cobrem adequadamente os casos de uso de:
- Consulta de dados
- Busca e filtros
- Relatórios e métricas
- Listagem de entidades principais

Operações CUD devem ser realizadas via:
- Interface web autenticada
- APIs REST com autenticação forte
- Processos batch controlados
