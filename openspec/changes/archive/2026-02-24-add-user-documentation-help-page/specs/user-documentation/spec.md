## ADDED Requirements

### Requirement: Página principal de ajuda

O sistema SHALL exibir uma página de ajuda em `/app/ajuda` com visão geral do sistema, cards de acesso rápido aos módulos principais, e um campo de busca.

#### Scenario: Acesso à página de ajuda
- **WHEN** o usuário navegar para `/app/ajuda`
- **THEN** o sistema exibe a página inicial da documentação com uma descrição geral do Synthropic, cards de acesso rápido para cada categoria de módulos (Principal, Serviços, Gestão), e um campo de busca no topo

#### Scenario: Busca de funcionalidade
- **WHEN** o usuário digitar um termo no campo de busca (ex: "cliente", "contrato", "DRE")
- **THEN** a sidebar de navegação filtra os itens que correspondem ao termo no título ou palavras-chave, destacando os resultados

---

### Requirement: Layout com sidebar de navegação de documentação

O sistema SHALL renderizar um layout dedicado em `/app/ajuda` com uma sidebar fixa à esquerda contendo a árvore de navegação de tópicos, e a área de conteúdo à direita.

#### Scenario: Navegação pela sidebar
- **WHEN** o usuário clicar em um item da sidebar (ex: "Clientes")
- **THEN** o sistema navega para `/app/ajuda/partes/clientes` e exibe o conteúdo correspondente, marcando o item como ativo na sidebar

#### Scenario: Expansão de seções
- **WHEN** o usuário clicar em uma categoria com sub-itens (ex: "Partes")
- **THEN** a categoria expande mostrando seus sub-itens (Clientes, Partes Contrárias, Terceiros, Representantes)

#### Scenario: Sidebar responsiva
- **WHEN** o usuário acessar a página de ajuda em tela menor que 768px
- **THEN** a sidebar de documentação será colapsável com um botão toggle, e o conteúdo ocupará a largura total quando a sidebar estiver fechada

---

### Requirement: Registro centralizado de documentação (docs-registry)

O sistema SHALL manter um arquivo de registro (`docs-registry.ts`) que mapeia slugs para componentes de conteúdo, títulos, e metadados de navegação.

#### Scenario: Resolução de slug para conteúdo
- **WHEN** o usuário navegar para `/app/ajuda/partes/clientes`
- **THEN** o sistema resolve o slug `["partes", "clientes"]` no registry e renderiza o componente de documentação correspondente

#### Scenario: Slug inválido
- **WHEN** o usuário navegar para um slug que não existe no registry (ex: `/app/ajuda/inexistente`)
- **THEN** o sistema exibe uma mensagem "Página não encontrada" com link para voltar à página inicial de ajuda

---

### Requirement: Componentes de documentação reutilizáveis

O sistema SHALL disponibilizar componentes auxiliares para padronizar a escrita da documentação.

#### Scenario: Tabela de campos (DocFieldTable)
- **WHEN** um componente de documentação usar `DocFieldTable` com lista de campos
- **THEN** o sistema renderiza uma tabela com colunas: Campo, Tipo, Obrigatório, Descrição

#### Scenario: Lista de ações (DocActionList)
- **WHEN** um componente de documentação usar `DocActionList` com lista de ações
- **THEN** o sistema renderiza uma lista com ícone, nome da ação, e descrição do que ela faz

#### Scenario: Dica de uso (DocTip)
- **WHEN** um componente de documentação usar `DocTip` com texto
- **THEN** o sistema renderiza um callout visual destacado com ícone de dica e o texto informativo

#### Scenario: Passos numerados (DocSteps)
- **WHEN** um componente de documentação usar `DocSteps` com lista de passos
- **THEN** o sistema renderiza os passos numerados sequencialmente com título e descrição de cada passo

---

### Requirement: Documentação do módulo Dashboard

O sistema SHALL documentar o módulo Dashboard descrevendo os widgets disponíveis, métricas exibidas, e opções de personalização.

#### Scenario: Usuário consulta documentação do Dashboard
- **WHEN** o usuário navegar para `/app/ajuda/dashboard`
- **THEN** o sistema exibe documentação explicando: visão geral do dashboard, cards de métricas (processos ativos, audiências da semana, expedientes pendentes), sub-dashboards por área (Audiências, Contratos, Expedientes, Financeiro, Geral, Processos), e como personalizar os widgets

---

### Requirement: Documentação do módulo Partes — Clientes

O sistema SHALL documentar o cadastro de clientes com todos os campos, ações possíveis e fluxos.

