# Regras de Negocio - RH

## Contexto
Modulo de Recursos Humanos do Sinesys responsavel pela gestao de salarios e folhas de pagamento. Integra-se com o modulo financeiro para geracao automatica de lancamentos ao aprovar folhas. Subdivide-se em dois subdominios: Salarios (vigencia e cadastro) e Folhas de Pagamento (geracao, aprovacao, pagamento e cancelamento).

## Entidades Principais
- **Salario**: Registro salarial de um funcionario com vigencia, valor bruto e vinculacao a cargo
- **SalarioComDetalhes**: Salario com dados de usuario e cargo
- **FolhaPagamento**: Folha mensal com periodo de referencia, valor total, status e data de pagamento
- **FolhaPagamentoComDetalhes**: Folha com itens detalhados e total de funcionarios
- **ItemFolhaPagamento**: Item individual da folha vinculando funcionario, salario e lancamento financeiro
- **ItemFolhaComDetalhes**: Item com dados de usuario, salario e lancamento

## Enums e Tipos
- **StatusFolhaPagamento**: `rascunho`, `aprovada`, `paga`, `cancelada`
- **FormaPagamentoFolha**: `transferencia_bancaria`, `ted`, `pix`, `deposito`, `dinheiro`

## Regras de Validacao

### Criar Salario (criarSalarioSchema)
- `usuarioId`: inteiro positivo obrigatorio
- `cargoId`: inteiro positivo opcional
- `salarioBruto`: numero positivo obrigatorio (maior que zero)
- `dataInicioVigencia`: formato YYYY-MM-DD obrigatorio
- `observacoes`: string opcional

### Atualizar Salario (atualizarSalarioSchema)
- Pelo menos um campo deve ser fornecido para atualizacao
- `salarioBruto`: numero positivo opcional
- `cargoId`: inteiro positivo ou null opcional
- `dataFimVigencia`: formato YYYY-MM-DD opcional
- `observacoes`, `ativo`: opcionais

### Gerar Folha (gerarFolhaSchema)
- `mesReferencia`: inteiro de 1 a 12
- `anoReferencia`: inteiro >= 2020
- Periodo nao pode ser mais de 1 mes no futuro
- `dataPagamento`: formato YYYY-MM-DD opcional
- `observacoes`: string opcional

### Aprovar Folha (aprovarFolhaSchema)
- `contaBancariaId`: inteiro positivo obrigatorio
- `contaContabilId`: inteiro positivo obrigatorio
- `centroCustoId`: inteiro positivo opcional

### Pagar Folha (pagarFolhaSchema)
- `formaPagamento`: enum FormaPagamentoFolha obrigatorio
- `contaBancariaId`: inteiro positivo obrigatorio
- `dataEfetivacao`: formato YYYY-MM-DD opcional

## Regras de Negocio

### Transicoes de Status da Folha
- `rascunho` -> `aprovada` ou `cancelada`
- `aprovada` -> `paga` ou `cancelada`
- `paga` -> (sem transicao permitida)
- `cancelada` -> (sem transicao permitida)

### Geracao de Folha
1. Validar periodo (nao pode ser futuro distante).
2. Verificar se ja existe folha para o periodo. Se existir, rejeitar.
3. Buscar salarios vigentes no mes/ano de referencia.
4. Se nao houver salarios vigentes, rejeitar com mensagem orientando cadastro.
5. Data de pagamento nao pode ser anterior ao mes de referencia.
6. Criar folha com status `rascunho`.
7. Criar item para cada salario vigente. Se todos falharem, deletar folha (rollback).
8. Atualizar valor total da folha apos criacao dos itens.

### Aprovacao de Folha
1. Apenas folhas em `rascunho` podem ser aprovadas.
2. Folha deve ter pelo menos um item.
3. Conta contabil deve existir, estar ativa e aceitar lancamentos (analitica, nao sintetica).
4. Conta bancaria deve existir e estar ativa.
5. Centro de custo (se informado) deve existir e estar ativo.
6. Para cada item, cria lancamento financeiro do tipo `despesa` com categoria `salarios`, status `pendente` e origem `folha_pagamento`.
7. Se todos os lancamentos falharem, rejeitar. Erros parciais sao tolerados com warning.
8. Registra observacao de aprovacao com data.

