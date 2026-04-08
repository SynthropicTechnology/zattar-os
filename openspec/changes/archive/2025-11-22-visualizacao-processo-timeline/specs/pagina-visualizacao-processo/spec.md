# Spec: Página de Visualização de Processo

**Capability**: `pagina-visualizacao-processo`
**Related Specs**: `verificacao-timeline-existente`, `captura-timeline-automatica`, `frontend-processos`, `ui-components`
**Status**: Proposal

## Overview

Interface completa para visualização de processo com timeline de movimentações e documentos, incluindo metadados, partes processuais, links para documentos no Google Drive e estados de loading/erro apropriados.

## ADDED Requirements

### Requirement: Rota Dinâmica de Visualização
O sistema SHALL fornecer uma rota dedicada em `/processos/[id]` para visualização de processo individual com timeline.

#### Scenario: Acesso via URL direta
**Given** usuário acessa `/processos/123` e processo com ID 123 existe
**When** página é carregada
**Then** o sistema deve validar ID do processo, buscar dados, verificar/capturar timeline automaticamente e renderizar página completa

#### Scenario: Processo não existe
**Given** usuário acessa `/processos/999999` e processo não existe
**When** página é carregada
**Then** o sistema deve detectar erro 404, exibir "Processo não encontrado" e oferecer botão "Voltar para Listagem"

#### Scenario: ID inválido
**Given** usuário acessa `/processos/abc` onde "abc" não é número válido
**When** página é carregada
**Then** o sistema deve validar ID, exibir erro "ID de processo inválido" e redirecionar para listagem após 3 segundos

---

### Requirement: Header do Processo
O sistema SHALL exibir cabeçalho com todos os metadados importantes do processo.

#### Scenario: Renderização do header completo
**Given** dados do processo carregados
**Then** o header deve exibir número do processo (destaque), tribunal e grau (badges), classe judicial, órgão julgador, status, data de autuação, parte autora e ré (badges coloridas), responsável (se houver), próxima audiência (se houver) e indicador de segredo de justiça (se aplicável)

#### Scenario: Layout responsivo do header
**Given** header está sendo renderizado
**Then** layout deve adaptar-se: Desktop (> 1024px) em grid 2 colunas, Tablet (640px-1024px) em coluna única, Mobile (< 640px) compacto com badges menores

#### Scenario: Múltiplas partes
**Given** processo tem `qtde_parte_autora > 1` ou `qtde_parte_re > 1`
**Then** o sistema deve exibir nome da primeira parte + " e outros (X)" com tooltip

---

### Requirement: Timeline de Movimentações e Documentos
O sistema SHALL exibir timeline com todos os movimentos processuais e documentos ordenados cronologicamente.

#### Scenario: Renderização da timeline completa
**Given** timeline carregada com itens
**Then** a timeline deve exibir items em ordem descendente (mais recente primeiro), mostrar linha vertical conectando items, distinguir visualmente documentos (ícone FileText azul) vs movimentos (ícone Activity cinza), permitir scroll suave e renderizar até 1000 itens

#### Scenario: Item de documento com Google Drive
**Given** item é documento (`documento: true`) e tem campo `googleDrive` preenchido
**Then** o item deve exibir data/hora, título, tipo (badge), signatário (se assinado), status assinatura (badge), botões "Ver Documento" e "Download" e ícone de sigiloso (se aplicável)

#### Scenario: Item de documento sem Google Drive
**Given** item é documento e NÃO tem campo `googleDrive`
**Then** o item deve exibir metadados, botões desabilitados com tooltip "Documento não disponível" e badge "Indisponível"

#### Scenario: Item de movimento processual
**Given** item é movimento (`documento: false`)
**Then** o item deve exibir data/hora, título do movimento, responsável (se disponível) e descrição (se disponível, texto colapsível) sem botões de ação

#### Scenario: Animação de entrada dos itens
**Given** timeline está sendo renderizada
**Then** items devem aparecer com animação fade-in, stagger de 50ms entre items consecutivos usando Framer Motion

---

### Requirement: Estados de Loading
O sistema SHALL fornecer feedback visual claro durante carregamento e captura.

#### Scenario: Loading inicial (verificando timeline)
**Given** página está carregando e dados ainda não foram buscados
**Then** exibir skeleton do header, skeleton da timeline (5 items placeholder) e mensagem "Carregando processo..."

#### Scenario: Capturando timeline
**Given** timeline não existe e captura foi iniciada automaticamente
**Then** exibir header do processo (já carregado), card de loading com spinner, mensagem contextual, barra de progresso indeterminada, tempo estimado e informação sobre navegação

#### Scenario: Loading não bloqueia navegação
**Given** captura está em andamento
**When** usuário clica no botão "Voltar"
**Then** o sistema deve permitir navegação imediata, manter captura em background e ao retornar continuar polling

---

### Requirement: Estados de Erro
O sistema SHALL comunicar todos os erros claramente com ações de recuperação.

