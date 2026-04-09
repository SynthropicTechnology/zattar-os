# Dashboard Widgets Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar todos os dados mockados/hardcoded do dashboard, conectar os 2 widgets mock (chat + documentos recentes) ao backend real, e substituir as 4 sub-dashboard pages (3 stubs + 1 template fake em inglês) por conteúdo integrado.

**Architecture:** Os widgets conectados seguem o padrão `useDashboard()` context hook que recebe `initialData` do server component. Novos dados (chat metrics, documentos recentes) serão adicionados ao pipeline existente: domain.ts (tipos) → repositories/ (queries) → service.ts (orquestração em batch) → DashboardProvider (context). As sub-dashboards renderizam os widgets do módulo correspondente em layout filtrado.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase (RLS), shadcn/ui, Recharts, Tailwind CSS 4.

---

## Visao Geral das Tarefas

| # | Tarefa | Escopo |
|---|--------|--------|
| 1 | Adicionar tipos de chat e documentos ao domain.ts | Domain |
| 2 | Criar repository de chat metrics | Repository |
| 3 | Criar repository de documentos recentes | Repository |
| 4 | Integrar novos repositories no service pipeline | Service |
| 5 | Criar widget conectado: Chat Ativo | Widget |
| 6 | Criar widget conectado: Documentos Recentes | Widget |
| 7 | Atualizar widget registry (imports mock → conectados) | Registry |
| 8 | Substituir sub-dashboard: Processos | Sub-page |
| 9 | Substituir sub-dashboard: Audiencias | Sub-page |
| 10 | Substituir sub-dashboard: Expedientes | Sub-page |
| 11 | Substituir sub-dashboard financeiro (template fake) | Sub-page |
| 12 | Cleanup: remover componentes financeiro/components/ | Cleanup |

---

## Task 1: Adicionar tipos de chat e documentos ao domain.ts

**Files:**
- Modify: `src/app/(authenticated)/dashboard/domain.ts`

- [ ] **Step 1: Adicionar interfaces ChatResumo e DocumentoRecente**

No final da seção de tipos (antes dos Zod schemas), adicionar:

```typescript
// ─── Chat Resumo ────────────────────────────────────────────────────────────

export interface ChatResumo {
  naoLidas: number;
  salasAtivas: number;
  ultimaMensagem: {
    autor: string;
    preview: string;
    tempo: string; // ISO string
    salaId: string;
  } | null;
}

// ─── Documentos Recentes ────────────────────────────────────────────────────

export interface DocumentoRecente {
  id: string;
  nome: string;
  tipo: 'doc' | 'pdf' | 'planilha' | 'outro';
  atualizadoEm: string; // ISO string
}
```

- [ ] **Step 2: Adicionar campos ao DashboardUsuarioData**

Na interface `DashboardUsuarioData`, adicionar:

```typescript
chatResumo?: ChatResumo;
documentosRecentes?: DocumentoRecente[];
```

Nota: `optional` porque o usuário pode não ter permissão de chat ou documentos.

- [ ] **Step 3: Adicionar ao DashboardAdminData (mesmo campos)**

```typescript
chatResumo?: ChatResumo;
documentosRecentes?: DocumentoRecente[];
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/dashboard/domain.ts
git commit -m "feat(dashboard): add ChatResumo and DocumentoRecente types to domain"
```

---

## Task 2: Criar repository de chat metrics

**Files:**
- Create: `src/app/(authenticated)/dashboard/repositories/chat-metrics.ts`

- [ ] **Step 1: Criar o repository**

