# Regras de Negocio - Pericias

## Contexto
Modulo de gestao de pericias judiciais vinculadas a processos trabalhistas. Controla situacao, prazos de entrega, especialidades, peritos e laudos. Pericias podem ser capturadas do PJE ou criadas manualmente.

## Entidades Principais
- **Pericia**: Registro de pericia judicial (vinculada a processo do acervo)
- **EspecialidadePericia**: Tabela auxiliar de especialidades
- **Terceiro (Perito)**: Perito responsavel pela pericia

## Enums e Tipos

### Situacao da Pericia (SituacaoPericiaCodigo)
| Codigo | Descricao |
|--------|-----------|
| `S` | Aguardando Esclarecimentos |
| `L` | Aguardando Laudo |
| `C` | Cancelada |
| `F` | Finalizada |
| `P` | Laudo Juntado |
| `R` | Redesignada |

### Ordenacao
- `prazo_entrega` (default)
- `data_criacao`
- `situacao_codigo`

## Regras de Validacao

### Atribuir Responsavel
- `periciaId`: numero, minimo 1
- `responsavelId`: numero, minimo 1

### Adicionar Observacao
- `periciaId`: numero, minimo 1
- `observacoes`: string, minimo 1 caractere

### Criar Pericia (Manual)
- `numeroProcesso`: minimo 20 caracteres
- `trt`: obrigatorio
- `grau`: enum ['primeiro_grau', 'segundo_grau']
- `situacaoCodigo`: default AGUARDANDO_LAUDO
- `prazoEntrega`: opcional
- `especialidadeId`: opcional
- `peritoId`: opcional
- `observacoes`: opcional

## Regras de Negocio

### Criacao Manual de Pericia
1. Validar schema com Zod
2. Validar advogadoId positivo
3. Gerar id_pje sequencial negativo (pericias manuais usam IDs negativos)
4. Buscar processo_id pelo numero_processo no acervo (se existir)
5. Criar registro na tabela pericias
6. Trigger do banco atribui responsavel_id automaticamente (se processo tem responsavel)

### Listagem
1. Sanitizar parametros (pagina > 0, limite 1-1000, default 50)
2. Ordenacao default: prazo_entrega ASC
3. JOINs opcionais: especialidade, perito, responsavel, processo

### Atualizacao de Situacao
- Validar periciaId positivo
- TODO: Validacao de transicao de status (nao implementada ainda)

### Calculo de Prazo
- Filtros de prazo usam `gte` para inicio e `lt` para proximo dia (inclusivo)
- Mesma logica para datas de criacao

## Filtros Disponiveis
- **Busca textual**: numero_processo, observacoes
- **Processo**: processoId
- **Tribunal**: trt, grau
- **Situacao**: situacaoCodigo, situacoesExcluidas (array para excluir)
- **Responsavel**: responsavelId, semResponsavel
- **Especialidade**: especialidadeId
- **Perito**: peritoId
- **Laudo**: laudoJuntado (boolean)
- **Datas**: prazoEntregaInicio/Fim, dataCriacaoInicio/Fim
- **Flags**: segredoJustica, prioridadeProcessual, arquivado
- **Ordenacao**: prazo_entrega, data_criacao, situacao_codigo
- **Paginacao**: pagina, limite (max 1000)

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/pericias` - Lista principal
- `/app/pericias/semana` - Vista semanal
- `/app/pericias/mes` - Vista mensal
- `/app/pericias/ano` - Vista anual
- `/app/pericias/lista` - Vista em lista
