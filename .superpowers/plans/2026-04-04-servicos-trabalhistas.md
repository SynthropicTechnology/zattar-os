# Servicos Trabalhistas - Plano de Implementacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 20 servicos trabalhistas (10 calculadoras, 5 geradores de documentos, 5 diagnosticos) acessiveis pelo portal do cliente (autenticado via CPF) e por uma pagina publica (sem login), reutilizando componentes compartilhados.

**Architecture:** Modulo compartilhado em `src/app/portal/feature/servicos/` contem toda a logica de calculo (domain), componentes de UI e utilitarios. As rotas do portal (`portal/(dashboard)/servicos/`) e publicas (`servicos/`) consomem os mesmos componentes, diferindo apenas no layout wrapper. Tabelas tributarias 2026 (INSS progressivo, IRRF progressivo, Lei 15.270/2025) ficam centralizadas em um unico arquivo de constantes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, pdf-lib (PDF generation), Lucide icons

**Specs de referencia:**
- `servicos-clientes/sevicos-especs.md` — Spec principal com 20 servicos detalhados
- `servicos-clientes/documento-complementar.md` — Spec complementar com templates de documentos e formulas adicionais

---

## Indice de Fases

| Fase | Descricao | Tasks | Dependencias |
|------|-----------|-------|--------------|
| 0 | Infraestrutura compartilhada | 1-5 | Nenhuma |
| 1 | Calculadoras trabalhistas (10) | 6-15 | Fase 0 |
| 2 | Geradores de documentos (5) | 16-20 | Fase 0 |
| 3 | Diagnosticos (5) | 21-25 | Fases 0, 1 |
| 4 | Rotas publicas + Navegacao | 26-28 | Fases 1, 2, 3 |

---

## Mapa de Arquivos

### Infraestrutura Compartilhada (Fase 0)

```
src/app/portal/feature/servicos/
├── index.ts                          # Barrel exports
├── constants/
│   └── tabelas-2026.ts               # Tabelas INSS, IRRF, seguro-desemprego, aviso previo
├── domain/
│   └── trabalhista.ts                # Tipos compartilhados + funcoes puras de calculo (INSS progressivo, IRRF progressivo, etc.)
├── components/
│   ├── calculator-shell.tsx          # Layout 2-col (input + results) reutilizavel
│   ├── result-row.tsx                # Linha de resultado (label + valor)
│   ├── number-input.tsx              # Input numerico com prefix/suffix
│   ├── currency-input.tsx            # Input monetario com mascara R$
│   ├── range-input.tsx               # Slider com labels
│   ├── toggle-option.tsx             # Toggle com label/descricao
│   ├── select-option.tsx             # Select estilizado
│   ├── action-buttons.tsx            # Botoes Download PDF + Compartilhar
│   ├── verified-badge.tsx            # Badge "Calculo verificado CLT"
│   ├── disclaimer.tsx                # Disclaimer juridico padrao
│   ├── cta-zattar.tsx                # CTA "Fale com a Zattar"
│   ├── service-card.tsx              # Card de servico para paginas index
│   └── service-index-header.tsx      # Header das paginas index (titulo + descricao)
├── utils/
│   └── formatters.ts                 # formatBRL, formatBRLPrecise, formatPercent, formatDate
└── pdf/
    └── generate-pdf.ts               # Geracao de PDF com pdf-lib
```

### Calculadoras (Fase 1) - Cada uma e um page.tsx

```
src/app/portal/(dashboard)/servicos/calculadoras/
├── page.tsx                                    # Index com grid de 10 calculadoras
├── rescisao/page.tsx                           # Servico 01
├── salario-liquido/page.tsx                    # Servico 02
├── horas-extras/page.tsx                       # Servico 03 (migrar de calculadoras/horas-extras)
├── ferias/page.tsx                             # Servico 04 (migrar de calculadoras/ferias)
├── 13-salario/page.tsx                         # Servico 05 (migrar de calculadoras/13-salario)
├── seguro-desemprego/page.tsx                  # Servico 06
├── adicional-noturno/page.tsx                  # Servico 07
├── insalubridade-periculosidade/page.tsx       # Servico 08
├── fgts-acumulado/page.tsx                     # Servico 09
└── correcao-monetaria/page.tsx                 # Servico 10
```

### Geradores de Documentos (Fase 2)

```
src/app/portal/(dashboard)/servicos/geradores/
├── page.tsx                                    # Index com grid de 5 geradores
├── carta-demissao/page.tsx                     # Servico 11
├── notificacao-extrajudicial/page.tsx          # Servico 12
├── declaracao-hipossuficiencia/page.tsx        # Servico 13
├── acordo-extrajudicial/page.tsx               # Servico 14
└── holerite/page.tsx                           # Servico 15
```

### Diagnosticos (Fase 3)

```
src/app/portal/(dashboard)/servicos/diagnosticos/
├── page.tsx                                    # Index com grid de 5 diagnosticos
├── direitos-demissao/page.tsx                  # Servico 16
├── verificador-prazos/page.tsx                 # Servico 17
├── analise-jornada/page.tsx                    # Servico 18
├── elegibilidade-beneficios/page.tsx           # Servico 19
└── simulador-acao/page.tsx                     # Servico 20
```

### Pagina Publica (Fase 4)

```
src/app/servicos/
├── layout.tsx                        # Layout publico (sem PortalShell)
├── page.tsx                          # Hub principal com 3 categorias
├── calculadoras/
│   ├── page.tsx                      # Index calculadoras (reusa service-index-header + service-card)
│   ├── rescisao/page.tsx             # Importa mesmo componente do portal
│   ├── salario-liquido/page.tsx
│   ├── horas-extras/page.tsx
│   ├── ferias/page.tsx
│   ├── 13-salario/page.tsx
│   ├── seguro-desemprego/page.tsx
│   ├── adicional-noturno/page.tsx
│   ├── insalubridade-periculosidade/page.tsx
│   ├── fgts-acumulado/page.tsx
│   └── correcao-monetaria/page.tsx
├── geradores/
│   ├── page.tsx
│   ├── carta-demissao/page.tsx
│   ├── notificacao-extrajudicial/page.tsx
│   ├── declaracao-hipossuficiencia/page.tsx
│   ├── acordo-extrajudicial/page.tsx
│   └── holerite/page.tsx
└── diagnosticos/
    ├── page.tsx
    ├── direitos-demissao/page.tsx
    ├── verificador-prazos/page.tsx
    ├── analise-jornada/page.tsx
    ├── elegibilidade-beneficios/page.tsx
    └── simulador-acao/page.tsx
```

---

## Fase 0: Infraestrutura Compartilhada

### Task 1: Tabelas Tributarias 2026

**Files:**
- Create: `src/app/portal/feature/servicos/constants/tabelas-2026.ts`
- Test: `src/app/portal/feature/servicos/__tests__/unit/tabelas-2026.test.ts`

- [ ] **Step 1: Criar arquivo de constantes com todas as tabelas 2026**

```typescript
// src/app/portal/feature/servicos/constants/tabelas-2026.ts

// ─── Valores de Referencia 2026 ──────────────────────────────────────────────

export const SALARIO_MINIMO_2026 = 1_621.00
export const TETO_INSS_2026 = 8_475.55
export const TETO_SEGURO_DESEMPREGO_2026 = 2_518.65
export const DEDUCAO_DEPENDENTE_IRRF_2026 = 189.59
export const FGTS_PERCENTUAL = 0.08
export const FGTS_MULTA_PERCENTUAL = 0.40

// ─── Tabela INSS Progressiva 2026 ───────────────────────────────────────────

export interface FaixaINSS {
  ate: number
  aliquota: number
}

export const FAIXAS_INSS_2026: FaixaINSS[] = [
  { ate: 1_621.00, aliquota: 0.075 },
  { ate: 2_625.22, aliquota: 0.09 },
  { ate: 5_250.49, aliquota: 0.12 },
  { ate: 8_475.55, aliquota: 0.14 },
]

// ─── Tabela IRRF Progressiva 2026 ───────────────────────────────────────────

export interface FaixaIRRF {
  ate: number       // Infinity para ultima faixa
  aliquota: number
  deducao: number
}

export const FAIXAS_IRRF_2026: FaixaIRRF[] = [
  { ate: 2_259.20, aliquota: 0, deducao: 0 },
  { ate: 2_826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3_751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4_664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
]

// Redutor mensal Lei 15.270/2025 — aplica-se a rendimentos ate R$ 7.350,00
export const REDUTOR_LEI_15270_2025 = 564.80

// ─── Tabela Seguro-Desemprego 2026 ──────────────────────────────────────────

export interface FaixaSeguroDesemprego {
  ate: number
  formula: 'multiplicar' | 'fixo_mais_excedente' | 'teto'
  fator?: number
  base?: number
  excedenteFator?: number
}

export const FAIXAS_SEGURO_DESEMPREGO_2026: FaixaSeguroDesemprego[] = [
  { ate: 2_138.76, formula: 'multiplicar', fator: 0.8 },
  { ate: 3_564.96, formula: 'fixo_mais_excedente', base: 1_711.01, excedenteFator: 0.5 },
  { ate: Infinity, formula: 'teto' },
]

export const PISO_SEGURO_DESEMPREGO_2026 = SALARIO_MINIMO_2026
export const TETO_SEGURO_DESEMPREGO_VALOR_2026 = 2_518.65

// ─── Tabela Parcelas Seguro-Desemprego ──────────────────────────────────────

export interface RegraParcelasSeguro {
  solicitacao: '1a' | '2a' | '3a_ou_mais'
  mesesMinimos: number
  parcelas: [number, number, number] // [minParcelas, medioParcelas, maxParcelas] por faixa de meses
  faixasMeses: [number, number, number] // limites de meses para cada faixa
}

export const REGRAS_PARCELAS_SEGURO: RegraParcelasSeguro[] = [
  { solicitacao: '1a', mesesMinimos: 12, parcelas: [4, 5, 5], faixasMeses: [12, 23, 24] },
  { solicitacao: '2a', mesesMinimos: 9, parcelas: [3, 4, 5], faixasMeses: [9, 11, 12] },
  { solicitacao: '3a_ou_mais', mesesMinimos: 6, parcelas: [3, 4, 5], faixasMeses: [6, 11, 12] },
]

// ─── Tabela Aviso Previo Proporcional ───────────────────────────────────────

/**
 * Aviso previo: 30 dias base + 3 dias por ano trabalhado, max 90 dias.
 */
export function calcularDiasAvisoPrevio(anosCompletos: number): number {
  return Math.min(30 + anosCompletos * 3, 90)
}

// ─── Tabela Reducao Ferias por Faltas (Art. 130 CLT) ────────────────────────

export const REDUCAO_FERIAS_POR_FALTAS: { faltasAte: number; diasFerias: number }[] = [
  { faltasAte: 5, diasFerias: 30 },
  { faltasAte: 14, diasFerias: 24 },
  { faltasAte: 23, diasFerias: 18 },
  { faltasAte: 32, diasFerias: 12 },
  // Acima de 32 faltas: sem direito a ferias
]

// ─── Adicional Noturno ──────────────────────────────────────────────────────

export const ADICIONAL_NOTURNO_PERCENTUAL = 0.20
export const HORA_NOTURNA_REDUZIDA_MINUTOS = 52.5 // 52min30s

// ─── Insalubridade / Periculosidade ─────────────────────────────────────────

export type GrauInsalubridade = 'minimo' | 'medio' | 'maximo'

export const INSALUBRIDADE_PERCENTUAIS: Record<GrauInsalubridade, number> = {
  minimo: 0.10,
  medio: 0.20,
  maximo: 0.40,
}

export const PERICULOSIDADE_PERCENTUAL = 0.30

// ─── FGTS Rendimento ────────────────────────────────────────────────────────

export const FGTS_RENDIMENTO_ANUAL = 0.03  // 3% a.a. (TR + juros)
export const FGTS_RENDIMENTO_MENSAL = 0.0025 // ~0.25% a.m. simplificado

// ─── Danos Morais (Art. 223-G CLT) ──────────────────────────────────────────

export type GravidadeDanoMoral = 'leve' | 'medio' | 'grave' | 'gravissimo'

export const MULTIPLICADORES_DANO_MORAL: Record<GravidadeDanoMoral, number> = {
  leve: 3,
  medio: 5,
  grave: 20,
  gravissimo: 50,
}
```

