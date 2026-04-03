# Testes - Portal Cliente

## Estrutura

- `unit/`: Testes unitários (service, utils)
- `integration/`: Testes de integração (fluxos completos com cookies)
- `actions/`: Testes de Server Actions
- `fixtures.ts`: Dados de teste

## Arquivos de Teste

### Testes Unitários

- **portal-cliente.service.test.ts**: Testa a orquestração de múltiplas features
  - Agregação de dados: cliente, processos, contratos, audiencias, pagamentos
  - Chamadas paralelas com `Promise.all`
  - Limpeza de CPF (remover caracteres não numéricos)
  - Tratamento de erro: cliente não encontrado
  - Fallback para arrays vazios quando serviços falham

- **portal-cliente.utils.test.ts**: Testa validação de CPF
  - Função `validarCpf()`: CPF válido, inválido, formatação
  - Validação de dígitos verificadores (rejeitar CPFs com todos os dígitos iguais)
  - Schema Zod `cpfSchema`: 11 dígitos, apenas números
  - Normalização: remover caracteres não numéricos

### Testes de Integração

- **portal-dashboard-flow.test.ts**: Testa fluxos com autenticação via cookies
  - Login → Validar CPF → Setar cookie → Carregar dashboard
  - Estrutura do cookie: cpf, nome, httpOnly, secure, maxAge
  - Logout → Deletar cookies (portal-cpf-session, portal_session)
  - Sessão válida/inválida → Erro ao carregar dashboard

### Testes de Actions

- **portal-actions.test.ts**: Testa Server Actions
  - `validarCpfESetarSessao()`: CPF válido/inválido, cliente não encontrado
  - `actionLoginPortal()`: sucesso (redirect), erro (retorna objeto)
  - `actionCarregarDashboard()`: sessão válida, sessão inválida
  - `actionLogout()`: deletar cookies, redirect

## Executar Testes

```bash
# Executar todos os testes de portal-cliente
npm run test:portal-cliente

# Executar em modo watch
npm run test:portal-cliente -- --watch

# Executar com cobertura
npm run test:coverage:portal-cliente

# Executar apenas testes unitários
npm test -- src/features/portal-cliente/__tests__/unit

# Executar apenas testes de integração
npm test -- src/features/portal-cliente/__tests__/integration

# Executar apenas testes de actions
npm test -- src/features/portal-cliente/__tests__/actions
```

## Cobertura Esperada

- **Service**: 85%+
- **Utils**: 95%+
- **Actions**: 90%+

## Fixtures

O arquivo `fixtures.ts` contém funções auxiliares para gerar dados de teste:

- `criarClienteMock(overrides)`: Cria um cliente mock
- `criarProcessoMock(overrides)`: Cria um processo mock
- `criarContratoMock(overrides)`: Cria um contrato mock
- `criarAudienciaMock(overrides)`: Cria uma audiência mock
- `criarPagamentoMock(overrides)`: Cria um pagamento mock
- `criarDashboardDataMock(overrides)`: Cria dashboard completo mock

### Exemplo de Uso

```typescript
import { criarDashboardDataMock } from '../fixtures';

const dashboard = criarDashboardDataMock({
  cliente: { nome: 'Maria Santos', cpf: '98765432100' },
  processos: [],
  contratos: [],
});
```

## Padrão AAA

Todos os testes seguem o padrão **Arrange-Act-Assert**:

```typescript
it('deve obter dashboard completo com sucesso', async () => {
  // Arrange - Preparar dados e mocks
  const cpf = '123.456.789-00';
  mockPartesService.buscarClientePorDocumento.mockResolvedValue(ok(cliente));

  // Act - Executar ação
  const result = await service.obterDashboardCliente(cpf);

  // Assert - Verificar resultados
  expect(result.cliente.nome).toBe('João da Silva');
  expect(result.processos).toHaveLength(2);
});
```

## Mocks

### Cookies (next/headers)

```typescript
const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));
```

### Redirect (next/navigation)

```typescript
const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
```

### Feature Services

```typescript
jest.mock('@/app/(authenticated)/partes/service');
jest.mock('@/features/acervo/service');
jest.mock('@/features/contratos/service');
jest.mock('@/features/audiencias/service');
jest.mock('@/features/obrigacoes/service');
```

## Features Especiais

### Orquestração de Múltiplas Features

O service do Portal Cliente orquestra 5 features diferentes:
1. **Partes**: buscar cliente por CPF
2. **Acervo**: buscar processos do cliente
3. **Contratos**: listar contratos do cliente
4. **Audiências**: listar audiências do cliente
5. **Obrigações**: listar pagamentos/acordos do cliente

### Autenticação via Cookies

Utiliza cookies HTTP-only para segurança:
- `portal-cpf-session`: CPF do cliente (httpOnly, secure)
- `portal_session`: Nome do cliente (opcional)
- Expiration: 7 dias (604800 segundos)

### Validação de CPF

Implementa validação robusta:
- Formato: 11 dígitos numéricos
- Rejeita CPFs com todos os dígitos iguais (11111111111, etc)
- Remove caracteres não numéricos antes da validação
- Retorna CPF limpo e flag de validade

## Convenções

1. Sempre usar `// @ts-nocheck` no início dos arquivos de teste
2. Limpar mocks em `beforeEach`
3. Usar `ok()` e `err()` do tipo `Result<T>` para resultados
4. Nomear testes descritivamente: "deve [ação] quando [condição]"
5. Agrupar testes relacionados com `describe`
6. Validar tanto o caminho feliz quanto os erros
7. Testar fallbacks para serviços que falham (arrays vazios)

## Dependências Entre Features

O Portal Cliente depende de:
- `@/app/(authenticated)/partes`: buscar cliente
- `@/features/acervo`: buscar processos
- `@/features/contratos`: listar contratos
- `@/features/audiencias`: listar audiências
- `@/features/obrigacoes`: listar acordos/pagamentos

Todos os mocks devem simular essas dependências corretamente.
