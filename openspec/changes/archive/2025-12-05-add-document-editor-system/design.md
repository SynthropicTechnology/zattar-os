# Design: Sistema de Editor de Documentos

## Arquitetura Geral

O sistema de editor de documentos segue a arquitetura em camadas do Synthropic:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Páginas    │ Componentes  │    Hooks Customizados    │ │
│  │ (Next.js 16) │  (shadcn/ui) │  (auto-save, upload)     │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js 16)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Autenticação → Validação → Serviços → Resposta     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Serviços de Lógica de Negócio                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  Validações  │   Regras de  │  Chamadas de Persistência│ │
│  │              │    Negócio   │                          │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Serviços de Persistência                        │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Supabase   │   Backblaze  │   Supabase Realtime     │ │
│  │  (PostgreSQL)│      B2      │   (Colaboração + Chat)  │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Schema do Banco de Dados

### 1. Tabela `documentos`

Armazena os documentos criados com o editor Plate.js.

```sql
create table public.documentos (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null default '[]'::jsonb,
  pasta_id bigint references public.pastas(id) on delete set null,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  editado_por bigint references public.usuarios(id) on delete set null,
  versao integer not null default 1,
  descricao text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_em timestamptz,
  deleted_at timestamptz, -- Soft delete

  constraint documentos_titulo_length check (char_length(titulo) between 1 and 500),
  constraint documentos_versao_positive check (versao > 0)
);
```

**Decisões de Design**:
- **JSONB para conteúdo**: Plate.js usa estrutura JSON para o editor. JSONB permite consultas e indexação se necessário.
- **Soft delete** (`deleted_at`): Permite recuperação de documentos deletados acidentalmente.
- **Versionamento**: Campo `versao` incrementado a cada atualização **explícita** (não auto-save).
- **Tags** como array: Permite filtros e busca por múltiplas tags.
- **Trigram index** no título: Busca textual eficiente.

**Índices**:
```sql
create index idx_documentos_criado_por on public.documentos using btree (criado_por);
create index idx_documentos_pasta_id on public.documentos using btree (pasta_id);
create index idx_documentos_created_at on public.documentos using btree (created_at desc);
create index idx_documentos_updated_at on public.documentos using btree (updated_at desc);
create index idx_documentos_tags on public.documentos using gin (tags);
create index idx_documentos_titulo_trgm on public.documentos using gin (titulo gin_trgm_ops);
create index idx_documentos_deleted_at on public.documentos using btree (deleted_at) where deleted_at is not null;
```

**RLS Policies**:
- **Select**: Criador + usuários com compartilhamento
- **Insert**: Apenas usuários autenticados (validação de `criado_por`)
- **Update**: Criador + usuários com permissão "editar"
- **Delete**: Apenas criador (soft delete)

---

### 2. Tabela `pastas`

Sistema hierárquico de pastas (self-referencing).

```sql
create table public.pastas (
  id bigint generated always as identity primary key,
  nome text not null,
  pasta_pai_id bigint references public.pastas(id) on delete cascade,
  tipo text not null check (tipo in ('comum', 'privada')),
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  descricao text,
  cor text, -- Hex color
  icone text, -- Nome do ícone Lucide
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, -- Soft delete

  constraint pastas_nome_length check (char_length(nome) between 1 and 200),
  constraint pastas_tipo_privada_criador check (
    tipo = 'comum' or (tipo = 'privada' and criado_por is not null)
  ),
  constraint pastas_no_self_reference check (pasta_pai_id != id)
);
```

**Decisões de Design**:
- **Self-referencing**: `pasta_pai_id` aponta para outra pasta (permite hierarquia ilimitada).
- **Trigger de validação de ciclos**: Função `validate_pasta_hierarchy()` previne ciclos.
- **Tipo "comum" vs "privada"**:
  - **Comum**: Todos os usuários podem ver e usar, apenas criador pode deletar
  - **Privada**: Apenas criador pode ver e usar
- **Customização visual**: Campos `cor` e `icone` para UI.