- [ ] **Step 2: Escrever testes para as tabelas**

```typescript
// src/app/portal/feature/servicos/__tests__/unit/tabelas-2026.test.ts
import {
  FAIXAS_INSS_2026,
  FAIXAS_IRRF_2026,
  SALARIO_MINIMO_2026,
  TETO_INSS_2026,
  calcularDiasAvisoPrevio,
  REDUCAO_FERIAS_POR_FALTAS,
} from '../../constants/tabelas-2026'

describe('Tabelas 2026', () => {
  test('salario minimo 2026 = R$ 1.621,00', () => {
    expect(SALARIO_MINIMO_2026).toBe(1621.00)
  })

  test('teto INSS 2026 = R$ 8.475,55', () => {
    expect(TETO_INSS_2026).toBe(8475.55)
  })

  test('INSS tem 4 faixas progressivas', () => {
    expect(FAIXAS_INSS_2026).toHaveLength(4)
    expect(FAIXAS_INSS_2026[0].aliquota).toBe(0.075)
    expect(FAIXAS_INSS_2026[3].aliquota).toBe(0.14)
  })

  test('IRRF tem 5 faixas', () => {
    expect(FAIXAS_IRRF_2026).toHaveLength(5)
    expect(FAIXAS_IRRF_2026[0].aliquota).toBe(0) // isento
    expect(FAIXAS_IRRF_2026[4].aliquota).toBe(0.275)
  })

  test('aviso previo: 1 ano = 33 dias', () => {
    expect(calcularDiasAvisoPrevio(1)).toBe(33)
  })

  test('aviso previo: 20 anos = 90 dias (teto)', () => {
    expect(calcularDiasAvisoPrevio(20)).toBe(90)
  })

  test('aviso previo: 0 anos = 30 dias', () => {
    expect(calcularDiasAvisoPrevio(0)).toBe(30)
  })

  test('reducao ferias: 6 faltas = 24 dias', () => {
    const regra = REDUCAO_FERIAS_POR_FALTAS.find(r => 6 <= r.faltasAte)
    expect(regra?.diasFerias).toBe(24)
  })
})
```

- [ ] **Step 3: Rodar testes e verificar que passam**

Run: `npx jest src/app/portal/feature/servicos/__tests__/unit/tabelas-2026.test.ts --no-coverage`
Expected: 7 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/feature/servicos/constants/tabelas-2026.ts src/app/portal/feature/servicos/__tests__/unit/tabelas-2026.test.ts
git commit -m "feat(servicos): add 2026 labor law tax tables and constants"
```

---

### Task 2: Motor de Calculo Compartilhado (domain)

**Files:**
- Create: `src/app/portal/feature/servicos/domain/trabalhista.ts`
- Test: `src/app/portal/feature/servicos/__tests__/unit/trabalhista.test.ts`

- [ ] **Step 1: Criar funcoes puras de calculo INSS/IRRF progressivos**

```typescript
// src/app/portal/feature/servicos/domain/trabalhista.ts

import {
  FAIXAS_INSS_2026,
  FAIXAS_IRRF_2026,
  TETO_INSS_2026,
  DEDUCAO_DEPENDENTE_IRRF_2026,
  REDUTOR_LEI_15270_2025,
  FAIXAS_SEGURO_DESEMPREGO_2026,
  PISO_SEGURO_DESEMPREGO_2026,
  TETO_SEGURO_DESEMPREGO_VALOR_2026,
  REGRAS_PARCELAS_SEGURO,
  SALARIO_MINIMO_2026,
  FGTS_PERCENTUAL,
  FGTS_MULTA_PERCENTUAL,
  FGTS_RENDIMENTO_MENSAL,
  ADICIONAL_NOTURNO_PERCENTUAL,
  HORA_NOTURNA_REDUZIDA_MINUTOS,
  INSALUBRIDADE_PERCENTUAIS,
  PERICULOSIDADE_PERCENTUAL,
  MULTIPLICADORES_DANO_MORAL,
  REDUCAO_FERIAS_POR_FALTAS,
  calcularDiasAvisoPrevio,
  type GrauInsalubridade,
  type GravidadeDanoMoral,
  type FaixaINSS,
} from '../constants/tabelas-2026'

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type TipoRescisao =
  | 'sem_justa_causa'
  | 'pedido_demissao'
  | 'justa_causa'
  | 'consensual'
  | 'indireta'
  | 'termino_contrato'

export type TipoAvisoPrevio = 'trabalhado' | 'indenizado' | 'dispensado'

export interface ResultadoINSS {
  total: number
  aliquotaEfetiva: number
  faixas: { faixa: FaixaINSS; contribuicao: number }[]
}

export interface ResultadoIRRF {
  baseCalculo: number
  imposto: number
  aliquotaEfetiva: number
  isento: boolean
}

// ─── INSS Progressivo ───────────────────────────────────────────────────────

export function calcularINSS(salarioBruto: number): ResultadoINSS {
  if (salarioBruto <= 0) return { total: 0, aliquotaEfetiva: 0, faixas: [] }

  let restante = Math.min(salarioBruto, TETO_INSS_2026)
  let total = 0
  let faixaAnterior = 0
  const faixasCalculo: { faixa: FaixaINSS; contribuicao: number }[] = []

  for (const faixa of FAIXAS_INSS_2026) {
    if (restante <= 0) break
    const base = Math.min(restante, faixa.ate - faixaAnterior)
    const contribuicao = base * faixa.aliquota
    total += contribuicao
    faixasCalculo.push({ faixa, contribuicao })
    restante -= base
    faixaAnterior = faixa.ate
  }

  return {
    total,
    aliquotaEfetiva: salarioBruto > 0 ? total / Math.min(salarioBruto, TETO_INSS_2026) : 0,
    faixas: faixasCalculo,
  }
}

// ─── IRRF Progressivo ───────────────────────────────────────────────────────

export function calcularIRRF(
  salarioBruto: number,
  descontoINSS: number,
  dependentes: number = 0
): ResultadoIRRF {
  const deducaoDependentes = dependentes * DEDUCAO_DEPENDENTE_IRRF_2026
  let baseCalculo = salarioBruto - descontoINSS - deducaoDependentes

  // Aplica redutor da Lei 15.270/2025 se rendimento <= R$ 7.350
  if (salarioBruto <= 7_350) {
    baseCalculo = Math.max(0, baseCalculo - REDUTOR_LEI_15270_2025)
  }

  if (baseCalculo <= 0) return { baseCalculo: 0, imposto: 0, aliquotaEfetiva: 0, isento: true }

  const faixa = FAIXAS_IRRF_2026.find(f => baseCalculo <= f.ate)!
  const imposto = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao)

  return {
    baseCalculo,
    imposto,
    aliquotaEfetiva: salarioBruto > 0 ? imposto / salarioBruto : 0,
    isento: imposto === 0,
  }
}

// ─── Salario Liquido (Servico 02) ───────────────────────────────────────────

export interface ParamsSalarioLiquido {
  salarioBruto: number
  dependentes: number
  valeTransporte: boolean
  adicionalInsalubridade?: { grau: GrauInsalubridade }
  adicionalPericulosidade?: boolean
  adicionalNoturno?: { horasNoturnas: number }
  pensaoAlimentar?: number  // percentual (ex: 0.30 para 30%)
  outrosDescontos?: number
}

export interface ResultadoSalarioLiquido {
  salarioBruto: number
  totalProventos: number
  adicionalInsalubridade: number
  adicionalPericulosidade: number
  adicionalNoturno: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  valeTransporte: number
  pensaoAlimentar: number
  outrosDescontos: number
  totalDescontos: number
  salarioLiquido: number
}

export function calcularSalarioLiquido(params: ParamsSalarioLiquido): ResultadoSalarioLiquido {
  const {
    salarioBruto,
    dependentes,
    valeTransporte,
    adicionalInsalubridade: insalubridadeParam,
    adicionalPericulosidade: periculosidadeParam,
    adicionalNoturno: noturnoParam,
    pensaoAlimentar = 0,
    outrosDescontos = 0,
  } = params

  // Adicionais
  const adicInsalubridade = insalubridadeParam
    ? SALARIO_MINIMO_2026 * INSALUBRIDADE_PERCENTUAIS[insalubridadeParam.grau]
    : 0
  const adicPericulosidade = periculosidadeParam ? salarioBruto * PERICULOSIDADE_PERCENTUAL : 0
  const adicNoturno = noturnoParam
    ? (salarioBruto / 220) * noturnoParam.horasNoturnas * ADICIONAL_NOTURNO_PERCENTUAL
    : 0

  const totalProventos = salarioBruto + adicInsalubridade + adicPericulosidade + adicNoturno

  // Descontos
  const inss = calcularINSS(totalProventos)
  const irrf = calcularIRRF(totalProventos, inss.total, dependentes)
  const vt = valeTransporte ? salarioBruto * 0.06 : 0
  const pensao = pensaoAlimentar > 0 ? (totalProventos - inss.total) * pensaoAlimentar : 0

  const totalDescontos = inss.total + irrf.imposto + vt + pensao + outrosDescontos
  const salarioLiquido = totalProventos - totalDescontos

  return {
    salarioBruto,
    totalProventos,
    adicionalInsalubridade: adicInsalubridade,
    adicionalPericulosidade: adicPericulosidade,
    adicionalNoturno: adicNoturno,
    inss,
    irrf,
    valeTransporte: vt,
    pensaoAlimentar: pensao,
    outrosDescontos,
    totalDescontos,
    salarioLiquido,
  }
}

// ─── Horas Extras (Servico 03) ──────────────────────────────────────────────

export interface ParamsHorasExtras {
  salarioBruto: number
  horasMensais: number // 220, 200, 180, 150
  horasExtrasSemana: number
  horasExtrasFimDeSemana: number
  periodoMeses: number
  percentualConvencao?: number // adicional por convencao coletiva
}

export interface ResultadoHorasExtras {
  valorHoraNormal: number
  valorHoraExtra50: number
  valorHoraExtra100: number
  totalHorasExtras50: number
  totalHorasExtras100: number
  totalHorasExtras: number
  dsr: number
  reflexoFerias: number
  reflexo13: number
  reflexoFGTS: number
  reflexoFGTSMulta: number
  totalMensal: number
  totalPeriodo: number
}