#### Scenario: Usuário consulta documentação de Clientes
- **WHEN** o usuário navegar para `/app/ajuda/partes/clientes`
- **THEN** o sistema exibe: descrição geral do cadastro de clientes, tabela de campos (nome, CPF/CNPJ, tipo pessoa, email, celular, endereço, estado civil, gênero, nacionalidade, RG, data nascimento), ações disponíveis (criar novo cliente, editar, visualizar detalhes, buscar/filtrar, exportar), e dicas de uso

---

### Requirement: Documentação do módulo Partes — Partes Contrárias

O sistema SHALL documentar o cadastro de partes contrárias.

#### Scenario: Usuário consulta documentação de Partes Contrárias
- **WHEN** o usuário navegar para `/app/ajuda/partes/partes-contrarias`
- **THEN** o sistema exibe: descrição (partes adversárias nos processos), tabela de campos, ações de CRUD, e relação com processos

---

### Requirement: Documentação do módulo Partes — Terceiros

O sistema SHALL documentar o cadastro de terceiros.

#### Scenario: Usuário consulta documentação de Terceiros
- **WHEN** o usuário navegar para `/app/ajuda/partes/terceiros`
- **THEN** o sistema exibe: descrição (pessoas envolvidas indiretamente nos processos), tabela de campos, e ações disponíveis

---

### Requirement: Documentação do módulo Partes — Representantes

O sistema SHALL documentar o cadastro de representantes.

#### Scenario: Usuário consulta documentação de Representantes
- **WHEN** o usuário navegar para `/app/ajuda/partes/representantes`
- **THEN** o sistema exibe: descrição (advogados representantes das partes), tabela de campos (nome, CPF, OAB, email, celular), e ações disponíveis

---

### Requirement: Documentação do módulo Contratos

O sistema SHALL documentar a gestão de contratos.

#### Scenario: Usuário consulta documentação de Contratos
- **WHEN** o usuário navegar para `/app/ajuda/contratos`
- **THEN** o sistema exibe: descrição geral (contratos de honorários advocatícios), tabela de campos, ações (criar contrato, editar, vincular clientes e processos, definir valores e parcelas, visualizar detalhes), e fluxo de criação passo a passo

---

### Requirement: Documentação do módulo Processos

O sistema SHALL documentar a gestão de processos judiciais.

#### Scenario: Usuário consulta documentação de Processos
- **WHEN** o usuário navegar para `/app/ajuda/processos`
- **THEN** o sistema exibe: descrição geral, tabela de campos (número do processo, tribunal, grau, vara, comarca, partes, status, classe judicial), ações (criar, editar, filtrar por status/tribunal, visualizar timeline, vincular partes), e explicação sobre captura automática do PJE

---

### Requirement: Documentação do módulo Audiências

O sistema SHALL documentar a gestão de audiências.

#### Scenario: Usuário consulta documentação de Audiências
- **WHEN** o usuário navegar para `/app/ajuda/audiencias`
- **THEN** o sistema exibe: descrição geral, tabela de campos (data, hora, tipo, local, processo vinculado, partes, status), visualizações disponíveis (semana, mês, ano, lista), ações (criar, editar, filtrar, exportar), e integração com calendário

---

### Requirement: Documentação do módulo Expedientes

O sistema SHALL documentar a gestão de expedientes/intimações.

#### Scenario: Usuário consulta documentação de Expedientes
- **WHEN** o usuário navegar para `/app/ajuda/expedientes`
- **THEN** o sistema exibe: descrição geral (intimações e comunicações do tribunal), tabela de campos, visualizações (semana, mês, ano, lista), ações (marcar como lido, responder, filtrar por tipo/status), e explicação sobre prazos

---

### Requirement: Documentação do módulo Perícias

O sistema SHALL documentar a gestão de perícias.

#### Scenario: Usuário consulta documentação de Perícias
- **WHEN** o usuário navegar para `/app/ajuda/pericias`
- **THEN** o sistema exibe: descrição geral (perícias judiciais e extrajudiciais), tabela de campos (tipo, perito, data, processo vinculado, quesitos, status), visualizações disponíveis, e ações

---

### Requirement: Documentação do módulo Obrigações

O sistema SHALL documentar a gestão de acordos e condenações.

#### Scenario: Usuário consulta documentação de Obrigações
- **WHEN** o usuário navegar para `/app/ajuda/obrigacoes`
- **THEN** o sistema exibe: descrição geral (acordos judiciais, condenações, parcelas de pagamento), tabela de campos, visualizações (semana, mês, ano, lista), ações (criar, editar, registrar pagamento, acompanhar parcelas), e relação com processos e financeiro