**Trigger para Prevenir Ciclos**:
```sql
create or replace function validate_pasta_hierarchy()
returns trigger as $$
declare
  current_id bigint;
  max_depth integer := 10;
  depth integer := 0;
begin
  if new.pasta_pai_id is null then
    return new;
  end if;

  current_id := new.pasta_pai_id;

  while current_id is not null and depth < max_depth loop
    if current_id = new.id then
      raise exception 'Ciclo detectado na hierarquia de pastas';
    end if;

    select pasta_pai_id into current_id
    from public.pastas
    where id = current_id;

    depth := depth + 1;
  end loop;

  if depth >= max_depth then
    raise exception 'Profundidade máxima de pastas atingida (máximo: %)', max_depth;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger validate_pasta_hierarchy_trigger
  before insert or update on public.pastas
  for each row
  execute function validate_pasta_hierarchy();
```

---

### 3. Tabela `documentos_compartilhados`

Compartilhamento user-to-user de documentos.

```sql
create table public.documentos_compartilhados (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  permissao text not null check (permissao in ('visualizar', 'editar')),
  compartilhado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_compartilhados_unique unique (documento_id, usuario_id)
);
```

**Decisões de Design**:
- **Permissões**: "visualizar" ou "editar" (futuro: adicionar "pode_deletar")
- **Constraint unique**: Um usuário não pode ter múltiplos compartilhamentos do mesmo documento
- **Compartilhado por**: Rastreia quem fez o compartilhamento (auditoria)

**RLS Policies**:
- **Select**: Criador do documento + quem compartilhou + quem recebeu
- **Insert**: Apenas criador do documento
- **Update**: Apenas quem compartilhou (para alterar permissão)
- **Delete**: Criador do documento + quem compartilhou

---

### 4. Tabela `templates`

Templates reutilizáveis para criação rápida de documentos.

```sql
create table public.templates (
  id bigint generated always as identity primary key,
  titulo text not null,
  descricao text,
  conteudo jsonb not null default '[]'::jsonb,
  visibilidade text not null check (visibilidade in ('publico', 'privado')),
  categoria text,
  thumbnail_url text,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  uso_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint templates_titulo_length check (char_length(titulo) between 1 and 200),
  constraint templates_uso_count_non_negative check (uso_count >= 0)
);
```

**Decisões de Design**:
- **Visibilidade**: "publico" (todos veem) ou "privado" (apenas criador)
- **Categoria**: Livre (ex: "Petições", "Atas", "Contratos")
- **Thumbnail**: URL de imagem de preview (opcional)
- **Contador de uso**: Estatística de popularidade

**RLS Policies**:
- **Select**: Templates públicos + privados do usuário
- **Insert/Update/Delete**: Apenas criador

---

### 5. Tabela `documentos_uploads`

Rastreamento de arquivos do editor armazenados no Backblaze B2.

```sql
create table public.documentos_uploads (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  nome_arquivo text not null,
  tipo_mime text not null,
  tamanho_bytes bigint not null,
  b2_key text not null,
  b2_url text not null,
  tipo_media text not null check (tipo_media in ('imagem', 'video', 'audio', 'pdf', 'outros')),
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_uploads_tamanho_positive check (tamanho_bytes > 0),
  constraint documentos_uploads_b2_key_unique unique (b2_key)
);
```

**Decisões de Design**:
- **Vínculo com documento**: Cada upload pertence a um documento
- **Backblaze B2**: Armazenamento consistente com resto do sistema
- **Tipo de mídia**: Categorização para filtros/relatórios
- **Unique constraint** em `b2_key`: Evita duplicatas

**RLS Policies**:
- **Select**: Usuários com acesso ao documento
- **Insert**: Usuários com permissão de edição no documento
- **Delete**: Criador do upload + criador do documento

---

### 6. Tabela `documentos_versoes`

Histórico completo de versões de documentos.

```sql
create table public.documentos_versoes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  versao integer not null,
  conteudo jsonb not null,
  titulo text not null,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_versoes_versao_positive check (versao > 0),
  constraint documentos_versoes_unique unique (documento_id, versao)
);
```

**Decisões de Design**:
- **Imutável**: Versões são apenas inseridas, nunca atualizadas
- **Constraint unique**: Um documento não pode ter duas versões com mesmo número
- **Snapshot completo**: Armazena conteúdo + título completos da versão

**Uso**:
- Antes de atualizar documento, salvar versão anterior em `documentos_versoes`
- Restauração: Copiar conteúdo da versão para o documento atual (criando nova versão)

