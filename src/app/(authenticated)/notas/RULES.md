# Regras de Negócio - Notas

## Contexto
Módulo de notas pessoais do Synthropic. Permite que cada usuário crie, edite, arquive e exclua notas com suporte a três tipos (texto, checklist, imagem) e organização por etiquetas coloridas. Dados são isolados por usuário via RLS.

## Entidades Principais
- **Note**: Nota com título, conteúdo, tipo, itens de checklist, imagem e etiquetas
- **NoteLabel**: Etiqueta com título e cor para categorização de notas
- **NoteChecklistItem**: Item de checklist (texto + checked)

## Enums e Tipos

### Tipo de Nota
- `text`: Nota de texto livre
- `checklist`: Nota com itens marcáveis
- `image`: Nota com imagem

## Regras de Validação

### Nota
- `title`: Obrigatório, 1–200 caracteres (trimmed)
- `content`: Opcional (string livre)
- `type`: Deve ser `text`, `checklist` ou `image`
- `labels`: Array de IDs de etiquetas (inteiros positivos)
- `items`: Array de `{ text: string, checked: boolean }` (para checklists)
- `image`: String opcional (URL da imagem)
- `isArchived`: Booleano (default: false)

### Etiqueta
- `title`: Obrigatório, 1–80 caracteres (trimmed)
- `color`: Obrigatório, 1–64 caracteres (trimmed)

## Regras de Negócio

### Criação de Nota
1. Validar input com Zod (`createNotaSchema`)
2. Tipo padrão: `text` se não informado
3. Labels e isArchived possuem defaults (vazio e false)
4. Persistir nota na tabela `notas`
5. Criar vínculos em `nota_etiqueta_vinculos` se houver labels

### Atualização de Nota
1. Validar input com Zod (`updateNotaSchema`)
2. Rejeitar se nenhum campo alterado
3. Atualizar apenas campos enviados (partial update)
4. Se labels fornecidas: deletar vínculos antigos e recriar (replace completo)
5. Retornar nota atualizada com labels resolvidas

### Arquivamento
1. Alterna flag `is_archived` na nota
2. Notas arquivadas são ocultadas por padrão na listagem
3. Podem ser listadas passando `includeArchived: true`

### Exclusão
1. Deletar nota da tabela `notas` (cascade deleta vínculos)
2. Filtro por `usuario_id` garante que usuário só exclui suas notas

### Etiquetas
1. Cada etiqueta pertence a um único usuário
2. CRUD completo: criar, atualizar, excluir
3. Exclusão de etiqueta remove vínculos associados
4. Etiquetas são listadas em ordem alfabética

### Listagem
1. Buscar todas as notas do usuário (ordenadas por `updated_at` desc)
2. Buscar todas as etiquetas do usuário
3. Resolver vínculos nota↔etiqueta
4. Retornar payload unificado `{ notes, labels }` validado com Zod

## Restrições de Acesso
- Todas as operações requerem autenticação (`authenticatedAction`)
- Dados isolados por `usuario_id` — cada usuário acessa apenas suas notas e etiquetas
- RLS no Supabase como camada adicional de segurança

## Integrações
- **Supabase**: Tabelas `notas`, `nota_etiquetas`, `nota_etiqueta_vinculos`
- **Safe Action**: Todas as actions usam `authenticatedAction` de `@/lib/safe-action`

## Revalidação de Cache
Após mutações, revalidar:
- `/app/notas` — Lista de notas
