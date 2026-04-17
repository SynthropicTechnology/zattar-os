# Public Shell — Regras de Design e Implementação

Conjunto de componentes que compõem o **wizard público** do fluxo de assinatura digital (rotas `(assinatura-digital)/*` consumidas por clientes finais via link). Este documento explica decisões e onde NÃO mexer sem entender.

## Componentes

```
public-shell/
├── public-wizard-shell.tsx     # Shell raiz: backdrop + header + sidebar + main + skip-link
├── public-wizard-header.tsx    # Topbar (BrandMark + label "Assinatura Digital")
├── public-wizard-progress.tsx  # PublicWizardProgress.Vertical / .Horizontal
├── public-step-card.tsx        # GlassPanel + chip + heading + scroll interno + focus mgmt
├── public-step-footer.tsx      # Botões Voltar/Continuar com glass
├── document-peek-card.tsx      # Card de preview de documento (Sucesso step)
├── selfie-capture-sheet.tsx    # Sheet de captura de foto (CapturaFotoStep)
└── success-hero.tsx            # Hero da tela de sucesso
```

## Princípios não-negociáveis

### 1. Glass Briefing — Mesmas tokens da área autenticada

Todo componente público usa **tokens semânticos OKLCH** definidos em `globals.css`:

- Cores: `bg-primary`, `text-muted-foreground`, `border-outline-variant`, `bg-surface-container-lowest`, etc.
- Profundidade: `<GlassPanel depth={1|2|3}>` — nunca `bg-white/X` arbitrário
- Tipografia: `<Heading level="page|section|card">` + `<Text variant="caption|overline|...">`
- Espaçamento: tokens de `src/lib/design-system/tokens.ts` (gap-4, p-6, etc.)

**Anti-pattern**: `bg-white/80`, `text-blue-500`, `rounded-md` em vez de `rounded-xl`. Causa drift visual.

### 2. Chip "Etapa X de N" via hook, não prop drilling

O chip do `PublicStepCard` é alimentado **automaticamente** pelo hook `useWizardProgress()` (em `hooks/use-wizard-progress.ts`).

```tsx
// FormStepLayout (contexto public) já faz isso:
const progress = useWizardProgress()
const chip = progress.chipLabel ?? undefined
```

**Não passar `currentStep`/`totalSteps` em cada step do wizard.** Steps não conhecem sua posição — o hook deriva do Zustand store.

Se precisar override (raro): props explícitos `currentStep`/`totalSteps` em `FormStepLayout` têm precedência.

### 3. Focus management — sempre primeiro input após mudança de step

`PublicStepCard` tem `useEffect` que dispara quando `title` muda. O efeito:

1. Aguarda 1 frame (`requestAnimationFrame`) — garante que DOM da nova step está montado
2. Busca primeiro elemento focável via `FIRST_FOCUSABLE_SELECTOR`
3. Aplica `.focus({ preventScroll: true })` — `preventScroll` evita salto sob teclado mobile
4. Fallback: foca o `<h1>` (que tem `tabIndex={-1}`)

**Não duplicar essa lógica em cada step.** Se um step tiver lógica de foco específica, faça via prop (`autoFocus`) no input desejado, NÃO via `useEffect` próprio.

O `FIRST_FOCUSABLE_SELECTOR` repete `:not([tabindex="-1"])` em cada parte do seletor — sem isso, `<input tabindex="-1">` (campos hidden de validação Zod) escapariam.

### 4. Inputs — sempre `glass-field` (utility CSS) ou `<Input variant="glass">`

Toda entrada de texto no fluxo público usa Glass Briefing. Duas vias equivalentes:

- **Componente shadcn**: `<Input variant="glass" />` (definido em `src/components/ui/input.tsx`)
- **Componente especializado** (InputCPF/CNPJ/Telefone/CEP/Data): já usam `INPUT_GLASS_BASE_CLASSES` por dentro
- **Utility CSS**: `className="glass-field"` para casos onde nem `variant` nem componente especializado se aplicam (ex: SelectTrigger)

**Não criar inputs com `bg-transparent` + `h-9` cru.** Quebra coerência visual com o resto do wizard.

### 5. Heading hierarchy semântica

- `<Heading level="page">` = `<h1>` — **título do step** (PublicStepCard)
- `<Heading level="section">` = `<h2>` — **seções dentro de um step** (DynamicFormRenderer)
- `<Heading level="card">` = `<h3>` — sub-grupos dentro de uma section