export function calcularHorasExtras(params: ParamsHorasExtras): ResultadoHorasExtras {
  const {
    salarioBruto,
    horasMensais,
    horasExtrasSemana,
    horasExtrasFimDeSemana,
    periodoMeses,
    percentualConvencao,
  } = params

  if (salarioBruto <= 0 || horasMensais <= 0) {
    return {
      valorHoraNormal: 0, valorHoraExtra50: 0, valorHoraExtra100: 0,
      totalHorasExtras50: 0, totalHorasExtras100: 0, totalHorasExtras: 0,
      dsr: 0, reflexoFerias: 0, reflexo13: 0, reflexoFGTS: 0, reflexoFGTSMulta: 0,
      totalMensal: 0, totalPeriodo: 0,
    }
  }

  const valorHoraNormal = salarioBruto / horasMensais
  const pct50 = percentualConvencao ? 1 + percentualConvencao : 1.5
  const valorHoraExtra50 = valorHoraNormal * pct50
  const valorHoraExtra100 = valorHoraNormal * 2

  const totalHorasExtras50 = valorHoraExtra50 * horasExtrasSemana
  const totalHorasExtras100 = valorHoraExtra100 * horasExtrasFimDeSemana
  const totalHorasExtras = totalHorasExtras50 + totalHorasExtras100

  const dsr = totalHorasExtras / 6
  const baseReflexo = totalHorasExtras + dsr

  const reflexoFerias = (baseReflexo / 12) * (4 / 3)  // 1/12 + 1/3
  const reflexo13 = baseReflexo / 12
  const reflexoFGTS = baseReflexo * FGTS_PERCENTUAL
  const reflexoFGTSMulta = reflexoFGTS * FGTS_MULTA_PERCENTUAL

  const totalMensal = totalHorasExtras + dsr
  const totalPeriodo = (totalMensal + reflexoFerias + reflexo13 + reflexoFGTS + reflexoFGTSMulta) * periodoMeses

  return {
    valorHoraNormal, valorHoraExtra50, valorHoraExtra100,
    totalHorasExtras50, totalHorasExtras100, totalHorasExtras,
    dsr, reflexoFerias, reflexo13, reflexoFGTS, reflexoFGTSMulta,
    totalMensal, totalPeriodo,
  }
}

// ─── Ferias (Servico 04) ────────────────────────────────────────────────────

export interface ParamsFerias {
  salarioBruto: number
  diasFerias: number
  abonoPecuniario: boolean
  mediaAdicionais: number
  dependentes: number
  faltasInjustificadas: number
}

export interface ResultadoFerias {
  diasDireito: number
  salarioProporcional: number
  tercoConstitucional: number
  abonoPecuniario: number
  tercoAbono: number
  mediaAdicionais: number
  totalBruto: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  totalLiquido: number
}

export function calcularFerias(params: ParamsFerias): ResultadoFerias {
  const { salarioBruto, diasFerias, abonoPecuniario, mediaAdicionais, dependentes, faltasInjustificadas } = params

  // Reducao por faltas
  const regraFaltas = REDUCAO_FERIAS_POR_FALTAS.find(r => faltasInjustificadas <= r.faltasAte)
  const diasDireito = regraFaltas ? Math.min(diasFerias, regraFaltas.diasFerias) : 0

  if (salarioBruto <= 0 || diasDireito <= 0) {
    return {
      diasDireito: 0, salarioProporcional: 0, tercoConstitucional: 0,
      abonoPecuniario: 0, tercoAbono: 0, mediaAdicionais: 0, totalBruto: 0,
      inss: { total: 0, aliquotaEfetiva: 0, faixas: [] },
      irrf: { baseCalculo: 0, imposto: 0, aliquotaEfetiva: 0, isento: true },
      totalLiquido: 0,
    }
  }

  const salarioProporcional = (salarioBruto / 30) * diasDireito
  const tercoConstitucional = salarioProporcional / 3

  // Abono pecuniario: venda de 1/3 dos dias (isento de INSS/IRRF)
  const diasAbono = abonoPecuniario ? Math.floor(diasDireito / 3) : 0
  const valorAbono = (salarioBruto / 30) * diasAbono
  const tercoAbono = valorAbono / 3

  // Base tributavel: exclui abono pecuniario (isento)
  const baseTributavel = salarioProporcional + tercoConstitucional + mediaAdicionais
  const inss = calcularINSS(baseTributavel)
  const irrf = calcularIRRF(baseTributavel, inss.total, dependentes)

  const totalBruto = salarioProporcional + tercoConstitucional + valorAbono + tercoAbono + mediaAdicionais
  const totalLiquido = totalBruto - inss.total - irrf.imposto

  return {
    diasDireito, salarioProporcional, tercoConstitucional,
    abonoPecuniario: valorAbono, tercoAbono, mediaAdicionais,
    totalBruto, inss, irrf, totalLiquido,
  }
}

// ─── 13o Salario (Servico 05) ───────────────────────────────────────────────

export interface ParamsDecimoTerceiro {
  salarioBruto: number
  mesesTrabalhados: number  // 1-12
  dependentes: number
  mediaAdicionais: number
}

export interface ResultadoDecimoTerceiro {
  proporcional: number
  primeiraParcela: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  segundaParcela: number
  totalLiquido: number
}

export function calcularDecimoTerceiro(params: ParamsDecimoTerceiro): ResultadoDecimoTerceiro {
  const { salarioBruto, mesesTrabalhados, dependentes, mediaAdicionais } = params

  if (salarioBruto <= 0 || mesesTrabalhados <= 0) {
    return {
      proporcional: 0, primeiraParcela: 0,
      inss: { total: 0, aliquotaEfetiva: 0, faixas: [] },
      irrf: { baseCalculo: 0, imposto: 0, aliquotaEfetiva: 0, isento: true },
      segundaParcela: 0, totalLiquido: 0,
    }
  }

  const proporcional = ((salarioBruto + mediaAdicionais) / 12) * mesesTrabalhados
  const primeiraParcela = proporcional / 2 // sem descontos

  const inss = calcularINSS(proporcional)
  const irrf = calcularIRRF(proporcional, inss.total, dependentes)

  const segundaParcela = proporcional - primeiraParcela - inss.total - irrf.imposto
  const totalLiquido = primeiraParcela + segundaParcela

  return { proporcional, primeiraParcela, inss, irrf, segundaParcela, totalLiquido }
}

// ─── Seguro-Desemprego (Servico 06) ─────────────────────────────────────────

export interface ParamsSeguroDesemprego {
  ultimosSalarios: [number, number, number] // ultimos 3 meses
  mesesTrabalhados36: number // meses nos ultimos 36
  vezesSolicitado: 1 | 2 | 3 // 1a, 2a, 3a+ vez
}

export interface ResultadoSeguroDesemprego {
  mediaSalarial: number
  valorParcela: number
  quantidadeParcelas: number
  totalEstimado: number
  elegivel: boolean
  motivoInelegibilidade?: string
}

export function calcularSeguroDesemprego(params: ParamsSeguroDesemprego): ResultadoSeguroDesemprego {
  const { ultimosSalarios, mesesTrabalhados36, vezesSolicitado } = params

  // Verifica elegibilidade
  const solicitacao = vezesSolicitado === 1 ? '1a' : vezesSolicitado === 2 ? '2a' : '3a_ou_mais'
  const regra = REGRAS_PARCELAS_SEGURO.find(r => r.solicitacao === solicitacao)!

  if (mesesTrabalhados36 < regra.mesesMinimos) {
    return {
      mediaSalarial: 0, valorParcela: 0, quantidadeParcelas: 0, totalEstimado: 0,
      elegivel: false,
      motivoInelegibilidade: `Necessario minimo de ${regra.mesesMinimos} meses trabalhados nos ultimos 36 meses para a ${solicitacao} solicitacao.`,
    }
  }

  const mediaSalarial = ultimosSalarios.reduce((a, b) => a + b, 0) / 3

  // Calculo do valor
  let valorParcela: number
  const faixa = FAIXAS_SEGURO_DESEMPREGO_2026.find(f => mediaSalarial <= f.ate)!
  if (faixa.formula === 'multiplicar') {
    valorParcela = mediaSalarial * faixa.fator!
  } else if (faixa.formula === 'fixo_mais_excedente') {
    valorParcela = faixa.base! + (mediaSalarial - FAIXAS_SEGURO_DESEMPREGO_2026[0].ate) * faixa.excedenteFator!
  } else {
    valorParcela = TETO_SEGURO_DESEMPREGO_VALOR_2026
  }
  valorParcela = Math.max(PISO_SEGURO_DESEMPREGO_2026, Math.min(valorParcela, TETO_SEGURO_DESEMPREGO_VALOR_2026))

  // Quantidade de parcelas
  let quantidadeParcelas: number
  if (mesesTrabalhados36 >= regra.faixasMeses[2]) {
    quantidadeParcelas = regra.parcelas[2]
  } else if (mesesTrabalhados36 >= regra.faixasMeses[1]) {
    quantidadeParcelas = regra.parcelas[1]
  } else {
    quantidadeParcelas = regra.parcelas[0]
  }

  return {
    mediaSalarial,
    valorParcela: Math.round(valorParcela * 100) / 100,
    quantidadeParcelas,
    totalEstimado: Math.round(valorParcela * quantidadeParcelas * 100) / 100,
    elegivel: true,
  }
}

// ─── Rescisao (Servico 01) ──────────────────────────────────────────────────

export interface ParamsRescisao {
  salarioBruto: number
  dataAdmissao: Date
  dataRescisao: Date
  tipoRescisao: TipoRescisao
  avisoPrevio: TipoAvisoPrevio
  saldoFGTS: number
  dependentes: number
  mediaHorasExtras: number   // media mensal em R$
  feriasVencidas: boolean
}

export interface ResultadoRescisao {
  saldoSalario: number
  avisoPrevioIndenizado: number
  diasAvisoPrevio: number
  decimoTerceiroProporcional: number
  feriasProporcionais: number
  tercoFerias: number
  feriasVencidas: number
  tercoFeriasVencidas: number
  multaFGTS: number
  totalBruto: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  totalLiquido: number
  verbas: { label: string; valor: number; tipo: 'provento' | 'desconto' }[]
}