```typescript
import { createClient } from '@/lib/supabase/server';

export interface ChatMetricsResult {
  naoLidas: number;
  salasAtivas: number;
  ultimaMensagem: {
    autor: string;
    preview: string;
    tempo: string;
    salaId: string;
  } | null;
}

export async function buscarChatResumo(
  usuarioId: string
): Promise<ChatMetricsResult> {
  const supabase = await createClient();

  try {
    // Contar mensagens não lidas
    const { count: naoLidas } = await supabase
      .from('chat_mensagens')
      .select('*', { count: 'exact', head: true })
      .eq('lida', false)
      .neq('usuario_id', usuarioId);

    // Contar salas ativas do usuário
    const { count: salasAtivas } = await supabase
      .from('chat_salas_membros')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('ativo', true);

    // Última mensagem recebida
    const { data: ultimaMsg } = await supabase
      .from('chat_mensagens')
      .select(`
        id,
        conteudo,
        created_at,
        sala_id,
        usuarios:usuario_id ( nome_exibicao )
      `)
      .neq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      naoLidas: naoLidas ?? 0,
      salasAtivas: salasAtivas ?? 0,
      ultimaMensagem: ultimaMsg
        ? {
            autor: (ultimaMsg.usuarios as any)?.nome_exibicao ?? 'Desconhecido',
            preview:
              ultimaMsg.conteudo.length > 80
                ? ultimaMsg.conteudo.slice(0, 80) + '...'
                : ultimaMsg.conteudo,
            tempo: ultimaMsg.created_at,
            salaId: ultimaMsg.sala_id,
          }
        : null,
    };
  } catch (error) {
    console.error('[dashboard/chat-metrics] Erro ao buscar resumo do chat:', error);
    return { naoLidas: 0, salasAtivas: 0, ultimaMensagem: null };
  }
}
```

**IMPORTANTE:** Antes de implementar, verificar os nomes reais das tabelas e colunas do módulo chat. Ler `src/app/(authenticated)/chat/repository.ts` para confirmar:
- Nome da tabela de mensagens (ex: `chat_mensagens` ou `mensagens`)
- Nome da tabela de membros (ex: `chat_salas_membros` ou `salas_membros`)
- Colunas de leitura (ex: `lida`, `status`, `read_at`)
- Foreign key para usuários

Adaptar as queries acima com os nomes reais encontrados.

- [ ] **Step 2: Exportar no barrel**

Adicionar em `src/app/(authenticated)/dashboard/repositories/index.ts`:

```typescript
export { buscarChatResumo } from './chat-metrics';
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/dashboard/repositories/chat-metrics.ts
git add src/app/(authenticated)/dashboard/repositories/index.ts
git commit -m "feat(dashboard): add chat metrics repository"
```

---

## Task 3: Criar repository de documentos recentes

**Files:**
- Create: `src/app/(authenticated)/dashboard/repositories/documentos-recentes.ts`

- [ ] **Step 1: Criar o repository**

```typescript
import { createClient } from '@/lib/supabase/server';
import type { DocumentoRecente } from '../domain';

function detectarTipoDocumento(nome: string): DocumentoRecente['tipo'] {
  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext)) return 'doc';
  if (ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'planilha';
  return 'outro';
}

export async function buscarDocumentosRecentes(
  usuarioId: string,
  limite = 5
): Promise<DocumentoRecente[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('id, titulo, updated_at')
      .or(`criado_por.eq.${usuarioId},editado_por.eq.${usuarioId}`)
      .order('updated_at', { ascending: false })
      .limit(limite);

    if (error || !data) return [];

    return data.map((doc) => ({
      id: doc.id,
      nome: doc.titulo,
      tipo: detectarTipoDocumento(doc.titulo),
      atualizadoEm: doc.updated_at,
    }));
  } catch (error) {
    console.error('[dashboard/documentos-recentes] Erro:', error);
    return [];
  }
}
```

**IMPORTANTE:** Antes de implementar, verificar as colunas reais em `src/app/(authenticated)/documentos/repository.ts`:
- Nome da tabela (`documentos` ou outro)
- Coluna de título (`titulo`, `nome`, `name`)
- Colunas de autoria (`criado_por`, `editado_por`, `usuario_id`)
- Coluna de atualização (`updated_at`, `atualizado_em`)

