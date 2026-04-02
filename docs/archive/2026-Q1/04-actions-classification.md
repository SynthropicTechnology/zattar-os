# Classificação de Server Actions para MCP

> **Data da Auditoria:** 2025-12-31
> **Critérios Aplicados:** Conforme `03-classification-criteria.md`
> **Total de Actions Avaliadas:** 332

---

## ✅ ÚTEIS (Registrar no MCP)

### Feature: processos

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarProcessos` | Listar | Filtros semânticos (TRT, status, período) | ✅ Registrada |
| `actionBuscarProcessoPorNumero` | Buscar | Identificador externo (número CNJ) | ✅ Registrada |
| `actionBuscarProcessosPorCPF` | Buscar | Identificador externo (CPF cliente) | ✅ Registrada |
| `actionBuscarProcessosPorCNPJ` | Buscar | Identificador externo (CNPJ cliente) | ✅ Registrada |
| `actionBuscarTimeline` | Buscar relacionado | Útil após buscar processo por número/CPF | ✅ Registrada |

**Total: 5 úteis (5 registradas, 0 não registradas)**

---

### Feature: partes

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarClientes` | Listar | Filtros semânticos (busca, tipo_pessoa, ativo) | ✅ Registrada |
| `actionBuscarClientePorCPF` | Buscar | Identificador externo (CPF) | ✅ Registrada |
| `actionBuscarClientePorCNPJ` | Buscar | Identificador externo (CNPJ) | ✅ Registrada |
| `actionListarPartesContrarias` | Listar | Filtros semânticos (busca) | ✅ Registrada |
| `actionListarTerceiros` | Listar | Filtros semânticos (busca) | ✅ Registrada |
| `actionListarRepresentantes` | Listar | Filtros semânticos (busca) | ✅ Registrada |

**Total: 6 úteis (6 registradas, 0 não registradas)**

---

### Feature: financeiro

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarLancamentos` | Listar | Filtros (período, tipo, status, busca) | ✅ Registrada |
| `actionConfirmarLancamento` | Negócio | Operação de confirmação | ✅ Registrada |
| `actionCancelarLancamento` | Negócio | Operação de cancelamento | ✅ Registrada |
| `actionEstornarLancamento` | Negócio | Operação de estorno | ✅ Registrada |
| `actionListarPlanoContas` | Listar | Filtros semânticos | ✅ Registrada |
| `actionGerarDRE` | Relatório | Geração de relatório financeiro | ✅ Registrada |
| `actionObterFluxoCaixa` | Relatório | Agregação de dados financeiros | ✅ Registrada |

**Total: 7 úteis (7 registradas, 0 não registradas)**

---

### Feature: expedientes

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarExpedientes` | Listar | Filtros (responsável, status, prazo) | ✅ Registrada |
| `actionBaixarExpediente` | Negócio | Operação de baixa | ✅ Registrada |
| `actionReverterBaixa` | Negócio | Operação de reversão | ✅ Registrada |

**Total: 3 úteis (3 registradas, 0 não registradas)**

---

### Feature: audiencias

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarAudiencias` | Listar | Filtros (data, processo, status) | ✅ Registrada |
| `actionBuscarAudienciasPorCPF` | Buscar | Identificador externo (CPF) | ✅ Registrada |
| `actionBuscarAudienciasPorCNPJ` | Buscar | Identificador externo (CNPJ) | ✅ Registrada |
| `actionBuscarAudienciasPorNumeroProcesso` | Buscar | Identificador externo (número processo) | ✅ Registrada |

**Total: 4 úteis (4 registradas, 0 não registradas)**

---

### Feature: documentos

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarDocumentos` | Listar | Filtros (pasta, tags, busca textual) | ✅ Registrada |
| `actionListarTemplates` | Listar | Listagem de templates | ✅ Registrada |
| `actionGerarPDF` | Gerar | Geração de documento PDF | ⚠️ Não Registrada |
| `actionGerarDOCX` | Gerar | Geração de documento DOCX | ⚠️ Não Registrada |

**Total: 4 úteis (2 registradas, 2 não registradas)**

---

