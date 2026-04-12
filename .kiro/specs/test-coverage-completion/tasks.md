# Implementation Plan: Test Coverage Completion

## Overview

Plano de implementação para completar a cobertura de testes do ZattarOS, seguindo a priorização P0-P8 definida no design. Cada tarefa é incremental e referencia requisitos específicos. Todos os testes usam TypeScript com Jest 30 (node/jsdom) e Playwright para E2E. A biblioteca fast-check já está instalada para property-based tests.

## Tasks

- [x] 1. P0 — Testes unitários e de actions para módulos críticos sem testes
  - [x] 1.1 Criar testes unitários para o módulo `notas`
    - Criar `src/app/(authenticated)/notas/__tests__/unit/notas.domain.test.ts` testando schemas Zod (noteSchema, createNotaSchema, etc.)
    - Criar `src/app/(authenticated)/notas/__tests__/unit/notas.service.test.ts` testando funções públicas do service com mocks do repository
    - Criar `src/app/(authenticated)/notas/__tests__/unit/notas.repository.test.ts` testando queries Supabase com mocks do client
    - Usar mocks compartilhados de `src/__mocks__/` (server-only, next-cache, next-headers)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Criar testes de actions para o módulo `notas`
    - Criar `src/app/(authenticated)/notas/__tests__/actions/notas-actions.test.ts`
    - Validar autenticação via `authenticatedAction`, validação Zod de inputs e delegação ao service
    - Testar cenários de sucesso e erro para cada action exportada
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Criar testes unitários para o módulo `tarefas`
    - Criar `src/app/(authenticated)/tarefas/__tests__/unit/tarefas.domain.test.ts` testando schemas Zod (tarefaSchema, etc.)
    - Criar `src/app/(authenticated)/tarefas/__tests__/unit/tarefas.service.test.ts` com mocks do repository
    - Criar `src/app/(authenticated)/tarefas/__tests__/unit/tarefas.repository.test.ts` com mocks do Supabase client
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.4 Criar testes de actions para o módulo `tarefas`
    - Criar `src/app/(authenticated)/tarefas/__tests__/actions/tarefas-actions.test.ts`
    - Validar autenticação, validação Zod e delegação ao service para cada action
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.5 Criar testes unitários para o módulo `mail`
    - Criar `src/app/(authenticated)/mail/__tests__/unit/mail.domain.test.ts` testando schemas Zod
    - Criar `src/app/(authenticated)/mail/__tests__/unit/mail.service.test.ts` com mocks do repository
    - Criar `src/app/(authenticated)/mail/__tests__/unit/mail.repository.test.ts` com mocks do Supabase client
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.6 Criar testes de actions para o módulo `mail`
    - Criar `src/app/(authenticated)/mail/__tests__/actions/mail-actions.test.ts`
    - Validar autenticação, validação Zod e delegação ao service
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.7 Criar testes unitários para o módulo `project-management`
    - Criar `src/app/(authenticated)/project-management/__tests__/unit/project-management.domain.test.ts`
    - Criar `src/app/(authenticated)/project-management/__tests__/unit/project-management.service.test.ts`
    - Criar `src/app/(authenticated)/project-management/__tests__/unit/project-management.repository.test.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.8 Criar testes de actions para o módulo `project-management`
    - Criar `src/app/(authenticated)/project-management/__tests__/actions/project-management-actions.test.ts`
    - Validar autenticação, validação Zod e delegação ao service
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.9 Criar testes unitários para o módulo `comunica-cnj`
    - Nota: módulo possui apenas README.md, RULES.md, index.ts, layout.tsx, page.tsx — sem domain/service/repository
    - Criar `src/app/(authenticated)/comunica-cnj/__tests__/unit/comunica-cnj.test.ts` testando lógica existente em index.ts e page
    - _Requirements: 1.4, 1.5_

  - [x] 1.10 Criar testes unitários para o módulo `perfil`
    - Criar `src/app/(authenticated)/perfil/__tests__/unit/perfil.domain.test.ts` testando schemas Zod
    - Criar `src/app/(authenticated)/perfil/__tests__/unit/perfil.service.test.ts` com mocks (perfil não possui repository.ts)
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.11 Criar testes de actions para o módulo `perfil`
    - Criar `src/app/(authenticated)/perfil/__tests__/actions/perfil-actions.test.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.12 Criar testes unitários para o módulo `configuracoes`
    - Nota: módulo possui apenas components/, index.ts, layout.tsx, page.tsx — sem domain/service
    - Criar `src/app/(authenticated)/configuracoes/__tests__/unit/configuracoes.test.ts` testando lógica existente
    - _Requirements: 1.4, 1.5_

