# Visual Review Checklist — Batch Sweep de Tokens

**Contexto:** Este checklist rastreia a revisão visual das mudanças feitas pelo batch sweep que migrou ~500 classes Tailwind cruas para tokens semânticos (`tokenForTone()`) e pela refatoração arquitetural dos 5 repositories de métricas do dashboard (que passaram de retornar `color: string` para `tone: SemanticTone`).

**Como usar:**
1. Abra o harness visual de comparação: `npm run dev` → <http://localhost:3000/library/visual-diff/widgets>
2. Toggle entre light/dark/both mode — valide os 12 tons principais
3. Para cada widget do checklist abaixo, abra a URL de produção e compare com o mock (`/dashboard/mock`)
4. Marque `[x]` quando validado, `[⚠]` se precisar de ajuste, `[✗]` se estiver quebrado
5. Reporte discrepâncias graves abrindo issue referenciando este doc

**Harness de comparação:** As páginas `/library/tokens/semantic-tones` e `/library/visual-diff/widgets` mostram lado a lado "antes" (Tailwind cru) vs "depois" (token). Use-as **antes** de abrir produção — valida que o mapping está correto.

---

## 1. Widgets do Dashboard (11 refatorados)

URL do dashboard principal: <http://localhost:3000/dashboard>
URL do mock: <http://localhost:3000/dashboard/mock>

### Prioridade ALTA — widgets críticos de decisão

Widgets que afetam visualização de dados financeiros ou status crítico — qualquer problema de contraste aqui é visível imediatamente.

#### `[ ]` WidgetStatusContratos
- **Path:** [src/app/(authenticated)/dashboard/widgets/contratos/status-contratos.tsx](../../src/app/(authenticated)/dashboard/widgets/contratos/status-contratos.tsx)
- **Mudou:** `s.color` (OKLCH literal do repository) → `tokenForTone(s.tone)`
- **Tons usados:** `info`, `primary`, `success`, `destructive`, `neutral`
- **O que verificar:**
  - MiniDonut renderiza com 5 cores distintas
  - Legend dots (linha 85-87) pintam corretamente
  - Light mode: contraste do texto `s.status` sobre o background
  - Dark mode: todas as cores legíveis sobre superfície escura
- **Risco:** Baixo — tons diretos, sem heurística

#### `[ ]` WidgetParcelasStatus
- **Path:** [src/app/(authenticated)/dashboard/widgets/contratos/parcelas-status.tsx](../../src/app/(authenticated)/dashboard/widgets/contratos/parcelas-status.tsx)
- **Tons usados:** `success` (Pagas), `warning` (Pendentes), `destructive` (Atrasadas)
- **O que verificar:**
  - StackedBar com 3 segmentos distintos (verde/âmbar/vermelho)
  - Legend dots alinhados
  - "Atrasadas" deve ser **claramente** vermelho destrutivo (não âmbar)
- **Risco:** Zero — mapping 1:1 semântico

#### `[ ]` WidgetContasReceber
- **Path:** [src/app/(authenticated)/dashboard/widgets/financeiro/contas-receber.tsx](../../src/app/(authenticated)/dashboard/widgets/financeiro/contas-receber.tsx)
- **Tons usados:** `success` (A vencer), `chart-4` (Até 30d), `warning` (30-60d), `chart-2` (60-90d), `destructive` (90+)
- **O que verificar:**
  - **Gradação** de cor entre as 5 faixas de aging — deve sentir progressão visual do saudável ao crítico
  - Bar chart horizontal com proporções corretas
- **Risco:** Médio — `chart-4` e `chart-2` são gradações intermediárias. Se o gradiente "verde → vermelho" não estiver evidente, anotar para ajuste dos tokens chart-*.

#### `[ ]` WidgetContasPagar
- **Path:** [src/app/(authenticated)/dashboard/widgets/financeiro/contas-pagar.tsx](../../src/app/(authenticated)/dashboard/widgets/financeiro/contas-pagar.tsx)
- **Tons usados:** Mesmos de ContasReceber (aging compartilhado)
- **O que verificar:** Mesmo padrão — gradação de aging visível
- **Risco:** Médio (mesmo da ContasReceber)

### Prioridade MÉDIA — widgets categóricos

