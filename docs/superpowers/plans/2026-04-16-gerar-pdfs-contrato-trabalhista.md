# Gerar PDFs de Contratação a partir do Contrato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new card on the contract detail screen (trabalhista only) with two buttons: (1) download 4 merged PDFs (stateless, no persistence) and (2) send link for digital signature (persistent, links documents to contract via `contrato_id`).

**Architecture:** Pure mapper (contract data → inputData) + orchestration service (load templates, merge via existing `template-pdf.service`, zip) + server action for validation + API route for ZIP stream. Second button reuses existing `documentos.service` to create signature session.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase (service client), Jest 30, Playwright 1.56, Zod 3.25, pdf-lib 1.17 (dynamic import), jszip 3.10, `authenticatedAction` wrapper from `@/lib/safe-action`.

**Spec reference:** [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md](../specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md)

---

## File Structure

### New files

```
src/app/(authenticated)/contratos/
├── services/
│   ├── mapeamento-contrato-input-data.ts                    # Pure mapper + detection
│   ├── mapeamento-contrato-input-data.labels.ts             # Manual label dictionary
│   └── documentos-contratacao.service.ts                    # Orchestration (load + merge + zip)
├── actions/
│   ├── gerar-pdfs-contrato-action.ts                        # Validation-only action
│   └── enviar-contrato-assinatura-action.ts                 # Persistent signature flow
└── [id]/components/
    ├── documentos-contratacao-card.tsx                      # New card with 2 buttons
    ├── modal-campos-faltantes-dialog.tsx                    # Overrides dialog
    └── modal-link-assinatura-dialog.tsx                     # Success dialog (caminho B)

src/app/api/contratos/[id]/pdfs-contratacao/
└── route.ts                                                 # POST → stream ZIP

tests/
├── app/authenticated/contratos/services/
│   ├── mapeamento-contrato-input-data.test.ts               # Pure unit tests
│   └── documentos-contratacao.service.test.ts               # Integration (mocked merge)
└── e2e/contratos/
    └── gerar-pdfs-contrato.spec.ts                          # Playwright E2E
```

### Modified files

```
src/app/(authenticated)/contratos/
├── index.ts                                                 # Export new action/service/component
└── [id]/contrato-detalhes-client.tsx                        # Render new card
```

### Responsibility per file

| File | Responsibility | Dependencies |
|---|---|---|
| `mapeamento-contrato-input-data.ts` | Pure function: `contratoParaInputData(dados) → { cliente, parte_contraria, ctxExtras }`. Pure function: `detectarCamposFaltantes(inputData, templates) → CampoFaltante[]`. | None external |
| `mapeamento-contrato-input-data.labels.ts` | Static dictionary `{ 'cliente.rg': 'RG do cliente', ... }` | None |
| `documentos-contratacao.service.ts` | `carregarDadosContrato(id)`, `gerarZipPdfs(contratoId, overrides?)`, `validarGeracao(contratoId)` | `@/lib/supabase/service-client`, `template-pdf.service`, `jszip`, mapper |
| `gerar-pdfs-contrato-action.ts` | `authenticatedAction` — validates only, returns `{ready: true}` or `{camposFaltantes: [...]}` | service |
| `enviar-contrato-assinatura-action.ts` | `authenticatedAction` — creates documents, assinantes, sessão; returns `{sessaoUrl, token, expiraEm}` | `documentos.service`, mapper |
| `route.ts` (API) | `POST` — delegates to service; returns `application/zip` stream | service |
| `documentos-contratacao-card.tsx` | Two buttons + gate logic (segmento_id=1 + ativo formulário) | card components, actions |
| `modal-campos-faltantes-dialog.tsx` | Dynamic dialog generated from `camposFaltantes: CampoFaltante[]` | shadcn dialog, inputs |
| `modal-link-assinatura-dialog.tsx` | Success modal with copy-link button | shadcn dialog, clipboard |

---

## Pre-flight

- [ ] **Step 0.1: Verify deps**

Run: `grep -E '"(jszip|pdf-lib|zod|@types/jszip)"' package.json`
Expected output shows `jszip` and `pdf-lib` already. If `@types/jszip` is missing, install it.

- [ ] **Step 0.2: Confirm types package**

Run: `npm ls @types/jszip 2>/dev/null || echo "missing"`
If missing, run: `npm install --save-dev @types/jszip@3.4.0`

- [ ] **Step 0.3: Confirm existing patterns**

Read these files once to confirm conventions before starting:
- `src/lib/safe-action.ts` (lines 100-175) — `authenticatedAction` signature
- `src/shared/assinatura-digital/services/template-pdf.service.ts` (lines 350-370, 812-830) — `PdfDataContext` and `generatePdfFromTemplate`
- `src/shared/assinatura-digital/services/data.service.ts` (lines 1-60) — `ClienteBasico`, `TemplateBasico`, `FormularioBasico`, `SegmentoBasico`

Expected: understand that `generatePdfFromTemplate(template, ctx, extras, images?)` returns `Buffer`, that `ctx.cliente` must be `ClienteBasico` shape, and that omitting `images.assinaturaBase64` leaves the signature slot empty.

---

## Task 1: Label dictionary (pure static data)

**Files:**
- Create: `src/app/(authenticated)/contratos/services/mapeamento-contrato-input-data.labels.ts`

- [ ] **Step 1.1: Create label dictionary**

```ts
// src/app/(authenticated)/contratos/services/mapeamento-contrato-input-data.labels.ts

/**
 * Human-readable labels for template variable keys.
 * Used by the "campos faltantes" modal to show the user which data is missing.
 */
export const LABELS_CAMPOS_CONTRATO: Readonly<Record<string, string>> = {
  'cliente.nome_completo': 'Nome completo do cliente',
  'cliente.nacionalidade': 'Nacionalidade',
  'cliente.estado_civil': 'Estado civil',
  'cliente.rg': 'RG',
  'cliente.cpf': 'CPF',
  'cliente.endereco_logradouro': 'Logradouro (rua, avenida)',
  'cliente.endereco_numero': 'Número do endereço',
  'cliente.endereco_bairro': 'Bairro',
  'cliente.endereco_cidade': 'Cidade',
  'cliente.endereco_estado': 'UF',
  'cliente.endereco_cep': 'CEP',
  'cliente.ddd_celular': 'DDD do celular',
  'cliente.numero_celular': 'Número do celular',
  'cliente.email': 'E-mail',
  'acao.nome_empresa_pessoa': 'Nome da parte contrária',
};

export function labelParaChave(chave: string): string {
  return LABELS_CAMPOS_CONTRATO[chave] ?? chave;
}
```

- [ ] **Step 1.2: Run type-check**

Run: `npm run type-check`
Expected: no new errors.

- [ ] **Step 1.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/mapeamento-contrato-input-data.labels.ts
git commit -m "feat(contratos): add label dictionary for template variables"
```

---

## Task 2: Mapper — contractToInputData (pure function, TDD)

**Files:**
- Create: `src/app/(authenticated)/contratos/services/mapeamento-contrato-input-data.ts`
- Create: `src/app/(authenticated)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`

- [ ] **Step 2.1: Write failing test**

```ts
// src/app/(authenticated)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts
import { contratoParaInputData, type DadosContratoParaMapping } from '../mapeamento-contrato-input-data';