- [-] 2. Checkpoint — Validar P0
  - Executar `npm test` e garantir que todos os testes P0 passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. P1 — Testes de actions para módulos parciais
  - [ ] 3.1 Criar testes de actions para `acervo`
    - Criar `src/app/(authenticated)/acervo/__tests__/actions/acervo-actions.test.ts`
    - Testar autenticação, validação Zod e delegação ao service para cada action
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.2 Criar testes de actions para `admin`
    - Criar `src/app/(authenticated)/admin/__tests__/actions/admin-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.3 Criar testes de actions para `advogados`
    - Criar `src/app/(authenticated)/advogados/__tests__/actions/advogados-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.4 Criar testes de actions para `agenda`
    - Criar `src/app/(authenticated)/agenda/__tests__/actions/agenda-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.5 Criar testes de actions para `calendar`
    - Criar `src/app/(authenticated)/calendar/__tests__/actions/calendar-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.6 Criar testes de actions para `captura`
    - Criar `src/app/(authenticated)/captura/__tests__/actions/captura-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.7 Criar testes de actions para `cargos`
    - Criar `src/app/(authenticated)/cargos/__tests__/actions/cargos-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.8 Criar testes de actions para `contratos`
    - Criar `src/app/(authenticated)/contratos/__tests__/actions/contratos-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.9 Criar testes de actions para `entrevistas-trabalhistas`
    - Criar `src/app/(authenticated)/entrevistas-trabalhistas/__tests__/actions/entrevistas-trabalhistas-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.10 Criar testes de actions para `expedientes`
    - Criar `src/app/(authenticated)/expedientes/__tests__/actions/expedientes-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.11 Criar testes de actions para `pecas-juridicas`
    - Criar `src/app/(authenticated)/pecas-juridicas/__tests__/actions/pecas-juridicas-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.12 Criar testes de actions para `rh`
    - Criar `src/app/(authenticated)/rh/__tests__/actions/rh-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.13 Criar testes de actions para `tipos-expedientes`
    - Criar `src/app/(authenticated)/tipos-expedientes/__tests__/actions/tipos-expedientes-actions.test.ts`
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Checkpoint — Validar P0 + P1
  - Executar `npm test` e garantir que todos os testes de actions passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. P2 — Testes baseados em propriedades (fast-check)
  - [ ]* 5.1 Property test: Zod Schema Round-Trip
    - **Property 1: Zod Schema Round-Trip**
    - Criar `src/app/(authenticated)/notas/__tests__/unit/notas.domain.property.test.ts`
    - Testar que para qualquer objeto válido, `schema.parse(JSON.parse(JSON.stringify(obj)))` produz objeto equivalente
    - Usar `fc.record()` com arbitraries que respeitem os constraints dos schemas
    - Repetir para schemas de tarefas, mail e project-management
    - `{ numRuns: 100 }`
    - **Validates: Requirements 9.1, 1.1**

  - [ ]* 5.2 Property test: Zod Schema Rejection of Invalid Data
    - **Property 2: Zod Schema Rejection of Invalid Data**
    - Criar `src/app/(authenticated)/notas/__tests__/unit/notas.domain.invalid.property.test.ts`
    - Testar que inputs com campos faltantes, tipos errados ou valores fora de range lançam ZodError
    - Usar `fc.anything()` e `fc.oneof()` para gerar inputs inválidos
    - `{ numRuns: 100 }`
    - **Validates: Requirements 1.1, 2.3, 8.3**

  - [ ]* 5.3 Property test: Financial Calculation Split Invariant
    - **Property 3: Financial Calculation Split Invariant**
    - Criar `src/app/(authenticated)/obrigacoes/__tests__/unit/obrigacoes.financial.property.test.ts`
    - Testar que `calcularSplitPagamento` satisfaz: `valorRepasseCliente + valorEscritorio === valorTotal`
    - Usar `fc.float({ min: 0, noNaN: true })` para valores financeiros
    - `{ numRuns: 100 }`
    - **Validates: Requirements 9.2**

  - [ ]* 5.4 Property test: Formatting Idempotence
    - **Property 4: Formatting Idempotence**
    - Criar `src/lib/design-system/__tests__/formatting.property.test.ts`
    - Testar que `format(format(x)) === format(x)` para formatCurrency, formatCPF, formatCNPJ, formatPhone
    - Usar `fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'))` para gerar inputs numéricos
    - `{ numRuns: 100 }`
    - **Validates: Requirements 9.3**

  - [ ]* 5.5 Property test: CPF/CNPJ Validation Correctness
    - **Property 5: CPF/CNPJ Validation Correctness**
    - Criar `src/lib/design-system/__tests__/validation.property.test.ts`
    - Testar que CPFs gerados algoritmicamente passam em `isValidCPF` e strings aleatórias de 11 dígitos que não satisfazem o algoritmo falham
    - Implementar generator customizado `validCpfArbitrary()` que gera CPFs com dígitos verificadores corretos
    - Mesmo para CNPJ com `validCnpjArbitrary()`
    - `{ numRuns: 100 }`
    - **Validates: Requirements 9.4**

