# Zattar OS - Sistema de Gestão Jurídica by Synthropic

Sistema de gestão jurídica corporativa focado em automação e IA.

**Stack Técnico**:
- **Core**: Next.js 16 (App Router), React 19, TypeScript 5
- **Dados**: Supabase (PostgreSQL + RLS + pgvector), Redis (cache)
- **UI**: Tailwind CSS 4, shadcn/ui (estilo new-york)

## Pré-requisitos

- Node.js `>= 22.0.0`
- npm `>= 10`
- (Opcional) Docker para execução conteinerizada

## Instalação e Execução

Instale as dependências:
```bash
npm install
```

Configure as variáveis de ambiente base:
```bash
cp .env.example .env.local
```

Inicie o servidor de desenvolvimento (via Turbopack):
```bash
npm run dev
```

Acesse a aplicação: `http://localhost:3000`

## Variáveis de Ambiente (Principais)

Verifique `.env.example` para a lista completa.

* **Obrigatórias**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`
* **Inteligência Artificial**: `OPENAI_API_KEY`, `AI_GATEWAY_API_KEY`, `OPENAI_EMBEDDING_MODEL`
* **Banco/Infraestrutura**: `ENABLE_REDIS_CACHE`, `REDIS_URL`, `REDIS_PASSWORD`

## Arquitetura: Feature-Sliced Design (Colocated)

O projeto usa **Feature-Sliced Design**. Em vez de uma pasta separada para a lógica, os módulos da aplicação estão intrinsecamente amarrados às rotas dentro de `src/app/(authenticated)`.

```text
zattar-os/
└── src/
    ├── app/
    │   └── (authenticated)/      # Ambiente logado da aplicação
    │       ├── processos/        # Módulo local e Rota /processos
    │       │   ├── actions/      # Server Actions encapsuladas
    │       │   ├── components/   # UI React específica do domínio
    │       │   ├── domain.ts     # Zod Schemas, tipos, constantes e regras lógicas
    │       │   ├── service.ts    # Casos de uso
    │       │   ├── repository.ts # Integração externa / Banco de Dados
    │       │   ├── index.ts      # Ponto obrigatório de exportação do módulo (Barrel)
    │       │   └── RULES.md      # Instruções de negócio anexas para agentes cognitivos
    │       └── partes/           # Outro módulo
    ├── components/               # UI global (shadcn, shells estruturais)
    └── lib/                      # Infra (auth, redis, MCP, etc.)
```

**Regra Principal**: É estritamente proibido realizar "deep imports" (importar arquivos diretamente das pastas internas de um módulo). Use sempre os arquivos de barreira `index.ts`.

*Certo*: `import { actionListarClientes } from "@/app/(authenticated)/partes"`
*Errado*: `import { actionListarClientes } from "@/app/(authenticated)/partes/actions/listar-action"`

## Model Context Protocol (MCP) e IA

O Synthropic está equipado para funcionar via controle automatizado de agentes.
A raiz do conector expõe o endpoint `/api/mcp`. As ferramentas controlam os *Server Actions* cadastrados em `src/lib/mcp/registry.ts`.

- Testes de integridade de MCP: `npm run mcp:check`
- Base de refatoração para RAG: `npm run ai:reindex`

## Documentação & Instruções de Automação

Este repositório possui uma base documental limpa e direta paras as IAs mapearem e alterarem o código-fonte de maneira segura:

* [**AGENTS.md**](./AGENTS.md) — Referência concisa e inter-plataforma.
* [**ARCHITECTURE.md**](./docs/architecture/ARCHITECTURE.md) — Macro-estrutura.
* [**CLAUDE.md**](./CLAUDE.md) — Instruções nativas direcionadas a interfaces de CLI.