Nunca pular níveis (`h1 → h3` direto). WCAG SC 1.3.1.

### 6. Live regions — diferenciar polite vs assertive

| Tipo de mensagem | Role | aria-live |
|------------------|------|-----------|
| Hint salvo / progresso | `status` | `polite` |
| Resultado de busca encontrado / não encontrado | `status` | `polite` |
| Empty state ("nenhum resultado") | `status` | `polite` |
| **Erro de busca / submit falhou** | `alert` | `assertive` |

`assertive` interrompe a leitura em curso — só usar quando ação imediata for necessária.

### 7. Animações respeitam `prefers-reduced-motion`

Toda transição entre steps usa `useReducedMotion()` do `motion/react`. Quando o usuário prefere motion reduzido:

- `initial`/`animate`/`exit` viram só fade (sem slide)
- `duration` mantém igual (220ms) — não aceleramos pra "compensar"

Mesma regra pra qualquer animação adicionada futuramente nesse folder.

### 8. Labels semânticos em landmarks

- `<main aria-label="Formulário de assinatura digital">` — diferencia de outros mains se a página tiver
- `<aside aria-label="Progresso do formulário">` — leitor narra "navegação, Progresso..."
- `<section aria-labelledby={titleId} aria-describedby={descriptionId}>` — agrupa o conteúdo do step

`<SkipLink>` no topo permite pular nav → main com Tab.

## Extension points

### Adicionar novo step ao wizard

1. Criar componente em `src/app/(assinatura-digital)/_wizard/form/<nome>.tsx` que usa `<FormStepLayout>`
2. Adicionar entrada em `STEP_LABELS` (em `src/shared/assinatura-digital/constants/step-labels.ts`)
3. Registrar em `buildStepConfigs()` no `FormularioStore`
4. Adicionar case no switch do `FormularioContainer.renderEtapa()`

Chip, focus management, animação, sidebar — tudo derivado **automaticamente**. Não tocar nesses arquivos.

### Mudar tonalidade do wizard (success / error)

`<PublicWizardShell tint="success" />` muda cor dos orbs do `AmbientBackdrop` e do gradient base. Já existe pra step "Sucesso". Para criar tint novo, expandir union em:

- `AmbientBackdrop.tint`
- `PublicWizardShell.tint`

### Customizar focus management de um step específico

Caso raro. Usar `autoFocus` no input desejado dentro do step. **Não desabilitar o focus do PublicStepCard** — quebra fluxo padrão.

## Anti-patterns conhecidos

| Anti-pattern | Por quê é ruim | O que fazer |
|---|---|---|
| `bg-white`, `text-blue-500` | Quebra Glass Briefing | Usar tokens semânticos |
| `rounded-md` em inputs | Mismatch com `rounded-xl` do glass-field e `rounded-2xl` dos cards | `rounded-xl` |
| `h-9` em inputs | Viola WCAG touch target (mín. 44px) | `h-11` (default do glass-field) |
| Manualmente passar `currentStep`/`totalSteps` em cada step | Prop drilling, fácil ficar fora de sincronia com store | Confiar no `useWizardProgress()` automático |
| Adicionar `useEffect` de foco em step específico | Conflita com o focus management do PublicStepCard | Usar `autoFocus` no input |
| `aria-live="assertive"` em status indicator | Interrompe leitura desnecessariamente | `polite` salvo erro |
| Animação sem `useReducedMotion()` | Acessibilidade ruim para usuários com vestibular | Sempre checar preferência |
| Badges teatrais ("ISO certified", "Sessão segura", "Conexão SSL") | Marketing fake — usuário interno do produto não precisa | Remover. Confiança vem do design + funcionamento |

## Testes

Testes unitários do shell em `src/app/(assinatura-digital)/_wizard/__tests__/form-step-layout.test.tsx`. Cobrem:

- Renderização básica + props
- Chip derivado do hook (mock de `useWizardProgress`)
- Acessibilidade do `<section>` (aria-labelledby/describedby)
- Focus management (rAF + fallback heading + filtros tabindex/disabled/hidden)

Ao mudar o `FIRST_FOCUSABLE_SELECTOR` ou a lógica de chip, **rodar** `npx jest --testPathPatterns=form-step-layout`.
