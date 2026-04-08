## Why

O sistema Synthropic 2.0 não possui documentação de usuário final. A página de ajuda (`/app/ajuda`) existe mas contém apenas um playground do design system interno. Usuários novos dependem de treinamento presencial ou tentativa e erro para aprender a usar o sistema. Uma documentação completa, acessível dentro do próprio sistema, reduz o tempo de onboarding, diminui a carga de suporte e serve como referência permanente para todas as funcionalidades.

## What Changes

- **Nova página de documentação do usuário** em `/app/ajuda` com navegação por módulos e busca
- **Conteúdo completo** cobrindo todos os módulos do sistema, organizado na mesma hierarquia do sidebar:
  - **Navegação Principal:** Dashboard, Partes (Clientes, Partes Contrárias, Terceiros, Representantes), Contratos, Processos, Audiências, Expedientes, Perícias, Obrigações
  - **Serviços:** Planner (Agenda, Tarefas, Notas), Documentos, Peças Jurídicas, Pesquisa Jurídica (Diário Oficial, Pangea), Chat, Assistentes, Assinatura Digital (Documentos, Templates, Formulários)
  - **Gestão (Admin):** Financeiro (Dashboard, Orçamentos, Contas a Pagar, Contas a Receber, Plano de Contas, Conciliação Bancária, DRE), Recursos Humanos (Equipe, Salários, Folhas de Pagamento), Captura (Histórico, Agendamentos, Advogados, Credenciais, Tribunais)
  - **Configurações:** Perfil, Configurações, Notificações
- **Cada página documentada** com: descrição geral, campos disponíveis, ações possíveis (criar, editar, excluir, filtrar, exportar), e dicas de uso
- **Sidebar de navegação** na página de ajuda para navegar entre os tópicos de documentação
- **Busca full-text** dentro da documentação para encontrar funcionalidades rapidamente

## Capabilities

### New Capabilities
- `user-documentation`: Página de documentação do usuário final com conteúdo organizado por módulos, navegação lateral, busca e rendering de markdown/MDX. Cobre a estrutura da página, componentes de navegação e o conteúdo textual de cada módulo do sistema.

### Modified Capabilities
_(nenhuma — esta é uma feature nova e independente)_

## Impact

- **Affected code**:
  - `src/app/app/ajuda/` — Reestruturação completa: nova page, layout com sidebar de documentação, sub-rotas por módulo
  - `src/components/layout/sidebar/app-sidebar.tsx` — Possível adição de link direto para ajuda no sidebar principal
- **Affected specs**: Nenhuma spec existente é modificada
- **Dependencies**: Nenhuma nova dependência externa necessária (conteúdo pode ser em MDX ou componentes React estáticos)
- **Database changes**: Nenhuma
