# Regras de Negócio - Perfil

## Contexto
Módulo de visualização e edição do perfil do usuário autenticado. Funciona como camada de apresentação sobre o módulo `usuarios`, oferecendo actions específicas para que o usuário consulte e atualize seus próprios dados. Inclui funcionalidades de alteração de senha e upload de avatar.

## Entidades Principais
- **Usuario**: Re-exportado de `@/app/(authenticated)/usuarios` — contém dados pessoais, profissionais e de acesso

## Regras de Negócio

### Obter Perfil
1. Autenticar via `supabase.auth.getUser()`
2. Buscar dados do usuário na tabela `usuarios` pelo `auth_user_id`
3. Incluir dados do cargo via join com `cargos`
4. Buscar permissões do usuário na tabela `permissoes_usuarios`
5. Retornar flag `podeGerenciarPermissoes` baseada na presença de `usuarios:gerenciar_permissoes`

### Atualizar Perfil
1. Autenticar via `supabase.auth.getUser()`
2. Localizar ID do usuário pelo `auth_user_id`
3. Delegar atualização para `usuariosService.atualizarUsuario()`
4. Revalidar cache do perfil após sucesso

### Campos Editáveis
- Dados pessoais: nome, CPF, RG, data de nascimento, gênero
- Dados profissionais: OAB, UF da OAB
- Contato: email pessoal, email corporativo, telefone, ramal
- Endereço
- Avatar e capa

## Restrições de Acesso
- Apenas o próprio usuário pode ver/editar seu perfil
- Autenticação obrigatória via Supabase Auth
- Permissão `usuarios:gerenciar_permissoes` é consultada mas não bloqueia — apenas exibe flag na UI

## Integrações
- **Usuarios**: `service.atualizarUsuario()` para persistência de alterações
- **Supabase Auth**: Autenticação e identificação do usuário
- **Cargos**: Join para exibir cargo do usuário

## Revalidação de Cache
Após mutações, revalidar:
- `/app/perfil` — Página do perfil
