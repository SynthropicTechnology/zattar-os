# Dify API - Referência Completa & Mapa de Integração

> Documentação gerada a partir da API oficial do Dify (docs.dify.ai).
> Atualizada em: 2026-02-17

---

## Sumário

- [Autenticação](#autenticação)
- [1. Chat API](#1-chat-api)
- [2. Chatflow API (Advanced Chat)](#2-chatflow-api-advanced-chat)
- [3. Completion API](#3-completion-api)
- [4. Workflow API](#4-workflow-api)
- [5. Conversations API](#5-conversations-api)
- [6. Messages API](#6-messages-api)
- [7. Audio API (TTS / STT)](#7-audio-api-tts--stt)
- [8. Files API](#8-files-api)
- [9. Annotations API](#9-annotations-api)
- [10. App Info API](#10-app-info-api)
- [11. Knowledge Base (Datasets) API](#11-knowledge-base-datasets-api)
- [12. Documents API](#12-documents-api)
- [13. Chunks (Segments) API](#13-chunks-segments-api)
- [14. Knowledge Base Tags API](#14-knowledge-base-tags-api)
- [15. Models API](#15-models-api)
- [Mapa de Cobertura](#mapa-de-cobertura)
- [Gaps & Próximos Passos](#gaps--próximos-passos)

---

## Autenticação

Todas as requisições usam Bearer Token via header:

```
Authorization: Bearer {api_key}
```

**Base URL**: `https://api.dify.ai/v1` (ou self-hosted)

**Tipos de chave**:
- **App API Key**: Para acessar endpoints de Chat, Completion, Workflow, Conversations, Messages, Audio, Files, App Info
- **Dataset API Key**: Para acessar endpoints de Knowledge Base, Documents, Chunks, Tags

---

## 1. Chat API

### POST `/chat-messages` ✅ Implementado

Envia mensagem para app tipo Chat. Suporta blocking e streaming (SSE).

**Request Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `query` | string | Sim | Conteúdo da pergunta do usuário |
| `user` | string | Sim | Identificador único do usuário |
| `inputs` | object | Não | Variáveis definidas no app. Default: `{}` |
| `response_mode` | enum | Não | `streaming` (recomendado, SSE) ou `blocking`. Default: `streaming` |
| `conversation_id` | string | Não | ID da conversa para continuar. Omitir para nova conversa |
| `files` | object[] | Não | Lista de arquivos (imagens para Vision) |
| `auto_generate_name` | boolean | Não | Auto-gerar título da conversa. Default: `true` |

**Files object:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | enum | `image` |
| `transfer_method` | enum | `remote_url` ou `local_file` |
| `url` | string | URL da imagem (se remote_url) |
| `upload_file_id` | string | ID do arquivo upload (se local_file) |

**Response (blocking):**
```json
{
  "event": "message",
  "task_id": "uuid",
  "message_id": "uuid",
  "conversation_id": "uuid",
  "mode": "chat",
  "answer": "Resposta do modelo",
  "metadata": {
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 20,
      "total_tokens": 70,
      "total_price": "0.00009",
      "currency": "USD",
      "latency": 1500
    },
    "retriever_resources": [
      {
        "position": 1,
        "dataset_id": "uuid",
        "dataset_name": "string",
        "document_id": "uuid",
        "document_name": "string",
        "segment_id": "uuid",
        "score": 0.95,
        "content": "string"
      }
    ]
  },
  "created_at": 1678886400
}
```

**Response (streaming) — Eventos SSE:**
- `message` — Token incremental da resposta
- `message_end` — Fim da mensagem, contém metadata/usage
- `message_replace` — Substituição de conteúdo (moderação)
- `agent_message` — Token de resposta do agente
- `agent_thought` — Pensamento do agente (tool calls, raciocínio)
- `error` — Erro no stream
- `ping` — Keep-alive

---

### POST `/chat-messages/{task_id}/stop` ✅ Implementado

Para a geração de resposta em andamento.

**Request Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `user` | string | Sim | Identificador do usuário |

**Response:** `{ "result": "success" }`

---

## 2. Chatflow API (Advanced Chat)

> Diferente do Chat básico: Chatflow suporta variáveis de sessão, memória persistente, e eventos de workflow (node_started, node_finished).

### POST `/chat-messages` (com eventos de workflow) ❌ Parcialmente

Chatflow usa o **mesmo endpoint** `/chat-messages`, mas retorna eventos adicionais no streaming:
- `workflow_started` — Início do workflow
- `node_started` — Início de um nó
- `node_finished` — Fim de um nó
- `workflow_finished` — Fim do workflow

> **Nota**: O client atual já suporta esses eventos no `DifyStreamEventType`, mas não há tratamento específico para Chatflow vs Chat no serviço.

---

## 3. Completion API

### POST `/completion-messages` ✅ Implementado

Gera texto sem contexto de conversa. Suporta blocking e streaming.

**Request Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `inputs` | object | Sim | Variáveis do app |
| `user` | string | Sim | Identificador do usuário |
| `response_mode` | enum | Não | `streaming` ou `blocking` |
| `files` | object[] | Não | Arquivos para Vision |

**Response (blocking):**
```json
{
  "event": "message",
  "task_id": "uuid",
  "message_id": "uuid",
  "mode": "completion",
  "answer": "Texto gerado",
  "metadata": { "usage": { ... }, "retriever_resources": [...] },
  "created_at": 1678886400
}
```

---

### POST `/completion-messages/{task_id}/stop` ❌ Não implementado

Para a geração de completion em andamento.

**Request Body:** `{ "user": "user_id" }`

---

## 4. Workflow API

### POST `/workflows/run` ✅ Implementado

Executa workflow. Suporta blocking e streaming.

**Request Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `inputs` | object | Sim | Variáveis do workflow. File arrays usam `InputFileObjectWorkflow` |
| `response_mode` | enum | Sim | `streaming` ou `blocking` |
| `user` | string | Sim | Identificador do usuário |

**Response (blocking):**
```json
{
  "workflow_run_id": "uuid",
  "task_id": "uuid",
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "running|succeeded|failed|stopped",
    "outputs": {},
    "error": "string|null",
    "elapsed_time": 123,
    "total_tokens": 123,
    "total_steps": 5,
    "created_at": 1678886400,
    "finished_at": 1678886500
  }
}
```

**Eventos SSE (streaming):**
- `workflow_started` — `{ workflow_run_id, data: { id, workflow_id, sequence_number, created_at } }`
- `node_started` — `{ workflow_run_id, data: { id, node_id, node_type, title, index, inputs, created_at } }`
- `node_finished` — `{ workflow_run_id, data: { id, node_id, status, outputs, elapsed_time, execution_metadata } }`
- `workflow_finished` — `{ workflow_run_id, data: { id, status, outputs, error, elapsed_time, total_tokens, total_steps, created_at, finished_at } }`
- `text_chunk` — Chunks de texto intermediários
- `error` — Erro
- `ping` — Keep-alive

---

### POST `/workflows/tasks/{task_id}/stop` ✅ Implementado

Para execução de workflow em andamento.

**Path Params:** `task_id` (do streaming chunk)
**Request Body:** `{ "user": "user_id" }`

---

### GET `/workflows/run/{workflow_run_id}` ✅ Implementado

Obtém detalhes de uma execução de workflow.

**Response:**
```json
{
  "id": "uuid",
  "workflow_id": "uuid",
  "status": "running|succeeded|failed|stopped",
  "inputs": "JSON string",
  "outputs": {},
  "error": "string|null",
  "total_steps": 5,
  "total_tokens": 1000,
  "created_at": 1678886400,
  "finished_at": 1678886500,
  "elapsed_time": 100
}
```

---

### GET `/workflows/logs` ❌ Não implementado

Lista logs de execução de workflows com filtros e paginação.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `keyword` | string | Busca por palavra-chave |
| `status` | enum | `succeeded`, `failed`, `stopped`, `running` |
| `page` | integer | Página atual. Default: 1 |
| `limit` | integer | Itens por página. Default: 20 |

**Response:**
```json
{
  "page": 1,
  "limit": 20,
  "total": 50,
  "has_more": true,
  "data": [
    {
      "id": "uuid",
      "workflow_run": {
        "id": "uuid",
        "version": "v1.0",
        "status": "succeeded",
        "error": null,
        "elapsed_time": 15,
        "total_tokens": 1000,
        "total_steps": 5,
        "created_at": 1678886400,
        "finished_at": 1678886500
      },
      "created_from": "API",
      "created_by_role": "user",
      "created_by_account": "acc_id",
      "created_by_end_user": {
        "id": "user_id",
        "type": "customer",
        "is_anonymous": false,
        "session_id": "sess_id"
      },
      "created_at": 1678886400
    }
  ]
}
```

---

## 5. Conversations API

### GET `/conversations` ✅ Implementado

Lista conversas do usuário.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | string | **Obrigatório**. ID do usuário |
| `last_id` | string | ID do último item (paginação cursor-based) |
| `limit` | integer | Itens por página. Default: 20. Max: 100 |
| `sort_by` | enum | `-created_at` (desc) ou `created_at` (asc). Default: `-updated_at` |

---

### GET `/conversations/{conversation_id}/messages` ❌ Não implementado

Obtém mensagens de uma conversa específica.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | string | **Obrigatório**. ID do usuário |
| `first_id` | string | ID da primeira mensagem (paginação) |
| `limit` | integer | Itens por página. Default: 20 |

---

### PATCH `/conversations/{conversation_id}/name` ❌ Não implementado

Renomeia uma conversa.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Novo nome. Vazio = auto-gerar |
| `auto_generate` | boolean | Auto-gerar nome. Default: false |
| `user` | string | **Obrigatório**. ID do usuário |

---

### DELETE `/conversations/{conversation_id}` ❌ Não implementado

Exclui uma conversa.

**Request Body:** `{ "user": "user_id" }`

---

### GET `/conversations/{conversation_id}/variables` ❌ Não implementado

Obtém variáveis de sessão de uma conversa (Chatflow).

---

## 6. Messages API

### GET `/messages` ✅ Implementado

Lista mensagens com paginação.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | string | **Obrigatório**. ID do usuário |
| `conversation_id` | string | **Obrigatório**. ID da conversa |
| `first_id` | string | ID da primeira mensagem (cursor pagination) |
| `limit` | integer | Itens por página. Default: 20 |

---

### POST `/messages/{message_id}/feedbacks` ✅ Implementado

Envia feedback (like/dislike) para uma mensagem.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rating` | enum | `like`, `dislike`, ou `null` (revogar) |
| `user` | string | **Obrigatório**. ID do usuário |
| `content` | string | Conteúdo textual do feedback |

---

### GET `/messages/{message_id}/suggested` ✅ Implementado

Obtém perguntas sugeridas para próxima interação.

**Query Params:** `user` (obrigatório)

**Response:** `{ "result": "success", "data": ["Pergunta 1?", "Pergunta 2?", ...] }`

---

## 7. Audio API (TTS / STT)

### POST `/audio/speech-to-text` ❌ Não implementado

Converte áudio em texto.

**Request Body (multipart/form-data):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `file` | file | **Obrigatório**. Arquivo de áudio |
| `user` | string | **Obrigatório**. ID do usuário |

**Formatos suportados**: mp3, mp4, mpeg, mpga, m4a, wav, webm
**Tamanho máximo**: 15MB

**Response:**
```json
{ "text": "Texto transcrito do áudio" }
```

---

### POST `/text-to-audio` ❌ Não implementado

Converte texto em áudio.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `text` | string | Texto para converter (se não message_id) |
| `message_id` | string | ID da mensagem Dify para sintetizar |
| `user` | string | **Obrigatório**. ID do usuário |
| `streaming` | boolean | Streaming de áudio. Default: false |

**Response**: Arquivo de áudio (binary)

---

## 8. Files API

### POST `/files/upload` ✅ Implementado

Upload de arquivo para uso em mensagens.

**Request Body (multipart/form-data):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `file` | file | **Obrigatório**. Arquivo para upload |
| `user` | string | **Obrigatório**. ID do usuário |

**Tipos suportados**: Imagens (png, jpg, jpeg, gif, webp, svg), documentos (TXT, MD, PDF, DOCX, XLSX, CSV), áudio, vídeo
**Tamanho máximo**: 15MB

**Response:**
```json
{
  "id": "uuid",
  "name": "arquivo.png",
  "size": 12345,
  "extension": "png",
  "mime_type": "image/png",
  "created_by": "user_id",
  "created_at": 1678886400
}
```

---

### GET `/files/{file_id}/preview` ❌ Não implementado

Preview/download de arquivo.

---

### POST `/files/upload-workflow` ❌ Não implementado

Upload de arquivo específico para uso em Workflows (diferente do upload normal).

---

## 9. Annotations API

> Annotations são respostas diretas configuradas manualmente. Quando o modelo identifica similaridade com uma anotação, retorna a resposta anotada em vez de gerar.

### GET `/annotations` ❌ Não implementado

Lista todas as anotações.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `page` | integer | Página atual. Default: 1 |
| `limit` | integer | Itens por página. Default: 20 |

---

### POST `/annotations` ❌ Não implementado

Cria uma nova anotação.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `question` | string | **Obrigatório**. Pergunta |
| `answer` | string | **Obrigatório**. Resposta configurada |

---

### PATCH `/annotations/{annotation_id}` ❌ Não implementado

Atualiza uma anotação existente.

**Request Body:** `{ "question": "...", "answer": "..." }`

---

### DELETE `/annotations/{annotation_id}` ❌ Não implementado

Exclui uma anotação.

---

### POST `/apps/annotation-reply/enable` ❌ Não implementado

Habilita o sistema de resposta por anotação.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `score_threshold` | number | Limiar de similaridade (0-1). Default: 0.9 |
| `embedding_model_provider` | string | Provedor do modelo de embedding |
| `embedding_model_name` | string | Nome do modelo de embedding |

---

### POST `/apps/annotation-reply/disable` ❌ Não implementado

Desabilita o sistema de resposta por anotação.

---

### GET `/apps/annotation-reply/{action}/status/{job_id}` ❌ Não implementado

Consulta status do job de habilitação/desabilitação de anotações.

---

## 10. App Info API

### GET `/info` ✅ Implementado

Obtém informações básicas do app (nome, descrição, tags, ícone).

---

### GET `/parameters` ✅ Implementado

Obtém parâmetros configurados do app (formulário de entrada, sugestões, etc).

**Response:**
```json
{
  "opening_statement": "Olá! Como posso ajudar?",
  "suggested_questions": ["Pergunta 1", "Pergunta 2"],
  "suggested_questions_after_answer": { "enabled": true },
  "speech_to_text": { "enabled": false },
  "retriever_resource": { "enabled": true },
  "annotation_reply": { "enabled": false },
  "user_input_form": [
    {
      "text-input": {
        "label": "Nome",
        "variable": "nome",
        "required": true,
        "max_length": 100,
        "default": ""
      }
    }
  ],
  "file_upload": {
    "image": {
      "enabled": true,
      "number_limits": 3,
      "transfer_methods": ["remote_url", "local_file"]
    }
  },
  "system_parameters": {
    "file_size_limit": 15,
    "image_file_size_limit": 10,
    "audio_file_size_limit": 50,
    "video_file_size_limit": 100
  }
}
```

---

### GET `/meta` ✅ Implementado

Obtém meta informações do app (ícones de ferramentas).

**Response:**
```json
{
  "tool_icons": {
    "dalle2": "https://...",
    "api_tool": { "background": "#FFF", "content": "🔧" }
  }
}
```

---

### GET `/apps/{app_id}/feedbacks` ❌ Não implementado

Lista feedbacks de um app específico.

---

## 11. Knowledge Base (Datasets) API

> **Autenticação**: Usa Dataset API Key (diferente da App API Key).

### GET `/datasets` ✅ Implementado

Lista Knowledge Bases.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `page` | integer | Página. Default: 1 |
| `limit` | integer | Itens por página. Default: 20. Max: 100 |

---

### POST `/datasets` ✅ Implementado

Cria uma Knowledge Base vazia.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | **Obrigatório**. Nome |
| `description` | string | Descrição |
| `indexing_technique` | enum | `high_quality` ou `economy`. Default: `high_quality` |
| `permission` | enum | `only_me`, `all_team_members`, `partial_members` |
| `provider` | enum | `vendor` (modelo provedor) ou `external` (knowledge base externa) |
| `external_knowledge_api_id` | string | ID da API externa (se provider=external) |
| `external_knowledge_id` | string | ID do conhecimento externo |

---

### GET `/datasets/{dataset_id}` ✅ Implementado

Obtém detalhes de uma Knowledge Base.

---

### PATCH `/datasets/{dataset_id}` ✅ Implementado

Atualiza uma Knowledge Base.

---

### DELETE `/datasets/{dataset_id}` ✅ Implementado

Exclui uma Knowledge Base.

---

### POST `/datasets/{dataset_id}/retrieve` ❌ Não implementado

Testa recuperação de chunks da Knowledge Base (busca semântica).

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `query` | string | **Obrigatório**. Texto de busca |
| `retrieval_model` | object | Configuração de retrieval |
| `external_retrieval_model` | object | Configuração externa |

**Response:**
```json
{
  "query": { "content": "texto buscado" },
  "records": [
    {
      "segment": {
        "id": "uuid",
        "position": 1,
        "document_id": "uuid",
        "content": "Conteúdo do chunk",
        "word_count": 50,
        "tokens": 80,
        "keywords": ["termo1", "termo2"],
        "hit_count": 5,
        "score": 0.95
      }
    }
  ]
}
```

---

## 12. Documents API

### GET `/datasets/{dataset_id}/documents` ✅ Implementado

Lista documentos de uma Knowledge Base.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `keyword` | string | Busca por palavra-chave |
| `page` | integer | Página. Default: 1 |
| `limit` | integer | Itens por página. Default: 20 |

---

### POST `/datasets/{dataset_id}/document/create_by_text` ✅ Implementado

Cria documento a partir de texto.

**Request Body:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | **Obrigatório**. Nome do documento |
| `text` | string | **Obrigatório**. Conteúdo |
| `indexing_technique` | enum | `high_quality` ou `economy` |
| `doc_form` | enum | `text_model` ou `qa_model` |
| `doc_language` | string | ISO 639-1 (ex: `pt-BR`, `en`) |
| `process_rule` | object | Regras de processamento |

**process_rule:**
```json
{
  "mode": "automatic|custom",
  "rules": {
    "pre_processing_rules": [
      { "id": "remove_extra_spaces", "enabled": true },
      { "id": "remove_urls_emails", "enabled": true }
    ],
    "segmentation": {
      "separator": "###",
      "max_tokens": 500
    }
  }
}
```

---

### POST `/datasets/{dataset_id}/document/create-by-file` ❌ Não implementado

Cria documento a partir de upload de arquivo.

**Request Body (multipart/form-data):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `file` | file | **Obrigatório**. Arquivo para upload |
| `data` | string | JSON com configurações (indexing_technique, process_rule) |

**Formatos suportados**: TXT, MD, MDOC, PDF, HTML, XLSX, XLS, DOCX, CSV, EML, MSG, PPTX, PPT, XML, EPUB

---

### GET `/documents/{document_id}` ❌ Não implementado

Obtém detalhes de um documento específico.

---

### PATCH `/documents/{document_id}/text` ❌ Não implementado

Atualiza documento com novo texto.

---

### PATCH `/documents/{document_id}/file` ❌ Não implementado

Atualiza documento com novo arquivo.

---

### DELETE `/datasets/{dataset_id}/documents/{document_id}` ✅ Implementado

Exclui um documento.

---

### GET `/documents/batch-embedding-status` ❌ Não implementado

Verifica status de embedding em batch.

**Query Params:** `batch` (ID do batch)

---

### PATCH `/documents/batch-status` ❌ Não implementado

Atualiza status de documentos em batch (habilitar/desabilitar).

---

## 13. Chunks (Segments) API

> Gerencia chunks/segmentos dentro de documentos. Essencial para controle granular da Knowledge Base.

### GET `/datasets/{dataset_id}/documents/{document_id}/segments` ❌ Não implementado

Lista segmentos de um documento.

**Query Params:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `keyword` | string | Busca |
| `status` | enum | `completed`, `indexing`, `error` |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "position": 1,
      "document_id": "uuid",
      "content": "Conteúdo do segmento",
      "answer": "Resposta (modo Q&A)",
      "word_count": 50,
      "tokens": 80,
      "keywords": ["termo1"],
      "index_node_id": "uuid",
      "index_node_hash": "hash",
      "hit_count": 5,
      "enabled": true,
      "disabled_at": null,
      "disabled_by": null,
      "status": "completed",
      "created_by": "uuid",
      "created_at": 1678886400,
      "indexing_at": 1678886400,
      "completed_at": 1678886500,
      "error": null,
      "stopped_at": null
    }
  ],
  "doc_form": "text_model"
}
```

---

### POST `/datasets/{dataset_id}/documents/{document_id}/segments` ❌ Não implementado

Adiciona segmentos a um documento.

**Request Body:**
```json
{
  "segments": [
    {
      "content": "Conteúdo do segmento",
      "answer": "Resposta (modo Q&A, opcional)",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}
```

---

### PATCH `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` ❌ Não implementado

Atualiza um segmento.

---

### DELETE `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` ❌ Não implementado

Exclui um segmento.

---

### Child Chunks (Hierárquicos) ❌ Não implementado

- **POST** `/chunks/{chunk_id}/children` — Cria chunk filho
- **GET** `/chunks/{chunk_id}/children` — Lista chunks filhos
- **PATCH** `/chunks/{parent_id}/children/{child_id}` — Atualiza chunk filho
- **DELETE** `/chunks/{parent_id}/children/{child_id}` — Exclui chunk filho
- **GET** `/chunks/{chunk_id}` — Detalhe do chunk
- **PATCH** `/chunks/{chunk_id}` — Atualiza chunk
- **DELETE** `/chunks/{chunk_id}` — Exclui chunk

---

## 14. Knowledge Base Tags API

> Tags para organizar e categorizar Knowledge Bases.

### GET `/tags` ❌ Não implementado

Lista todas as tags de Knowledge Base.

### POST `/tags` ❌ Não implementado

Cria nova tag. **Body:** `{ "name": "string" }`

### PATCH `/tags/{tag_id}` ❌ Não implementado

Renomeia tag.

### DELETE `/tags/{tag_id}` ❌ Não implementado

Exclui tag.

### POST `/datasets/{dataset_id}/tags` ❌ Não implementado

Associa tag a uma Knowledge Base. **Body:** `{ "tag_ids": ["uuid1", "uuid2"] }`

### GET `/datasets/{dataset_id}/tags` ❌ Não implementado

Lista tags de uma Knowledge Base.

### DELETE `/datasets/{dataset_id}/tags/{tag_id}` ❌ Não implementado

Remove associação de tag.

---

## 15. Models API

### GET `/models/embedding` ❌ Não implementado

Lista modelos de embedding disponíveis.

---

## Mapa de Cobertura

### Legenda
- ✅ = Implementado (client + service + action)
- 🔶 = Parcial (existe no client mas não exposto em service/action)
- ❌ = Não implementado

| # | Categoria | Endpoint | Método | Status |
|---|-----------|----------|--------|--------|
| 1 | **Chat** | `/chat-messages` | POST | ✅ |
| 2 | | `/chat-messages/{task_id}/stop` | POST | ✅ |
| 3 | **Completion** | `/completion-messages` | POST | ✅ |
| 4 | | `/completion-messages/{task_id}/stop` | POST | ❌ |
| 5 | **Workflow** | `/workflows/run` | POST | ✅ |
| 6 | | `/workflows/tasks/{task_id}/stop` | POST | ✅ |
| 7 | | `/workflows/run/{workflow_run_id}` | GET | ✅ |
| 8 | | `/workflows/logs` | GET | ❌ |
| 9 | **Conversations** | `/conversations` | GET | ✅ |
| 10 | | `/conversations/{id}/messages` | GET | ❌ |
| 11 | | `/conversations/{id}/name` | PATCH | ❌ |
| 12 | | `/conversations/{id}` | DELETE | ❌ |
| 13 | | `/conversations/{id}/variables` | GET | ❌ |
| 14 | **Messages** | `/messages` | GET | ✅ |
| 15 | | `/messages/{id}/feedbacks` | POST | ✅ |
| 16 | | `/messages/{id}/suggested` | GET | ✅ |
| 17 | **Audio** | `/audio/speech-to-text` | POST | ❌ |
| 18 | | `/text-to-audio` | POST | ❌ |
| 19 | **Files** | `/files/upload` | POST | ✅ |
| 20 | | `/files/{id}/preview` | GET | ❌ |
| 21 | | `/files/upload-workflow` | POST | ❌ |
| 22 | **Annotations** | `/annotations` | GET | ❌ |
| 23 | | `/annotations` | POST | ❌ |
| 24 | | `/annotations/{id}` | PATCH | ❌ |
| 25 | | `/annotations/{id}` | DELETE | ❌ |
| 26 | | `/apps/annotation-reply/enable` | POST | ❌ |
| 27 | | `/apps/annotation-reply/disable` | POST | ❌ |
| 28 | | `/apps/annotation-reply/{action}/status/{job_id}` | GET | ❌ |
| 29 | **App Info** | `/info` | GET | ✅ |
| 30 | | `/parameters` | GET | ✅ |
| 31 | | `/meta` | GET | ✅ |
| 32 | | `/apps/{id}/feedbacks` | GET | ❌ |
| 33 | **Datasets** | `/datasets` | GET | ✅ |
| 34 | | `/datasets` | POST | ✅ |
| 35 | | `/datasets/{id}` | GET | ✅ |
| 36 | | `/datasets/{id}` | PATCH | ✅ |
| 37 | | `/datasets/{id}` | DELETE | ✅ |
| 38 | | `/datasets/{id}/retrieve` | POST | ❌ |
| 39 | **Documents** | `/datasets/{id}/documents` | GET | ✅ |
| 40 | | `/.../document/create_by_text` | POST | ✅ |
| 41 | | `/.../document/create-by-file` | POST | ❌ |
| 42 | | `/documents/{id}` | GET | ❌ |
| 43 | | `/documents/{id}/text` | PATCH | ❌ |
| 44 | | `/documents/{id}/file` | PATCH | ❌ |
| 45 | | `/.../documents/{id}` | DELETE | ✅ |
| 46 | | `/documents/batch-embedding-status` | GET | ❌ |
| 47 | | `/documents/batch-status` | PATCH | ❌ |
| 48 | **Chunks** | `/.../segments` | GET | ❌ |
| 49 | | `/.../segments` | POST | ❌ |
| 50 | | `/.../segments/{id}` | PATCH | ❌ |
| 51 | | `/.../segments/{id}` | DELETE | ❌ |
| 52 | | Child chunks (7 endpoints) | * | ❌ |
| 53 | **Tags** | 7 endpoints | * | ❌ |
| 54 | **Models** | `/models/embedding` | GET | ❌ |

### Resumo Quantitativo

| Métrica | Valor |
|---------|-------|
| **Total de endpoints na API** | ~65 |
| **Implementados (✅)** | 21 |
| **Não implementados (❌)** | ~44 |
| **Cobertura atual** | ~32% |

---

## Gaps & Próximos Passos

### Prioridade Alta (Essencial para integração completa)

1. **Conversations CRUD** — Renomear, excluir conversas. Fundamental para UX de chat.
2. **Annotations API** — Respostas diretas configuráveis. Permite controle fino do comportamento do bot.
3. **Audio API** — Speech-to-text e Text-to-speech. Habilita interfaces por voz.
4. **Chunks/Segments API** — Gerenciamento granular da Knowledge Base. Essencial para controle de qualidade do RAG.
5. **Dataset Retrieve** — Teste de busca semântica. Crucial para debug e otimização de RAG.

### Prioridade Média (Melhora experiência)

6. **Document create-by-file** — Upload de documentos para Knowledge Base (PDF, DOCX, etc).
7. **Document update** — Atualizar conteúdo de documentos existentes.
8. **Workflow Logs** — Histórico de execuções para monitoramento.
9. **Stop completion** — Parar geração de completion em andamento.
10. **File preview** — Preview de arquivos uploadados.

### Prioridade Baixa (Nice-to-have)

11. **Knowledge Base Tags** — Organização de datasets.
12. **Models API** — Listar modelos de embedding disponíveis.
13. **Batch operations** — Status de embedding em batch.
14. **Upload workflow** — Upload específico para workflows.
15. **App feedbacks list** — Listagem de feedbacks por app.

---

## Referências

- [Dify API Reference](https://docs.dify.ai/api-reference)
- [Dify Knowledge Base API](https://docs.dify.ai/guides/knowledge-base/knowledge-and-documents-maintenance/maintain-dataset-via-api)
- [Dify Developing with APIs](https://docs.dify.ai/guides/application-publishing/developing-with-apis)
- [Dify GitHub](https://github.com/langgenius/dify)
