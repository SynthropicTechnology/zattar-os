# Regras de Negocio - Enderecos

## Contexto
Modulo de gestao de enderecos fisicos associados a entidades do sistema (clientes, partes contrarias, terceiros). Suporta sincronizacao com o PJE para captura automatica de enderecos de partes processuais. Relacao polimorfica via campos `entidade_tipo` e `entidade_id`.

## Entidades Principais
- **Endereco**: Endereco fisico completo com campos de localizacao, dados de sincronizacao PJE (id_pje, id_municipio_pje, estado_id_pje, pais_id_pje), classificacoes, situacao e flag de correspondencia

## Enums e Tipos
- **EntidadeTipoEndereco**: `cliente`, `parte_contraria`, `terceiro`
- **GrauProcesso**: `primeiro_grau`, `segundo_grau`, `tribunal_superior`
- **SituacaoEndereco**: `A` (Ativo), `I` (Inativo), `P` (Principal/Correspondencia), `H` (Historico)
- **OrdenarPorEndereco**: `created_at`, `municipio`, `estado`, `cep`
- **OrdemEndereco**: `asc`, `desc`

## Regras de Validacao

### Schema de Endereco (enderecoSchema)
- `municipio`: obrigatorio, minimo 1 caractere
- `estado`: obrigatorio, minimo 2 caracteres
- `cep`: 8 digitos (remove caracteres nao numericos via transform)

### Schema de Criacao (actions)
- `entidade_tipo`: enum obrigatorio (`cliente`, `parte_contraria`, `terceiro`)
- `entidade_id`: inteiro positivo obrigatorio

## Regras de Negocio

### Criacao
1. Endereco e associado a uma entidade via relacao polimorfica (`entidade_tipo` + `entidade_id`).
2. Conflito de unicidade (codigo 23505) retorna erro `CONFLICT`.

### Atualizacao
1. Campo `updated_at` e atualizado automaticamente.
2. Se registro nao encontrado (PGRST116), retorna erro `NOT_FOUND`.

### Busca por Entidade
1. Filtra apenas enderecos ativos (`ativo = true`).
2. Ordena por `correspondencia` descendente (endereco de correspondencia primeiro).

### Listagem
1. Suporta paginacao com `pagina` e `limite` (default 50).
2. Suporta ordenacao por `ordenar_por` (default `created_at`) e `ordem` (default `desc`).
3. Filtro de busca generica em `logradouro`, `municipio` e `cep` via ilike.
4. Filtros por `entidade_tipo`, `entidade_id`, `ativo`.

### Delecao
1. Soft delete: marca `ativo = false` em vez de remover o registro.

### Upsert via PJE
1. Operacao de upsert por chave composta `id_pje, entidade_tipo, entidade_id`.
2. Sempre atualiza em caso de conflito (`ignoreDuplicates: false`).
3. Campo `dados_pje_completo` armazena o payload bruto do PJE para referencia.

## Filtros Disponiveis (ListarEnderecosParams)
- `entidade_tipo`: tipo da entidade associada
- `entidade_id`: ID da entidade associada
- `trt`, `grau`, `numero_processo`: contexto processual
- `municipio`, `estado_sigla`, `estado`, `pais_codigo`, `pais`: localizacao
- `cep`: CEP
- `correspondencia`: boolean para endereco de correspondencia
- `situacao`: situacao do endereco (A/I/P/H)
- `ativo`: boolean
- `busca`: busca textual
- `ordenar_por` e `ordem`: ordenacao
- `pagina` e `limite`: paginacao

## Restricoes de Acesso
- Todas as actions utilizam `authenticatedAction` de `@/lib/safe-action`, exigindo usuario autenticado.

## Revalidacao de Cache
- `revalidatePath('/app/enderecos')`: ao criar, atualizar ou deletar endereco
