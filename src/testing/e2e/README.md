# Testes E2E - Synthropic

Este diretório contém a infraestrutura e testes end-to-end (E2E) para a aplicação Synthropic, cobrindo os fluxos críticos de negócio.

## 📁 Estrutura

```
src/testing/e2e/
├── mocks.ts          # Funções de mock para APIs
├── fixtures.ts       # Fixtures customizados do Playwright
├── helpers.ts        # Funções auxiliares para testes
└── README.md         # Esta documentação

src/features/
├── processos/__tests__/e2e/
│   ├── processo-crud-flow.spec.ts
│   ├── processo-partes-flow.spec.ts
│   ├── processo-documentos-flow.spec.ts
│   └── processo-timeline-flow.spec.ts
├── audiencias/__tests__/e2e/
│   ├── audiencia-crud-flow.spec.ts
│   ├── audiencia-agendamento-flow.spec.ts
│   ├── audiencia-notificacao-flow.spec.ts
│   └── audiencia-ata-flow.spec.ts
├── financeiro/__tests__/e2e/
│   ├── lancamento-crud-flow.spec.ts
│   ├── conciliacao-flow.spec.ts
│   ├── relatorio-flow.spec.ts
│   └── export-flow.spec.ts
└── obrigacoes/__tests__/e2e/
    ├── acordo-crud-flow.spec.ts
    ├── parcelas-flow.spec.ts
    ├── pagamento-flow.spec.ts
    └── repasse-flow.spec.ts
```

## 🚀 Executar Testes

### Todos os testes E2E
```bash
npm run test:e2e
```

### Testes de uma feature específica
```bash
# Processos
npm run test:e2e -- processos

# Audiências
npm run test:e2e -- audiencias

# Financeiro
npm run test:e2e -- financeiro

# Obrigações
npm run test:e2e -- obrigacoes
```

### Testes em um browser específico
```bash
# Chromium
npm run test:e2e -- --project=chromium

# Firefox
npm run test:e2e -- --project=firefox

# WebKit (Safari)
npm run test:e2e -- --project=webkit
```

### Testes mobile
```bash
# Mobile Chromium
npm run test:e2e -- --project=mobile-chromium

# Mobile WebKit
npm run test:e2e -- --project=mobile-webkit
```

### Modo debug
```bash
# Debug interativo com Playwright Inspector
npm run test:e2e -- --debug

# Modo headed (ver navegador)
npm run test:e2e -- --headed

# Modo UI (interface gráfica do Playwright)
npm run test:e2e -- --ui
```

### Executar um teste específico
```bash
npm run test:e2e -- processo-crud-flow.spec.ts
```

## 📝 Estrutura de um Teste

### Template básico

```typescript
import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, fillProcessoForm } from '@/testing/e2e/helpers';

test.describe('Feature - Fluxo', () => {
  test('deve realizar ação X', async ({ authenticatedPage: page }) => {
    // 1. Navegar para a página
    await page.goto('/processos');

    // 2. Interagir com a UI
    await page.getByRole('button', { name: 'Novo Processo' }).click();

    // 3. Preencher formulário
    await fillProcessoForm(page, {
      numeroProcesso: '0000000-00.2025.5.15.0001',
      // ...
    });

    // 4. Submeter
    await page.getByRole('button', { name: 'Criar' }).click();

    // 5. Validar resultado
    await waitForToast(page, 'Processo criado com sucesso');
    await expect(page.getByText('0000000-00.2025.5.15.0001')).toBeVisible();
  });
});
```

## 🔧 Fixtures Disponíveis

### `authenticatedPage`
Página com autenticação mockada e todos os mocks de API configurados.

```typescript
test('meu teste', async ({ authenticatedPage: page }) => {
  // Página já autenticada e com mocks configurados
});
```

### `processosMockedPage`
Página com mocks específicos para a feature de processos.

```typescript
test('teste de processos', async ({ processosMockedPage: page }) => {
  // Mocks de processos configurados
});
```

### `audienciasMockedPage`
Página com mocks específicos para a feature de audiências.

### `financeiroMockedPage`
Página com mocks específicos para a feature de financeiro.

### `obrigacoesMockedPage`
Página com mocks específicos para a feature de obrigações.

## 🎭 Mocks de API

Os mocks são definidos em `mocks.ts` e incluem:

- **mockProcessosAPI**: APIs de processos (CRUD, partes, documentos, timeline)
- **mockAudienciasAPI**: APIs de audiências (CRUD, agendamento, notificações, atas)
- **mockFinanceiroAPI**: APIs de financeiro (lançamentos, conciliação, relatórios, exportação)
- **mockObrigacoesAPI**: APIs de obrigações (acordos, parcelas, pagamentos, repasses)
- **mockCommonAPIs**: APIs comuns (clientes, contratos, usuários, documentos)

### Exemplo de uso manual de mocks

```typescript
import { mockProcessosAPI } from '@/testing/e2e/mocks';

test('teste customizado', async ({ page }) => {
  // Configurar mocks manualmente
  await mockProcessosAPI(page);

  // Resto do teste...
});
```

## 🛠️ Helpers Disponíveis

### Formulários