### Feature: usuarios

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarUsuarios` | Listar | Filtros (cargo, ativo) | ✅ Registrada |
| `actionBuscarPorEmail` | Buscar | Identificador externo (email) | ✅ Registrada |
| `actionBuscarPorCpf` | Buscar | Identificador externo (CPF) | ✅ Registrada |

**Total: 3 úteis (3 registradas, 0 não registradas)**

---

### Feature: obrigacoes

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarAcordos` | Listar | Filtros semânticos | ✅ Registrada |
| `actionListarCondenacoes` | Listar | Filtros semânticos | ✅ Registrada |
| `actionListarPagamentos` | Listar | Filtros semânticos | ✅ Registrada |
| `actionConfirmarPagamento` | Negócio | Operação de confirmação | ✅ Registrada |
| `actionCancelarPagamento` | Negócio | Operação de cancelamento | ✅ Registrada |
| `actionListarRepasses` | Listar | Filtros semânticos | ✅ Registrada |
| `actionListarRepassesPendentes` | Listar | Filtros semânticos | ✅ Registrada |
| `actionConfirmarRepasse` | Negócio | Operação de confirmação | ✅ Registrada |
| `actionCancelarRepasse` | Negócio | Operação de cancelamento | ✅ Registrada |

**Total: 9 úteis (9 registradas, 0 não registradas)**

---

### Feature: dashboard

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionObterDashboardFinanceiro` | Relatório | Métricas agregadas financeiras | ✅ Registrada |

**Total: 1 útil (1 registrada, 0 não registradas)**

---

### Feature: busca

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionBuscaSemantica` | Busca AI | Busca RAG semântica | ⚠️ Não Registrada |
| `actionBuscaHibrida` | Busca AI | Busca híbrida (keyword + semantic) | ⚠️ Não Registrada |
| `actionObterContextoRAG` | Busca AI | Contexto RAG para respostas | ⚠️ Não Registrada |
| `actionBuscarSimilares` | Busca AI | Busca vetorial por similaridade | ⚠️ Não Registrada |

**Total: 4 úteis (0 registradas, 4 não registradas)**

---

### Feature: ai

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionBuscarConhecimento` | Busca AI | Busca em base de conhecimento | ⚠️ Não Registrada |
| `actionBuscarNoProcesso` | Busca AI | Busca semântica em processo específico | ⚠️ Não Registrada |
| `actionBuscarPorTipoEntidade` | Busca AI | Busca semântica por tipo de entidade | ⚠️ Não Registrada |

**Total: 3 úteis (0 registradas, 3 não registradas)**

---

### Feature: contratos

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarContratos` | Listar | Filtros semânticos | ✅ Registrada |
| `actionBuscarContratosPorCPF` | Buscar | Identificador externo (CPF) | ✅ Registrada |
| `actionBuscarContratosPorCNPJ` | Buscar | Identificador externo (CNPJ) | ✅ Registrada |
| `actionListarProcessosVinculados` | Listar | Processos vinculados a contrato | ⚠️ Não Registrada |

**Total: 4 úteis (3 registradas, 1 não registrada)**

---

### Feature: honorarios

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarHonorarios` | Listar | Filtros semânticos | ✅ Registrada |
| `actionConfirmarRecebimento` | Negócio | Operação de confirmação | ✅ Registrada |
| `actionCancelarRecebimento` | Negócio | Operação de cancelamento | ✅ Registrada |

**Total: 3 úteis (3 registradas, 0 não registradas)**

---

### Feature: notificacoes

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarNotificacoes` | Listar | Filtros semânticos | ✅ Registrada |
| `actionMarcarComoLida` | Negócio | Operação de marcação | ✅ Registrada |
| `actionMarcarTodasComoLidas` | Bulk | Operação bulk segura | ✅ Registrada |

**Total: 3 úteis (3 registradas, 0 não registradas)**

---

### Feature: formas-pagamento

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarFormasPagamento` | Listar | Filtros semânticos | ✅ Registrada |

**Total: 1 útil (1 registrada, 0 não registradas)**

---

### Feature: tipos-expedientes

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarTiposExpedientes` | Listar | Filtros semânticos | ✅ Registrada |

**Total: 1 útil (1 registrada, 0 não registradas)**

---

### Feature: acervo

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarAcervoUnificado` | Listar | Listagem unificada de acervo | ⚠️ Não Registrada |
| `actionExportarAcervoCSV` | Exportar | Exportação de acervo | ⚠️ Não Registrada |

**Total: 2 úteis (0 registradas, 2 não registradas)**

---

### Feature: chat

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionListarConversas` | Listar | Filtros semânticos | ⚠️ Não Registrada |
| `actionListarHistoricoGlobal` | Listar | Histórico global de chamadas | ⚠️ Não Registrada |

