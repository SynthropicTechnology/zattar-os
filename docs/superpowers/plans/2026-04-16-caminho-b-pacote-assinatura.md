# Caminho B — Pacote de Assinatura — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Fresh subagent per task with spec/quality review.

**Goal:** Deliver "Enviar pra cliente assinar" button that creates 4 signed documents + 1 shared package link. Cliente opens link → sees indexing page of 4 documents → signs each via existing `/assinatura/[token]` flow.

**Architecture:** New table `assinatura_digital_pacotes` + `assinatura_digital_pacote_documentos`. Reuses caminho A mapper + existing `generatePdfFromTemplate` + existing `createDocumentoFromUploadedPdf`. New public route `/assinatura-pacote/[token]` as index.

**Tech Stack:** Next.js 16 App Router, Supabase (service-client for admin, RLS + token validation for public), Jest 30, Playwright 1.56.

**Branch:** `feat/pdfs-contratacao-caminho-b` (based on `feat/pdfs-contratacao-trabalhista`).

**Spec reference:** [docs/superpowers/specs/2026-04-16-caminho-b-pacote-assinatura-design.md](../specs/2026-04-16-caminho-b-pacote-assinatura-design.md)

---

## File Structure

### New files

```
supabase/migrations/
└── 2026-04-16_assinatura_digital_pacotes.sql

src/shared/assinatura-digital/
├── types/pacote.ts
├── schemas/pacote.ts
└── services/pacote.service.ts

src/app/(authenticated)/contratos/
├── actions/enviar-contrato-assinatura-action.ts
└── [id]/components/modal-link-assinatura-dialog.tsx

src/app/api/assinatura-digital/pacotes/[token]/
└── route.ts

src/app/(assinatura-digital)/assinatura-pacote/[token]/
├── page.tsx
└── page-client.tsx

tests/unit:
└── src/shared/assinatura-digital/services/__tests__/pacote.service.test.ts
```

### Modified files

```
src/app/(authenticated)/contratos/
├── [id]/components/documentos-contratacao-card.tsx   # wire secondary button
└── index.ts                                           # export new action + types

src/shared/assinatura-digital/
└── index.ts                                           # export pacote.service + types
```

---

## Task 1: Supabase migration

**Files:**
- Create: `supabase/migrations/2026-04-16_assinatura_digital_pacotes.sql`

- [ ] **Step 1.1: Apply migration via Supabase MCP**

Execute the following against the ZattarOS Supabase project (`cxxdivtgeslrujpfpivs`) using `mcp__plugin_supabase_supabase__apply_migration` with migration name `assinatura_digital_pacotes`:

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

- [ ] **Step 1.2: Save the migration SQL to the repo**

Copy the same SQL into `supabase/migrations/2026-04-16_assinatura_digital_pacotes.sql` so the migration is tracked in git alongside the other migrations. Do NOT create duplicates — the project uses `supabase/migrations/` as the source of truth.

- [ ] **Step 1.3: Regenerate `database.types.ts`**

Use `mcp__plugin_supabase_supabase__generate_typescript_types` and write the output to `src/lib/supabase/database.types.ts`. Verify that the new tables appear and that the existing shape of the file is preserved (only additive changes).

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/2026-04-16_assinatura_digital_pacotes.sql src/lib/supabase/database.types.ts
git commit -m "feat(assinatura-digital): pacotes table for signature packages"
```

---

## Task 2: Types + Zod schemas

**Files:**
- Create: `src/shared/assinatura-digital/types/pacote.ts`
- Create: `src/shared/assinatura-digital/schemas/pacote.ts`

- [ ] **Step 2.1: Write `types/pacote.ts`**

```ts
// src/shared/assinatura-digital/types/pacote.ts

export type PacoteStatus = 'ativo' | 'expirado' | 'cancelado' | 'concluido';

export interface Pacote {
  id: number;
  pacote_uuid: string;
  token_compartilhado: string;
  contrato_id: number;
  formulario_id: number;
  status: PacoteStatus;
  criado_por: number | null;
  expira_em: string;
  created_at: string;
  updated_at: string;
}

