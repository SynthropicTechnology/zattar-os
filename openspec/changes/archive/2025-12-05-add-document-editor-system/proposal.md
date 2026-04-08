# Proposta: Sistema de Editor de Documentos com Colaboração em Tempo Real

## Why

O Synthropic atualmente não possui um sistema standalone para criação, edição e gerenciamento de documentos internos. Usuários precisam recorrer a ferramentas externas (Google Docs, Word) para criar documentos de trabalho, petições, atas, minutas e outros textos do dia a dia do escritório.

Esta proposta implementa um **sistema completo de editor de documentos** com:

1. **Editor de texto rico** usando Plate.js (já instalado) com todas as funcionalidades modernas (formatação, imagens, tabelas, comentários, sugestões)
2. **Organização hierárquica** através de pastas comuns e privadas
3. **Compartilhamento granular** user-to-user com permissões configuráveis
4. **Templates reutilizáveis** para padronização de documentos do escritório
5. **Upload integrado** migrado de UploadThing para Backblaze B2 (consistência com o resto do sistema)
6. **Colaboração em tempo real** usando Supabase Realtime (já instalado)
7. **Chat interno** para comunicação entre usuários do escritório
8. **Versionamento completo** com histórico e possibilidade de restauração
9. **Lixeira (soft delete)** para recuperação de documentos deletados acidentalmente
10. **Exportação** para PDF e DOCX

## What Changes

### BREAKING CHANGES

- **Remoção do UploadThing**: Sistema de upload atual será completamente removido e substituído por integração direta com Backblaze B2
  - Arquivos afetados: `app/_lib/uploadthing.ts`, `app/api/uploadthing/route.ts`
  - Dependência removida do `package.json`

### Novas Tabelas (PostgreSQL + RLS)

1. **`documentos`**: Armazenamento de documentos com conteúdo Plate.js (JSONB)
   - Campos: id, titulo, conteudo, pasta_id, criado_por, editado_por, versao, tags, deleted_at, timestamps
   - RLS: Acesso baseado em criador + compartilhamento

2. **`pastas`**: Sistema hierárquico de pastas (self-referencing)
   - Campos: id, nome, pasta_pai_id, tipo (comum/privada), criado_por, cor, icone, deleted_at, timestamps
   - Trigger: Validação de ciclos na hierarquia

3. **`documentos_compartilhados`**: Compartilhamento user-to-user
   - Campos: id, documento_id, usuario_id, permissao (visualizar/editar), compartilhado_por, created_at
   - Constraint: unique (documento_id, usuario_id)

4. **`templates`**: Templates reutilizáveis
   - Campos: id, titulo, descricao, conteudo (JSONB), visibilidade (publico/privado), categoria, thumbnail_url, criado_por, uso_count, timestamps

5. **`documentos_uploads`**: Rastreamento de uploads (B2)
   - Campos: id, documento_id, nome_arquivo, tipo_mime, tamanho_bytes, b2_key, b2_url, tipo_media, criado_por, created_at

6. **`documentos_versoes`** (NOVO): Histórico de versões
   - Campos: id, documento_id, versao, conteudo (JSONB), titulo, criado_por, created_at

7. **`mensagens_chat`** (NOVO): Chat interno
   - Campos: id, sala_id, usuario_id, conteudo, tipo (texto/arquivo/sistema), created_at, updated_at, deleted_at

8. **`salas_chat`** (NOVO): Salas de chat
   - Campos: id, nome, tipo (geral/documento/privado), documento_id, criado_por, created_at

### Novos Endpoints

**Documentos**:
- `GET /api/documentos` - Listar com filtros/paginação
- `POST /api/documentos` - Criar
- `GET /api/documentos/[id]` - Buscar
- `PUT /api/documentos/[id]` - Atualizar
- `DELETE /api/documentos/[id]` - Soft delete
- `POST /api/documentos/[id]/auto-save` - Auto-save
- `POST /api/documentos/[id]/compartilhar` - Compartilhar
- `DELETE /api/documentos/[id]/compartilhar` - Remover compartilhamento
- `GET /api/documentos/[id]/versoes` - Listar versões
- `POST /api/documentos/[id]/restaurar/[versao]` - Restaurar versão
- `GET /api/documentos/[id]/exportar/pdf` - Exportar PDF
- `GET /api/documentos/[id]/exportar/docx` - Exportar DOCX
- `POST /api/documentos/[id]/uploads` - Upload arquivo
- `DELETE /api/documentos/[id]/uploads/[uploadId]` - Deletar upload

**Pastas**:
- `GET /api/pastas` - Listar
- `POST /api/pastas` - Criar
- `GET /api/pastas/[id]` - Buscar
- `PUT /api/pastas/[id]` - Atualizar
- `DELETE /api/pastas/[id]` - Soft delete

**Templates**:
- `GET /api/templates` - Listar
- `POST /api/templates` - Criar
- `GET /api/templates/[id]` - Buscar
- `PUT /api/templates/[id]` - Atualizar
- `DELETE /api/templates/[id]` - Deletar
- `POST /api/templates/[id]/usar` - Criar documento a partir do template

