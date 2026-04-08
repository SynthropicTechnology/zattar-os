# Design: Refatorar Obrigacoes - Separacao Juridico/Financeiro

## Context

O sistema Synthropic gerencia obrigacoes de duas perspectivas distintas:

1. **Perspectiva Juridica**: Acordos e Condenacoes vinculados a processos, com parcelas, vencimentos e repasses ao cliente
2. **Perspectiva Financeira**: Lancamentos em Contas a Receber/Pagar, fluxo de caixa e conciliacao

Atualmente existe uma camada "bridge" em `features/financeiro/domain/obrigacoes.ts` que tenta consolidar ambas perspectivas, criando redundancia e confusao.

### Stakeholders
- Advogados: Gerenciam acordos/condenacoes e acompanham parcelas
- Financeiro: Gerencia lancamentos e fluxo de caixa
- Clientes: Recebem repasses de valores ganhos em processos

### Constraints
- Manter compatibilidade com dados existentes no banco
- Preservar integridade referencial entre parcelas e lancamentos
- Seguir arquitetura FSD existente no projeto
- Usar design system existente (shadcn/ui + Tailwind)

## Goals / Non-Goals

### Goals
- Estabelecer separacao clara de responsabilidades entre modulos
- Eliminar duplicacao de tipos e logica
- Implementar sincronizacao automatica unidirecional (Juridico -> Financeiro)
- Criar pagina de Obrigacoes com UX similar a Expedientes
- Documentar regras de negocio de forma clara

### Non-Goals
- Alterar schema do banco de dados
- Criar novas tabelas ou relacionamentos
- Implementar sincronizacao bidirecional (Financeiro -> Juridico)
- Migrar dados existentes

## Decisions

### Decision 1: Modulo Juridico como Fonte da Verdade

**O que**: `features/obrigacoes/` sera o unico modulo responsavel por Acordos, Condenacoes e Parcelas.

**Por que**:
- Acordos e Condenacoes sao conceitos juridicos por natureza
- As regras de negocio (vencimentos, repasses) sao juridicas
- Evita duplicacao de logica e tipos

**Alternativas consideradas**:
1. Manter bridge em financeiro - Rejeitado: causa duplicacao
2. Criar modulo compartilhado - Rejeitado: adiciona complexidade

### Decision 2: Sincronizacao Automatica Unidirecional

**O que**: Quando uma Parcela e criada/atualizada em Juridico, um Lancamento correspondente e criado/atualizado em Financeiro automaticamente.

**Por que**:
- Garante consistencia sem intervencao manual
- Financeiro sempre reflete estado juridico
- Simplifica fluxo de trabalho

**Implementacao**:
```typescript
// Em features/obrigacoes/actions/parcelas.ts
export async function actionCriarParcelas(acordoId: number, parcelas: ParcelaInput[]) {
  // 1. Cria parcelas no juridico
  const parcelasCriadas = await ObrigacoesRepository.criarParcelas(acordoId, parcelas);

  // 2. Sincroniza com financeiro
  await FinanceiroObrigacoesService.sincronizarParcelas(parcelasCriadas);

  return parcelasCriadas;
}
```

### Decision 3: Tipos Financeiros em `features/financeiro/`

**O que**: `SplitPagamento` e calculos de honorarios permanecem em `features/financeiro/`.

**Por que**:
- Split de pagamento e logica financeira (divisao de valores)
- Calculos de honorarios sao contabeis
- Mantem coesao do modulo financeiro

### Decision 4: Layout Similar a Expedientes

**O que**: Pagina de Obrigacoes seguira estrutura de `features/expedientes/`:
- Multiplas visualizacoes (semana, mes, ano, lista)
- Carrosseis de navegacao temporal
- Filtros avancados com chips
- DataShell para tabela

**Por que**:
- Consistencia de UX no sistema
- Expedientes ja validou o padrao
- Reutiliza componentes existentes

## Arquitetura

### Estrutura de Modulos

```
src/features/
├── obrigacoes/                 # JURIDICO - Fonte da Verdade
│   ├── domain.ts               # Tipos: Acordo, Condenacao, Parcela
│   ├── types.ts                # Enums: TipoObrigacao, Status, etc.
│   ├── repository.ts           # CRUD puro (sem joins financeiros)
│   ├── service.ts              # Logica de negocio juridica
│   ├── actions/                # Server actions
│   │   ├── acordos.ts
│   │   ├── parcelas.ts
│   │   └── repasses.ts
│   ├── components/
│   │   ├── obrigacoes-content.tsx
│   │   ├── table/
│   │   ├── calendar/
│   │   ├── dialogs/
│   │   └── shared/
│   ├── hooks/
│   ├── utils.ts
│   ├── RULES.md                # Regras de negocio
│   └── README.md
│
├── financeiro/
│   ├── domain/
│   │   └── [obrigacoes.ts]     # REMOVER
│   ├── types/
│   │   └── [obrigacoes.ts]     # REMOVER
│   ├── repository/
│   │   └── obrigacoes.ts       # SIMPLIFICAR - apenas integracao
│   ├── services/
│   │   ├── obrigacoes.ts       # SIMPLIFICAR - apenas sincronizacao
│   │   └── obrigacoes-integracao.ts
│   └── actions/
│       └── obrigacoes.ts       # SIMPLIFICAR - apenas sincronizacao
```

