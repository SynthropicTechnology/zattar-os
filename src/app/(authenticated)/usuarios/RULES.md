# Regras de Negocio - Usuarios

## Contexto
Modulo central de gestao de usuarios do Sinesys. Gerencia cadastro, permissoes, cargos, sincronizacao com Supabase Auth e desativacao com desatribuicao automatica de itens. Utiliza cache Redis para otimizar leituras e sistema de permissoes granular por recurso/operacao.

## Entidades Principais
- **Usuario**: Registro completo de usuario com dados pessoais (CPF, RG, data nascimento, genero), dados profissionais (OAB, cargo, email corporativo), endereco, avatar, cover e flags de controle (ativo, isSuperAdmin)
- **UsuarioDetalhado**: Usuario com lista de permissoes
- **Permissao**: Registro de permissao com recurso, operacao e flag de permitido
- **PermissaoMatriz**: Matriz de permissoes agrupada por recurso com operacoes

## Enums e Tipos
- **GeneroUsuario**: `masculino`, `feminino`, `outro`, `prefiro_nao_informar`

## Regras de Validacao

### Criar Usuario (criarUsuarioSchema)
- `nomeCompleto`: minimo 3 caracteres
- `nomeExibicao`: minimo 2 caracteres
- `cpf`: 11 digitos (remove caracteres nao numericos via transform)
- `emailCorporativo`: email valido obrigatorio
- `emailPessoal`: email valido opcional (aceita string vazia)
- `rg`, `dataNascimento`, `genero`, `oab`: opcionais
- `ufOab`: 2 letras (converte string vazia para null)
- `telefone`: remove caracteres nao numericos, nullable
- `ramal`: string opcional
- `endereco`: objeto opcional com logradouro, numero, complemento, bairro, cidade, estado (2 letras), pais, cep
- `authUserId`: UUID opcional
- `cargoId`: numero coercido opcional
- `isSuperAdmin`: boolean, default false
- `ativo`: boolean, default true

### Atualizar Usuario (atualizarUsuarioSchema)
- Todos os campos de criacao sao parciais
- `id`: numero obrigatorio

## Regras de Negocio

### Criacao de Usuario
1. Validar schema Zod.
2. Verificar unicidade de CPF no sistema.
3. Verificar unicidade de email corporativo no sistema.
4. Validar existencia do cargo se informado.
5. Se senha fornecida (>= 6 caracteres), criar usuario no Supabase Auth primeiro. Se a criacao do usuario no banco falhar, fazer rollback deletando o auth user.

### Atualizacao de Usuario
1. Verificar existencia do usuario.
2. Validar schema parcial com Zod.
3. Se CPF mudou, verificar unicidade (excluindo o proprio usuario).
4. Se email corporativo mudou, verificar unicidade (excluindo o proprio usuario).
5. Validar existencia do cargo se informado.

### Desativacao de Usuario
1. Desatribuicao automatica de todos os itens vinculados ao usuario:
   - Processos (`acervo`)
   - Audiencias (`audiencias`)
   - Expedientes (`expedientes`)
   - Expedientes manuais (`expedientes_manuais`)
   - Contratos (`contratos`)
2. Configura contexto `app.current_user_id` para RPCs de desatribuicao.
3. Marca usuario como `ativo = false`.
4. Invalida cache do usuario.

### Sincronizacao com Supabase Auth
1. Busca usuarios Auth nao sincronizados via RPC `list_auth_users_nao_sincronizados`.
2. Para cada auth user, mapeia dados: extrai nome de `raw_user_meta_data.name` ou do email.
3. Gera CPF temporario a partir do UUID (primeiros 11 digitos numericos).
4. Cria usuario no banco com dados mapeados.

### Permissoes
1. **Super Admin**: Tem todas as permissoes automaticamente (sem consulta ao banco).
2. **Listagem**: Retorna permissoes do banco filtradas por `permitido = true`.
3. **Substituicao**: Deleta todas as permissoes existentes e insere as novas (replace completo).
4. **Upsert em batch**: Suporta upsert por chave `usuario_id, recurso, operacao`.

## Filtros Disponiveis (ListarUsuariosParams)
- `busca`: busca em nome_completo, nome_exibicao, cpf, email_corporativo (ilike)
- `ativo`: boolean
- `oab`: filtro por numero OAB
- `ufOab`: filtro por UF da OAB
- `cargoId`: filtro por cargo
- `isSuperAdmin`: boolean
- `pagina` e `limite`: paginacao (default 50, sem paginacao se ambos omitidos)

## Restricoes de Acesso
- **Visualizacao**: `usuarios:visualizar`
- **Criacao**: `usuarios:criar`
- **Edicao**: `usuarios:editar`
- **Desativacao**: `usuarios:deletar`
- **Gerenciamento de Permissoes**: `usuarios:gerenciar_permissoes`
- **Sincronizacao**: `usuarios:criar`
- Autenticacao via `requireAuth()` com verificacao de permissoes por `checkPermission()`

## Integracoes
- **Supabase Auth**: Criacao de auth users com senha, rollback em caso de falha
- **Redis**: Cache de usuarios por id, cpf, email e listas. TTL de 1800s para itens individuais. Invalidacao via `invalidateUsuariosCache()` e `deleteCached()`.
- **Cargos**: Referencia tabela `cargos` para validacao e join
- **Desatribuicao**: RPCs do banco para desatribuir processos, audiencias, expedientes, expedientes manuais e contratos ao desativar usuario

## Revalidacao de Cache
- `revalidatePath('/app/usuarios')`: ao criar, atualizar, desativar ou sincronizar usuarios
- `revalidatePath('/app/usuarios/${id}')`: ao atualizar ou desativar usuario especifico
