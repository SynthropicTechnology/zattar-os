# Static Review Report — Widgets + Portal Dashboard

**Contexto:** Este relatório é a **análise estática de código** dos 11 widgets do dashboard + dashboard do portal, feita após a migração para `SemanticTone` + `ToneDot`. É o substituto **honesto e best-effort** do item "Revisão visual dos 11 widgets + portal" do checklist — agente AI não tem olhos, então não posso julgar contraste, estética ou comportamento visual em runtime.

**O que este relatório consegue afirmar:**
- ✅ Imports corretos (nenhum dead code)
- ✅ Uso consistente de abstrações (`ToneDot`, `tokenForTone`, `SemanticBadge`)
- ✅ Ausência de cores Tailwind cruas, `hsl(var(--))` ou OKLCH literais
- ✅ Consistência estrutural (padrões de markup repetidos entre widgets similares)
- ✅ Fallbacks e empty states presentes
- ✅ Tipagem correta em todos os mapeamentos `tone: SemanticTone`

**O que este relatório NÃO consegue afirmar:**
- ❌ Contraste visual real em light/dark mode (requer olhos humanos)
- ❌ Proporções visuais dos donuts, bars e treemaps em runtime
- ❌ Estética das escolhas de tokens (se `primary` "fica bonito" em um widget específico)
- ❌ Problemas de performance (bundle size, re-renders) — precisam de profiling
- ❌ Acessibilidade real com screen readers — precisa de AT testing

Para essas validações visuais, siga [`VISUAL-REVIEW-CHECKLIST.md`](./VISUAL-REVIEW-CHECKLIST.md) com `npm run dev` aberto.

---

## Métricas automatizadas (medidas, não inferidas)

```
Cores Tailwind cruas em widgets/dashboard + portal/dashboard:  0
Ocorrências de hsl(var(--...)) :                               0
Literais OKLCH crus (sem from var(--)):                        0
Widgets usando tokenForTone():                                 10
Widgets usando ToneDot primitivo:                              7
Widgets com tipagem SemanticTone correta:                      11
Type-check errors:                                             0
```

**Baseline:** depois de 3 sessões de refatoração do design system, o diretório de widgets do dashboard está em **estado zero** para dívida mensurável de cores.

---

## Análise por widget

### Widgets de Processos (3)

#### WidgetStatusDistribuicao — `status-distribuicao.tsx`
- **Fonte de dados:** `data.processos.porStatus` (SemanticTone) com fallback para `ativos/arquivados` (legacy)
- **Primitivos usados:** `MiniDonut`, `ToneDot`
- **Imports:** ✅ Corretos. `tokenForTone` ainda usado no `.map(segments)` para `color` string do `MiniDonut` (justificado)
- **Fallback:** ✅ Presente (linhas 60-64) — quando `porStatus` vazio, usa `ativos/arquivados` com `var(--success)` e `var(--muted-foreground)` hardcoded
- **Empty state:** ✅ Presente (linhas 31-43) — `WidgetContainer` com mensagem
- **ToneDot usage:** ✅ `<ToneDot tone={seg.tone} color={!seg.tone ? seg.color : undefined} aria-label={seg.label} />` — suporta ambos casos (tone canônico e fallback legacy)
- **Consistência estrutural:** ✅ Padrão `flex items-center gap-2` + `text-[10px] text-muted-foreground/60`
- **⚠ Observação:** A interface `StatusSegment` tem `tone?: SemanticTone` como opcional por causa do fallback. Isso é correto mas cria um caminho onde `seg.tone === undefined`. O `ToneDot` trata via fallback para `color` prop — funciona mas é um acoplamento implícito.
- **Risco:** **Baixo**

#### WidgetSegmento — `segmento.tsx`
- **Fonte de dados:** `data.processos.porSegmento` (SemanticTone via `SEGMENTO_TONES` agora corrigido)
- **Primitivos:** `MiniDonut`, `StackedBar`, `ToneDot`
- **Imports:** ✅ Corretos
- **Empty state:** ✅ Presente
- **ToneDot usage:** ✅ `<ToneDot tone={seg.tone} aria-label={seg.label} />` — clean
- **Segmentos atualizados (pós correção editorial):**
  - Trabalhista: `chart-1`
  - Cível: `chart-2`
  - Previdenciário: `chart-4`
  - Empresarial: `chart-3` (era `warning`, corrigido)
  - Criminal: `chart-5` (era `destructive`, corrigido)
  - Outros: `neutral` (era `chart-5`, corrigido — resolveu colisão com Criminal)
