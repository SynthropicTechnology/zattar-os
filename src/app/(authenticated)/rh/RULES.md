# Regras de Negocio - RH (Recursos Humanos)

## Contexto
Modulo de gestao de recursos humanos com controle de salarios e folhas de pagamento. Integra-se com o modulo financeiro para gerar lancamentos automaticos ao aprovar/pagar folhas.

## Entidades Principais
- **Salario**: Registro de salario bruto de um funcionario com vigencia
- **FolhaPagamento**: Folha de pagamento mensal
- **ItemFolhaPagamento**: Item individual da folha (um por funcionario)
- **LancamentoFinanceiro**: Lancamento gerado automaticamente ao aprovar folha

## Enums e Tipos

### Status da Folha de Pagamento
| Status | Descricao | Transicoes Permitidas |
|--------|-----------|-----------------------|
| `rascunho` | Criada, aguardando aprovacao | aprovada, cancelada |
| `aprovada` | Aprovada, lancamentos criados | paga, cancelada |
| `paga` | Paga, lancamentos confirmados | (nenhuma) |
| `cancelada` | Cancelada | (nenhuma) |

### Forma de Pagamento
- `transferencia_bancaria`
- `ted`
- `pix`
- `deposito`
- `dinheiro`

## Regras de Validacao

### Salario
- `usuarioId`: inteiro positivo obrigatorio
- `salarioBruto`: numero positivo (maior que zero)
- `dataInicioVigencia`: formato YYYY-MM-DD obrigatorio
- `cargoId`: inteiro positivo (opcional)
- Para atualizacao: pelo menos um campo deve ser fornecido

### Gerar Folha
- `mesReferencia`: 1-12
- `anoReferencia`: >= 2020
- Periodo nao pode ser mais que 1 mes no futuro
- `dataPagamento`: formato YYYY-MM-DD (opcional)

### Aprovar Folha
- `contaBancariaId`: obrigatorio, deve existir e estar ativa
- `contaContabilId`: obrigatorio, deve existir, estar ativa e aceitar lancamentos (analitica)
- `centroCustoId`: opcional, se informado deve existir e estar ativo

### Pagar Folha
- `formaPagamento`: enum valido
- `contaBancariaId`: obrigatorio, deve existir e estar ativa
- `dataEfetivacao`: formato YYYY-MM-DD (opcional, default hoje)

## Regras de Negocio

### Geracao de Folha
1. Validar periodo (nao pode ser muito futuro)
2. Verificar se ja existe folha para o periodo (unicidade mes/ano)
3. Buscar todos salarios vigentes no periodo
4. Se nenhum salario vigente: erro
5. Criar folha com status `rascunho`
6. Criar um item para cada salario vigente (valor bruto)
7. Se todos itens falharam: deletar folha (rollback)
8. Atualizar valor total da folha

### Aprovacao de Folha
1. Apenas folhas em `rascunho` podem ser aprovadas
2. Folha deve ter pelo menos 1 item
3. Validar conta contabil (ativa, analitica, aceita lancamentos)
4. Validar conta bancaria (ativa)
5. Validar centro de custo (se informado)
6. Para cada item: criar lancamento financeiro tipo `despesa`, categoria `salarios`
7. Lancamento com dados: descricao, valor, data_competencia, data_vencimento
8. Vincular lancamento ao item da folha
9. Se todos lancamentos falharam: erro (folha nao aprovada)
10. Atualizar status para `aprovada`

### Pagamento de Folha
1. Apenas folhas `aprovada` podem ser pagas
2. Todos itens devem ter lancamento vinculado
3. Para cada lancamento: atualizar status para `confirmado`, forma_pagamento, data_efetivacao
4. Atualizar status da folha para `paga`

### Cancelamento de Folha
1. Folhas `paga` NAO podem ser canceladas (usar estorno individual)
2. Folhas ja `cancelada` retornam erro
3. Se folha `aprovada`: cancelar lancamentos financeiros vinculados
4. Lancamentos ja `confirmado` impedem cancelamento
5. Atualizar status para `cancelada`

### Verificacao Pre-Cancelamento
- Verificar se tem lancamentos pagos vinculados
- Retornar flag `temLancamentosPagos` e `motivo`

## Filtros Disponiveis

### Salarios
- **Busca**: (via service)
- **Usuario**: usuarioId
- **Cargo**: cargoId
- **Status**: ativo (boolean)
- **Vigencia**: vigente (filtra salarios vigentes na data atual)
- **Ordenacao**: data_inicio_vigencia, salario_bruto, usuario, created_at
- **Paginacao**: pagina, limite

### Folhas de Pagamento
- **Periodo**: mesReferencia, anoReferencia
- **Status**: status (pode ser array)
- **Ordenacao**: periodo, valor_total, status, created_at
- **Paginacao**: pagina, limite

## Revalidacao de Cache
Apos mutacoes em salarios, revalidar:
- `/app/rh/salarios` - Lista de salarios

Apos mutacoes em folhas, revalidar:
- `/app/rh/folhas-pagamento` - Lista de folhas
- `/app/rh/folhas-pagamento/{id}` - Detalhe da folha
- `/app/financeiro` - Modulo financeiro (lancamentos gerados)
