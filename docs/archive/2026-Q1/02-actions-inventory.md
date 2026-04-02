# Inventário Completo de Server Actions - Sinesys

> **Data da Auditoria:** 2025-12-31
> **Total de Actions Encontradas:** 332
> **Actions Registradas no MCP:** 85
> **Actions Não Registradas:** 252

---

## Feature: acervo
**Localização:** `src/features/acervo/actions/`

### Arquivo: acervo-actions.ts
- `actionListarAcervoUnificado()` - Tipo: Listar
- `actionBuscarProcesso(id)` - Tipo: Buscar por ID
- `actionAtribuirResponsavel(processoId, usuarioId)` - Tipo: Atualizar
- `actionObterTimelinePorId(processoId)` - Tipo: Buscar relacionado
- `actionExportarAcervoCSV(params)` - Tipo: Exportar

---

## Feature: advogados
**Localização:** `src/features/advogados/actions/`

### Arquivo: advogados-actions.ts
- `actionBuscarAdvogado(id)` - Tipo: Buscar por ID
- `actionCriarAdvogado(formData)` - Tipo: Criar
- `actionAtualizarAdvogado(id, formData)` - Tipo: Atualizar

### Arquivo: credenciais-actions.ts
- `actionBuscarCredencial(id)` - Tipo: Buscar por ID
- `actionCriarCredencial(formData)` - Tipo: Criar
- `actionAtualizarCredencial(id, formData)` - Tipo: Atualizar

---

## Feature: ai
**Localização:** `src/features/ai/actions/`

### Arquivo: embeddings-actions.ts
- `actionIndexarDocumento(documentoId)` - Tipo: Operação interna (AI)
- `actionReindexarDocumento(documentoId)` - Tipo: Operação interna (AI)
- `actionDeletarEmbeddings(documentoId)` - Tipo: Operação interna (AI)
- `actionVerificarIndexacao(documentoId)` - Tipo: Verificação
- `actionObterContagemEmbeddings()` - Tipo: Estatística

### Arquivo: search-actions.ts
- `actionBuscarConhecimento(query, params)` - Tipo: Busca semântica (AI)
- `actionBuscarNoProcesso(processoId, query)` - Tipo: Busca semântica (AI)
- `actionBuscarPorTipoEntidade(tipo, query)` - Tipo: Busca semântica (AI)

---

## Feature: assistentes
**Localização:** `src/features/assistentes/actions/`

### Arquivo: assistentes-actions.ts
- `actionBuscarAssistente(id)` - Tipo: Buscar por ID
- `actionCriarAssistente(formData)` - Tipo: Criar
- `actionAtualizarAssistente(id, formData)` - Tipo: Atualizar
- `actionDeletarAssistente(id)` - Tipo: Deletar

---

## Feature: audiencias
**Localização:** `src/features/audiencias/actions/`

