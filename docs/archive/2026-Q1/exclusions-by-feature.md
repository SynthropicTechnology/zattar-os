# Exclusões MCP Tools por Feature

Este documento lista todas as Server Actions excluídas do registro MCP, organizadas por feature, com justificativa e prioridade.

## Legenda

- **Feature**: Nome da feature/módulo
- **Action**: Nome da Server Action
- **Reason**: Motivo da exclusão
- **Priority**: Prioridade (Alta/Média/Baixa) - se a action deveria ser considerada para inclusão futura

---

## Tabela de Exclusões

| Feature | Action | Reason | Priority |
|---------|--------|--------|----------|
| acervo | actionListarAcervoUnificado | Duplicata de `listar_acervo` | Baixa |
| acervo | actionBuscarProcesso | Duplicata de `buscar_processo_por_numero` | Baixa |
| acervo | actionAtribuirResponsavel | Operação CUD | - |
| acervo | actionObterTimelinePorId | ID específico, use `listar_timelines` | Baixa |
| acervo | actionExportarAcervoCSV | Export operation | Média |
| advogados | actionBuscarAdvogado | ID específico | Baixa |
| advogados | actionCriarAdvogado | Operação CUD | - |
| advogados | actionAtualizarAdvogado | Operação CUD | - |
| advogados | actionBuscarCredencial | Admin operation | - |
| advogados | actionCriarCredencial | Admin operation | - |
| advogados | actionAtualizarCredencial | Admin operation | - |
| ai | actionIndexarDocumento | Operação interna | - |
| ai | actionReindexarDocumento | Operação interna | - |
| ai | actionDeletarEmbeddings | Operação interna | - |
| ai | actionVerificarIndexacao | Operação interna | - |
| ai | actionObterContagemEmbeddings | Métrica interna | - |
| ai | actionBuscarConhecimento | Duplicata de `buscar_semantica` | Baixa |
| ai | actionBuscarNoProcesso | Use `buscar_semantica` com filtro | Baixa |
| ai | actionBuscarPorTipoEntidade | Use `buscar_semantica` com filtro | Baixa |
| assistentes | actionBuscarAssistente | ID específico | Baixa |
| assistentes | actionCriarAssistente | Operação CUD | - |
| assistentes | actionAtualizarAssistente | Operação CUD | - |
| assistentes | actionDeletarAssistente | Operação CUD | - |
| busca | actionBuscaSemantica | Duplicata de `buscar_semantica` | Baixa |
| busca | actionBuscaHibrida | Variação de `buscar_semantica` | Média |
| busca | actionObterContextoRAG | Operação interna de IA | - |
| busca | actionBuscarSimilares | Variação de `buscar_semantica` | Média |
| captura | actionConsultarComunicacoes | Admin operation | - |
| captura | actionSincronizarComunicacoes | Admin operation | - |
| captura | actionObterCertidao | ID específico | Baixa |
| captura | actionVincularExpediente | Operação CUD | - |
| captura | actionCapturarTimeline | Admin operation | - |
| cargos | actionBuscarCargo | ID específico | Baixa |
| cargos | actionCriarCargo | Operação CUD | - |
| cargos | actionAtualizarCargo | Operação CUD | - |
| cargos | actionDeletarCargo | Operação CUD | - |
| chat | actionResponderChamada | Operação de chamada em tempo real | - |
| chat | actionEntrarNaChamada | Operação de chamada em tempo real | - |
| chat | actionSairDaChamada | Operação de chamada em tempo real | - |
| chat | actionFinalizarChamada | Operação de chamada em tempo real | - |
| chat | actionSalvarTranscricao | Operação CUD | - |
| chat | actionListarHistoricoGlobal | Duplicata com filtros | Baixa |
| chat | actionBuscarDetalhesMeeting | ID específico | Baixa |
| chat | actionBuscarChamadaPorId | ID específico | Baixa |
| chat | actionIniciarGravacao | Operação de chamada | - |
| chat | actionPararGravacao | Operação de chamada | - |
| chat | actionSalvarUrlGravacao | Operação CUD | - |
| chat | actionBuscarUrlGravacao | ID específico | Baixa |
| chat | actionCriarSala | Operação CUD | - |
| chat | actionRemoverConversa | Operação CUD | - |
| chat | actionDeletarSala | Operação CUD | - |
| chat | actionAtualizarNomeSala | Operação CUD | - |
| chat | actionAtualizarStatusMensagem | Operação CUD | - |
| chat | actionIniciarVideoCall | Operação de chamada | - |
| chat | actionIniciarAudioCall | Operação de chamada | - |
| chat | actionUploadFile | Upload | - |
| chat | actionDeleteFile | Delete | - |
| contratos | actionBuscarContrato | ID específico, use filtros em `listar_contratos` | Baixa |
| contratos | actionListarSegmentos | Segmentos são parte dos contratos | Baixa |
| contratos | actionCriarSegmento | Operação CUD interno | - |
| contratos | actionAtualizarSegmento | Operação CUD interno | - |
| contratos | actionDeletarSegmento | Operação CUD interno | - |
| dashboard | actionObterCapturas | Use `listar_capturas_cnj` | Baixa |
| dashboard | actionObterDetalheCaptura | ID específico | Baixa |
| dashboard | actionObterDashboardUsuario | Duplicata de `obter_dashboard` com filtro | Baixa |
| dashboard | actionRefreshDashboard | Operação interna | - |
| dashboard | actionObterCargaUsuarios | Métrica específica | Média |
| dashboard | actionObterPerformanceAdvogados | Métrica específica | Média |
| documentos | actionUploadArquivoGenerico | Upload | - |
| documentos | actionListarItensUnificados | Duplicata | Baixa |
| documentos | actionMoverArquivo | Operação CUD | - |
| documentos | actionDeletarArquivo | Delete | - |
| documentos | actionBuscarCaminhoPasta | Interno | - |
| documentos | actionCompartilharDocumento | Operação CUD | - |
| documentos | actionListarCompartilhamentos | Feature específica | Média |
| documentos | actionAtualizarPermissao | Admin | - |
| documentos | actionRemoverCompartilhamento | Operação CUD | - |
| documentos | actionListarDocumentosCompartilhados | Feature específica | Média |
| documentos | actionBuscarDocumento | ID específico | Baixa |
| documentos | actionAutoSalvar | Interno | - |
| documentos | actionListarLixeira | Feature específica | Média |
| documentos | actionRestaurarDaLixeira | Operação CUD | - |
| documentos | actionLimparLixeira | Delete | - |
| documentos | actionDeletarPermanentemente | Delete | - |
| documentos | actionListarPastas | Interno | - |
| documentos | actionCriarPasta | Operação CUD | - |
| documentos | actionMoverDocumento | Operação CUD | - |
| documentos | actionDeletarPasta | Delete | - |
| documentos | actionCriarTemplate | Operação CUD | - |
| documentos | actionUsarTemplate | Operação CUD | - |
| documentos | actionDeletarTemplate | Delete | - |
| documentos | actionListarCategorias | Interno | - |
| documentos | actionListarTemplatesMaisUsados | Métrica | Média |
| documentos | actionUploadArquivo | Upload | - |
| documentos | actionListarUploads | Upload | - |
| documentos | actionGerarPresignedUrl | Upload interno | - |
| documentos | actionGerarUrlDownload | Download interno | - |
| documentos | actionListarVersoes | Versioning | Média |
| documentos | actionRestaurarVersao | Versioning | - |
| financeiro | actionListarContasBancariasAtivas | Duplicata de `listar_contas_bancarias` | Baixa |
| financeiro | actionListarCentrosCustoAtivas | Duplicata de `listar_centros_custo` | Baixa |
| financeiro | actionImportarExtrato | Import/Upload | - |
| financeiro | actionBuscarLancamentosManuais | Feature específica | Média |
| financeiro | actionConciliarAutomaticamente | Operação automática | - |
| financeiro | actionBuscarTransacao | ID específico | Baixa |
| financeiro | actionObterDashboardFinanceiro | Duplicata dashboard | Baixa |
| financeiro | actionObterFluxoCaixaProjetado | Já em `projecao_fluxo_caixa` | Baixa |
| financeiro | actionObterResumoContas | Métrica específica | Média |
| financeiro | actionObterIndicadoresFinanceiros | Métrica específica | Média |
| financeiro | actionObterEvolucaoMensal | Métrica específica | Média |
| financeiro | actionObterTopCategorias | Métrica específica | Média |
| financeiro | actionExportarDREPDF | Export (já tem tool similar) | Baixa |
| financeiro | actionObterSaldoInicial | Específico | Baixa |
| financeiro | actionBuscarLancamento | ID específico | Baixa |
| financeiro | actionSincronizarParcela | Sync | - |
| financeiro | actionRegistrarDeclaracao | Operação CUD | - |
| financeiro | actionGerarRepasse | Operação CUD | - |
| financeiro | actionSincronizarAcordo | Sync | - |
| financeiro | actionVerificarConsistencia | Validação interna | - |
| financeiro | actionObterResumoObrigacoes | Métrica | Média |
| financeiro | actionObterAlertasFinanceiros | Alertas | Média |
| financeiro | actionListarObrigacoes | Duplicata | Baixa |
| financeiro | actionListarOrcamentos | Feature específica (13 ações de orçamento) | Média |
| financeiro | actionBuscarOrcamento | ID específico | Baixa |
| financeiro | actionCriarOrcamento | Operação CUD | - |
| financeiro | actionAtualizarOrcamento | Operação CUD | - |
| financeiro | actionExcluirOrcamento | Operação CUD | - |
| financeiro | actionExcluirItemOrcamento | Operação CUD | - |
| financeiro | actionCriarItemOrcamento | Operação CUD | - |
| financeiro | actionAtualizarItemOrcamento | Operação CUD | - |
| financeiro | actionAprovarOrcamento | Operação CUD | - |
| financeiro | actionIniciarExecucaoOrcamento | Operação CUD | - |
| financeiro | actionEncerrarOrcamento | Operação CUD | - |
| financeiro | actionObterAnaliseOrcamentaria | Métrica específica | Média |
| financeiro | actionObterProjecaoOrcamentaria | Métrica específica | Média |
| financeiro | actionExportarLancamentosCSV | Export | Média |
| financeiro | actionExportarContasPagarCSV | Export | Média |
| financeiro | actionExportarContasReceberCSV | Export | Média |
| financeiro | actionExportarFluxoCaixaCSV | Export | Média |
| financeiro | actionExportarPlanoContasCSV | Export | Média |
| financeiro | actionExportarConciliacaoCSV | Export | Média |
| financeiro | actionExportarInadimplenciaCSV | Export | Média |
| financeiro | actionUploadComprovante | Upload | - |
| obrigacoes | actionBuscarAcordo | ID específico | Baixa |
| obrigacoes | actionCriarAcordoComParcelas | Operação CUD | - |
| obrigacoes | actionAtualizarAcordo | Operação CUD | - |
| obrigacoes | actionDeletarAcordo | Delete | - |
| obrigacoes | actionListarObrigacoesPorPeriodo | Filtro específico | Baixa |
| obrigacoes | actionMarcarParcelaRecebida | Operação CUD | - |
| obrigacoes | actionAtualizarParcela | Operação CUD | - |
| obrigacoes | actionRecalcularDistribuicao | Cálculo interno | - |
| obrigacoes | actionAnexarDeclaracao | Upload | - |
| obrigacoes | actionRegistrarRepasse | Operação CUD | - |
| partes | actionBuscarCliente | ID específico | Baixa |
| partes | actionAtualizarCliente | Operação CUD | - |
| partes | actionListarClientesSugestoes | Duplicata | Baixa |
| partes | actionBuscarClientesParaCombobox | UI específica | - |
| partes | actionListarClientesSafe | Duplicata | Baixa |
| partes | actionBuscarClienteSafe | Duplicata | Baixa |
| partes | actionListarClientesSugestoesSafe | Duplicata | Baixa |
| partes | actionCriarClienteSafe | Operação CUD | - |
| partes | actionAtualizarClienteSafe | Operação CUD | - |
| partes | actionDesativarClienteSafe | Operação CUD | - |
| partes | actionBuscarParteContraria | ID específico | Baixa |
| partes | actionAtualizarParteContraria | Operação CUD | - |
| partes | actionBuscarPartesContrariasParaCombobox | UI específica | - |
| partes | actionListarPartesContrariasSafe | Duplicata | Baixa |
| partes | actionBuscarParteContrariaSafe | Duplicata | Baixa |
| partes | actionCriarParteContrariaSafe | Operação CUD | - |
| partes | actionAtualizarParteContrariaSafe | Operação CUD | - |
| partes | actionCriarCliente | Operação CUD | - |
| partes | actionAtualizarClienteForm | Operação CUD | - |
| partes | actionDesativarCliente | Operação CUD | - |
| partes | actionCriarParteContraria | Operação CUD | - |
| partes | actionAtualizarParteContraria | Operação CUD | - |
| partes | actionCriarTerceiro | Operação CUD | - |
| partes | actionAtualizarTerceiro | Operação CUD | - |
| partes | actionBuscarPartesPorProcessoEPolo | Específico | Baixa |
| partes | actionBuscarProcessosPorEntidade | Específico | Baixa |
| partes | actionBuscarRepresentantesPorCliente | Específico | Baixa |
| partes | actionBuscarClientesPorRepresentante | Específico | Baixa |
| partes | actionBuscarRepresentantePorId | ID específico | Baixa |
| partes | actionCriarRepresentante | Operação CUD | - |
| partes | actionAtualizarRepresentante | Operação CUD | - |
| partes | actionDeletarRepresentante | Operação CUD | - |
| partes | actionUpsertRepresentantePorCPF | Operação CUD | - |
| partes | actionBuscarRepresentantePorNome | Específico | Baixa |
| partes | actionBuscarRepresentantesPorOAB | Específico | Baixa |
| partes | actionBuscarTerceiro | ID específico | Baixa |
| partes | actionAtualizarTerceiro | Operação CUD | - |
| partes | actionListarTerceirosSafe | Duplicata | Baixa |
| partes | actionBuscarTerceiroSafe | Duplicata | Baixa |
| partes | actionCriarTerceiroSafe | Operação CUD | - |
| partes | actionAtualizarTerceiroSafe | Operação CUD | - |
| perfil | actionObterPerfil | Específico de perfil | Média |
| perfil | actionAtualizarPerfil | Operação CUD | - |
| portal-cliente | actionLoginPortal | Autenticação | - |
| portal-cliente | actionValidarCpf | Autenticação | - |
| portal-cliente | actionCarregarDashboard | Portal específico | - |
| portal-cliente | actionLogout | Autenticação | - |
| processos | actionCriarProcesso | Operação CUD | - |
| processos | actionAtualizarProcesso | Operação CUD | - |
| processos | actionBuscarProcesso | ID específico | Baixa |
| processos | actionIndexarPecaProcesso | Operação interna | - |
| processos | actionIndexarAndamentoProcesso | Operação interna | - |
| processos | actionReindexarProcesso | Operação interna | - |
| profiles | actionBuscarAtividadesPorEntidade | Específico | Baixa |
| rh | actionBuscarFolhaPagamento | ID específico | Baixa |
| rh | actionBuscarFolhaPorPeriodo | Muito específica | Baixa |
| rh | actionGerarFolhaPagamento | Operação CUD | - |
| rh | actionPreviewGerarFolha | Operação interna | - |
| rh | actionAprovarFolhaPagamento | Operação CUD | - |
| rh | actionPagarFolhaPagamento | Operação CUD | - |
| rh | actionAtualizarFolhaPagamento | Operação CUD | - |
| rh | actionVerificarCancelamentoFolha | Validação interna | - |
| rh | actionObterResumoPagamento | Métrica específica | Média |
| rh | actionCancelarFolhaPagamento | Operação CUD | - |
| rh | actionExcluirFolhaPagamento | Operação CUD | - |
| rh | actionBuscarSalario | ID específico | Baixa |
| rh | actionCriarSalario | Operação CUD | - |
| rh | actionAtualizarSalario | Operação CUD | - |
| rh | actionEncerrarVigenciaSalario | Operação CUD | - |
| rh | actionInativarSalario | Operação CUD | - |
| rh | actionExcluirSalario | Operação CUD | - |
| tipos-expedientes | actionBuscarTipoExpediente | ID específico | Baixa |
| tipos-expedientes | actionCriarTipoExpediente | Operação CUD | - |
| tipos-expedientes | actionAtualizarTipoExpediente | Operação CUD | - |
| tipos-expedientes | actionDeletarTipoExpediente | Operação CUD | - |
| usuarios | actionBuscarEstatisticasAtividades | Métrica específica | Média |
| usuarios | actionBuscarProcessosAtribuidos | Específico | Média |
| usuarios | actionBuscarAudienciasAtribuidas | Específico | Média |
| usuarios | actionBuscarPendentesAtribuidos | Específico | Média |
| usuarios | actionBuscarContratosAtribuidos | Específico | Média |
| usuarios | actionBuscarAuthLogs | Admin | - |
| usuarios | actionUploadAvatar | Upload | - |
| usuarios | actionRemoverAvatar | Operação CUD | - |
| usuarios | actionCriarCargo | Operação CUD | - |
| usuarios | actionAtualizarCargo | Operação CUD | - |
| usuarios | actionDeletarCargo | Operação CUD | - |
| usuarios | actionUploadCover | Upload | - |
| usuarios | actionRemoverCover | Operação CUD | - |
| usuarios | actionSalvarPermissoes | Admin | - |
| usuarios | actionAlterarSenhaComVerificacao | Segurança | - |
| usuarios | actionRedefinirSenha | Segurança | - |
| usuarios | actionAtualizarSenhaServer | Segurança | - |
| usuarios | actionBuscarUsuario | ID específico | Baixa |
| usuarios | actionCriarUsuario | Operação CUD | - |
| usuarios | actionAtualizarUsuario | Operação CUD | - |
| usuarios | actionDesativarUsuario | Operação CUD | - |
| usuarios | actionSincronizarUsuarios | Admin | - |

---

## Resumo por Categoria

### Operações Destrutivas (CUD) - ~150 actions
Todas as operações Create, Update, Delete são excluídas por padrão para segurança.

### Operações Administrativas - ~40 actions
Operações que requerem permissões elevadas ou afetam o sistema.

### Operações UI-Specific - ~25 actions
Actions específicas de formulários e componentes UI que duplicam funcionalidade.

### Operações Internas (IA/Indexação) - ~15 actions
Processamento interno que não deve ser exposto diretamente.

### Operações com Contexto Específico - ~15 actions
Actions que requerem IDs específicos ou contexto muito particular.

### Upload/Storage - ~10 actions
Operações de upload e manipulação de arquivos.

---

## Total de Exclusões: ~252 actions

Este documento serve como referência para o script `check-registry.ts` para validar que todas as exclusões estão justificadas.

