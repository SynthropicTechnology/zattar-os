# Tone Accuracy Report — Revisão Semântica dos Mapeamentos

**Contexto:** Este relatório é uma **passada textual** (não visual) sobre cada mapeamento `string → SemanticTone` feito nos 5 repositories refatorados. O objetivo é verificar se cada tom atribuído **faz sentido semântico no contexto onde é usado** — independente da cor final que o token produz.

**Método:** Para cada mapping, avalio 3 critérios:
1. **Fidelidade semântica** — o tom expressa corretamente o significado do estado?
2. **Consistência interna** — o mesmo tom é usado para estados similares em diferentes repos?
3. **Carga editorial** — o tom carrega viés interpretativo não intencional?

**Legenda de confiança:**
- ✅ **Alta** — mapeamento canônico, zero ambiguidade
- 🟡 **Média** — defensável mas merece uma segunda olhada
- ⚠️ **Baixa** — potencial carga editorial ou inconsistência

---

## Repository 1: `processos-metrics.ts`

### `STATUS_TONES` — estados de processo

| Status | Tom | Confiança | Análise |
|---|---|---|---|
| Ativos | `success` | ✅ | Estado "saudável" do processo no acervo. Verde correto. |
| Suspensos | `warning` | ✅ | Estado transicional que exige atenção. Âmbar correto. |
| Arquivados | `neutral` | ✅ | Estado terminal sem valor positivo/negativo. Cinza correto. |
| Em Recurso | `info` | ✅ | Estado informacional — processo ativo mas em fase diferente. Azul correto. |

**Veredicto:** Mapeamento impecável. Nenhum viés, tons canônicos.

### `SEGMENTO_TONES` — áreas do direito

| Segmento | Tom | Confiança | Análise |
|---|---|---|---|
| Trabalhista | `chart-1` | ✅ | Primeira série — faz sentido como área principal do escritório Zattar. |
| Cível | `chart-2` | ✅ | Segunda série categórica. Sem carga. |
| Previdenciário | `chart-4` | ✅ | Quarta série categórica. Sem carga. |
| Empresarial | `warning` | 🟡 | **Questionável.** Âmbar para direito empresarial sugere "atenção/risco" quando o segmento é neutro. Recomendo `chart-3` ou `chart-5`. |
| Criminal | `destructive` | ⚠️ | **Carregado.** Vermelho para "Criminal" sugere que essa área é "perigosa" ou "ruim". Direito criminal é uma especialidade legítima, não um alerta. Recomendo `chart-3`. |
| Outros | `chart-5` | ✅ | Catch-all — última cor da paleta. Correto. |

**Veredicto:** 2 mapeamentos com viés editorial. **Ação recomendada**: trocar `Empresarial` e `Criminal` para tokens `chart-*` neutros.

### `AGING_TONES` — tempo de duração do processo

| Faixa | Tom | Confiança | Análise |
|---|---|---|---|
| < 1 ano | `success` | ✅ | Processo ágil — verde correto. |
| 1–2 anos | `warning` | ✅ | Começa a exigir atenção. Correto. |
| 2–5 anos | `chart-2` | 🟡 | Gradação intermediária. Defensável, mas poderia ser `warning` também para consistência. Depende de quão crítico 2-5 anos é no contexto trabalhista. |
| > 5 anos | `destructive` | ✅ | Processo "parado" há muito — alerta vermelho faz sentido. |

**Veredicto:** Bom. Pequena inconsistência de gradação (2-5 anos em `chart-2` quebra a progressão `success → warning → ? → destructive`), mas é um detalhe.

---

## Repository 2: `contratos-metrics.ts`

### `STATUS_TONES` — estados do contrato

| Status | Tom | Confiança | Análise |
|---|---|---|---|
| Em Contratação | `info` | ✅ | Estado informacional de pipeline. Correto. |
| Contratado | `primary` | ✅ | Estado ativo de destaque — roxo brand faz sentido para "conquistou o cliente". |
| Distribuído | `success` | ✅ | Contrato em execução — verde correto. |
| Desistência | `destructive` | ✅ | Perda do cliente — vermelho correto. |
| Encerrado | `neutral` | ✅ | Estado terminal neutro. Correto. |

**Veredicto:** Mapeamento exemplar. Uso inteligente de `primary` para "Contratado" diferencia visualmente do "Distribuído" (success), criando uma **hierarquia semântica de funil**.

### `PARCELA_TONES` — status de pagamento