**Total: 2 úteis (0 registradas, 2 não registradas)**

---

### Feature: clientes-portal

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionBuscarClientePortal` | Buscar | Identificador externo (CPF) | ⚠️ Não Registrada |

**Total: 1 útil (0 registradas, 1 não registrada)**

---

### Feature: rh

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionBuscarFolhaPorPeriodo` | Buscar | Busca por período (filtro semântico) | ⚠️ Não Registrada |
| `actionObterResumoPagamento` | Relatório | Relatório de resumo de pagamento | ⚠️ Não Registrada |
| `actionGerarFolhaPagamento` | Gerar | Geração de folha de pagamento | ⚠️ Não Registrada |

**Total: 3 úteis (0 registradas, 3 não registradas)**

---

### Feature: captura

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionConsultarComunicacoes` | Consultar | Consulta API externa (Comunica CNJ) | ⚠️ Não Registrada |
| `actionSincronizarComunicacoes` | Sincronizar | Sincronização com API externa | ⚠️ Não Registrada |
| `actionObterCertidao` | Obter | Obtenção de certidão via API | ⚠️ Não Registrada |
| `actionCapturarTimeline` | Capturar | Captura de timeline externa | ⚠️ Não Registrada |

**Total: 4 úteis (0 registradas, 4 não registradas)**

---

### Feature: usuarios (atividades)

| Action | Tipo | Justificativa | Status |
|--------|------|---------------|--------|
| `actionBuscarEstatisticasAtividades` | Estatística | Estatísticas de atividades de usuário | ⚠️ Não Registrada |
| `actionBuscarProcessosAtribuidos` | Listar | Processos atribuídos a usuário | ⚠️ Não Registrada |
| `actionBuscarAudienciasAtribuidas` | Listar | Audiências atribuídas a usuário | ⚠️ Não Registrada |
| `actionBuscarPendentesAtribuidos` | Listar | Pendências atribuídas a usuário | ⚠️ Não Registrada |
| `actionBuscarContratosAtribuidos` | Listar | Contratos atribuídos a usuário | ⚠️ Não Registrada |

**Total: 5 úteis (0 registradas, 5 não registradas)**

---

## 📊 Resumo de Actions ÚTEIS

| Feature | Total Úteis | Registradas | Não Registradas |
|---------|-------------|-------------|-----------------|
| **processos** | 5 | 5 | 0 |
| **partes** | 6 | 6 | 0 |
| **financeiro** | 7 | 7 | 0 |
| **expedientes** | 3 | 3 | 0 |
| **audiencias** | 4 | 4 | 0 |
| **documentos** | 4 | 2 | 2 |
| **usuarios** | 3 | 3 | 0 |
| **obrigacoes** | 9 | 9 | 0 |
| **dashboard** | 1 | 1 | 0 |
| **busca** | 4 | 0 | 4 |
| **ai** | 3 | 0 | 3 |
| **contratos** | 4 | 3 | 1 |
| **honorarios** | 3 | 3 | 0 |
| **notificacoes** | 3 | 3 | 0 |
| **formas-pagamento** | 1 | 1 | 0 |
| **tipos-expedientes** | 1 | 1 | 0 |
| **acervo** | 2 | 0 | 2 |
| **chat** | 2 | 0 | 2 |
| **clientes-portal** | 1 | 0 | 1 |
| **rh** | 3 | 0 | 3 |
| **captura** | 4 | 0 | 4 |
| **usuarios** (atividades) | 5 | 0 | 5 |
| **TOTAL** | **78** | **51** | **27** |

---

## ❌ INÚTEIS (NÃO Registrar no MCP)

### Buscar por ID Interno

| Feature | Action | Motivo |
|---------|--------|--------|
| **usuarios** | `actionBuscarUsuario(id)` | Busca por ID interno |
| **documentos** | `actionBuscarDocumento(id)` | Busca por ID interno |
| **partes** | `actionBuscarCliente(id)` | Busca por ID interno |
| **partes** | `actionBuscarParteContraria(id)` | Busca por ID interno |
| **partes** | `actionBuscarTerceiro(id)` | Busca por ID interno |
| **partes** | `actionBuscarRepresentante(id)` | Busca por ID interno |
| **processos** | `actionBuscarProcesso(id)` | Busca por ID interno |
| **audiencias** | *(não há - já tem versões por CPF/CNPJ)* | - |
| **expedientes** | `actionBuscarExpediente(id)` | Busca por ID interno |
| **financeiro** | `actionBuscarLancamento(id)` | Busca por ID interno |
| **financeiro** | `actionBuscarContaPlano(id)` | Busca por ID interno |
| **contratos** | `actionBuscarContrato(id)` | Busca por ID interno |
| **contratos** | `actionBuscarDocumentoContrato(id)` | Busca por ID interno |
| **honorarios** | `actionBuscarHonorario(id)` | Busca por ID interno |
| **obrigacoes** | `actionBuscarAcordo(id)` | Busca por ID interno |
| **obrigacoes** | `actionBuscarCondenacao(id)` | Busca por ID interno |
| **obrigacoes** | `actionBuscarPagamento(id)` | Busca por ID interno |
| **obrigacoes** | `actionBuscarRepasse(id)` | Busca por ID interno |
| **notificacoes** | `actionBuscarNotificacao(id)` | Busca por ID interno |
| **formas-pagamento** | `actionBuscarFormaPagamento(id)` | Busca por ID interno |
| **tipos-expedientes** | `actionBuscarTipoExpediente(id)` | Busca por ID interno |
| **cargos** | `actionBuscarCargo(id)` | Busca por ID interno |
| **advogados** | `actionBuscarAdvogado(id)` | Busca por ID interno |
| **advogados** | `actionBuscarCredencial(id)` | Busca por ID interno |
| **assistentes** | `actionBuscarAssistente(id)` | Busca por ID interno |
| **acervo** | `actionBuscarProcesso(id)` | Busca por ID interno |
| **chat** | `actionBuscarConversa(id)` | Busca por ID interno |
| **chat** | `actionBuscarDetalhesMeeting(id)` | Busca por ID interno |
| **chat** | `actionBuscarChamadaPorId(id)` | Busca por ID interno |
| **documentos** | `actionBuscarPasta(id)` | Busca por ID interno |
| **documentos** | `actionBuscarTemplate(id)` | Busca por ID interno |
| **rh** | `actionBuscarFolhaPagamento(id)` | Busca por ID interno |
| **rh** | `actionBuscarSalario(id)` | Busca por ID interno |
| **profiles** | *(avaliado separadamente)* | - |

**Total: ~35 actions**

---

### Upload de Arquivos

| Feature | Action | Motivo |
|---------|--------|--------|
| **usuarios** | `actionUploadAvatar` | Upload de arquivo binário |
| **usuarios** | `actionUploadCover` | Upload de arquivo binário |
| **documentos** | `actionUploadArquivo` | Upload de arquivo binário |
| **financeiro** | `actionUploadComprovante` | Upload de arquivo binário |
| **contratos** | `actionUploadDocumento` | Upload de arquivo binário |
| **chat** | `actionUploadFile` | Upload de arquivo binário |

**Total: 6 actions**

---

### Auto-Save e Operações de UI

| Feature | Action | Motivo |
|---------|--------|--------|
| **documentos** | `actionAutoSalvar` | Operação de UI (auto-save) |
| **usuarios** | `actionAlterarSenhaComVerificacao` | Operação de UI/autenticação |

**Total: 2 actions**

---

### Autenticação/Sessão

| Feature | Action | Motivo |
|---------|--------|--------|
| **portal-cliente** | `actionLoginPortal` | Autenticação/sessão |
| **portal-cliente** | `actionLogout` | Autenticação/sessão |

**Total: 2 actions**

---

### Operações Internas de Indexação (AI)

| Feature | Action | Motivo |
|---------|--------|--------|
| **processos** | `actionIndexarPecaProcesso` | Operação interna (AI indexing) |
| **processos** | `actionIndexarAndamentoProcesso` | Operação interna (AI indexing) |
| **processos** | `actionReindexarProcesso` | Operação interna (AI indexing) |
| **ai** | `actionIndexarDocumento` | Operação interna (AI indexing) |
| **ai** | `actionReindexarDocumento` | Operação interna (AI indexing) |
| **ai** | `actionDeletarEmbeddings` | Operação interna (AI indexing) |
| **ai** | `actionVerificarIndexacao` | Verificação interna |
| **ai** | `actionObterContagemEmbeddings` | Estatística interna |
| **indexador** | `actionIndexarProcesso` | Operação interna (AI indexing) |
| **indexador** | `actionReindexarProcesso` | Operação interna (AI indexing) |
| **indexador** | `actionDeletarIndiceProcesso` | Operação interna (AI indexing) |
| **indexador** | `actionVerificarIndexacaoProcesso` | Verificação interna |
| **indexador** | `actionObterEstatisticasIndexacao` | Estatística interna |

**Total: 13 actions**

---

### Operações de Remoção/Deletar

| Feature | Action | Motivo |
|---------|--------|--------|
| **usuarios** | `actionRemoverAvatar` | Operação de deletar (UI) |
| **usuarios** | `actionRemoverCover` | Operação de deletar (UI) |
| **financeiro** | `actionRemoverComprovante` | Operação de deletar |
| **notificacoes** | `actionDeletarNotificacao` | Operação de deletar individual |
| **notificacoes** | `actionDeletarTodasLidas` | Operação destrutiva bulk |

**Total: 5 actions (avaliar caso a caso)**

---

### Operações Muito Específicas

| Feature | Action | Motivo |
|---------|--------|--------|
| **acervo** | `actionAtribuirResponsavel` | Muito específica, requer IDs |
| **acervo** | `actionObterTimelinePorId` | Busca por ID interno |
| **expedientes** | `actionAtribuirResponsavel` | Muito específica, requer IDs |
| **expedientes** | `actionRemoverResponsavel` | Muito específica, requer IDs |
| **contratos** | `actionVincularProcesso` | Requer IDs de ambas entidades |
| **contratos** | `actionDesvincularProcesso` | Requer IDs de ambas entidades |
| **captura** | `actionVincularExpediente` | Requer IDs de ambas entidades |
| **chat** | `actionMarcarComoLida` | Requer ID de conversa |
| **chat** | `actionResponderChamada` | Operação de negócio tempo-real |
| **chat** | `actionEntrarNaChamada` | Operação de negócio tempo-real |
| **chat** | `actionSairDaChamada` | Operação de negócio tempo-real |
| **chat** | `actionFinalizarChamada` | Operação de negócio tempo-real |
| **chat** | `actionIniciarGravacao` | Operação de negócio tempo-real |
| **chat** | `actionPararGravacao` | Operação de negócio tempo-real |
| **chat** | `actionSalvarUrlGravacao` | Operação interna |
| **chat** | `actionBuscarUrlGravacao` | Busca muito específica |
| **chat** | `actionSalvarTranscricao` | Operação interna |
| **usuarios** | `actionSalvarPermissoes` | Operação sensível de autorização |
| **usuarios** | `actionRedefinirSenha` | Operação sensível |
| **usuarios** | `actionAtualizarSenhaServer` | Operação interna |
| **usuarios** | `actionSincronizarUsuarios` | Operação de sincronização interna |
| **usuarios** | `actionBuscarAuthLogs` | Logs de auditoria (sensível) |
| **clientes-portal** | `actionEnviarConvite` | Operação de negócio específica |
| **clientes-portal** | `actionReenviarConvite` | Operação de negócio específica |
| **clientes-portal** | `actionDesativarAcesso` | Operação sensível |
| **clientes-portal** | `actionReativarAcesso` | Operação sensível |
| **documentos** | `actionMoverDocumento` | Requer ID e contexto de pastas |
| **rh** | `actionAprovarFolhaPagamento` | Operação sensível |
| **rh** | `actionPagarFolhaPagamento` | Operação sensível |
| **rh** | `actionCancelarFolhaPagamento` | Operação sensível |
| **rh** | `actionExcluirFolhaPagamento` | Operação destrutiva |
| **rh** | `actionEncerrarVigenciaSalario` | Operação sensível |
| **rh** | `actionInativarSalario` | Operação sensível |
| **rh** | `actionExcluirSalario` | Operação destrutiva |
| **profiles** | `actionBuscarAtividadesPorEntidade` | Muito específica, requer ID + tipo |

**Total: ~35 actions**

---

## 📊 Resumo de Actions INÚTEIS

| Categoria | Total |
|-----------|-------|
| **Buscar por ID Interno** | ~35 |
| **Upload de Arquivos** | 6 |
| **Auto-Save e UI** | 2 |
| **Autenticação/Sessão** | 2 |
| **Indexação Interna (AI)** | 13 |
| **Operações de Remoção** | 5 |
| **Operações Específicas** | ~35 |
| **Operações Deletar (Destrutivas)** | 22 |
| **Operações Duplicação** | 2 |
| **Criar/Atualizar/Outras (não adaptáveis)** | ~95 |
| **TOTAL INÚTEIS** | **~217** |

---

## 🔄 REQUER ADAPTAÇÃO

### Criar/Atualizar com FormData (sem upload de arquivos)

| Feature | Action Original | Versão Adaptada Necessária | Prioridade |
|---------|----------------|---------------------------|------------|
| **processos** | `actionCriarProcesso(formData)` | `actionCriarProcessoPayload(payload)` | Alta |
| **processos** | `actionAtualizarProcesso(id, formData)` | `actionAtualizarProcessoPayload(id, payload)` | Alta |
| **partes** | `actionCriarCliente(formData)` | *(Já registrada)* | - |
| **partes** | `actionAtualizarCliente(id, formData)` | *(Já registrada)* | - |
| **partes** | `actionCriarParteContraria(formData)` | *(Já registrada)* | - |
| **partes** | `actionAtualizarParteContraria(id, formData)` | *(Já registrada)* | - |
| **partes** | `actionCriarTerceiro(formData)` | *(Já registrada)* | - |
| **partes** | `actionAtualizarTerceiro(id, formData)` | *(Já registrada)* | - |
| **partes** | `actionCriarRepresentante(formData)` | *(Já registrada)* | - |
| **partes** | `actionAtualizarRepresentante(id, formData)` | *(Já registrada)* | - |
| **expedientes** | `actionCriarExpediente(formData)` | `actionCriarExpedientePayload(payload)` | Média |
| **expedientes** | `actionAtualizarExpediente(id, formData)` | `actionAtualizarExpedientePayload(id, payload)` | Média |
| **audiencias** | `actionCriarAudiencia(formData)` | `actionCriarAudienciaPayload(payload)` ✅ | - |
| **audiencias** | `actionAtualizarAudiencia(id, formData)` | `actionAtualizarAudienciaPayload(id, payload)` | Média |
| **financeiro** | `actionCriarLancamento(formData)` | *(Já registrada)* | - |
| **financeiro** | `actionAtualizarLancamento(id, formData)` | *(Já registrada)* | - |
| **contratos** | `actionCriarContrato(formData)` | *(Já registrada)* | - |
| **contratos** | `actionAtualizarContrato(id, formData)` | *(Já registrada)* | - |
| **documentos** | `actionCriarDocumento(formData)` | `actionCriarDocumentoPayload(payload)` | Baixa |
| **documentos** | `actionAtualizarDocumento(id, formData)` | `actionAtualizarDocumentoPayload(id, payload)` | Baixa |
| **obrigacoes** | `actionCriarAcordo(formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionAtualizarAcordo(id, formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionCriarCondenacao(formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionAtualizarCondenacao(id, formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionCriarPagamento(formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionAtualizarPagamento(id, formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionCriarRepasse(formData)` | *(Já registrada)* | - |
| **obrigacoes** | `actionAtualizarRepasse(id, formData)` | *(Já registrada)* | - |

**Total: 4 adaptações necessárias (prioridade alta/média)**

**Observação:** A maioria das actions de criar/atualizar já estão registradas, o que indica que elas já aceitam JSON ou têm versões adaptadas.

---

### Operações Deletar (Avaliar Caso a Caso)

| Feature | Action | Avaliação | Decisão |
|---------|--------|-----------|---------|
| **partes** | `actionDeletarCliente(id)` | Destrutiva, requer ID | ❌ Inútil |
| **partes** | `actionDeletarParteContraria(id)` | Destrutiva, requer ID | ❌ Inútil |
| **partes** | `actionDeletarTerceiro(id)` | Destrutiva, requer ID | ❌ Inútil |
| **partes** | `actionDeletarRepresentante(id)` | Destrutiva, requer ID | ❌ Inútil |
| **expedientes** | `actionDeletarExpediente(id)` | Destrutiva, requer ID | ❌ Inútil |
| **audiencias** | `actionDeletarAudiencia(id)` | Destrutiva, requer ID | ❌ Inútil |
| **financeiro** | `actionDeletarLancamento(id)` | Destrutiva, requer ID | ❌ Inútil |
| **financeiro** | `actionDeletarContaPlano(id)` | Destrutiva, requer ID | ❌ Inútil |
| **contratos** | `actionDeletarContrato(id)` | Destrutiva, requer ID | ❌ Inútil |
| **contratos** | `actionDeletarDocumentoContrato(id)` | Destrutiva, requer ID | ❌ Inútil |
| **documentos** | `actionDeletarDocumento(id)` | Destrutiva, requer ID | ❌ Inútil |
| **documentos** | `actionDeletarPasta(id)` | Destrutiva, requer ID | ❌ Inútil |
| **documentos** | `actionDeletarTemplate(id)` | Destrutiva, requer ID | ❌ Inútil |
| **obrigacoes** | `actionDeletarAcordo(id)` | Destrutiva, requer ID | ❌ Inútil |
| **obrigacoes** | `actionDeletarCondenacao(id)` | Destrutiva, requer ID | ❌ Inútil |
| **obrigacoes** | `actionDeletarPagamento(id)` | Destrutiva, requer ID | ❌ Inútil |
| **obrigacoes** | `actionDeletarRepasse(id)` | Destrutiva, requer ID | ❌ Inútil |
| **honorarios** | `actionDeletarHonorario(id)` | Destrutiva, requer ID | ❌ Inútil |
| **formas-pagamento** | `actionDeletarFormaPagamento(id)` | Destrutiva, requer ID | ❌ Inútil |
| **tipos-expedientes** | `actionDeletarTipoExpediente(id)` | Destrutiva, requer ID | ❌ Inútil |
| **cargos** | `actionDeletarCargo(id)` | Destrutiva, requer ID | ❌ Inútil |
| **assistentes** | `actionDeletarAssistente(id)` | Destrutiva, requer ID | ❌ Inútil |

**Decisão Geral:** Operações de deletar são muito destrutivas e requerem IDs internos. **NÃO devem** ser expostas via MCP. Agentes não devem ter poder de deletar entidades.

---

### Operações de Exportação (Avaliar Caso a Caso)

| Feature | Action | Avaliação | Decisão |
|---------|--------|-----------|---------|
| **acervo** | `actionExportarAcervoCSV(params)` | Exportação de dados | ✅ Útil |
| **financeiro** | `actionExportarDRE(params, formato)` | Exportação de relatório | 🔄 Adaptar (avaliar formato) |
| **financeiro** | `actionExportarFluxoCaixa(params, formato)` | Exportação de relatório | 🔄 Adaptar (avaliar formato) |

**Decisão:** Exportações podem ser úteis se retornarem dados em formato legível (JSON, CSV como texto). Avaliar implementação.

---

### Operações de Duplicação

| Feature | Action | Avaliação | Decisão |
|---------|--------|-----------|---------|
| **documentos** | `actionDuplicarDocumento(id)` | Requer ID, mas útil | 🔄 Adaptar? |
| **documentos** | `actionDuplicarTemplate(id)` | Requer ID, mas útil | 🔄 Adaptar? |

**Decisão:** Duplicação requer ID interno. **Inútil** para MCP.

---

## 📊 Resumo Geral de Classificação

| Classificação | Total | % do Total |
|---------------|-------|------------|
| ✅ **ÚTIL** | **78** | 23.5% |
| ❌ **INÚTIL** | **~216** | 65.1% |
| 🔄 **REQUER ADAPTAÇÃO** | **~38** | 11.4% |
| **TOTAL AVALIADO** | **332** | 100% |

### Breakdown de ÚTIL por Status

| Status | Total | % de Úteis |
|--------|-------|------------|
| ✅ **Já Registradas** | 51 | 65.4% |
| ⚠️ **Não Registradas (Implementar)** | 27 | 34.6% |
| **TOTAL ÚTEIS** | **78** | 100% |

---

## 🎯 Próximas Actions

1. **Revisar 27 actions úteis não registradas** - Decidir quais implementar na próxima fase
2. **Priorizar adaptações** - 4 adaptações de alta/média prioridade (Processos, Expedientes, Audiências)
3. **Criar lista priorizada de implementação** - Fase 1 (alta), Fase 2 (média), Fase 3 (baixa)
4. **Documentar justificativas de exclusão** - Explicar por que cada categoria foi excluída

---

**Próximo documento:** `05-implementation-priority.md` - Lista priorizada de implementação
