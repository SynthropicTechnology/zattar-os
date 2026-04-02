# Fonte da Verdade - Dados de Processo

## Regra Principal

**O 1º grau é SEMPRE a fonte da verdade** para dados identificadores do processo.

## Campos que SEMPRE vêm do 1º grau

| Campo | Descrição | Por que vem do 1º grau? |
|-------|-----------|------------------------|
| `trt_origem` | Tribunal de origem | O tribunal onde o processo nasceu não muda |
| `nome_parte_autora_origem` | Quem ajuizou a ação | O autor original não muda, mesmo com recursos |
| `nome_parte_re_origem` | Contra quem foi ajuizada | O réu original não muda, mesmo com recursos |
| `data_autuacao_origem` | Data de início do processo | A data de autuação do 1º grau é imutável |
| `orgao_julgador_origem` | Vara/Órgão do 1º grau | Órgão onde o processo foi distribuído |

## Por que não usar o grau atual?

Quando há **recurso**, os polos processuais podem **inverter**:

```
1º Grau: Autor (GUSTAVO) → Réu (99 TECNOLOGIA)
         ↓ recurso
2º Grau: Recorrente (99 TECNOLOGIA) → Recorrido (GUSTAVO)
         ↓ recurso
TST:     Recorrente (99 TECNOLOGIA) → Recorrido (GUSTAVO)
```

- **Quem recorre** → vira polo ativo (nome na posição de "autor")
- **Quem foi recorrido** → vira polo passivo (nome na posição de "réu")

Isso **NÃO muda quem é autor e réu no sentido original**.

## Exemplo Real

Processo: `0010539-84.2025.5.03.0181`

| Grau | TRT | Polo Ativo | Polo Passivo |
|------|-----|------------|--------------|
| 1º Grau | TRT3 | GUSTAVO (autor) | 99 TECNOLOGIA (réu) |
| 2º Grau | TRT3 | 99 TECNOLOGIA | GUSTAVO |
| TST | TST | 99 TECNOLOGIA | GUSTAVO |

**Errado** (usando grau atual):
- TRT: TST
- Autor: 99 TECNOLOGIA

**Correto** (usando 1º grau):
- TRT Origem: TRT3
- Autor Origem: GUSTAVO
- Réu Origem: 99 TECNOLOGIA

## Exceções

### Processos sem 1º grau

Em casos raros (ex: processos de segredo de justiça que nascem no 2º grau), pode não existir registro de 1º grau no sistema.

**Fallback**: Usar o registro mais antigo disponível (menor `data_autuacao`).

## Implementação no Código

### View SQL (`acervo_unificado`)

```sql
-- CTE para buscar dados do 1º grau como fonte da verdade
dados_primeiro_grau as (
  select distinct on (numero_processo, advogado_id)
    numero_processo,
    advogado_id,
    trt as trt_origem,
    nome_parte_autora as nome_parte_autora_origem,
    nome_parte_re as nome_parte_re_origem,
    data_autuacao as data_autuacao_origem
  from public.acervo
  order by
    numero_processo,
    advogado_id,
    -- Priorizar 1º grau, depois mais antigo
    case when grau = 'primeiro_grau' then 0 else 1 end,
    data_autuacao asc
)
```

### TypeScript (`domain.ts`)

```typescript
export interface ProcessoUnificado extends Omit<Processo, "grau"> {
  // ... campos existentes ...

  // Fonte da verdade (1º grau)
  trtOrigem?: string;
  nomeParteAutoraOrigem?: string;
  nomeParteReOrigem?: string;
  dataAutuacaoOrigem?: string;
  orgaoJulgadorOrigem?: string;
  grauOrigem?: GrauProcesso;
}
```

### Frontend

```typescript
// Usar trt_origem ao invés de trt
const trt = processo.trtOrigem || processo.trt;

// Usar nomes do 1º grau
const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora;
const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe;
```

## Módulos Afetados

### 1. Processos
- **View:** `acervo_unificado`
- **Campos de origem:** `trt_origem`, `nome_parte_autora_origem`, `nome_parte_re_origem`
- **Arquivos:** `repository.ts`, `processos-table-wrapper.tsx`

### 2. Audiências
- **View:** `audiencias_com_origem`
- **Campos de origem:** `trt_origem`, `polo_ativo_origem`, `polo_passivo_origem`
- **Arquivos:** `repository.ts`, `audiencias-list-columns.tsx`

### 3. Expedientes
- **View:** `expedientes_com_origem`
- **Campos de origem:** `trt_origem`, `nome_parte_autora_origem`, `nome_parte_re_origem`
- **Arquivos:** `repository.ts`, `columns.tsx`

## Regra de Ouro

> **Se você precisa saber quem é o autor ou réu de um processo,
> SEMPRE use os campos `*_origem` que vêm do 1º grau.**

Os campos do grau atual (`nome_parte_autora`, `nome_parte_re`, `trt`) representam
o **polo processual atual**, não a identificação original das partes.