Widgets que usam `chart-1..5` para séries sem significado semântico inerente. Risco de "parecerem iguais" se os tokens chart-* estiverem muito próximos.

#### `[ ]` WidgetStatusDistribuicao (processos)
- **Path:** [src/app/(authenticated)/dashboard/widgets/processos/status-distribuicao.tsx](../../src/app/(authenticated)/dashboard/widgets/processos/status-distribuicao.tsx)
- **Tons usados:** `success` (Ativos), `warning` (Suspensos), `neutral` (Arquivados), `info` (Em Recurso)
- **Fallback:** hardcoded `var(--success)` e `var(--muted-foreground)` quando não há `porStatus`
- **O que verificar:**
  - Donut renderiza com 4 cores distintas quando há dados
  - Fallback render (linha 60-64) quando dados ausentes
- **Risco:** Baixo

#### `[ ]` WidgetSegmento (processos)
- **Path:** [src/app/(authenticated)/dashboard/widgets/processos/segmento.tsx](../../src/app/(authenticated)/dashboard/widgets/processos/segmento.tsx)
- **Tons usados:** `chart-1` (Trabalhista), `chart-2` (Cível), `chart-4` (Previdenciário), `warning` (Empresarial), `destructive` (Criminal), `chart-5` (Outros)
- **O que verificar:**
  - 6 cores **distinguíveis** no donut — segmentos pequenos ainda identificáveis
  - Semântica: "Criminal" em vermelho faz sentido aqui? Ou é decoração enviesada? (⚠ caso a caso)
- **Risco:** Médio — `destructive` para "Criminal" é uma escolha editorial. Pode ser reinterpretado como "área de risco" ou inadequado se você quer imparcialidade.

#### `[ ]` WidgetAging (processos)
- **Path:** [src/app/(authenticated)/dashboard/widgets/processos/aging.tsx](../../src/app/(authenticated)/dashboard/widgets/processos/aging.tsx)
- **Tons usados:** `success` (<1 ano), `warning` (1-2 anos), `chart-2` (2-5 anos), `destructive` (>5 anos)
- **O que verificar:** Gradação de aging visível (similar ao financeiro)
- **Risco:** Baixo

#### `[ ]` WidgetProcessosComTabs
- **Path:** [src/app/(authenticated)/dashboard/widgets/processos/processos-tabs.tsx](../../src/app/(authenticated)/dashboard/widgets/processos/processos-tabs.tsx)
- **Tons usados:** herda de `porStatus` e `porSegmento` (re-render dos tons acima)
- **O que verificar:** Toggle entre tabs Status/Segmento — cores consistentes entre tabs
- **Risco:** Baixo

#### `[ ]` WidgetDespesasCategoria (financeiro)
- **Path:** [src/app/(authenticated)/dashboard/widgets/financeiro/despesas-categoria.tsx](../../src/app/(authenticated)/dashboard/widgets/financeiro/despesas-categoria.tsx)
- **Tons usados:** `primary` (Pessoal), `chart-2` (Aluguel), `chart-3` (Serviços), `warning` (Tributário), `neutral` (Outros)
- **O que verificar:** MiniDonut com 5 categorias de despesa distinguíveis
- **Risco:** Baixo

#### `[ ]` WidgetModalidade (audiências)
- **Path:** [src/app/(authenticated)/dashboard/widgets/audiencias/modalidade.tsx](../../src/app/(authenticated)/dashboard/widgets/audiencias/modalidade.tsx)
- **Tons usados:** `info` (Virtual), `primary` (Presencial), `warning` (Híbrida)
- **O que verificar:** 3 modalidades com cores distintas no donut + legend
- **Risco:** Baixo — semanticamente "Virtual" como info, "Presencial" como primary faz sentido

#### `[ ]` WidgetPorTipo (audiências)
- **Path:** [src/app/(authenticated)/dashboard/widgets/audiencias/por-tipo.tsx](../../src/app/(authenticated)/dashboard/widgets/audiencias/por-tipo.tsx)
- **Tons usados:** `primary` (Instrução), `info` (Conciliação), `destructive` (Julgamento), `neutral` (UNA), `warning` (Perícia)
- **O que verificar:** Bar chart horizontal com barras progressivas
- **Risco:** **Alto** — "Julgamento" como `destructive` é editorialmente carregado. Julgamento não é ruim, é fase normal do processo. **Considerar** trocar para `primary` ou `chart-3`.