- [ ] 6. P3 — Testes para hooks sem testes
  - [ ] 6.1 Criar testes para `use-realtime-presence-room`
    - Criar `src/hooks/__tests__/use-realtime-presence-room.test.tsx`
    - Usar `renderHook` do Testing Library, mockar Supabase realtime channel
    - Validar transições de estado e cleanup no unmount
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.2 Criar testes para `use-chart-ready`
    - Criar `src/hooks/__tests__/use-chart-ready.test.tsx`
    - Testar transição de estado ready/not-ready
    - _Requirements: 5.1, 5.2_

  - [ ] 6.3 Criar testes para `use-realtime-cursors`
    - Criar `src/hooks/__tests__/use-realtime-cursors.test.tsx`
    - Mockar Supabase realtime, validar tracking de cursores e cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.4 Criar testes para `use-supabase-upload`
    - Criar `src/hooks/__tests__/use-supabase-upload.test.tsx`
    - Mockar Supabase storage, testar upload success/error states
    - _Requirements: 5.1, 5.3_

  - [ ] 6.5 Criar testes para `use-csp-nonce`
    - Criar `src/hooks/__tests__/use-csp-nonce.test.tsx`
    - Testar extração do nonce CSP
    - _Requirements: 5.1, 5.2_

  - [ ] 6.6 Criar testes para `use-editor-upload`
    - Criar `src/hooks/__tests__/use-editor-upload.test.tsx`
    - Mockar dependências de upload, testar estados de progresso
    - _Requirements: 5.1, 5.3_

  - [ ] 6.7 Criar testes para `use-render-count`
    - Criar `src/hooks/__tests__/use-render-count.test.tsx`
    - Testar incremento do contador a cada re-render
    - _Requirements: 5.1, 5.2_

  - [ ] 6.8 Criar testes para `use-twofauth`
    - Criar `src/hooks/__tests__/use-twofauth.test.tsx`
    - Mockar API de 2FA, testar estados de verificação
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.9 Criar testes para `use-toast`
    - Criar `src/hooks/__tests__/use-toast.test.tsx`
    - Testar criação, dismissal e auto-dismiss de toasts
    - _Requirements: 5.1, 5.2_

  - [ ] 6.10 Criar testes para `use-realtime-chat`
    - Criar `src/hooks/__tests__/use-realtime-chat.test.tsx`
    - Mockar Supabase realtime channel, testar envio/recebimento de mensagens e cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.11 Criar testes para `use-realtime-collaboration`
    - Criar `src/hooks/__tests__/use-realtime-collaboration.test.tsx`
    - Mockar Supabase realtime, testar sincronização de estado e cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Checkpoint — Validar P2 + P3
  - Executar `npm test` e garantir que property tests e hook tests passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. P4 — Testes para bibliotecas em src/lib sem testes
  - [ ] 8.1 Criar testes para `src/lib/auth`
    - Criar `src/lib/auth/__tests__/auth.test.ts`
    - Testar funções de autenticação: cenários de sucesso e falha
    - Mockar Supabase auth client
    - _Requirements: 6.1, 6.2_

  - [ ] 8.2 Criar testes para `src/lib/redis`
    - Criar `src/lib/redis/__tests__/redis.test.ts`
    - Mockar ioredis client, testar get/set/delete e construção de keys
    - _Requirements: 6.1, 6.3_

  - [ ] 8.3 Criar testes para `src/lib/logger`
    - Criar `src/lib/logger/__tests__/logger.test.ts`
    - Testar níveis de log, formatação e sanitização de dados sensíveis
    - _Requirements: 6.1, 6.4_

  - [ ] 8.4 Criar testes para `src/lib/mail`
    - Criar `src/lib/mail/__tests__/mail.test.ts`
    - Mockar nodemailer transport, testar envio de emails e construção de templates
    - _Requirements: 6.1, 6.3_

  - [ ] 8.5 Criar testes para `src/lib/storage`
    - Criar `src/lib/storage/__tests__/storage.test.ts`
    - Mockar Supabase storage ou AWS S3 client, testar upload/download/delete
    - _Requirements: 6.1, 6.3_

  - [ ] 8.6 Criar testes para `src/lib/twofauth`
    - Criar `src/lib/twofauth/__tests__/twofauth.test.ts`
    - Testar geração e verificação de códigos 2FA, cenários de sucesso e falha
    - _Requirements: 6.1, 6.2_

  - [ ] 8.7 Criar testes para `src/lib/http`
    - Criar `src/lib/http/__tests__/http.test.ts`
    - Testar funções utilitárias HTTP, transformações de dados e headers
    - _Requirements: 6.1, 6.4_

  - [ ] 8.8 Criar testes para `src/lib/event-aggregation`
    - Criar `src/lib/event-aggregation/__tests__/event-aggregation.test.ts`
    - Testar registro de listeners, emissão de eventos e cleanup
    - _Requirements: 6.1, 6.4_

  - [ ] 8.9 Criar testes para `src/lib/cron`
    - Criar `src/lib/cron/__tests__/cron.test.ts`
    - Testar parsing de expressões cron e scheduling de jobs
    - _Requirements: 6.1, 6.4_

  - [ ] 8.10 Criar testes para `src/lib/csp`
    - Criar `src/lib/csp/__tests__/csp.test.ts`
    - Testar geração de nonces CSP e construção de headers Content-Security-Policy
    - _Requirements: 6.1, 6.2_

  - [ ] 8.11 Criar testes para `src/lib/constants`
    - Criar `src/lib/constants/__tests__/constants.test.ts`
    - Testar que constantes exportadas possuem valores esperados e tipos corretos
    - _Requirements: 6.1, 6.4_