export interface PacoteDocumento {
  id: number;
  pacote_id: number;
  documento_id: number;
  ordem: number;
}

export interface DocumentoNoPacote {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: string;
  ordem: number;
  token_assinante: string;
  assinado_em: string | null;
}

export interface PacoteComDocumentos {
  pacote: Pacote;
  documentos: DocumentoNoPacote[];
  status_efetivo: PacoteStatus;
}
```

- [ ] **Step 2.2: Write `schemas/pacote.ts`**

```ts
// src/shared/assinatura-digital/schemas/pacote.ts
import { z } from 'zod';

export const criarPacoteInputSchema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export type CriarPacoteInput = z.infer<typeof criarPacoteInputSchema>;
```

- [ ] **Step 2.3: Verify**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add src/shared/assinatura-digital/types/pacote.ts src/shared/assinatura-digital/schemas/pacote.ts
git commit -m "feat(assinatura-digital): types and schemas for pacote"
```

---

## Task 3: `criarPacote` service (TDD)

**Files:**
- Create: `src/shared/assinatura-digital/services/pacote.service.ts`
- Create: `src/shared/assinatura-digital/services/__tests__/pacote.service.test.ts`

- [ ] **Step 3.1: Write failing test**

Create the test file with this skeleton (mock Supabase, `generatePdfFromTemplate`, and `createDocumentoFromUploadedPdf`):

```ts
import { criarPacote } from '../pacote.service';

jest.mock('@/lib/supabase/service-client', () => ({ createServiceClient: jest.fn() }));
jest.mock('../template-pdf.service', () => ({
  generatePdfFromTemplate: jest.fn(async () => Buffer.from('fake-pdf')),
}));
jest.mock('../documentos.service', () => ({
  createDocumentoFromUploadedPdf: jest.fn(async () => ({
    documento: { id: 1, documento_uuid: 'u' },
    assinantes: [{ id: 100, token: 'token-' + Math.random(), nome: 'X' }],
  })),
}));

import { createServiceClient } from '@/lib/supabase/service-client';
import { createDocumentoFromUploadedPdf } from '../documentos.service';

describe('criarPacote', () => {
  const mockSupabase = {
    from: jest.fn(),
    // chain impl
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('reuses active pacote when one exists for the contract', async () => {
    // arrange: supabase select returns existing pacote
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 42, token_compartilhado: 'existing-token', expira_em: '2026-05-01' },
      }),
    };
    mockSupabase.from.mockReturnValue(builder);

    const result = await criarPacote({
      contratoId: 1,
      clienteDadosSnapshot: { nome: 'X', cpf: '1', email: 'x@x.com' },
      templatesComPdfs: [],
      formularioId: 3,
      userId: 10,
      overrides: {},
    });

    expect(result.status).toBe('reaproveitado');
    expect(result.token).toBe('existing-token');
    expect(createDocumentoFromUploadedPdf).not.toHaveBeenCalled();
  });

  it('creates 4 documents + 1 pacote when no active pacote exists', async () => {
    // Arrange chain: first maybeSingle returns null (no existing), then insert returns new pacote
    // ... (detailed mock setup)
  });
});
```

Run: `npx jest --testPathPatterns "pacote.service"` → expect FAIL (module missing).

- [ ] **Step 3.2: Implement `criarPacote`**

