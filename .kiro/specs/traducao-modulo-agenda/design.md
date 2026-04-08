# Design: Tradução Completa e Ajustes de Layout do Módulo de Agenda

## 1. Visão Geral da Solução

A solução envolve tradução sistemática de todos os textos do módulo de agenda para português brasileiro, mantendo a estrutura e funcionalidade existentes. Aplicaremos também ajustes de layout para conformidade com o design system Synthropic.

## 2. Arquitetura da Solução

### 2.1 Estrutura de Arquivos (Sem Alterações)

```
src/features/calendar/
├── components/
│   ├── agenda-view.tsx          ✏️ Traduzir
│   ├── calendar-dnd-context.tsx  ✅ Sem alterações
│   ├── day-view.tsx              ✏️ Traduzir
│   ├── draggable-event.tsx       ✅ Sem alterações
│   ├── droppable-cell.tsx        ✅ Sem alterações
│   ├── event-calendar-app.tsx    ✏️ Traduzir (dados exemplo)
│   ├── event-calendar.tsx        ✏️ Traduzir
│   ├── event-dialog.tsx          ✏️ Traduzir
│   ├── event-item.tsx            ✅ Sem alterações
│   ├── events-popup.tsx          ✅ Sem alterações
│   ├── month-view.tsx            ✏️ Traduzir
│   ├── week-view.tsx             ✏️ Traduzir
│   └── index.ts                  ✅ Sem alterações
├── constants.ts                  ✏️ Comentários (opcional)
├── domain.ts                     ✅ Sem alterações
├── page.tsx                      ✏️ Traduzir metadados
├── service.ts                    ✅ Sem alterações
├── types.ts                      ✅ Sem alterações
└── utils.ts                      ✅ Sem alterações
```

### 2.2 Componentes Afetados

#### 2.2.1 page.tsx
**Mudanças:**
- Traduzir metadata (title, description)
- Adicionar PageShell para estrutura consistente

**Antes:**
```typescript
export const metadata: Metadata = {
  title: "Event Calendar",
  description: "Plan your events or tasks in an organized way..."
};
```

**Depois:**
```typescript
export const metadata: Metadata = {
  title: "Agenda",
  description: "Gerencie seus eventos e compromissos de forma organizada"
};
```

#### 2.2.2 event-calendar.tsx
**Mudanças:**
- Traduzir labels de botões
- Traduzir opções de visualização
- Traduzir mensagens toast
- Traduzir aria-labels

**Mapeamento de Traduções:**
```typescript
// Botões
"Today" → "Hoje"
"New event" → "Novo evento"

// Visualizações
"Month" → "Mês"
"Week" → "Semana"
"Day" → "Dia"
"Agenda" → "Agenda"

// Toasts
`Event "${event.title}" added` → `Evento "${event.title}" adicionado`
`Event "${event.title}" updated` → `Evento "${event.title}" atualizado`
`Event "${event.title}" deleted` → `Evento "${event.title}" excluído`
`Event "${event.title}" moved` → `Evento "${event.title}" movido`

// Aria-labels
"Previous" → "Anterior"
"Next" → "Próximo"
```

#### 2.2.3 event-dialog.tsx
**Mudanças:**
- Traduzir todos os labels de formulário
- Traduzir títulos de diálogo
- Traduzir opções de cor
- Traduzir mensagens de erro
- Traduzir botões de ação

**Mapeamento Completo:**
```typescript
// Títulos
"Create Event" → "Criar Evento"
"Edit Event" → "Editar Evento"

// Descrições (sr-only)
"Edit the details of this event" → "Edite os detalhes deste evento"
"Add a new event to your calendar" → "Adicione um novo evento à sua agenda"

// Labels de Formulário
"Title" → "Título"
"Description" → "Descrição"
"Start Date" → "Data de Início"
"End Date" → "Data de Término"
"Start Time" → "Hora de Início"
"End Time" → "Hora de Término"
"All day" → "Dia inteiro"
"Location" → "Local"
"Etiquette" → "Etiqueta"

// Placeholders
"Pick a date" → "Selecione uma data"
"Select time" → "Selecione o horário"

// Cores
"Sky" → "Azul Céu"
"Amber" → "Âmbar"
"Violet" → "Violeta"
"Rose" → "Rosa"
"Emerald" → "Esmeralda"
"Orange" → "Laranja"

// Botões
"Cancel" → "Cancelar"
"Save" → "Salvar"
"Delete event" → "Excluir evento"

// Mensagens de Erro
"End date cannot be before start date" → "Data de término não pode ser anterior à data de início"
`Selected time must be between ${StartHour}:00 and ${EndHour}:00` → 
`Horário selecionado deve estar entre ${StartHour}:00 e ${EndHour}:00`
```