---

## 2. Portal do Cliente

URL: <http://localhost:3000/portal/dashboard>

#### `[ ]` Dashboard do Portal
- **Path:** [src/app/portal/(dashboard)/dashboard/](../../src/app/portal/(dashboard)/dashboard/)
- **O que verificar:**
  - Cards de KPI com cores do namespace `--portal-*`
  - `PortalBadge` variantes (success/warning/danger/info/neutral) em listagens
  - Atmosfera dark consistente com o login do portal
- **Risco:** Baixo — portal tem namespace dedicado (`--portal-*`) que já era bem preservado

---

## 3. Outras páginas tocadas pelo batch sweep

Páginas que tiveram replacements mecânicos do script Python (85 arquivos modificados). Revisão leve, só abrir e confirmar que não há regressão óbvia.

#### `[ ]` Página de Audiências
- **Path:** <http://localhost:3000/audiencias>
- **O que checar:** Badges de modalidade/status, cards de audiência próxima

#### `[ ]` Página de Contratos
- **Path:** <http://localhost:3000/contratos>
- **O que checar:** Kanban de status, financial-strip, contrato-card

#### `[ ]` Página de Processos
- **Path:** <http://localhost:3000/processos>
- **O que checar:** Tabela DataShell, TagBadge (tags customizadas), SemanticBadge de status/tribunal

#### `[ ]` Assinatura Digital — Lista
- **Path:** <http://localhost:3000/assinatura-digital/documentos/lista>
- **O que checar:** `DocumentCard` com status (rascunho/pronto/concluido/cancelado) — tokens já foram testados no test unit

#### `[ ]` Página de Expedientes
- **Path:** <http://localhost:3000/expedientes>
- **O que checar:** Badges de status, urgência por prazo

#### `[ ]` Notas
- **Path:** <http://localhost:3000/notas>
- **O que checar:** Labels customizadas usando `bg-palette-N`, picker de cor no `EditLabelsModal`

---

## 4. Fluxos críticos por teste manual

#### `[ ]` Login do Portal
- **Path:** <http://localhost:3000/portal>
- **Foco visual:** `AmbientBackdrop`, `BrandMark` variant="dark", glassmorphism do form

#### `[ ]` Login interno
- **Path:** <http://localhost:3000/auth/login> (ou rota equivalente)
- **Foco visual:** `AuthLayoutV2` com `GlassPanel`, `BrandMark` variant="auto"

#### `[ ]` Criar tag de processo
- **Fluxo:** Abrir qualquer processo → "Editar tags" → ver picker de 18 cores
- **O que verificar:** Swatches do picker usando `var(--palette-N)` — cores consistentes com a demo em `/library/tokens/palette`

#### `[ ]` Criar label de nota
- **Fluxo:** `/notas` → "Editar etiquetas" → ver picker de 17 cores
- **O que verificar:** Similar ao tag, mas usa `bg-palette-N` direto (sem inline style)

---

## Legenda

| Símbolo | Significado |
|---|---|
| `[ ]` | Não revisado ainda |
| `[x]` | Revisado, aprovado |
| `[⚠]` | Revisado, precisa ajuste (anotar em "Notas de revisão" abaixo) |
| `[✗]` | Quebrado — requer correção imediata |

## Notas de revisão

*Preencher aqui durante a revisão com observações específicas. Exemplo:*

```
[⚠] WidgetPorTipo (audiências)
    "Julgamento" em destructive parece carregado visualmente quando há
    muitas audiências deste tipo. Considerar trocar para chart-3 ou primary.
```

---

**Referências:**
- Documentação dos tokens: [/library/tokens/semantic-tones](http://localhost:3000/library/tokens/semantic-tones)
- Harness visual: [/library/visual-diff/widgets](http://localhost:3000/library/visual-diff/widgets)
- Relatório de precisão semântica: [TONE-ACCURACY-REPORT.md](./TONE-ACCURACY-REPORT.md)
- Helper: [src/lib/design-system/semantic-tones.ts](../../src/lib/design-system/semantic-tones.ts)
- globals.css (fonte dos tokens): [src/app/globals.css](../../src/app/globals.css)