#### Scenario: Erro ao carregar processo
**Given** requisição GET /api/acervo/[id] falha
**When** erro é retornado
**Then** exibir card de erro com ícone AlertTriangle, título "Erro ao Carregar Processo", mensagem de erro, botão "Tentar Novamente" e botão "Voltar para Listagem"

#### Scenario: Erro na captura de timeline
**Given** captura falha (erro 401, 500, timeout)
**When** erro é detectado
**Then** exibir header do processo (se carregado), card de erro específico conforme tipo, botão "Tentar Novamente" e botão "Voltar"

#### Scenario: Timeline vazia
**Given** captura foi bem-sucedida e timeline retorna array vazio
**Then** exibir header do processo, card de empty state com ícone FileSearch, mensagem "Nenhuma movimentação ou documento encontrado", texto secundário e botão "Voltar para Listagem"

---

### Requirement: Navegação e Breadcrumbs
O sistema SHALL fornecer contexto de localização e facilidade para navegar de volta.

#### Scenario: Breadcrumb exibido
**Given** página de processo está aberta
**Then** breadcrumb deve exibir "Processos" (link para `/processos`) + ">" + "[Número do processo]" (texto, página atual)

#### Scenario: Botão voltar
**Given** página de processo está aberta
**Then** deve haver botão "Voltar para Processos" com ícone ArrowLeft + texto, posicionado no header, que navega para `/processos` ao clicar

#### Scenario: Navegação via browser back
**Given** usuário chegou via listagem
**When** clica no botão voltar do browser
**Then** deve retornar para `/processos` preservando estado da listagem (filtros, página)

---

### Requirement: Metadata e SEO
O sistema SHALL fornecer metadata apropriada para SEO e compartilhamento.

#### Scenario: Metadata dinâmica gerada
**Given** processo carregado
**Then** a página deve ter Title "Processo [número] - [Autora] vs [Ré] | Synthropic" e Description "Processo trabalhista [número] no [TRT] - [Classe Judicial]"

#### Scenario: Metadata de fallback
**Given** processo não foi carregado ainda (erro)
**Then** usar metadata padrão Title "Processo | Synthropic" e Description "Visualização de processo no Synthropic"

---

### Requirement: Performance e Otimização
O sistema SHALL carregar rapidamente e renderizar eficientemente.

#### Scenario: Renderização eficiente de timeline grande
**Given** timeline tem > 100 itens
**When** página é renderizada
**Then** renderizar todos os items inicialmente sem virtualização (simplicidade), considerar "Load More" ou virtualização como melhoria futura

#### Scenario: Tempo de carregamento
**Given** timeline já existe no MongoDB e rede estável
**When** página é acessada
**Then** renderização completa deve ocorrer em < 1s para dados do processo e < 2s para timeline completa renderizada com animações suaves (60fps)

---

### Requirement: Acessibilidade
O sistema SHALL ser acessível para todos os usuários seguindo padrões WCAG AA.

#### Scenario: Navegação por teclado
**Given** usuário navega apenas com teclado
**Then** todos os elementos interativos devem ser acessíveis via Tab, ter indicadores visuais de foco e permitir ativação via Enter/Space

#### Scenario: Leitores de tela
**Given** usuário usa leitor de tela
**Then** a página deve ter landmarks ARIA apropriadas (header, main, article), botões com labels descritivos, timeline com role="list" e items com role="listitem" e indicar estado de loading com aria-live="polite"

#### Scenario: Contraste de cores
**Given** página está renderizada
**Then** todos os textos devem ter contraste mínimo 4.5:1 (WCAG AA), badges e labels com contraste adequado e estados de hover/focus claramente visíveis

---

### Requirement: Atualização do Botão Visualizar na Listagem
O sistema SHALL conectar o botão "Visualizar" da listagem de processos à nova página de visualização.

#### Scenario: Navegação ao clicar em Visualizar
**Given** usuário está na listagem de processos (`/processos`) e clica no botão "Visualizar" (ícone Eye)
**When** onClick é acionado
**Then** o sistema deve navegar para `/processos/[id]` usando Next.js router com transição suave sem recarregar página completa

#### Scenario: Tooltip do botão
**Given** usuário passa o mouse sobre botão "Visualizar"
**Then** deve exibir tooltip "Visualizar processo completo"

#### Scenario: Estado do botão durante carregamento
**Given** listagem está carregando processos
**Then** botão "Visualizar" deve estar desabilitado durante loading inicial e habilitar quando dados estiverem prontos

---

## MODIFIED Requirements

### Requirement: Listagem de Processos - Botão Visualizar
O sistema SHALL modificar o comportamento do botão "Visualizar" na listagem de processos para navegar à nova página ao invés de fazer console.log.

#### Scenario: Navegação implementada
**Given** botão "Visualizar" é clicado na listagem
**When** onClick é disparado
**Then** deve navegar para `/processos/[id]` ao invés de fazer console.log do ID (mudança em `app/(dashboard)/processos/page.tsx` linha ~505)

---

## REMOVED Requirements

Nenhum requirement removido nesta spec.
