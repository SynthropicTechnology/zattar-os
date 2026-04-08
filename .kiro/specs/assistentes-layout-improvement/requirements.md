# Melhoria de Layout - Página de Assistentes

## 1. Visão Geral

Refatorar a página de assistentes para seguir os padrões de design estabelecidos no Synthropic, aplicando PageShell e DataShell, melhorando a experiência visual dos cards de assistentes com design moderno e profissional.

**IMPORTANTE**: Não utilizamos descrições/subtítulos nas páginas. O título e botão de ação ficam na mesma linha via DataTableToolbar.

## 2. Contexto

Atualmente, a página de assistentes (`/app/assistentes`) não segue o padrão PageShell/DataShell usado em outras páginas do sistema (como clientes, processos). O layout atual é funcional mas não está alinhado com o design system do projeto.

### Estado Atual
- Layout customizado sem PageShell
- Search bar e botão "Novo" implementados manualmente
- Cards de assistentes com design básico
- Não utiliza os componentes padronizados do sistema

### Estado Desejado
- Implementar PageShell para estrutura da página
- Usar DataShell para organização do conteúdo
- Aplicar design moderno aos cards usando ui-ux-pro-max
- Manter funcionalidades existentes (busca, criar, editar, deletar)
- Melhorar responsividade e acessibilidade

## 3. Objetivos

1. **Consistência**: Alinhar a página de assistentes com o padrão visual das outras páginas
2. **Usabilidade**: Melhorar a experiência do usuário com layout mais intuitivo
3. **Design**: Aplicar visual moderno e profissional aos cards
4. **Manutenibilidade**: Usar componentes reutilizáveis do design system

## 4. User Stories

### US-1: Como usuário, quero ver a página de assistentes com layout consistente
**Critérios de Aceitação:**
- [ ] 1.1 A página usa PageShell sem título ou descrição (título vai no DataTableToolbar)
- [ ] 1.2 O layout segue o mesmo padrão visual de outras páginas do sistema
- [ ] 1.3 A navegação e hierarquia visual são claras

### US-2: Como usuário, quero buscar e filtrar assistentes facilmente
**Critérios de Aceitação:**
- [ ] 2.1 Campo de busca está integrado ao DataTableToolbar (linha 2)
- [ ] 2.2 Busca funciona em tempo real com debounce
- [ ] 2.3 Placeholder do campo de busca é descritivo ("Buscar assistentes...")
- [ ] 2.4 Ícone de busca está visível no campo

### US-3: Como usuário com permissão, quero criar novos assistentes
**Critérios de Aceitação:**
- [ ] 3.1 Botão "Novo Assistente" está na linha 1 do DataTableToolbar, alinhado à direita
- [ ] 3.2 Botão só aparece se o usuário tem permissão de criar
- [ ] 3.3 Ao clicar, abre o dialog de criação
- [ ] 3.4 Após criar, a lista é atualizada automaticamente
- [ ] 3.5 Título "Assistentes" está na linha 1, alinhado à esquerda, mesma linha do botão

### US-4: Como usuário, quero visualizar assistentes em cards modernos
**Critérios de Aceitação:**
- [ ] 4.1 Cards têm design moderno com hover effects suaves
- [ ] 4.2 Informações são apresentadas de forma hierárquica e clara
- [ ] 4.3 Ícones e badges seguem o design system
- [ ] 4.4 Cards são responsivos em diferentes tamanhos de tela
- [ ] 4.5 Transições e animações são suaves (200-300ms)
- [ ] 4.6 Cards têm cursor pointer e feedback visual ao hover

### US-5: Como usuário, quero interagir com os assistentes via menu de ações
**Critérios de Aceitação:**
- [ ] 5.1 Cada card tem menu de ações (três pontos) no canto superior direito
- [ ] 5.2 Menu inclui opções: Visualizar, Editar (se permitido), Deletar (se permitido)
- [ ] 5.3 Ações respeitam as permissões do usuário
- [ ] 5.4 Feedback visual ao clicar nas ações

### US-6: Como usuário, quero ver estado vazio quando não há assistentes
**Critérios de Aceitação:**
- [ ] 6.1 Quando não há assistentes, mostra estado vazio com mensagem clara
- [ ] 6.2 Estado vazio inclui ícone ilustrativo
- [ ] 6.3 Se usuário tem permissão, mostra botão para criar primeiro assistente

## 5. Requisitos Técnicos

### RT-1: Estrutura de Componentes
- Usar `PageShell` da `@/components/shared/page-shell`
- Usar `DataShell` da `@/components/shared/data-shell`
- Usar `DataTableToolbar` para barra de ferramentas
- Manter `GridView` para exibição dos cards

### RT-2: Design System
- Seguir protocolos do `design-system-protocols.md`
- Usar componentes do shadcn/ui
- Aplicar spacing do grid 4px
- Usar Typography components quando apropriado

### RT-3: UI/UX Guidelines
- Aplicar princípios do `ui-ux-pro-max`
- Usar ícones SVG (Lucide) ao invés de emojis
- Implementar hover states sem layout shift
- Garantir contraste adequado em light/dark mode
- Adicionar `cursor-pointer` em elementos clicáveis

### RT-4: Responsividade
- Grid responsivo: 1 coluna (mobile) → 2 (tablet) → 3 (desktop) → 4 (large) → 5 (xl)
- Toolbar responsivo com search e botão empilhados em mobile
- Cards adaptam conteúdo em diferentes tamanhos

### RT-5: Performance
- Manter debounce de 500ms na busca
- Evitar re-renders desnecessários
- Lazy loading de dialogs quando necessário

### RT-6: Acessibilidade
- Labels apropriados em campos de formulário
- Navegação por teclado funcional
- Contraste de cores WCAG AA
- ARIA labels em elementos interativos

## 6. Restrições

- Não alterar a lógica de negócio existente
- Manter todas as funcionalidades atuais
- Não modificar o schema de dados
- Manter compatibilidade com permissões existentes
- Não quebrar testes existentes

## 7. Dependências

- `@/components/shared/page-shell`
- `@/components/shared/data-shell`
- `@/components/ui/*` (shadcn/ui components)
- `lucide-react` para ícones
- Hooks existentes: `useAssistentes`

## 8. Fora do Escopo

- Alterações no backend ou actions
- Mudanças no schema do banco de dados
- Novas funcionalidades além do layout
- Alterações em outras páginas
- Modificações no sistema de permissões

## 9. Métricas de Sucesso

- [ ] Página segue 100% o padrão PageShell/DataShell
- [ ] Cards têm design moderno e profissional
- [ ] Responsividade funciona em todos os breakpoints
- [ ] Acessibilidade mantém ou melhora score atual
- [ ] Performance não degrada (tempo de renderização similar)
- [ ] Todos os testes existentes continuam passando

## 10. Referências

- Página de exemplo: `src/app/app/partes/clientes/page.tsx`
- Componente wrapper: `src/features/partes/components/clientes/clientes-table-wrapper.tsx`
- Design system: `.cursor/rules/design-system-protocols.mdc`
- UI/UX guidelines: `.shared/ui-ux-pro-max/`