```ts
// src/shared/assinatura-digital/services/pacote.service.ts
import { createServiceClient } from '@/lib/supabase/service-client';
import { randomBytes } from 'crypto';
import { createDocumentoFromUploadedPdf } from './documentos.service';
import { generatePdfFromTemplate } from './template-pdf.service';
import type { TemplateBasico } from './data.service';
import type {
  Pacote,
  PacoteComDocumentos,
  DocumentoNoPacote,
  PacoteStatus,
} from '../types/pacote';

const DURACAO_PACOTE_DIAS = Number(process.env.PACOTE_DURACAO_DIAS ?? 7);

function gerarTokenCompartilhado(): string {
  return randomBytes(32).toString('hex');
}

export interface CriarPacoteInput {
  contratoId: number;
  formularioId: number;
  templatesComPdfs: Array<{ template: TemplateBasico; pdfBuffer: Buffer; titulo: string }>;
  clienteDadosSnapshot: { nome: string; cpf: string | null; email: string | null };
  userId: number | null;
  overrides?: Record<string, string>;
}

export interface CriarPacoteResult {
  status: 'criado' | 'reaproveitado';
  token: string;
  expiraEm: string;
  quantidadeDocs: number;
}

export async function criarPacote(input: CriarPacoteInput): Promise<CriarPacoteResult> {
  const supabase = createServiceClient();

  // 1. check existing active pacote
  const { data: existente } = await supabase
    .from('assinatura_digital_pacotes')
    .select('id, token_compartilhado, expira_em')
    .eq('contrato_id', input.contratoId)
    .eq('status', 'ativo')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (existente) {
    const { count } = await supabase
      .from('assinatura_digital_pacote_documentos')
      .select('id', { count: 'exact', head: true })
      .eq('pacote_id', existente.id);
    return {
      status: 'reaproveitado',
      token: existente.token_compartilhado,
      expiraEm: existente.expira_em,
      quantidadeDocs: count ?? 0,
    };
  }

  // 2. create pacote
  const token = gerarTokenCompartilhado();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + DURACAO_PACOTE_DIAS);

  const { data: pacote, error: pacoteErr } = await supabase
    .from('assinatura_digital_pacotes')
    .insert({
      token_compartilhado: token,
      contrato_id: input.contratoId,
      formulario_id: input.formularioId,
      status: 'ativo',
      criado_por: input.userId,
      expira_em: expiraEm.toISOString(),
    })
    .select('id, token_compartilhado, expira_em')
    .single();

  if (pacoteErr || !pacote) {
    throw new Error(`Falha ao criar pacote: ${pacoteErr?.message ?? 'desconhecido'}`);
  }

  // 3. create N documents + assinantes + pacote_documentos
  for (let i = 0; i < input.templatesComPdfs.length; i++) {
    const { pdfBuffer, titulo } = input.templatesComPdfs[i];
    const doc = await createDocumentoFromUploadedPdf({
      titulo,
      selfie_habilitada: false,
      pdfBuffer,
      created_by: input.userId,
      assinantes: [
        {
          assinante_tipo: 'cliente',
          dados_snapshot: input.clienteDadosSnapshot,
          dados_confirmados: true,
        } as never,
      ],
    });

    // link documento to contrato
    await supabase
      .from('assinatura_digital_documentos')
      .update({ contrato_id: input.contratoId })
      .eq('id', doc.documento.id);

    await supabase.from('assinatura_digital_pacote_documentos').insert({
      pacote_id: pacote.id,
      documento_id: doc.documento.id,
      ordem: i + 1,
    });
  }

  return {
    status: 'criado',
    token: pacote.token_compartilhado,
    expiraEm: pacote.expira_em,
    quantidadeDocs: input.templatesComPdfs.length,
  };
}
```

Note: The exact shape of the `assinantes` parameter for `createDocumentoFromUploadedPdf` depends on the function's current signature. Read the function first (`src/shared/assinatura-digital/services/documentos.service.ts`) and adapt the `assinantes` array shape precisely.

- [ ] **Step 3.3: Run tests**

Run: `npx jest --testPathPatterns "pacote.service"` → expect PASS.

- [ ] **Step 3.4: Commit**

```bash
git add src/shared/assinatura-digital/services/pacote.service.ts \
        src/shared/assinatura-digital/services/__tests__/pacote.service.test.ts
git commit -m "feat(assinatura-digital): criarPacote service creates or reuses active pacote"
```

---

## Task 4: `lerPacotePorToken` service

**Files:**
- Modify: `src/shared/assinatura-digital/services/pacote.service.ts` (append)
- Modify: test file (append 2 tests)

- [ ] **Step 4.1: Append failing tests**

Add tests covering:
- Token inválido retorna null
- Pacote expirado retorna `status_efetivo: 'expirado'`
- Pacote com todos os docs assinados retorna `status_efetivo: 'concluido'`
- Pacote ativo retorna documentos com `token_assinante`

