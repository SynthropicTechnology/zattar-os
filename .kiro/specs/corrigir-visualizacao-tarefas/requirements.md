# Requisitos: Correção da Visualização de Tarefas

## 1. Contexto

Após a unificação dos módulos To-Do e Tarefas, foram identificados dois problemas na interface:

1. **Espaçamento inadequado da paginação**: A paginação está muito próxima da tabela, sem espaçamento visual adequado
2. **Troca de visualização para quadro não funciona**: O ViewModePopover está presente mas a alternância entre lista e quadro não está funcionando corretamente

## 2. Objetivos

- Corrigir o espaçamento entre a tabela e a paginação na visualização de lista
- Garantir que a alternância entre visualização de lista e quadro funcione corretamente
- Manter a consistência visual com outros módulos do sistema (ex: Audiências)

## 3. Requisitos Funcionais

### 3.1 Espaçamento da Paginação

**Critério de Aceitação**: A paginação deve ter espaçamento visual adequado em relação à tabela

- O espaçamento deve seguir o grid de 4px do design system
- Deve haver margem superior (mt-4) entre a tabela e a paginação
- O espaçamento deve ser consistente com outros módulos que usam DataShell

### 3.2 Alternância de Visualização

**Critério de Aceitação**: O usuário deve conseguir alternar entre visualização de lista e quadro

- O ViewModePopover deve estar visível e funcional
- Ao clicar em "Lista", deve mostrar a DataTable
- Ao clicar em "Quadro", deve mostrar o TaskBoard
- A visualização selecionada deve persistir no estado (store)
- A transição entre visualizações deve ser instantânea

### 3.3 Visualização de Quadro

**Critério de Aceitação**: A visualização de quadro deve funcionar corretamente

- Deve mostrar as colunas de status (Backlog, To Do, In Progress, Done, Canceled)
- Deve permitir drag-and-drop de tarefas entre colunas
- Deve mostrar o QuadroSelector para alternar entre quadros
- Eventos virtuais devem aparecer mas não serem arrastáveis
- Deve ter o botão "Nova Tarefa" visível

## 4. Requisitos Não-Funcionais

### 4.1 Consistência Visual

- Seguir os padrões do design system Synthropic
- Manter consistência com o módulo de Audiências (que tem ViewModePopover funcional)
- Usar componentes compartilhados (DataShell, ViewModePopover)

### 4.2 Performance

- A alternância entre visualizações deve ser instantânea (< 100ms)
- Não deve haver re-renderizações desnecessárias

## 5. Restrições

- Não alterar a estrutura de dados (domain, service, repository)
- Não modificar componentes compartilhados (DataShell, ViewModePopover)
- Manter compatibilidade com eventos virtuais
- Seguir o padrão FSD (Feature-Sliced Design)

## 6. Casos de Uso

### 6.1 Visualizar Tarefas em Lista

1. Usuário acessa /app/tarefas
2. Sistema mostra visualização de lista por padrão
3. Tabela é exibida com espaçamento adequado da paginação
4. Usuário pode filtrar, ordenar e paginar

### 6.2 Alternar para Visualização de Quadro

1. Usuário clica no ViewModePopover
2. Usuário seleciona "Quadro"
3. Sistema alterna para visualização de quadro
4. Quadro Kanban é exibido com todas as colunas
5. Usuário pode arrastar tarefas entre colunas

### 6.3 Voltar para Visualização de Lista

1. Usuário está na visualização de quadro
2. Usuário clica no ViewModePopover
3. Usuário seleciona "Lista"
4. Sistema alterna para visualização de lista
5. Tabela é exibida com os mesmos filtros anteriores

## 7. Critérios de Sucesso

- ✅ Paginação tem espaçamento visual adequado (mt-4)
- ✅ ViewModePopover alterna corretamente entre lista e quadro
- ✅ Visualização de lista mostra DataTable completa
- ✅ Visualização de quadro mostra TaskBoard completo
- ✅ Drag-and-drop funciona no quadro
- ✅ Eventos virtuais aparecem em ambas visualizações
- ✅ Build sem erros TypeScript
- ✅ Consistência visual com outros módulos