#### 2.2.4 agenda-view.tsx
**Mudanças:**
- Traduzir mensagem de estado vazio
- Manter formato de data brasileiro

**Mapeamento:**
```typescript
// Estado Vazio
"No events found" → "Nenhum evento encontrado"
"There are no events scheduled for this time period." → 
"Não há eventos agendados para este período."

// Formato de Data
"d MMM, EEEE" → mantido (date-fns já suporta locale pt-BR)
```

#### 2.2.5 week-view.tsx
**Mudanças:**
- Traduzir "All day"
- Manter formato de hora

**Mapeamento:**
```typescript
"All day" → "Dia inteiro"
```

#### 2.2.6 month-view.tsx
**Mudanças:**
- Traduzir "+ X more"

**Mapeamento:**
```typescript
"+ {remainingCount} more" → "+ {remainingCount} mais"
```

#### 2.2.7 event-calendar-app.tsx
**Mudanças:**
- Traduzir eventos de exemplo (opcional, mas recomendado para consistência)

**Eventos de Exemplo (Traduzidos):**
```typescript
{
  title: "Planejamento Anual",
  description: "Planejamento estratégico para o próximo ano",
  location: "Sala de Conferências Principal"
},
{
  title: "Prazo do Projeto",
  description: "Enviar entregáveis finais",
  location: "Escritório"
},
// ... etc
```

## 3. Padrões de Implementação

### 3.1 Internacionalização (i18n)

**Decisão:** Não implementar biblioteca i18n neste momento
**Justificativa:**
- Projeto é exclusivamente em português brasileiro
- Overhead desnecessário para um único idioma
- Strings hardcoded são mais simples e performáticas

**Futuro:** Se houver necessidade de múltiplos idiomas, considerar:
- next-intl
- react-i18next

### 3.2 Formatação de Datas

**Biblioteca:** date-fns (já em uso)
**Locale:** pt-BR

**Implementação:**
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Uso
format(date, 'PPP', { locale: ptBR }); // "14 de fevereiro de 2026"
format(date, 'd MMM, EEEE', { locale: ptBR }); // "14 fev, sábado"
```

**Nota:** Verificar se locale já está configurado globalmente no projeto.

### 3.3 Design System Compliance

#### 3.3.1 PageShell Integration

**Antes (page.tsx):**
```typescript
export default function Page() {
  return <EventCalendarApp />;
}
```

**Depois (page.tsx):**
```typescript
import { PageShell } from '@/components/shared/page-shell';

export default function Page() {
  return (
    <PageShell 
      title="Agenda" 
      description="Gerencie seus eventos e compromissos"
    >
      <EventCalendarApp />
    </PageShell>
  );
}
```

#### 3.3.2 Cores e Espaçamento

**Verificações:**
- ✅ Não há cores hardcoded em badges (usa EventColor type)
- ✅ Espaçamento usa classes Tailwind do grid 4px
- ✅ Componentes UI do shadcn/ui já seguem design system

**Nenhuma alteração necessária** - código já está em conformidade.

### 3.4 Acessibilidade

**Manter:**
- aria-labels traduzidos
- sr-only texts traduzidos
- Estrutura semântica HTML
- Navegação por teclado

**Exemplo:**
```typescript
// Antes
<span className="max-[479px]:sr-only">Today</span>

// Depois
<span className="max-[479px]:sr-only">Hoje</span>
```

## 4. Fluxo de Dados (Sem Alterações)

```
┌─────────────────────────────────────────────────────────┐
│                    EventCalendarApp                     │
│  (Gerencia estado local de eventos - dados exemplo)    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     EventCalendar                       │
│  (Componente principal - navegação e visualizações)    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  MonthView   │  │   WeekView   │  │  AgendaView  │
│  (Mês)       │  │  (Semana)    │  │  (Agenda)    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                  ┌──────────────┐
                  │ EventDialog  │
                  │ (CRUD)       │
                  └──────────────┘