---

### 7. Tabela `salas_chat`

Salas de chat (geral, por documento, privado).

```sql
create table public.salas_chat (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('geral', 'documento', 'privado')),
  documento_id bigint references public.documentos(id) on delete cascade,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint salas_chat_documento_tipo check (
    (tipo = 'documento' and documento_id is not null) or
    (tipo != 'documento' and documento_id is null)
  )
);
```

**Decisões de Design**:
- **Tipo "geral"**: Sala pública do escritório (todos podem participar)
- **Tipo "documento"**: Sala específica de um documento (usuários com acesso ao documento)
- **Tipo "privado"**: Chat direto entre usuários (futuro)

---

### 8. Tabela `mensagens_chat`

Mensagens do chat interno.

```sql
create table public.mensagens_chat (
  id bigint generated always as identity primary key,
  sala_id bigint not null references public.salas_chat(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  conteudo text not null,
  tipo text not null check (tipo in ('texto', 'arquivo', 'sistema')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, -- Soft delete

  constraint mensagens_chat_conteudo_not_empty check (char_length(conteudo) > 0)
);
```

**Decisões de Design**:
- **Tipo "texto"**: Mensagem de texto comum
- **Tipo "arquivo"**: Mensagem com arquivo anexado (URL no conteúdo)
- **Tipo "sistema"**: Notificações automáticas (ex: "Fulano entrou na sala")
- **Soft delete**: Mensagens deletadas não aparecem, mas ficam no histórico

---

## Upload para Backblaze B2

### Fluxo de Upload

```
┌─────────────┐        FormData        ┌──────────────────┐
│  Frontend   │ ──────────────────────> │  API Route       │
│  (Editor)   │                         │  /uploads        │
└─────────────┘                         └──────────────────┘
                                               │
                                               │ Validação (tipo, tamanho)
                                               ↓
                                        ┌──────────────────┐
                                        │  Upload Service  │
                                        └──────────────────┘
                                               │
                                               │ uploadToBackblaze()
                                               ↓
                                        ┌──────────────────┐
                                        │  Backblaze B2    │
                                        │  (S3-compatible) │
                                        └──────────────────┘
                                               │
                                               │ URL pública
                                               ↓
                                        ┌──────────────────┐
                                        │  PostgreSQL      │
                                        │  (documentos_    │
                                        │   uploads)       │
                                        └──────────────────┘
```

### Configuração

**Bucket**: `zattar-advogados` (já existe)

**Prefixo**: `editor/`

**Estrutura de Chaves**:
```
editor/
  doc_123/
    1638291234567_a1b2c3.jpg
    1638291245678_d4e5f6.pdf
  doc_456/
    1638291256789_g7h8i9.png
```

**Nomenclatura**:
```typescript
const timestamp = Date.now();
const randomStr = Math.random().toString(36).substring(2, 8);
const extensao = arquivo.name.split('.').pop();
const b2Key = `editor/doc_${documentoId}/${timestamp}_${randomStr}.${extensao}`;
```

### Validações

**Tipos MIME Permitidos**:
```typescript
const tiposPermitidos = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf',
];
```

**Tamanho Máximo**: 50 MB

### Serviço de Upload

