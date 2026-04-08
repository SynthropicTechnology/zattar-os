# Requisitos: Tradução Completa e Ajustes de Layout do Módulo de Agenda

## 1. Visão Geral

Realizar tradução completa do módulo de agenda (calendar) do inglês para o português brasileiro, mantendo a funcionalidade existente e aplicando ajustes de layout conforme os padrões do design system Synthropic.

## 2. Contexto

O módulo de agenda (`src/features/calendar/`) atualmente possui diversos textos em inglês em:
- Metadados da página
- Labels de interface
- Mensagens de notificação (toasts)
- Textos de botões e controles
- Mensagens de estado vazio
- Títulos de diálogos
- Labels de formulários

## 3. Objetivos

1. Traduzir 100% dos textos visíveis ao usuário para português brasileiro
2. Manter consistência terminológica com outros módulos do Synthropic
3. Aplicar padrões de layout do design system (PageShell, espaçamento, cores)
4. Garantir que a funcionalidade existente permaneça intacta
5. Manter acessibilidade (aria-labels, sr-only texts)

## 4. User Stories

### US-1: Como usuário, quero ver a interface da agenda completamente em português
**Critérios de Aceitação:**
- Todos os botões, labels e textos estão em português
- Terminologia é consistente (ex: "Evento" ao invés de "Event")
- Datas e horários seguem formato brasileiro
- Mensagens de feedback (toasts) estão em português

### US-2: Como usuário, quero que o layout da agenda siga os padrões do Synthropic
**Critérios de Aceitação:**
- Página usa PageShell para estrutura consistente
- Espaçamento segue grid de 4px
- Cores seguem o design system (sem hardcoded colors)
- Tipografia usa componentes Typography quando aplicável

### US-3: Como usuário, quero criar e editar eventos com interface em português
**Critérios de Aceitação:**
- Diálogo de evento tem todos os campos traduzidos
- Labels de formulário estão em português
- Mensagens de validação estão em português
- Opções de cor (etiquetas) têm labels em português

### US-4: Como usuário, quero navegar entre visualizações com atalhos e labels em português
**Critérios de Aceitação:**
- Dropdown de visualizações mostra: Mês, Semana, Dia, Agenda
- Botão "Hoje" traduzido
- Atalhos de teclado mantidos (M, W, D, A)
- Navegação anterior/próximo funciona corretamente

### US-5: Como usuário, quero ver mensagens de estado vazio em português
**Critérios de Aceitação:**
- Mensagem "Nenhum evento encontrado" na visualização Agenda
- Descrição explicativa em português
- Ícones e layout mantidos

## 5. Requisitos Funcionais

### RF-1: Tradução de Metadados
- Traduzir title e description em `page.tsx`
- Manter SEO-friendly

### RF-2: Tradução de Interface Principal
- Botão "Today" → "Hoje"
- Botão "New event" → "Novo evento"
- Dropdown de visualizações:
  - "Month" → "Mês"
  - "Week" → "Semana"
  - "Day" → "Dia"
  - "Agenda" → "Agenda"

### RF-3: Tradução de Diálogo de Evento
- "Create Event" → "Criar Evento"
- "Edit Event" → "Editar Evento"
- "Title" → "Título"
- "Description" → "Descrição"
- "Start Date" → "Data de Início"
- "End Date" → "Data de Término"
- "Start Time" → "Hora de Início"
- "End Time" → "Hora de Término"
- "All day" → "Dia inteiro"
- "Location" → "Local"
- "Etiquette" → "Etiqueta" (ou "Cor")
- "Cancel" → "Cancelar"
- "Save" → "Salvar"
- "Delete event" → "Excluir evento"

### RF-4: Tradução de Cores/Etiquetas
- "Sky" → "Azul Céu"
- "Amber" → "Âmbar"
- "Violet" → "Violeta"
- "Rose" → "Rosa"
- "Emerald" → "Esmeralda"
- "Orange" → "Laranja"

### RF-5: Tradução de Mensagens Toast
- "Event \"{title}\" added" → "Evento \"{title}\" adicionado"
- "Event \"{title}\" updated" → "Evento \"{title}\" atualizado"
- "Event \"{title}\" deleted" → "Evento \"{title}\" excluído"
- "Event \"{title}\" moved" → "Evento \"{title}\" movido"

