# Spec: Visualização Detalhada de Histórico de Captura

**Capability**: captura-historico-detalhes
**Related Specs**: captura-trt, frontend-processos
**Status**: Proposed

## Overview

Esta spec define a funcionalidade de visualização detalhada de uma captura do histórico em página dedicada, substituindo o dialog modal atual por uma experiência de página completa que permite melhor apresentação de conteúdo extenso.

---

## ADDED Requirements

### Requirement: Rota de visualização detalhada
O sistema MUST fornecer uma rota dedicada para visualização detalhada de uma captura específica do histórico.

#### Scenario: Acessar detalhes de captura por ID

**Given** o usuário está autenticado no sistema
**And** existe uma captura com ID `123` no histórico
**When** o usuário acessa a URL `/captura/historico/123`
**Then** o sistema DEVE exibir a página de detalhes da captura
**And** o sistema DEVE mostrar todas as informações da captura

#### Scenario: Metadata dinâmica da página

**Given** o usuário acessa `/captura/historico/123`
**And** a captura existe e é do tipo "Acervo Geral"
**Then** o título da página DEVE ser "Captura #123 - Acervo Geral | Synthropic"
**And** a description DEVE conter informações relevantes da captura

#### Scenario: ID inválido

**Given** o usuário acessa `/captura/historico/abc`
**Or** o usuário acessa `/captura/historico/-1`
**Then** o sistema DEVE exibir mensagem de erro "ID de Captura Inválido"
**And** o sistema NÃO DEVE fazer requisições à API

#### Scenario: Captura não encontrada

**Given** o usuário acessa `/captura/historico/999999`
**And** não existe captura com ID `999999`
**Then** o sistema DEVE exibir mensagem "Captura não encontrada"
**And** o sistema DEVE oferecer botão para voltar ao histórico

---

### Requirement: Visualização completa de dados
O sistema MUST exibir todas as informações da captura de forma organizada e legível.

#### Scenario: Exibir informações básicas

**Given** o usuário está visualizando detalhes da captura
**Then** o sistema DEVE exibir:
  - ID da captura
  - Tipo de captura (Acervo Geral, Arquivados, Audiências, Pendentes)
  - Status (Pendente, Em Progresso, Concluída, Falhou)
  - ID do advogado associado (se houver)

#### Scenario: Exibir credenciais utilizadas

**Given** a captura utilizou credenciais com IDs `[1, 5, 10]`
**Then** o sistema DEVE exibir badges com "Credencial #1", "Credencial #5", "Credencial #10"

#### Scenario: Exibir datas e horários

**Given** o usuário está visualizando detalhes da captura
**Then** o sistema DEVE exibir:
  - Data e hora de início no formato "DD/MM/YYYY HH:mm:ss"
  - Data e hora de conclusão no formato "DD/MM/YYYY HH:mm:ss" (ou "-" se não concluída)

#### Scenario: Exibir resultado da captura

**Given** a captura foi concluída com sucesso
**And** o resultado contém dados JSON
**Then** o sistema DEVE exibir o JSON formatado com syntax highlighting
**And** o JSON DEVE ser scrollable horizontalmente se necessário

#### Scenario: Exibir erro da captura

**Given** a captura falhou com erro "Timeout ao conectar no PJE"
**Then** o sistema DEVE exibir o erro em destaque visual vermelho
**And** o card de erro DEVE ter borda vermelha

---

### Requirement: Navegação na tabela de histórico
O sistema MUST permitir navegação da tabela de histórico para a página de detalhes.

#### Scenario: Clicar no botão de visualização

**Given** o usuário está na página de histórico de capturas
**And** existe uma captura com ID `123` na tabela
**When** o usuário clica no botão de visualização (ícone de olho)
**Then** o sistema DEVE navegar para `/captura/historico/123`
**And** a URL do browser DEVE ser atualizada

#### Scenario: Navegação por URL direta

**Given** o usuário recebe um link `/captura/historico/456`
**When** o usuário acessa o link
**Then** o sistema DEVE carregar a página de detalhes da captura `456`
**And** o usuário DEVE poder compartilhar este link com outros usuários autenticados

