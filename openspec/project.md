# Project Specification: Synthropic 2.0

## 1. Project Overview

### 1.1. Introduction

Synthropic is a legal management system developed with an **AI-First architecture**, utilizing Next.js 16, React 19, Supabase, and **MCP (Model Context Protocol)** integration. It focuses on client management, contract and legal process handling, automated data capture (PJE-TRT), and integrates advanced AI capabilities for document drafting and semantic search.

### 1.2. Key Features

- **Client Management:** Comprehensive management for individuals and legal entities.
- **Legal Process Management:** Handling of contracts, processes, hearings, and deadlines.
- **Automated Data Capture:** Integration with PJE-TRT for scraping process data, hearings, and notifications.
- **AI-First Core:** All features exposed as MCP tools for AI agents.
- **RAG (Retrieval Augmented Generation):** Semantic search and context awareness using pgvector.
- **AI Document Editor:** Advanced rich text editing with Plate.js and CopilotKit integration.
- **Authentication:** Robust auth with Supabase and SSO/2FA support.
- **Audit Trail:** Complete tracking of changes and responsibility assignments.

## 2. Tech Stack

### 2.1. Frontend

- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **UI System:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Rich Text Editor:** Plate.js (with AI plugins)
- **AI Integration:** Vercel AI SDK, CopilotKit, LangChain
- **State/Utils:** Framer Motion, Dnd Kit, Zod, React Hook Form

### 2.2. Backend & API

- **Runtime:** Next.js Server Actions (Safe Action Wrapper)
- **Architecture:** Feature-Sliced Design (Domain → Service → Repository → Actions)
- **MCP Server:** Built-in Model Context Protocol server exposing actions as tools
- **Database Client:** Supabase JS / PostgREST
- **Validation:** Zod (used across UI, Actions, and MCP)

### 2.3. Persistence & AI

- **Primary DB:** PostgreSQL (Supabase)
- **Vector DB:** pgvector (for RAG/Embeddings)
- **Cache:** Redis (optional, for frequent queries and rate limiting)
- **Storage:** AWS S3 / Supabase Storage

### 2.4. DevOps & Tooling

- **Build:** Turbo / Webpack
- **Containerization:** Docker (Multi-stage builds detailed in `Dockerfile`)
- **Deployment:** CapRover (suggested), Vercel compatible
- **Testing:** Jest (Unit/Integration), Playwright (E2E)
- **Quality:** ESLint (Next.js config), Husky, Gitleaks

## 3. Architecture

### 3.1. High-Level Design

The project follows a **Feature-Sliced Design** where each feature module (e.g., `processos`, `financeiro`) encapsulates its own logic.

```
UI (React 19) → Server Actions (Zod Validation) → Service Layer → Repository → Database (Supabase)
                                      ↓
                                  MCP Server (AI Agents)
```

### 3.2. Directory Structure

- `src/app`: Next.js App Router (Routes, Layouts, API endpoints)
- `src/features`: Modular features containing:
  - `domain.ts`: Entities and Zod schemas
  - `service.ts`: Business logic
  - `repository.ts`: Data access
  - `actions/`: Server Actions exposed to UI and MCP
  - `components/`: React components
- `src/lib`: Shared utilities (AI, MCP, Auth, Supabase)
- `scripts`: Automation for maintenance, testing, and AI indexing

### 3.3. MCP Integration

- Server Actions are dual-purpose: accessible by UI components and AI agents via MCP.
- **Endpoints:**
  - `GET /api/mcp`: SSE connection for agents.
  - `POST /api/mcp`: Tool execution.

## 4. Development Guidelines

### 4.1. Coding Standards

- **TypeScript:** Strict mode enabled. Distinct types for Input/Output.
- **Naming:**
  - Files: `kebab-case`
  - Components: `PascalCase`
  - Functions/Vars: `camelCase`
  - DB: `snake_case`
- **Comments:** Portuguese for business domain, JSDoc for public utilities.

### 4.2. Testing Strategy

- **Unit/Integration:** `npm test` (Jest)
- **E2E:** `npm run test:e2e` (Playwright)
- **MCP Tools:** `npm run mcp:test`
- **Architecture Check:** `npm run check:architecture`

### 4.3. Workflow

- **Branches:** `main` as source of truth.
- **Commits:** Semantic commits specific to features.
- **Specs:** Use OpenSpec for planning complex changes.

## 5. Future Considerations

### 5.1. Scalability

- **PJE Scraping:** Optimize queue management for scraping jobs to avoid rate limits.
- **Database:** Monitor query performance and index usage (pgvector indexes are critical).

### 5.2. Maintainability

- **Strict Layering:** Enforce the Service/Repository separation to allow swapping backends if needed (though unlikely).
- **Documentation:** Keep `RULES.md` in feature folders updated for AI context.

### 5.3. Security

- **RLS:** Row Level Security is the primary data firewall.
- **Secrets:** Verified by `npm run security:check-secrets` and `gitleaks`.