export function calcularRescisao(params: ParamsRescisao): ResultadoRescisao {
  const {
    salarioBruto, dataAdmissao, dataRescisao, tipoRescisao,
    avisoPrevio, saldoFGTS, dependentes, mediaHorasExtras, feriasVencidas,
  } = params

  // Calculos base
  const diasTrabalhados = dataRescisao.getDate()
  const saldoSalario = (salarioBruto / 30) * diasTrabalhados

  // Anos completos para aviso previo proporcional
  const diffMs = dataRescisao.getTime() - dataAdmissao.getTime()
  const anosCompletos = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
  const mesesDesdeAdmissao = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000))

  // Aviso previo
  const diasAvisoPrevio = calcularDiasAvisoPrevio(anosCompletos)
  const temAvisoPrevioIndenizado =
    (tipoRescisao === 'sem_justa_causa' || tipoRescisao === 'indireta') && avisoPrevio === 'indenizado'
  const temAvisoPrevioConsensual =
    tipoRescisao === 'consensual' && avisoPrevio === 'indenizado'
  const avisoPrevioIndenizado = temAvisoPrevioIndenizado
    ? (salarioBruto / 30) * diasAvisoPrevio
    : temAvisoPrevioConsensual
      ? ((salarioBruto / 30) * diasAvisoPrevio) / 2
      : 0

  // Meses para proporcionais (incluindo projecao do aviso previo indenizado)
  const mesesProjecao = temAvisoPrevioIndenizado ? Math.ceil(diasAvisoPrevio / 30) : 0
  const mesAtual = dataRescisao.getMonth() + 1
  const meses13 = diasTrabalhados >= 15 ? mesAtual + mesesProjecao : mesAtual - 1 + mesesProjecao
  const meses13Efetivo = Math.min(12, Math.max(0, meses13))

  // Direitos por tipo de rescisao
  const temDecimo = tipoRescisao !== 'justa_causa'
  const temFerias = tipoRescisao !== 'justa_causa'
  const temMultaFGTS = tipoRescisao === 'sem_justa_causa' || tipoRescisao === 'indireta'
  const temMultaFGTSConsensual = tipoRescisao === 'consensual'

  const decimoTerceiroProporcional = temDecimo ? ((salarioBruto + mediaHorasExtras) / 12) * meses13Efetivo : 0
  const mesesFeriasProporcionais = mesesDesdeAdmissao % 12
  const feriasProporcionaisValor = temFerias ? ((salarioBruto + mediaHorasExtras) / 12) * mesesFeriasProporcionais : 0
  const tercoFerias = feriasProporcionaisValor / 3
  const feriasVencidasValor = feriasVencidas ? salarioBruto + mediaHorasExtras : 0
  const tercoFeriasVencidas = feriasVencidasValor / 3

  // FGTS
  const multaFGTS = temMultaFGTS ? saldoFGTS * FGTS_MULTA_PERCENTUAL
    : temMultaFGTSConsensual ? saldoFGTS * (FGTS_MULTA_PERCENTUAL / 2) // 20% na consensual
    : 0

  // Totais
  const totalBruto = saldoSalario + avisoPrevioIndenizado + decimoTerceiroProporcional +
    feriasProporcionaisValor + tercoFerias + feriasVencidasValor + tercoFeriasVencidas + multaFGTS

  // Tributacao: INSS/IRRF so sobre saldo salario + 13o
  const baseTributavel = saldoSalario + decimoTerceiroProporcional
  const inss = calcularINSS(baseTributavel)
  const irrf = calcularIRRF(baseTributavel, inss.total, dependentes)

  const totalLiquido = totalBruto - inss.total - irrf.imposto

  // Verbas detalhadas
  const verbas: ResultadoRescisao['verbas'] = [
    { label: 'Saldo de Salario', valor: saldoSalario, tipo: 'provento' },
  ]
  if (avisoPrevioIndenizado > 0) verbas.push({ label: 'Aviso Previo Indenizado', valor: avisoPrevioIndenizado, tipo: 'provento' })
  if (decimoTerceiroProporcional > 0) verbas.push({ label: '13o Proporcional', valor: decimoTerceiroProporcional, tipo: 'provento' })
  if (feriasProporcionaisValor > 0) verbas.push({ label: 'Ferias Proporcionais', valor: feriasProporcionaisValor, tipo: 'provento' })
  if (tercoFerias > 0) verbas.push({ label: '1/3 Ferias', valor: tercoFerias, tipo: 'provento' })
  if (feriasVencidasValor > 0) verbas.push({ label: 'Ferias Vencidas', valor: feriasVencidasValor, tipo: 'provento' })
  if (tercoFeriasVencidas > 0) verbas.push({ label: '1/3 Ferias Vencidas', valor: tercoFeriasVencidas, tipo: 'provento' })
  if (multaFGTS > 0) verbas.push({ label: `Multa FGTS (${temMultaFGTSConsensual ? '20' : '40'}%)`, valor: multaFGTS, tipo: 'provento' })
  if (inss.total > 0) verbas.push({ label: 'INSS', valor: inss.total, tipo: 'desconto' })
  if (irrf.imposto > 0) verbas.push({ label: 'IRRF', valor: irrf.imposto, tipo: 'desconto' })

  return {
    saldoSalario, avisoPrevioIndenizado, diasAvisoPrevio,
    decimoTerceiroProporcional, feriasProporcionais: feriasProporcionaisValor,
    tercoFerias, feriasVencidas: feriasVencidasValor, tercoFeriasVencidas,
    multaFGTS, totalBruto, inss, irrf, totalLiquido, verbas,
  }
}

// ─── Adicional Noturno (Servico 07) ─────────────────────────────────────────

export interface ParamsAdicionalNoturno {
  salarioBruto: number
  horasNoturnas: number
  tipo: 'urbano' | 'rural_pecuaria' | 'rural_lavoura'
}

export interface ResultadoAdicionalNoturno {
  valorHoraNormal: number
  valorHoraNoturna: number
  horasFictas: number
  totalAdicional: number
  periodoNoturno: string
}

export function calcularAdicionalNoturno(params: ParamsAdicionalNoturno): ResultadoAdicionalNoturno {
  const { salarioBruto, horasNoturnas, tipo } = params

  const valorHoraNormal = salarioBruto / 220
  const valorHoraNoturna = valorHoraNormal * (1 + ADICIONAL_NOTURNO_PERCENTUAL)
  const horasFictas = tipo === 'urbano' ? horasNoturnas * (60 / HORA_NOTURNA_REDUZIDA_MINUTOS) : horasNoturnas
  const totalAdicional = horasFictas * valorHoraNormal * ADICIONAL_NOTURNO_PERCENTUAL

  const periodos: Record<string, string> = {
    urbano: '22h as 5h',
    rural_pecuaria: '20h as 4h',
    rural_lavoura: '21h as 5h',
  }

  return {
    valorHoraNormal, valorHoraNoturna, horasFictas,
    totalAdicional, periodoNoturno: periodos[tipo],
  }
}

// ─── Insalubridade / Periculosidade (Servico 08) ────────────────────────────

export interface ParamsInsalubridadePericulosidade {
  salarioBruto: number
  tipo: 'insalubridade' | 'periculosidade'
  grauInsalubridade?: GrauInsalubridade
}

export interface ResultadoInsalubridadePericulosidade {
  tipo: string
  baseCalculo: number
  percentual: number
  valorAdicional: number
}

export function calcularInsalubridadePericulosidade(params: ParamsInsalubridadePericulosidade): ResultadoInsalubridadePericulosidade {
  const { salarioBruto, tipo, grauInsalubridade } = params

  if (tipo === 'insalubridade' && grauInsalubridade) {
    const percentual = INSALUBRIDADE_PERCENTUAIS[grauInsalubridade]
    return {
      tipo: `Insalubridade (${grauInsalubridade})`,
      baseCalculo: SALARIO_MINIMO_2026,
      percentual,
      valorAdicional: SALARIO_MINIMO_2026 * percentual,
    }
  }

  return {
    tipo: 'Periculosidade',
    baseCalculo: salarioBruto,
    percentual: PERICULOSIDADE_PERCENTUAL,
    valorAdicional: salarioBruto * PERICULOSIDADE_PERCENTUAL,
  }
}

// ─── FGTS Acumulado (Servico 09) ────────────────────────────────────────────

export interface ParamsFGTSAcumulado {
  salarioBruto: number
  mesesTrabalhados: number
}

export interface ResultadoFGTSAcumulado {
  depositoMensal: number
  deposito13: number
  depositoFerias: number
  totalDepositos: number
  rendimento: number
  saldoEstimado: number
}

export function calcularFGTSAcumulado(params: ParamsFGTSAcumulado): ResultadoFGTSAcumulado {
  const { salarioBruto, mesesTrabalhados } = params

  const depositoMensal = salarioBruto * FGTS_PERCENTUAL
  const anosCompletos = Math.floor(mesesTrabalhados / 12)
  const deposito13 = (salarioBruto * FGTS_PERCENTUAL) * anosCompletos
  const depositoFerias = ((salarioBruto + salarioBruto / 3) * FGTS_PERCENTUAL) * anosCompletos

  // Simulacao com juros compostos simplificados
  let saldo = 0
  for (let i = 0; i < mesesTrabalhados; i++) {
    saldo += depositoMensal
    saldo *= (1 + FGTS_RENDIMENTO_MENSAL)
    // Deposito 13o (dezembro de cada ano)
    if ((i + 1) % 12 === 0) {
      saldo += salarioBruto * FGTS_PERCENTUAL // 13o
      saldo += (salarioBruto + salarioBruto / 3) * FGTS_PERCENTUAL // ferias + 1/3
    }
  }

  const totalDepositos = depositoMensal * mesesTrabalhados + deposito13 + depositoFerias
  const rendimento = saldo - totalDepositos

  return {
    depositoMensal,
    deposito13,
    depositoFerias,
    totalDepositos,
    rendimento: Math.max(0, rendimento),
    saldoEstimado: saldo,
  }
}

// ─── Simulador Acao Trabalhista (Servico 20) ────────────────────────────────

export type VerbaAcao =
  | 'horas_extras'
  | 'intervalo_suprimido'
  | 'adicional_noturno'
  | 'insalubridade'
  | 'periculosidade'
  | 'fgts_nao_depositado'
  | 'ferias_nao_gozadas'
  | 'decimo_terceiro'
  | 'dano_moral'
  | 'desvio_funcao'

export interface ParamsSimuladorAcao {
  salarioBruto: number
  mesesServico: number
  verbas: VerbaAcao[]
  // Parametros especificos por verba
  horasExtrasMensais?: number
  intervaloSuprimidoMinutos?: number
  horasNoturnas?: number
  grauInsalubridade?: GrauInsalubridade
  mesesFGTSNaoDepositado?: number
  periodosFeriasNaoGozadas?: number
  mesesDecimoNaoPago?: number
  gravidadeDano?: GravidadeDanoMoral
  salarioFuncaoReal?: number
}

export interface ResultadoSimuladorAcao {
  verbas: { label: string; valor: number; reflexos: number }[]
  totalVerbas: number
  totalReflexos: number
  estimativaBaixa: number  // -20%
  estimativaMedia: number
  estimativaAlta: number   // +20%
}