describe('contratoParaInputData', () => {
  const baseDados: DadosContratoParaMapping = {
    contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
    cliente: {
      id: 10,
      nome: 'João da Silva',
      tipo_pessoa: 'pf',
      cpf: '12345678900',
      rg: 'MG-12.345.678',
      nacionalidade: 'brasileira',
      estado_civil: 'solteiro',
      ddd_celular: '31',
      numero_celular: '999998888',
      emails: ['joao@example.com'],
      endereco: {
        logradouro: 'Rua das Flores',
        numero: '100',
        bairro: 'Centro',
        municipio: 'Belo Horizonte',
        estado_sigla: 'MG',
        cep: '30100000',
      },
    },
    partes: [
      { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme Ltda', ordem: 1 },
    ],
  };

  it('maps a complete PF client to full inputData', () => {
    const result = contratoParaInputData(baseDados);

    expect(result.cliente).toMatchObject({
      id: 10,
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      rg: 'MG-12.345.678',
      nacionalidade: 'brasileira',
      estado_civil: 'Solteiro(a)',
      ddd_celular: '31',
      numero_celular: '99999-8888',
    });
    expect(result.cliente.endereco).toMatchObject({
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Centro',
      municipio: 'Belo Horizonte',
      estado_sigla: 'MG',
      cep: '30100-000',
    });
    expect(result.ctxExtras['acao.nome_empresa_pessoa']).toBe('Acme Ltda');
    expect(result.ctxExtras['cliente.email']).toBe('joao@example.com');
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`
Expected: FAIL with "Cannot find module '../mapeamento-contrato-input-data'".

- [ ] **Step 2.3: Implement minimal mapper**

```ts
// src/app/(authenticated)/contratos/services/mapeamento-contrato-input-data.ts
import type { ClienteBasico } from '@/shared/assinatura-digital/services/data.service';

export interface DadosContratoParaMapping {
  contrato: { id: number; segmento_id: number | null; cliente_id: number };
  cliente: {
    id: number;
    nome: string;
    tipo_pessoa?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    rg?: string | null;
    nacionalidade?: string | null;
    estado_civil?: string | null;
    ddd_celular?: string | null;
    numero_celular?: string | null;
    emails?: string[] | null;
    endereco?: {
      logradouro?: string | null;
      numero?: string | null;
      bairro?: string | null;
      municipio?: string | null;
      estado_sigla?: string | null;
      cep?: string | null;
      complemento?: string | null;
    } | null;
  } | null;
  partes: Array<{
    papel_contratual: string;
    nome_snapshot: string | null;
    ordem: number;
  }>;
}

export interface InputDataMapeado {
  cliente: ClienteBasico;
  parteContrariaNome: string;
  ctxExtras: Record<string, string>;
}

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  separado: 'Separado(a) judicialmente',
  uniao_estavel: 'União estável',
};

function formatarCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatarCelular(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 9) return digits.replace(/(\d{5})(\d{4})/, '$1-$2');
  if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, '$1-$2');
  return num;
}

function concatenarPartesContrarias(
  partes: DadosContratoParaMapping['partes'],
): string {
  const nomes = partes
    .filter(p => p.papel_contratual === 'parte_contraria')
    .sort((a, b) => a.ordem - b.ordem)
    .map(p => (p.nome_snapshot ?? '').trim())
    .filter(n => n.length > 0);

  if (nomes.length === 0) return '';
  // Intl.ListFormat pt-BR produces: "A", "A e B", "A, B e C"
  return new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(nomes);
}

export function contratoParaInputData(dados: DadosContratoParaMapping): InputDataMapeado {
  const { cliente } = dados;

  if (!cliente) {
    throw new Error('Contrato sem cliente vinculado');
  }

  if (cliente.tipo_pessoa && cliente.tipo_pessoa !== 'pf') {
    throw new Error(
      'Templates trabalhistas exigem cliente Pessoa Física. Altere o cadastro do cliente ou use outro tipo de contrato.',
    );
  }

  const clienteMapeado: ClienteBasico = {
    id: cliente.id,
    nome: (cliente.nome ?? '').trim(),
    tipo_pessoa: cliente.tipo_pessoa ?? null,
    cpf: cliente.cpf ? formatarCpf(cliente.cpf) : null,
    cnpj: null,
    rg: cliente.rg ?? null,
    emails: cliente.emails ?? null,
    ddd_celular: cliente.ddd_celular ?? null,
    numero_celular: cliente.numero_celular ? formatarCelular(cliente.numero_celular) : null,
    estado_civil: cliente.estado_civil
      ? ESTADO_CIVIL_LABELS[cliente.estado_civil] ?? cliente.estado_civil
      : null,
    nacionalidade: cliente.nacionalidade ?? null,
    endereco: cliente.endereco
      ? {
          logradouro: cliente.endereco.logradouro ?? null,
          numero: cliente.endereco.numero ?? null,
          bairro: cliente.endereco.bairro ?? null,
          municipio: cliente.endereco.municipio ?? null,
          estado_sigla: cliente.endereco.estado_sigla ?? null,
          cep: cliente.endereco.cep ? formatarCep(cliente.endereco.cep) : null,
          complemento: cliente.endereco.complemento ?? null,
        }
      : null,
  };

  const parteContrariaNome = concatenarPartesContrarias(dados.partes);
  const primeiroEmail = cliente.emails?.[0] ?? '';

  const ctxExtras: Record<string, string> = {
    'acao.nome_empresa_pessoa': parteContrariaNome,
    'cliente.email': primeiroEmail,
  };

  return { cliente: clienteMapeado, parteContrariaNome, ctxExtras };
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`
Expected: PASS (1 test).

- [ ] **Step 2.5: Add edge-case tests**

```ts
// append to the test file
describe('contratoParaInputData - edge cases', () => {
  const baseCliente = {
    id: 10,
    nome: 'João',
    tipo_pessoa: 'pf' as const,
    cpf: '12345678900',
  };

  it('throws when contract has no cliente', () => {
    expect(() =>
      contratoParaInputData({
        contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
        cliente: null,
        partes: [],
      }),
    ).toThrow('Contrato sem cliente vinculado');
  });

  it('throws when cliente is PJ', () => {
    expect(() =>
      contratoParaInputData({
        contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
        cliente: { ...baseCliente, tipo_pessoa: 'pj' },
        partes: [],
      }),
    ).toThrow('Templates trabalhistas exigem cliente Pessoa Física');
  });

  it('concatenates 3 partes contrárias with "A, B e C"', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 1 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Beta', ordem: 2 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Gama', ordem: 3 },
      ],
    });
    expect(result.parteContrariaNome).toBe('Acme, Beta e Gama');
  });

  it('ignores partes that are not parte_contraria', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [
        { papel_contratual: 'cliente', nome_snapshot: 'Some Client', ordem: 1 },
        { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 2 },
      ],
    });
    expect(result.parteContrariaNome).toBe('Acme');
  });

  it('returns empty string when no partes contrárias exist', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: baseCliente,
      partes: [],
    });
    expect(result.parteContrariaNome).toBe('');
  });

  it('picks the first email from the emails array', () => {
    const result = contratoParaInputData({
      contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
      cliente: { ...baseCliente, emails: ['a@x.com', 'b@x.com'] },
      partes: [],
    });
    expect(result.ctxExtras['cliente.email']).toBe('a@x.com');
  });
});
```

- [ ] **Step 2.6: Run tests to verify all pass**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 2.7: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/mapeamento-contrato-input-data.ts \
        src/app/\(authenticated\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts
git commit -m "feat(contratos): pure mapper from contract data to template inputData"
```