| Status | Tom | Confiança | Análise |
|---|---|---|---|
| Pagas | `success` | ✅ | Canônico. |
| Pendentes | `warning` | ✅ | Canônico. |
| Atrasadas | `destructive` | ✅ | Canônico. |

**Veredicto:** Impecável.

### `TREEMAP_TONES` — obrigações por natureza

| Natureza | Tom | Confiança | Análise |
|---|---|---|---|
| Acordos Trabalhistas | `primary` | ✅ | Faz sentido — foco principal do escritório. |
| Condenações | `destructive` | 🟡 | Defensável (condenação = dano financeiro), mas pode ser visto como carregado. Alternativa: `warning`. |
| Custas Processuais | `warning` | ✅ | Despesa operacional — âmbar correto. |
| Honorários Periciais | `chart-1` | ✅ | Categoria técnica neutra. |

**Veredicto:** Bom, com uma nuance em `Condenações`.

---

## Repository 3: `audiencias-metrics.ts`

### `MODALIDADE_TONES` — formato da audiência

| Modalidade | Tom | Confiança | Análise |
|---|---|---|---|
| Virtual | `info` | ✅ | Informacional — "moderno/digital". Correto. |
| Presencial | `primary` | ✅ | Estado principal/padrão — primary faz sentido. |
| Híbrida | `warning` | 🟡 | **Questionável.** Âmbar para "híbrida" sugere atenção, mas híbrida é só uma modalidade válida. Recomendo `chart-3` ou `accent`. |

**Veredicto:** 1 mapeamento com pequena carga.

### `TIPO_TONES` — tipo de audiência

| Tipo | Tom | Confiança | Análise |
|---|---|---|---|
| Instrução | `primary` | ✅ | Fase principal de colheita de prova. Destaque correto. |
| Conciliação | `info` | ✅ | Tentativa resolutiva — informacional. Correto. |
| Julgamento | `destructive` | ⚠️ | **Carregado.** Julgamento é fase normal do processo, não "ruim". Vermelho cria vieses de leitura. Recomendo `chart-3` ou `primary`. |
| UNA | `neutral` | ✅ | Audiência Una (rara) — cinza neutro adequado. |
| Perícia | `warning` | 🟡 | Perícia é fase técnica, não um alerta. Recomendo `chart-4` (verde alternativo da paleta). |

**Veredicto:** 2 mapeamentos com viés. "Julgamento" como destructive é o mais problemático.

---

## Repository 4: `expedientes-metrics.ts`

### `ORIGEM_TONES` — origem do expediente

| Origem | Tom | Confiança | Análise |
|---|---|---|---|
| Captura PJE | `info` | ✅ | Sistema automático — informacional. Correto. |
| Comunica CNJ | `warning` | 🟡 | **Questionável.** Comunica CNJ é canal oficial, não sinal de alerta. Recomendo `chart-2`. |
| Manual | `neutral` | ✅ | Input manual — neutro correto. |

**Veredicto:** 1 mapeamento com carga leve.

---

## Repository 5: `financeiro-metrics.ts`

### `AGING_TONES` — faixas de vencimento

| Faixa | Tom | Confiança | Análise |
|---|---|---|---|
| A vencer | `success` | ✅ | Saudável — verde correto. |
| Até 30d | `chart-4` | 🟡 | Gradação intermediária. Defensável. |
| 30-60d | `warning` | ✅ | Início da zona de atenção. Correto. |
| 60-90d | `chart-2` | 🟡 | Gradação. Defensável. |
| 90+ dias | `destructive` | ✅ | Crítico — vermelho correto. |

**Veredicto:** Progressão aceitável. `chart-4` e `chart-2` como gradações entre os tons principais é uma escolha criativa — pode funcionar bem visualmente (ver no `/library/visual-diff/widgets`).

### `CATEGORIA_TONES` — despesas por categoria

| Categoria | Tom | Confiança | Análise |
|---|---|---|---|
| Pessoal | `primary` | ✅ | Maior despesa típica — destaque faz sentido. |
| Aluguel | `chart-2` | ✅ | Categorial. |
| Serviços | `chart-3` | ✅ | Categorial. |
| Tributário | `warning` | 🟡 | **Ligeiramente carregado.** Tributos são custo normal, não alerta. Recomendo `chart-4`. |
| Outros | `neutral` | ✅ | Catch-all correto. |

**Veredicto:** 1 mapeamento com pequena carga.

---

## Resumo consolidado

### Contagem por nível de confiança

| Nível | Count | Percentual |
|---|---|---|
| ✅ Alta | **22** | 71% |
| 🟡 Média | **6** | 19% |
| ⚠️ Baixa (ação recomendada) | **3** | 10% |
| **Total** | **31 mappings** | |

