# Regras de Negocio - Obrigacoes (Juridico)

Este documento define as regras de negocio do modulo de Obrigacoes, responsavel pelo controle juridico de Acordos, Condenacoes e suas Parcelas.

## 1. Definicoes

### 1.1 Tipos de Obrigacao

| Tipo | Descricao | Direcao |
|------|-----------|---------|
| `acordo` | Acordo judicial homologado | Recebimento ou Pagamento |
| `condenacao` | Decisao judicial condenatoria | Recebimento ou Pagamento |
| `custas_processuais` | Custas e despesas do processo | Sempre Pagamento |

### 1.2 Direcao do Pagamento

| Direcao | Descricao | Impacto Financeiro |
|---------|-----------|-------------------|
| `recebimento` | Escritorio recebe valores | Gera Conta a Receber |
| `pagamento` | Escritorio paga valores | Gera Conta a Pagar |

### 1.3 Status de Acordo

| Status | Descricao |
|--------|-----------|
| `pendente` | Nenhuma parcela paga |
| `pago_parcial` | Algumas parcelas pagas |
| `pago_total` | Todas as parcelas pagas |
| `atrasado` | Possui parcelas vencidas |

### 1.4 Status de Parcela

| Status | Descricao |
|--------|-----------|
| `pendente` | Aguardando pagamento/recebimento |
| `recebida` | Valor recebido (direcao=recebimento) |
| `paga` | Valor pago (direcao=pagamento) |
| `atrasada` | Vencida e nao paga/recebida |
| `cancelada` | Parcela cancelada |

### 1.5 Status de Repasse

| Status | Descricao | Proxima Acao |
|--------|-----------|--------------|
| `nao_aplicavel` | Sem valor para cliente | N/A |
| `pendente_declaracao` | Aguarda declaracao de prestacao de contas | Anexar declaracao |
| `pendente_transferencia` | Declaracao OK, aguarda transferencia | Registrar comprovante |
| `repassado` | Transferencia concluida | N/A |

## 2. Regras de Negocio

### 2.1 Criacao de Acordo

1. **Campos obrigatorios:**
   - Processo vinculado (`processo_id`)
   - Tipo (`acordo`, `condenacao`, `custas_processuais`)
   - Direcao (`recebimento`, `pagamento`)
   - Valor total
   - Data de vencimento da primeira parcela
   - Numero de parcelas (>= 1)

2. **Custas Processuais:**
   - DEVE ser `direcao = pagamento`
   - DEVE ter `numero_parcelas = 1`

3. **Recebimentos com cliente:**
   - DEVE definir `forma_distribuicao` (`integral` ou `dividido`)
   - SE `dividido`, DEVE definir `percentual_escritorio`

### 2.2 Calculo de Parcelas

1. **Valor da parcela:**
   - `valor_parcela = valor_total / numero_parcelas`
   - Ultima parcela ajusta diferenca de arredondamento

2. **Honorarios sucumbenciais:**
   - Distribuidos proporcionalmente entre parcelas
   - 100% para o escritorio

3. **Honorarios contratuais:**
   - `valor_honorarios = valor_principal * (percentual_escritorio / 100)`
   - Incidem sobre o valor principal

4. **Valor de repasse ao cliente:**
   - `valor_repasse = valor_principal - valor_honorarios`
   - Se `direcao = pagamento`, repasse nao se aplica

### 2.3 Datas de Vencimento

1. **Primeira parcela:** Data informada na criacao
2. **Parcelas subsequentes:**
   - `data_vencimento[i] = data_primeira + (i-1) * intervalo_dias`
   - Intervalo padrao: 30 dias

### 2.4 Fluxo de Recebimento

```
[Acordo Criado]
    ↓
[Parcela Pendente] → (aguarda pagamento)
    ↓
[Parcela Recebida] → (registra data e valor)
    ↓
[Pendente Declaracao] → (se tem valor cliente)
    ↓
[Anexar Declaracao] → (upload arquivo)
    ↓
[Pendente Transferencia]
    ↓
[Registrar Comprovante] → (upload arquivo)
    ↓
[Repassado] ← FIM
```

### 2.5 Regras de Repasse