- [ ] **Step 2: Exportar no barrel**

Adicionar em `src/app/(authenticated)/dashboard/repositories/index.ts`:

```typescript
export { buscarDocumentosRecentes } from './documentos-recentes';
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/dashboard/repositories/documentos-recentes.ts
git add src/app/(authenticated)/dashboard/repositories/index.ts
git commit -m "feat(dashboard): add documentos recentes repository"
```

---

## Task 4: Integrar novos repositories no service pipeline

**Files:**
- Modify: `src/app/(authenticated)/dashboard/service.ts`

- [ ] **Step 1: Importar novos repositories**

No topo de `service.ts`, adicionar aos imports existentes:

```typescript
import { buscarChatResumo } from './repositories/chat-metrics';
import { buscarDocumentosRecentes } from './repositories/documentos-recentes';
```

- [ ] **Step 2: Adicionar ao batch de queries em obterDashboardUsuario()**

Dentro da função `obterDashboardUsuario()`, localizar o último batch de Promise.all e adicionar as 2 novas queries. Elas devem estar no mesmo batch ou em um batch adicional:

```typescript
// Batch adicional: chat + documentos
const [chatResumo, documentosRecentes] = await Promise.all([
  buscarChatResumo(usuarioId),
  buscarDocumentosRecentes(usuarioId, 5),
]);
```

- [ ] **Step 3: Incluir no objeto de retorno**

No return de `obterDashboardUsuario()`, adicionar:

```typescript
chatResumo,
documentosRecentes,
```

- [ ] **Step 4: Repetir para obterDashboardAdmin() se aplicável**

Se admins também veem esses widgets, adicionar ao pipeline admin:

```typescript
const [chatResumo, documentosRecentes] = await Promise.all([
  buscarChatResumo(usuarioId ?? ''),
  buscarDocumentosRecentes(usuarioId ?? '', 5),
]);
```

E incluir no retorno do admin.

- [ ] **Step 5: Commit**

```bash
git add src/app/(authenticated)/dashboard/service.ts
git commit -m "feat(dashboard): integrate chat and docs into service pipeline"
```

---

## Task 5: Criar widget conectado — Chat Ativo

**Files:**
- Create: `src/app/(authenticated)/dashboard/widgets/pessoal/chat-ativo.tsx`

- [ ] **Step 1: Criar o componente conectado**

```typescript
'use client';

import { MessageCircle } from 'lucide-react';
import { WidgetContainer, ListItem } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function WidgetChatAtivo() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const chat = data?.chatResumo;
  const naoLidas = chat?.naoLidas ?? 0;
  const salasAtivas = chat?.salasAtivas ?? 0;
  const ultimaMsg = chat?.ultimaMensagem;

  const tempoRelativo = ultimaMsg
    ? formatDistanceToNow(new Date(ultimaMsg.tempo), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <WidgetContainer
      title="Chat"
      icon={MessageCircle}
      subtitle="Mensagens e salas ativas"
      depth={1}
    >
      {/* Contador de nao lidas */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="size-10 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <MessageCircle className="size-4 text-primary/50" />
          </div>
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[8px] font-bold text-background flex items-center justify-center tabular-nums">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/50">Nao lidas</p>
          <p className="text-lg font-bold tabular-nums">{naoLidas}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            salas
          </span>
          <span className="text-base font-bold tabular-nums">{salasAtivas}</span>
          <span className="text-[9px] text-muted-foreground/55">ativas</span>
        </div>
      </div>

      {/* Preview da ultima mensagem */}
      {ultimaMsg ? (
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-border/10">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="size-1.5 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] font-semibold text-foreground/70">
              {ultimaMsg.autor}
            </span>
            <span className="text-[9px] text-muted-foreground/55 ml-auto tabular-nums">
              {tempoRelativo}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/55 leading-relaxed line-clamp-2">
            {ultimaMsg.preview}
          </p>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-border/10">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            Nenhuma mensagem recente
          </p>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          {salasAtivas} salas — {naoLidas} pendentes
        </span>
        <Link
          href="/chat"
          className="text-[9px] text-primary/50 font-medium hover:text-primary/70 transition-colors cursor-pointer"
        >
          ver todas
        </Link>
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/dashboard/widgets/pessoal/chat-ativo.tsx
git commit -m "feat(dashboard): create connected chat widget"
```