**Chat**:
- `GET /api/chat/salas` - Listar salas
- `POST /api/chat/salas` - Criar sala
- `GET /api/chat/salas/[id]/mensagens` - Listar mensagens
- `POST /api/chat/salas/[id]/mensagens` - Enviar mensagem
- `DELETE /api/chat/mensagens/[id]` - Deletar mensagem
- Integração Supabase Realtime para mensagens em tempo real

**Lixeira**:
- `GET /api/lixeira/documentos` - Listar documentos deletados
- `GET /api/lixeira/pastas` - Listar pastas deletadas
- `POST /api/lixeira/documentos/[id]/restaurar` - Restaurar documento
- `POST /api/lixeira/pastas/[id]/restaurar` - Restaurar pasta
- `DELETE /api/lixeira/documentos/[id]` - Deletar permanentemente
- `DELETE /api/lixeira/pastas/[id]` - Deletar permanentemente

### Mudanças na Navegação

- **Reorganização da sidebar** em 3 seções:
  - Nav Principal: Dashboard, Partes, Contratos, Processos, Audiências, Expedientes, Obrigações/Acordos
  - **Nav Serviços** (NOVO): Editor de Documentos, Chat Interno
  - Nav Administração: Captura (movido), Usuários

### Integração Supabase Realtime

- **Colaboração em Tempo Real**: Múltiplos usuários editando o mesmo documento
  - Componente `RealtimeCursors`: Cursores de outros usuários
  - Componente `RealtimeAvatarStack`: Avatares de usuários online no documento
  - Sincronização de alterações via Realtime Broadcast

- **Chat em Tempo Real**:
  - Componente `RealtimeChat`: Interface de chat
  - Persistência de mensagens no PostgreSQL
  - Broadcast de mensagens via Realtime

### Sistema de Permissões Customizado

- **NÃO integra** com o sistema de 82 permissões existente
- Permissões configuráveis **a nível de item**:
  - Criador define permissões ao compartilhar (visualizar/editar)
  - Usuários podem editar documentos/pastas compartilhados com permissão "editar"
  - Apenas criador pode deletar (soft delete → lixeira)
  - Pastas comuns: editáveis por qualquer usuário, deletáveis apenas pelo criador

## Impact

### Specs Afetadas

#### Nova Capability: `documentos-editor`
Specs delta em `specs/documentos-editor/spec.md` com requirements:
- CRUD de documentos
- Sistema de pastas hierárquico
- Compartilhamento user-to-user
- Templates
- Upload para Backblaze B2
- Versionamento com histórico
- Soft delete com lixeira
- Colaboração tempo real
- Auto-save
- Exportação PDF/DOCX

#### Nova Capability: `chat-interno`
Specs delta em `specs/chat-interno/spec.md` com requirements:
- Chat em tempo real
- Salas de chat (geral, por documento, privado)
- Persistência de mensagens
- Notificações
- Integração com RealtimeChat

### Código Afetado

**Navegação**:
- `components/layout/app-sidebar.tsx`: Reorganização em 3 seções

**Upload**:
- `app/_lib/uploadthing.ts`: **DELETAR**
- `app/_lib/hooks/use-upload-file.ts`: **DELETAR** ou adaptar para B2
- `app/api/uploadthing/route.ts`: **DELETAR**
- `package.json`: Remover dependência `uploadthing`

**Novos Módulos**:
- `backend/documentos/`: Serviços e tipos
- `backend/chat/`: Serviços de chat
- `app/(dashboard)/documentos/`: Páginas do editor
- `app/(dashboard)/chat/`: Páginas do chat
- `components/documentos/`: Componentes do editor
- `components/chat/`: Componentes de chat

### Dependências

**Instaladas** (já presentes):
- `platejs` - Editor de texto rico
- `@platejs/docx` - Exportação DOCX
- `@supabase/ssr` - Supabase Realtime
- Componentes Realtime: `RealtimeCursors`, `RealtimeChat`, `RealtimeAvatarStack`, `CurrentUserAvatar`

**A Instalar**:
- `puppeteer` ou `jsPDF` - Exportação PDF (decidir durante implementação)

### Estimativa de Esforço

- **MVP Funcional**: 28-36 horas
- **Features Completas**: 50-67 horas
- **Sistema Completo** (com versionamento, soft delete, colaboração, chat): **101-136 horas**

### Riscos e Mitigações

**Risco 1**: Conflitos de edição em colaboração tempo real
- **Mitigação**: Usar Operational Transformation (OT) ou CRDT via Supabase Realtime Broadcast

**Risco 2**: Performance com documentos muito grandes
- **Mitigação**: Lazy loading, paginação obrigatória, índices otimizados

**Risco 3**: Perda de dados durante auto-save
- **Mitigação**: Debounce de 2s, versionamento automático, soft delete

**Risco 4**: Complexidade de exportação PDF
- **Mitigação**: Verificar plugin Plate.js existente antes de implementar do zero

## Aprovação Necessária

- [ ] Aprovação do usuário para quebra de compatibilidade (remoção UploadThing)
- [ ] Confirmação de uso do Backblaze B2 para upload do editor
- [ ] Validação de estimativa de esforço (101-136 horas)
- [ ] Aprovação de nova navegação (3 seções)