---

### Requirement: Documentação do módulo Planner — Agenda

O sistema SHALL documentar o calendário/agenda.

#### Scenario: Usuário consulta documentação da Agenda
- **WHEN** o usuário navegar para `/app/ajuda/planner/agenda`
- **THEN** o sistema exibe: descrição geral (calendário com eventos, audiências, expedientes e prazos), como criar eventos, visualizações disponíveis, e integração com audiências/expedientes

---

### Requirement: Documentação do módulo Planner — Tarefas

O sistema SHALL documentar o sistema de tarefas/kanban.

#### Scenario: Usuário consulta documentação de Tarefas
- **WHEN** o usuário navegar para `/app/ajuda/planner/tarefas`
- **THEN** o sistema exibe: descrição geral (quadros kanban para gestão de tarefas), como criar quadros e tarefas, colunas e status, arrastar e soltar, atribuir responsáveis, e filtros disponíveis

---

### Requirement: Documentação do módulo Planner — Notas

O sistema SHALL documentar o sistema de notas.

#### Scenario: Usuário consulta documentação de Notas
- **WHEN** o usuário navegar para `/app/ajuda/planner/notas`
- **THEN** o sistema exibe: descrição geral (notas pessoais e compartilhadas), como criar e editar notas, organização por pastas/tags, e editor de texto disponível

---

### Requirement: Documentação do módulo Documentos

O sistema SHALL documentar o módulo de documentos/editor.

#### Scenario: Usuário consulta documentação de Documentos
- **WHEN** o usuário navegar para `/app/ajuda/documentos`
- **THEN** o sistema exibe: descrição geral (editor de documentos com IA), como criar documentos, usar o editor (formatação, templates), lixeira, e funcionalidades de IA (assistente de escrita)

---

### Requirement: Documentação do módulo Peças Jurídicas

O sistema SHALL documentar a geração de peças jurídicas.

#### Scenario: Usuário consulta documentação de Peças Jurídicas
- **WHEN** o usuário navegar para `/app/ajuda/pecas-juridicas`
- **THEN** o sistema exibe: descrição geral (geração automatizada de petições e documentos jurídicos), como criar novo modelo, usar placeholders, gerar peça a partir de contrato, e editar/exportar

---

### Requirement: Documentação do módulo Pesquisa Jurídica

O sistema SHALL documentar as ferramentas de pesquisa jurídica (Diário Oficial e Pangea).

#### Scenario: Usuário consulta documentação de Pesquisa Jurídica
- **WHEN** o usuário navegar para `/app/ajuda/pesquisa-juridica`
- **THEN** o sistema exibe: descrição do Diário Oficial (Comunica CNJ — comunicações e publicações oficiais), e Pangea (busca semântica em bases jurídicas), com instruções de uso de cada ferramenta

---

### Requirement: Documentação do módulo Chat

O sistema SHALL documentar o chat interno.

#### Scenario: Usuário consulta documentação do Chat
- **WHEN** o usuário navegar para `/app/ajuda/chat`
- **THEN** o sistema exibe: descrição geral (chat com IA e histórico de chamadas), como iniciar conversas, usar o chat para perguntas jurídicas, e histórico de interações

---

### Requirement: Documentação do módulo Assistentes

O sistema SHALL documentar os assistentes de IA.

#### Scenario: Usuário consulta documentação de Assistentes
- **WHEN** o usuário navegar para `/app/ajuda/assistentes`
- **THEN** o sistema exibe: descrição geral (assistentes de IA especializados), lista de assistentes disponíveis, como interagir, e exemplos de uso

---

### Requirement: Documentação do módulo Assinatura Digital

O sistema SHALL documentar o módulo completo de assinatura digital (Documentos, Templates, Formulários).

#### Scenario: Usuário consulta documentação de Assinatura Digital — Documentos
- **WHEN** o usuário navegar para `/app/ajuda/assinatura-digital/documentos`
- **THEN** o sistema exibe: descrição geral (documentos para coleta de assinatura digital), como criar novo documento, configurar signatários, enviar para assinatura, acompanhar status, e revisar documentos assinados

#### Scenario: Usuário consulta documentação de Assinatura Digital — Templates
- **WHEN** o usuário navegar para `/app/ajuda/assinatura-digital/templates`
- **THEN** o sistema exibe: descrição geral (modelos reutilizáveis para documentos), como criar template, fazer upload de PDF, definir campos de preenchimento, e gerenciar templates