- [ ] 9. Checkpoint — Validar P4
  - Executar `npm test` e garantir que todos os testes de libs passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. P5 — Testes de integração para módulos críticos
  - [ ] 10.1 Criar teste de integração para `notas`
    - Criar `src/app/(authenticated)/notas/__tests__/integration/notas.integration.test.ts`
    - Validar fluxo action → service → repository com mocks apenas no Supabase client
    - Cobrir fluxos de criação e listagem de notas
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.2 Criar teste de integração para `tarefas`
    - Criar `src/app/(authenticated)/tarefas/__tests__/integration/tarefas.integration.test.ts`
    - Validar fluxo completo CRUD com mocks apenas no Supabase client
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.3 Criar teste de integração para `mail`
    - Criar `src/app/(authenticated)/mail/__tests__/integration/mail.integration.test.ts`
    - Validar fluxo de envio e listagem de emails
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.4 Criar teste de integração para `project-management`
    - Criar `src/app/(authenticated)/project-management/__tests__/integration/project-management.integration.test.ts`
    - Validar fluxo de criação e listagem de projetos/tasks
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.5 Criar teste de integração para `perfil`
    - Criar `src/app/(authenticated)/perfil/__tests__/integration/perfil.integration.test.ts`
    - Validar fluxo de atualização de perfil
    - _Requirements: 4.1, 4.2_

  - [ ] 10.6 Criar teste de integração para `captura`
    - Criar `src/app/(authenticated)/captura/__tests__/integration/captura.integration.test.ts`
    - Validar fluxo de captura de processos
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.7 Criar teste de integração para `agenda`
    - Criar `src/app/(authenticated)/agenda/__tests__/integration/agenda.integration.test.ts`
    - Validar fluxo de criação e listagem de compromissos
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.8 Criar teste de integração para `calendar`
    - Criar `src/app/(authenticated)/calendar/__tests__/integration/calendar.integration.test.ts`
    - Validar fluxo de eventos do calendário
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.9 Criar teste de integração para `pecas-juridicas`
    - Criar `src/app/(authenticated)/pecas-juridicas/__tests__/integration/pecas-juridicas.integration.test.ts`
    - Validar fluxo de criação e listagem de peças
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.10 Criar teste de integração para `tipos-expedientes`
    - Criar `src/app/(authenticated)/tipos-expedientes/__tests__/integration/tipos-expedientes.integration.test.ts`
    - _Requirements: 4.1, 4.2_

  - [ ] 10.11 Criar teste de integração para `entrevistas-trabalhistas`
    - Criar `src/app/(authenticated)/entrevistas-trabalhistas/__tests__/integration/entrevistas-trabalhistas.integration.test.ts`
    - Validar fluxo com lógica de validação complexa entre camadas
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 10.12 Criar teste de integração para `redis` (cache hit/miss/invalidação)
    - Criar `src/lib/redis/__tests__/redis.integration.test.ts`
    - Testar cenários de cache hit, cache miss e invalidação
    - _Requirements: 6.5_

