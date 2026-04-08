---
inclusion: always
---

# Design System Synthropic - Protocolos AI-First

Este documento define as regras que agentes de IA devem seguir ao gerar ou modificar codigo no Synthropic.

## 1. Layout & Shells

### Regra: SEMPRE usar PageShell para paginas

```tsx
// CORRETO
import { PageShell } from '@/components/shared/page-shell';

<PageShell title="Processos" description="Gerencie seus processos">
  <ProcessosTable />
</PageShell>

// INCORRETO - Nunca criar estrutura de pagina manualmente
<main className="flex-1 p-4">
  <h1>Processos</h1>
  ...
</main>
```

### Regra: Usar DataTableShell para tabelas

```tsx
// CORRETO
import { DataTableShell } from '@/components/shared/data-table-shell';

<DataTableShell toolbar={<TableToolbar ... />}>
  <DataTable ... />
</DataTableShell>
```

## 2. Badges & Status - REGRA CRITICA

### Regra: NUNCA hardcodear cores em badges

```tsx
// CORRETO - Usar getSemanticBadgeVariant
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';

<Badge variant={getSemanticBadgeVariant('tribunal', 'TRT1')}>TRT1</Badge>
<Badge variant={getSemanticBadgeVariant('status', 'ATIVO')}>Ativo</Badge>
<Badge variant={getSemanticBadgeVariant('grau', 'primeiro_grau')}>1 Grau</Badge>
<Badge variant={getSemanticBadgeVariant('parte', 'PERITO')}>Perito</Badge>

// INCORRETO - NUNCA fazer isso
<Badge className="bg-blue-100 text-blue-800 border-blue-200">TRT1</Badge>
<span className="bg-green-500/15 text-green-700">Ativo</span>
```

### Regra: NUNCA criar funcoes getXXXColorClass()

```tsx
// INCORRETO - Funcoes de cor locais PROIBIDAS
const getTRTColorClass = (trt: string): string => {
  const colors = { TRT1: 'bg-blue-100', ... };
  return colors[trt];
};

// CORRETO - Usar mapeamento centralizado
import { getSemanticBadgeVariant } from '@/lib/design-system';
const variant = getSemanticBadgeVariant('tribunal', trt);
```

### Categorias disponiveis para getSemanticBadgeVariant:

| Categoria | Exemplo de Uso | Valores Comuns |
|-----------|----------------|----------------|
| `tribunal` | TRT1, TST, TJSP | TRT1-24, TST, STJ, STF, TJ* |
| `status` | ATIVO, ARQUIVADO | ATIVO, SUSPENSO, ARQUIVADO, RECURSAL |
| `grau` | primeiro_grau | primeiro_grau, segundo_grau, tribunal_superior |
| `parte` | PERITO | PERITO, TESTEMUNHA, ASSISTENTE, etc. |
| `polo` | ATIVO | ATIVO, PASSIVO, AUTOR, REU |
| `audiencia_status` | Marcada | Marcada, Finalizada, Cancelada |
| `audiencia_modalidade` | Virtual | Virtual, Presencial, Hibrida |
| `expediente_tipo` | 1 | ID numerico do tipo |
| `captura_status` | pending | pending, in_progress, completed, failed |

## 3. Typography

### Regra: Usar componentes Typography para textos semanticos

```tsx
// CORRETO
import { Typography } from '@/components/ui/typography';

<Typography.H1>Titulo Principal</Typography.H1>
<Typography.H2>Subtitulo</Typography.H2>
<Typography.Muted>Texto secundario</Typography.Muted>

// INCORRETO - Nunca estilizar headings inline
<h1 className="text-3xl font-bold tracking-tight">Titulo</h1>
<p className="text-muted-foreground">Texto secundario</p>
```

## 4. Spacing - Grid 4px

### Regra: Usar classes de espacamento do design system

```tsx
// CORRETO - Usar valores do grid 4px
<div className="gap-4">     // 16px
<div className="space-y-4"> // 16px
<div className="p-6">       // 24px

// INCORRETO - Valores arbitrarios
<div className="gap-3.25
<div className="p-7">
<div style={{ padding: '17px' }}>
```

### Valores permitidos: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24

## 5. Cores - Proibicoes

### Regra: NUNCA usar cores inline em componentes de dominio

```tsx
// PROIBIDO em badges/status
className="bg-blue-500/15"
className="bg-amber-600"
className="text-green-700"
className="border-red-200"

// PERMITIDO apenas em primitivos UI (badge.tsx, button.tsx)
// Componentes de feature DEVEM usar variantes semanticas
```

### Regra: NUNCA usar oklch() diretamente

```tsx
// PROIBIDO
className="bg-[oklch(0.68_0.22_45)]"

// Use variaveis CSS ou variantes semanticas
```

### Regra: NUNCA usar shadow-xl

```tsx
// PROIBIDO - profundidade excessiva
className="shadow-xl"

// PERMITIDO
className="shadow-lg"
className="shadow-md"
className="shadow-sm"
```

## 6. Adicionar Novos Mapeamentos

Para adicionar um novo tribunal, status ou tipo de parte:

1. Abrir `src/lib/design-system/variants.ts`
2. Adicionar entrada no Record correspondente
3. Nao criar funcoes de cor locais

```tsx
// Em variants.ts
export const TRIBUNAL_VARIANTS: Record<string, BadgeVisualVariant> = {
  // ...existentes...
  TJNOVO: 'info', // Adicionar aqui
};
```

## 7. Checklist antes de commitar

- [ ] Nenhum `bg-{color}-{shade}` em componentes de feature
- [ ] Nenhuma funcao `getXXXColorClass()` criada
- [ ] Todos badges usam `getSemanticBadgeVariant()`
- [ ] PageShell usado em todas as paginas
- [ ] Typography usado para headings
- [ ] Espacamentos seguem grid 4px
- [ ] Nenhum `shadow-xl` no codigo
- [ ] Nenhum `oklch()` direto no codigo

## 8. Imports Recomendados

```tsx
// Para badges e mapeamentos
import { getSemanticBadgeVariant } from '@/lib/design-system';

// Para formatacao
import { formatCurrency, formatDate, formatCPF } from '@/lib/design-system';

// Para validacao
import { isValidCPF, isValidCNPJ } from '@/lib/design-system';

// Para calculos
import { calculateAge, daysUntil } from '@/lib/design-system';
```