#### Scenario: Usuário consulta documentação de Assinatura Digital — Formulários
- **WHEN** o usuário navegar para `/app/ajuda/assinatura-digital/formularios`
- **THEN** o sistema exibe: descrição geral (formulários públicos para coleta de dados e assinatura), como criar formulário, configurar campos, vincular templates, gerar link público, e gerenciar respostas

---

### Requirement: Documentação do módulo Financeiro

O sistema SHALL documentar todas as sub-áreas do módulo financeiro.

#### Scenario: Usuário consulta documentação do Dashboard Financeiro
- **WHEN** o usuário navegar para `/app/ajuda/financeiro`
- **THEN** o sistema exibe: visão geral do módulo financeiro, métricas e gráficos disponíveis

#### Scenario: Usuário consulta documentação de Orçamentos
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/orcamentos`
- **THEN** o sistema exibe: como criar orçamentos, análise de orçamento, comparação entre períodos, e aprovação

#### Scenario: Usuário consulta documentação de Contas a Pagar
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/contas-pagar`
- **THEN** o sistema exibe: como registrar despesas, categorizar por plano de contas, marcar como paga, e filtrar/exportar

#### Scenario: Usuário consulta documentação de Contas a Receber
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/contas-receber`
- **THEN** o sistema exibe: como registrar receitas, vincular a contratos, relatório de inadimplência, marcar como recebida, e filtrar/exportar

#### Scenario: Usuário consulta documentação do Plano de Contas
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/plano-contas`
- **THEN** o sistema exibe: como gerenciar categorias contábeis, estrutura hierárquica, e vinculação com lançamentos

#### Scenario: Usuário consulta documentação de Conciliação Bancária
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/conciliacao`
- **THEN** o sistema exibe: como importar extratos, conciliar lançamentos, e resolver divergências

#### Scenario: Usuário consulta documentação do DRE
- **WHEN** o usuário navegar para `/app/ajuda/financeiro/dre`
- **THEN** o sistema exibe: como visualizar o Demonstrativo de Resultado do Exercício, selecionar período, comparar com orçado, e exportar

---

### Requirement: Documentação do módulo Recursos Humanos

O sistema SHALL documentar as sub-áreas de RH.

#### Scenario: Usuário consulta documentação de Equipe/Usuários
- **WHEN** o usuário navegar para `/app/ajuda/rh/equipe`
- **THEN** o sistema exibe: como gerenciar membros da equipe, criar/editar usuários, definir cargos e permissões, e gerenciar acessos

#### Scenario: Usuário consulta documentação de Salários
- **WHEN** o usuário navegar para `/app/ajuda/rh/salarios`
- **THEN** o sistema exibe: como cadastrar salários por funcionário, registrar componentes (salário base, gratificações, descontos), e visualizar relatório de custo de pessoal

#### Scenario: Usuário consulta documentação de Folhas de Pagamento
- **WHEN** o usuário navegar para `/app/ajuda/rh/folhas-pagamento`
- **THEN** o sistema exibe: como gerar folha de pagamento mensal, visualizar detalhes por funcionário, e relatório mensal

---

### Requirement: Documentação do módulo Captura

O sistema SHALL documentar o sistema de captura automática de dados do PJE.

#### Scenario: Usuário consulta documentação de Captura
- **WHEN** o usuário navegar para `/app/ajuda/captura`
- **THEN** o sistema exibe: descrição geral (captura automática de dados de processos do PJE-TRT), sub-seções para Histórico (visualizar capturas realizadas), Agendamentos (programar capturas automáticas), Advogados (gerenciar advogados para captura), Credenciais (configurar credenciais de acesso ao PJE), e Tribunais (selecionar tribunais monitorados)

---

### Requirement: Documentação de Configurações e Perfil

O sistema SHALL documentar as páginas de perfil, configurações e notificações.

#### Scenario: Usuário consulta documentação de Perfil
- **WHEN** o usuário navegar para `/app/ajuda/perfil`
- **THEN** o sistema exibe: como editar dados pessoais, alterar senha, e configurar avatar

#### Scenario: Usuário consulta documentação de Configurações
- **WHEN** o usuário navegar para `/app/ajuda/configuracoes`
- **THEN** o sistema exibe: configurações do sistema (integrações, assistentes de IA, aparência), e como cada configuração afeta o funcionamento

#### Scenario: Usuário consulta documentação de Notificações
- **WHEN** o usuário navegar para `/app/ajuda/notificacoes`
- **THEN** o sistema exibe: como funciona o sistema de notificações, tipos de notificação (audiências, expedientes, prazos), e como configurar preferências