- [ ] 11. Checkpoint — Validar P5
  - Executar `npm test` e garantir que todos os testes de integração passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. P6 — Testes E2E para módulos críticos sem E2E
  - [ ] 12.1 Criar teste E2E para `partes`
    - Criar `src/app/(authenticated)/partes/__tests__/e2e/partes-crud-flow.spec.ts`
    - Cobrir fluxo completo de criação, visualização e edição de uma parte
    - Validar feedback visual de erros de validação em formulários
    - Executável via `npm run test:e2e`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.2 Criar teste E2E para `enderecos`
    - Criar `src/app/(authenticated)/enderecos/__tests__/e2e/enderecos-crud-flow.spec.ts`
    - Cobrir CRUD completo de endereços
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.3 Criar teste E2E para `contratos`
    - Criar `src/app/(authenticated)/contratos/__tests__/e2e/contratos-crud-flow.spec.ts`
    - Cobrir criação, visualização e edição de contratos
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.4 Criar teste E2E para `advogados`
    - Criar `src/app/(authenticated)/advogados/__tests__/e2e/advogados-crud-flow.spec.ts`
    - Cobrir CRUD de advogados
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.5 Criar teste E2E para `rh`
    - Criar `src/app/(authenticated)/rh/__tests__/e2e/rh-crud-flow.spec.ts`
    - Cobrir CRUD de registros de RH
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.6 Criar teste E2E para `pericias`
    - Criar `src/app/(authenticated)/pericias/__tests__/e2e/pericias-crud-flow.spec.ts`
    - Cobrir CRUD de perícias
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.7 Criar teste E2E para `tarefas`
    - Criar `src/app/(authenticated)/tarefas/__tests__/e2e/tarefas-crud-flow.spec.ts`
    - Cobrir criação, visualização e edição de tarefas
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.8 Criar teste E2E para `notas`
    - Criar `src/app/(authenticated)/notas/__tests__/e2e/notas-crud-flow.spec.ts`
    - Cobrir criação, visualização e edição de notas
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13. Checkpoint — Validar P6
  - Executar `npm run test:e2e` e garantir que todos os testes E2E passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. P7 — Testes para rotas API
  - [ ] 14.1 Identificar rotas API com lógica de negócio em `src/app/api/`
    - Listar todas as rotas API que possuem lógica além de proxy simples
    - Identificar quais requerem autenticação e quais aceitam parâmetros
    - _Requirements: 8.1_

  - [ ] 14.2 Criar testes para rotas API com lógica de negócio
    - Criar arquivos de teste em `src/app/api/{rota}/__tests__/` para cada rota identificada
    - Validar que requisições sem autenticação retornam 401
    - Validar rejeição de inputs inválidos
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 14.3 Criar testes de rate limiting para rotas API (se aplicável)
    - Testar que rate limit é aplicado corretamente nas rotas que possuem essa proteção
    - _Requirements: 8.4_