- `fillProcessoForm(page, data)`: Preenche formulário de processo
- `fillAudienciaForm(page, data)`: Preenche formulário de audiência
- `fillLancamentoForm(page, data)`: Preenche formulário de lançamento
- `fillAcordoForm(page, data)`: Preenche formulário de acordo

### UI Interactions

- `waitForToast(page, message)`: Aguarda toast de notificação
- `waitForLoadingToFinish(page)`: Aguarda loading terminar
- `openDetailSheet(page, itemText)`: Abre sheet de detalhes
- `closeDialog(page)`: Fecha diálogo
- `navigateToTab(page, tabName)`: Navega para tab
- `selectOption(page, label, option)`: Seleciona opção em select
- `searchAndSelect(page, label, search, result)`: Busca e seleciona

### Tabelas

- `expectRowInTable(page, rowText)`: Valida linha na tabela
- `expectRowWithValues(page, values)`: Valida múltiplos valores em linha
- `clickRowAction(page, rowText, action)`: Clica em ação na linha

### Arquivos

- `uploadFile(page, selector, filePath)`: Faz upload de arquivo
- `waitForDownload(page, action)`: Aguarda download

### Utilidades

- `formatCurrency(value)`: Formata valor monetário
- `formatDate(date)`: Formata data (DD/MM/YYYY)
- `navigateToPage(page, path)`: Navega para página

## 📊 Convenções

### 1. Organização de Testes

- Agrupar testes relacionados com `test.describe()`
- Um arquivo por fluxo de negócio
- Nomear arquivos como `{feature}-{fluxo}-flow.spec.ts`

### 2. Seletores

- **Preferir**: `getByRole()`, `getByLabel()`, `getByText()`
- **Usar com moderação**: `getByTestId()` (quando necessário para estabilidade)
- **Evitar**: Seletores CSS/XPath complexos

```typescript
// ✅ Bom
await page.getByRole('button', { name: 'Salvar' }).click();
await page.getByLabel('Nome').fill('João Silva');

// ⚠️ OK quando necessário
await page.getByTestId('processo-form').click();

// ❌ Evitar
await page.locator('div > button.primary:nth-child(2)').click();
```

### 3. Mocking

- Mockar **todas** as chamadas de API
- Retornar dados realistas e consistentes
- Usar `page.route()` no início dos testes

### 4. Assertions

- Sempre validar estados de loading e sucesso
- Validar mensagens de erro quando aplicável
- Usar timeouts apropriados

```typescript
// Validar loading
await expect(page.getByTestId('loading')).toBeVisible();

// Validar sucesso
await waitForToast(page, 'Salvo com sucesso');

// Validar erro
await expect(page.getByText('Campo obrigatório')).toBeVisible();
```

### 5. Responsividade

Criar variantes mobile para fluxos críticos:

```typescript
test.describe('Processos - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve criar processo em mobile', async ({ authenticatedPage: page }) => {
    // Mesmo fluxo, mas validar comportamento mobile
  });
});
```

## 🎯 Fluxos Cobertos

### Processos
- ✅ Criação, edição e visualização de processos
- ✅ Adição de partes ao processo
- ✅ Vinculação de documentos
- ✅ Timeline de andamentos

### Audiências
- ✅ Criação de audiências (virtual e presencial)
- ✅ Reagendamento e cancelamento
- ✅ Notificação de participantes
- ✅ Registro de ata

### Financeiro
- ✅ Criação de lançamentos (receitas e despesas)
- ✅ Conciliação bancária (manual e automática)
- ✅ Geração de relatórios
- ✅ Exportação de dados (Excel, PDF, CSV)

### Obrigações
- ✅ Criação de acordos com geração de parcelas
- ✅ Edição de parcelas
- ✅ Registro de pagamentos
- ✅ Cálculo e processamento de repasses

## 🐛 Debugging

### Playwright Inspector

```bash
npm run test:e2e -- --debug
```

### Trace Viewer

```bash
# Executar com trace
npm run test:e2e -- --trace on

# Visualizar trace
npx playwright show-trace trace.zip
```

### Screenshots e Vídeos

Configurados automaticamente em `playwright.config.ts`:
- Screenshots: Apenas em falhas
- Vídeos: `retain-on-failure`

## 📚 Recursos Adicionais

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🔍 Troubleshooting

### Teste está falhando intermitentemente
- Adicionar `await page.waitForLoadState('networkidle')` após navegação
- Aumentar timeouts com `{ timeout: 10000 }`
- Verificar se elementos estão realmente visíveis antes de interagir

### Mock não está funcionando
- Verificar se a URL do mock corresponde exatamente à URL da requisição
- Usar `**` para wildcards (ex: `**/api/processos/**`)
- Verificar ordem dos mocks (mais específicos primeiro)

### Seletor não encontra elemento
- Usar Playwright Inspector para identificar seletor correto
- Verificar se elemento está visível (`toBeVisible()`)
- Aguardar elemento aparecer com `waitForSelector()`

## 📈 Cobertura

Os testes E2E complementam os testes unitários e de integração, focando em:

- **Jornadas de usuário completas**
- **Integrações entre features**
- **Validações de UI e UX**
- **Compatibilidade cross-browser**
- **Responsividade mobile**

Para cobertura de código detalhada, executar testes unitários:
```bash
npm run test:coverage
```