### Fluxo de Dados

```
[Usuario]
    |
    v
[ObrigacoesContent] --> [Actions Juridicas] --> [Repository Juridico]
    |                                                    |
    |                                                    v
    |                                            [Banco: acordos_condenacoes, parcelas]
    |                                                    |
    v                                                    v
[Visualizacoes]                              [Trigger Sincronizacao]
    |                                                    |
    v                                                    v
[Filtros/Busca]                              [Services Financeiro]
                                                         |
                                                         v
                                             [Banco: lancamentos_financeiros]
```

### Modelo de Dados

```typescript
// JURIDICO - features/obrigacoes/domain.ts
interface AcordoCondenacao {
  id: number;
  processo_id: number;
  tipo: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao: 'recebimento' | 'pagamento';
  valor_total: number;
  valor_honorarios: number;
  valor_liquido_cliente: number;
  descricao?: string;
  data_acordo?: Date;
  created_at: Date;
  updated_at: Date;
}

interface Parcela {
  id: number;
  acordo_id: number;
  numero: number;
  valor: number;
  data_vencimento: Date;
  status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
  status_repasse: 'nao_aplicavel' | 'pendente_declaracao' | 'pendente_transferencia' | 'repassado';
  data_recebimento?: Date;
  data_repasse?: Date;
  comprovante_repasse_url?: string;
  declaracao_url?: string;
  created_at: Date;
  updated_at: Date;
}

// FINANCEIRO - features/financeiro/domain/lancamentos.ts (existente)
interface LancamentoFinanceiro {
  id: number;
  tipo: 'receita' | 'despesa';
  categoria_id: number;
  conta_id: number;
  valor: number;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: 'pendente' | 'pago' | 'cancelado';
  parcela_id?: number; // FK para parcelas (sincronizacao)
  // ... outros campos
}
```

## Risks / Trade-offs

### Risk 1: Inconsistencia Durante Migracao
- **Risco**: Imports quebrados durante refatoracao
- **Mitigacao**: Fazer alteracoes em fases, validar build a cada fase

### Risk 2: Sincronizacao Falha
- **Risco**: Parcela criada mas lancamento nao
- **Mitigacao**: Usar transacao, implementar retry, log de erros

### Risk 3: Performance em Listagem
- **Risco**: Queries lentas com muitos acordos
- **Mitigacao**: Paginacao server-side, indices adequados

### Trade-off: Sincronizacao vs Independencia
- **Escolha**: Sincronizacao automatica
- **Trade-off**: Dependencia entre modulos
- **Justificativa**: Beneficio de consistencia supera custo de acoplamento

## Migration Plan

### Fase 1: Preparacao (Sem breaking changes)
1. Adicionar novos tipos em `features/obrigacoes/domain.ts`
2. Adicionar novas funcoes em `features/obrigacoes/service.ts`
3. Criar componentes novos
4. Testar em paralelo

### Fase 2: Atualizacao de Consumidores
1. Atualizar imports nos arquivos que usam tipos de financeiro
2. Usar alias temporarios se necessario
3. Validar build

### Fase 3: Remocao de Redundancia
1. Remover `features/financeiro/domain/obrigacoes.ts`
2. Remover `features/financeiro/types/obrigacoes.ts`
3. Simplificar services e repository

### Fase 4: Implementacao de Sincronizacao
1. Adicionar triggers em actions
2. Testar fluxo completo
3. Monitorar logs

### Rollback Plan
1. Manter backup dos arquivos removidos
2. Se necessario, restaurar arquivos
3. Reverter imports

## Open Questions

1. **Frequencia de sincronizacao**: Sincrona (na action) ou assincrona (job)?
   - **Decisao provisoria**: Sincrona, para garantir consistencia imediata

2. **Tratamento de inconsistencias existentes**: Corrigir automaticamente ou alertar?
   - **Decisao provisoria**: Alertar via `actionObterAlertasFinanceiros`

3. **Cache de dados**: Usar React Query ou SWR?
   - **Decisao provisoria**: React Query (ja usado no projeto)

## Referencias

- [expedientes-content.tsx](src/features/expedientes/components/expedientes-content.tsx) - Referencia para layout
- [DataShell](src/components/shared/data-shell.tsx) - Padrao de tabela
- [Supabase Schema](supabase/migrations/) - Schema do banco