export function calcularSimuladorAcao(params: ParamsSimuladorAcao): ResultadoSimuladorAcao {
  const { salarioBruto, mesesServico, verbas: verbasSelected } = params
  const valorHora = salarioBruto / 220
  const verbas: ResultadoSimuladorAcao['verbas'] = []

  for (const verba of verbasSelected) {
    let valor = 0
    const label = LABELS_VERBAS[verba]

    switch (verba) {
      case 'horas_extras':
        valor = (params.horasExtrasMensais ?? 0) * valorHora * 1.5 * mesesServico
        break
      case 'intervalo_suprimido':
        valor = ((params.intervaloSuprimidoMinutos ?? 0) / 60) * valorHora * 1.5 * mesesServico
        break
      case 'adicional_noturno':
        valor = (params.horasNoturnas ?? 0) * valorHora * ADICIONAL_NOTURNO_PERCENTUAL * mesesServico
        break
      case 'insalubridade':
        valor = SALARIO_MINIMO_2026 * INSALUBRIDADE_PERCENTUAIS[params.grauInsalubridade ?? 'minimo'] * mesesServico
        break
      case 'periculosidade':
        valor = salarioBruto * PERICULOSIDADE_PERCENTUAL * mesesServico
        break
      case 'fgts_nao_depositado': {
        const mesesFGTS = params.mesesFGTSNaoDepositado ?? mesesServico
        valor = salarioBruto * FGTS_PERCENTUAL * mesesFGTS * (1 + FGTS_MULTA_PERCENTUAL)
        break
      }
      case 'ferias_nao_gozadas':
        valor = (salarioBruto + salarioBruto / 3) * 2 * (params.periodosFeriasNaoGozadas ?? 1)
        break
      case 'decimo_terceiro':
        valor = salarioBruto * (params.mesesDecimoNaoPago ?? 1)
        break
      case 'dano_moral':
        valor = salarioBruto * MULTIPLICADORES_DANO_MORAL[params.gravidadeDano ?? 'medio']
        break
      case 'desvio_funcao':
        valor = ((params.salarioFuncaoReal ?? salarioBruto) - salarioBruto) * mesesServico
        break
    }

    // Reflexos: DSR (1/6), ferias+1/3, 13o, FGTS+40%
    const dsr = valor / 6
    const reflexoFerias = (valor + dsr) / 12 * (4 / 3)
    const reflexo13 = (valor + dsr) / 12
    const reflexoFGTS = (valor + dsr) * FGTS_PERCENTUAL * (1 + FGTS_MULTA_PERCENTUAL)
    const totalReflexos = verba === 'dano_moral' || verba === 'ferias_nao_gozadas'
      ? 0
      : dsr + reflexoFerias + reflexo13 + reflexoFGTS

    verbas.push({ label, valor, reflexos: totalReflexos })
  }

  const totalVerbas = verbas.reduce((acc, v) => acc + v.valor, 0)
  const totalReflexos = verbas.reduce((acc, v) => acc + v.reflexos, 0)
  const estimativaMedia = totalVerbas + totalReflexos

  return {
    verbas,
    totalVerbas,
    totalReflexos,
    estimativaBaixa: estimativaMedia * 0.8,
    estimativaMedia,
    estimativaAlta: estimativaMedia * 1.2,
  }
}

const LABELS_VERBAS: Record<VerbaAcao, string> = {
  horas_extras: 'Horas Extras Nao Pagas',
  intervalo_suprimido: 'Intervalo Intrajornada Suprimido',
  adicional_noturno: 'Adicional Noturno Nao Pago',
  insalubridade: 'Adicional de Insalubridade',
  periculosidade: 'Adicional de Periculosidade',
  fgts_nao_depositado: 'FGTS Nao Depositado + Multa 40%',
  ferias_nao_gozadas: 'Ferias Nao Gozadas (dobradas)',
  decimo_terceiro: '13o Salario Nao Pago',
  dano_moral: 'Dano Moral',
  desvio_funcao: 'Diferenca Salarial (Desvio de Funcao)',
}

// ─── Exportacoes de tipos auxiliares ────────────────────────────────────────

export type { GrauInsalubridade, GravidadeDanoMoral }
```

- [ ] **Step 2: Escrever testes para funcoes de calculo**

```typescript
// src/app/portal/feature/servicos/__tests__/unit/trabalhista.test.ts
import {
  calcularINSS,
  calcularIRRF,
  calcularSalarioLiquido,
  calcularHorasExtras,
  calcularFerias,
  calcularDecimoTerceiro,
  calcularSeguroDesemprego,
  calcularRescisao,
  calcularAdicionalNoturno,
  calcularInsalubridadePericulosidade,
  calcularFGTSAcumulado,
  calcularSimuladorAcao,
} from '../../domain/trabalhista'

describe('calcularINSS', () => {
  test('salario minimo: 1a faixa apenas', () => {
    const r = calcularINSS(1621)
    expect(r.total).toBeCloseTo(121.575, 2) // 1621 * 7.5%
  })

  test('salario acima do teto: contribuicao limitada', () => {
    const r = calcularINSS(10_000)
    const rTeto = calcularINSS(8_475.55)
    expect(r.total).toBeCloseTo(rTeto.total, 2)
  })

  test('salario zero retorna zero', () => {
    const r = calcularINSS(0)
    expect(r.total).toBe(0)
  })

  test('calculo progressivo com 2 faixas', () => {
    // Salario de R$ 2.000 cai nas 2 primeiras faixas
    const r = calcularINSS(2000)
    const faixa1 = 1621 * 0.075         // 121.575
    const faixa2 = (2000 - 1621) * 0.09 // 34.11
    expect(r.total).toBeCloseTo(faixa1 + faixa2, 2)
  })
})

describe('calcularIRRF', () => {
  test('salario isento (abaixo da 1a faixa)', () => {
    const r = calcularIRRF(2000, 150, 0)
    expect(r.isento).toBe(true)
    expect(r.imposto).toBe(0)
  })

  test('salario com dependentes reduz base de calculo', () => {
    const semDep = calcularIRRF(5000, 400, 0)
    const comDep = calcularIRRF(5000, 400, 2)
    expect(comDep.imposto).toBeLessThan(semDep.imposto)
  })
})

describe('calcularSalarioLiquido', () => {
  test('salario simples sem adicionais', () => {
    const r = calcularSalarioLiquido({
      salarioBruto: 3000,
      dependentes: 0,
      valeTransporte: false,
    })
    expect(r.totalProventos).toBe(3000)
    expect(r.salarioLiquido).toBeLessThan(3000)
    expect(r.inss.total).toBeGreaterThan(0)
  })

  test('vale transporte desconta 6%', () => {
    const r = calcularSalarioLiquido({
      salarioBruto: 3000,
      dependentes: 0,
      valeTransporte: true,
    })
    expect(r.valeTransporte).toBeCloseTo(180, 2) // 3000 * 0.06
  })
})

describe('calcularHorasExtras', () => {
  test('horas extras 50% com DSR', () => {
    const r = calcularHorasExtras({
      salarioBruto: 2200,
      horasMensais: 220,
      horasExtrasSemana: 20,
      horasExtrasFimDeSemana: 0,
      periodoMeses: 1,
    })
    expect(r.valorHoraNormal).toBeCloseTo(10, 2)
    expect(r.valorHoraExtra50).toBeCloseTo(15, 2)
    expect(r.totalHorasExtras50).toBeCloseTo(300, 2) // 20h * R$15
    expect(r.dsr).toBeCloseTo(50, 2) // 300/6
  })
})

describe('calcularDecimoTerceiro', () => {
  test('ano completo sem adicionais', () => {
    const r = calcularDecimoTerceiro({
      salarioBruto: 3000,
      mesesTrabalhados: 12,
      dependentes: 0,
      mediaAdicionais: 0,
    })
    expect(r.proporcional).toBeCloseTo(3000, 2)
    expect(r.primeiraParcela).toBeCloseTo(1500, 2)
  })

  test('proporcional 6 meses', () => {
    const r = calcularDecimoTerceiro({
      salarioBruto: 3000,
      mesesTrabalhados: 6,
      dependentes: 0,
      mediaAdicionais: 0,
    })
    expect(r.proporcional).toBeCloseTo(1500, 2)
  })
})

describe('calcularSeguroDesemprego', () => {
  test('1a solicitacao com menos de 12 meses = inelegivel', () => {
    const r = calcularSeguroDesemprego({
      ultimosSalarios: [2000, 2000, 2000],
      mesesTrabalhados36: 10,
      vezesSolicitado: 1,
    })
    expect(r.elegivel).toBe(false)
  })

  test('1a faixa: media * 0.8', () => {
    const r = calcularSeguroDesemprego({
      ultimosSalarios: [2000, 2000, 2000],
      mesesTrabalhados36: 24,
      vezesSolicitado: 1,
    })
    expect(r.elegivel).toBe(true)
    expect(r.valorParcela).toBeCloseTo(1600, 2)
    expect(r.quantidadeParcelas).toBe(5)
  })
})

describe('calcularRescisao', () => {
  test('demissao sem justa causa basica', () => {
    const r = calcularRescisao({
      salarioBruto: 3000,
      dataAdmissao: new Date('2024-01-15'),
      dataRescisao: new Date('2026-04-04'),
      tipoRescisao: 'sem_justa_causa',
      avisoPrevio: 'indenizado',
      saldoFGTS: 5000,
      dependentes: 0,
      mediaHorasExtras: 0,
      feriasVencidas: true,
    })
    expect(r.saldoSalario).toBeGreaterThan(0)
    expect(r.avisoPrevioIndenizado).toBeGreaterThan(0)
    expect(r.multaFGTS).toBeCloseTo(2000, 2) // 5000 * 40%
    expect(r.totalLiquido).toBeGreaterThan(0)
  })

  test('justa causa: sem 13o, sem ferias proporcionais, sem multa FGTS', () => {
    const r = calcularRescisao({
      salarioBruto: 3000,
      dataAdmissao: new Date('2024-01-15'),
      dataRescisao: new Date('2026-04-04'),
      tipoRescisao: 'justa_causa',
      avisoPrevio: 'dispensado',
      saldoFGTS: 5000,
      dependentes: 0,
      mediaHorasExtras: 0,
      feriasVencidas: false,
    })
    expect(r.decimoTerceiroProporcional).toBe(0)
    expect(r.feriasProporcionais).toBe(0)
    expect(r.multaFGTS).toBe(0)
  })
})

describe('calcularAdicionalNoturno', () => {
  test('urbano com hora reduzida', () => {
    const r = calcularAdicionalNoturno({
      salarioBruto: 2200,
      horasNoturnas: 7,
      tipo: 'urbano',
    })
    expect(r.valorHoraNormal).toBeCloseTo(10, 2)
    expect(r.horasFictas).toBeGreaterThan(7) // hora ficta > hora real
    expect(r.periodoNoturno).toBe('22h as 5h')
  })
})

describe('calcularInsalubridadePericulosidade', () => {
  test('insalubridade grau maximo = 40% do salario minimo', () => {
    const r = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      tipo: 'insalubridade',
      grauInsalubridade: 'maximo',
    })
    expect(r.baseCalculo).toBe(1621)
    expect(r.valorAdicional).toBeCloseTo(648.40, 2)
  })

  test('periculosidade = 30% do salario', () => {
    const r = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      tipo: 'periculosidade',
    })
    expect(r.valorAdicional).toBeCloseTo(1500, 2)
  })
})

describe('calcularFGTSAcumulado', () => {
  test('deposito mensal = 8% do salario', () => {
    const r = calcularFGTSAcumulado({ salarioBruto: 3000, mesesTrabalhados: 1 })
    expect(r.depositoMensal).toBeCloseTo(240, 2)
  })

  test('saldo estimado cresce com o tempo', () => {
    const r12 = calcularFGTSAcumulado({ salarioBruto: 3000, mesesTrabalhados: 12 })
    const r24 = calcularFGTSAcumulado({ salarioBruto: 3000, mesesTrabalhados: 24 })
    expect(r24.saldoEstimado).toBeGreaterThan(r12.saldoEstimado)
  })
})

