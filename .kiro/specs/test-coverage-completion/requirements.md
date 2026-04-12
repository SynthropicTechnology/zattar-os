# Requirements Document

## Introduction

Este documento define os requisitos para completar a cobertura de testes do ZattarOS. O projeto possui 3028 arquivos-fonte, 233 testes unitários/integração e 28 testes E2E. Existem 11 módulos sem nenhum teste, diversos módulos com cobertura parcial (sem testes de actions, integração ou E2E), 17 bibliotecas em `src/lib` sem testes, 11 hooks sem testes e cobertura mínima de rotas API. O objetivo é estabelecer uma suíte de testes completa e consistente em todos os níveis: unitário, integração, actions, componentes e E2E.

## Glossary

- **Suíte_de_Testes**: Conjunto completo de testes automatizados do projeto, incluindo unitários, integração, actions, componentes e E2E
- **Módulo**: Unidade funcional sob `src/app/(authenticated)/{nome}/` contendo domain.ts, service.ts, repository.ts, actions/ e components/
- **Teste_Unitário**: Teste isolado de funções puras em domain.ts, service.ts e utilitários, executado via Jest no ambiente Node
- **Teste_de_Integração**: Teste que valida fluxos entre camadas (service → repository) com mocks de Supabase, executado via Jest
- **Teste_de_Actions**: Teste de Server Actions que valida autenticação, validação Zod e delegação ao service, executado via Jest
- **Teste_de_Componente**: Teste de componentes React usando Testing Library no ambiente jsdom
- **Teste_E2E**: Teste end-to-end executado via Playwright simulando interação real do usuário no navegador
- **Cobertura_Completa**: Estado em que cada módulo possui pelo menos testes unitários para domain/service, testes de actions e testes de integração
- **Módulo_Sem_Testes**: Módulo que não possui nenhum arquivo de teste (ajuda, calculadoras, comunica-cnj, configuracoes, editor, mail, notas, perfil, project-management, repasses, tarefas)
- **Módulo_Parcial**: Módulo que possui testes mas falta cobertura em uma ou mais camadas (actions, integração, componentes ou E2E)
- **Hook**: Custom React hook em `src/hooks/` que encapsula lógica reutilizável de estado ou efeitos
- **Lib**: Módulo utilitário em `src/lib/` que fornece funcionalidades transversais (auth, redis, logger, mail, etc.)
- **fast-check**: Biblioteca de property-based testing instalada no projeto para testes baseados em propriedades
- **Jest**: Framework de testes versão 30 configurado com projetos separados para ambientes Node e jsdom
- **Playwright**: Framework de testes E2E configurado para Chromium, Firefox, WebKit e dispositivos móveis

## Requirements

### Requirement 1: Cobertura de Testes Unitários para Módulos Sem Testes

**User Story:** Como desenvolvedor, quero que todos os 11 módulos sem testes tenham cobertura unitária para domain.ts e service.ts, para que a lógica de negócio esteja validada em toda a aplicação.

#### Acceptance Criteria

1. WHEN um módulo sem testes possui um arquivo domain.ts com schemas Zod, THE Suíte_de_Testes SHALL conter testes unitários que validem parsing correto de dados válidos e rejeição de dados inválidos para cada schema
2. WHEN um módulo sem testes possui um arquivo service.ts, THE Suíte_de_Testes SHALL conter testes unitários que validem cada função pública do service com mocks do repository
3. WHEN um módulo sem testes possui um arquivo repository.ts, THE Suíte_de_Testes SHALL conter testes unitários que validem a construção correta de queries Supabase com mocks do cliente
4. FOR ALL módulos sem testes (ajuda, calculadoras, comunica-cnj, configuracoes, editor, mail, notas, perfil, project-management, repasses, tarefas), THE Suíte_de_Testes SHALL conter pelo menos um arquivo de teste unitário em `__tests__/unit/`
5. IF um módulo sem testes não possuir domain.ts ou service.ts (módulos simples como ajuda, editor, repasses), THEN THE Suíte_de_Testes SHALL conter testes para os arquivos de lógica existentes (registry, utils, constants)

### Requirement 2: Cobertura de Testes de Server Actions para Módulos Sem Testes

**User Story:** Como desenvolvedor, quero que todos os módulos sem testes que possuem Server Actions tenham testes de actions, para que a camada de entrada da aplicação esteja validada.

#### Acceptance Criteria