---

## Task 6: Criar widget conectado — Documentos Recentes

**Files:**
- Create: `src/app/(authenticated)/dashboard/widgets/pessoal/documentos-recentes.tsx`

- [ ] **Step 1: Criar o componente conectado**

```typescript
'use client';

import { FolderOpen, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { WidgetContainer, ListItem } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import type { DocumentoRecente } from '../../domain';

const TIPO_CONFIG: Record<
  DocumentoRecente['tipo'],
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  doc: {
    icon: FileText,
    color: 'text-primary/50',
    bgColor: 'bg-primary/8 border-primary/15',
  },
  pdf: {
    icon: FileImage,
    color: 'text-destructive/50',
    bgColor: 'bg-destructive/8 border-destructive/15',
  },
  planilha: {
    icon: FileSpreadsheet,
    color: 'text-emerald-500/50',
    bgColor: 'bg-emerald-500/8 border-emerald-500/15',
  },
  outro: {
    icon: File,
    color: 'text-muted-foreground/50',
    bgColor: 'bg-muted/50 border-border/15',
  },
};

export function WidgetDocumentosRecentes() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const documentos = data?.documentosRecentes ?? [];

  return (
    <WidgetContainer
      title="Documentos Recentes"
      icon={FolderOpen}
      subtitle="Ultimas edicoes — seus arquivos"
      depth={1}
    >
      {documentos.length > 0 ? (
        <div className="flex flex-col gap-0.5 -mx-1">
          {documentos.slice(0, 5).map((doc) => {
            const config = TIPO_CONFIG[doc.tipo];
            const Icon = config.icon;
            const tempoRelativo = formatDistanceToNow(
              new Date(doc.atualizadoEm),
              { addSuffix: false, locale: ptBR }
            );

            return (
              <ListItem key={doc.id}>
                <div
                  className={`size-7 rounded-lg flex items-center justify-center shrink-0 border ${config.bgColor}`}
                >
                  <Icon className={`size-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-foreground/75 truncate">
                    {doc.nome}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                    editado {tempoRelativo}
                  </p>
                </div>
                <span
                  className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                    doc.tipo === 'pdf'
                      ? 'text-destructive/50 bg-destructive/6'
                      : doc.tipo === 'planilha'
                        ? 'text-emerald-500/50 bg-emerald-500/6'
                        : 'text-primary/50 bg-primary/6'
                  }`}
                >
                  {doc.tipo}
                </span>
              </ListItem>
            );
          })}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-[10px] text-muted-foreground/40">
            Nenhum documento editado recentemente
          </p>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          {documentos.length} recentes
        </span>
        <Link
          href="/documentos"
          className="text-[9px] text-primary/50 font-medium hover:text-primary/70 transition-colors cursor-pointer"
        >
          abrir todos
        </Link>
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/dashboard/widgets/pessoal/documentos-recentes.tsx
git commit -m "feat(dashboard): create connected documentos recentes widget"
```

---

## Task 7: Atualizar widget registry (imports mock -> conectados)

**Files:**
- Modify: `src/app/(authenticated)/dashboard/registry/widget-registry.ts`

- [ ] **Step 1: Substituir imports mock por imports conectados**

Remover linhas 82-89:
```typescript
// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS MOCK (widgets que ainda dependem de modulos nao implementados)
// ═══════════════════════════════════════════════════════════════════════════

import {
  WidgetChatAtivo,
  WidgetDocumentosRecentes,
} from '../mock/widgets/section-pessoal';
```