---

### Requirement: Ações na página de detalhes
O sistema MUST permitir ações relevantes na página de detalhes da captura.

#### Scenario: Voltar para histórico

**Given** o usuário está na página de detalhes de uma captura
**When** o usuário clica no botão "Voltar"
**Then** o sistema DEVE navegar de volta para `/captura`
**And** o histórico de navegação do browser DEVE ser preservado

#### Scenario: Deletar captura

**Given** o usuário está na página de detalhes da captura `123`
**And** o usuário tem permissão para deletar capturas
**When** o usuário clica em "Deletar Captura"
**And** confirma a ação no alert dialog
**Then** o sistema DEVE deletar a captura
**And** o sistema DEVE redirecionar para `/captura`
**And** o sistema DEVE exibir mensagem de sucesso

#### Scenario: Cancelar deleção

**Given** o usuário clicou em "Deletar Captura"
**When** o usuário clica em "Cancelar" no alert dialog
**Then** o sistema NÃO DEVE deletar a captura
**And** o usuário DEVE permanecer na página de detalhes

---

### Requirement: Estados de carregamento e erro
O sistema MUST fornecer feedback apropriado durante carregamento e em caso de erros.

#### Scenario: Estado de carregamento

**Given** o usuário acessa `/captura/historico/123`
**When** os dados estão sendo carregados da API
**Then** o sistema DEVE exibir skeleton loaders ou spinner
**And** o conteúdo NÃO DEVE "pular" quando os dados carregarem

#### Scenario: Erro de rede

**Given** o usuário acessa `/captura/historico/123`
**And** a API está indisponível
**Then** o sistema DEVE exibir mensagem de erro amigável
**And** o sistema DEVE oferecer botão "Tentar Novamente"

#### Scenario: Tentar novamente após erro

**Given** ocorreu um erro ao carregar os dados
**When** o usuário clica em "Tentar Novamente"
**Then** o sistema DEVE fazer nova requisição à API
**And** o sistema DEVE mostrar estado de carregamento

---

## MODIFIED Requirements

### Requirement: Comportamento do botão de visualização
O sistema MUST atualizar o comportamento do botão de visualização para navegar ao invés de abrir dialog modal.

**Original**: O botão de visualização abre um dialog modal com os detalhes da captura.

**Modified**: O botão de visualização navega para a página dedicada de detalhes da captura em `/captura/historico/[id]`.

#### Scenario: Botão de visualização (atualizado)

**Given** o usuário está na tabela de histórico
**When** o usuário clica no ícone de olho de uma captura
**Then** o sistema DEVE navegar para `/captura/historico/[id]`
**And** o sistema NÃO DEVE abrir um dialog modal

---

## REMOVED Requirements

### Requirement: Dialog modal de detalhes (removido)

**Reason**: Substituído por página dedicada para melhor UX com conteúdo extenso.

O componente `CapturaDetailsDialog` e seus estados associados (`detailsDialogOpen`, `selectedCaptura`) devem ser removidos do código.

---

## Technical Notes

### API Endpoints
- `GET /api/captura/log/:id` - Buscar detalhes de uma captura específica
  - Response: `{ success: boolean, data: CapturaLog | null, error?: string }`

### Components Structure
```
app/(dashboard)/captura/historico/[id]/
  ├── page.tsx                    (Server Component)
  └── captura-visualizacao.tsx    (Client Component)
```

### Navigation
- Usar `useRouter()` do Next.js para navegação programática
- Usar `Link` do Next.js para links clicáveis
- Preservar histórico de navegação para botão voltar

### Performance Considerations
- JSON grande deve usar `<pre>` com `overflow-x-auto`
- Implementar lazy loading se resultado for muito grande (> 10KB)
- Cache de dados da captura no client-side

### Accessibility
- Botão voltar deve ter aria-label apropriado
- Cards devem ter headings semânticos
- Status badges devem ter contraste adequado