### RF-6: Tradução de Visualização Agenda
- "No events found" → "Nenhum evento encontrado"
- "There are no events scheduled for this time period." → "Não há eventos agendados para este período."
- "+ X more" → "+ X mais"

### RF-7: Tradução de Visualização Semana
- "All day" → "Dia inteiro"
- Formato de hora: manter "h a" (ex: "9 AM")

### RF-8: Mensagens de Erro
- "End date cannot be before start date" → "Data de término não pode ser anterior à data de início"
- "Selected time must be between X and Y" → "Horário selecionado deve estar entre X e Y"

## 6. Requisitos Não-Funcionais

### RNF-1: Compatibilidade
- Manter compatibilidade com navegadores modernos
- Responsividade em mobile, tablet e desktop
- Acessibilidade WCAG 2.1 AA

### RNF-2: Performance
- Não degradar performance existente
- Manter lazy loading e otimizações

### RNF-3: Manutenibilidade
- Código limpo e bem documentado
- Seguir padrões do projeto (FSD, TypeScript strict)
- Comentários em português quando necessário

### RNF-4: Design System
- Seguir protocolos do design-system-protocols.md
- Usar componentes do shadcn/ui
- Aplicar PageShell para estrutura de página

## 7. Restrições

1. Não alterar lógica de negócio existente
2. Não modificar estrutura de dados ou tipos
3. Manter compatibilidade com eventos de outras fontes (audiências, expedientes, obrigações)
4. Não quebrar testes existentes
5. Seguir convenções de nomenclatura do projeto

## 8. Dependências

- Componentes UI do shadcn/ui
- Biblioteca date-fns (já configurada)
- Design system Synthropic
- PageShell component

## 9. Critérios de Sucesso

- [ ] 100% dos textos visíveis traduzidos para português
- [ ] Layout segue padrões do design system
- [ ] Funcionalidade mantida (drag-and-drop, criação, edição, exclusão)
- [ ] Responsividade preservada
- [ ] Acessibilidade mantida
- [ ] Sem erros de TypeScript
- [ ] Testes passando (se existentes)

## 10. Fora do Escopo

- Integração com backend (já existe via domain.ts)
- Novos recursos ou funcionalidades
- Refatoração de lógica de negócio
- Mudanças em estrutura de dados
- Testes automatizados (podem ser adicionados posteriormente)

## 11. Notas Técnicas

### Arquivos a Modificar

1. **Página Principal**
   - `src/features/calendar/page.tsx` - metadados

2. **Componentes Principais**
   - `src/features/calendar/components/event-calendar.tsx` - interface principal
   - `src/features/calendar/components/event-dialog.tsx` - diálogo de evento
   - `src/features/calendar/components/agenda-view.tsx` - visualização agenda
   - `src/features/calendar/components/week-view.tsx` - visualização semana
   - `src/features/calendar/components/month-view.tsx` - visualização mês

3. **Constantes**
   - `src/features/calendar/constants.ts` - comentários (opcional)

4. **Dados de Exemplo**
   - `src/features/calendar/components/event-calendar-app.tsx` - eventos de exemplo

### Padrões de Tradução

| Inglês | Português |
|--------|-----------|
| Event | Evento |
| Calendar | Agenda |
| Today | Hoje |
| Month | Mês |
| Week | Semana |
| Day | Dia |
| Agenda | Agenda |
| All day | Dia inteiro |
| Start | Início |
| End | Término/Fim |
| Location | Local |
| Description | Descrição |
| Title | Título |
| Save | Salvar |
| Cancel | Cancelar |
| Delete | Excluir |
| Create | Criar |
| Edit | Editar |
| New | Novo |

## 12. Referências

- Design System Protocols: `.cursor/rules/design-system-protocols.mdc`
- AGENTS.md: Guia de arquitetura do projeto
- Componente PageShell: `src/components/shared/page-shell.tsx`
- Módulos de referência: `src/features/processos/`, `src/features/audiencias/`