- [ ] **Step 4.2: Append implementation**

```ts
export async function lerPacotePorToken(
  token: string,
): Promise<PacoteComDocumentos | null> {
  const supabase = createServiceClient();

  const { data: pacote, error } = await supabase
    .from('assinatura_digital_pacotes')
    .select('*')
    .eq('token_compartilhado', token)
    .maybeSingle();

  if (error || !pacote) return null;

  const { data: join } = await supabase
    .from('assinatura_digital_pacote_documentos')
    .select(`
      ordem,
      documento:assinatura_digital_documentos!documento_id (
        id, documento_uuid, titulo, status,
        assinantes:assinatura_digital_documento_assinantes ( id, token, concluido_em )
      )
    `)
    .eq('pacote_id', pacote.id)
    .order('ordem', { ascending: true });

  const documentos: DocumentoNoPacote[] = (join ?? []).map((row) => {
    const doc = Array.isArray(row.documento) ? row.documento[0] : row.documento;
    const assinantes = doc?.assinantes ?? [];
    const primeiro = Array.isArray(assinantes) ? assinantes[0] : assinantes;
    return {
      id: doc?.id,
      documento_uuid: doc?.documento_uuid,
      titulo: doc?.titulo ?? null,
      status: doc?.status ?? 'pendente',
      ordem: row.ordem,
      token_assinante: primeiro?.token ?? '',
      assinado_em: primeiro?.concluido_em ?? null,
    };
  });

  const agora = new Date();
  let status_efetivo: PacoteStatus = pacote.status;
  if (new Date(pacote.expira_em) < agora) status_efetivo = 'expirado';
  else if (documentos.length > 0 && documentos.every((d) => d.assinado_em)) {
    status_efetivo = 'concluido';
  }

  return { pacote: pacote as Pacote, documentos, status_efetivo };
}
```

- [ ] **Step 4.3: Verify + commit**

```bash
npx jest --testPathPatterns "pacote.service"
git add src/shared/assinatura-digital/services/pacote.service.ts \
        src/shared/assinatura-digital/services/__tests__/pacote.service.test.ts
git commit -m "feat(assinatura-digital): lerPacotePorToken with status efetivo"
```

---

## Task 5: Admin action `actionEnviarContratoParaAssinatura`

**Files:**
- Create: `src/app/(authenticated)/contratos/actions/enviar-contrato-assinatura-action.ts`

- [ ] **Step 5.1: Read existing caminho A action** for reference patterns:

```bash
cat src/app/\(authenticated\)/contratos/actions/gerar-pdfs-contrato-action.ts
```

- [ ] **Step 5.2: Write action**

```ts
'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import {
  validarGeracaoPdfs,
  carregarDadosContrato,
  carregarFormularioContratacao,
  carregarTemplatesPorUuids,
} from '../services/documentos-contratacao.service';
import { contratoParaInputData } from '../services/mapeamento-contrato-input-data';
import { generatePdfFromTemplate } from '@/shared/assinatura-digital/services/template-pdf.service';
import { criarPacote } from '@/shared/assinatura-digital/services/pacote.service';

const schema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export const actionEnviarContratoParaAssinatura = authenticatedAction(
  schema,
  async (input, { user }) => {
    // 1. reuse validation
    const validacao = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    if (validacao.status !== 'pronto') return validacao;

    // 2. load contexts for PDF merge
    const dados = await carregarDadosContrato(input.contratoId);
    const formulario = await carregarFormularioContratacao();
    if (!dados || !dados.cliente || !formulario) {
      return { status: 'erro' as const, mensagem: 'Dados insuficientes' };
    }
    const templates = await carregarTemplatesPorUuids(formulario.template_ids);

    // 3. merge templates into PDFs
    const mapeado = contratoParaInputData(dados);
    const ctx = {
      cliente: mapeado.cliente,
      segmento: { id: formulario.segmento_id, nome: 'Trabalhista', slug: 'trabalhista', ativo: true },
      formulario: {
        id: formulario.id,
        formulario_uuid: formulario.formulario_uuid,
        nome: formulario.nome,
        slug: formulario.slug,
        segmento_id: formulario.segmento_id,
        ativo: formulario.ativo,
      },
      protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
      parte_contraria: mapeado.parteContrariaNome ? { nome: mapeado.parteContrariaNome } : undefined,
    };
    const extras = { ...mapeado.ctxExtras, ...(input.overrides ?? {}) };

    const templatesComPdfs = await Promise.all(
      templates.map(async (template) => ({
        template,
        pdfBuffer: await generatePdfFromTemplate(template, ctx, extras, undefined),
        titulo: template.nome,
      })),
    );

    // 4. create pacote
    const primeiroEmail = dados.cliente.emails?.[0] ?? null;
    const clienteDadosSnapshot = {
      nome: dados.cliente.nome,
      cpf: dados.cliente.cpf ?? null,
      email: primeiroEmail,
    };
    const result = await criarPacote({
      contratoId: input.contratoId,
      formularioId: formulario.id,
      templatesComPdfs,
      clienteDadosSnapshot,
      userId: user.id,
      overrides: input.overrides ?? {},
    });

    return {
      status: result.status === 'reaproveitado' ? 'reaproveitado' as const : 'criado' as const,
      token: result.token,
      expiraEm: result.expiraEm,
      quantidadeDocs: result.quantidadeDocs,
    };
  },
);
```