1. WHEN um módulo sem testes possui uma pasta actions/ com Server Actions, THE Suíte_de_Testes SHALL conter testes em `__tests__/actions/` que validem cada action exportada
2. WHEN uma Server Action é testada, THE Teste_de_Actions SHALL verificar que a action utiliza `authenticatedAction` para autenticação
3. WHEN uma Server Action recebe input com schema Zod, THE Teste_de_Actions SHALL verificar que inputs inválidos são rejeitados com erro de validação
4. WHEN uma Server Action delega ao service, THE Teste_de_Actions SHALL verificar que o service é chamado com os parâmetros corretos
5. FOR ALL módulos sem testes que possuem actions (mail, notas, perfil, project-management, tarefas), THE Suíte_de_Testes SHALL conter pelo menos um arquivo de teste de actions

### Requirement 3: Completar Cobertura de Actions em Módulos Parciais

**User Story:** Como desenvolvedor, quero que módulos existentes que possuem actions mas não possuem testes de actions tenham essa lacuna preenchida, para que a cobertura seja uniforme.

#### Acceptance Criteria

1. FOR ALL módulos parciais que possuem pasta actions/ sem testes correspondentes (acervo, admin, advogados, agenda, calendar, captura, cargos, contratos, entrevistas-trabalhistas, expedientes, pecas-juridicas, rh, tipos-expedientes), THE Suíte_de_Testes SHALL conter testes em `__tests__/actions/`
2. WHEN um módulo parcial possui múltiplos arquivos de actions, THE Suíte_de_Testes SHALL conter testes para cada arquivo de action
3. WHEN uma action de módulo parcial é testada, THE Teste_de_Actions SHALL seguir o mesmo padrão de validação de autenticação, input Zod e delegação ao service

### Requirement 4: Cobertura de Testes de Integração para Módulos Críticos

**User Story:** Como desenvolvedor, quero que módulos de negócio críticos possuam testes de integração que validem fluxos completos entre camadas, para que regressões em fluxos complexos sejam detectadas.

#### Acceptance Criteria

1. FOR ALL módulos sem testes de integração que possuem fluxos multi-camada (mail, notas, tarefas, project-management, perfil, captura, agenda, calendar, pecas-juridicas, tipos-expedientes, entrevistas-trabalhistas), THE Suíte_de_Testes SHALL conter pelo menos um teste de integração em `__tests__/integration/`
2. WHEN um teste de integração é criado, THE Teste_de_Integração SHALL validar o fluxo completo action → service → repository com mocks apenas na camada de dados (Supabase)
3. WHEN um módulo possui operações CRUD, THE Teste_de_Integração SHALL cobrir pelo menos os fluxos de criação e listagem
4. IF um módulo possui lógica de validação complexa entre camadas, THEN THE Teste_de_Integração SHALL validar cenários de erro que atravessam múltiplas camadas

### Requirement 5: Cobertura de Testes para Hooks Sem Testes

**User Story:** Como desenvolvedor, quero que todos os custom hooks em `src/hooks/` possuam testes, para que a lógica reutilizável de estado esteja validada.

#### Acceptance Criteria

1. FOR ALL hooks sem testes (use-realtime-presence-room, use-chart-ready, use-realtime-cursors, use-supabase-upload, use-csp-nonce, use-editor-upload, use-render-count, use-twofauth, use-toast, use-realtime-chat, use-realtime-collaboration), THE Suíte_de_Testes SHALL conter testes em `src/hooks/__tests__/`
2. WHEN um hook gerencia estado reativo, THE Teste_de_Componente SHALL validar transições de estado usando `renderHook` do Testing Library
3. WHEN um hook interage com APIs externas (Supabase realtime, Dyte), THE Teste_de_Componente SHALL utilizar mocks das dependências externas
4. WHEN um hook possui cleanup em useEffect, THE Teste_de_Componente SHALL verificar que o cleanup é executado corretamente no unmount

### Requirement 6: Cobertura de Testes para Bibliotecas em src/lib

**User Story:** Como desenvolvedor, quero que as bibliotecas utilitárias em `src/lib/` sem testes possuam cobertura, para que funcionalidades transversais críticas estejam validadas.

#### Acceptance Criteria

1. FOR ALL libs sem testes que possuem lógica de negócio (auth, redis, logger, mail, storage, twofauth, http, event-aggregation, cron), THE Suíte_de_Testes SHALL conter testes unitários
2. WHEN uma lib possui funções de autenticação ou segurança (auth, twofauth, csp), THE Teste_Unitário SHALL validar cenários de sucesso e falha de autenticação
3. WHEN uma lib possui integração com serviços externos (redis, mail, storage), THE Teste_Unitário SHALL utilizar mocks dos clientes externos e validar a construção correta de chamadas
4. WHEN uma lib possui funções puras de utilidade (constants, http), THE Teste_Unitário SHALL validar transformações de dados com inputs variados
5. IF uma lib possui lógica de cache ou invalidação (redis), THEN THE Teste_de_Integração SHALL validar cenários de cache hit, cache miss e invalidação