- [ ] 15. P8 — Testes para módulos simples
  - [ ] 15.1 Criar testes para o módulo `ajuda`
    - Criar `src/app/(authenticated)/ajuda/__tests__/unit/ajuda.test.ts`
    - Testar lógica existente (docs-registry, design-system, content)
    - _Requirements: 1.4, 1.5_

  - [ ] 15.2 Criar testes para o módulo `calculadoras`
    - Criar `src/app/(authenticated)/calculadoras/__tests__/unit/calculadoras.test.ts`
    - Testar componentes e lógica de cálculo existentes
    - _Requirements: 1.4, 1.5_

  - [ ] 15.3 Criar testes para o módulo `editor`
    - Criar `src/app/(authenticated)/editor/__tests__/unit/editor.test.ts`
    - Testar lógica existente em index.ts e page
    - _Requirements: 1.4, 1.5_

  - [ ] 15.4 Criar testes para o módulo `repasses`
    - Criar `src/app/(authenticated)/repasses/__tests__/unit/repasses.test.ts`
    - Testar lógica existente em components e page
    - _Requirements: 1.4, 1.5_

- [ ] 16. Final checkpoint — Validação completa da suíte
  - Executar `npm test` e garantir que toda a suíte passa sem erros de importação, timeout ou falhas de configuração
  - Executar `npm run test:e2e` e garantir que todos os testes E2E passam
  - Verificar que a estrutura `__tests__/{unit,integration,actions,e2e}/` é consistente em todos os módulos
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental a cada fase
- Property tests (P2) validam propriedades universais de corretude usando fast-check
- Testes unitários e de actions validam cenários específicos e edge cases
- Todos os testes devem usar os mocks compartilhados em `src/__mocks__/`
- Hooks devem ser testados com `renderHook` no ambiente jsdom
- E2E tests usam Playwright e devem ser executáveis via `npm run test:e2e`