### Pagamento de Folha
1. Apenas folhas `aprovada` podem ser pagas.
2. Todos os itens devem ter lancamento financeiro vinculado. Caso contrario, orienta cancelar e reaprovar.
3. Conta bancaria deve existir e estar ativa.
4. Atualiza lancamentos financeiros para status `confirmado` com forma de pagamento e data de efetivacao.
5. Erros parciais sao tolerados com warning.

### Cancelamento de Folha
1. Folhas `paga` nao podem ser canceladas (orienta estorno individual).
2. Folhas ja `cancelada` nao podem ser canceladas novamente.
3. Para folhas `aprovada`, cancela lancamentos financeiros vinculados (status `cancelado`). Lancamentos ja pagos bloqueiam cancelamento.
4. Registra observacao de cancelamento com data e motivo.

### Pre-visualizacao
1. Permite simular geracao sem persistir, mostrando salarios vigentes e valor total estimado.

### Edicao de Folha
1. Apenas folhas em `rascunho` podem ter dados basicos editados (data pagamento, observacoes).

## Filtros Disponiveis

### Listagem de Salarios (ListarSalariosParams)
- `busca`: busca textual
- `usuarioId`: filtro por funcionario
- `cargoId`: filtro por cargo
- `ativo`: boolean
- `vigente`: apenas salarios vigentes na data atual
- `ordenarPor`: `data_inicio_vigencia`, `salario_bruto`, `usuario`, `created_at`
- `ordem`: `asc`, `desc`
- `pagina` e `limite`: paginacao

### Listagem de Folhas (ListarFolhasParams)
- `mesReferencia` e `anoReferencia`: periodo
- `status`: um ou array de StatusFolhaPagamento
- `ordenarPor`: `periodo`, `valor_total`, `status`, `created_at`
- `ordem`: `asc`, `desc`
- `pagina` e `limite`: paginacao

## Restricoes de Acesso
- **Salarios**: `salarios:listar`, `salarios:criar`, `salarios:editar`, `salarios:deletar`
- **Visualizacao restrita**: Sem permissao `salarios:visualizar_todos`, usuario so ve seus proprios salarios
- **Folhas de Pagamento**: `folhas_pagamento:listar`, `folhas_pagamento:criar`, `folhas_pagamento:editar`, `folhas_pagamento:aprovar`, `folhas_pagamento:pagar`, `folhas_pagamento:cancelar`, `folhas_pagamento:deletar`
- **Visualizacao restrita de folhas**: Sem permissao `folhas_pagamento:visualizar_todos`, usuario ve apenas itens onde e o funcionario
- Autenticacao via `requireAuth()` com verificacao de permissoes por `checkPermission()`

## Integracoes
- **Financeiro**: Criacao automatica de lancamentos financeiros (`lancamentos_financeiros`) ao aprovar folha; atualizacao de status ao pagar; cancelamento ao cancelar folha
- **Plano de Contas**: Validacao de conta contabil (deve ser analitica e ativa)
- **Contas Bancarias**: Validacao na aprovacao e pagamento
- **Centros de Custo**: Validacao opcional na aprovacao

## Revalidacao de Cache
- `revalidatePath('/app/rh/salarios')`: ao criar, atualizar, encerrar vigencia, inativar ou excluir salario
- `revalidatePath('/app/rh/folhas-pagamento')`: ao gerar, aprovar, pagar, atualizar, cancelar ou excluir folha
- `revalidatePath('/app/rh/folhas-pagamento/${id}')`: ao aprovar, pagar, atualizar ou cancelar folha especifica
- `revalidatePath('/app/financeiro')`: ao aprovar, pagar ou cancelar folha (impacta lancamentos)
