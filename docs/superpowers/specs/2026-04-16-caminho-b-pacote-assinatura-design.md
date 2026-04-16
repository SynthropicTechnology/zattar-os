# Caminho B — Pacote de Assinatura para Contratos — Design

**Data:** 2026-04-16
**Escopo:** Módulo `contratos` (admin) + novo fluxo público `/assinatura-pacote/[token]` + nova tabela `assinatura_digital_pacotes`
**Depende de:** PR do caminho A (`feat/pdfs-contratacao-trabalhista`)
**Status:** Design aprovado (A-lite), pronto para implementação

---

## 1. Contexto

O caminho A entregou o botão "Baixar PDFs preenchidos" que gera 4 PDFs de rascunho efêmeros. Ainda falta o botão secundário "Enviar pra cliente assinar" que foi deferido por divergência entre o spec original e o schema real de `assinatura_digital_sessoes_assinatura`.

A research mostrou:
- O fluxo público atual é **1 token : 1 documento : 1 assinante**.
- A tabela `assinatura_digital_sessoes_assinatura` referenciada no plano original é do **fluxo legado de formulários**, não se aplica ao fluxo de documentos uploadados.
- Para entregar "1 envio = 1 experiência" pro cliente assinar 4 documentos, precisa introduzir um conceito de **agrupamento** que não existe hoje.

Escolha arquitetural: **A-lite** — pacote como agregador + página índice pública que reaproveita o fluxo existente de `/assinatura/[token]` pra cada documento individualmente.

---

## 2. Decisões

| Tópico | Decisão |
|---|---|
| Modelo de agrupamento | Nova tabela `assinatura_digital_pacotes` |
| Token do pacote | Opaco (`randomBytes(32).toString('hex')` — mesmo padrão dos assinantes) |
| Token dos assinantes | Mantido — cada documento do pacote tem seu próprio token individual |
| Fluxo do cliente | 1 link do pacote → página índice lista 4 documentos → clica num documento → fluxo `/assinatura/[token]` existente → volta pro pacote |
| Expiração do pacote | 7 dias (configurável por env var) |
| Reuso | Se contrato já tem pacote ativo não-expirado, reaproveita em vez de criar novo |
| Idempotência | `POST` do admin é idempotente via lock por `contrato_id` |
| Vínculo com contrato | Documentos criados têm `contrato_id` populado (primeira vez que esse FK é usado na prática) |
| RLS | Tabela `pacotes` tem RLS: admin CRUD via service-client; leitura pública **só** via endpoint que valida token |
| PDFs base | Templates do formulário "contratacao" (slug=`contratacao`, segmento_id=1). Carrega PDF do storage e injeta o buffer no documento via `createDocumentoFromUploadedPdf` |
| Merge de dados | Reutiliza `contratoParaInputData` e `generatePdfFromTemplate` do caminho A — cada documento nasce com os dados já carimbados, cliente só assina |

---

## 3. Schema novo

```sql
CREATE TABLE assinatura_digital_pacotes (
  id                       BIGSERIAL PRIMARY KEY,
  pacote_uuid              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_compartilhado      TEXT NOT NULL UNIQUE,
  contrato_id              BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  formulario_id            BIGINT NOT NULL REFERENCES assinatura_digital_formularios(id),
  status                   TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','expirado','cancelado','concluido')),
  criado_por               BIGINT REFERENCES usuarios(id),
  expira_em                TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assinatura_digital_pacote_documentos (
  id             BIGSERIAL PRIMARY KEY,
  pacote_id      BIGINT NOT NULL REFERENCES assinatura_digital_pacotes(id) ON DELETE CASCADE,
  documento_id   BIGINT NOT NULL REFERENCES assinatura_digital_documentos(id) ON DELETE CASCADE,
  ordem          INTEGER NOT NULL,
  UNIQUE (pacote_id, documento_id),
  UNIQUE (pacote_id, ordem)
);

CREATE INDEX idx_pacotes_token ON assinatura_digital_pacotes(token_compartilhado);
CREATE INDEX idx_pacotes_contrato_status ON assinatura_digital_pacotes(contrato_id, status) WHERE status = 'ativo';
CREATE INDEX idx_pacote_documentos_pacote ON assinatura_digital_pacote_documentos(pacote_id);

ALTER TABLE assinatura_digital_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinatura_digital_pacote_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pacotes_service_admin ON assinatura_digital_pacotes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY pacote_documentos_service_admin ON assinatura_digital_pacote_documentos
  FOR ALL USING (auth.role() = 'service_role');
```

A leitura pública do pacote acontece via endpoint que usa `service-client` e valida o token na query — nunca expõe `pacotes` direto pra anon.