```typescript
export async function uploadArquivo(
  documentoId: number,
  arquivo: File,
  userId: number
): Promise<DocumentoUpload> {
  // 1. Validar tipo MIME
  if (!tiposPermitidos.includes(arquivo.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${arquivo.type}`);
  }

  // 2. Validar tamanho
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (arquivo.size > maxSize) {
    throw new Error(`Arquivo muito grande. Máximo: 50MB`);
  }

  // 3. Determinar tipo de mídia
  let tipoMedia: 'imagem' | 'video' | 'audio' | 'pdf' | 'outros' = 'outros';
  if (arquivo.type.startsWith('image/')) tipoMedia = 'imagem';
  else if (arquivo.type.startsWith('video/')) tipoMedia = 'video';
  else if (arquivo.type.startsWith('audio/')) tipoMedia = 'audio';
  else if (arquivo.type === 'application/pdf') tipoMedia = 'pdf';

  // 4. Gerar nome único
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extensao = arquivo.name.split('.').pop();
  const nomeArquivo = `${timestamp}_${randomStr}.${extensao}`;
  const b2Key = `editor/doc_${documentoId}/${nomeArquivo}`;

  // 5. Converter File para Buffer
  const arrayBuffer = await arquivo.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 6. Upload para Backblaze B2
  const uploadResult = await uploadToBackblaze({
    buffer,
    key: b2Key,
    contentType: arquivo.type,
  });

  // 7. Registrar no banco
  const upload = await criarUpload({
    documento_id: documentoId,
    nome_arquivo: arquivo.name,
    tipo_mime: arquivo.type,
    tamanho_bytes: arquivo.size,
    b2_key: uploadResult.key,
    b2_url: uploadResult.url,
    tipo_media: tipoMedia,
    criado_por: userId,
  });

  return upload;
}
```

---

## Colaboração em Tempo Real

### Arquitetura Supabase Realtime

```
┌──────────────────────────────────────────────────────────────┐
│                      Editor (Frontend)                        │
│  ┌────────────────┬─────────────────┬──────────────────────┐ │
│  │  PlateEditor   │ RealtimeCursors │ RealtimeAvatarStack  │ │
│  └────────────────┴─────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Realtime                           │
│  ┌────────────────┬─────────────────┬──────────────────────┐ │
│  │   Presence     │   Broadcast     │     Postgres CDC     │ │
│  │  (online users)│ (cursor/edits)  │  (auto-save changes) │ │
│  └────────────────┴─────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Canais Realtime

**Canal por Documento**:
```typescript
const canal = supabase.channel(`documento:${documentoId}`)

// Presence: Usuários online
canal.on('presence', { event: 'sync' }, () => {
  const state = canal.presenceState()
  // Atualizar lista de usuários online
})

// Broadcast: Alterações de conteúdo
canal.on('broadcast', { event: 'content-change' }, (payload) => {
  // Aplicar alterações de outros usuários
})

// Broadcast: Posição de cursor
canal.on('broadcast', { event: 'cursor-move' }, (payload) => {
  // Atualizar cursor de outro usuário
})

canal.subscribe()
```

### Estratégia de Sincronização

**Opção 1: Operational Transformation (OT)**
- Mais complexo de implementar
- Melhor para conflitos complexos
- Biblioteca: `ot.js`

**Opção 2: Last-Write-Wins (LWW)**
- Mais simples
- Última alteração sobrescreve
- Adequado para editor rico (Plate.js)

**Implementação Escolhida**: **Last-Write-Wins com Debounce**

```typescript
const [content, setContent] = useState(initialContent);
const debouncedContent = useDebounce(content, 2000);

// Auto-save local
useEffect(() => {
  if (debouncedContent === initialContent) return;

  async function autoSave() {
    await fetch(`/api/documentos/${id}/auto-save`, {
      method: 'POST',
      body: JSON.stringify({ conteudo: debouncedContent }),
    });
  }

  autoSave();
}, [debouncedContent]);

// Broadcast de alterações
useEffect(() => {
  if (!canal) return;

  const interval = setInterval(() => {
    if (content !== lastBroadcastContent) {
      canal.send({
        type: 'broadcast',
        event: 'content-change',
        payload: { content, userId },
      });
      setLastBroadcastContent(content);
    }
  }, 500); // Broadcast a cada 500ms se houver mudanças

  return () => clearInterval(interval);
}, [content, canal]);

// Receber alterações de outros usuários
useEffect(() => {
  if (!canal) return;

  const subscription = canal
    .on('broadcast', { event: 'content-change' }, (payload) => {
      if (payload.userId !== currentUserId) {
        // Aplicar alteração (com merge inteligente)
        setContent(payload.content);
      }
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [canal]);
```

### Componentes Realtime

**1. RealtimeCursors**:
```typescript
<RealtimeCursors
  roomName={`documento:${documentoId}`}
  username={currentUser.nome}
/>
```

**2. RealtimeAvatarStack**:
```typescript
<RealtimeAvatarStack
  roomName={`documento:${documentoId}`}
/>
```

---

## Chat Interno

### Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                    Chat Interface (Frontend)                  │
│  ┌────────────────┬─────────────────┬──────────────────────┐ │
│  │  RealtimeChat  │  Salas de Chat  │   Notificações       │ │
│  └────────────────┴─────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Realtime                           │
│  ┌────────────────┬─────────────────┬──────────────────────┐ │
│  │   Broadcast    │   Postgres CDC  │                      │ │
│  │  (new messages)│ (persistence)   │                      │ │
│  └────────────────┴─────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────────────────────────────────────────────────┐
│                      PostgreSQL                               │
│  ┌────────────────┬─────────────────────────────────────────┐│
│  │  salas_chat    │    mensagens_chat                       ││
│  └────────────────┴─────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Tipos de Salas

1. **Sala Geral**:
   - Tipo: `geral`
   - Todos os usuários do escritório
   - Criada automaticamente na inicialização

2. **Sala de Documento**:
   - Tipo: `documento`
   - Usuários com acesso ao documento
   - Criada automaticamente ao abrir documento

3. **Sala Privada** (futuro):
   - Tipo: `privado`
   - Chat 1-on-1 entre usuários

### Integração com RealtimeChat

```typescript
import { RealtimeChat } from '@/components/realtime-chat'

export default function ChatPage() {
  const { data: mensagens } = useMessagesQuery(salaId);

  const handleMessage = async (mensagens: ChatMessage[]) => {
    // Persistir mensagens no PostgreSQL
    await fetch(`/api/chat/salas/${salaId}/mensagens`, {
      method: 'POST',
      body: JSON.stringify({ conteudo: mensagens[0].content }),
    });
  };

  return (
    <RealtimeChat
      roomName={`chat:sala:${salaId}`}
      username={currentUser.nome}
      messages={mensagens}
      onMessage={handleMessage}
    />
  );
}
```

### Persistência de Mensagens

**Fluxo**:
1. Usuário digita mensagem
2. Frontend envia via `onMessage` callback → API
3. API salva em `mensagens_chat`
4. API faz broadcast via Realtime → Outros usuários
5. Frontend de outros usuários recebe via WebSocket

**Vantagens**:
- Histórico completo no banco
- Mensagens persistem mesmo offline
- Sincronização automática ao reconectar

---

## Auto-Save Strategy

### Requisitos

1. **Não bloquear** a edição do usuário
2. **Debounce** de 2 segundos (evitar requisições excessivas)
3. **Feedback visual** (salvando/salvo)
4. **Versionamento diferenciado**: Auto-save não incrementa versão

### Implementação

```typescript
const [content, setContent] = useState(initialContent);
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

const debouncedContent = useDebounce(content, 2000);

useEffect(() => {
  if (debouncedContent === initialContent) return;

  async function autoSave() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/documentos/${id}/auto-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: debouncedContent }),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      setLastSaved(new Date());
    } catch (error) {
      console.error('Erro ao auto-salvar:', error);
      toast.error('Erro ao salvar documento');
    } finally {
      setIsSaving(false);
    }
  }

  autoSave();
}, [debouncedContent, id, initialContent]);
```

**Indicador Visual**:
```tsx
<div className="absolute top-2 right-2 text-xs text-muted-foreground">
  {isSaving ? 'Salvando...' : lastSaved ? `Salvo ${lastSaved.toLocaleTimeString()}` : ''}
</div>
```

### Endpoint Dedicado

`POST /api/documentos/[id]/auto-save`

