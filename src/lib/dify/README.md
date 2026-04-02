# Integração Dify

Integração com a plataforma Dify para criação de aplicativos AI (chatbots, workflows, agentes).

## Tipos de Aplicativos Suportados

A integração suporta todos os 5 tipos principais de aplicativos Dify:

### 1. Chat (Chatbot)
- **Descrição**: Chatbot básico para conversas simples
- **Uso**: Assistentes virtuais, FAQ bots
- **Características**: 
  - Conversas básicas
  - Sem memória persistente entre sessões
  - Ideal para interações simples

### 2. Chatflow
- **Descrição**: Conversas multi-turn com memória e variáveis de sessão
- **Uso**: Assistentes complexos, atendimento ao cliente
- **Características**:
  - Mantém contexto entre múltiplos turnos de conversa
  - Variáveis de sessão (`sys.conversation_id`, `sys.dialogue_count`)
  - Memória persistente durante a conversa
  - Streaming de texto, imagens e arquivos
  - **Diferença do Chat**: Chatflow tem variáveis de sessão e memória, Chat não

### 3. Workflow
- **Descrição**: Automação de tarefas single-turn com lógica multi-step
- **Uso**: Tradução, análise de dados, geração de conteúdo, automação de email
- **Características**:
  - Tarefas batch processing
  - Interface drag-and-drop para criar fluxos
  - Pode ser iniciado por User Input ou Trigger (agendamento/eventos)
  - Não mantém contexto entre execuções

### 4. Agent (Agente)
- **Descrição**: Agente AI com acesso a ferramentas externas
- **Uso**: Automação complexa, integração com APIs, tarefas que requerem múltiplas ferramentas
- **Características**:
  - Pode usar ferramentas (APIs, bancos de dados, etc)
  - Raciocínio e planejamento automático
  - Execução de múltiplas ações em sequência

### 5. Completion (Text Generator)
- **Descrição**: Geração de texto sem contexto de conversa
- **Uso**: Geração de conteúdo, resumos, traduções simples
- **Características**:
  - Não mantém histórico de conversa
  - Cada chamada é independente
  - Mais rápido e simples que Chat/Chatflow

## Estrutura de Arquivos

```
src/features/dify/
├── actions.ts              # Server Actions
├── domain.ts               # Tipos, enums, schemas Zod
├── service.ts              # Lógica de negócio
├── repository.ts           # Acesso ao banco de dados
├── factory.ts              # Factory para criar instâncias do serviço
├── components/
│   └── dify-apps-list.tsx  # UI para gerenciar apps Dify
└── README.md               # Esta documentação
```

## Uso

### 1. Configurar um App Dify

```typescript
import { createDifyAppAction } from '@/features/dify/actions';

await createDifyAppAction({
  name: 'Assistente Jurídico',
  api_url: 'https://api.dify.ai/v1',
  api_key: 'app-xxx',
  app_type: 'chatflow' // ou 'chat', 'workflow', 'agent', 'completion'
});
```

### 2. Enviar Mensagem (Chat/Chatflow)

```typescript
import { createDifyService } from '@/features/dify/factory';

const service = await createDifyService(userId);

const result = await service.enviarMensagemCompleta({
  query: 'Olá, preciso de ajuda',
  conversationId: 'conv-123', // opcional, para continuar conversa
  inputs: { contexto: 'jurídico' }
});

if (result.isOk()) {
  console.log(result.value.answer);
  console.log(result.value.conversationId); // usar em próximas mensagens
}
```

### 3. Executar Workflow

```typescript
const result = await service.executarWorkflowCompleto({
  inputs: {
    documento: 'Contrato de prestação de serviços...',
    acao: 'analisar_clausulas'
  }
});

if (result.isOk()) {
  console.log(result.value.outputs);
  console.log(`Tokens usados: ${result.value.totalTokens}`);
  console.log(`Tempo: ${result.value.tempoDecorrido}s`);
}
```

## MCP Tools

A integração expõe 13 ferramentas MCP para uso por agentes AI:

### Chat
- `dify_chat_enviar_mensagem` - Enviar mensagem ao chatbot
- `dify_chat_listar_conversas` - Listar conversas do usuário
- `dify_chat_obter_historico` - Obter histórico de uma conversa
- `dify_chat_enviar_feedback` - Enviar like/dislike
- `dify_chat_sugestoes` - Obter perguntas sugeridas

### Workflow
- `dify_workflow_executar` - Executar workflow
- `dify_workflow_parar` - Parar execução

### Completion
- `dify_completion_gerar` - Gerar texto

### App Info
- `dify_app_info` - Obter informações do app
- `dify_app_parametros` - Obter parâmetros do app

### Knowledge Base
- `dify_knowledge_listar_datasets` - Listar datasets
- `dify_knowledge_criar_documento` - Criar documento em dataset

## Variáveis de Ambiente

```env
# URL base da API Dify (padrão: https://api.dify.ai/v1)
DIFY_API_URL=https://api.dify.ai/v1

# Chaves de API (opcional se configurar via UI)
DIFY_API_KEY=app-xxx
DIFY_CHAT_APP_KEY=app-xxx
DIFY_WORKFLOW_APP_KEY=app-xxx
DIFY_WEBHOOK_SECRET=xxx
```

## Banco de Dados

### Tabela: `dify_apps`

```sql
create table dify_apps (
  id uuid primary key,
  name text not null,
  api_url text not null,
  api_key text not null,
  app_type text check (app_type in ('chat', 'chatflow', 'workflow', 'completion', 'agent')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Referências

- [Documentação Oficial Dify](https://docs.dify.ai)
- [Dify API Reference](https://docs.dify.ai/en/guides/application-publishing/developing-with-apis)
- [Key Concepts - Workflow vs Chatflow](https://docs.dify.ai/en/use-dify/getting-started/key-concepts)