---

## Task 3: Field detection (pure function, TDD)

**Files:**
- Modify: `src/app/(authenticated)/contratos/services/mapeamento-contrato-input-data.ts` (append)
- Modify: `src/app/(authenticated)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts` (append)

- [ ] **Step 3.1: Write failing test for `detectarCamposFaltantes`**

Append to the existing test file:

```ts
import { detectarCamposFaltantes } from '../mapeamento-contrato-input-data';

describe('detectarCamposFaltantes', () => {
  const templateMinimo = {
    template_uuid: 'uuid-1',
    nome: 'Contrato',
    campos: JSON.stringify([
      {
        tipo: 'texto',
        variavel: 'cliente.rg',
        obrigatorio: true,
      },
      {
        tipo: 'texto',
        variavel: 'sistema.data_geracao',
        obrigatorio: true,
      },
      {
        tipo: 'assinatura',
        variavel: 'assinatura.assinatura_base64',
        obrigatorio: true,
      },
    ]),
  };

  it('flags missing required field', () => {
    const inputData = {
      cliente: { rg: null },
    };
    const result = detectarCamposFaltantes(inputData, [templateMinimo]);
    expect(result).toHaveLength(1);
    expect(result[0].chave).toBe('cliente.rg');
    expect(result[0].templates).toContain('Contrato');
  });

  it('ignores sistema.data_geracao and assinatura.assinatura_base64', () => {
    const inputData = {
      cliente: { rg: 'X' },
    };
    const result = detectarCamposFaltantes(inputData, [templateMinimo]);
    expect(result).toHaveLength(0);
  });

  it('returns empty when all fields present', () => {
    const inputData = {
      cliente: { rg: 'MG-123' },
    };
    expect(detectarCamposFaltantes(inputData, [templateMinimo])).toEqual([]);
  });

  it('extracts variables from texto_composto fields', () => {
    const templateCompound = {
      template_uuid: 'uuid-2',
      nome: 'Procuração',
      campos: JSON.stringify([
        {
          tipo: 'texto_composto',
          obrigatorio: true,
          conteudo_composto: {
            json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'variable', attrs: { key: 'cliente.cpf' } },
                    { type: 'text', text: ' e ' },
                    { type: 'variable', attrs: { key: 'cliente.rg' } },
                  ],
                },
              ],
            },
          },
        },
      ]),
    };
    const inputData = { cliente: { cpf: null, rg: null } };
    const result = detectarCamposFaltantes(inputData, [templateCompound]);
    const chaves = result.map(c => c.chave).sort();
    expect(chaves).toEqual(['cliente.cpf', 'cliente.rg']);
  });

  it('deduplicates chaves when multiple templates use same variable', () => {
    const inputData = { cliente: { rg: null } };
    const result = detectarCamposFaltantes(inputData, [templateMinimo, templateMinimo]);
    expect(result).toHaveLength(1);
    expect(result[0].templates).toEqual(['Contrato', 'Contrato']);
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`
Expected: FAIL on "Cannot find exported member 'detectarCamposFaltantes'".

- [ ] **Step 3.3: Implement `detectarCamposFaltantes`**

Append to `mapeamento-contrato-input-data.ts`:

```ts
import { LABELS_CAMPOS_CONTRATO } from './mapeamento-contrato-input-data.labels';

export interface TemplateComCampos {
  template_uuid: string;
  nome: string;
  campos: string; // JSON string, parsed internally
}

export interface CampoFaltante {
  chave: string;
  label: string;
  templates: string[];
}

const CHAVES_IGNORADAS = new Set([
  'assinatura.assinatura_base64',
  'sistema.data_geracao',
]);

interface CampoParsed {
  tipo: string;
  variavel?: string;
  obrigatorio?: boolean;
  conteudo_composto?: {
    json?: unknown;
  };
}

function extrairVariaveisDoTipTap(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown>;
  if (n.type === 'variable' && n.attrs && typeof n.attrs === 'object') {
    const key = (n.attrs as Record<string, unknown>).key;
    if (typeof key === 'string') out.add(key);
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) extrairVariaveisDoTipTap(child, out);
  }
}

function extrairVariaveisDoCampo(campo: CampoParsed): string[] {
  const out = new Set<string>();
  if (campo.variavel) out.add(campo.variavel);
  if (campo.conteudo_composto?.json) {
    extrairVariaveisDoTipTap(campo.conteudo_composto.json, out);
  }
  return [...out];
}

function temValor(inputData: Record<string, unknown>, chave: string): boolean {
  // Resolve chaves como "cliente.endereco_cep" em objeto aninhado
  const partes = chave.split('.');
  let valor: unknown = inputData;
  for (const p of partes) {
    if (valor && typeof valor === 'object' && p in (valor as object)) {
      valor = (valor as Record<string, unknown>)[p];
    } else {
      return false;
    }
  }
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string' && valor.trim() === '') return false;
  return true;
}

export function detectarCamposFaltantes(
  inputData: Record<string, unknown>,
  templates: TemplateComCampos[],
): CampoFaltante[] {
  const chaveParaTemplates = new Map<string, string[]>();

  for (const template of templates) {
    let parsed: CampoParsed[];
    try {
      parsed = JSON.parse(template.campos) as CampoParsed[];
    } catch {
      continue; // template com JSON inválido ignorado
    }
    for (const campo of parsed) {
      if (!campo.obrigatorio) continue;
      for (const chave of extrairVariaveisDoCampo(campo)) {
        if (CHAVES_IGNORADAS.has(chave)) continue;
        const lista = chaveParaTemplates.get(chave) ?? [];
        lista.push(template.nome);
        chaveParaTemplates.set(chave, lista);
      }
    }
  }

  const faltantes: CampoFaltante[] = [];
  for (const [chave, templatesQueUsam] of chaveParaTemplates) {
    if (!temValor(inputData, chave)) {
      faltantes.push({
        chave,
        label: LABELS_CAMPOS_CONTRATO[chave] ?? chave,
        templates: templatesQueUsam,
      });
    }
  }

  return faltantes;
}
```

- [ ] **Step 3.4: Run tests to verify pass**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts`
Expected: PASS (11 tests total — 6 from Task 2, 5 new).

- [ ] **Step 3.5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/mapeamento-contrato-input-data.ts \
        src/app/\(authenticated\)/contratos/services/__tests__/mapeamento-contrato-input-data.test.ts
git commit -m "feat(contratos): detect missing required template variables"
```

---

## Task 4: Data loader + orchestration service skeleton

**Files:**
- Create: `src/app/(authenticated)/contratos/services/documentos-contratacao.service.ts`

- [ ] **Step 4.1: Create service with data loader**

