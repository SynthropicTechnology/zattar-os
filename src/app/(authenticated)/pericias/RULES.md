# Regras de Negocio - Pericias

## Contexto
Modulo de gestao de pericias judiciais vinculadas a processos do acervo. Controla prazos de entrega de laudos, situacao da pericia, especialidades e peritos. Suporta criacao manual e captura automatizada do PJE.

## Entidades Principais
- **Pericia**: Registro de pericia judicial vinculado a um processo, com dados do perito, especialidade, prazo e situacao
- **EspecialidadePericia**: Tabela de especialidades (ex: medica, contabil, engenharia)

## Enums e Tipos

### SituacaoPericiaCodigo
| Codigo | Descricao |
|--------|-----------|
| `S` | Aguardando Esclarecimentos |
| `L` | Aguardando Laudo |
| `C` | Cancelada |
| `F` | Finalizada |
| `P` | Laudo Juntado |
| `R` | Redesignada |

### Tipos importados
- **CodigoTribunal**: TRT1 a TRT24 (importado de `expedientes`)
- **GrauTribunal**: primeiro_grau, segundo_grau, tribunal_superior (importado de `expedientes`)

## Regras de Validacao

### Criar Pericia
- `numeroProcesso`: min 20 caracteres
- `trt`: obrigatorio (min 1 char)
- `grau`: enum ['primeiro_grau', 'segundo_grau']
- `situacaoCodigo`: default `AGUARDANDO_LAUDO` (L)
- `prazoEntrega`, `especialidadeId`, `peritoId`, `observacoes`: opcionais

### Atribuir Responsavel
- `periciaId`: min 1
- `responsavelId`: min 1

### Adicionar Observacao
- `periciaId`: min 1
- `observacoes`: min 1 char

## Regras de Negocio

### Criacao Manual de Pericia
1. Validar dados via Zod schema
2. Validar advogadoId (positivo)
3. Gerar `id_pje` sequencial negativo para pericias manuais (diferencia de capturadas)
4. Buscar `processo_id` pelo `numero_processo` no acervo (se existir)
5. Defaults na criacao: `laudo_juntado=false`, `segredo_justica=false`, `juizo_digital=false`, `arquivado=false`, `prioridade_processual=false`
6. Trigger do banco atribui `responsavel_id` automaticamente se processo tem responsavel

### Listagem
- Default: 50 itens, max 1000
- Ordenacao default: `prazo_entrega ASC`
- JOINs automaticos: especialidade, perito (terceiros), responsavel (usuarios), processo (acervo)

### Atribuicao de Responsavel
1. Atualiza `responsavel_id` e `updated_at`

### Atualizacao de Situacao
1. Atualiza `situacao_codigo` e `updated_at`

### Especialidades
- Listagem de especialidades ativas, ordenadas por descricao, limite 500

## Filtros Disponiveis
- **busca**: numero_processo, observacoes
- **processoId**: filtro por processo
- **trt**: filtro por tribunal
- **grau**: filtro por grau
- **situacaoCodigo**: filtro por situacao
- **situacoesExcluidas**: exclui pericias com situacoes especificas
- **responsavelId**: filtro por responsavel (ou 'null' para sem responsavel)
- **semResponsavel**: pericias sem responsavel
- **especialidadeId**: filtro por especialidade
- **peritoId**: filtro por perito
- **laudoJuntado**: boolean
- **Datas**: prazoEntrega (inicio/fim), dataCriacao (inicio/fim)
- **segredoJustica**, **prioridadeProcessual**, **arquivado**: booleanos
- **Ordenacao**: prazo_entrega, data_criacao, situacao_codigo

## Integracoes
- **Expedientes**: importa CodigoTribunal e GrauTribunal
- **Acervo**: busca processo pelo numero_processo para vincular
- **Tabelas auxiliares**: especialidades_pericia, terceiros (peritos), usuarios (responsaveis)

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/pericias`
- `/app/pericias/semana`
- `/app/pericias/mes`
- `/app/pericias/ano`
- `/app/pericias/lista`