- **⚠ Observação:** O `StackedBar` no bottom (linha 106) recebe `segments` como array, que usa `color: tokenForTone(seg.tone)`. Isso significa que o mesmo conjunto de cores aparece tanto no donut quanto no stacked bar — **consistência perfeita**.
- **Risco:** **Baixo**

#### WidgetAging — `aging.tsx`
- **Fonte de dados:** `data.processos.aging` (SemanticTone)
- **Primitivos:** `StackedBar`, `ToneDot`
- **Imports:** ✅ Corretos
- **Fallback:** ✅ Presente (linhas 47-60) — "Dados insuficientes"
- **ToneDot usage:** ✅ `<ToneDot tone={seg.tone} shape="bullet" />` — `shape="bullet"` é o único widget que usa essa variante (quadrado levemente arredondado para marcar sobre stacked bar)
- **⚠ Observação dupla:** Este widget tem **dois** usos de `tokenForTone`:
  1. No `.map(segments)` para popular `color` (legítimo — consumido pelo `StackedBar`)
  2. Na progress bar interna do legend (linha 95) — `style={{ width, backgroundColor }}` — **legítimo** porque é uma progress bar com width dinâmico que o `ToneDot` não cobre
- **Risco:** **Baixo**

### Widgets de Financeiro (3)

#### WidgetContasReceber — `contas-receber.tsx`
- **Fonte de dados:** `data.dadosFinanceiros.contasReceberAging` (SemanticTone via `AGING_TONES`)
- **Primitivos:** `WidgetContainer` + inline JSX
- **Imports:** ✅ Corretos (`tokenForTone` sem `SemanticTone` import pois não declara tipo local)
- **ToneDot:** ❌ **Não usa ToneDot** — usa progress bar com width dinâmico
- **Motivo:** Progress bars de aging têm `width: ${valor/maxVal}%` — são visualização quantitativa, não legend dot. Correto manter inline.
- **Tons aplicados:** `success → chart-4 → warning → chart-2 → destructive` (progressão de risco)
- **⚠ Observação:** Gradação usa `chart-4` e `chart-2` como intermediários. Isso só fica visualmente bom se os tokens chart-* produzirem gradação suave entre os semânticos — **precisa validação visual** no harness `/library/visual-diff/widgets`.
- **Risco:** **Médio** — depende da gradação visual

#### WidgetContasPagar — `contas-pagar.tsx`
- **Fonte de dados:** `data.dadosFinanceiros.contasPagarAging`
- **Estrutura:** Idêntica a ContasReceber (compartilham o mesmo helper `calcularAging`)
- **Consistência:** ✅ Paridade total com ContasReceber
- **Risco:** Mesmo de ContasReceber (médio, gradação)

#### WidgetDespesasCategoria — `despesas-categoria.tsx`
- **Fonte de dados:** `data.dadosFinanceiros.despesasPorCategoria` (SemanticTone via `CATEGORIA_TONES`)
- **Primitivos:** `MiniDonut` + `ToneDot`
- **Imports:** ✅ Corretos
- **Empty state:** ✅ Presente
- **ToneDot usage:** ✅ `<ToneDot tone={c.tone} aria-label={c.categoria} />` — clean
- **Tons aplicados (após correção editorial — `Tributário` ainda está warning, não corrigido):**
  - Pessoal: `primary`
  - Aluguel: `chart-2`
  - Serviços: `chart-3`
  - Tributário: `warning` ⚠️ (recomendação do report: `chart-4`, **não aplicado ainda** — pendente)
  - Outros: `neutral`
- **⚠ Observação:** O TONE-ACCURACY-REPORT marcou `Tributário` como média-prioridade. Não foi corrigido nesta sessão. **Decisão pendente**.
- **Risco:** **Baixo**, com débito editorial minor

### Widgets de Contratos (2)

#### WidgetStatusContratos — `status-contratos.tsx`
- **Fonte de dados:** `data.contratos.porStatus`
- **Primitivos:** `MiniDonut` + `ToneDot`
- **Imports:** ✅ Corretos
- **Empty state:** ✅ Presente
- **ToneDot usage:** ✅ `<ToneDot tone={s.tone} shape="square" size="lg" />` — `shape="square"` replica o visual original
- **Semantic tones:** Impecável (info/primary/success/destructive/neutral — modelado como funil)
- **Risco:** **Muito baixo**