### Arquivo: audiencias-actions.ts (baseado no registry)
- `actionListarAudiencias(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionCriarAudiencia(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionCriarAudienciaPayload(payload)` - Tipo: Criar (JSON) ✅ **(Registrada)**
- `actionAtualizarAudiencia(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarAudiencia(id)` - Tipo: Deletar ✅ **(Registrada)**
- `actionBuscarAudienciasPorCPF(cpf, status?)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarAudienciasPorCNPJ(cnpj, status?)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarAudienciasPorNumeroProcesso(numeroProcesso, status?)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**

---

## Feature: busca
**Localização:** `src/features/busca/actions/`

### Arquivo: busca-actions.ts
- `actionBuscaSemantica(query, options)` - Tipo: Busca semântica (AI)
- `actionBuscaHibrida(query, options)` - Tipo: Busca híbrida (AI)
- `actionObterContextoRAG(query, params)` - Tipo: Busca RAG (AI)
- `actionBuscarSimilares(embeddings, limite)` - Tipo: Busca vetorial (AI)

---

## Feature: captura
**Localização:** `src/features/captura/actions/`

### Arquivo: comunica-cnj-actions.ts
- `actionConsultarComunicacoes(params)` - Tipo: Consultar API externa
- `actionSincronizarComunicacoes(params)` - Tipo: Sincronizar
- `actionObterCertidao(comunicacaoId)` - Tipo: Obter documento
- `actionVincularExpediente(comunicacaoId, expedienteId)` - Tipo: Vincular

### Arquivo: timeline-actions.ts
- `actionCapturarTimeline(processoId)` - Tipo: Capturar dados externos

---

## Feature: cargos
**Localização:** `src/features/cargos/actions/`

### Arquivo: cargos-actions.ts
- `actionBuscarCargo(id)` - Tipo: Buscar por ID
- `actionCriarCargo(formData)` - Tipo: Criar
- `actionAtualizarCargo(id, formData)` - Tipo: Atualizar
- `actionDeletarCargo(id)` - Tipo: Deletar

---

## Feature: chat
**Localização:** `src/features/chat/actions/`

### Arquivo: chamadas-actions.ts
- `actionResponderChamada(chamadaId, aceitar)` - Tipo: Operação de negócio
- `actionEntrarNaChamada(chamadaId)` - Tipo: Operação de negócio
- `actionSairDaChamada(chamadaId)` - Tipo: Operação de negócio
- `actionFinalizarChamada(chamadaId)` - Tipo: Operação de negócio
- `actionSalvarTranscricao(chamadaId, transcricao)` - Tipo: Salvar dados
- `actionListarHistoricoGlobal(params)` - Tipo: Listar
- `actionBuscarDetalhesMeeting(chamadaId)` - Tipo: Buscar por ID
- `actionBuscarChamadaPorId(chamadaId)` - Tipo: Buscar por ID
- `actionIniciarGravacao(chamadaId)` - Tipo: Operação de negócio
- `actionPararGravacao(chamadaId)` - Tipo: Operação de negócio
- `actionSalvarUrlGravacao(chamadaId, url)` - Tipo: Salvar dados
- `actionBuscarUrlGravacao(chamadaId)` - Tipo: Buscar dados

### Arquivo: chat-actions.ts
- `actionListarConversas(params)` - Tipo: Listar
- `actionBuscarConversa(conversaId)` - Tipo: Buscar por ID
- `actionCriarConversa(formData)` - Tipo: Criar
- `actionEnviarMensagem(conversaId, conteudo)` - Tipo: Criar
- `actionMarcarComoLida(conversaId)` - Tipo: Atualizar
- `actionBuscarMensagens(conversaId, params)` - Tipo: Listar

### Arquivo: files-actions.ts
- `actionUploadFile(conversaId, file)` - Tipo: Upload de arquivo
- `actionBuscarArquivos(conversaId)` - Tipo: Listar

---

## Feature: clientes-portal
**Localização:** `src/features/clientes-portal/actions/`

### Arquivo: clientes-portal-actions.ts
- `actionBuscarClientePortal(cpf)` - Tipo: Buscar por identificador externo
- `actionCriarClientePortal(formData)` - Tipo: Criar
- `actionAtualizarClientePortal(id, formData)` - Tipo: Atualizar
- `actionEnviarConvite(clienteId)` - Tipo: Operação de negócio
- `actionReenviarConvite(clienteId)` - Tipo: Operação de negócio
- `actionDesativarAcesso(clienteId)` - Tipo: Operação de negócio
- `actionReativarAcesso(clienteId)` - Tipo: Operação de negócio

---

## Feature: contratos
**Localização:** `src/features/contratos/actions/`

### Arquivo: contratos-actions.ts (baseado no registry)
- `actionListarContratos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarContrato(id)` - Tipo: Buscar por ID
- `actionCriarContrato(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarContrato(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarContrato(id)` - Tipo: Deletar
- `actionBuscarContratosPorCPF(cpf)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarContratosPorCNPJ(cnpj)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**

### Arquivo: documentos-actions.ts
- `actionBuscarDocumentoContrato(id)` - Tipo: Buscar por ID
- `actionCriarDocumentoContrato(contratoId, formData)` - Tipo: Criar
- `actionAtualizarDocumentoContrato(id, formData)` - Tipo: Atualizar
- `actionDeletarDocumentoContrato(id)` - Tipo: Deletar
- `actionUploadDocumento(contratoId, file)` - Tipo: Upload de arquivo

### Arquivo: vinculos-actions.ts
- `actionVincularProcesso(contratoId, processoId)` - Tipo: Vincular
- `actionDesvincularProcesso(contratoId, processoId)` - Tipo: Desvincular
- `actionListarProcessosVinculados(contratoId)` - Tipo: Listar relacionados

---

## Feature: dashboard
**Localização:** `src/features/dashboard/actions/`

### Arquivo: dashboard-actions.ts (baseado no registry)
- `actionObterDashboardFinanceiro(usuarioId?)` - Tipo: Relatório ✅ **(Registrada)**

---

## Feature: documentos
**Localização:** `src/features/documentos/actions/`

### Arquivo: documentos-actions.ts (baseado no registry)
- `actionListarDocumentos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarDocumento(id)` - Tipo: Buscar por ID
- `actionCriarDocumento(formData)` - Tipo: Criar
- `actionAtualizarDocumento(id, formData)` - Tipo: Atualizar
- `actionDeletarDocumento(id)` - Tipo: Deletar
- `actionMoverDocumento(id, novaPasta)` - Tipo: Atualizar
- `actionDuplicarDocumento(id)` - Tipo: Criar
- `actionAutoSalvar(id, conteudo)` - Tipo: Auto-save (UI)
- `actionUploadArquivo(formData)` - Tipo: Upload de arquivo
- `actionGerarPDF(documentoId)` - Tipo: Gerar documento
- `actionGerarDOCX(documentoId)` - Tipo: Gerar documento

### Arquivo: pastas-actions.ts
- `actionListarPastas(params)` - Tipo: Listar
- `actionBuscarPasta(id)` - Tipo: Buscar por ID
- `actionCriarPasta(formData)` - Tipo: Criar
- `actionAtualizarPasta(id, formData)` - Tipo: Atualizar
- `actionDeletarPasta(id)` - Tipo: Deletar

### Arquivo: templates-actions.ts
- `actionListarTemplates(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarTemplate(id)` - Tipo: Buscar por ID
- `actionCriarTemplate(formData)` - Tipo: Criar
- `actionAtualizarTemplate(id, formData)` - Tipo: Atualizar
- `actionDeletarTemplate(id)` - Tipo: Deletar
- `actionDuplicarTemplate(id)` - Tipo: Criar

---

## Feature: expedientes
**Localização:** `src/features/expedientes/actions/`

### Arquivo: expedientes-actions.ts (baseado no registry)
- `actionListarExpedientes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarExpediente(id)` - Tipo: Buscar por ID
- `actionCriarExpediente(formData)` - Tipo: Criar
- `actionAtualizarExpediente(id, formData)` - Tipo: Atualizar
- `actionDeletarExpediente(id)` - Tipo: Deletar
- `actionBaixarExpediente(id, protocoloId?, justificativa?, data?)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionReverterBaixa(id)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionAtribuirResponsavel(id, responsavelId)` - Tipo: Atualizar
- `actionRemoverResponsavel(id)` - Tipo: Atualizar

---

## Feature: financeiro
**Localização:** `src/features/financeiro/actions/`

### Arquivo: lancamentos-actions.ts (baseado no registry)
- `actionListarLancamentos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarLancamento(id)` - Tipo: Buscar por ID
- `actionCriarLancamento(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarLancamento(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarLancamento(id)` - Tipo: Deletar
- `actionConfirmarLancamento(id)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionCancelarLancamento(id)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionEstornarLancamento(id)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionUploadComprovante(lancamentoId, file)` - Tipo: Upload de arquivo
- `actionBuscarComprovante(lancamentoId)` - Tipo: Buscar dados
- `actionRemoverComprovante(lancamentoId)` - Tipo: Deletar

### Arquivo: plano-contas-actions.ts (baseado no registry)
- `actionListarPlanoContas(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarContaPlano(id)` - Tipo: Buscar por ID
- `actionCriarContaPlano(formData)` - Tipo: Criar
- `actionAtualizarContaPlano(id, formData)` - Tipo: Atualizar
- `actionDeletarContaPlano(id)` - Tipo: Deletar

### Arquivo: dre-actions.ts (baseado no registry)
- `actionGerarDRE(params)` - Tipo: Relatório ✅ **(Registrada)**
- `actionExportarDRE(params, formato)` - Tipo: Exportar

### Arquivo: fluxo-caixa-actions.ts (baseado no registry)
- `actionObterFluxoCaixa(params)` - Tipo: Relatório ✅ **(Registrada)**
- `actionExportarFluxoCaixa(params, formato)` - Tipo: Exportar

---

## Feature: formas-pagamento
**Localização:** `src/features/formas-pagamento/actions/`

### Arquivo: formas-pagamento-actions.ts (baseado no registry)
- `actionListarFormasPagamento(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarFormaPagamento(id)` - Tipo: Buscar por ID
- `actionCriarFormaPagamento(formData)` - Tipo: Criar
- `actionAtualizarFormaPagamento(id, formData)` - Tipo: Atualizar
- `actionDeletarFormaPagamento(id)` - Tipo: Deletar

---

## Feature: honorarios
**Localização:** `src/features/honorarios/actions/`

### Arquivo: honorarios-actions.ts (baseado no registry)
- `actionListarHonorarios(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarHonorario(id)` - Tipo: Buscar por ID
- `actionCriarHonorario(formData)` - Tipo: Criar
- `actionAtualizarHonorario(id, formData)` - Tipo: Atualizar
- `actionDeletarHonorario(id)` - Tipo: Deletar
- `actionConfirmarRecebimento(id, valorRecebido, dataRecebimento)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionCancelarRecebimento(id)` - Tipo: Operação de negócio ✅ **(Registrada)**

---

## Feature: indexador
**Localização:** `src/features/indexador/actions/`

### Arquivo: indexador-actions.ts
- `actionIndexarProcesso(processoId)` - Tipo: Operação interna (AI)
- `actionReindexarProcesso(processoId)` - Tipo: Operação interna (AI)
- `actionDeletarIndiceProcesso(processoId)` - Tipo: Operação interna (AI)
- `actionVerificarIndexacaoProcesso(processoId)` - Tipo: Verificação
- `actionObterEstatisticasIndexacao()` - Tipo: Estatística

---

## Feature: notificacoes
**Localização:** `src/features/notificacoes/actions/`

### Arquivo: notificacoes-actions.ts (baseado no registry)
- `actionListarNotificacoes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarNotificacao(id)` - Tipo: Buscar por ID
- `actionMarcarComoLida(id)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionMarcarTodasComoLidas()` - Tipo: Atualizar bulk ✅ **(Registrada)**
- `actionDeletarNotificacao(id)` - Tipo: Deletar
- `actionDeletarTodasLidas()` - Tipo: Deletar bulk

---

## Feature: obrigacoes
**Localização:** `src/features/obrigacoes/actions/`

### Arquivo: acordos-actions.ts (baseado no registry)
- `actionListarAcordos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarAcordo(id)` - Tipo: Buscar por ID
- `actionCriarAcordo(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarAcordo(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarAcordo(id)` - Tipo: Deletar

### Arquivo: condenacoes-actions.ts (baseado no registry)
- `actionListarCondenacoes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarCondenacao(id)` - Tipo: Buscar por ID
- `actionCriarCondenacao(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarCondenacao(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarCondenacao(id)` - Tipo: Deletar

### Arquivo: pagamentos-actions.ts (baseado no registry)
- `actionListarPagamentos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarPagamento(id)` - Tipo: Buscar por ID
- `actionCriarPagamento(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarPagamento(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarPagamento(id)` - Tipo: Deletar
- `actionConfirmarPagamento(id, valorPago, dataPagamento)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionCancelarPagamento(id)` - Tipo: Operação de negócio ✅ **(Registrada)**

### Arquivo: repasses-actions.ts (baseado no registry)
- `actionListarRepasses(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionListarRepassesPendentes(filtros?)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarRepasse(id)` - Tipo: Buscar por ID
- `actionCriarRepasse(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarRepasse(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarRepasse(id)` - Tipo: Deletar
- `actionConfirmarRepasse(id, valorPago, dataPagamento)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionCancelarRepasse(id)` - Tipo: Operação de negócio ✅ **(Registrada)**

---

## Feature: partes
**Localização:** `src/features/partes/actions/`

### Arquivo: clientes-actions.ts (baseado no registry)
- `actionListarClientes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarCliente(id)` - Tipo: Buscar por ID
- `actionBuscarClientePorCPF(cpf)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarClientePorCNPJ(cnpj)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionCriarCliente(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarCliente(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarCliente(id)` - Tipo: Deletar

### Arquivo: partes-contrarias-actions.ts (baseado no registry)
- `actionListarPartesContrarias(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarParteContraria(id)` - Tipo: Buscar por ID
- `actionCriarParteContraria(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarParteContraria(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarParteContraria(id)` - Tipo: Deletar

### Arquivo: representantes-actions.ts (baseado no registry)
- `actionListarRepresentantes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarRepresentante(id)` - Tipo: Buscar por ID
- `actionCriarRepresentante(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarRepresentante(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarRepresentante(id)` - Tipo: Deletar

### Arquivo: terceiros-actions.ts (baseado no registry)
- `actionListarTerceiros(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarTerceiro(id)` - Tipo: Buscar por ID
- `actionCriarTerceiro(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarTerceiro(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDeletarTerceiro(id)` - Tipo: Deletar

---

## Feature: portal-cliente
**Localização:** `src/features/portal-cliente/actions/`

### Arquivo: portal-actions.ts
- `actionLoginPortal(cpf)` - Tipo: Autenticação/sessão
- `actionLogout()` - Tipo: Autenticação/sessão

---

## Feature: processos
**Localização:** `src/features/processos/actions/`

### Arquivo: index.ts (baseado no registry)
- `actionListarProcessos(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionCriarProcesso(formData)` - Tipo: Criar
- `actionAtualizarProcesso(id, formData)` - Tipo: Atualizar
- `actionBuscarProcesso(id)` - Tipo: Buscar por ID
- `actionBuscarProcessoPorNumero(numeroProcesso)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarProcessosPorCPF(cpf, limite?)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarProcessosPorCNPJ(cnpj, limite?)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarTimeline(processoId)` - Tipo: Buscar relacionado ✅ **(Registrada)**

### Arquivo: indexing-actions.ts
- `actionIndexarPecaProcesso(processoId, pecaId)` - Tipo: Operação interna (AI)
- `actionIndexarAndamentoProcesso(processoId, andamentoId)` - Tipo: Operação interna (AI)
- `actionReindexarProcesso(processoId)` - Tipo: Operação interna (AI)

---

## Feature: profiles
**Localização:** `src/features/profiles/actions/`

### Arquivo: profile-actions.ts
- `actionBuscarAtividadesPorEntidade(entidadeId, tipoEntidade)` - Tipo: Listar relacionados

---

## Feature: rh
**Localização:** `src/features/rh/actions/`

### Arquivo: folhas-pagamento-actions.ts
- `actionBuscarFolhaPagamento(id)` - Tipo: Buscar por ID
- `actionBuscarFolhaPorPeriodo(periodo)` - Tipo: Buscar por filtro
- `actionGerarFolhaPagamento(periodo, usuarioIds)` - Tipo: Gerar documento
- `actionPreviewGerarFolha(periodo, usuarioIds)` - Tipo: Preview
- `actionAprovarFolhaPagamento(id)` - Tipo: Operação de negócio
- `actionPagarFolhaPagamento(id, dataPagamento)` - Tipo: Operação de negócio
- `actionAtualizarFolhaPagamento(id, formData)` - Tipo: Atualizar
- `actionVerificarCancelamentoFolha(id)` - Tipo: Verificação
- `actionObterResumoPagamento(id)` - Tipo: Relatório
- `actionCancelarFolhaPagamento(id)` - Tipo: Operação de negócio
- `actionExcluirFolhaPagamento(id)` - Tipo: Deletar

### Arquivo: salarios-actions.ts
- `actionBuscarSalario(id)` - Tipo: Buscar por ID
- `actionCriarSalario(formData)` - Tipo: Criar
- `actionAtualizarSalario(id, formData)` - Tipo: Atualizar
- `actionEncerrarVigenciaSalario(id, dataEncerramento)` - Tipo: Operação de negócio
- `actionInativarSalario(id)` - Tipo: Operação de negócio
- `actionExcluirSalario(id)` - Tipo: Deletar

---

## Feature: tipos-expedientes
**Localização:** `src/features/tipos-expedientes/actions/`

### Arquivo: tipos-expedientes-actions.ts (baseado no registry)
- `actionListarTiposExpedientes(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarTipoExpediente(id)` - Tipo: Buscar por ID
- `actionCriarTipoExpediente(formData)` - Tipo: Criar
- `actionAtualizarTipoExpediente(id, formData)` - Tipo: Atualizar
- `actionDeletarTipoExpediente(id)` - Tipo: Deletar

---

## Feature: usuarios
**Localização:** `src/features/usuarios/actions/`

### Arquivo: atividades-actions.ts
- `actionBuscarEstatisticasAtividades(usuarioId)` - Tipo: Estatística
- `actionBuscarProcessosAtribuidos(usuarioId)` - Tipo: Listar relacionados
- `actionBuscarAudienciasAtribuidas(usuarioId)` - Tipo: Listar relacionados
- `actionBuscarPendentesAtribuidos(usuarioId)` - Tipo: Listar relacionados
- `actionBuscarContratosAtribuidos(usuarioId)` - Tipo: Listar relacionados

### Arquivo: auth-logs-actions.ts
- `actionBuscarAuthLogs(params)` - Tipo: Listar

### Arquivo: avatar-actions.ts
- `actionUploadAvatar(usuarioId, formData)` - Tipo: Upload de arquivo
- `actionRemoverAvatar(usuarioId)` - Tipo: Deletar

### Arquivo: cargos-actions.ts
- `actionCriarCargo(formData)` - Tipo: Criar
- `actionAtualizarCargo(id, formData)` - Tipo: Atualizar
- `actionDeletarCargo(id)` - Tipo: Deletar

### Arquivo: cover-actions.ts
- `actionUploadCover(usuarioId, formData)` - Tipo: Upload de arquivo
- `actionRemoverCover(usuarioId)` - Tipo: Deletar

### Arquivo: permissoes-actions.ts
- `actionSalvarPermissoes(usuarioId, permissoes)` - Tipo: Atualizar

### Arquivo: senha-actions.ts
- `actionAlterarSenhaComVerificacao(usuarioId, senhaAtual, novaSenha)` - Tipo: Operação de UI/autenticação
- `actionRedefinirSenha(usuarioId)` - Tipo: Operação de negócio
- `actionAtualizarSenhaServer(usuarioId, novaSenha)` - Tipo: Operação interna

### Arquivo: usuarios-actions.ts (baseado no registry)
- `actionListarUsuarios(params)` - Tipo: Listar ✅ **(Registrada)**
- `actionBuscarUsuario(id)` - Tipo: Buscar por ID
- `actionBuscarPorEmail(email)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionBuscarPorCpf(cpf)` - Tipo: Buscar por identificador externo ✅ **(Registrada)**
- `actionCriarUsuario(formData)` - Tipo: Criar ✅ **(Registrada)**
- `actionAtualizarUsuario(id, formData)` - Tipo: Atualizar ✅ **(Registrada)**
- `actionDesativarUsuario(id)` - Tipo: Operação de negócio ✅ **(Registrada)**
- `actionSincronizarUsuarios()` - Tipo: Sincronizar

---

## 📊 Resumo do Inventário

| Categoria | Total |
|-----------|-------|
| **Total de Actions** | 332 |
| **Registradas no MCP** | 85 |
| **Não Registradas** | 252 |
| **Features Mapeadas** | 27 |

### Distribuição por Tipo de Operação

| Tipo | Quantidade Estimada |
|------|---------------------|
| Listar | ~40 |
| Buscar por ID | ~50 |
| Buscar por Identificador Externo | ~15 |
| Criar (FormData) | ~40 |
| Atualizar (FormData) | ~40 |
| Deletar | ~30 |
| Operações de Negócio | ~30 |
| Upload de Arquivo | ~10 |
| Operações Internas (AI) | ~15 |
| Relatórios/Estatísticas | ~15 |
| Outros | ~47 |

---

## 📝 Observações

1. **Actions já registradas:** As actions marcadas com ✅ **(Registrada)** já estão no registry MCP (85 total)
2. **Padrões de nomenclatura:** Todas seguem o padrão `action` + verbo (Listar, Buscar, Criar, etc.)
3. **Retorno padronizado:** Todas seguem `{ success, data?, error?, message? }`
4. **Features com buscas por CPF/CNPJ:** Processos, Partes, Audiências, Contratos
5. **Upload de arquivos:** Presentes em Chat, Documentos, Usuários, Financeiro, Contratos

---

**Próximo passo:** Classificar estas actions usando critérios objetivos.