- [ ] **Step 5.3: Verify + commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/contratos/actions/enviar-contrato-assinatura-action.ts
git commit -m "feat(contratos): action to create pacote de assinatura"
```

---

## Task 6: Public API route `GET /api/assinatura-digital/pacotes/[token]`

**Files:**
- Create: `src/app/api/assinatura-digital/pacotes/[token]/route.ts`

- [ ] **Step 6.1: Write route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { lerPacotePorToken } from '@/shared/assinatura-digital/services/pacote.service';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const pacote = await lerPacotePorToken(token);
  if (!pacote) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
  }

  return NextResponse.json(pacote, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
```

- [ ] **Step 6.2: Verify + commit**

```bash
npm run type-check
git add src/app/api/assinatura-digital/pacotes/\[token\]/route.ts
git commit -m "feat(assinatura-digital): public API to load pacote by token"
```

---

## Task 7: Public page `/assinatura-pacote/[token]`

**Files:**
- Create: `src/app/(assinatura-digital)/assinatura-pacote/[token]/page.tsx`
- Create: `src/app/(assinatura-digital)/assinatura-pacote/[token]/page-client.tsx`

- [ ] **Step 7.1: Write server page**

```tsx
// page.tsx
import { lerPacotePorToken } from '@/shared/assinatura-digital/services/pacote.service';
import { notFound } from 'next/navigation';
import { AssinaturaPacoteClient } from './page-client';

export const runtime = 'nodejs';

export default async function AssinaturaPacotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pacote = await lerPacotePorToken(token);
  if (!pacote) notFound();
  return <AssinaturaPacoteClient pacote={pacote} />;
}
```

- [ ] **Step 7.2: Write client component**