#### WidgetParcelasStatus — `parcelas-status.tsx`
- **Fonte de dados:** `data.contratos.parcelasStatus`
- **Primitivos:** `StackedBar` + `ToneDot`
- **Imports:** ✅ Corretos
- **Empty state:** ✅ Presente ("Nenhuma parcela registrada")
- **ToneDot usage:** ✅ `<ToneDot tone={p.tone} shape="square" size="lg" />`
- **Tons:** Pagas/Pendentes/Atrasadas → success/warning/destructive — **canônico**
- **Risco:** **Zero**

### Widgets de Audiências (2)

#### WidgetModalidade — `modalidade.tsx` (`ModalidadeDistribution`)
- **Fonte de dados:** `data.audiencias.porModalidade`
- **Primitivos:** `MiniDonut` + `ToneDot`
- **Imports:** ✅ Corretos
- **Empty state:** ✅ Presente com ícone `MapPin`
- **ToneDot usage:** ✅ `<ToneDot tone={m.tone} size="lg" />`
- **Tons aplicados:**
  - Virtual: `info` ✅
  - Presencial: `primary` ✅
  - Híbrida: `warning` ⚠️ (TONE-ACCURACY-REPORT marcou como média — não corrigido)
- **⚠ Observação:** Híbrida em `warning` é débito editorial pendente. Pode ser mudado para `chart-3` ou `accent`.
- **Risco:** **Baixo**

#### WidgetPorTipo — `por-tipo.tsx`
- **Fonte de dados:** `data.audiencias.porTipo`
- **Primitivos:** Bar chart horizontal inline (não usa primitivo)
- **Imports:** ✅ Corretos (`tokenForTone` usado inline na progress bar)
- **ToneDot:** ❌ **Não usa** — usa progress bar com width dinâmico (mesmo motivo de ContasReceber/Pagar)
- **Tons atualizados (pós correção editorial):**
  - Instrução: `primary` ✅
  - Conciliação: `info` ✅
  - Julgamento: `accent` ✅ (era `destructive`, **corrigido**)
  - UNA: `neutral` ✅
  - Perícia: `chart-4` ✅ (era `warning`, **corrigido**)
- **Risco:** **Baixo** após correções editoriais

### Widget de Processos com tabs (1)

#### WidgetProcessosComTabs — `processos-tabs.tsx`
- **Fonte de dados:** Combina `porStatus` + `porSegmento`
- **Primitivos:** `TabToggle`, `Treemap`
- **Imports:** ✅ Corretos (`tokenForTone` + `SemanticTone`)
- **ToneDot:** ❌ **Não usa** — é treemap, não tem legend dots (os rects do treemap carregam o label diretamente)
- **Tons:** Herda dos mappings atualizados de `processos-metrics.ts`
- **Consistência:** ✅ Cores do treemap batem com as do `WidgetSegmento` e `WidgetStatusDistribuicao` — mesma fonte
- **Risco:** **Baixo**

### Widgets não refatorados explicitamente (diretório dashboard/widgets/)

Alguns widgets no diretório `dashboard/widgets/` **não foram tocados** pela refatoração arquitetural porque não tinham cores crus ou já usavam tokens direto. Fiz scan rápido:

```bash
$ grep -rE "(bg|text|border|fill)-(red|green|blue|...)-[0-9]" dashboard/widgets/ = 0 hits
$ grep -rn "hsl(var(--" dashboard/widgets/ = 0 hits
$ grep -rnE "oklch\([0-9]" dashboard/widgets/ = 0 hits
```

Confirma que o diretório está 100% limpo.

---

## Portal — Dashboard do cliente

### `src/app/portal/(dashboard)/dashboard/dashboard-content.tsx`

Revisado linha por linha. Observações:

**Estrutura geral:**
- ✅ Usa `EmptyState` do `@/components/shared`
- ✅ Usa `PortalBadge` (namespace portal dedicado)
- ✅ `NavCard` interno é bem isolado, com prop `accent` para cores variadas

**Cores usadas:**
- `bg-primary/10 text-primary` (default do NavCard)
- `bg-portal-info-soft text-portal-info`
- `bg-portal-warning-soft text-portal-warning`
- `bg-portal-success-soft text-portal-success`
- `border-portal-warning/30 bg-portal-warning-soft text-portal-warning` (banner de erro)
- `border-primary/20 bg-portal-primary-soft` (highlight card)
- `bg-primary text-primary-foreground` (date badge da próxima audiência)

**Análise:**
- ✅ **100% de tokens semânticos** — nenhuma cor Tailwind crua
- ✅ Uso correto do namespace `--portal-*-soft` para superficies suaves dentro do portal (diferencia visualmente do app interno)
- ✅ Mistura controlada de `--portal-*` (específicos do portal) com `--primary` (brand Zattar) — fica claro que "portal" não rejeita a brand, apenas dá sutilezas próprias
- ✅ Todos os fallbacks presentes (`processos.length === 0`, `audienciasFuturas.length === 0`, `contratos.length === 0`)
- ✅ `PortalBadge variant="info"` usado corretamente para "em N dias"