Adicionar na secao de imports Pessoal (apos linha 80):
```typescript
import { WidgetChatAtivo } from '../widgets/pessoal/chat-ativo';
import { WidgetDocumentosRecentes } from '../widgets/pessoal/documentos-recentes';
```

- [ ] **Step 2: Atualizar comentario no topo**

Mudar o comentario da linha 14 de:
```typescript
// Todos os 52 widgets agora consomem dados do DashboardProvider.
```
Para:
```typescript
// Todos os 52 widgets consomem dados reais do DashboardProvider.
```

(Remover o "agora" que sugeria que era recente.)

- [ ] **Step 3: Verificar que o build compila**

Run: `npm run type-check`
Expected: PASS (sem erros de tipo)

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/dashboard/registry/widget-registry.ts
git commit -m "feat(dashboard): replace mock widget imports with connected versions"
```

---

## Task 8: Substituir sub-dashboard — Processos

**Files:**
- Modify: `src/app/(authenticated)/dashboard/processos/page.tsx`

- [ ] **Step 1: Substituir o stub com page que renderiza widgets de processos**

```typescript
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';

// Widgets de processos
import { WidgetSaudeProcessual } from '../widgets/processos/saude-processual';
import { WidgetHeatmapAtividade } from '../widgets/processos/heatmap-atividade';
import { WidgetStatusDistribuicao } from '../widgets/processos/status-distribuicao';
import { WidgetCasosTribunal } from '../widgets/processos/casos-tribunal';
import { WidgetTendenciaNovos } from '../widgets/processos/tendencia-novos';
import { WidgetAging } from '../widgets/processos/aging';
import { WidgetSegmento } from '../widgets/processos/segmento';
import { WidgetKpiPulse } from '../widgets/processos/kpi-pulse';
import { WidgetProcessosComTabs } from '../widgets/processos/processos-tabs';
import { Heading } from '@/components/ui/typography';