### Requirement 7: Cobertura de Testes E2E para Módulos Críticos Sem E2E

**User Story:** Como desenvolvedor, quero que módulos de negócio críticos que não possuem testes E2E tenham cobertura Playwright, para que fluxos de usuário completos sejam validados no navegador.

#### Acceptance Criteria

1. FOR ALL módulos de negócio críticos sem testes E2E (partes, enderecos, contratos, advogados, rh, pericias, tarefas, notas), THE Suíte_de_Testes SHALL conter pelo menos um teste E2E em `__tests__/e2e/`
2. WHEN um teste E2E é criado para um módulo CRUD, THE Teste_E2E SHALL cobrir o fluxo completo de criação, visualização e edição de um registro
3. WHEN um teste E2E interage com formulários, THE Teste_E2E SHALL validar feedback visual de erros de validação
4. THE Teste_E2E SHALL ser executável via `npm run test:e2e` sem modificações na configuração do Playwright

### Requirement 8: Cobertura de Testes para Rotas API

**User Story:** Como desenvolvedor, quero que as rotas API em `src/app/api/` possuam testes, para que endpoints REST estejam validados.

#### Acceptance Criteria

1. WHEN uma rota API possui lógica de negócio além de proxy simples, THE Suíte_de_Testes SHALL conter testes para a rota em `__tests__/`
2. WHEN uma rota API requer autenticação, THE Teste_Unitário SHALL validar que requisições sem autenticação retornam erro 401
3. WHEN uma rota API aceita parâmetros de query ou body, THE Teste_Unitário SHALL validar rejeição de inputs inválidos
4. IF uma rota API possui rate limiting, THEN THE Teste_de_Integração SHALL validar que o rate limit é aplicado corretamente

### Requirement 9: Testes Baseados em Propriedades para Lógica Crítica

**User Story:** Como desenvolvedor, quero que funções de domínio críticas possuam testes baseados em propriedades usando fast-check, para que edge cases sejam descobertos automaticamente.

#### Acceptance Criteria

1. WHEN um módulo possui schemas Zod de domínio com transformações complexas, THE Suíte_de_Testes SHALL conter testes de propriedade que validem round-trip (parse → serialize → parse) usando fast-check
2. WHEN um módulo possui funções de cálculo financeiro (financeiro, obrigacoes), THE Suíte_de_Testes SHALL conter testes de propriedade que validem invariantes matemáticas (ex: soma de parcelas igual ao total)
3. WHEN um módulo possui funções de formatação (formatCurrency, formatCPF, formatDate), THE Suíte_de_Testes SHALL conter testes de propriedade que validem idempotência (formatar duas vezes produz o mesmo resultado)
4. WHEN um módulo possui funções de validação (isValidCPF, isValidCNPJ), THE Suíte_de_Testes SHALL conter testes de propriedade que validem que inputs gerados aleatoriamente válidos passam e inválidos falham

### Requirement 10: Infraestrutura e Consistência da Suíte de Testes

**User Story:** Como desenvolvedor, quero que a suíte de testes seja consistente, executável e mantenha padrões uniformes, para que novos testes sigam o mesmo padrão e a CI execute sem falhas.

#### Acceptance Criteria

1. THE Suíte_de_Testes SHALL executar completamente via `npm test` sem erros de importação, timeout ou falhas de configuração
2. THE Suíte_de_Testes SHALL seguir a estrutura de diretórios `__tests__/{unit,integration,actions,components,e2e}/` consistentemente em todos os módulos
3. WHEN um novo teste é adicionado, THE Teste SHALL utilizar os mocks compartilhados existentes em `src/__mocks__/` para server-only, next/cache e next/headers
4. WHEN um teste de componente é adicionado, THE Teste SHALL utilizar o ambiente jsdom configurado no projeto Jest
5. IF um teste requer dados de fixture, THEN THE Teste SHALL definir factories ou fixtures locais no próprio arquivo de teste, sem dependência de dados externos
6. THE Suíte_de_Testes SHALL manter o workerIdleMemoryLimit de 512MB configurado para prevenir crashes em testes de propriedade com fast-check