```tsx
// page-client.tsx
'use client';

import Link from 'next/link';
import { CheckCircle2, FileText, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { PacoteComDocumentos } from '@/shared/assinatura-digital/types/pacote';

export function AssinaturaPacoteClient({ pacote }: { pacote: PacoteComDocumentos }) {
  const { documentos, status_efetivo, pacote: p } = pacote;

  const expiracao = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(p.expira_em),
  );

  if (status_efetivo === 'expirado') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <GlassPanel depth={2} className="max-w-md p-6 text-center space-y-2">
          <Heading level="card">Link expirado</Heading>
          <Text variant="label" className="text-muted-foreground">
            Este link expirou. Entre em contato com o escritório para um novo.
          </Text>
        </GlassPanel>
      </main>
    );
  }

  if (status_efetivo === 'concluido') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <GlassPanel depth={2} className="max-w-md p-6 text-center space-y-2">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <Heading level="card">Todos os documentos foram assinados</Heading>
          <Text variant="label" className="text-muted-foreground">
            Obrigado. Você pode fechar esta página.
          </Text>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <Heading level="page">Documentos de Contratação</Heading>
        <Text variant="label" className="text-muted-foreground">
          {documentos.length} documentos para assinar
        </Text>
      </div>

      <GlassPanel depth={1} className="p-4 flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <Text variant="caption" className="text-muted-foreground">
          Expira em {expiracao}
        </Text>
      </GlassPanel>

      <ol className="space-y-3">
        {documentos.map((doc) => (
          <li key={doc.id}>
            <GlassPanel depth={2} className="p-4 flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <Text variant="label">{doc.ordem}. {doc.titulo ?? `Documento ${doc.ordem}`}</Text>
                </div>
                {doc.assinado_em ? (
                  <Badge variant="success">
                    Assinado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(doc.assinado_em))}
                  </Badge>
                ) : (
                  <Badge variant="warning">Pendente</Badge>
                )}
              </div>
              {!doc.assinado_em && (
                <Button asChild size="sm">
                  <Link href={`/assinatura/${doc.token_assinante}`}>Assinar</Link>
                </Button>
              )}
            </GlassPanel>
          </li>
        ))}
      </ol>

      <Text variant="caption" className="text-muted-foreground text-center">
        Quando todos os documentos estiverem assinados, você pode fechar esta página.
      </Text>
    </main>
  );
}
```

Badge variants: consult existing `AppBadge` exports. If `success` / `warning` variants don't exist, use the closest semantic equivalent.

- [ ] **Step 7.3: Verify + commit**

```bash
npm run type-check
git add src/app/\(assinatura-digital\)/assinatura-pacote/\[token\]/page.tsx \
        src/app/\(assinatura-digital\)/assinatura-pacote/\[token\]/page-client.tsx
git commit -m "feat(assinatura-digital): public page for pacote signature index"
```

---

## Task 8: Admin success modal + wire secondary button

**Files:**
- Create: `src/app/(authenticated)/contratos/[id]/components/modal-link-assinatura-dialog.tsx`
- Modify: `src/app/(authenticated)/contratos/[id]/components/documentos-contratacao-card.tsx`

- [ ] **Step 8.1: Create modal**