export const metadata: Metadata = {
  title: 'Dashboard — Processos',
  description: 'Visao detalhada do acervo processual, tendencias e distribuicao.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function ProcessosPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Processos</Heading>
        {/* Row 1: Hero + Heatmap */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetSaudeProcessual />
          </div>
          <WidgetHeatmapAtividade />
        </div>
        {/* Row 2: KPIs + Tendencia */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetKpiPulse />
          <WidgetTendenciaNovos />
          <WidgetProcessosComTabs />
        </div>
        {/* Row 3: Distribuicoes */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetStatusDistribuicao />
          <WidgetCasosTribunal />
          <WidgetSegmento />
        </div>
        {/* Row 4: Aging */}
        <WidgetAging />
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 2: Verificar que a pagina renderiza**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/dashboard/processos/page.tsx
git commit -m "feat(dashboard): replace processos stub with connected widget page"
```

---

## Task 9: Substituir sub-dashboard — Audiencias

**Files:**
- Modify: `src/app/(authenticated)/dashboard/audiencias/page.tsx`

- [ ] **Step 1: Substituir o stub**

```typescript
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';

import { ProximasAudiencias } from '../widgets/audiencias/proximas-audiencias';
import { WidgetPreparacao } from '../widgets/audiencias/preparacao';
import { ModalidadeDistribution } from '../widgets/audiencias/modalidade';
import { StatusMensal } from '../widgets/audiencias/status-mensal';
import { KpiStrip } from '../widgets/audiencias/kpi-strip';
import { AudienciasPorTipo } from '../widgets/audiencias/por-tipo';
import { TrendMensal } from '../widgets/audiencias/trend-mensal';
import { WidgetComparativoMensal } from '../widgets/audiencias/comparativo-mensal';
import { WidgetHeatmapSemanal } from '../widgets/audiencias/heatmap-semanal';
import { Heading } from '@/components/ui/typography';

export const metadata: Metadata = {
  title: 'Dashboard — Audiencias',
  description: 'Painel detalhado de audiencias: timeline, modalidades, tendencias e preparacao.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function AudienciasPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Audiencias</Heading>
        {/* Row 1: Proximas + Preparacao */}
        <div className="grid gap-4 md:grid-cols-2">
          <ProximasAudiencias />
          <WidgetPreparacao />
        </div>
        {/* Row 2: KPIs + Comparativo */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiStrip />
          <WidgetComparativoMensal />
          <TrendMensal />
        </div>
        {/* Row 3: Distribuicoes */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModalidadeDistribution />
          <StatusMensal />
          <AudienciasPorTipo />
        </div>
        {/* Row 4: Heatmap */}
        <WidgetHeatmapSemanal />
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/dashboard/audiencias/page.tsx
git commit -m "feat(dashboard): replace audiencias stub with connected widget page"
```

---

## Task 10: Substituir sub-dashboard — Expedientes

**Files:**
- Modify: `src/app/(authenticated)/dashboard/expedientes/page.tsx`

- [ ] **Step 1: Substituir o stub**

```typescript
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';

import { UrgencyList } from '../widgets/expedientes/urgency-list';
import { AgingFunnel } from '../widgets/expedientes/aging-funnel';
import { SaudePrazos } from '../widgets/expedientes/saude-prazos';
import { OrigemDistribution } from '../widgets/expedientes/origem';
import { ResultadoDecisao } from '../widgets/expedientes/resultado-decisao';
import { VolumeSemanal } from '../widgets/expedientes/volume-semanal';
import { PrazoMedio } from '../widgets/expedientes/prazo-medio';
import { CalendarioPrazos } from '../widgets/expedientes/calendario-prazos';
import { TendenciaResponsividade } from '../widgets/expedientes/tendencia-responsividade';
import { Heading } from '@/components/ui/typography';

export const metadata: Metadata = {
  title: 'Dashboard — Expedientes',
  description: 'Painel detalhado de expedientes: urgencias, prazos, volume e responsividade.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function ExpedientesPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Expedientes</Heading>
        {/* Row 1: Urgencias + Funil */}
        <div className="grid gap-4 md:grid-cols-2">
          <UrgencyList />
          <AgingFunnel />
        </div>
        {/* Row 2: Saude + Volume + Prazo */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SaudePrazos />
          <VolumeSemanal />
          <PrazoMedio />
        </div>
        {/* Row 3: Distribuicoes */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <OrigemDistribution />
          <ResultadoDecisao />
          <TendenciaResponsividade />
        </div>
        {/* Row 4: Calendario */}
        <CalendarioPrazos />
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/dashboard/expedientes/page.tsx
git commit -m "feat(dashboard): replace expedientes stub with connected widget page"
```

---

## Task 11: Substituir sub-dashboard financeiro (template fake)

**Files:**
- Modify: `src/app/(authenticated)/dashboard/financeiro/page.tsx`

O page.tsx atual importa 7 componentes com dados em ingles ("My Balance", "$125,430", "Samantha William", cartoes Visa/MasterCard, browsers Chrome/Safari). Substituir por widgets financeiros conectados.

- [ ] **Step 1: Reescrever page.tsx com widgets financeiros reais**

```typescript
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';

import { WidgetSaúdeFinanceira } from '../widgets/financeiro/saude-financeira';
import { WidgetFluxoComTabs } from '../widgets/financeiro/fluxo-tabs';
import { WidgetFluxoCaixa } from '../widgets/financeiro/fluxo-caixa';
import { WidgetSaldoTrend } from '../widgets/financeiro/saldo-trend';
import { WidgetContasReceber } from '../widgets/financeiro/contas-receber';
import { WidgetContasPagar } from '../widgets/financeiro/contas-pagar';
import { WidgetDespesasCategoria } from '../widgets/financeiro/despesas-categoria';
import { WidgetDREComparativo } from '../widgets/financeiro/dre-comparativo';
import { WidgetInadimplencia } from '../widgets/financeiro/inadimplencia';
import { WidgetDespesasTreemap } from '../widgets/financeiro/despesas-treemap';
import { Heading } from '@/components/ui/typography';

export const metadata: Metadata = {
  title: 'Dashboard — Financeiro',
  description: 'Visao financeira consolidada: fluxo de caixa, contas, despesas e DRE.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function FinanceiroPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Financeiro</Heading>
        {/* Row 1: Hero saude financeira + Inadimplencia */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetSaúdeFinanceira />
          </div>
          <WidgetInadimplencia />
        </div>
        {/* Row 2: Fluxo de caixa + Saldo */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetFluxoCaixa />
          </div>
          <WidgetSaldoTrend />
        </div>
        {/* Row 3: Contas receber + Contas pagar + Despesas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetContasReceber />
          <WidgetContasPagar />
          <WidgetDespesasCategoria />
        </div>
        {/* Row 4: DRE + Fluxo tabs + Treemap */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetDREComparativo />
          <WidgetFluxoComTabs />
          <WidgetDespesasTreemap />
        </div>
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/dashboard/financeiro/page.tsx
git commit -m "feat(dashboard): replace mocked financeiro sub-dashboard with real widgets"
```

---

## Task 12: Cleanup — remover componentes financeiro/components/ mockados

**Files:**
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/kpi-cards.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/revenue.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/monthly-expenses.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/summary.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/transactions.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/my-wallet.tsx`
- Delete: `src/app/(authenticated)/dashboard/financeiro/components/saving-goal.tsx`

- [ ] **Step 1: Verificar que nenhum outro arquivo importa esses componentes**

Run: `grep -r "financeiro/components/kpi-cards\|financeiro/components/revenue\|financeiro/components/monthly-expenses\|financeiro/components/summary\|financeiro/components/transactions\|financeiro/components/my-wallet\|financeiro/components/saving-goal" src/`
Expected: Apenas o antigo `financeiro/page.tsx` (que ja foi reescrito na Task 11)

- [ ] **Step 2: Deletar todos os 7 arquivos**

```bash
rm src/app/(authenticated)/dashboard/financeiro/components/kpi-cards.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/revenue.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/monthly-expenses.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/summary.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/transactions.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/my-wallet.tsx
rm src/app/(authenticated)/dashboard/financeiro/components/saving-goal.tsx
rmdir src/app/(authenticated)/dashboard/financeiro/components/ 2>/dev/null || true
```

- [ ] **Step 3: Verificar build**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A src/app/(authenticated)/dashboard/financeiro/components/
git commit -m "chore(dashboard): remove mocked financeiro template components"
```

---

## Notas de Implementacao

### Funcao prefetchData() duplicada

As Tasks 8-11 duplicam `prefetchData()` em cada sub-page. Isso e intencional — cada page.tsx e um Server Component independente que precisa buscar seus proprios dados. Extrair para um helper compartilhado e possivel mas nao prioritario.

### Mock Gallery (/dashboard/mock/)

Os arquivos em `dashboard/mock/` (page.tsx, command-hub/, widgets/) NAO serao deletados. Eles servem como galeria de referencia visual durante o desenvolvimento. Podem ser removidos futuramente quando o design system estiver documentado.

### Tabelas Supabase

Os repositories de chat e documentos (Tasks 2-3) precisam ser adaptados aos nomes reais das tabelas. Os nomes usados no plano sao baseados em convencoes do projeto, mas devem ser verificados contra:
- `src/app/(authenticated)/chat/repository.ts` (tabelas de chat)
- `src/app/(authenticated)/documentos/repository.ts` (tabela de documentos)
- `supabase/migrations/` (esquemas oficiais)