**Diferença do `PUT /api/documentos/[id]`**:
- **Não incrementa versão**
- **Apenas atualiza `conteudo` e `updated_at`**
- **Não cria entrada em `documentos_versoes`**

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentoId = parseInt(params.id, 10);
  const body = await request.json();

  // Auto-save: apenas conteúdo, sem incremento de versão
  const { data, error } = await supabase
    .from('documentos')
    .update({
      conteudo: body.conteudo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
```

---

## Soft Delete Implementation

### Conceito

Documentos e pastas deletados vão para "lixeira" e podem ser restaurados em 30 dias.

### Schema

Todas as tabelas relevantes têm campo `deleted_at`:
```sql
deleted_at timestamptz
```

### Serviço de Delete

```typescript
export async function deletarDocumento(
  id: number,
  userId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Soft delete: setar deleted_at
  const { error } = await supabase
    .from('documentos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('criado_por', userId); // Apenas criador pode deletar

  if (error) {
    throw new Error(`Erro ao deletar documento: ${error.message}`);
  }
}
```

### Lixeira

**Listar Documentos Deletados**:
```typescript
export async function listarDocumentosDeletados(
  userId: number
): Promise<Documento[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('criado_por', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar documentos deletados: ${error.message}`);
  }

  return data;
}
```

**Restaurar Documento**:
```typescript
export async function restaurarDocumento(
  id: number,
  userId: number
): Promise<Documento> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('criado_por', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar documento: ${error.message}`);
  }

  return data;
}
```

**Deletar Permanentemente**:
```typescript
export async function deletarPermanentemente(
  id: number,
  userId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Hard delete: remover do banco
  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id)
    .eq('criado_por', userId)
    .not('deleted_at', 'is', null); // Apenas itens já soft-deleted

  if (error) {
    throw new Error(`Erro ao deletar permanentemente: ${error.message}`);
  }
}
```

### Job de Limpeza

Deletar permanentemente documentos após 30 dias:

```typescript
// backend/jobs/limpar-lixeira.job.ts
export async function limparLixeira() {
  const supabase = createServiceClient();

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);

  const { error } = await supabase
    .from('documentos')
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', dataLimite.toISOString());

  if (error) {
    console.error('Erro ao limpar lixeira:', error);
  } else {
    console.log('Lixeira limpa com sucesso');
  }
}
```

**Agendamento** (cron job):
```typescript
// Executar diariamente à meia-noite
cron.schedule('0 0 * * *', () => {
  limparLixeira();
});
```

---

## Sistema de Permissões Customizado

### Requisitos

- **NÃO integrar** com sistema de 82 permissões existente
- Permissões **a nível de item** (documento/pasta)
- Criador define permissões ao compartilhar
- Configurável (não hard-coded)

### Modelo de Permissões

**Níveis**:
1. **Criador**: Controle total (editar, deletar, compartilhar)
2. **Compartilhado com "editar"**: Pode editar, não pode deletar
3. **Compartilhado com "visualizar"**: Apenas leitura

### RLS Policies

**Documentos - Update**:
```sql
create policy "Usuários podem editar documentos próprios ou compartilhados com permissão"
  on public.documentos
  for update
  to authenticated
  using (
    criado_por = (select auth.uid()::bigint)
    or exists (
      select 1 from public.documentos_compartilhados dc
      where dc.documento_id = documentos.id
      and dc.usuario_id = (select auth.uid()::bigint)
      and dc.permissao = 'editar'
    )
  );
```

**Documentos - Delete**:
```sql
create policy "Usuários podem deletar documentos próprios"
  on public.documentos
  for delete
  to authenticated
  using (criado_por = (select auth.uid()::bigint));
```

**Pastas - Update**:
```sql
create policy "Usuários podem atualizar pastas próprias ou comuns"
  on public.pastas
  for update
  to authenticated
  using (criado_por = (select auth.uid()::bigint) or tipo = 'comum');
```

**Pastas - Delete**:
```sql
create policy "Usuários podem deletar pastas próprias"
  on public.pastas
  for delete
  to authenticated
  using (criado_por = (select auth.uid()::bigint));
```

### Validação no Backend

```typescript
export async function verificarPermissao(
  documentoId: number,
  userId: number,
  permissaoRequerida: 'visualizar' | 'editar' | 'deletar'
): Promise<boolean> {
  const supabase = createServiceClient();

  // Verificar se é criador
  const { data: documento } = await supabase
    .from('documentos')
    .select('criado_por')
    .eq('id', documentoId)
    .single();

  if (documento?.criado_por === userId) {
    return true; // Criador tem todas as permissões
  }

  // Verificar compartilhamento
  const { data: compartilhamento } = await supabase
    .from('documentos_compartilhados')
    .select('permissao')
    .eq('documento_id', documentoId)
    .eq('usuario_id', userId)
    .single();

  if (!compartilhamento) {
    return false; // Não tem acesso
  }

  if (permissaoRequerida === 'visualizar') {
    return true; // Qualquer compartilhamento permite visualizar
  }

  if (permissaoRequerida === 'editar') {
    return compartilhamento.permissao === 'editar';
  }

  if (permissaoRequerida === 'deletar') {
    return false; // Apenas criador pode deletar
  }

  return false;
}
```

---

## Exportação

### DOCX

**Plugin**: `@platejs/docx` (já instalado)

**Serviço**:
```typescript
import { plateToDocx } from '@platejs/docx';

