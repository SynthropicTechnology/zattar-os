# Regras de Negocio - Tipos de Expedientes

## Contexto
Modulo de cadastro auxiliar do Sinesys para gerenciar os tipos de expedientes disponiveis no sistema. Funciona como tabela de dominio referenciada pelo modulo de expedientes. Utiliza cache Redis para otimizar leituras.

## Entidades Principais
- **TipoExpediente**: Registro de tipo de expediente com nome, criador e timestamps de auditoria

## Regras de Validacao

### Criar/Atualizar (createTipoExpedienteSchema / updateTipoExpedienteSchema)
- `tipoExpediente`: string obrigatoria, trim automatico, minimo 1 caractere, maximo 255 caracteres

### Listagem (listarTiposExpedientesParamsSchema)
- `pagina`: inteiro >= 1, default 1
- `limite`: inteiro de 1 a 100, default 50
- `busca`: string opcional para filtro textual
- `ordenarPor`: `tipoExpediente`, `createdAt` ou `updatedAt`, default `tipoExpediente`
- `ordem`: `asc` ou `desc`, default `asc`

## Regras de Negocio

### Criacao
1. Validar schema Zod.
2. Verificar unicidade do nome: nao pode existir outro tipo com mesmo nome.

### Atualizacao
1. Verificar existencia do registro.
2. Se o nome mudou, validar unicidade (excluindo o proprio registro).

### Delecao
1. Verificar existencia do registro.
2. Verificar se o tipo esta em uso na tabela `expedientes` (campo `tipo_expediente_id`). Se estiver em uso, rejeitar exclusao.
3. Delecao e permanente (hard delete).

## Filtros Disponiveis (ListarTiposExpedientesParams)
- `busca`: busca textual por nome (ilike)
- `ordenarPor`: campo de ordenacao
- `ordem`: direcao da ordenacao
- `pagina` e `limite`: paginacao

## Restricoes de Acesso
- Listagem e busca: sem restricao alem de autenticacao
- Criacao, atualizacao e delecao: exigem usuario autenticado via `authenticateRequest()`

## Integracoes
- **Redis**: Cache de leituras com prefixo `tiposExpedientes`, TTL de 3600s. Invalidacao automatica via `invalidateCacheOnUpdate()` ao criar, atualizar ou deletar.
- **Expedientes**: Referenciado pela tabela `expedientes` via `tipo_expediente_id`. Impede delecao quando em uso.

## Revalidacao de Cache
- `revalidatePath('/app/tipos-expedientes')`: ao criar, atualizar ou deletar tipo de expediente
