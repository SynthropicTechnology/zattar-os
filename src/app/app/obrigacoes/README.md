# Feature: Obrigações

Este módulo gerencia obrigações financeiras (acordos, condenações e custas processuais) seguindo a arquitetura **FSD (Feature-Sliced Design)**.

## Onde aparece no app

- Rotas principais em `src/app/app/acordos-condenacoes/*` (lista, mês, ano, semana, novo, editar, detalhes)
- Cards/resumos no dashboard podem consumir tipos/dados desta feature

## Entrypoints

- UI: componentes em `components/` (table/calendar/dialogs)
- Server Actions: `actions/`
- Regras: `domain.ts` + `RULES.md`
- Dados: `repository.ts`

## Estrutura

- **components/**
  - **table/**: Componentes da tabela (DataShell pattern)
  - **calendar/**: Visualizações de calendário (Mês, Ano)
  - **dialogs/**: Diálogos de criação e detalhes
  - **shared/**: Componentes reutilizáveis (Cards, Alertas)
- **actions/**: Server Actions para manipulação de dados
- **domain.ts**: Definições de tipos e regras de negócio
- **repository.ts**: Acesso ao banco de dados (Supabase)

## Funcionalidades Principais

- **Visualizações Temporais**: Semana, Mês, Ano e Lista.
- **Integração Financeira**: Sincronização com contas a pagar/receber.
- **Gestão de Parcelas**: Controle detalhado de parcelas e repasses.

## Componentes Chave

- `ObrigacoesContent`: Container principal que gerencia o estado da visualização.
- `ObrigacoesTableWrapper`: Implementação da tabela com filtros avançados.
- `ObrigacoesCalendarMonth`: Visualização de calendário mensal.
- `ObrigacaoDetalhesDialog`: Visualização detalhada de uma obrigação.

## Fluxo de Dados

1. O usuário acessa as telas de obrigações (ex.: `/acordos-condenacoes/lista`).
2. `ObrigacoesContent` determina a visualização inicial baseada na URL.
3. Componentes de visualização (Table/Calendar) buscam dados via Server Actions.
4. Ações de criação/edição/exclusão invalidam o cache e atualizam a interface.

## Testes

- E2E (Playwright): `npm run test:e2e` (ver `src/testing/e2e/README.md`)
- Unit/Integration: `npm test` (quando houver testes no módulo)

## Links

- Regras de negócio: `src/features/obrigacoes/RULES.md`
- Padrões de UI compartilhada: `src/components/shared/README.md`
