# RH (Recursos Humanos) Feature

Módulo responsável pela gestão de recursos humanos, incluindo salários e folhas de pagamento.
Este módulo segue a arquitetura **Feature-Sliced Design (FSD)** e utiliza **Server Actions** para comunicação com o backend/banco de dados.

## Onde aparece no app

- Página principal: `src/app/(authenticated)/rh/page.tsx`
- Salários: `src/app/(authenticated)/rh/salarios/page.tsx` e detalhes por usuário em `src/app/(authenticated)/rh/salarios/usuario/[usuarioId]/page.tsx`
- Folhas de pagamento: `src/app/(authenticated)/rh/folhas-pagamento/page.tsx` e detalhes em `src/app/(authenticated)/rh/folhas-pagamento/[id]/page.tsx`

## Entrypoints

- Barrel exports: `src/features/rh/index.ts`
- Actions: `src/features/rh/actions/*`
- Domínio: `src/features/rh/domain.ts`

## 📂 Estrutura

```
src/features/rh/
├── actions/              # Server Actions (API pública da feature)
│   ├── salarios-actions.ts        # Gestão de salários
│   ├── folhas-pagamento-actions.ts # Gestão de folhas
│   └── utils.ts                   # Helpers de autenticação
├── components/           # Componentes React
│   ├── salarios/                  # Componentes de Salários
│   └── folhas-pagamento/          # Componentes de Folhas
├── hooks/                # Hooks customizados (useSalarios, useFolhasPagamento)
├── domain.ts             # Schemas Zod, constantes e regras de domínio
├── repository.ts         # Camada de acesso a dados (Supabase)
├── service.ts            # Camada de serviço (Lógica de Negócio)
├── types.ts              # Definições de tipos TypeScript
├── utils.ts              # Utilitários (formatação, cálculos de data)
└── index.ts              # Barrel export
```

## 🚀 Funcionalidades Principais

### Gestão de Salários

- **Histórico**: Acompanhamento completo de alterações salariais.
- **Vigência**: Controle de data de início e fim de vigência.
- **Integração**: Conexão com cadastro de usuários e cargos.

### Folhas de Pagamento

- **Ciclo de Vida**:
  1. **Rascunho**: Geração inicial (calcula com base nos salários vigentes).
  2. **Aprovada**: Confirmação dos valores e geração de previsão financeira.
  3. **Paga**: Baixa financeira e registro de pagamento.
  4. **Cancelada**: Reversão de operações se necessário.
- **Itens**: Detalhamento por funcionário.
- **Financeiro**: Geração automática de despesas e lançamentos financeiros no módulo financeiro.

## 🛠️ Detalhes Técnicos

### Server Actions

Utilizamos Server Actions para todas as mutações e buscas de dados, eliminando a necessidade de API Routes (`/api/rh`).

Exemplo de uso:

```typescript
import { actionGerarFolhaPagamento } from "@/features/rh/actions/folhas-pagamento-actions";

const result = await actionGerarFolhaPagamento({
  mesReferencia: 10,
  anoReferencia: 2023,
});
```

### Hooks

Hooks React encapsulam a chamada às actions e gerenciam estado de loading/erro.

Exemplo de uso:

```typescript
import { useSalarios } from "@/features/rh/hooks";

const { salarios, isLoading } = useSalarios({ ativo: true });
```

### Validação

Todos os inputs são validados usando **Zod**, com schemas definidos em `domain.ts`.

## 🔄 Migração

Este módulo substitui completamente as antigas rotas de API e componentes localizados em:

- `src/app/api/rh/*` (Removido)
- `src/app/(dashboard)/rh/salarios/components/*` (Migrado)
- `src/app/_lib/hooks/use-salarios.ts` (Substituído)

## ⚠️ Dependências

- **Supabase**: Banco de dados principal.
- **Módulo Financeiro**: As folhas de pagamento criam registros nas tabelas `financeiro.lancamentos`.
- **Módulo Usuários**: Salários são vinculados à tabela `usuarios`.

## Testes

- Unit/Integration: `npm test`

## Links

- Padrões FSD/DDD do projeto: `AGENTS.md`
- Arquitetura: `ARCHITECTURE.md`