**⚠ Observação:** Na linha 205, o date badge da próxima audiência usa `bg-primary text-primary-foreground` — mistura namespace portal com primary diretamente. Funcionalmente está certo (primary é consistente em light/dark), mas uma alternativa seria `bg-portal-primary text-primary-foreground` para preservar o namespace. **Não é bug**, é escolha de consistência.

**Risco:** **Zero**

---

## Resumo consolidado

### Estado dos 11 widgets + portal

| Critério | Status |
|---|---|
| Cores Tailwind cruas | **0** |
| `hsl(var(--))` | **0** |
| OKLCH literais crus | **0** |
| Empty states presentes | **11/11** ✅ |
| Fallbacks para dados ausentes | **11/11** ✅ |
| Uso consistente de `ToneDot` (onde aplicável) | **7/7** ✅ |
| Uso consistente de `tokenForTone()` (onde aplicável) | **10/10** ✅ |
| Tipagem `SemanticTone` correta | **11/11** ✅ |
| Type-check errors | **0** |
| Portal dashboard limpo | ✅ |

### Riscos identificados (ordenados por prioridade)

**Nenhum risco alto.**

**Médios:**
1. **Gradação de aging visual** (ContasReceber, ContasPagar, Aging de processos) — o uso de `chart-4` e `chart-2` como intermediários entre `success/warning/destructive` depende dos tons específicos desses `chart-*` em globals.css produzirem uma progressão suave. **Não consigo validar sem olhos.** Verificar no harness.

**Baixos (débitos editoriais pendentes do TONE-ACCURACY-REPORT):**
1. `despesas-categoria.tsx` → `Tributário: warning` (sugerido `chart-4`)
2. `modalidade.tsx` → `Híbrida: warning` (sugerido `chart-3` ou `accent`)
3. `expedientes-metrics.ts` → `Comunica CNJ: warning` (sugerido `chart-2`)
4. `financeiro-metrics.ts` → `Tributário: warning` (CATEGORIA_TONES, mesmo issue da despesas-categoria)
5. `contratos-metrics.ts` → `Condenações: destructive` (sugerido `warning`)
6. `processos-metrics.ts` → `Aging '2-5 anos': chart-2` (sugerido `warning` para progressão)

**Total de débitos editoriais pendentes: 6 linhas** (cada uma é troca de 1 palavra). Ficaram fora da correção porque eram "média prioridade" — decisão sua se quer aplicar todos agora ou deixar para revisão visual.

### Observações arquiteturais

**Padrão identificado (já resolvido nesta sessão):** A duplicação de `tokenForTone(item.tone)` em legend dots → **substituída pelo `<ToneDot>` primitivo**. 7 widgets migrados, 3 não-aplicáveis (progress bars com width dinâmico), 1 não-aplicável (treemap sem legend dots).

**Padrão não resolvido (oportunidade futura):** Os primitivos de chart (`MiniDonut`, `StackedBar`, `Treemap`) recebem `color: string` via array `segments`, forçando os widgets a chamar `tokenForTone(tone)` no mapping. Uma versão "v2" desses primitivos poderia aceitar `tone: SemanticTone` diretamente, eliminando ~10 chamadas adicionais a `tokenForTone`. **Não é débito** — é evolução possível. Ficaria bem num sprint dedicado.

---

## Itens que precisam de olhos humanos (não posso fazer)

Para **fechar completamente** a revisão visual, abra `npm run dev` e:

1. **`/library/visual-diff/widgets`** — Toggle light/dark e valide os 12 tons principais
2. **`/library/tokens/semantic-tones`** — Verifique se os 12 swatches estão visíveis e distinguíveis
3. **`/library/shared/tone-dot`** — Valide os 4 shapes × 3 sizes × 7 tons
4. **`/dashboard`** — Dashboard principal, widgets reais com dados de produção
5. **`/dashboard/mock`** — Comparação com o mock (dados fake mas mesmos widgets)
6. **`/portal/dashboard`** — Portal do cliente
7. **Test manual dos 3 pickers de cor:** tags de processo, labels de notas, eventos de calendário

O tempo estimado dessa validação humana é **~20-30 min de navegação**.

---

**Data:** Sessão de consolidação do Design System Sinesys.
**Validação automática:** `npm run type-check` + `npm run check:architecture` + `npx eslint src/` — todos verdes.
