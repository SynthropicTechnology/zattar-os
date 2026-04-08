# Regras de Negocio - Expedientes

## Contexto
Modulo de expedientes judiciais do PJE/TRT. Gerencia intimacoes, notificacoes e prazos processuais vindos de captura automatizada, Comunica CNJ ou cadastro manual.

## Entidades Principais
- **Expediente**: Registro de expediente judicial vinculado a um processo, com prazo, responsavel e tipo

## Enums e Constantes
- **OrigemExpediente**: `captura` (PJE), `manual`, `comunica_cnj`
- **GrauTribunal**: `primeiro_grau`, `segundo_grau`, `tribunal_superior`
- **CodigoTribunal**: TRT1 a TRT24
- **ResultadoDecisao**: `desfavoravel`, `parcialmente_favoravel`, `favoravel`

## Regras de Validacao
- `numeroProcesso`: obrigatorio
- `trt`: obrigatorio (enum CodigoTribunal)
- `grau`: obrigatorio (enum GrauTribunal)
- `dataPrazoLegalParte`: obrigatorio
- `origem`: default `manual`

### Baixa de Expediente
- Requer `protocoloId` OU `justificativaBaixa` (pelo menos um)
- `dataBaixa` nao pode ser futura
- `resultadoDecisao`: opcional (enum)

## Regras de Negocio
- **Criacao**: valida existencia do processo (`processoId`) e tipo de expediente (`tipoExpedienteId`) se informados
- **Atualizacao**: preserva historico em `dados_anteriores` (JSONB) para auditoria, evitando aninhamento recursivo
- **Baixa**: impede baixa duplicada ("Expediente ja esta baixado"); registra log de auditoria via RPC `registrar_baixa_expediente`
- **Reversao de baixa**: so permite reverter expediente que esta baixado; registra log via RPC `registrar_reversao_baixa_expediente`
- **Atribuicao de responsavel**: via RPC `atribuir_responsavel_pendente` com log de auditoria
- **Atualizacao tipo/descricao**: registra alteracao em `logs_alteracao` com dados anteriores e novos
- **Paginacao**: default 50 itens, max 1000; ordenacao default por `data_prazo_legal_parte ASC`
- **Filtro de prazo com `incluirSemPrazo`**: inclui expedientes sem prazo (legado do calendario)
- **Busca por CPF**: normaliza CPF (11 digitos), busca via relacao `clientes -> processo_partes -> processos -> expedientes`
- **View `expedientes_com_origem`**: utilizada para leitura, traz dados do 1o grau (fonte da verdade)

## Filtros Disponíveis

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `busca` | string | Busca textual (número processo, partes) |
| `trt` | enum | Código do tribunal (TRT1-24) |
| `grau` | enum | Grau do tribunal (primeiro_grau, segundo_grau, tribunal_superior) |
| `responsavelId` | number \| "null" | Filtrar por responsável |
| `semResponsavel` | boolean | Expedientes sem responsável atribuído |
| `tipoExpedienteId` | number | Filtrar por tipo de expediente |
| `semTipo` | boolean | Expedientes sem tipo definido |
| `baixado` | boolean | Filtrar por status de baixa |
| `prazoVencido` | boolean | Filtrar prazos vencidos |
| `incluirSemPrazo` | boolean | Incluir expedientes sem prazo (legado calendário) |
| `dataPrazoLegalInicio` / `dataPrazoLegalFim` | string | Intervalo de prazo legal |
| `dataCienciaInicio` / `dataCienciaFim` | string | Intervalo de ciência |
| `dataCriacaoExpedienteInicio` / `dataCriacaoExpedienteFim` | string | Intervalo de criação |
| `classeJudicial` | string | Classe judicial do processo |
| `codigoStatusProcesso` | string | Status do processo vinculado |
| `segredoJustica` | boolean | Processos em segredo de justiça |
| `juizoDigital` | boolean | Processos em juízo digital |
| `dataAutuacaoInicio` / `dataAutuacaoFim` | string | Intervalo de autuação |
| `dataArquivamentoInicio` / `dataArquivamentoFim` | string | Intervalo de arquivamento |
| `processoId` | number | Filtrar por processo específico |
| `semPrazo` | boolean | Expedientes sem prazo definido |
| `origem` | enum | Origem do expediente (captura, manual, comunica_cnj) |
| `resultadoDecisao` | enum | Resultado da decisão (desfavoravel, parcialmente_favoravel, favoravel) |
| `prioridadeProcessual` | boolean | Processos com prioridade processual |

### Ordenação
Campos disponíveis: `id`, `data_prazo_legal_parte` (default ASC), `data_ciencia_parte`, `data_criacao_expediente`, `baixado_em`, `created_at`

### Paginação
- Default: 50 itens por página
- Máximo: 1000 itens por página

## Integrações

### Módulos Internos
- **Processos**: Vinculação via `processoId` (tabela `acervo`)
- **Partes/Clientes**: Busca de expedientes por CPF do cliente (via relação `clientes → processo_partes → processos → expedientes`)
- **Tipos de Expediente**: Tabela auxiliar `tipos_expediente` para categorização

### Sistemas Externos
- **PJE**: Captura automática de expedientes via scraping
- **Comunica CNJ**: Importação de intimações do sistema Comunica
- **Sistema de IA**: Indexação para busca semântica via pgvector

### RPCs (Stored Procedures)
- `registrar_baixa_expediente`: Registra baixa com log de auditoria
- `registrar_reversao_baixa_expediente`: Registra reversão de baixa com log
- `atribuir_responsavel_pendente`: Atribui responsável com log de auditoria

## Revalidação de Cache
Após mutações, revalidar:
- `/app/expedientes` — Lista principal
- `/app/expedientes/quadro` — Visão quadro Kanban
- `/app/expedientes/semana` — Visão semanal
- `/app/expedientes/mes` — Visão mensal
- `/app/expedientes/ano` — Visão anual
- `/app/expedientes/lista` — Visão lista