describe('calcularSimuladorAcao', () => {
  test('horas extras com reflexos', () => {
    const r = calcularSimuladorAcao({
      salarioBruto: 2200,
      mesesServico: 12,
      verbas: ['horas_extras'],
      horasExtrasMensais: 20,
    })
    expect(r.verbas).toHaveLength(1)
    expect(r.verbas[0].valor).toBeGreaterThan(0)
    expect(r.verbas[0].reflexos).toBeGreaterThan(0)
    expect(r.estimativaMedia).toBeGreaterThan(r.estimativaBaixa)
    expect(r.estimativaAlta).toBeGreaterThan(r.estimativaMedia)
  })

  test('dano moral sem reflexos', () => {
    const r = calcularSimuladorAcao({
      salarioBruto: 3000,
      mesesServico: 12,
      verbas: ['dano_moral'],
      gravidadeDano: 'grave',
    })
    expect(r.verbas[0].valor).toBeCloseTo(60000, 2) // 3000 * 20
    expect(r.verbas[0].reflexos).toBe(0)
  })
})
```

- [ ] **Step 3: Rodar testes e verificar que passam**

Run: `npx jest src/app/portal/feature/servicos/__tests__/unit/trabalhista.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/feature/servicos/domain/trabalhista.ts src/app/portal/feature/servicos/__tests__/unit/trabalhista.test.ts
git commit -m "feat(servicos): add shared labor law calculation engine with progressive INSS/IRRF"
```

---

### Task 3: Componentes UI Compartilhados

**Files:**
- Create: `src/app/portal/feature/servicos/components/calculator-shell.tsx`
- Create: `src/app/portal/feature/servicos/components/result-row.tsx`
- Create: `src/app/portal/feature/servicos/components/number-input.tsx`
- Create: `src/app/portal/feature/servicos/components/currency-input.tsx`
- Create: `src/app/portal/feature/servicos/components/range-input.tsx`
- Create: `src/app/portal/feature/servicos/components/toggle-option.tsx`
- Create: `src/app/portal/feature/servicos/components/select-option.tsx`
- Create: `src/app/portal/feature/servicos/components/action-buttons.tsx`
- Create: `src/app/portal/feature/servicos/components/verified-badge.tsx`
- Create: `src/app/portal/feature/servicos/components/disclaimer.tsx`
- Create: `src/app/portal/feature/servicos/components/cta-zattar.tsx`
- Create: `src/app/portal/feature/servicos/components/service-card.tsx`
- Create: `src/app/portal/feature/servicos/components/service-index-header.tsx`

- [ ] **Step 1: Criar componentes extraidos do padrao existente**

Cada componente deve seguir exatamente o styling dos calculadoras existentes (`ferias/page.tsx`, `horas-extras/page.tsx`, `13-salario/page.tsx`). Os patterns de referencia sao:

- **CalculatorShell**: Grid 12-col (`lg:col-span-7` input, `lg:col-span-5` results sticky)
- **ResultRow**: `flex justify-between py-3 border-b border-border` com `font-mono font-bold tabular-nums`
- **NumberInput**: `bg-muted border-none rounded-lg p-4 font-mono text-lg` com focus ring `ring-primary/40`
- **VerifiedBadge**: `bg-primary/10 rounded-lg p-4` com ShieldCheck icon
- **ActionButtons**: Download PDF + Compartilhar com `rounded-xl uppercase tracking-widest`

Cada componente e um arquivo individual. Padroes de cores seguem os tokens do tema: `text-primary`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`. Glow decorativo: `bg-primary/5 blur-[60px]` no input panel e `bg-primary/10 blur-[70px]` no results panel.

Criar cada componente como "use client" com tipagem TypeScript completa. Nao incluir codigo completo aqui por brevidade — extrair diretamente dos patterns lidos nos calculadoras existentes.

- [ ] **Step 2: Criar CalculatorShell como wrapper principal**

O `CalculatorShell` recebe `inputPanel` e `resultPanel` como children slots e aplica o grid layout padrao. Tambem inclui props para `title` e `description` opcionais.

