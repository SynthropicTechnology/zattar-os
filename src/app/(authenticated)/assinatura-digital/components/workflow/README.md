# SignatureWorkflowStepper

Indicador de progresso do fluxo de assinatura digital com versões desktop e mobile.

## Features

- ✅ Stepper horizontal (desktop) com labels e ícones
- ✅ Barra de progresso simplificada (mobile)
- ✅ Integração automática com `formulario-store`
- ✅ Navegação entre etapas (opcional)
- ✅ Acessibilidade completa (ARIA)

## Uso Básico

```tsx
import { SignatureWorkflowStepper } from '@/features/assinatura-digital/components/workflow';

// Apenas visualização
<SignatureWorkflowStepper />

// Com navegação habilitada
<SignatureWorkflowStepper
  allowNavigation
  onStepClick={(index) => console.log('Step:', index)}
/>
```

## Etapas do Fluxo

1. **Upload** - Upload do documento
2. **Configurar** - Adicionar signatários e campos
3. **Revisar** - Preview e confirmação

## Props

| Prop              | Tipo                      | Default | Descrição                     |
| ----------------- | ------------------------- | ------- | ----------------------------- |
| `className`       | `string`                  | -       | Classes CSS adicionais        |
| `onStepClick`     | `(index: number) => void` | -       | Callback ao clicar em step    |
| `allowNavigation` | `boolean`                 | `false` | Permite navegação entre steps |

## Responsividade

### Desktop (>= md)

- Stepper horizontal completo
- Labels visíveis
- Ícones de status (check, número)
- Conectores entre steps

### Mobile (< md)

- Barra de progresso linear
- Label da etapa atual
- Contador (ex: "1 de 3")

## Integração com Store

```typescript
const {
  etapaAtual, // Índice da etapa atual (0-based)
  getTotalSteps, // Total de etapas
  proximaEtapa, // Avançar
  etapaAnterior, // Voltar
} = useFormularioStore();
```

## Acessibilidade

```tsx
<nav aria-label="Progresso do fluxo de assinatura">
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    Etapa 2 de 3: Configurar
  </div>
  {/* ... */}
</nav>
```

## Customização

### Cores

- **Completed**: `bg-primary/10 text-primary`
- **Current**: `bg-primary text-white`
- **Pending**: `bg-slate-200 text-slate-500`

### Ícones

- Completed: `<Check />` (Lucide React)
- Current: Número da etapa
- Pending: Número da etapa (opaco)

## Testes

```bash
npm test -- signature-workflow-stepper.test.tsx
```
