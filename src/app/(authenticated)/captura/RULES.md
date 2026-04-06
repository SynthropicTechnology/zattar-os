# Regras de Negocio - Captura

## Contexto
Modulo de captura automatizada de dados de tribunais (PJE, ESAJ, EPROC, PROJUDI). Orquestra autenticacao, busca, parsing e persistencia de processos, audiencias, expedientes, pericias, partes e timeline. Inclui integracao com Comunica CNJ para comunicacoes processuais e sistema de recovery para reprocessamento de logs brutos.

## Entidades Principais
- **ConfigTribunal**: Configuracao de um tribunal (`tribunalId`, `sistema`, `tipoAcesso`, `loginUrl`, `baseUrl`, `apiUrl`, `customTimeouts`)
- **Credencial**: Credenciais de acesso (`cpf`, `senha`)
- **ProcessoCapturado**: Processo generico capturado (`idPje`, `numeroProcesso`, `classeJudicial`, `orgaoJulgador`, `parteAutora`, `parteRe`, `dataAutuacao`, `status`)
- **AudienciaCapturada**: Audiencia capturada (`idProcesso`, `numeroProcesso`, `dataAudiencia`, `tipoAudiencia`, `situacao`, `sala`)
- **MovimentacaoCapturada**: Movimentacao da timeline (`idProcesso`, `dataMovimentacao`, `tipoMovimentacao`, `descricao`)
- **CapturaLog**: Log de execucao de captura (`id`, `tipo_captura`, `advogado_id`, `credencial_ids`, `status`, `iniciado_em`, `concluido_em`, `erro`)
- **CredencialDisponivel**: Credencial para selecao na UI (`id`, `advogado_id`, `advogado_nome`, `tribunal`, `grau`)
- **RecoveryLogSumario**: Log de recovery para reprocessamento
- **RecoveryAnalise**: Analise de gaps de dados capturados (partes faltantes, enderecos, representantes)

## Enums e Tipos
- **TipoCaptura**: `"acervo_geral" | "arquivados" | "audiencias" | "pendentes" | "partes" | "combinada" | "audiencias_designadas" | "audiencias_realizadas" | "audiencias_canceladas" | "expedientes_no_prazo" | "expedientes_sem_prazo" | "pericias" | "timeline"`
- **StatusCaptura**: `"pending" | "in_progress" | "completed" | "failed"`
- **SistemaJudicialSuportado**: `"PJE" | "ESAJ" | "EPROC" | "PROJUDI"`
- **StatusAudiencia** (captura): `'M' | 'C' | 'F'` (Marcada, Cancelada, Finalizada)
- **GrauTRT**: `"primeiro_grau" | "segundo_grau"` (re-exportado de trt-types)
- **CodigoTRT**: Codigo do tribunal (re-exportado de trt-types)

## Regras de Validacao
- `criarCargoSchema`: `nome` minimo 3 caracteres (N/A - pertence a cargos; captura nao possui schemas Zod centrais)
- Parametros de captura validados por tipo especifico (`BaseCapturaParams`, `AudienciasParams`, `PericiasParams`, `PendentesParams`, `TimelineParams`, `CapturaPartesParams`)

## Regras de Negocio

### Fluxo de Captura (Orchestrator)
1. Buscar credencial por ID
2. Buscar configuracao do tribunal (`tribunais_config`)
3. Obter driver via Factory (polimorfico por sistema)
4. Autenticar no sistema judicial
5. Buscar processos/audiencias conforme tipo
6. Persistir resultados no banco (cria processos via `processos/service`)
7. Encerrar driver (fechar browser)
8. Registrar log de captura

### Configuracao de Tribunal
- Armazenada na tabela `tribunais_config`
- Busca por `tribunal_id` (obtido da tabela `tribunais` via codigo)
- Suporta custom timeouts por tribunal (`login`, `redirect`, `networkIdle`, `api`)

### Mapeamentos
- **Grau**: `GrauCredencial` ('1'/'2') -> `GrauTRT` ('primeiro_grau'/'segundo_grau') via `grauCredencialToGrauTRT`
- **Tipo Acesso -> Grau Processo**: `primeiro_grau` -> `primeiro_grau`, `segundo_grau` -> `segundo_grau`, `unificado` -> `primeiro_grau`, `unico` -> `tribunal_superior`
- **Tipo Captura -> Origem**: `arquivados` -> `"arquivado"`, todos os demais -> `"acervo_geral"`

### Recovery
- Analisa gaps de persistencia (enderecos, partes, representantes faltantes)
- Permite reprocessamento seletivo por `rawLogIds` ou `capturaLogId`
- Opcoes: `apenasGaps` (reprocessar apenas faltantes), `forcarAtualizacao` (reprocessar tudo)
- Elementos recuperaveis: `endereco`, `parte`, `representante`, `cadastro_pje`

## Fluxos Especiais
- **Comunica CNJ**: Consulta comunicacoes processuais na API do CNJ, sincroniza (captura e persiste), obtem certidoes em PDF (base64), vincula comunicacoes a expedientes
- **Timeline**: Captura movimentacoes e documentos de um processo; suporta download de documentos com filtros (`apenasAssinados`, `apenasNaoSigilosos`, `tipos`, `dataInicial`/`dataFinal`); persiste diretamente no PostgreSQL (`acervo.timeline_jsonb`)
- **Relink Backblaze**: Reconstroi links de documentos no Backblaze B2 quando perdidos no banco, usando prefixo do processo e extraindo `documentoId` do nome do arquivo (`doc_{id}.pdf`)

## Filtros Disponiveis (Logs de Captura)
- `tipo_captura`: tipo da captura
- `advogado_id`: ID do advogado
- `status`: status da captura
- `data_inicio` / `data_fim`: periodo
- `pagina` / `limite`: paginacao

## Restricoes de Acesso
- Actions de Comunica CNJ usam `requireAuth` com permissoes especificas: `comunica_cnj:consultar`, `comunica_cnj:listar`, `comunica_cnj:capturar`, `comunica_cnj:visualizar`, `comunica_cnj:editar`
- Actions de Timeline usam `checkPermission` com `acervo:editar`
- Actions de Relink usam `checkPermission` com `acervo:editar`
- Vinculacao de comunicacao a expediente requer `comunica_cnj:editar` E `expedientes:editar`

## Integracoes
- `@/app/(authenticated)/processos` (service para criar processos capturados)
- `@/app/(authenticated)/advogados` (tipos de credencial, GrauCredencial)
- `@/app/(authenticated)/partes` (GrauProcesso)
- `@/lib/supabase/service-client` (acesso direto ao banco via service role)
- `@/lib/auth/authorization` (checkPermission)
- Drivers de tribunais em `./drivers/`
- Servicos internos em `./services/` (trt-auth, timeline-capture, partes-capture, persistence)
- Sub-modulos: `./comunica-cnj/`, `./credentials/`, `./pje-trt/`

## Tabelas
- `tribunais` (cadastro de tribunais, busca por codigo)
- `tribunais_config` (configuracao de acesso por tribunal)
- `captura_logs` (logs de execucao)
- `captura_raw_logs` (logs brutos por tribunal/grau para recovery)

## Revalidacao de Cache
- `actionCapturarTimeline`: revalida `/app/processos/${processoId}/timeline` e `/app/processos/${processoId}`
- `actionRelinkBackblaze`: revalida `/app/processos/${processoIdPje}`