```tsx
// modal-link-assinatura-dialog.tsx
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ModalLinkAssinaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  expiraEm: string;
  reaproveitado: boolean;
}

export function ModalLinkAssinaturaDialog({
  open,
  onOpenChange,
  token,
  expiraEm,
  reaproveitado,
}: ModalLinkAssinaturaDialogProps) {
  const urlAbsoluta =
    typeof window !== 'undefined'
      ? new URL(`/assinatura-pacote/${token}`, window.location.origin).toString()
      : `/assinatura-pacote/${token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(urlAbsoluta);
    toast.success('Link copiado');
  };

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(expiraEm),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            {reaproveitado ? 'Link existente reutilizado' : 'Documentos prontos para assinatura'}
          </DialogTitle>
          <DialogDescription>
            {reaproveitado
              ? 'Já existe um pacote ativo para este contrato. Use o link abaixo.'
              : 'Envie o link abaixo para o cliente assinar os documentos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={urlAbsoluta} />
            <Button size="sm" onClick={handleCopy}>
              <Copy className="size-4 mr-1" />
              Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Expira em: <span className="font-medium">{dataFormatada}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 8.2: Wire the secondary button in `documentos-contratacao-card.tsx`**

Read the existing file, then modify to import the new action + modal, add state, add handler, and replace the disabled secondary button. Use the same overrides flow the primary button uses.

Pseudo-changes:
```tsx
import { actionEnviarContratoParaAssinatura } from '../../actions/enviar-contrato-assinatura-action';
import { ModalLinkAssinaturaDialog } from './modal-link-assinatura-dialog';

// add state
const [linkModalOpen, setLinkModalOpen] = React.useState(false);
const [linkPayload, setLinkPayload] = React.useState<{
  token: string;
  expiraEm: string;
  reaproveitado: boolean;
} | null>(null);
// NOTE: also track whether the modal of missing fields is for "baixar" or "enviar"
const [modoOverride, setModoOverride] = React.useState<'baixar' | 'enviar'>('baixar');

const handleEnviar = async () => {
  setLoading(true);
  setModoOverride('enviar');
  try {
    const validation = await actionEnviarContratoParaAssinatura({ contratoId });
    if (!validation.success) { toast.error(validation.message); return; }
    const r = validation.data;
    if (r.status === 'erro') { toast.error(r.mensagem); return; }
    if (r.status === 'campos_faltantes') {
      setCamposFaltantes(r.camposFaltantes);
      setModalOpen(true);
      return;
    }
    setLinkPayload({ token: r.token, expiraEm: r.expiraEm, reaproveitado: r.status === 'reaproveitado' });
    setLinkModalOpen(true);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
  } finally {
    setLoading(false);
  }
};

// Modify handleSubmitOverrides to branch on modoOverride:
// if 'enviar' → call actionEnviarContratoParaAssinatura with overrides
// if 'baixar' → baixarZip(contratoId, overrides)

// Replace disabled button:
<Button size="sm" variant="outline" onClick={handleEnviar} disabled={loading}>
  <Send className="size-4 mr-1" /> Enviar pra cliente assinar
</Button>

// Add modal at end:
{linkPayload && (
  <ModalLinkAssinaturaDialog
    open={linkModalOpen}
    onOpenChange={setLinkModalOpen}
    token={linkPayload.token}
    expiraEm={linkPayload.expiraEm}
    reaproveitado={linkPayload.reaproveitado}
  />
)}
```

- [ ] **Step 8.3: Verify + commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/contratos/\[id\]/components/modal-link-assinatura-dialog.tsx \
        src/app/\(authenticated\)/contratos/\[id\]/components/documentos-contratacao-card.tsx
git commit -m "feat(contratos): modal + wired secondary button for pacote assinatura"
```

---

## Task 9: Barrel exports

**Files:**
- Modify: `src/app/(authenticated)/contratos/index.ts`
- Modify: `src/shared/assinatura-digital/index.ts`

- [ ] **Step 9.1: Export new symbols**

Contratos:
```ts
export { actionEnviarContratoParaAssinatura } from './actions/enviar-contrato-assinatura-action';
```

Assinatura-digital shared:
```ts
export { criarPacote, lerPacotePorToken } from './services/pacote.service';
export type { Pacote, PacoteComDocumentos, DocumentoNoPacote, PacoteStatus } from './types/pacote';
```

- [ ] **Step 9.2: Verify + commit**

```bash
npm run type-check && npm run check:architecture
git add src/app/\(authenticated\)/contratos/index.ts \
        src/shared/assinatura-digital/index.ts
git commit -m "feat(contratos+assinatura): barrel exports for pacote"
```

---

## Task 10: Final verification + PR

- [ ] **Step 10.1: Run full health checks**

```bash
npm run type-check
npx jest --testPathPatterns "pacote.service"
npx jest --testPathPatterns "contratos"
npm run check:architecture
```

All should pass. Existing 14 tests from caminho A still green.

- [ ] **Step 10.2: Push branch + open PR (base = feat/pdfs-contratacao-trabalhista)**

```bash
git push -u origin feat/pdfs-contratacao-caminho-b
gh pr create --repo SynthropicTechnology/zattar-os \
  --base feat/pdfs-contratacao-trabalhista \
  --head feat/pdfs-contratacao-caminho-b \
  --title "feat(contratos): enviar contrato para assinatura (caminho B — pacote)" \
  --body "... (summary + test plan) ..."
```

The PR lists `feat/pdfs-contratacao-trabalhista` as base, so it **stacks on PR #8**. When PR #8 merges, GitHub auto-retargets this PR's base to master.

---

## Self-review checklist

- Every spec requirement has a task.
- No placeholders or "TBD" in any task.
- Type consistency: `Pacote`, `PacoteComDocumentos`, `DocumentoNoPacote` used the same way across all tasks.
- Reversibility: each task ends in a commit that's independently revertible.
- Task 1 (migration) is reversible via `DROP TABLE IF EXISTS` — document the rollback in the PR body if needed.