---

## 4. Fluxo end-to-end

### 4.1 Admin clica "Enviar pra cliente assinar"

```
UI: botão no DocumentosContratacaoCard
  ↓
action: actionEnviarContratoParaAssinatura(contratoId)
  ├─ 1. validar dados (reusa validarGeracaoPdfs do caminho A)
  │       ├─ se campos_faltantes → mesmo modal do caminho A
  │       └─ se erro → toast
  │
  ├─ 2. checar pacote existente: SELECT * FROM pacotes WHERE contrato_id=? AND status='ativo' AND expira_em > now()
  │       └─ existe? → retorna {status:'reaproveitado', token, expiraEm}
  │
  ├─ 3. criar pacote em transação:
  │       ├─ inserir linha em pacotes com token_compartilhado + expira_em = now()+7d
  │       ├─ para cada template (4): gerar PDF com merge (reuso do caminho A), criar documento com contrato_id, criar 1 assinante com dados do cliente
  │       └─ inserir pacote_documentos com ordem
  │
  └─ 4. retornar {status:'criado', token, expiraEm, quantidadeDocs:4}

UI: modal de sucesso com link copiável
     https://zattar.app/assinatura-pacote/{token}
```

### 4.2 Cliente abre link do pacote

```
GET /api/assinatura-digital/pacotes/[token]
  ├─ busca pacote por token (service-client bypass RLS — validação é o token)
  ├─ valida status='ativo' e expira_em > now()
  ├─ carrega documentos: JOIN pacote_documentos + documentos + assinantes
  └─ retorna {pacote, documentos: [{id, titulo, status, token_assinante, assinado_em?}, ...]}

/assinatura-pacote/[token] (page.tsx)
  ├─ SSR: fetch do endpoint acima
  ├─ renderiza: "Olá, você tem 4 documentos para assinar"
  └─ lista com 4 cards, cada um com:
       - nome do documento
       - status (pendente / assinado)
       - botão "Assinar" → Link pra /assinatura/{token_assinante}
```

Quando o cliente abre `/assinatura/[token_assinante]`, o fluxo existente assume e faz toda a UX de assinatura. Depois de concluir, o cliente volta manualmente pro pacote (ou recebe um toast de sucesso que sugere voltar).

### 4.3 Estados do pacote

- `ativo`: pelo menos 1 documento não assinado, dentro da validade.
- `concluido`: todos os 4 documentos assinados.
- `expirado`: `expira_em < now()`.
- `cancelado`: admin cancelou explicitamente (fora do escopo MVP — adicionar futuramente).

O status **não é atualizado automaticamente**. O cálculo é derivado na leitura: se `expira_em < now()`, retorna como expirado; se todos os documentos têm status assinado, retorna como concluido. Transição oficial pode virar job/trigger depois.

---

## 5. Arquivos (FSD + colocation)

### Novos

```
supabase/migrations/
└── 2026-04-16_assinatura_digital_pacotes.sql

src/shared/assinatura-digital/
├── services/pacote.service.ts              # criarPacote, lerPacotePorToken, cancelarPacote
├── types/pacote.ts                         # Pacote, PacoteDocumento, PacoteComDocumentos
└── schemas/pacote.ts                       # Zod schemas

src/app/(authenticated)/contratos/
└── actions/enviar-contrato-assinatura-action.ts

src/app/api/assinatura-digital/pacotes/[token]/
└── route.ts                                # GET público (valida token, retorna pacote)

src/app/(assinatura-digital)/assinatura-pacote/[token]/
├── page.tsx                                # server component, SSR fetch
└── page-client.tsx                         # render lista
```

### Modificados (com pequena mudança)

```
src/app/(authenticated)/contratos/
├── [id]/components/documentos-contratacao-card.tsx   # habilita botão secundário
├── [id]/components/modal-link-assinatura-dialog.tsx  # NOVO — modal de sucesso
└── index.ts                                           # exports
```

### Reuso sem mudança

- `contratoParaInputData`, `detectarCamposFaltantes`, `validarGeracaoPdfs` (caminho A)
- `generatePdfFromTemplate` (`src/shared/assinatura-digital/services/template-pdf.service`)
- `createDocumentoFromUploadedPdf` (`src/shared/assinatura-digital/services/documentos.service`)
- `generateOpaqueToken` (`src/shared/assinatura-digital/services/documentos.service`)
- Fluxo público `/assinatura/[token]/` (não mexido)

---

## 6. Integração visual (admin)

### DocumentosContratacaoCard (modificar)

Substituir o `disabled` do botão secundário por handler real:

```tsx
<Button size="sm" variant="outline" onClick={handleEnviar} disabled={loading}>
  <Send className="size-4 mr-1" />
  Enviar pra cliente assinar
</Button>
```

`handleEnviar`:
- chama `actionEnviarContratoParaAssinatura({contratoId})`
- se `status='campos_faltantes'` → abre o MESMO modal do caminho A com a flag "modo: enviar" (ao submeter, reroda a action com overrides, não o download)
- se `status='criado'|'reaproveitado'` → abre `ModalLinkAssinaturaDialog` com o link

### ModalLinkAssinaturaDialog (novo)

Modal simples com:
- Título indicando criado/reaproveitado
- Input readonly com o link absoluto `${origin}/assinatura-pacote/${token}`
- Botão "Copiar"
- Data de expiração formatada PT-BR
- Fechar

---

## 7. Integração visual (público)

### `/assinatura-pacote/[token]` (novo)

```
┌─────────────────────────────────────────────┐
│  ZattarOS — Assinatura de Contratação       │
├─────────────────────────────────────────────┤
│                                              │
│  Olá, João da Silva                          │
│  Você tem 4 documentos para assinar          │
│                                              │
│  Expira em: 23 de abril de 2026              │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ ① Contrato                          │    │
│  │    pendente                          │    │
│  │                   [ Assinar → ]      │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ② Procuração                        │    │
│  │    ✓ assinado em 16/04 às 14h23      │    │
│  └─────────────────────────────────────┘    │
│  ... (cards 3, 4)                            │
│                                              │
│  Quando todos os documentos estiverem        │
│  assinados, você pode fechar esta página.    │
│                                              │
└─────────────────────────────────────────────┘
```

Estados por card:
- **pendente** → botão "Assinar" (Link pra `/assinatura/{token_assinante}`)
- **assinado** → badge verde + timestamp
- **concluido** → status do pacote concluído, mensagem geral de sucesso

Estilo: **Glass Briefing** (mesmo tema do admin, pois o cliente pode abrir em qualquer dispositivo e o design já suporta dark/light).

### Edge cases da página pública

| Caso | Comportamento |
|---|---|
| Token não existe | 404 "Link inválido ou expirado" |
| Pacote expirado | "Este link expirou. Entre em contato com o escritório para um novo link." |
| Pacote cancelado | "Este link foi cancelado. Entre em contato com o escritório." |

---

## 8. Tratamento de erros

| Caso | Comportamento |
|---|---|
| Contrato sem cliente ou cliente PJ | Mesmo do caminho A — erro do mapper |
| Falha em 1 dos 4 mergers | Transação aborta, nenhum documento criado |
| Falha ao criar pacote (UNIQUE constraint no token — colisão astronômicamente improvável) | Retry 1x com novo token |
| Cliente abre link após expiração | Página pública mostra "expirado" |
| Cliente clica "Assinar" de documento já assinado | Fluxo existente bloqueia (fora do escopo deste PR) |

---

## 9. Testes

### Unit (Jest)
- `pacote.service.test.ts`:
  - `criarPacote` mockando merge → cria registros corretos
  - `lerPacotePorToken` retorna pacote + documentos join
  - Reusa pacote ativo existente (não cria duplicado)
  - Expira o pacote quando `expira_em` passou

### E2E (Playwright)
- Admin clica "Enviar pra cliente assinar" → modal com link abre
- Clica 2x → modal aparece com flag `reaproveitado` (mesmo link)
- Abre link público → página lista 4 documentos "pendente"
- Assina 1 documento → volta ao pacote → status atualizado

---

## 10. Ordem de implementação (10 tasks)

1. Migration SQL (apply_migration via MCP)
2. Types + schemas Zod
3. `pacote.service` `criarPacote` + testes
4. `pacote.service` `lerPacotePorToken` + testes
5. `actionEnviarContratoParaAssinatura` (com reuso do validador do caminho A)
6. API route pública `GET /api/assinatura-digital/pacotes/[token]`
7. Página pública `/assinatura-pacote/[token]`
8. `ModalLinkAssinaturaDialog` + wiring no card
9. Barrel exports + arquitetura check
10. Verificação final + abrir PR

---

## 11. O que fica fora do MVP

- **Envio integrado por email/WhatsApp** — admin continua copiando o link manualmente.
- **Cancelar pacote** — pode ser adicionado quando surgir demanda.
- **Fluxo de assinatura sequencial** (assinar 4 docs sem voltar) — evolução possível pra A-full.
- **Notificação ao admin quando cliente conclui** — job/trigger futuro.
- **Renovar pacote expirado** — admin cria outro.