```ts
// src/app/(authenticated)/contratos/services/documentos-contratacao.service.ts
import { createServiceClient } from '@/lib/supabase/service-client';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping } from './mapeamento-contrato-input-data';

export const FORMULARIO_SLUG_TRABALHISTA = 'contratacao';
export const SEGMENTO_ID_TRABALHISTA = 1;

interface FormularioComTemplates {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
  template_ids: string[];
}

export async function carregarDadosContrato(
  contratoId: number,
): Promise<DadosContratoParaMapping | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('contratos')
    .select(`
      id, segmento_id, cliente_id,
      cliente:clientes!cliente_id (
        id, tipo_pessoa, nome, cpf, rg, nacionalidade, estado_civil,
        ddd_celular, numero_celular, emails,
        endereco:enderecos!endereco_id (
          logradouro, numero, complemento, bairro,
          municipio, estado_sigla, cep
        )
      ),
      partes:contrato_partes (
        papel_contratual, nome_snapshot, ordem
      )
    `)
    .eq('id', contratoId)
    .single();

  if (error || !data) return null;

  // Normalize: Supabase returns single-row relations as objects
  const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
  const endereco = cliente
    ? Array.isArray(cliente.endereco)
      ? cliente.endereco[0]
      : cliente.endereco
    : null;

  return {
    contrato: {
      id: data.id,
      segmento_id: data.segmento_id,
      cliente_id: data.cliente_id,
    },
    cliente: cliente
      ? { ...cliente, endereco: endereco ?? null }
      : null,
    partes: Array.isArray(data.partes) ? data.partes : [],
  };
}

export async function carregarFormularioContratacao(): Promise<FormularioComTemplates | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_formularios')
    .select('id, formulario_uuid, nome, slug, segmento_id, ativo, template_ids')
    .eq('slug', FORMULARIO_SLUG_TRABALHISTA)
    .eq('segmento_id', SEGMENTO_ID_TRABALHISTA)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as FormularioComTemplates;
}

export async function carregarTemplatesPorUuids(
  uuids: string[],
): Promise<TemplateBasico[]> {
  if (uuids.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, ativo, arquivo_original, pdf_url, campos')
    .in('template_uuid', uuids)
    .eq('ativo', true);

  if (error || !data) return [];
  return data as TemplateBasico[];
}
```

- [ ] **Step 4.2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/documentos-contratacao.service.ts
git commit -m "feat(contratos): data loader for contract + formulario + templates"
```

---

## Task 5: Orchestration — generate ZIP with merged PDFs (integration test with mocks)

**Files:**
- Modify: `src/app/(authenticated)/contratos/services/documentos-contratacao.service.ts` (append)
- Create: `src/app/(authenticated)/contratos/services/__tests__/documentos-contratacao.service.test.ts`

- [ ] **Step 5.1: Write failing test**

```ts
// src/app/(authenticated)/contratos/services/__tests__/documentos-contratacao.service.test.ts
import { gerarZipPdfsContratacao } from '../documentos-contratacao.service';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping } from '../mapeamento-contrato-input-data';

// Mock the merge service — we don't want to actually open PDFs in unit tests
jest.mock('@/shared/assinatura-digital/services/template-pdf.service', () => ({
  generatePdfFromTemplate: jest.fn(async (template: TemplateBasico) =>
    Buffer.from(`fake-pdf-${template.nome}`),
  ),
}));

const mockDados: DadosContratoParaMapping = {
  contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
  cliente: {
    id: 10,
    nome: 'João Teste',
    tipo_pessoa: 'pf',
    cpf: '12345678900',
    rg: 'MG-1',
    nacionalidade: 'brasileira',
    estado_civil: 'solteiro',
    ddd_celular: '31',
    numero_celular: '999998888',
    emails: ['j@x.com'],
    endereco: {
      logradouro: 'R', numero: '1', bairro: 'B', municipio: 'BH',
      estado_sigla: 'MG', cep: '30100000',
    },
  },
  partes: [
    { papel_contratual: 'parte_contraria', nome_snapshot: 'Acme', ordem: 1 },
  ],
};

const mockTemplates: TemplateBasico[] = [
  { id: 1, template_uuid: 'u1', nome: 'Contrato', ativo: true, arquivo_original: 'a', campos: '[]' },
  { id: 2, template_uuid: 'u2', nome: 'Procuração', ativo: true, arquivo_original: 'b', campos: '[]' },
];

const mockFormulario = {
  id: 3, formulario_uuid: 'f-uuid', nome: 'Contratação', slug: 'contratacao',
  segmento_id: 1, ativo: true, template_ids: ['u1', 'u2'],
};

