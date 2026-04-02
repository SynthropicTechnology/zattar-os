# Testes - Perícias

## Estrutura

- `unit/`: Testes unitários (service, repository, domain)
- `integration/`: Testes de integração (fluxos completos)
- `actions/`: Testes de Server Actions
- `fixtures.ts`: Dados de teste

## Arquivos de Teste

### Testes Unitários

- **pericias.service.test.ts**: Testa a lógica de negócio do service
  - Listagem com paginação e filtros
  - Obtenção de perícia por ID
  - Atribuição de responsável (com validação Zod)
  - Adição de observações (com validação Zod)
  - Listagem de especialidades

- **pericias.repository.test.ts**: Testa operações de banco de dados
  - Queries complexas com joins (especialidade, perito, responsavel, processo)
  - Filtros: busca, trt, grau, situação, responsável, especialidade, perito
  - Filtros booleanos: laudoJuntado, segredoJustica, prioridadeProcessual, arquivado
  - Filtros de data: prazoEntrega, dataCriacao
  - Cálculo de próximo dia para ranges de data
  - Ordenação e paginação

- **pericias.domain.test.ts**: Testa domain models e schemas Zod
  - Enum `SituacaoPericiaCodigo`
  - Labels `SITUACAO_PERICIA_LABELS`
  - Schema `atribuirResponsavelSchema`
  - Schema `adicionarObservacaoSchema`
  - Validações de edge cases

### Testes de Integração

- **pericias-flow.test.ts**: Testa fluxos completos
  - Listagem → Filtrar → Atribuir responsável
  - Buscar → Adicionar observação
  - Listar especialidades → Filtrar por especialidade
  - Filtros de data com cálculo de próximo dia
  - Filtros complexos (múltiplos simultaneamente)
  - Joins complexos (especialidade, perito, responsavel, processo)

### Testes de Actions

- **pericias-actions.test.ts**: Testa Server Actions
  - Validação Zod (atribuirResponsavelSchema, adicionarObservacaoSchema)
  - Autenticação (authenticatedAction)
  - Revalidação de cache (revalidatePath)
  - Permissões: pericias:listar, pericias:editar, pericias:atribuir

## Executar Testes

```bash
# Executar todos os testes de perícias
npm run test:pericias

# Executar em modo watch
npm run test:pericias -- --watch

# Executar com cobertura
npm run test:coverage:pericias

# Executar apenas testes unitários
npm test -- src/features/pericias/__tests__/unit

# Executar apenas testes de integração
npm test -- src/features/pericias/__tests__/integration

# Executar apenas testes de actions
npm test -- src/features/pericias/__tests__/actions
```

## Cobertura Esperada

- **Service**: 90%+
- **Repository**: 85%+
- **Domain**: 95%+
- **Actions**: 90%+

## Fixtures

O arquivo `fixtures.ts` contém funções auxiliares para gerar dados de teste:

- `criarPericiaMock(overrides)`: Cria uma perícia mock
- `criarEspecialidadeMock(overrides)`: Cria uma especialidade mock
- `criarListarPericiasResultMock(numeroPericias, overrides)`: Cria resultado de listagem paginado mock
- `mockSituacaoPericia`: Mock de situações de perícia
- `mockCodigoTribunal`: Mock de códigos de tribunal (TRT)
- `mockGrauTribunal`: Mock de graus de tribunal

### Exemplo de Uso

```typescript
import { criarPericiaMock, mockSituacaoPericia } from '../fixtures';

const pericia = criarPericiaMock({
  id: 1,
  situacaoCodigo: mockSituacaoPericia.aguardandoLaudo,
  responsavelId: 5,
  observacoes: 'Observação customizada',
});
```

## Padrão AAA

Todos os testes seguem o padrão **Arrange-Act-Assert**:

```typescript
it('deve atribuir responsável com sucesso', async () => {
  // Arrange - Preparar dados e mocks
  (repository.atribuirResponsavelPericia as jest.Mock).mockResolvedValue(ok(true));

  // Act - Executar ação
  const result = await service.atribuirResponsavel({
    periciaId: 1,
    responsavelId: 5,
  });

  // Assert - Verificar resultados
  expect(result.success).toBe(true);
  expect(result.data).toBe(true);
});
```

## Mocks

### Supabase Client

```typescript
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(),
};
```

### Authenticated Action

```typescript
const mockAuthAction = jest.fn((schema, handler) => {
  return async (input: unknown) => {
    const validation = schema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'Dados inválidos' };
    }
    return handler(input, { userId: 'user123' });
  };
});
```

## Features Especiais

### Joins Complexos

Os testes validam joins com múltiplas tabelas:
- `especialidades_pericia`: especialidade da perícia
- `terceiros`: perito responsável
- `usuarios`: responsável atribuído
- `acervo`: processo relacionado com partes

### Filtros de Data

Implementa lógica de "próximo dia" para ranges inclusivos:
```typescript
// prazoEntregaFim: '2024-12-31' → lt('prazo_entrega', '2025-01-01')
```

### Validação Zod

Todos os schemas são testados com:
- Dados válidos
- Valores mínimos/máximos
- Campos faltando
- Tipos incorretos
- Valores vazios
- Edge cases (caracteres especiais, quebras de linha)

## Convenções

1. Sempre usar `// @ts-nocheck` no início dos arquivos de teste
2. Limpar mocks em `beforeEach`
3. Usar `ok()` e `err()` do tipo `Result<T>` para resultados
4. Nomear testes descritivamente: "deve [ação] quando [condição]"
5. Agrupar testes relacionados com `describe`
6. Validar tanto o caminho feliz quanto os erros