```

**Nota:** Fluxo permanece idêntico, apenas textos são traduzidos.

## 5. Casos de Uso Detalhados

### 5.1 UC-01: Visualizar Agenda em Português

**Ator:** Usuário
**Pré-condições:** Usuário acessa página de agenda
**Fluxo Principal:**
1. Sistema exibe título "Agenda" no PageShell
2. Sistema exibe botão "Hoje" e "Novo evento"
3. Sistema exibe dropdown com opções: Mês, Semana, Dia, Agenda
4. Sistema exibe eventos com datas em formato brasileiro
5. Sistema exibe atalhos de teclado com labels em português

**Pós-condições:** Interface completamente em português

### 5.2 UC-02: Criar Evento em Português

**Ator:** Usuário
**Pré-condições:** Usuário clica em "Novo evento"
**Fluxo Principal:**
1. Sistema abre diálogo "Criar Evento"
2. Sistema exibe campos: Título, Descrição, Data de Início, etc.
3. Usuário preenche formulário
4. Usuário clica em "Salvar"
5. Sistema exibe toast: "Evento '{título}' adicionado"

**Fluxo Alternativo 1 - Validação:**
1. Usuário define data de término anterior à data de início
2. Sistema exibe erro: "Data de término não pode ser anterior à data de início"
3. Usuário corrige e salva

### 5.3 UC-03: Editar Evento em Português

**Ator:** Usuário
**Pré-condições:** Usuário clica em evento existente
**Fluxo Principal:**
1. Sistema abre diálogo "Editar Evento"
2. Sistema preenche campos com dados do evento
3. Usuário modifica campos
4. Usuário clica em "Salvar"
5. Sistema exibe toast: "Evento '{título}' atualizado"

**Fluxo Alternativo 1 - Exclusão:**
1. Usuário clica em botão de excluir (ícone lixeira)
2. Sistema exclui evento
3. Sistema exibe toast: "Evento '{título}' excluído"

### 5.4 UC-04: Navegar entre Visualizações

**Ator:** Usuário
**Pré-condições:** Usuário está na página de agenda
**Fluxo Principal:**
1. Usuário clica no dropdown de visualizações
2. Sistema exibe opções: Mês (M), Semana (W), Dia (D), Agenda (A)
3. Usuário seleciona "Semana"
4. Sistema exibe visualização semanal com "Dia inteiro" traduzido

**Fluxo Alternativo 1 - Atalho de Teclado:**
1. Usuário pressiona tecla "M"
2. Sistema muda para visualização "Mês"

## 6. Validações e Regras de Negócio

### 6.1 Validações de Formulário

| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| Título | Opcional (usa "(sem título)" se vazio) | - |
| Data de Término | Não pode ser anterior à data de início | "Data de término não pode ser anterior à data de início" |
| Horário | Deve estar entre StartHour e EndHour | "Horário selecionado deve estar entre X:00 e Y:00" |

### 6.2 Regras de Exibição

1. **Eventos de Dia Inteiro:**
   - Exibidos na seção "Dia inteiro" nas visualizações Semana e Dia
   - Não mostram horário

2. **Eventos Multi-dia:**
   - Título visível apenas no primeiro dia
   - Continuação visual nos dias subsequentes

3. **Eventos Sobrepostos:**
   - Calculados automaticamente na visualização Semana
   - Largura ajustada proporcionalmente

4. **Estado Vazio (Agenda):**
   - Exibir mensagem "Nenhum evento encontrado" quando não há eventos
   - Exibir ícone de calendário

## 7. Considerações de Performance

### 7.1 Otimizações Existentes (Manter)

- `useMemo` para cálculos de dias e semanas
- `useMemo` para opções de horário (timeOptions)
- Lazy rendering de eventos (visibilidade calculada)

### 7.2 Impacto da Tradução

**Impacto:** Mínimo
- Strings traduzidas são estáticas
- Sem overhead de biblioteca i18n
- Sem chamadas de API adicionais

## 8. Testes

### 8.1 Testes Manuais Recomendados

**Checklist de Tradução:**
- [ ] Página principal exibe "Agenda" no título
- [ ] Botão "Hoje" funciona e está traduzido
- [ ] Botão "Novo evento" funciona e está traduzido
- [ ] Dropdown de visualizações mostra: Mês, Semana, Dia, Agenda
- [ ] Atalhos de teclado (M, W, D, A) funcionam
- [ ] Diálogo de criação mostra "Criar Evento"
- [ ] Diálogo de edição mostra "Editar Evento"
- [ ] Todos os labels de formulário estão em português
- [ ] Opções de cor têm labels em português
- [ ] Mensagens de erro estão em português
- [ ] Toasts de feedback estão em português
- [ ] Visualização Agenda mostra "Nenhum evento encontrado" quando vazia
- [ ] Visualização Semana mostra "Dia inteiro" para eventos all-day
- [ ] Visualização Mês mostra "+ X mais" para eventos ocultos

**Checklist de Layout:**
- [ ] PageShell aplicado corretamente
- [ ] Espaçamento consistente com design system
- [ ] Responsividade mantida (mobile, tablet, desktop)
- [ ] Acessibilidade mantida (navegação por teclado, screen readers)

### 8.2 Testes Automatizados (Futuro)

**Sugestões para implementação futura:**

```typescript
// Exemplo de teste de tradução
describe('EventCalendar - Tradução', () => {
  it('deve exibir botão "Hoje" em português', () => {
    render(<EventCalendar />);
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('deve exibir opções de visualização em português', () => {
    render(<EventCalendar />);
    fireEvent.click(screen.getByRole('button', { name: /visualização/i }));
    expect(screen.getByText('Mês')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Dia')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
  });

  it('deve exibir diálogo de criação em português', () => {
    render(<EventCalendar />);
    fireEvent.click(screen.getByText('Novo evento'));
    expect(screen.getByText('Criar Evento')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
  });
});
```

## 9. Migração e Rollout

### 9.1 Estratégia de Implementação

**Abordagem:** Big Bang (uma única PR)
**Justificativa:**
- Mudanças são cosméticas (tradução)
- Não afeta lógica de negócio
- Baixo risco de regressão
- Facilita revisão de código

### 9.2 Plano de Rollback

**Cenário:** Problemas críticos após deploy
**Ação:** Reverter commit/PR
**Impacto:** Mínimo (apenas textos voltam para inglês)

### 9.3 Comunicação

**Stakeholders:**
- Equipe de desenvolvimento
- Usuários finais (via changelog)

**Mensagem:**
- "Módulo de Agenda agora está completamente em português brasileiro"
- "Funcionalidade permanece idêntica"

## 10. Documentação

### 10.1 Atualizações Necessárias

**Arquivos a Atualizar:**
- README.md (se mencionar módulo de agenda)
- CHANGELOG.md (adicionar entrada)
- Documentação de usuário (se existir)

**Exemplo de Entrada no CHANGELOG:**
```markdown
## [Unreleased]

### Changed
- Tradução completa do módulo de Agenda para português brasileiro
- Aplicação de PageShell para estrutura consistente
- Melhoria de acessibilidade com labels traduzidos
```

### 10.2 Comentários no Código

**Princípio:** Comentários em português para consistência
**Exemplo:**
```typescript
// Calcula a posição dos eventos sobrepostos
const positionedEvents: PositionedEvent[] = [];
```

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de funcionalidade | Baixa | Alto | Testes manuais extensivos antes do merge |
| Inconsistência terminológica | Média | Baixo | Revisão por falante nativo de português |
| Problemas de acessibilidade | Baixa | Médio | Validar aria-labels e sr-only texts |
| Regressão de layout | Baixa | Médio | Testar em múltiplos dispositivos |
| Conflito com outras features | Baixa | Baixo | Coordenar com equipe antes do merge |

## 12. Métricas de Sucesso

### 12.1 Métricas Quantitativas

- **Cobertura de Tradução:** 100% dos textos visíveis
- **Arquivos Modificados:** ~8 arquivos
- **Linhas de Código Alteradas:** ~150-200 linhas
- **Tempo de Implementação:** 2-3 horas

### 12.2 Métricas Qualitativas

- Feedback positivo de usuários brasileiros
- Consistência terminológica com outros módulos
- Manutenção de acessibilidade
- Conformidade com design system

## 13. Próximos Passos (Pós-Implementação)

1. **Integração com Backend:**
   - Conectar com actions de audiências, expedientes, obrigações
   - Implementar CRUD real (atualmente usa estado local)

2. **Melhorias de UX:**
   - Adicionar filtros por fonte (audiências, expedientes, etc.)
   - Implementar busca de eventos
   - Adicionar notificações/lembretes

3. **Internacionalização (se necessário):**
   - Implementar biblioteca i18n
   - Adicionar suporte para múltiplos idiomas

4. **Testes Automatizados:**
   - Adicionar testes unitários
   - Adicionar testes de integração
   - Adicionar testes E2E com Playwright

## 14. Referências

- [date-fns Locale Documentation](https://date-fns.org/docs/I18n)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- Design System Synthropic: `.cursor/rules/design-system-protocols.mdc`
- AGENTS.md: Guia de arquitetura do projeto