describe('gerarZipPdfsContratacao', () => {
  it('produces a Buffer zip containing one PDF per template, named by template', async () => {
    const zipBuffer = await gerarZipPdfsContratacao({
      dados: mockDados,
      templates: mockTemplates,
      formulario: mockFormulario,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);

    // Verify it is a zip and has 2 entries
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(['Contrato.pdf', 'Procuração.pdf']);
  });

  it('propagates errors from merge (does not build partial zip)', async () => {
    const { generatePdfFromTemplate } = await import(
      '@/shared/assinatura-digital/services/template-pdf.service'
    );
    (generatePdfFromTemplate as jest.Mock).mockRejectedValueOnce(
      new Error('pdf merge failed'),
    );

    await expect(
      gerarZipPdfsContratacao({
        dados: mockDados,
        templates: mockTemplates,
        formulario: mockFormulario,
      }),
    ).rejects.toThrow('pdf merge failed');
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/documentos-contratacao.service.test.ts`
Expected: FAIL with "Cannot find exported member 'gerarZipPdfsContratacao'".

- [ ] **Step 5.3: Implement `gerarZipPdfsContratacao`**

Append to `documentos-contratacao.service.ts`:

```ts
import JSZip from 'jszip';
import { generatePdfFromTemplate } from '@/shared/assinatura-digital/services/template-pdf.service';
import { contratoParaInputData } from './mapeamento-contrato-input-data';

export interface GerarZipInput {
  dados: DadosContratoParaMapping;
  templates: TemplateBasico[];
  formulario: FormularioComTemplates;
  overrides?: Record<string, string>;
}

function sanitizarNomeArquivo(nome: string): string {
  // Preserve accents but remove path separators / invalid zip characters
  return nome.replace(/[/\\:*?"<>|]/g, '_').trim() || 'documento';
}

export async function gerarZipPdfsContratacao(
  input: GerarZipInput,
): Promise<Buffer> {
  const { dados, templates, formulario, overrides = {} } = input;

  const mapeado = contratoParaInputData(dados);

  const segmentoPlaceholder = {
    id: formulario.segmento_id,
    nome: 'Trabalhista',
    slug: 'trabalhista',
    ativo: true,
  };

  const formularioPlaceholder = {
    id: formulario.id,
    formulario_uuid: formulario.formulario_uuid,
    nome: formulario.nome,
    slug: formulario.slug,
    segmento_id: formulario.segmento_id,
    ativo: formulario.ativo,
  };

  const ctx = {
    cliente: mapeado.cliente,
    segmento: segmentoPlaceholder,
    formulario: formularioPlaceholder,
    protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
    parte_contraria: mapeado.parteContrariaNome
      ? { nome: mapeado.parteContrariaNome }
      : undefined,
  };

  const extras: Record<string, unknown> = {
    ...mapeado.ctxExtras,
    ...overrides,
  };

  // Merge all templates in parallel; if any throws, Promise.all rejects and we do not build a partial zip.
  const buffers = await Promise.all(
    templates.map(async (template) => {
      const buffer = await generatePdfFromTemplate(
        template,
        ctx,
        extras,
        /* no images: signature slot stays empty */ undefined,
      );
      return { nome: template.nome, buffer };
    }),
  );

  const zip = new JSZip();
  for (const { nome, buffer } of buffers) {
    zip.file(`${sanitizarNomeArquivo(nome)}.pdf`, buffer);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}
```

- [ ] **Step 5.4: Run tests to verify pass**

Run: `npx jest src/app/\\(authenticated\\)/contratos/services/__tests__/documentos-contratacao.service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5.5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/documentos-contratacao.service.ts \
        src/app/\(authenticated\)/contratos/services/__tests__/documentos-contratacao.service.test.ts
git commit -m "feat(contratos): orchestration service generates zip of merged PDFs"
```

---

## Task 6: Service wrapper — validate + orchestrate from contratoId

**Files:**
- Modify: `src/app/(authenticated)/contratos/services/documentos-contratacao.service.ts` (append)

- [ ] **Step 6.1: Add high-level functions**

Append to `documentos-contratacao.service.ts`:

```ts
import { detectarCamposFaltantes, type CampoFaltante } from './mapeamento-contrato-input-data';

export type ResultadoValidacao =
  | { status: 'pronto'; formularioId: number; qtdTemplates: number }
  | { status: 'campos_faltantes'; camposFaltantes: CampoFaltante[] }
  | { status: 'erro'; mensagem: string };

async function carregarContexto(contratoId: number) {
  const dados = await carregarDadosContrato(contratoId);
  if (!dados || !dados.cliente) {
    return { erro: 'Contrato sem cliente vinculado' as const };
  }

  const formulario = await carregarFormularioContratacao();
  if (!formulario || formulario.template_ids.length === 0) {
    return {
      erro: 'Formulário de contratação trabalhista não está disponível' as const,
    };
  }

  const templates = await carregarTemplatesPorUuids(formulario.template_ids);
  if (templates.length !== formulario.template_ids.length) {
    return {
      erro: 'Um ou mais templates não estão disponíveis' as const,
    };
  }

  return { dados, formulario, templates };
}

export async function validarGeracaoPdfs(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<ResultadoValidacao> {
  const ctx = await carregarContexto(contratoId);
  if ('erro' in ctx) return { status: 'erro', mensagem: ctx.erro };

  let inputData: Record<string, unknown>;
  try {
    const mapeado = contratoParaInputData(ctx.dados);
    inputData = {
      cliente: mapeado.cliente,
      'acao.nome_empresa_pessoa': mapeado.parteContrariaNome,
      'cliente.email': mapeado.ctxExtras['cliente.email'],
      ...overrides,
    };
  } catch (err) {
    return {
      status: 'erro',
      mensagem: err instanceof Error ? err.message : 'Erro no mapeamento',
    };
  }

  const faltantes = detectarCamposFaltantes(inputData, ctx.templates);
  if (faltantes.length > 0) {
    return { status: 'campos_faltantes', camposFaltantes: faltantes };
  }

  return {
    status: 'pronto',
    formularioId: ctx.formulario.id,
    qtdTemplates: ctx.templates.length,
  };
}

export async function gerarZipPdfsParaContrato(
  contratoId: number,
  overrides: Record<string, string> = {},
): Promise<{ buffer: Buffer; nomeCliente: string }> {
  const ctx = await carregarContexto(contratoId);
  if ('erro' in ctx) throw new Error(ctx.erro);

  const buffer = await gerarZipPdfsContratacao({
    dados: ctx.dados,
    templates: ctx.templates,
    formulario: ctx.formulario,
    overrides,
  });

  return {
    buffer,
    nomeCliente: ctx.dados.cliente?.nome ?? 'Contrato',
  };
}
```

- [ ] **Step 6.2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/services/documentos-contratacao.service.ts
git commit -m "feat(contratos): high-level validation and zip generation helpers"
```

---

## Task 7: Server action (validation only)

**Files:**
- Create: `src/app/(authenticated)/contratos/actions/gerar-pdfs-contrato-action.ts`

- [ ] **Step 7.1: Create action**

```ts
// src/app/(authenticated)/contratos/actions/gerar-pdfs-contrato-action.ts
'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import { validarGeracaoPdfs } from '../services/documentos-contratacao.service';

const validarSchema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string(), z.string()).optional(),
});

export const actionValidarGeracaoPdfs = authenticatedAction(
  validarSchema,
  async (input) => {
    const result = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    return result;
  },
);
```

- [ ] **Step 7.2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/actions/gerar-pdfs-contrato-action.ts
git commit -m "feat(contratos): server action to validate PDF generation preconditions"
```

---

## Task 8: API route — ZIP stream

**Files:**
- Create: `src/app/api/contratos/[id]/pdfs-contratacao/route.ts`

- [ ] **Step 8.1: Create POST route**

```ts
// src/app/api/contratos/[id]/pdfs-contratacao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { gerarZipPdfsParaContrato } from '@/app/(authenticated)/contratos/services/documentos-contratacao.service';

export const runtime = 'nodejs';

function sanitizarNomeCliente(nome: string): string {
  return nome
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateRequest();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const contratoId = Number(id);
  if (!Number.isFinite(contratoId) || contratoId <= 0) {
    return NextResponse.json({ error: 'ID de contrato inválido' }, { status: 400 });
  }

  let overrides: Record<string, string> = {};
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === 'object' && body.overrides && typeof body.overrides === 'object') {
      overrides = body.overrides as Record<string, string>;
    }
  } catch {
    // body vazio é ok
  }

  try {
    const { buffer, nomeCliente } = await gerarZipPdfsParaContrato(contratoId, overrides);
    const filename = `Contratacao-${sanitizarNomeCliente(nomeCliente) || 'contrato'}.zip`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao gerar PDFs';
    console.error('[pdfs-contratacao] erro', { contratoId, mensagem });
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
```

- [ ] **Step 8.2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 8.3: Manual smoke test**

Start dev server: `npm run dev`. In another terminal:

```bash
curl -i -X POST http://localhost:3000/api/contratos/1/pdfs-contratacao \
  -H "Content-Type: application/json" \
  -H "Cookie: <copy session cookie from your browser>" \
  -d '{}' -o /tmp/out.zip
unzip -l /tmp/out.zip
```

Expected: HTTP 200 + zip with 4 PDF entries. If contract #1 is not trabalhista, use a known trabalhista contract ID.

- [ ] **Step 8.4: Commit**

```bash
git add src/app/api/contratos/\[id\]/pdfs-contratacao/route.ts
git commit -m "feat(contratos): API route streams zip of contracted PDFs"
```

---

## Task 9: Modal "campos faltantes" UI

**Files:**
- Create: `src/app/(authenticated)/contratos/[id]/components/modal-campos-faltantes-dialog.tsx`

- [ ] **Step 9.1: Create dialog component**

```tsx
// src/app/(authenticated)/contratos/[id]/components/modal-campos-faltantes-dialog.tsx
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
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { AlertTriangle } from 'lucide-react';
import type { CampoFaltante } from '../../services/mapeamento-contrato-input-data';

interface ModalCamposFaltantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camposFaltantes: CampoFaltante[];
  onSubmit: (overrides: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export function ModalCamposFaltantesDialog({
  open,
  onOpenChange,
  camposFaltantes,
  onSubmit,
  isSubmitting = false,
}: ModalCamposFaltantesDialogProps) {
  const [valores, setValores] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) setValores({});
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overrides: Record<string, string> = {};
    for (const campo of camposFaltantes) {
      const v = valores[campo.chave]?.trim();
      if (v) overrides[campo.chave] = v;
    }
    onSubmit(overrides);
  };

  const allFilled = camposFaltantes.every(c => (valores[c.chave]?.trim().length ?? 0) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            Alguns dados do cliente estão incompletos
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para gerar os PDFs. Esses valores não serão
            salvos no cadastro do cliente — só usados para esta geração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {camposFaltantes.map((campo) => (
            <div key={campo.chave} className="space-y-1">
              <Label htmlFor={campo.chave}>{campo.label}</Label>
              <Input
                id={campo.chave}
                value={valores[campo.chave] ?? ''}
                onChange={e => setValores(v => ({ ...v, [campo.chave]: e.target.value }))}
                disabled={isSubmitting}
                required
              />
              <Text variant="caption" className="text-muted-foreground">
                usado em: {campo.templates.join(', ')}
              </Text>
            </div>
          ))}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!allFilled || isSubmitting}>
            {isSubmitting ? 'Gerando…' : 'Gerar PDFs com esses dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 9.2: Run type-check**

Run: `npm run type-check`
Expected: no errors. If `Label` or `Text` imports fail, adjust to match existing exports in the repo.

- [ ] **Step 9.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/modal-campos-faltantes-dialog.tsx
git commit -m "feat(contratos): modal to collect missing fields for PDF generation"
```

---

## Task 10: Main card component with gate + primary button

**Files:**
- Create: `src/app/(authenticated)/contratos/[id]/components/documentos-contratacao-card.tsx`

- [ ] **Step 10.1: Create card**

```tsx
// src/app/(authenticated)/contratos/[id]/components/documentos-contratacao-card.tsx
'use client';

import * as React from 'react';
import { FileDown, Send } from 'lucide-react';
import { WidgetContainer } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { actionValidarGeracaoPdfs } from '../../actions/gerar-pdfs-contrato-action';
import { ModalCamposFaltantesDialog } from './modal-campos-faltantes-dialog';
import type { CampoFaltante } from '../../services/mapeamento-contrato-input-data';

interface DocumentosContratacaoCardProps {
  contratoId: number;
  segmentoId: number | null;
}

const SEGMENTO_TRABALHISTA = 1;

async function baixarZip(contratoId: number, overrides: Record<string, string> = {}) {
  const response = await fetch(`/api/contratos/${contratoId}/pdfs-contratacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Falha no download' }));
    throw new Error(body.error ?? 'Falha no download');
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition') ?? '';
  const m = cd.match(/filename="(.+)"/);
  const filename = m?.[1] ?? `contratacao-${contratoId}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DocumentosContratacaoCard({
  contratoId,
  segmentoId,
}: DocumentosContratacaoCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [camposFaltantes, setCamposFaltantes] = React.useState<CampoFaltante[]>([]);

  // Gate: only render for trabalhista
  if (segmentoId !== SEGMENTO_TRABALHISTA) return null;

  const handleBaixar = async () => {
    setLoading(true);
    try {
      const validation = await actionValidarGeracaoPdfs({ contratoId });
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      const result = validation.data;
      if (result.status === 'erro') {
        toast.error(result.mensagem);
        return;
      }
      if (result.status === 'campos_faltantes') {
        setCamposFaltantes(result.camposFaltantes);
        setModalOpen(true);
        return;
      }
      // status === 'pronto'
      await baixarZip(contratoId);
      toast.success('PDFs gerados com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOverrides = async (overrides: Record<string, string>) => {
    setLoading(true);
    try {
      await baixarZip(contratoId, overrides);
      toast.success('PDFs gerados com sucesso');
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDFs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <WidgetContainer
        title="Documentos de Contratação"
        icon={FileDown}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleBaixar} disabled={loading}>
              <FileDown className="size-4 mr-1" />
              {loading ? 'Gerando…' : 'Baixar PDFs preenchidos'}
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Send className="size-4 mr-1" />
              Enviar pra cliente assinar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Gera os 4 documentos de contratação trabalhista preenchidos com os
          dados deste contrato. Se faltar alguma informação, você poderá
          completá-la antes do download.
        </p>
      </WidgetContainer>

      <ModalCamposFaltantesDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        camposFaltantes={camposFaltantes}
        onSubmit={handleSubmitOverrides}
        isSubmitting={loading}
      />
    </>
  );
}
```

- [ ] **Step 10.2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 10.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/documentos-contratacao-card.tsx
git commit -m "feat(contratos): main card with primary download button and gate logic"
```

---

## Task 11: Wire card into detail page

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/contrato-detalhes-client.tsx`

- [ ] **Step 11.1: Identify the tab Resumo render location**

Read `contrato-detalhes-client.tsx` and find the `TabsContent value="resumo"` block (or equivalent — adjust to the actual tab where Documentos card lives). Insert `<DocumentosContratacaoCard />` next to `<ContratoDocumentosCard />`.

- [ ] **Step 11.2: Add import and render**

```tsx
// in contrato-detalhes-client.tsx, within the components imports:
import {
  // ... existing imports
  ContratoDocumentosCard,
  ContratoTimeline,
} from './components';
import { DocumentosContratacaoCard } from './components/documentos-contratacao-card';

// ... later, inside the JSX tree where documents are rendered:
<DocumentosContratacaoCard
  contratoId={contrato.id}
  segmentoId={contrato.segmentoId ?? contrato.segmento_id ?? null}
/>
<ContratoDocumentosCard contratoId={contrato.id} />
```

Note: verify the exact property name (`segmentoId` vs `segmento_id`) by reading the `Contrato` type in `src/app/(authenticated)/contratos/domain.ts` — use the exact field name the type exposes.

- [ ] **Step 11.3: Run type-check + dev server**

```bash
npm run type-check && npm run dev
```

Open a trabalhista contract in the browser. Confirm:
- Card appears
- Non-trabalhista contract: card absent

- [ ] **Step 11.4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/contrato-detalhes-client.tsx
git commit -m "feat(contratos): render DocumentosContratacaoCard in detail view"
```

---

## Task 12: Server action — send for signature (caminho B)

**Files:**
- Create: `src/app/(authenticated)/contratos/actions/enviar-contrato-assinatura-action.ts`

- [ ] **Step 12.1: Inspect `documentos.service` to find creation function**

Read `src/shared/assinatura-digital/services/documentos.service.ts` and locate a function that creates a signature document with a given PDF URL. In the existing codebase, the exported function is typically `createDocumentoFromUploadedPdf` (seen in `actionCreateDocumento`). Use that.

- [ ] **Step 12.2: Create action**

```ts
// src/app/(authenticated)/contratos/actions/enviar-contrato-assinatura-action.ts
'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  carregarDadosContrato,
  carregarFormularioContratacao,
  carregarTemplatesPorUuids,
  validarGeracaoPdfs,
} from '../services/documentos-contratacao.service';

const DURACAO_SESSAO_DIAS = 7;

const enviarSchema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string(), z.string()).optional(),
});

export const actionEnviarContratoParaAssinatura = authenticatedAction(
  enviarSchema,
  async (input, { user }) => {
    // Reuse validation: if missing fields → bubble up
    const validation = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    if (validation.status !== 'pronto') {
      // caller decides what to do (show modal or error)
      return validation;
    }

    const dados = await carregarDadosContrato(input.contratoId);
    const formulario = await carregarFormularioContratacao();
    if (!dados || !dados.cliente || !formulario) {
      throw new Error('Contrato ou formulário indisponível');
    }
    const templates = await carregarTemplatesPorUuids(formulario.template_ids);

    const supabase = createServiceClient();

    // Check for active session already on this contract (reuse policy)
    const { data: sessaoExistente } = await supabase
      .from('assinatura_digital_sessoes_assinatura')
      .select('token, expira_em')
      .eq('contrato_id', input.contratoId)
      .gt('expira_em', new Date().toISOString())
      .maybeSingle();

    if (sessaoExistente) {
      return {
        status: 'reaproveitada' as const,
        sessaoUrl: `/assinatura/${sessaoExistente.token}`,
        token: sessaoExistente.token,
        expiraEm: sessaoExistente.expira_em,
      };
    }

    // Create 4 documents linked to contrato
    const documentosCriados: number[] = [];
    for (const template of templates) {
      const { data: doc, error } = await supabase
        .from('assinatura_digital_documentos')
        .insert({
          contrato_id: input.contratoId,
          titulo: template.nome,
          pdf_original_url: template.pdf_url ?? template.arquivo_original,
          status: 'aguardando_assinatura',
          selfie_habilitada: false,
          created_by: user.id,
        })
        .select('id')
        .single();
      if (error || !doc) throw new Error('Falha ao criar documento');
      documentosCriados.push(doc.id);

      await supabase.from('assinatura_digital_documento_assinantes').insert({
        documento_id: doc.id,
        nome: dados.cliente.nome,
        cpf: dados.cliente.cpf ?? '',
      });
    }

    // Create session with token
    const token = crypto.randomUUID();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + DURACAO_SESSAO_DIAS);

    const { error: sessaoError } = await supabase
      .from('assinatura_digital_sessoes_assinatura')
      .insert({
        token,
        contrato_id: input.contratoId,
        documentos_ids: documentosCriados,
        input_data_preenchido: { overrides: input.overrides ?? {} },
        expira_em: expiraEm.toISOString(),
      });
    if (sessaoError) throw new Error('Falha ao criar sessão');

    return {
      status: 'criada' as const,
      sessaoUrl: `/assinatura/${token}`,
      token,
      expiraEm: expiraEm.toISOString(),
    };
  },
);
```

Note: if `assinatura_digital_sessoes_assinatura` has different column names than `token`, `documentos_ids`, `input_data_preenchido`, `expira_em`, query the live schema (via `information_schema.columns` on Supabase) and adapt the column names before committing. Do not guess.

- [ ] **Step 12.3: Verify the sessões table schema matches columns used**

Use the Supabase MCP (or a SQL query) to confirm column names:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='assinatura_digital_sessoes_assinatura'
ORDER BY ordinal_position;
```

Adjust the `insert()` call to match exactly.

- [ ] **Step 12.4: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 12.5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/actions/enviar-contrato-assinatura-action.ts
git commit -m "feat(contratos): server action to send contract for digital signature"
```

---

## Task 13: Success modal for caminho B + wire into card

**Files:**
- Create: `src/app/(authenticated)/contratos/[id]/components/modal-link-assinatura-dialog.tsx`
- Modify: `src/app/(authenticated)/contratos/[id]/components/documentos-contratacao-card.tsx`

- [ ] **Step 13.1: Create success modal**

```tsx
// src/app/(authenticated)/contratos/[id]/components/modal-link-assinatura-dialog.tsx
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
  sessaoUrl: string;
  expiraEm: string;
  reaproveitada: boolean;
}

export function ModalLinkAssinaturaDialog({
  open,
  onOpenChange,
  sessaoUrl,
  expiraEm,
  reaproveitada,
}: ModalLinkAssinaturaDialogProps) {
  const urlAbsoluta = typeof window !== 'undefined'
    ? new URL(sessaoUrl, window.location.origin).toString()
    : sessaoUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(urlAbsoluta);
    toast.success('Link copiado');
  };

  const dataExpiracao = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(expiraEm));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" />
            {reaproveitada
              ? 'Link existente reutilizado'
              : 'Documentos prontos para assinatura'}
          </DialogTitle>
          <DialogDescription>
            {reaproveitada
              ? 'Já existe uma sessão ativa para este contrato. Use o link abaixo.'
              : '4 documentos foram preparados e vinculados ao contrato. Envie o link abaixo para o cliente.'}
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
            Expira em: <span className="font-medium">{dataExpiracao}</span>
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

- [ ] **Step 13.2: Wire the secondary button in card**

Edit `documentos-contratacao-card.tsx`. Replace the disabled secondary button with:

```tsx
// add to top of file
import { actionEnviarContratoParaAssinatura } from '../../actions/enviar-contrato-assinatura-action';
import { ModalLinkAssinaturaDialog } from './modal-link-assinatura-dialog';

// in the component state:
const [linkModalOpen, setLinkModalOpen] = React.useState(false);
const [linkPayload, setLinkPayload] = React.useState<{
  sessaoUrl: string;
  expiraEm: string;
  reaproveitada: boolean;
} | null>(null);

const handleEnviar = async () => {
  setLoading(true);
  try {
    const res = await actionEnviarContratoParaAssinatura({ contratoId });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    const r = res.data;
    if (r.status === 'erro') {
      toast.error(r.mensagem);
      return;
    }
    if (r.status === 'campos_faltantes') {
      setCamposFaltantes(r.camposFaltantes);
      setModalOpen(true);
      return;
    }
    // criada | reaproveitada
    setLinkPayload({
      sessaoUrl: r.sessaoUrl,
      expiraEm: r.expiraEm,
      reaproveitada: r.status === 'reaproveitada',
    });
    setLinkModalOpen(true);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
  } finally {
    setLoading(false);
  }
};
```

Replace the disabled button JSX:

```tsx
<Button size="sm" variant="outline" onClick={handleEnviar} disabled={loading}>
  <Send className="size-4 mr-1" />
  Enviar pra cliente assinar
</Button>
```

Add the modal at the end of the return block:

```tsx
{linkPayload && (
  <ModalLinkAssinaturaDialog
    open={linkModalOpen}
    onOpenChange={setLinkModalOpen}
    sessaoUrl={linkPayload.sessaoUrl}
    expiraEm={linkPayload.expiraEm}
    reaproveitada={linkPayload.reaproveitada}
  />
)}
```

- [ ] **Step 13.3: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 13.4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/modal-link-assinatura-dialog.tsx \
        src/app/\(authenticated\)/contratos/\[id\]/components/documentos-contratacao-card.tsx
git commit -m "feat(contratos): success modal for signature link + wire secondary button"
```

---

## Task 14: Rate limiting on the ZIP endpoint

**Files:**
- Modify: `src/app/api/contratos/[id]/pdfs-contratacao/route.ts`

- [ ] **Step 14.1: Locate existing rate limiter**

Run: `grep -rn "rate.limit\|rateLimit\|RateLimit" src/shared/assinatura-digital/ --include='*.ts' -l`
Open the file(s) returned and look for an exported helper that takes a key (e.g., user id) and a budget. If the rate limiter is not adaptable for authenticated flows, write a thin in-memory fallback that limits **10 calls / 60s per user id**.

- [ ] **Step 14.2: Apply rate limit**

Add at the top of `POST` in `route.ts`, right after `authenticateRequest`:

```ts
import { checkRateLimit } from '@/shared/assinatura-digital/services/rate-limit'; // adjust path after step 14.1

const allowed = await checkRateLimit({
  key: `pdfs-contratacao:${user.id}`,
  budget: 10,
  windowMs: 60_000,
});
if (!allowed) {
  return NextResponse.json(
    { error: 'Muitas solicitações. Tente novamente em alguns instantes.' },
    { status: 429 },
  );
}
```

If `checkRateLimit` does not exist with this signature, write a local in-memory version in `src/app/(authenticated)/contratos/services/rate-limit-local.ts` (a simple `Map<string, { count, resetAt }>`), and use that. Keep it small — this is MVP.

- [ ] **Step 14.3: Run type-check + smoke**

```bash
npm run type-check
```

Send 11 rapid requests via `curl` and confirm the 11th returns 429.

- [ ] **Step 14.4: Commit**

```bash
git add src/app/api/contratos/\[id\]/pdfs-contratacao/route.ts \
        src/app/\(authenticated\)/contratos/services/rate-limit-local.ts 2>/dev/null
git commit -m "feat(contratos): rate limit PDF zip endpoint (10/min per user)"
```

---

## Task 15: E2E Playwright test

**Files:**
- Create: `tests/e2e/contratos/gerar-pdfs-contrato.spec.ts`

- [ ] **Step 15.1: Inspect existing E2E patterns**

Run: `ls src/shared/assinatura-digital/tests/ tests/e2e/ 2>/dev/null`
Read one existing `.spec.ts` to learn the login/fixture conventions used. Reuse that pattern (fixtures, baseURL, test helpers).

- [ ] **Step 15.2: Write E2E test**

```ts
// tests/e2e/contratos/gerar-pdfs-contrato.spec.ts
import { test, expect } from '@playwright/test';

// IDs must be seeded in the test database. Adjust these constants
// to match the actual seed data.
const CONTRATO_TRABALHISTA_COMPLETO = 1;     // cliente PF com todos os dados
const CONTRATO_TRABALHISTA_SEM_RG = 2;       // cliente PF sem RG
const CONTRATO_NAO_TRABALHISTA = 3;

test.describe('Contrato: gerar PDFs de contratação', () => {
  test.beforeEach(async ({ page }) => {
    // Use the project's existing login helper; placeholder:
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.E2E_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.E2E_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
  });

  test('downloads ZIP when data is complete', async ({ page }) => {
    await page.goto(`/contratos/${CONTRATO_TRABALHISTA_COMPLETO}`);
    await expect(page.getByRole('button', { name: /Baixar PDFs preenchidos/i })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Baixar PDFs preenchidos")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('opens modal when fields are missing, fills and downloads', async ({ page }) => {
    await page.goto(`/contratos/${CONTRATO_TRABALHISTA_SEM_RG}`);
    await page.click('button:has-text("Baixar PDFs preenchidos")');

    await expect(page.getByText(/dados do cliente estão incompletos/i)).toBeVisible();
    await page.fill('input#cliente\\.rg', 'MG-99.999.999');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Gerar PDFs com esses dados")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('hides card when contract is not trabalhista', async ({ page }) => {
    await page.goto(`/contratos/${CONTRATO_NAO_TRABALHISTA}`);
    await expect(page.getByRole('button', { name: /Baixar PDFs preenchidos/i })).not.toBeVisible();
  });
});
```

- [ ] **Step 15.3: Run E2E**

```bash
npm run test:e2e -- tests/e2e/contratos/gerar-pdfs-contrato.spec.ts
```

Expected: 3 tests PASS. If selectors or IDs don't match seed data, adjust the constants at the top of the spec and re-run.

- [ ] **Step 15.4: Commit**

```bash
git add tests/e2e/contratos/gerar-pdfs-contrato.spec.ts
git commit -m "test(contratos): e2e for PDF generation and fields modal"
```

---

## Task 16: Expose new action/service from module barrel

**Files:**
- Modify: `src/app/(authenticated)/contratos/index.ts`

- [ ] **Step 16.1: Add exports**

```ts
// append to src/app/(authenticated)/contratos/index.ts

export { actionValidarGeracaoPdfs } from './actions/gerar-pdfs-contrato-action';
export { actionEnviarContratoParaAssinatura } from './actions/enviar-contrato-assinatura-action';
export {
  validarGeracaoPdfs,
  gerarZipPdfsParaContrato,
} from './services/documentos-contratacao.service';
export type {
  CampoFaltante,
  DadosContratoParaMapping,
  InputDataMapeado,
} from './services/mapeamento-contrato-input-data';
```

- [ ] **Step 16.2: Run architecture check**

```bash
npm run check:architecture && npm run validate:exports
```

Expected: no violations.

- [ ] **Step 16.3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/index.ts
git commit -m "feat(contratos): export new PDF contratação actions and types"
```

---

## Task 17: (Optional, §11.1 spec) List signed documents in contract documents card

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/components/contrato-documentos-card.tsx`

This is marked **optional in the spec** — it enriches the existing documents card by also listing `assinatura_digital_documentos WHERE contrato_id = ?`. Decide with the user if it ships in this plan or a follow-up.

- [ ] **Step 17.1: Ask the user whether to include now or defer**

If defer → skip Task 17 entirely, plan complete after Task 16.

If include → continue with Steps 17.2–17.5.

- [ ] **Step 17.2: Add fetch of signed documents**

Use a React Query or `useEffect` fetch pattern consistent with the existing file. Source: `assinatura_digital_documentos` filtered by `contrato_id`.

- [ ] **Step 17.3: Render as a new group with badge "Assinado digitalmente"**

Render each row with the existing list item style, badge using the project's `AppBadge` / `SemanticBadge`.

- [ ] **Step 17.4: Type-check + dev smoke**

```bash
npm run type-check && npm run dev
```

- [ ] **Step 17.5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/contrato-documentos-card.tsx
git commit -m "feat(contratos): list digitally-signed documents alongside uploads"
```

---

## Task 18: Final verification

- [ ] **Step 18.1: Run everything**

```bash
npm run type-check
npm test
npm run check:architecture
npm run validate:exports
```

Expected: all pass.

- [ ] **Step 18.2: Manual smoke test**

```bash
npm run dev
```

Open a known trabalhista contract, a known non-trabalhista contract, and a trabalhista contract with missing fields. Exercise:
- Card appears/hides correctly
- Primary button downloads zip with 4 PDFs (open the zip and visually confirm merge rendered variables)
- Modal appears when fields are missing
- Secondary button creates session and shows link modal
- Reclicking secondary returns `reaproveitada` state

- [ ] **Step 18.3: Summary commit (optional)**

If any final touch-up needed, commit. Otherwise plan complete.

---

## Self-review checklist (for the implementing agent)

Before declaring the plan complete, the implementer should confirm:

1. **Every spec requirement has a task:**
   - §3.2 Caminho A (rascunho efêmero) → Tasks 7, 8, 10
   - §3.3 Caminho B (persistente) → Tasks 12, 13
   - §5 Mapeamento de dados → Tasks 1, 2, 3
   - §7 Edge cases (PJ bloqueado, cliente ausente, sessão existente) → Tasks 2 (PJ), 6 (cliente), 12 (sessão)
   - §7.1 Rate limit → Task 14
   - §8 Testes → Tasks 2, 3, 5, 15
   - §11.1 Listar documentos assinados → Task 17 (optional)

2. **Naming consistency:** the constants `FORMULARIO_SLUG_TRABALHISTA` and `SEGMENTO_ID_TRABALHISTA` are used everywhere, not duplicated magic numbers. The mapper's return shape (`cliente`, `parteContrariaNome`, `ctxExtras`) matches how the service uses it.

3. **No placeholders:** Task 12's session columns are verified against the live schema in Step 12.3, not guessed.

4. **Reversibility:** Every task ends in a commit, so any task can be reverted in isolation.