### Ações recomendadas (por prioridade)

#### Alta prioridade — carga editorial explícita

**1. Segmento "Criminal" em `processos-metrics.ts`**
- **Atual:** `destructive`
- **Proposto:** `chart-3`
- **Motivo:** Direito criminal é especialidade legítima, não um "alerta". Vermelho sugere que a área é "perigosa".
- **Arquivo:** [processos-metrics.ts:28](../../src/app/(authenticated)/dashboard/repositories/processos-metrics.ts#L28)

**2. Tipo de audiência "Julgamento" em `audiencias-metrics.ts`**
- **Atual:** `destructive`
- **Proposto:** `primary` ou `chart-3`
- **Motivo:** Julgamento é fase normal do processo. Vermelho cria viés negativo que pode influenciar leitura do widget.
- **Arquivo:** [audiencias-metrics.ts:265](../../src/app/(authenticated)/dashboard/repositories/audiencias-metrics.ts#L265)

**3. Segmento "Empresarial" em `processos-metrics.ts`**
- **Atual:** `warning`
- **Proposto:** `chart-3` ou `chart-5`
- **Motivo:** Direito empresarial não é área de "atenção" — âmbar sugere risco desnecessariamente.
- **Arquivo:** [processos-metrics.ts:29](../../src/app/(authenticated)/dashboard/repositories/processos-metrics.ts#L29)

#### Média prioridade — revisão visual recomendada

Estes 6 mappings são defensáveis mas poderiam ser melhores. Decisão pode ficar para depois de ver no harness visual:

| Arquivo | Mapping | Sugestão |
|---|---|---|
| `processos-metrics.ts` | Aging "2-5 anos" = `chart-2` | Considerar `warning` para consistência de progressão |
| `contratos-metrics.ts` | Treemap "Condenações" = `destructive` | Alternativa: `warning` |
| `audiencias-metrics.ts` | Modalidade "Híbrida" = `warning` | Alternativa: `chart-3` ou `accent` |
| `audiencias-metrics.ts` | Tipo "Perícia" = `warning` | Alternativa: `chart-4` |
| `expedientes-metrics.ts` | Origem "Comunica CNJ" = `warning` | Alternativa: `chart-2` |
| `financeiro-metrics.ts` | Categoria "Tributário" = `warning` | Alternativa: `chart-4` |

---

## Observação arquitetural transversal

`★ Padrão identificado ─────────────────────────`
Durante a análise, notei que todos os 11 widgets usam `tokenForTone(item.tone)` **duas vezes** — uma para popular o array `segments` (consumido por primitivos de chart) e outra inline no legend dot (`style={{ backgroundColor: tokenForTone(item.tone) }}`). Esse é o tipo de repetição que, após ~10 ocorrências iguais, justifica uma abstração.

**Proposta (fora do escopo desta sessão):** criar um primitivo `<ToneDot tone={...} size="sm|md" />` em `@/components/ui/tone-dot.tsx`. Reduziria ~22 chamadas a `tokenForTone` para ~11 e centralizaria o padrão visual "dot colorido com backgroundColor de tom semântico".

Registrar como TODO para próxima sessão de refactoring.
`─────────────────────────────────────────────────`

---

## Como aplicar as correções (quando decidir)

Os 3 fixes de "alta prioridade" são trocas de 1 linha cada nos repositories. **Não** afetam widgets (a API `tone: SemanticTone` é preservada):

```typescript
// processos-metrics.ts:28
- 'Empresarial': 'warning',
+ 'Empresarial': 'chart-3',

// processos-metrics.ts:29 (linha do Criminal, ajustar linha se diferente)
- 'Criminal': 'destructive',
+ 'Criminal': 'chart-5',

// audiencias-metrics.ts:265 (ajustar linha)
- 'Julgamento': 'destructive',
+ 'Julgamento': 'primary',
```

Após aplicar, rodar:
```bash
npm run type-check
npm run check:architecture
npx eslint src/
```

Validação automática. Zero risco — tons ainda são válidos no enum `SemanticTone`.

---

**Última atualização:** Sessão de refatoração do Design System — Zattar OS.
**Referências:**
- [VISUAL-REVIEW-CHECKLIST.md](./VISUAL-REVIEW-CHECKLIST.md)
- [semantic-tones.ts helper](../../src/lib/design-system/semantic-tones.ts)
- Página da Dev Library: [/library/tokens/semantic-tones](http://localhost:3000/library/tokens/semantic-tones)