```typescript
// src/app/portal/feature/servicos/components/calculator-shell.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"

interface CalculatorShellProps {
  inputPanel: React.ReactNode
  resultPanel: React.ReactNode
  inputCols?: number // default 7
  resultCols?: number // default 5
}

export function CalculatorShell({
  inputPanel,
  resultPanel,
  inputCols = 7,
  resultCols = 5,
}: CalculatorShellProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className={`lg:col-span-${inputCols}`}>
        <Card>
          <CardContent className="p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-6">
              {inputPanel}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className={`lg:col-span-${resultCols} lg:sticky lg:top-28 space-y-4`}>
        {resultPanel}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Criar ResultRow, NumberInput, CurrencyInput, RangeInput, ToggleOption, SelectOption**

Extrair cada sub-componente dos calculadoras existentes. Cada um em seu proprio arquivo para maximo reuso.

- [ ] **Step 4: Criar ActionButtons, VerifiedBadge, Disclaimer, CtaZattar**

```typescript
// action-buttons.tsx — Botoes de acao padrao
// verified-badge.tsx — Badge CLT com ShieldCheck
// disclaimer.tsx — Texto de disclaimer juridico configuravel
// cta-zattar.tsx — CTA "Fale com a Zattar" com estilo highlight
```

- [ ] **Step 5: Criar ServiceCard e ServiceIndexHeader para paginas index**

O `ServiceCard` segue o pattern do calculadoras index existente (`bg-[#191919]/60 backdrop-blur-xl border-white/5`). O `ServiceIndexHeader` segue o header com `font-headline text-4xl md:text-6xl font-black`.

- [ ] **Step 6: Commit**

```bash
git add src/app/portal/feature/servicos/components/
git commit -m "feat(servicos): add shared UI components for labor law services"
```

---

### Task 4: Utilitarios e Geracao de PDF

**Files:**
- Create: `src/app/portal/feature/servicos/utils/formatters.ts`
- Create: `src/app/portal/feature/servicos/pdf/generate-pdf.ts`

- [ ] **Step 1: Criar formatters compartilhados**

```typescript
// src/app/portal/feature/servicos/utils/formatters.ts

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export const formatBRLPrecise = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 2, maximumFractionDigits: 4,
  }).format(value)

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent", minimumFractionDigits: 2,
  }).format(value)

export const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR")

export const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value)
```

- [ ] **Step 2: Criar gerador de PDF com pdf-lib**

```typescript
// src/app/portal/feature/servicos/pdf/generate-pdf.ts

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface PDFSection {
  label: string
  value: string
  type?: 'header' | 'row' | 'total' | 'deduction'
}

export interface GeneratePDFParams {
  title: string
  subtitle?: string
  sections: PDFSection[]
  disclaimer: string
  date: Date
}

export async function generateServicePDF(params: GeneratePDFParams): Promise<Uint8Array> {
  const { title, subtitle, sections, disclaimer, date } = params

  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const contentWidth = width - margin * 2

  // Header
  page.drawText('ZATTAR ADVOGADOS', {
    x: margin, y, size: 10, font: fontBold, color: rgb(0.5, 0.3, 0.8),
  })
  y -= 30

  page.drawText(title, {
    x: margin, y, size: 18, font: fontBold, color: rgb(0.06, 0.09, 0.16),
  })
  y -= 20

  if (subtitle) {
    page.drawText(subtitle, {
      x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4),
    })
    y -= 15
  }

  page.drawText(`Data: ${date.toLocaleDateString('pt-BR')}`, {
    x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5),
  })
  y -= 25

  // Linha separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1, color: rgb(0.9, 0.9, 0.9),
  })
  y -= 20

  // Sections
  for (const section of sections) {
    if (y < 80) {
      // Nova pagina se necessario
      const newPage = doc.addPage([595.28, 841.89])
      y = height - 50
    }

    const isTotal = section.type === 'total'
    const isDeduction = section.type === 'deduction'
    const isHeader = section.type === 'header'

    if (isHeader) {
      y -= 10
      page.drawText(section.label, {
        x: margin, y, size: 11, font: fontBold, color: rgb(0.5, 0.3, 0.8),
      })
      y -= 18
      continue
    }

    const selectedFont = isTotal ? fontBold : font
    const selectedColor = isDeduction ? rgb(0.8, 0.2, 0.2) : isTotal ? rgb(0.06, 0.09, 0.16) : rgb(0.3, 0.3, 0.3)
    const selectedSize = isTotal ? 12 : 10

    page.drawText(section.label, {
      x: margin, y, size: selectedSize, font: selectedFont, color: selectedColor,
    })
    page.drawText(section.value, {
      x: width - margin - fontBold.widthOfTextAtSize(section.value, selectedSize),
      y, size: selectedSize, font: selectedFont, color: selectedColor,
    })
    y -= 18
  }

  // Disclaimer
  y -= 20
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
  })
  y -= 15

  const disclaimerLines = splitTextToLines(disclaimer, font, 8, contentWidth)
  for (const line of disclaimerLines) {
    page.drawText(line, {
      x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    })
    y -= 12
  }

  return doc.save()
}

function splitTextToLines(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/feature/servicos/utils/ src/app/portal/feature/servicos/pdf/
git commit -m "feat(servicos): add formatters and PDF generation utility"
```

---

### Task 5: Barrel Exports e Index

**Files:**
- Create: `src/app/portal/feature/servicos/index.ts`

- [ ] **Step 1: Criar barrel exports**

```typescript
// src/app/portal/feature/servicos/index.ts

// Constants
export * from './constants/tabelas-2026'

// Domain (calculation engine)
export * from './domain/trabalhista'

// Components
export { CalculatorShell } from './components/calculator-shell'
export { ResultRow } from './components/result-row'
export { NumberInput } from './components/number-input'
export { CurrencyInput } from './components/currency-input'
export { RangeInput } from './components/range-input'
export { ToggleOption } from './components/toggle-option'
export { SelectOption } from './components/select-option'
export { ActionButtons } from './components/action-buttons'
export { VerifiedBadge } from './components/verified-badge'
export { Disclaimer } from './components/disclaimer'
export { CtaZattar } from './components/cta-zattar'
export { ServiceCard } from './components/service-card'
export { ServiceIndexHeader } from './components/service-index-header'

// Utils
export * from './utils/formatters'

// PDF
export { generateServicePDF } from './pdf/generate-pdf'
export type { PDFSection, GeneratePDFParams } from './pdf/generate-pdf'
```

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/feature/servicos/index.ts
git commit -m "feat(servicos): add barrel exports for shared services module"
```

---

## Fase 1: Calculadoras Trabalhistas (10)

### Task 6: Calculadora de Rescisao (Servico 01)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/rescisao/page.tsx`

- [ ] **Step 1: Criar pagina da calculadora de rescisao**

Componente "use client" que importa de `@/app/portal/feature/servicos`:
- `calcularRescisao` (domain)
- `CalculatorShell`, `CurrencyInput`, `SelectOption`, `ToggleOption`, `ResultRow`, `ActionButtons`, `VerifiedBadge`, `Disclaimer` (components)
- `formatBRL` (utils)

**Input panel** contem:
- CurrencyInput: Salario Bruto
- SelectOption: Tipo de Rescisao (6 opcoes: sem_justa_causa, pedido_demissao, justa_causa, consensual, indireta, termino_contrato)
- SelectOption: Aviso Previo (trabalhado, indenizado, dispensado)
- DateInput: Data de Admissao
- DateInput: Data de Rescisao
- CurrencyInput: Saldo FGTS
- NumberInput: Dependentes IR
- CurrencyInput: Media Horas Extras
- ToggleOption: Ferias Vencidas

**Result panel** contem:
- ResultRow para cada verba (dinamico a partir de `resultado.verbas`)
- Separador visual entre proventos e descontos
- Total Bruto e Total Liquido highlight
- ActionButtons
- Disclaimer

Seguir exatamente o layout visual das calculadoras existentes (Card com glow decorativo, sticky results, font-headline para totais).

- [ ] **Step 2: Testar manualmente no browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/portal/servicos/calculadoras/rescisao`
Test: Preencher dados e verificar resultado

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/rescisao/page.tsx
git commit -m "feat(servicos): add severance calculator (servico 01)"
```

---

### Task 7: Calculadora de Salario Liquido (Servico 02)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/salario-liquido/page.tsx`

- [ ] **Step 1: Criar pagina da calculadora**

Importa `calcularSalarioLiquido` do domain. Input panel com: Salario Bruto, Dependentes, Toggle Vale Transporte, Select Adicional (nenhum/insalubridade/periculosidade/noturno), campos condicionais por adicional selecionado. Result panel mostra breakdown completo INSS progressivo (cada faixa), IRRF, VT, total descontos, salario liquido. Incluir nota sobre Lei 15.270/2025 quando aplicavel.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/salario-liquido/page.tsx
git commit -m "feat(servicos): add net salary calculator with progressive INSS/IRRF (servico 02)"
```

---

### Task 8: Migrar Calculadora de Horas Extras (Servico 03)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/horas-extras/page.tsx`
- Modify: `src/app/portal/(dashboard)/calculadoras/horas-extras/page.tsx` (redirect)

- [ ] **Step 1: Criar nova versao usando componentes compartilhados e formulas completas**

Nova versao adiciona: campos separados para HE semana (50%) e HE fim de semana (100%), campo periodo em meses, campo percentual convencao coletiva (opcional), display de reflexos (DSR, ferias, 13o, FGTS). Usa `calcularHorasExtras` do domain compartilhado.

- [ ] **Step 2: Redirecionar rota antiga**

A rota antiga `calculadoras/horas-extras` faz redirect para `servicos/calculadoras/horas-extras` via `redirect()` do Next.js.

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/horas-extras/page.tsx src/app/portal/(dashboard)/calculadoras/horas-extras/page.tsx
git commit -m "feat(servicos): migrate overtime calculator with reflexes (servico 03)"
```

---

### Task 9: Migrar Calculadora de Ferias (Servico 04)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/ferias/page.tsx`
- Modify: `src/app/portal/(dashboard)/calculadoras/ferias/page.tsx` (redirect)

- [ ] **Step 1: Nova versao com INSS/IRRF progressivos**

Adiciona: campo faltas injustificadas (reducao Art. 130 CLT), campo media adicionais, campo dependentes IR, INSS/IRRF progressivos reais (nao simplificados), display do numero de dias de direito apos reducao por faltas.

- [ ] **Step 2: Redirect rota antiga**

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/ferias/page.tsx src/app/portal/(dashboard)/calculadoras/ferias/page.tsx
git commit -m "feat(servicos): migrate vacation calculator with progressive taxes (servico 04)"
```

---

### Task 10: Migrar Calculadora 13o Salario (Servico 05)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/13-salario/page.tsx`
- Modify: `src/app/portal/(dashboard)/calculadoras/13-salario/page.tsx` (redirect)

- [ ] **Step 1: Nova versao com progressivo e media adicionais**

Adiciona: campo dependentes, campo media adicionais habituais, INSS/IRRF progressivos reais.

- [ ] **Step 2: Redirect + Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/13-salario/page.tsx src/app/portal/(dashboard)/calculadoras/13-salario/page.tsx
git commit -m "feat(servicos): migrate 13th salary calculator with progressive taxes (servico 05)"
```

---

### Task 11: Calculadora Seguro-Desemprego (Servico 06)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/seguro-desemprego/page.tsx`

- [ ] **Step 1: Criar pagina**

3 inputs de salario (ultimos 3 meses), slider meses trabalhados (6-36), select vezes solicitado (1a/2a/3a+). Result mostra: elegibilidade (verde/vermelho), media salarial, valor parcela, quantidade parcelas, total estimado. Se inelegivel, mostra motivo + CTA Zattar.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/seguro-desemprego/page.tsx
git commit -m "feat(servicos): add unemployment insurance calculator (servico 06)"
```

---

### Task 12: Calculadora Adicional Noturno (Servico 07)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/adicional-noturno/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Salario Bruto, Horas Noturnas, Select Tipo (urbano/rural pecuaria/rural lavoura). Results: valor hora normal, valor hora noturna, horas fictas, total adicional, periodo noturno aplicavel, formula aplicada card.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/adicional-noturno/page.tsx
git commit -m "feat(servicos): add night shift allowance calculator (servico 07)"
```

---

### Task 13: Calculadora Insalubridade/Periculosidade (Servico 08)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/insalubridade-periculosidade/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Salario Bruto, Select Tipo (insalubridade/periculosidade), Select Grau (condicional: minimo/medio/maximo). Results: base de calculo, percentual, valor adicional. Nota sobre nao-cumulacao (trabalhador escolhe um ou outro).

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/insalubridade-periculosidade/page.tsx
git commit -m "feat(servicos): add hazard/insalubrity premium calculator (servico 08)"
```

---

### Task 14: Calculadora FGTS Acumulado (Servico 09)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/fgts-acumulado/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Salario Bruto, Slider Meses Trabalhados (1-360). Results: deposito mensal, deposito 13o, deposito ferias, total depositos, rendimento estimado (3% a.a.), saldo estimado total. Disclaimer sobre valor estimado.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/fgts-acumulado/page.tsx
git commit -m "feat(servicos): add accumulated FGTS calculator (servico 09)"
```

---

### Task 15: Calculadora Correcao Monetaria (Servico 10)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/correcao-monetaria/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Valor Original (R$), Data de Vencimento, Data de Calculo, Toggle "Possui acao judicial?" (para dividir em pre-judicial IPCA-E e judicial Selic). Results: valor original, indice aplicado, valor corrigido, juros, total corrigido. Nota: usa taxa Selic simplificada fixa (12.25% a.a. como proxy). Disclaimer claro que valores reais dependem dos indices oficiais BCB.

**Nota para futuro:** Integracao com API BCB para indices reais sera uma melhoria posterior. Para MVP, usar taxas fixas como proxy com disclaimer.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/correcao-monetaria/page.tsx
git commit -m "feat(servicos): add monetary correction calculator with simplified rates (servico 10)"
```

---

### Task 15b: Index de Calculadoras + Redirect da rota antiga

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/calculadoras/page.tsx`
- Modify: `src/app/portal/(dashboard)/calculadoras/page.tsx` (redirect para servicos/calculadoras)

- [ ] **Step 1: Criar index com grid de 10 calculadoras**

Segue o pattern do index existente: `ServiceIndexHeader` + grid de `ServiceCard` com icones Lucide. Cards organizados em 3 categorias visuais (separadores): Calculos Basicos (01-05), Adicionais e FGTS (06-09), Correcao Monetaria (10).

- [ ] **Step 2: Redirect da pagina antiga**

```typescript
// src/app/portal/(dashboard)/calculadoras/page.tsx
import { redirect } from 'next/navigation'
export default function CalculadorasRedirect() {
  redirect('/portal/servicos/calculadoras')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/calculadoras/page.tsx src/app/portal/(dashboard)/calculadoras/page.tsx
git commit -m "feat(servicos): add calculators index page and redirect legacy route"
```

---

## Fase 2: Geradores de Documentos (5)

### Task 16: Gerador Carta de Demissao (Servico 11)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/carta-demissao/page.tsx`

- [ ] **Step 1: Criar pagina do gerador**

Layout similar ao CalculatorShell mas com preview de documento no painel direito em vez de resultados numericos. Input panel com: Nome Completo, CPF, Empresa, CNPJ, Cargo, Toggle Cumprimento Aviso Previo (sim/nao), Data Ultimo Dia (condicional), Motivo (textarea opcional), Cidade. O result panel mostra preview estilizado do documento em tempo real (texto formatado com dados preenchidos) + botoes Download PDF e Compartilhar.

O PDF e gerado client-side com `pdf-lib` usando o template formal: cabecalho com dados, corpo com texto formal, espaco para assinaturas, protocolo para contra-assinatura do empregador.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/carta-demissao/page.tsx
git commit -m "feat(servicos): add resignation letter generator (servico 11)"
```

---

### Task 17: Gerador Notificacao Extrajudicial (Servico 12)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/notificacao-extrajudicial/page.tsx`

- [ ] **Step 1: Criar pagina**

Input panel: Dados do Notificante (nome, CPF, endereco), Dados do Notificado (empresa, CNPJ, endereco), Multi-select Irregularidades (8 tipos: atraso salarial, FGTS nao depositado, horas extras nao pagas, ferias nao concedidas, descumprimento convencao, assedio, insalubridade sem adicional, desvio de funcao), Textarea Descricao dos Fatos, CurrencyInput Valor Estimado, NumberInput Prazo para Regularizacao (default 10 dias).

Result panel: Preview do documento com compilacao condicional de fundamentos juridicos baseado nas irregularidades selecionadas. PDF formal com formatacao judicial (Times New Roman simulado, margens 3cm/2cm).

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/notificacao-extrajudicial/page.tsx
git commit -m "feat(servicos): add labor extrajudicial notification generator (servico 12)"
```

---

### Task 18: Gerador Declaracao Hipossuficiencia (Servico 13)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/declaracao-hipossuficiencia/page.tsx`

- [ ] **Step 1: Criar pagina**

Input panel: Nome Completo, CPF, RG, Endereco Completo, Toggle Empregado (sim/nao), CurrencyInput Renda Mensal, NumberInput Dependentes, Cidade. Mostra regra de elegibilidade: renda <= 40% teto INSS (R$ 3.390,22).

Result panel: Preview da declaracao com fundamentacao legal (Art. 790 CLT, Art. 99 CPC), aviso sobre responsabilidade criminal por declaracao falsa.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/declaracao-hipossuficiencia/page.tsx
git commit -m "feat(servicos): add economic hardship declaration generator (servico 13)"
```

---

### Task 19: Gerador Acordo Extrajudicial (Servico 14)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/acordo-extrajudicial/page.tsx`

- [ ] **Step 1: Criar pagina**

**IMPORTANTE:** Mostrar aviso em destaque (Card vermelho/amarelo) ANTES do formulario: "OBRIGATORIO: cada parte deve ter advogado proprio e distinto. Este acordo necessita de homologacao judicial."

Input panel: Dados Empregado (nome, CPF, profissao, CTPS, endereco, advogado OAB), Dados Empregador (empresa, CNPJ, endereco, advogado OAB), Datas Admissao/Demissao, Select Quitacao (geral/parcial), Loop de Verbas (adicionar/remover verbas com descricao + valor), Select Pagamento (a vista/parcelado), Campos condicionais para parcelas, Percentual Multa (default 50%).

Result panel: Preview formatada como peticao judicial com todos os artigos (855-B CLT), clausulas de quitacao, penalidade, FGTS. CTA forte para contatar Zattar.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/acordo-extrajudicial/page.tsx
git commit -m "feat(servicos): add extrajudicial agreement generator with dual-attorney warning (servico 14)"
```

---

### Task 20: Gerador de Holerite (Servico 15)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/holerite/page.tsx`

- [ ] **Step 1: Criar pagina**

Input panel: Dados Empresa (nome, CNPJ, endereco), Dados Empregado (nome, CPF, cargo, admissao, departamento), Salario Base, Campos de adicionais (HE 50%, HE 100%, adicional noturno, periculosidade, insalubridade, outros), Mes Referencia.

Result panel: Preview em formato tabular (P&B) simulando um holerite real com colunas Proventos/Descontos/Liquido. Usa `calcularSalarioLiquido` para INSS/IRRF automaticos. Footer com base FGTS, base INSS, base IRRF. PDF otimizado para impressao (preto e branco).

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/holerite/page.tsx
git commit -m "feat(servicos): add payslip generator using shared salary calculation (servico 15)"
```

---

### Task 20b: Index de Geradores

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/geradores/page.tsx`

- [ ] **Step 1: Criar index com grid de 5 geradores**

ServiceIndexHeader com titulo "Geradores de Documentos" + grid de ServiceCards.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/geradores/page.tsx
git commit -m "feat(servicos): add document generators index page"
```

---

## Fase 3: Diagnosticos (5)

### Task 21: Diagnostico Direitos na Demissao (Servico 16)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/direitos-demissao/page.tsx`

- [ ] **Step 1: Criar pagina com wizard de 6 passos**

Interface tipo wizard/stepper (nao form unico): cada passo mostra uma pergunta e o usuario responde. Passos: (1) Tipo de rescisao, (2) Tempo trabalhado, (3) Aviso previo cumprido?, (4) Recebeu todas as verbas?, (5) Tem ferias vencidas?, (6) Verificou FGTS?

Apos responder, gera relatorio personalizado com checklist de direitos (check verde ou X vermelho), estimativa de valores usando `calcularRescisao`, prazos prescricionais (2 anos para ajuizar, 5 anos retroativos), matriz comparativa dos 6 tipos de rescisao, CTA Zattar se detectar irregularidades.

UI: Steps indicator no topo, transicoes animadas entre passos, resultado final em cards com cores (verde=ok, vermelho=violacao).

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/direitos-demissao/page.tsx
git commit -m "feat(servicos): add termination rights diagnostic wizard (servico 16)"
```

---

### Task 22: Verificador de Prazos (Servico 17)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/verificador-prazos/page.tsx`

- [ ] **Step 1: Criar pagina com fluxo simples de 2 passos**

Passo 1: "Voce esta empregado atualmente?" (Sim/Nao). Se Sim: mostra mensagem de que prazos sao contados a partir do termino. Se Nao: Passo 2: "Quando foi desligado?" (DateInput).

Resultado mostra dashboard com:
- Prazo para ajuizar acao: data limite (admissao + 2 anos apos rescisao) — VERDE se dentro, VERMELHO se fora
- Periodo reclamavel: ultimos 5 anos a partir da data de ajuizamento
- Prazo FGTS: 5 anos para depositos nao feitos
- Cada prazo com countdown visual (dias restantes)

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/verificador-prazos/page.tsx
git commit -m "feat(servicos): add labor deadline verifier diagnostic (servico 17)"
```

---

### Task 23: Analise de Jornada (Servico 18)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/analise-jornada/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Jornada contratada (hrs/dia), Horario entrada, Horario saida, Duracao intervalo (minutos), Toggle trabalha sabados (+ horas), Frequencia feriados trabalhados, Salario Bruto, Meses nessa situacao.

Resultado: Calcula horas extras diarias (jornada real - contratada), verifica se intervalo < 1h (Art. 71 §4 CLT — tempo suprimido como HE 50%), calcula HE sabado (100%), estima mensal e acumulado. Usa `calcularHorasExtras` para reflexos. Mostra tabela: tipo de verba, valor mensal, valor acumulado, reflexos.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/analise-jornada/page.tsx
git commit -m "feat(servicos): add workday analysis diagnostic (servico 18)"
```

---

### Task 24: Elegibilidade Beneficios (Servico 19)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/elegibilidade-beneficios/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Situacao (empregado/desempregado/licenca), Meses formais ultimos 36 meses, Salario medio, Vezes que recebeu seguro, Data inscricao PIS, Select modalidade FGTS (saque-rescisao, saque-aniversario, emergencial).

Resultado em 3 cards:
- **Seguro-Desemprego**: Elegivel/Inelegivel + valor + parcelas (usa `calcularSeguroDesemprego`)
- **PIS/Abono Salarial**: Elegivel se renda <= 2 salarios minimos, PIS >= 5 anos, >= 30 dias no ano-base. Valor = (meses/12) * salario minimo
- **FGTS**: Modalidade de saque + requisitos + estimativa (usa `calcularFGTSAcumulado`)

Cada card com badge ELEGIVEL (verde) ou NAO ELEGIVEL (vermelho).

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/elegibilidade-beneficios/page.tsx
git commit -m "feat(servicos): add benefits eligibility diagnostic (servico 19)"
```

---

### Task 25: Simulador de Acao Trabalhista (Servico 20)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/simulador-acao/page.tsx`

- [ ] **Step 1: Criar pagina**

Inputs: Salario Bruto, Meses de servico, Multi-select Verbas (9 tipos com checkbox), campos condicionais por verba selecionada (ex: horas extras mensais, grau dano moral, etc.).

Result panel mostra: tabela de verbas selecionadas com valor + reflexos, total verbas, total reflexos, 3 cenarios (Conservador -20%, Moderado, Otimista +20%) em cards coloridos, CTA forte "Agende consulta gratuita com a Zattar".

Usa `calcularSimuladorAcao` do domain.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/simulador-acao/page.tsx
git commit -m "feat(servicos): add labor lawsuit simulator (servico 20)"
```

---

### Task 25b: Index de Diagnosticos

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/diagnosticos/page.tsx`

- [ ] **Step 1: Criar index**

ServiceIndexHeader + grid de 5 ServiceCards para diagnosticos.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/diagnosticos/page.tsx
git commit -m "feat(servicos): add diagnostics index page"
```

---

## Fase 4: Rotas Publicas + Navegacao

### Task 26: Hub Principal de Servicos (Portal)

**Files:**
- Create: `src/app/portal/(dashboard)/servicos/page.tsx`

- [ ] **Step 1: Criar hub com 3 categorias**

Pagina que exibe as 3 categorias (Calculadoras, Geradores, Diagnosticos) em cards grandes com icone, titulo, descricao e contagem de servicos. Links para `/portal/servicos/calculadoras`, `/portal/servicos/geradores`, `/portal/servicos/diagnosticos`.

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/(dashboard)/servicos/page.tsx
git commit -m "feat(servicos): add portal services hub page"
```

---

### Task 27: Rotas Publicas

**Files:**
- Create: `src/app/servicos/layout.tsx`
- Create: `src/app/servicos/page.tsx`
- Create: `src/app/servicos/calculadoras/page.tsx`
- Create: `src/app/servicos/calculadoras/[slug]/page.tsx` (rota dinamica)
- Create: `src/app/servicos/geradores/page.tsx`
- Create: `src/app/servicos/geradores/[slug]/page.tsx`
- Create: `src/app/servicos/diagnosticos/page.tsx`
- Create: `src/app/servicos/diagnosticos/[slug]/page.tsx`

- [ ] **Step 1: Criar layout publico**

Layout simples com header (logo Zattar + CTA login portal) e footer. Sem sidebar, sem autenticacao.

- [ ] **Step 2: Criar paginas index publicas**

Reusam `ServiceIndexHeader` e `ServiceCard` com links para `/servicos/calculadoras/[slug]`, etc.

- [ ] **Step 3: Criar rotas dinamicas que importam componentes do portal**

Cada `[slug]/page.tsx` mapeia o slug para o componente correto da calculadora/gerador/diagnostico. Usa dynamic import lazy para code-splitting.

```typescript
// src/app/servicos/calculadoras/[slug]/page.tsx
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'

const CALCULADORAS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'rescisao': () => import('@/app/portal/(dashboard)/servicos/calculadoras/rescisao/page'),
  'salario-liquido': () => import('@/app/portal/(dashboard)/servicos/calculadoras/salario-liquido/page'),
  // ... todas as 10
}

export default async function CalculadoraPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const loader = CALCULADORAS[slug]
  if (!loader) notFound()

  const Component = dynamic(loader)
  return <Component />
}

export function generateStaticParams() {
  return Object.keys(CALCULADORAS).map(slug => ({ slug }))
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/servicos/
git commit -m "feat(servicos): add public service routes with dynamic imports from portal"
```

---

### Task 28: Atualizar Navegacao do Portal

**Files:**
- Modify: `src/app/portal/feature/components/layout/portal-app-sidebar.tsx`

- [ ] **Step 1: Atualizar portalNavItems**

Substituir item "Calculadoras" por "Servicos" com sub-items ou apontar para `/portal/servicos`.

```typescript
const portalNavItems = [
  { title: "Dashboard", url: "/portal/dashboard", icon: LayoutDashboard },
  { title: "Processos", url: "/portal/processos", icon: Gavel },
  { title: "Agendamentos", url: "/portal/agendamentos", icon: Calendar },
  { title: "Servicos", url: "/portal/servicos", icon: Calculator },  // ALTERADO
  { title: "Financeiro", url: "/portal/financeiro", icon: CreditCard },
  { title: "Meu Perfil", url: "/portal/perfil", icon: Settings },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/app/portal/feature/components/layout/portal-app-sidebar.tsx
git commit -m "feat(servicos): update portal sidebar navigation to point to services hub"
```

---

## Resumo de Entregas

| Fase | Tasks | Arquivos | Commits |
|------|-------|----------|---------|
| 0 - Infraestrutura | 1-5 | ~20 | 5 |
| 1 - Calculadoras | 6-15b | ~12 | 12 |
| 2 - Geradores | 16-20b | ~7 | 7 |
| 3 - Diagnosticos | 21-25b | ~7 | 7 |
| 4 - Publicas + Nav | 26-28 | ~15 | 3 |
| **Total** | **28 tasks** | **~61 arquivos** | **34 commits** |

---

## Decisoes Arquiteturais

1. **Client-side calculations**: Todas as calculadoras sao client-side (sem server actions para calculos). Isso segue o padrao existente e garante resposta instantanea.

2. **Componentes compartilhados**: Logica de calculo e UI ficam em `portal/feature/servicos/`. Ambas as rotas (portal e publica) consomem os mesmos componentes.

3. **PDF com pdf-lib**: Gera PDFs client-side sem necessidade de API. Usa `pdf-lib` que ja esta no projeto.

4. **Rotas dinamicas publicas**: Em vez de duplicar 20 page.tsx, usa `[slug]/page.tsx` com dynamic imports + `generateStaticParams` para SSG.

5. **Redirect das rotas antigas**: As 3 calculadoras existentes redirecionam para as novas URLs em vez de serem deletadas.

6. **Correcao monetaria simplificada**: Servico 10 usa taxas fixas como proxy (Selic 12.25% a.a.) com disclaimer. Integracao BCB e melhoria futura.
