# Regras de Negocio - Tarefas

## Contexto
Modulo de gerenciamento de tarefas com suporte a Kanban (quadros), subtarefas, comentarios e anexos. Agrega tarefas manuais criadas pelo usuario com eventos virtuais do sistema (audiencias, expedientes, pericias, obrigacoes) em uma interface unificada. Suporta materializacao de eventos virtuais em tarefas reais.

## Entidades Principais
- **Task**: Tarefa com `id`, `title`, `status`, `label`, `priority`, `description`, `dueDate`, `reminderDate`, `starred`, `assignees`, `subTasks`, `comments`, `files`, `position`, `quadroId`, `source`, `sourceEntityId`
- **TarefaDisplayItem**: Extensao de Task para display (`url`, `isVirtual`, `prazoVencido`, `responsavelNome`, `date`)
- **TaskAssignee**: Responsavel atribuido (`id`, `name`, `email`, `avatarUrl`)
- **TaskSubTask**: Subtarefa (`id`, `title`, `completed`, `position`)
- **TaskComment**: Comentario (`id`, `body`, `createdAt`)
- **TaskFile**: Anexo (`id`, `name`, `url`, `type`, `size`, `uploadedAt`)
- **Quadro**: Quadro Kanban (`id`, `usuarioId`, `titulo`, `tipo`, `source`, `icone`, `ordem`)
- **SystemBoardDefinition**: Definicao de quadro sistema com colunas e mapeamento de status

## Enums e Tipos
- **TaskStatus**: `"backlog" | "todo" | "in progress" | "done" | "canceled"`
- **TaskLabel**: `"bug" | "feature" | "documentation" | "audiencia" | "expediente" | "pericia" | "obrigacao"`
- **TaskPriority**: `"low" | "medium" | "high"`
- **QuadroTipo**: `"sistema" | "custom"`
- **QuadroSource**: `"expedientes" | "audiencias" | "pericias" | "obrigacoes"`

## Regras de Validacao
- `title`: obrigatorio, minimo 1 caractere
- `status`: deve ser um dos valores de `TaskStatus`
- `label`: deve ser um dos valores de `TaskLabel`
- `priority`: deve ser um dos valores de `TaskPriority`
- `dueDate`: opcional (formato yyyy-mm-dd)
- `reminderDate`: opcional (ISO timestamptz)
- `quadroId`: UUID opcional (null = quadro sistema)
- Anexos: limite de ~2.5MB por data-url
- Subtarefas: `title` obrigatorio, `completed` booleano
- Quadro custom: `titulo` 1-100 caracteres

## Regras de Negocio

### Mapeamento de Status DB <-> UI
- `pending` <-> `todo`
- `in-progress` <-> `in progress`
- `completed` <-> `done`
- `backlog` e `canceled` sao mapeados diretamente

### Agregacao Virtual
- `listarTarefasComEventos` combina tarefas manuais com eventos do sistema
- Eventos convertidos para `TarefaDisplayItem` com label derivado da fonte (`audiencias` -> `audiencia`, etc.)
- Prioridade calculada automaticamente via `calcularPrioridade` baseado na data de vencimento e prazo vencido

### Deduplicacao
- Se um evento virtual ja foi materializado em `todo_items`, usa a versao materializada e descarta a virtual
- Enriquece a versao materializada com dados do evento (url, prazoVencido, responsavelNome, date)
- Chave de dedup: `{source}:{sourceEntityId}`

### Visibilidade
- Admin (`isSuperAdmin`) ve todos os eventos
- Demais usuarios veem apenas eventos atribuidos a eles (exceto se `showAll=true`)

### Materializacao
- Cria registro real em `todo_items` vinculado ao evento de origem via `source`/`sourceEntityId`
- Se ja existir registro materializado, retorna o existente (idempotente)

### Quadros Kanban
- 4 quadros sistema fixos: Expedientes, Audiencias, Pericias, Obrigacoes
- Quadros custom criados pelo usuario; nao e possivel excluir quadros sistema (prefixo `sys-`)
- Ao excluir quadro custom, desvincula tarefas (`quadro_id` -> null)
- **DnD bidirecional**: Arrastar cards em quadros sistema atualiza status da entidade de origem via `atualizarStatusEntidadeOrigem`
- **DnD desabilitado**: Quadro de obrigacoes (`dndEnabled: false`)

### Quadros de Sistema - Colunas
- **Expedientes**: Pendentes (`pendente`), Prazo Vencido (`vencido`), Baixados (`baixado`)
- **Audiencias**: Marcadas (`M`), Realizadas (`F`), Canceladas (`C`)
- **Pericias**: Ativas (`S`, `L`, `P`, `R`), Finalizadas (`F`), Canceladas (`C`)
- **Obrigacoes**: Pendentes (`pendente`), Atrasadas (`atrasada`, `atrasado`, `vencida`), Pagas (`pago_total`, `recebida`, `paga`)

## Filtros Disponiveis
- `page` / `limit`: paginacao
- `search`: busca por titulo ou descricao (ilike)
- `status`: filtro por TaskStatus
- `label`: filtro por TaskLabel
- `priority`: filtro por TaskPriority
- Filtros aplicados tanto a tarefas manuais (via query DB) quanto a eventos virtuais (via filtro in-memory)

## Tabelas
- `todo_items` (tabela principal)
- `todo_assignees` (responsaveis atribuidos, join com `usuarios`)
- `todo_subtasks` (subtarefas)
- `todo_comments` (comentarios)
- `todo_files` (anexos)
- `quadros` (quadros custom do Kanban)

## Restricoes de Acesso
- Actions usam `authenticatedAction` (requer usuario autenticado)
- Todas as queries filtram por `usuario_id` do usuario autenticado
- Quadros custom sao isolados por usuario

## Integracoes
- `@/lib/event-aggregation/service` (`listarTodosEventos`, `atualizarStatusEntidadeOrigem`)
- `@/lib/event-aggregation/domain` (`UnifiedEventItem`, `mapSourceStatusToTarefaStatus`, `calcularPrioridade`)

## Revalidacao de Cache
- Todas as actions de escrita revalidam `/app/tarefas`
