# Regras de Negocio - Cargos

## Contexto
Modulo de gerenciamento de cargos (funcoes/posicoes) do escritorio. Permite criar, editar, listar e excluir cargos que sao atribuidos a usuarios. Utiliza cache Redis para otimizar leituras.

## Entidades Principais
- **Cargo**: Cargo com `id`, `nome`, `descricao`, `ativo`, `created_by`, `created_at`, `updated_at`
- **CargoComUsuariosError**: Erro estruturado retornado ao tentar excluir cargo com usuarios associados (`cargoId`, `cargoNome`, `totalUsuarios`, `usuarios[]`)

## Regras de Validacao
- `nome`: obrigatorio, minimo 3 caracteres
- `descricao`: opcional
- `ativo`: booleano, default `true`
- Na atualizacao, todos os campos sao opcionais (schema parcial)

## Regras de Negocio
- **Unicidade de nome**: Ao criar ou atualizar, verifica se ja existe cargo com mesmo nome (case-insensitive via `ilike`); constraint unique no banco (codigo 23505)
- **Protecao contra exclusao**: Nao permite excluir cargo que possui usuarios associados; retorna erro estruturado `CargoComUsuariosError` com lista de usuarios vinculados (id, nome_completo, email_corporativo)
- **Exclusao fisica**: DELETE direto, sem soft delete
- **Verificacao de existencia**: Atualizar e deletar exigem que o registro exista
- **created_by**: Preenchido automaticamente com o `userId` do usuario autenticado na criacao
- **Trim automatico**: Nome e descricao sao trimados antes de persistir
- **Service lanca Error**: Nao utiliza pattern Result, lanca excecoes diretamente

## Filtros Disponiveis
- `busca`: busca por nome (ilike)
- `ativo`: filtro por status ativo/inativo
- `ordenarPor`: `"nome" | "createdAt" | "updatedAt"` (mapeado para snake_case no repo)
- `ordem`: `"asc" | "desc"`
- `pagina` / `limite`: paginacao (default limite = 50)

## Tabelas
- `cargos` (tabela principal, constraint unique no nome)
- `usuarios` (relacionamento via `cargo_id` para verificar vinculo)

## Restricoes de Acesso
- Listagem: requer permissao `cargos:visualizar` OU `usuarios:visualizar`
- Busca por ID: requer permissao `cargos:visualizar`
- Criacao/Atualizacao/Exclusao: requer permissao `cargos:editar` OU `usuarios:editar`
- Todas as actions verificam autenticacao via `getCurrentUser`

## Integracoes
- `@/lib/redis` (cache com TTL de 1 hora; invalidacao por pattern `cargos:*` em todas as operacoes de escrita)
- `@/lib/supabase/service-client` (acesso via service role)
- `@/lib/auth/authorization` (`checkPermission`)

## Revalidacao de Cache
- `actionCriarCargo`: revalida `/app/usuarios/cargos` e `/app/usuarios`
- `actionAtualizarCargo`: revalida `/app/usuarios/cargos`
- `actionDeletarCargo`: revalida `/app/usuarios/cargos`
- Redis: invalida pattern `cargos:*` em criar, atualizar e deletar