1. **Quando aplicavel:**
   - `direcao = recebimento`
   - `valor_repasse_cliente > 0`

2. **Requisitos para declaracao:**
   - Parcela DEVE estar com status `recebida`
   - Status repasse DEVE ser `pendente_declaracao`

3. **Requisitos para finalizacao:**
   - Declaracao de prestacao de contas anexada
   - Status repasse DEVE ser `pendente_transferencia`

4. **Apos repasse:**
   - Status repasse muda para `repassado`
   - Data e comprovante sao registrados

### 2.6 Validacoes de Integridade

1. **Parcela recebida/paga:**
   - DEVE ter forma de pagamento definida
   - DEVE ter data de efetivacao

2. **Cancelamento:**
   - NAO permitido se parcela ja repassada
   - NAO permitido se acordo tem parcelas pagas

3. **Recalculo de distribuicao:**
   - SOMENTE permitido se nenhuma parcela paga/recebida

## 3. Integracao com Financeiro

### 3.1 Sincronizacao Automatica

O modulo de Obrigacoes (Juridico) sincroniza automaticamente com o modulo Financeiro:

```
features/obrigacoes/         features/financeiro/
--------------------         --------------------
[Acordo Criado]      →       [Lancamentos Criados]
[Parcela Recebida]   →       [Lancamento Atualizado]
[Parcela Cancelada]  →       [Lancamento Cancelado]
```

### 3.2 Triggers de Sincronizacao

| Evento no Juridico | Acao no Financeiro |
|--------------------|-------------------|
| `criarAcordoComParcelas` | Cria lancamentos para cada parcela |
| `marcarParcelaRecebida` | Atualiza lancamento para `confirmado` |
| `atualizarParcela` | Atualiza valores do lancamento |
| `deletarAcordo` | Remove lancamentos vinculados |

### 3.3 Deteccao de Inconsistencias

O sistema detecta e alerta sobre:
- Parcelas confirmadas sem lancamento financeiro
- Lancamentos sem parcela correspondente
- Valores divergentes entre parcela e lancamento

## 4. Formulas

### 4.1 Split de Pagamento (Recebimento)

```typescript
// Inputs
valorPrincipal: number;           // Valor do credito principal
honorariosSucumbenciais: number;  // Valor da sucumbencia
percentualHonorarios: number;     // % do escritorio (default: 30)

// Calculos
valorHonorariosContratuais = valorPrincipal * (percentualHonorarios / 100);
valorRepasseCliente = valorPrincipal - valorHonorariosContratuais;
valorEscritorio = valorHonorariosContratuais + honorariosSucumbenciais;
valorTotal = valorPrincipal + honorariosSucumbenciais;
```

### 4.2 Saldo Devedor

```typescript
saldoDevedor = valorTotal - SUM(parcelas.filter(p => p.status in ['recebida', 'paga']).map(p => p.valor));
```

### 4.3 Status do Acordo

```typescript
if (todasParcelas.every(p => p.status === 'cancelada')) return 'cancelado';
if (todasParcelas.every(p => ['recebida', 'paga'].includes(p.status))) return 'pago_total';
if (todasParcelas.some(p => p.status === 'atrasada')) return 'atrasado';
if (todasParcelas.some(p => ['recebida', 'paga'].includes(p.status))) return 'pago_parcial';
return 'pendente';
```

## 5. Constantes

```typescript
PERCENTUAL_ESCRITORIO_PADRAO = 30;    // 30%
INTERVALO_PARCELAS_PADRAO = 30;       // 30 dias
DIAS_ALERTA_VENCIMENTO = 7;           // Alerta 7 dias antes
```

## 6. Responsabilidades do Modulo

### 6.1 Este modulo (features/obrigacoes/) FAZ:
- Gerenciamento de Acordos e Condenacoes
- Gerenciamento de Parcelas
- Controle de Repasses ao cliente
- Validacoes juridicas
- Trigger de sincronizacao com financeiro

### 6.2 Este modulo NAO FAZ:
- Gestao de lancamentos financeiros (features/financeiro/)
- Calculo de fluxo de caixa (features/financeiro/)
- Conciliacao bancaria (features/financeiro/)
- Gestao de contas contabeis (features/financeiro/)