export async function exportarDocx(
  documentoId: number,
  userId: number
): Promise<Buffer> {
  // 1. Buscar documento
  const documento = await buscarDocumentoPorId(documentoId, userId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // 2. Converter Plate.js → DOCX
  const docxBuffer = await plateToDocx(documento.conteudo);

  return docxBuffer;
}
```

**API Route**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentoId = parseInt(params.id, 10);
  const buffer = await exportarDocx(documentoId, authResult.userId);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="documento_${documentoId}.docx"`,
    },
  });
}
```

### PDF

**Opções**:
1. **Puppeteer**: HTML → PDF (mais robusto)
2. **jsPDF**: Gerar PDF diretamente (mais leve)

**Implementação Escolhida**: **Puppeteer**

```typescript
import puppeteer from 'puppeteer';

export async function exportarPdf(
  documentoId: number,
  userId: number
): Promise<Buffer> {
  // 1. Buscar documento
  const documento = await buscarDocumentoPorId(documentoId, userId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // 2. Converter Plate.js → HTML
  const html = plateToHtml(documento.conteudo);

  // 3. Renderizar HTML → PDF usando Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}
```

---

## Performance e Otimizações

### Paginação

**Obrigatória** para todas as listagens:
- Máximo: 200 itens por página
- Default: 50 itens por página

### Lazy Loading

**Conteúdo de Documentos**:
- Listagens **NÃO incluem** campo `conteudo` (apenas título, criado_por, etc)
- Conteúdo carregado apenas ao abrir documento

```typescript
// Listar documentos: sem conteúdo
const { data } = await supabase
  .from('documentos')
  .select('id, titulo, criado_por, created_at, updated_at')
  .eq('criado_por', userId);

// Buscar documento: com conteúdo
const { data } = await supabase
  .from('documentos')
  .select('*')
  .eq('id', documentoId)
  .single();
```

### Cache Redis

**Listagens**:
- TTL: 5 minutos
- Cache key: `documentos:list:user_${userId}:pasta_${pastaId}`

**Templates Públicos**:
- TTL: 15 minutos
- Cache key: `templates:publicos`

**Invalidação**:
```typescript
export async function invalidarCacheDocumentos(userId: number) {
  const redis = getRedisClient();
  const pattern = `documentos:list:user_${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Índices Críticos

- **Busca textual**: GIN trigram em `titulo`
- **Filtro por pasta**: btree em `pasta_id`
- **Filtro por tags**: GIN em `tags`
- **Soft delete**: btree em `deleted_at` (where deleted_at is not null)

---

## Segurança

### Validações

**Input Sanitization**:
- Escapar HTML no conteúdo (Plate.js já faz)
- Validar tamanhos de campos
- Validar tipos MIME de uploads

**Rate Limiting**:
- Exportação PDF/DOCX: 10 requisições por minuto por usuário
- Upload: 20 arquivos por minuto por usuário

### Auditoria

**Campos de Auditoria**:
- `created_at`: Data de criação
- `updated_at`: Data da última atualização
- `criado_por`: Quem criou
- `editado_por`: Quem editou por último
- `compartilhado_por`: Quem compartilhou

**Logs**:
- Compartilhamento de documentos
- Restauração de versões
- Deleção permanente

---

## Migração e Rollback

### Migração de UploadThing para Backblaze B2

**Passos**:
1. Implementar novo sistema de upload com B2
2. Testar em ambiente de desenvolvimento
3. Deployar código novo (com suporte a ambos os sistemas)
4. Migrar arquivos existentes (se houver)
5. Remover código UploadThing

**Rollback**:
- Manter UploadThing temporariamente (flag de feature)
- Rollback: reverter flag + restaurar código

### Migração de Dados

**Se houver documentos existentes**:
```sql
-- Migrar notas para documentos
insert into public.documentos (titulo, conteudo, criado_por, created_at, updated_at)
select
  coalesce(titulo, 'Sem título'),
  jsonb_build_array(jsonb_build_object('type', 'p', 'children', jsonb_build_array(jsonb_build_object('text', conteudo)))),
  usuario_id,
  created_at,
  updated_at
from public.notas;
```
