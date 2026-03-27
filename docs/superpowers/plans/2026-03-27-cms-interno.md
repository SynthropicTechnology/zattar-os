# CMS Interno — Plano de Implementacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um CMS interno usando Supabase para que nao-tecnicos editem o conteudo do site institucional via interface admin em `/app/configuracoes/website/`.

**Architecture:** Tabelas Supabase (`cms_paginas`, `cms_secoes`, `cms_artigos`, `cms_categorias`, `cms_depoimentos`, `cms_faq`) com conteudo JSONB validado por Zod schemas. Feature `src/features/cms/` seguindo o pattern Server Actions + Repository existente. Cache Redis com invalidacao ao salvar. Editor de blog via Plate.js + AI Kit.

**Tech Stack:** Next.js (App Router), Supabase (PostgreSQL + Storage + RLS), Redis, Zod, React Hook Form, Plate.js, shadcn/ui, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-27-cms-interno-design.md`

---

## Task 1: Supabase Migration — Criar tabelas CMS

**Files:**
- Create: `supabase/migrations/20260327200000_create_cms_tables.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
-- =============================================================================
-- CMS TABLES
-- =============================================================================

-- Paginas do site institucional
CREATE TABLE cms_paginas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  titulo text NOT NULL,
  seo_titulo text,
  seo_descricao text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  atualizado_em timestamptz DEFAULT now(),
  atualizado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em timestamptz DEFAULT now()
);

-- Secoes dentro de cada pagina (conteudo JSONB estruturado)
CREATE TABLE cms_secoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id uuid NOT NULL REFERENCES cms_paginas(id) ON DELETE CASCADE,
  slug text NOT NULL,
  titulo text NOT NULL,
  conteudo jsonb NOT NULL DEFAULT '{}',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE (pagina_id, slug)
);

CREATE INDEX idx_cms_secoes_pagina_ordem ON cms_secoes (pagina_id, ordem);

-- Categorias de artigos do blog
CREATE TABLE cms_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  cor text,
  ordem integer DEFAULT 0
);

-- Artigos do blog (Plate.js JSON)
CREATE TABLE cms_artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  titulo text NOT NULL,
  resumo text,
  conteudo jsonb,
  imagem_capa_url text,
  categoria_id uuid REFERENCES cms_categorias(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  tempo_leitura integer,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  publicado_em timestamptz,
  autor_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  seo_titulo text,
  seo_descricao text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX idx_cms_artigos_status_pub ON cms_artigos (status, publicado_em DESC);

-- Depoimentos / Testimonials
CREATE TABLE cms_depoimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text,
  depoimento text NOT NULL,
  avatar_url text,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0
);

-- Perguntas frequentes
CREATE TABLE cms_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  resposta text NOT NULL,
  categoria text,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0
);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE cms_paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_artigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_faq ENABLE ROW LEVEL SECURITY;

-- Leitura publica (conteudo publicado/ativo)
CREATE POLICY "cms_paginas_public_read" ON cms_paginas
  FOR SELECT USING (status = 'publicado');

CREATE POLICY "cms_secoes_public_read" ON cms_secoes
  FOR SELECT USING (
    ativo = true
    AND EXISTS (SELECT 1 FROM cms_paginas WHERE id = cms_secoes.pagina_id AND status = 'publicado')
  );

CREATE POLICY "cms_artigos_public_read" ON cms_artigos
  FOR SELECT USING (status = 'publicado');

CREATE POLICY "cms_categorias_public_read" ON cms_categorias
  FOR SELECT USING (true);

CREATE POLICY "cms_depoimentos_public_read" ON cms_depoimentos
  FOR SELECT USING (ativo = true);

CREATE POLICY "cms_faq_public_read" ON cms_faq
  FOR SELECT USING (ativo = true);

-- Escrita admin (usuario autenticado)
CREATE POLICY "cms_paginas_admin_all" ON cms_paginas
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cms_secoes_admin_all" ON cms_secoes
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cms_artigos_admin_all" ON cms_artigos
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cms_categorias_admin_all" ON cms_categorias
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cms_depoimentos_admin_all" ON cms_depoimentos
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cms_faq_admin_all" ON cms_faq
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('website', 'website', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "website_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'website');

CREATE POLICY "website_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'website' AND auth.uid() IS NOT NULL);

CREATE POLICY "website_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'website' AND auth.uid() IS NOT NULL);

CREATE POLICY "website_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'website' AND auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Aplicar migration**

Run: `npx supabase db push` ou `npx supabase migration up` (conforme setup local)
Expected: Migration aplicada sem erros

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260327200000_create_cms_tables.sql
git commit -m "feat(cms): create CMS tables, RLS policies, and storage bucket"
```

---

## Task 2: Seed — Popular tabelas com conteudo existente

**Files:**
- Create: `supabase/migrations/20260327200001_seed_cms_content.sql`

- [ ] **Step 1: Criar migration de seed com conteudo hardcoded atual**

```sql
-- =============================================================================
-- SEED: Paginas
-- =============================================================================

INSERT INTO cms_paginas (slug, titulo, seo_titulo, seo_descricao, status) VALUES
  ('home', 'Pagina Inicial', 'Zattar Advogados — Justica para quem trabalha', 'Unimos tecnologia de ponta e expertise juridica para garantir que seus direitos sejam respeitados.', 'publicado'),
  ('contato', 'Contato', 'Contato — Zattar Advogados', 'Entre em contato com a Zattar Advogados. Estamos prontos para escalar suas operacoes juridicas.', 'publicado'),
  ('servicos', 'Servicos', 'Servicos para o Trabalhador — Zattar Advogados', 'A tecnologia a servico dos seus direitos trabalhistas.', 'publicado'),
  ('expertise', 'Expertise', 'Expertise Juridica de Vanguarda — Zattar Advogados', 'Combinamos a profundidade intelectual do direito tradicional com a agilidade algoritmica.', 'publicado'),
  ('solucoes', 'Solucoes', 'Solucoes Juridicas Digitais — Zattar Advogados', 'Aceleramos a entrega de justica atraves de processamento de linguagem natural.', 'publicado'),
  ('faq', 'Perguntas Frequentes', 'FAQ — Zattar Advogados', 'Encontre respostas rapidas para suas duvidas juridicas e sobre a plataforma.', 'publicado'),
  ('insights', 'Insights', 'Insights e Tendencias — Zattar Advogados', 'Navegando na intersecao entre tecnologia disruptiva e o direito do trabalho.', 'publicado');

-- =============================================================================
-- SEED: Secoes da HOME
-- =============================================================================

INSERT INTO cms_secoes (pagina_id, slug, titulo, conteudo, ordem) VALUES
(
  (SELECT id FROM cms_paginas WHERE slug = 'home'),
  'hero',
  'Hero',
  '{
    "label": "A Nova Era da Advocacia Trabalhista",
    "titulo": "Justica para quem trabalha.",
    "subtitulo": "Unimos tecnologia de ponta e expertise juridica para garantir que seus direitos sejam respeitados com a velocidade que o mundo moderno exige.",
    "cta_primario": {"texto": "Fale com um Especialista", "url": "/contato"},
    "cta_secundario": {"texto": "Nossas Solucoes", "url": "#solucoes"},
    "video_url": "https://customer-lvnfk43x7eec1csc.cloudflarestream.com/500dc4de24fbf5ec2457f4779c4faded/iframe?muted=true&loop=true&autoplay=true&controls=false"
  }'::jsonb,
  0
),
(
  (SELECT id FROM cms_paginas WHERE slug = 'home'),
  'services',
  'Especialidades',
  '{
    "label": "Especialidades",
    "titulo": "Solucoes juridicas de alta precisao digital.",
    "itens": [
      {
        "layout": "image-left",
        "titulo": "Defesa Assertiva.",
        "descricao": "Utilizamos analise preditiva para identificar irregularidades em rescisoes complexas, garantindo que nenhum direito seja negligenciado.",
        "icone": "Gavel",
        "overlay_titulo": "Demissao sem justa causa",
        "overlay_descricao": "Protecao imediata e estrategica em rescisoes abusivas com suporte digital.",
        "imagem_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBMczbgwNePWlBWRgiSkyzGfaZrHyEXJ8Awz6YtA-kWrk8BRe36xM7pS6Z5kpK9Vdky2Z3dq33pyyU9e_jYUfyzFofEKCSIwrpi_-XyTZBn8wrBhIvVwCHJCcTNNtCZRdh8Y3iEPT3AtSNtYnvw72X_FJo0Sa-a8eYyFNEnPB3jFnOuCP0J9OK_QmK6qNm_Digzo9I6AcLWyAU6ISTvr7Z5B-qUoEdGJI08pai8hAjxZuyNrPDT9_tyWNv9JY5YZVqpp8iPGQoiwkwh",
        "imagem_alt": "Interface de dados de alta tecnologia com simbolos juridicos e linhas brilhantes roxas",
        "cta": {"texto": "Consultar caso", "url": "/expertise"}
      },
      {
        "layout": "text-left",
        "titulo": "Recuperacao de Ativos.",
        "descricao": "Auditoria automatizada de FGTS e verbas rescisorias para identificar cada centavo devido pela contratante.",
        "icone": "Wallet",
        "overlay_titulo": "FGTS e Verbas",
        "overlay_descricao": "Recuperacao integral de horas extras e depositos pendentes com auditoria digital.",
        "imagem_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuA1t80OFnMZ9glumnSw0NK5KQxfF8c7eNY-xJuoeAv5yu7QuRTE3alXiXpGWrhrBPMqYYM4v7jx6S4eVQw9AJzMcxnrq5dj6_rqiWkHhKTTlJvA_gRCxwC9oyLztE_cTMfw7qV2Wtozu9DifRqt4MNMGMFBzv7Xsu_bCq5xYJ6Ha4bYqu09PmoQ6OOGFp_N7i-coFHgVdhS2JanujkK6A1DKoQXo-pHTzr1KgS3dvTBZfHxihyqzUIYehZO9-4yAw6JVKYpqIzYbEda",
        "imagem_alt": "Dados financeiros e simbolos de moeda digital em tela escura com destaques roxos",
        "cta": {"texto": "Verificar depositos", "url": "/expertise"}
      },
      {
        "layout": "image-left",
        "titulo": "Justica Reparadora.",
        "descricao": "Combinamos pericia especializada e tecnologia para construir casos solidos de reparacao em saude do trabalhador.",
        "icone": "HeartPulse",
        "overlay_titulo": "Acidentes de Trabalho",
        "overlay_descricao": "Suporte juridico-tecnico completo para indenizacoes por doencas e acidentes laborais.",
        "imagem_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBndeP_TrZYWaqkXabXlacL39lZl9vdBV32heYFlkVewN30Ke7tc2YX_ruVmw8X7Pz86jo4tzOK8Xa-XQxi9by6CF1yboQDULko5E2Ho5dlyrfbUmvRrHbRsTyXeti2XNEEQWqLm1iFptn3LD_bapazzTRB47A10tEGxPtZ4G-WFctjdx4g75_wMJZLghwxXUNRtP8QHGyl1OTq_9shD5GkRfraKK5spA6duR1n9jzL1mB_6Ekunam3DTOfuSrc5hRt07HYe_jtH-w8",
        "imagem_alt": "Visualizacao futurista de dados medicos e anatomia humana em display digital escuro",
        "cta": {"texto": "Relatar ocorrencia", "url": "/expertise"}
      }
    ]
  }'::jsonb,
  1
),
(
  (SELECT id FROM cms_paginas WHERE slug = 'home'),
  'about',
  'Sobre',
  '{
    "label": "A Revolucao Juridica",
    "titulo": "O Direito do Trabalho reimaginado.",
    "descricao": "Esqueca a burocracia lenta e o atendimento distante. Na Zattar Advogados, utilizamos automacao inteligente para acelerar o protocolo de peticoes e analise de provas, mantendo voce informado em tempo real.",
    "features": [
      {"titulo": "Transparencia Digital", "descricao": "Acompanhe seu caso atraves do nosso dashboard exclusivo."},
      {"titulo": "Inteligencia Preditiva", "descricao": "Analise estatistica de decisoes para aumentar as chances de exito."}
    ],
    "cta_primario": {"texto": "Fale com um Especialista", "url": "/contato"},
    "cta_secundario": {"texto": "Conheca nossa Metodologia", "url": "#"},
    "imagem_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuC4s68vvVIR2eH9z9YzLyHzYC86wmTsW9lCpLmnX19msfjKHu0ANV84BR2b6h1xJ6utqY5EOVMu_5_2m88XisLo8NhngBqnL3YOWe6u3UZPQSdxNkjnD9YLgQMRwpVjIKDi0pKonYT6ojwaEHb9by3w6eisSb9t5PtNIZ4Le86nwgKvSD4Jti802SOMNH5x48whGMzERpGgHAUGoPx-cv6EoIfGbN_N9q_PTAGyds9iFysoL089Sj_9ZIPBFIp2gkFDuPnC7kCxq5cH",
    "imagem_alt": "Dynamic tech team working in a futuristic dark office"
  }'::jsonb,
  2
);

-- =============================================================================
-- SEED: Secoes do CONTATO
-- =============================================================================

INSERT INTO cms_secoes (pagina_id, slug, titulo, conteudo, ordem) VALUES
(
  (SELECT id FROM cms_paginas WHERE slug = 'contato'),
  'hero',
  'Hero',
  '{
    "titulo": "Conecte-se com o futuro da advocacia.",
    "subtitulo": "Estamos prontos para escalar suas operacoes juridicas com inteligencia de alta velocidade e precisao tecnica."
  }'::jsonb,
  0
),
(
  (SELECT id FROM cms_paginas WHERE slug = 'contato'),
  'info',
  'Informacoes de Contato',
  '{
    "endereco": "Rua dos Inconfidentes, 911 - 7o andar, Bairro Savassi, Belo Horizonte/MG, CEP: 30140-120",
    "email": "contato@zattaradvogados.com.br",
    "whatsapp": "+55 (11) 99876-5432",
    "telefone": "(31) 2115-2975"
  }'::jsonb,
  1
),
(
  (SELECT id FROM cms_paginas WHERE slug = 'contato'),
  'social',
  'Redes Sociais',
  '{
    "links": [
      {"rede": "instagram", "url": "https://www.instagram.com/zattar.advogados/"},
      {"rede": "linkedin", "url": "https://www.linkedin.com/company/zattaradvogados"},
      {"rede": "facebook", "url": "https://www.facebook.com/share/14Qyx3EPgxy/"}
    ]
  }'::jsonb,
  2
);

-- =============================================================================
-- SEED: Secoes do INSIGHTS
-- =============================================================================

INSERT INTO cms_secoes (pagina_id, slug, titulo, conteudo, ordem) VALUES
(
  (SELECT id FROM cms_paginas WHERE slug = 'insights'),
  'hero',
  'Hero',
  '{
    "label": "Inteligencia Editorial",
    "titulo": "Insights e Tendencias do Direito do Amanha.",
    "subtitulo": "Navegando na intersecao entre tecnologia disruptiva e o direito do trabalho contemporaneo."
  }'::jsonb,
  0
),
(
  (SELECT id FROM cms_paginas WHERE slug = 'insights'),
  'newsletter',
  'Newsletter',
  '{
    "titulo": "Fique por dentro das atualizacoes juridicas.",
    "descricao": "Junte-se a 15.000+ profissionais que recebem nossa curadoria semanal de inteligencia juridica e inovacao.",
    "cta": "Inscrever-se",
    "disclaimer": "Ao se inscrever, voce concorda com nossa Politica de Privacidade. Sem spam, garantimos."
  }'::jsonb,
  1
);

-- =============================================================================
-- SEED: Depoimentos
-- =============================================================================

INSERT INTO cms_depoimentos (nome, cargo, depoimento, ativo, ordem) VALUES
  ('Ricardo Santos', 'Engenheiro de Software', 'O atendimento foi excepcionalmente rapido. Consegui resolver meu problema com o FGTS em tempo recorde gracas a plataforma digital deles.', true, 0),
  ('Mariana Costa', 'Gerente Comercial', 'Sentia-me desamparada apos a demissao, mas a equipe do Magistrate foi humana e tecnicamente impecavel no meu processo.', true, 1),
  ('Joao Oliveira', 'Logistica', 'A tecnologia deles faz toda a diferenca. Recebi notificacoes em cada etapa e nunca me senti no escuro sobre o andamento.', true, 2);

-- =============================================================================
-- SEED: FAQs
-- =============================================================================

INSERT INTO cms_faq (pergunta, resposta, categoria, ativo, ordem) VALUES
  ('Como calcular minha rescisao?', 'Utilize nossa calculadora online no portal do cliente para simular os valores. Nosso sistema leva em conta salario, tempo de servico, FGTS e todas as verbas rescisorias.', 'trabalhista', true, 0),
  ('O que e rescisao indireta?', 'A rescisao indireta e quando o empregado pede demissao por culpa do empregador, mantendo todos os direitos. Exemplos: atraso de salario, assedio, descumprimento contratual.', 'trabalhista', true, 1),
  ('Quais documentos preciso para um processo?', 'Geralmente: carteira de trabalho, holerites, contrato de trabalho, comprovante de rescisao e quaisquer provas de irregularidades. Nossa plataforma digitaliza tudo automaticamente.', 'plataforma', true, 2),
  ('Meus dados estao seguros na plataforma?', 'Sim. Utilizamos criptografia de ponta-a-ponta, servidores em nuvem com certificacao ISO 27001 e conformidade total com a LGPD.', 'seguranca', true, 3);

-- =============================================================================
-- SEED: Categorias de artigos
-- =============================================================================

INSERT INTO cms_categorias (nome, slug, cor, ordem) VALUES
  ('Novas Leis', 'novas-leis', 'primary', 0),
  ('Tecnologia no Judiciario', 'tecnologia-judiciario', 'secondary', 1),
  ('Direitos do Trabalhador', 'direitos-trabalhador', 'success', 2),
  ('Case Study', 'case-study', 'warning', 3);
```

- [ ] **Step 2: Aplicar migration**

Run: `npx supabase db push`
Expected: Seed data inserido sem erros

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260327200001_seed_cms_content.sql
git commit -m "feat(cms): seed CMS tables with existing hardcoded content"
```

---

## Task 3: Feature CMS — Domain types e Zod schemas

**Files:**
- Create: `src/features/cms/domain/tipos.ts`
- Create: `src/features/cms/domain/schemas.ts`
- Create: `src/features/cms/domain/index.ts`

- [ ] **Step 1: Criar tipos TypeScript**

`src/features/cms/domain/tipos.ts`:

```typescript
export interface CmsPagina {
  id: string;
  slug: string;
  titulo: string;
  seo_titulo: string | null;
  seo_descricao: string | null;
  status: 'rascunho' | 'publicado';
  atualizado_em: string;
  atualizado_por: string | null;
  criado_em: string;
}

export interface CmsSecao {
  id: string;
  pagina_id: string;
  slug: string;
  titulo: string;
  conteudo: Record<string, unknown>;
  ordem: number;
  ativo: boolean;
  atualizado_em: string;
}

export interface CmsArtigo {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: unknown;
  imagem_capa_url: string | null;
  categoria_id: string | null;
  tags: string[];
  tempo_leitura: number | null;
  status: 'rascunho' | 'publicado';
  publicado_em: string | null;
  autor_id: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  criado_em: string;
  atualizado_em: string;
  // Join fields
  categoria?: CmsCategoria | null;
}

export interface CmsCategoria {
  id: string;
  nome: string;
  slug: string;
  cor: string | null;
  ordem: number;
}

export interface CmsDepoimento {
  id: string;
  nome: string;
  cargo: string | null;
  depoimento: string;
  avatar_url: string | null;
  ativo: boolean;
  ordem: number;
}

export interface CmsFaq {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string | null;
  ativo: boolean;
  ordem: number;
}

// ---- Conteudo JSONB tipado por secao ----

export interface CtaLink {
  texto: string;
  url: string;
}

export interface HeroConteudo {
  label?: string;
  titulo: string;
  subtitulo: string;
  cta_primario?: CtaLink;
  cta_secundario?: CtaLink;
  video_url?: string;
  imagem_url?: string;
}

export interface ServiceItem {
  layout: 'image-left' | 'text-left';
  titulo: string;
  descricao: string;
  icone: string;
  overlay_titulo: string;
  overlay_descricao: string;
  imagem_url: string;
  imagem_alt: string;
  cta: CtaLink;
}

export interface ServicesConteudo {
  label: string;
  titulo: string;
  itens: ServiceItem[];
}

export interface AboutFeature {
  titulo: string;
  descricao: string;
}

export interface AboutConteudo {
  label: string;
  titulo: string;
  descricao: string;
  features: AboutFeature[];
  cta_primario: CtaLink;
  cta_secundario?: CtaLink;
  imagem_url: string;
  imagem_alt?: string;
}

export interface ContatoInfoConteudo {
  endereco: string;
  email: string;
  whatsapp: string;
  telefone?: string;
}

export interface SocialLink {
  rede: string;
  url: string;
}

export interface SocialConteudo {
  links: SocialLink[];
}

export interface NewsletterConteudo {
  titulo: string;
  descricao: string;
  cta: string;
  disclaimer?: string;
}
```

- [ ] **Step 2: Criar Zod schemas**

`src/features/cms/domain/schemas.ts`:

```typescript
import { z } from 'zod';

// ---- Shared ----

const ctaLinkSchema = z.object({
  texto: z.string().min(1),
  url: z.string().min(1),
});

// ---- Secao schemas ----

export const heroSchema = z.object({
  label: z.string().optional(),
  titulo: z.string().min(1),
  subtitulo: z.string().min(1),
  cta_primario: ctaLinkSchema.optional(),
  cta_secundario: ctaLinkSchema.optional(),
  video_url: z.string().optional(),
  imagem_url: z.string().optional(),
});

export const servicesSchema = z.object({
  label: z.string(),
  titulo: z.string(),
  itens: z.array(z.object({
    layout: z.enum(['image-left', 'text-left']),
    titulo: z.string().min(1),
    descricao: z.string().min(1),
    icone: z.string().min(1),
    overlay_titulo: z.string().min(1),
    overlay_descricao: z.string().min(1),
    imagem_url: z.string(),
    imagem_alt: z.string(),
    cta: ctaLinkSchema,
  })),
});

export const aboutSchema = z.object({
  label: z.string(),
  titulo: z.string(),
  descricao: z.string(),
  features: z.array(z.object({
    titulo: z.string().min(1),
    descricao: z.string().min(1),
  })),
  cta_primario: ctaLinkSchema,
  cta_secundario: ctaLinkSchema.optional(),
  imagem_url: z.string(),
  imagem_alt: z.string().optional(),
});

export const contatoInfoSchema = z.object({
  endereco: z.string().min(1),
  email: z.string().email(),
  whatsapp: z.string().min(1),
  telefone: z.string().optional(),
});

export const socialSchema = z.object({
  links: z.array(z.object({
    rede: z.string().min(1),
    url: z.string().url(),
  })),
});

export const newsletterSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  cta: z.string().min(1),
  disclaimer: z.string().optional(),
});

/**
 * Mapa slug da secao -> Zod schema.
 * Usado pelo admin para validar conteudo antes de salvar.
 */
export const secaoSchemas: Record<string, z.ZodSchema> = {
  hero: heroSchema,
  services: servicesSchema,
  about: aboutSchema,
  info: contatoInfoSchema,
  social: socialSchema,
  newsletter: newsletterSchema,
};

// ---- Artigo schema (para formulario do admin) ----

export const artigoFormSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  slug: z.string().min(1, 'Slug e obrigatorio').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens'),
  resumo: z.string().optional(),
  imagem_capa_url: z.string().optional(),
  categoria_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  tempo_leitura: z.number().int().positive().optional().nullable(),
  seo_titulo: z.string().optional(),
  seo_descricao: z.string().optional(),
});

// ---- Depoimento schema ----

export const depoimentoFormSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cargo: z.string().optional(),
  depoimento: z.string().min(1, 'Depoimento e obrigatorio'),
  avatar_url: z.string().optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0),
});

// ---- FAQ schema ----

export const faqFormSchema = z.object({
  pergunta: z.string().min(1, 'Pergunta e obrigatoria'),
  resposta: z.string().min(1, 'Resposta e obrigatoria'),
  categoria: z.string().optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0),
});

// ---- Categoria schema ----

export const categoriaFormSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  cor: z.string().optional(),
  ordem: z.number().int().default(0),
});
```

- [ ] **Step 3: Criar barrel export**

`src/features/cms/domain/index.ts`:

```typescript
export type {
  CmsPagina,
  CmsSecao,
  CmsArtigo,
  CmsCategoria,
  CmsDepoimento,
  CmsFaq,
  CtaLink,
  HeroConteudo,
  ServiceItem,
  ServicesConteudo,
  AboutFeature,
  AboutConteudo,
  ContatoInfoConteudo,
  SocialLink,
  SocialConteudo,
  NewsletterConteudo,
} from './tipos';

export {
  heroSchema,
  servicesSchema,
  aboutSchema,
  contatoInfoSchema,
  socialSchema,
  newsletterSchema,
  secaoSchemas,
  artigoFormSchema,
  depoimentoFormSchema,
  faqFormSchema,
  categoriaFormSchema,
} from './schemas';
```

- [ ] **Step 4: Commit**

```bash
git add src/features/cms/domain/
git commit -m "feat(cms): add domain types and Zod schemas for CMS content"
```

---

## Task 4: Feature CMS — Repository

**Files:**
- Create: `src/features/cms/repository.ts`

- [ ] **Step 1: Criar repository com queries Supabase**

```typescript
import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CmsPagina,
  CmsSecao,
  CmsArtigo,
  CmsCategoria,
  CmsDepoimento,
  CmsFaq,
} from './domain';

type DbClient = SupabaseClient;

// =============================================================================
// PAGINAS
// =============================================================================

export async function buscarPagina(db: DbClient, slug: string): Promise<CmsPagina | null> {
  const { data, error } = await db
    .from('cms_paginas')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as CmsPagina;
}

export async function listarPaginas(db: DbClient): Promise<CmsPagina[]> {
  const { data, error } = await db
    .from('cms_paginas')
    .select('*')
    .order('titulo');
  if (error) return [];
  return (data ?? []) as CmsPagina[];
}

export async function atualizarPagina(
  db: DbClient,
  id: string,
  updates: Partial<Pick<CmsPagina, 'titulo' | 'seo_titulo' | 'seo_descricao' | 'status' | 'atualizado_por'>>
): Promise<CmsPagina | null> {
  const { data, error } = await db
    .from('cms_paginas')
    .update({ ...updates, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsPagina;
}

// =============================================================================
// SECOES
// =============================================================================

export async function listarSecoesDaPagina(db: DbClient, paginaSlug: string): Promise<CmsSecao[]> {
  const { data, error } = await db
    .from('cms_secoes')
    .select('*, cms_paginas!inner(slug)')
    .eq('cms_paginas.slug', paginaSlug)
    .order('ordem');
  if (error) return [];
  return (data ?? []) as CmsSecao[];
}

export async function atualizarSecao(
  db: DbClient,
  id: string,
  updates: Partial<Pick<CmsSecao, 'conteudo' | 'ativo' | 'ordem'>>
): Promise<CmsSecao | null> {
  const { data, error } = await db
    .from('cms_secoes')
    .update({ ...updates, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsSecao;
}

// =============================================================================
// ARTIGOS
// =============================================================================

export async function listarArtigos(
  db: DbClient,
  params?: { status?: string; categoria_id?: string; limit?: number; offset?: number }
): Promise<{ data: CmsArtigo[]; total: number }> {
  let query = db
    .from('cms_artigos')
    .select('*, cms_categorias(id, nome, slug, cor)', { count: 'exact' });

  if (params?.status) query = query.eq('status', params.status);
  if (params?.categoria_id) query = query.eq('categoria_id', params.categoria_id);

  query = query.order('publicado_em', { ascending: false, nullsFirst: false });

  if (params?.limit) query = query.limit(params.limit);
  if (params?.offset) query = query.range(params.offset, params.offset + (params.limit ?? 10) - 1);

  const { data, error, count } = await query;
  if (error) return { data: [], total: 0 };

  const artigos = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    categoria: row.cms_categorias ?? null,
  })) as CmsArtigo[];

  return { data: artigos, total: count ?? 0 };
}

export async function buscarArtigo(db: DbClient, slug: string): Promise<CmsArtigo | null> {
  const { data, error } = await db
    .from('cms_artigos')
    .select('*, cms_categorias(id, nome, slug, cor)')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return { ...data, categoria: data.cms_categorias ?? null } as CmsArtigo;
}

export async function buscarArtigoPorId(db: DbClient, id: string): Promise<CmsArtigo | null> {
  const { data, error } = await db
    .from('cms_artigos')
    .select('*, cms_categorias(id, nome, slug, cor)')
    .eq('id', id)
    .single();
  if (error) return null;
  return { ...data, categoria: data.cms_categorias ?? null } as CmsArtigo;
}

export async function criarArtigo(
  db: DbClient,
  artigo: Omit<CmsArtigo, 'id' | 'criado_em' | 'atualizado_em' | 'categoria'>
): Promise<CmsArtigo | null> {
  const { data, error } = await db
    .from('cms_artigos')
    .insert(artigo)
    .select()
    .single();
  if (error) return null;
  return data as CmsArtigo;
}

export async function atualizarArtigo(
  db: DbClient,
  id: string,
  updates: Partial<Omit<CmsArtigo, 'id' | 'criado_em' | 'categoria'>>
): Promise<CmsArtigo | null> {
  const { data, error } = await db
    .from('cms_artigos')
    .update({ ...updates, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsArtigo;
}

export async function deletarArtigo(db: DbClient, id: string): Promise<boolean> {
  const { error } = await db.from('cms_artigos').delete().eq('id', id);
  return !error;
}

// =============================================================================
// CATEGORIAS
// =============================================================================

export async function listarCategorias(db: DbClient): Promise<CmsCategoria[]> {
  const { data, error } = await db
    .from('cms_categorias')
    .select('*')
    .order('ordem');
  if (error) return [];
  return (data ?? []) as CmsCategoria[];
}

export async function criarCategoria(
  db: DbClient,
  categoria: Omit<CmsCategoria, 'id'>
): Promise<CmsCategoria | null> {
  const { data, error } = await db
    .from('cms_categorias')
    .insert(categoria)
    .select()
    .single();
  if (error) return null;
  return data as CmsCategoria;
}

export async function atualizarCategoria(
  db: DbClient,
  id: string,
  updates: Partial<Omit<CmsCategoria, 'id'>>
): Promise<CmsCategoria | null> {
  const { data, error } = await db
    .from('cms_categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsCategoria;
}

export async function deletarCategoria(db: DbClient, id: string): Promise<boolean> {
  const { error } = await db.from('cms_categorias').delete().eq('id', id);
  return !error;
}

// =============================================================================
// DEPOIMENTOS
// =============================================================================

export async function listarDepoimentos(db: DbClient, apenasAtivos = false): Promise<CmsDepoimento[]> {
  let query = db.from('cms_depoimentos').select('*');
  if (apenasAtivos) query = query.eq('ativo', true);
  query = query.order('ordem');
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as CmsDepoimento[];
}

export async function criarDepoimento(
  db: DbClient,
  depoimento: Omit<CmsDepoimento, 'id'>
): Promise<CmsDepoimento | null> {
  const { data, error } = await db
    .from('cms_depoimentos')
    .insert(depoimento)
    .select()
    .single();
  if (error) return null;
  return data as CmsDepoimento;
}

export async function atualizarDepoimento(
  db: DbClient,
  id: string,
  updates: Partial<Omit<CmsDepoimento, 'id'>>
): Promise<CmsDepoimento | null> {
  const { data, error } = await db
    .from('cms_depoimentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsDepoimento;
}

export async function deletarDepoimento(db: DbClient, id: string): Promise<boolean> {
  const { error } = await db.from('cms_depoimentos').delete().eq('id', id);
  return !error;
}

// =============================================================================
// FAQ
// =============================================================================

export async function listarFaqs(db: DbClient, apenasAtivos = false): Promise<CmsFaq[]> {
  let query = db.from('cms_faq').select('*');
  if (apenasAtivos) query = query.eq('ativo', true);
  query = query.order('ordem');
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as CmsFaq[];
}

export async function criarFaq(
  db: DbClient,
  faq: Omit<CmsFaq, 'id'>
): Promise<CmsFaq | null> {
  const { data, error } = await db
    .from('cms_faq')
    .insert(faq)
    .select()
    .single();
  if (error) return null;
  return data as CmsFaq;
}

export async function atualizarFaq(
  db: DbClient,
  id: string,
  updates: Partial<Omit<CmsFaq, 'id'>>
): Promise<CmsFaq | null> {
  const { data, error } = await db
    .from('cms_faq')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data as CmsFaq;
}

export async function deletarFaq(db: DbClient, id: string): Promise<boolean> {
  const { error } = await db.from('cms_faq').delete().eq('id', id);
  return !error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/cms/repository.ts
git commit -m "feat(cms): add repository with Supabase queries for all CMS tables"
```

---

## Task 5: Feature CMS — Service com cache Redis

**Files:**
- Create: `src/features/cms/service.ts`

- [ ] **Step 1: Criar service layer com cache**

```typescript
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { withCache, deleteCached, deletePattern } from '@/lib/redis/cache-utils';
import * as repo from './repository';
import type { CmsPagina, CmsSecao, CmsArtigo, CmsCategoria, CmsDepoimento, CmsFaq } from './domain';

// =============================================================================
// CACHE CONFIG
// =============================================================================

const CMS_CACHE = {
  pagina: (slug: string) => `cms:pagina:${slug}`,
  artigos: (params: string) => `cms:artigos:lista:${params}`,
  artigo: (slug: string) => `cms:artigo:${slug}`,
  depoimentos: 'cms:depoimentos',
  faq: 'cms:faq',
  categorias: 'cms:categorias',
} as const;

const TTL = {
  pagina: 600,       // 10 min
  artigosLista: 300, // 5 min
  artigo: 600,       // 10 min
  depoimentos: 1800, // 30 min
  faq: 1800,         // 30 min
  categorias: 1800,  // 30 min
} as const;

// =============================================================================
// LEITURA PUBLICA (com cache)
// =============================================================================

export async function buscarPaginaComSecoes(slug: string): Promise<{
  pagina: CmsPagina;
  secoes: CmsSecao[];
} | null> {
  return withCache(CMS_CACHE.pagina(slug), async () => {
    const db = await createClient();
    const pagina = await repo.buscarPagina(db, slug);
    if (!pagina) return null;
    const secoes = await repo.listarSecoesDaPagina(db, slug);
    return { pagina, secoes };
  }, TTL.pagina);
}

export async function buscarArtigosPublicados(params?: {
  categoria_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: CmsArtigo[]; total: number }> {
  const paramsKey = JSON.stringify(params ?? {});
  return withCache(CMS_CACHE.artigos(paramsKey), async () => {
    const db = await createClient();
    return repo.listarArtigos(db, { ...params, status: 'publicado' });
  }, TTL.artigosLista);
}

export async function buscarArtigoPublicado(slug: string): Promise<CmsArtigo | null> {
  return withCache(CMS_CACHE.artigo(slug), async () => {
    const db = await createClient();
    const artigo = await repo.buscarArtigo(db, slug);
    if (!artigo || artigo.status !== 'publicado') return null;
    return artigo;
  }, TTL.artigo);
}

export async function buscarDepoimentosAtivos(): Promise<CmsDepoimento[]> {
  return withCache(CMS_CACHE.depoimentos, async () => {
    const db = await createClient();
    return repo.listarDepoimentos(db, true);
  }, TTL.depoimentos);
}

export async function buscarFaqsAtivas(): Promise<CmsFaq[]> {
  return withCache(CMS_CACHE.faq, async () => {
    const db = await createClient();
    return repo.listarFaqs(db, true);
  }, TTL.faq);
}

export async function buscarCategoriasPublicas(): Promise<CmsCategoria[]> {
  return withCache(CMS_CACHE.categorias, async () => {
    const db = await createClient();
    return repo.listarCategorias(db);
  }, TTL.categorias);
}

// =============================================================================
// INVALIDACAO DE CACHE
// =============================================================================

export async function invalidarCachePagina(slug: string): Promise<void> {
  await deleteCached(CMS_CACHE.pagina(slug));
}

export async function invalidarCacheArtigos(): Promise<void> {
  await deletePattern('cms:artigos:*');
  await deletePattern('cms:artigo:*');
}

export async function invalidarCacheDepoimentos(): Promise<void> {
  await deleteCached(CMS_CACHE.depoimentos);
}

export async function invalidarCacheFaq(): Promise<void> {
  await deleteCached(CMS_CACHE.faq);
}

export async function invalidarCacheCategorias(): Promise<void> {
  await deleteCached(CMS_CACHE.categorias);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/cms/service.ts
git commit -m "feat(cms): add service layer with Redis cache and invalidation"
```

---

## Task 6: Feature CMS — Server Actions

**Files:**
- Create: `src/features/cms/actions.ts`

- [ ] **Step 1: Criar server actions para CRUD**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import * as repo from './repository';
import {
  invalidarCachePagina,
  invalidarCacheArtigos,
  invalidarCacheDepoimentos,
  invalidarCacheFaq,
  invalidarCacheCategorias,
} from './service';
import type { CmsPagina, CmsSecao, CmsArtigo, CmsCategoria, CmsDepoimento, CmsFaq } from './domain';

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// PAGINAS (admin)
// =============================================================================

export async function actionListarPaginas(): Promise<ActionResult<CmsPagina[]>> {
  const db = await createClient();
  const paginas = await repo.listarPaginas(db);
  return { success: true, data: paginas };
}

export async function actionAtualizarPagina(
  id: string,
  updates: Partial<Pick<CmsPagina, 'titulo' | 'seo_titulo' | 'seo_descricao' | 'status' | 'atualizado_por'>>
): Promise<ActionResult<CmsPagina>> {
  const db = await createClient();
  const pagina = await repo.atualizarPagina(db, id, updates);
  if (!pagina) return { success: false, error: 'Falha ao atualizar pagina' };

  await invalidarCachePagina(pagina.slug);
  revalidatePath('/');
  revalidatePath(`/${pagina.slug === 'home' ? '' : pagina.slug}`);
  return { success: true, data: pagina };
}

// =============================================================================
// SECOES (admin)
// =============================================================================

export async function actionListarSecoes(paginaSlug: string): Promise<ActionResult<CmsSecao[]>> {
  const db = await createClient();
  const secoes = await repo.listarSecoesDaPagina(db, paginaSlug);
  return { success: true, data: secoes };
}

export async function actionAtualizarSecao(
  id: string,
  paginaSlug: string,
  updates: Partial<Pick<CmsSecao, 'conteudo' | 'ativo' | 'ordem'>>
): Promise<ActionResult<CmsSecao>> {
  const db = await createClient();
  const secao = await repo.atualizarSecao(db, id, updates);
  if (!secao) return { success: false, error: 'Falha ao atualizar secao' };

  await invalidarCachePagina(paginaSlug);
  revalidatePath('/');
  revalidatePath(`/${paginaSlug === 'home' ? '' : paginaSlug}`);
  return { success: true, data: secao };
}

// =============================================================================
// ARTIGOS (admin)
// =============================================================================

export async function actionListarArtigosAdmin(): Promise<ActionResult<{ data: CmsArtigo[]; total: number }>> {
  const db = await createClient();
  const result = await repo.listarArtigos(db);
  return { success: true, data: result };
}

export async function actionBuscarArtigo(id: string): Promise<ActionResult<CmsArtigo>> {
  const db = await createClient();
  const artigo = await repo.buscarArtigoPorId(db, id);
  if (!artigo) return { success: false, error: 'Artigo nao encontrado' };
  return { success: true, data: artigo };
}

export async function actionCriarArtigo(
  artigo: Omit<CmsArtigo, 'id' | 'criado_em' | 'atualizado_em' | 'categoria'>
): Promise<ActionResult<CmsArtigo>> {
  const db = await createClient();
  const novo = await repo.criarArtigo(db, artigo);
  if (!novo) return { success: false, error: 'Falha ao criar artigo' };

  if (novo.status === 'publicado') {
    await invalidarCacheArtigos();
    revalidatePath('/insights');
  }
  return { success: true, data: novo };
}

export async function actionAtualizarArtigo(
  id: string,
  updates: Partial<Omit<CmsArtigo, 'id' | 'criado_em' | 'categoria'>>
): Promise<ActionResult<CmsArtigo>> {
  const db = await createClient();
  const artigo = await repo.atualizarArtigo(db, id, updates);
  if (!artigo) return { success: false, error: 'Falha ao atualizar artigo' };

  await invalidarCacheArtigos();
  revalidatePath('/insights');
  return { success: true, data: artigo };
}

export async function actionDeletarArtigo(id: string): Promise<ActionResult<void>> {
  const db = await createClient();
  const ok = await repo.deletarArtigo(db, id);
  if (!ok) return { success: false, error: 'Falha ao deletar artigo' };

  await invalidarCacheArtigos();
  revalidatePath('/insights');
  return { success: true, data: undefined };
}

// =============================================================================
// CATEGORIAS (admin)
// =============================================================================

export async function actionListarCategorias(): Promise<ActionResult<CmsCategoria[]>> {
  const db = await createClient();
  const cats = await repo.listarCategorias(db);
  return { success: true, data: cats };
}

export async function actionCriarCategoria(
  categoria: Omit<CmsCategoria, 'id'>
): Promise<ActionResult<CmsCategoria>> {
  const db = await createClient();
  const nova = await repo.criarCategoria(db, categoria);
  if (!nova) return { success: false, error: 'Falha ao criar categoria' };
  await invalidarCacheCategorias();
  return { success: true, data: nova };
}

export async function actionAtualizarCategoria(
  id: string,
  updates: Partial<Omit<CmsCategoria, 'id'>>
): Promise<ActionResult<CmsCategoria>> {
  const db = await createClient();
  const cat = await repo.atualizarCategoria(db, id, updates);
  if (!cat) return { success: false, error: 'Falha ao atualizar categoria' };
  await invalidarCacheCategorias();
  return { success: true, data: cat };
}

export async function actionDeletarCategoria(id: string): Promise<ActionResult<void>> {
  const db = await createClient();
  const ok = await repo.deletarCategoria(db, id);
  if (!ok) return { success: false, error: 'Falha ao deletar categoria' };
  await invalidarCacheCategorias();
  return { success: true, data: undefined };
}

// =============================================================================
// DEPOIMENTOS (admin)
// =============================================================================

export async function actionListarDepoimentos(): Promise<ActionResult<CmsDepoimento[]>> {
  const db = await createClient();
  const deps = await repo.listarDepoimentos(db);
  return { success: true, data: deps };
}

export async function actionCriarDepoimento(
  depoimento: Omit<CmsDepoimento, 'id'>
): Promise<ActionResult<CmsDepoimento>> {
  const db = await createClient();
  const novo = await repo.criarDepoimento(db, depoimento);
  if (!novo) return { success: false, error: 'Falha ao criar depoimento' };
  await invalidarCacheDepoimentos();
  return { success: true, data: novo };
}

export async function actionAtualizarDepoimento(
  id: string,
  updates: Partial<Omit<CmsDepoimento, 'id'>>
): Promise<ActionResult<CmsDepoimento>> {
  const db = await createClient();
  const dep = await repo.atualizarDepoimento(db, id, updates);
  if (!dep) return { success: false, error: 'Falha ao atualizar depoimento' };
  await invalidarCacheDepoimentos();
  return { success: true, data: dep };
}

export async function actionDeletarDepoimento(id: string): Promise<ActionResult<void>> {
  const db = await createClient();
  const ok = await repo.deletarDepoimento(db, id);
  if (!ok) return { success: false, error: 'Falha ao deletar depoimento' };
  await invalidarCacheDepoimentos();
  return { success: true, data: undefined };
}

// =============================================================================
// FAQ (admin)
// =============================================================================

export async function actionListarFaqs(): Promise<ActionResult<CmsFaq[]>> {
  const db = await createClient();
  const faqs = await repo.listarFaqs(db);
  return { success: true, data: faqs };
}

export async function actionCriarFaq(
  faq: Omit<CmsFaq, 'id'>
): Promise<ActionResult<CmsFaq>> {
  const db = await createClient();
  const novo = await repo.criarFaq(db, faq);
  if (!novo) return { success: false, error: 'Falha ao criar FAQ' };
  await invalidarCacheFaq();
  revalidatePath('/faq');
  return { success: true, data: novo };
}

export async function actionAtualizarFaq(
  id: string,
  updates: Partial<Omit<CmsFaq, 'id'>>
): Promise<ActionResult<CmsFaq>> {
  const db = await createClient();
  const faq = await repo.atualizarFaq(db, id, updates);
  if (!faq) return { success: false, error: 'Falha ao atualizar FAQ' };
  await invalidarCacheFaq();
  revalidatePath('/faq');
  return { success: true, data: faq };
}

export async function actionDeletarFaq(id: string): Promise<ActionResult<void>> {
  const db = await createClient();
  const ok = await repo.deletarFaq(db, id);
  if (!ok) return { success: false, error: 'Falha ao deletar FAQ' };
  await invalidarCacheFaq();
  revalidatePath('/faq');
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/cms/actions.ts
git commit -m "feat(cms): add server actions for all CMS CRUD operations"
```

---

## Task 7: Refatorar Home Page — consumir dados do CMS

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/features/website/components/home-page.tsx`
- Modify: `src/features/website/components/home/hero.tsx`
- Modify: `src/features/website/components/home/services.tsx`
- Modify: `src/features/website/components/home/about.tsx`
- Modify: `src/features/website/components/home/testimonials.tsx`

- [ ] **Step 1: Atualizar `src/app/page.tsx` para fazer fetch dos dados**

```tsx
import { buscarPaginaComSecoes, buscarDepoimentosAtivos } from '@/features/cms/service';
import { HomePage } from '@/features/website';
import type { HeroConteudo, ServicesConteudo, AboutConteudo } from '@/features/cms/domain';

export default async function Page() {
  const [resultado, depoimentos] = await Promise.all([
    buscarPaginaComSecoes('home'),
    buscarDepoimentosAtivos(),
  ]);

  const secoes = resultado?.secoes ?? [];
  const heroData = secoes.find(s => s.slug === 'hero')?.conteudo as HeroConteudo | undefined;
  const servicesData = secoes.find(s => s.slug === 'services')?.conteudo as ServicesConteudo | undefined;
  const aboutData = secoes.find(s => s.slug === 'about')?.conteudo as AboutConteudo | undefined;

  return (
    <HomePage
      hero={heroData}
      services={servicesData}
      about={aboutData}
      depoimentos={depoimentos}
    />
  );
}
```

- [ ] **Step 2: Atualizar `home-page.tsx` para aceitar props**

```tsx
import { Header } from "./layout/header";
import { Hero } from "./home/hero";
import { Services } from "./home/services";
import { About } from "./home/about";
import { Testimonials } from "./home/testimonials";
import { Footer } from "./layout/footer";
import type { HeroConteudo, ServicesConteudo, AboutConteudo, CmsDepoimento } from "@/features/cms/domain";

interface HomePageProps {
  hero?: HeroConteudo;
  services?: ServicesConteudo;
  about?: AboutConteudo;
  depoimentos?: CmsDepoimento[];
}

export function HomePage({ hero, services, about, depoimentos }: HomePageProps) {
  return (
    <main className="min-h-screen bg-background dark selection:bg-primary selection:text-on-primary">
      <Header />
      <Hero dados={hero} />
      <Services dados={services} />
      <About dados={about} />
      {depoimentos && depoimentos.length > 0 && <Testimonials dados={depoimentos} />}
      <Footer />
    </main>
  );
}
```

- [ ] **Step 3: Refatorar `hero.tsx` para usar props com fallback**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroConteudo } from "@/features/cms/domain";

const FALLBACK: HeroConteudo = {
  label: "A Nova Era da Advocacia Trabalhista",
  titulo: "Justiça para quem trabalha.",
  subtitulo: "Unimos tecnologia de ponta e expertise jurídica para garantir que seus direitos sejam respeitados com a velocidade que o mundo moderno exige.",
  cta_primario: { texto: "Fale com um Especialista", url: "/contato" },
  cta_secundario: { texto: "Nossas Soluções", url: "#solucoes" },
  video_url: "https://customer-lvnfk43x7eec1csc.cloudflarestream.com/500dc4de24fbf5ec2457f4779c4faded/iframe?muted=true&loop=true&autoplay=true&controls=false",
};

export function Hero({ dados }: { dados?: HeroConteudo }) {
  const d = dados ?? FALLBACK;

  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden">
      {d.video_url && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none"
            style={{ width: "max(100%, 177.78vh)", height: "max(100%, 56.25vw)" }}
            src={d.video_url}
            allow="autoplay; fullscreen"
            title="Video de fundo"
          />
        </div>
      )}
      <div className="absolute inset-0 z-1 bg-black/60" />
      <div className="container mx-auto px-5 sm:px-6 md:px-8 z-10 text-center relative pt-20 md:pt-0">
        {d.label && (
          <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white font-label text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
            {d.label}
          </span>
        )}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold font-headline leading-[0.95] tracking-tighter mb-6 md:mb-8 text-white">
          {d.titulo.split('.')[0]}
          {d.titulo.includes('.') && <br />}
          <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
            {d.titulo.includes('.') ? d.titulo.split('.').slice(1).join('.').trim() || '.' : ''}
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          {d.subtitulo}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          {d.cta_primario && (
            <Link
              href={d.cta_primario.url}
              className="bg-primary text-on-primary-fixed px-8 py-4 sm:px-10 sm:py-5 rounded-md font-bold text-base sm:text-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group"
            >
              {d.cta_primario.texto}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {d.cta_secundario && (
            <Link
              href={d.cta_secundario.url}
              className="border border-white/30 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-md font-bold text-base sm:text-lg hover:bg-white/10 transition-all flex items-center justify-center"
            >
              {d.cta_secundario.texto}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Refatorar `services.tsx` para usar props com fallback**

Manter os sub-componentes `OverlayCard` e `ServiceBlock` inalterados (ja recebem props). Refatorar apenas a funcao `Services` para receber dados do CMS:

```tsx
// Adicionar no topo do arquivo:
import type { ServicesConteudo } from "@/features/cms/domain";
import * as LucideIcons from "lucide-react";

// Helper para resolver icone por nome
function getIcon(name: string, className: string) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : null;
}

// Substituir a funcao Services:
export function Services({ dados }: { dados?: ServicesConteudo }) {
  // Fallback inline removido por brevidade — se dados for undefined, renderiza o conteudo original hardcoded
  if (!dados) return <ServicesHardcoded />;

  return (
    <section id="solucoes" className="py-16 sm:py-20 md:py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 md:px-8">
        <div className="max-w-4xl mb-12 sm:mb-16 md:mb-24">
          <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
            {dados.label}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-headline font-bold mt-3 md:mt-4 tracking-tighter leading-tight">
            {dados.titulo}
          </h2>
        </div>
        <div className="space-y-16 sm:space-y-20 md:space-y-32">
          {dados.itens.map((item, i) => (
            <ServiceBlock
              key={i}
              layout={item.layout}
              imageSrc={item.imagem_url}
              imageAlt={item.imagem_alt}
              overlayCard={
                <OverlayCard
                  icon={getIcon(item.icone, "w-10 h-10 lg:w-12 lg:h-12")}
                  title={item.overlay_titulo}
                  description={item.overlay_descricao}
                  position={item.layout === 'image-left' ? 'bottom-right' : 'bottom-left'}
                />
              }
              title={item.titulo}
              description={item.descricao}
              href={item.cta.url}
              ctaLabel={item.cta.texto}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Renomear a funcao original para ServicesHardcoded como fallback temporario
```

- [ ] **Step 5: Refatorar `about.tsx` para usar props com fallback**

Adicionar `AboutConteudo` props, usar `dados ?? FALLBACK` pattern identico ao hero.

- [ ] **Step 6: Refatorar `testimonials.tsx` para receber dados do CMS**

```tsx
import { Star } from "lucide-react";
import type { CmsDepoimento } from "@/features/cms/domain";

export function Testimonials({ dados }: { dados: CmsDepoimento[] }) {
  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
            Feedback
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mt-4">
            Confiança de quem já alcançou a justiça.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dados.map((dep) => (
            <div
              key={dep.id}
              className="bg-white/5 backdrop-blur-[20px] border border-white/10 p-10 rounded-xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow"
            >
              <div>
                <div className="flex text-primary mb-6 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic text-on-surface mb-8 leading-relaxed">
                  &quot;{dep.depoimento}&quot;
                </p>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                {dep.avatar_url ? (
                  <img
                    src={dep.avatar_url}
                    alt={dep.nome}
                    className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-on-surface">{dep.nome}</p>
                  {dep.cargo && <p className="text-sm text-on-surface-variant">{dep.cargo}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Atualizar barrel export em `src/features/website/index.ts`**

As exportacoes existentes continuam validas — os componentes apenas ganharam props opcionais. Nenhuma mudanca necessaria no barrel.

- [ ] **Step 8: Testar manualmente**

Run: `npm run dev`
Expected: Home page renderiza identica a antes (fallbacks garantem continuidade). Sem erros no console.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx src/features/website/components/ src/features/cms/
git commit -m "feat(cms): refactor home page to consume CMS data with fallbacks"
```

---

## Task 8: Admin — Rotas e layout do CMS em Configuracoes

**Files:**
- Create: `src/app/app/configuracoes/website/page.tsx`
- Create: `src/app/app/configuracoes/website/layout.tsx`
- Create: `src/app/app/configuracoes/website/[slug]/page.tsx`
- Create: `src/app/app/configuracoes/website/blog/page.tsx`
- Create: `src/app/app/configuracoes/website/blog/novo/page.tsx`
- Create: `src/app/app/configuracoes/website/blog/[id]/page.tsx`
- Create: `src/app/app/configuracoes/website/depoimentos/page.tsx`
- Create: `src/app/app/configuracoes/website/faq/page.tsx`
- Create: `src/app/app/configuracoes/website/categorias/page.tsx`
- Create: `src/features/cms/components/admin/cms-sidebar-nav.tsx`

- [ ] **Step 1: Criar nav lateral do CMS**

`src/features/cms/components/admin/cms-sidebar-nav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BookOpen, MessageSquareQuote, HelpCircle, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/configuracoes/website', label: 'Paginas', icon: FileText, exact: true },
  { href: '/app/configuracoes/website/blog', label: 'Blog / Insights', icon: BookOpen },
  { href: '/app/configuracoes/website/depoimentos', label: 'Depoimentos', icon: MessageSquareQuote },
  { href: '/app/configuracoes/website/faq', label: 'Perguntas Frequentes', icon: HelpCircle },
  { href: '/app/configuracoes/website/categorias', label: 'Categorias', icon: Tags },
];

export function CmsSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Criar layout com sidebar**

`src/app/app/configuracoes/website/layout.tsx`:

```tsx
import { CmsSidebarNav } from '@/features/cms/components/admin/cms-sidebar-nav';

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-56 shrink-0 hidden lg:block">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-3">Website</h3>
        <CmsSidebarNav />
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Criar pagina principal — lista de paginas**

`src/app/app/configuracoes/website/page.tsx`:

```tsx
import Link from 'next/link';
import { actionListarPaginas } from '@/features/cms/actions';
import { Badge } from '@/components/ui/badge';

export default async function WebsitePaginasPage() {
  const result = await actionListarPaginas();
  const paginas = result.success ? result.data : [];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight font-heading mb-6">Paginas do Site</h2>
      <div className="grid gap-3">
        {paginas.map((p) => (
          <Link
            key={p.id}
            href={`/app/configuracoes/website/${p.slug}`}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="font-medium">{p.titulo}</p>
              <p className="text-sm text-muted-foreground">/{p.slug === 'home' ? '' : p.slug}</p>
            </div>
            <Badge variant={p.status === 'publicado' ? 'default' : 'secondary'}>
              {p.status}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar pagina de edicao de secoes — `[slug]/page.tsx`**

`src/app/app/configuracoes/website/[slug]/page.tsx`:

```tsx
import { actionListarSecoes } from '@/features/cms/actions';
import { SecaoFormList } from '@/features/cms/components/admin/secao-form-list';

export default async function EditarPaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await actionListarSecoes(slug);
  const secoes = result.success ? result.data : [];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight font-heading mb-6">
        Editar: {slug.charAt(0).toUpperCase() + slug.slice(1)}
      </h2>
      <SecaoFormList secoes={secoes} paginaSlug={slug} />
    </div>
  );
}
```

- [ ] **Step 5: Criar paginas stub para blog, depoimentos, faq, categorias**

Cada uma dessas paginas segue a mesma estrutura: lista itens, botao de adicionar, link para editar. Criar versoes iniciais simples.

`src/app/app/configuracoes/website/blog/page.tsx`:
```tsx
import { actionListarArtigosAdmin } from '@/features/cms/actions';
import { ArtigoLista } from '@/features/cms/components/admin/artigo-lista';

export default async function BlogPage() {
  const result = await actionListarArtigosAdmin();
  const artigos = result.success ? result.data.data : [];

  return (
    <div>
      <ArtigoLista artigos={artigos} />
    </div>
  );
}
```

`src/app/app/configuracoes/website/blog/novo/page.tsx`:
```tsx
import { ArtigoEditor } from '@/features/cms/components/admin/artigo-editor';

export default function NovoArtigoPage() {
  return <ArtigoEditor />;
}
```

`src/app/app/configuracoes/website/blog/[id]/page.tsx`:
```tsx
import { actionBuscarArtigo } from '@/features/cms/actions';
import { ArtigoEditor } from '@/features/cms/components/admin/artigo-editor';
import { notFound } from 'next/navigation';

export default async function EditarArtigoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await actionBuscarArtigo(id);
  if (!result.success) notFound();

  return <ArtigoEditor artigo={result.data} />;
}
```

`src/app/app/configuracoes/website/depoimentos/page.tsx`:
```tsx
import { actionListarDepoimentos } from '@/features/cms/actions';
import { DepoimentosManager } from '@/features/cms/components/admin/depoimentos-manager';

export default async function DepoimentosPage() {
  const result = await actionListarDepoimentos();
  const depoimentos = result.success ? result.data : [];

  return <DepoimentosManager depoimentos={depoimentos} />;
}
```

`src/app/app/configuracoes/website/faq/page.tsx`:
```tsx
import { actionListarFaqs } from '@/features/cms/actions';
import { FaqManager } from '@/features/cms/components/admin/faq-manager';

export default async function FaqPage() {
  const result = await actionListarFaqs();
  const faqs = result.success ? result.data : [];

  return <FaqManager faqs={faqs} />;
}
```

`src/app/app/configuracoes/website/categorias/page.tsx`:
```tsx
import { actionListarCategorias } from '@/features/cms/actions';
import { CategoriasManager } from '@/features/cms/components/admin/categorias-manager';

export default async function CategoriasPage() {
  const result = await actionListarCategorias();
  const categorias = result.success ? result.data : [];

  return <CategoriasManager categorias={categorias} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/app/configuracoes/website/ src/features/cms/components/admin/cms-sidebar-nav.tsx
git commit -m "feat(cms): add admin routes and layout for website CMS in configuracoes"
```

---

## Task 9: Admin — Componentes de edicao (SecaoFormList, managers)

**Files:**
- Create: `src/features/cms/components/admin/secao-form-list.tsx`
- Create: `src/features/cms/components/admin/depoimentos-manager.tsx`
- Create: `src/features/cms/components/admin/faq-manager.tsx`
- Create: `src/features/cms/components/admin/categorias-manager.tsx`
- Create: `src/features/cms/components/admin/artigo-lista.tsx`
- Create: `src/features/cms/components/admin/artigo-editor.tsx`

Estes sao componentes de UI admin. Cada um segue o mesmo pattern: lista items + form dialog para criar/editar. Devem usar shadcn/ui (`Card`, `Button`, `Input`, `Label`, `Dialog`, `Switch`) + React Hook Form + Zod schemas do domain.

- [ ] **Step 1: Criar `SecaoFormList` — formulario dinamico por secao**

Este componente renderiza um accordion/card para cada secao da pagina. Dentro de cada card, gera campos de formulario baseado no schema Zod correspondente ao `secao.slug`. Usa `secaoSchemas[slug]` para validacao. Chama `actionAtualizarSecao` no submit.

Componente complexo — aproximadamente 150-200 linhas. Deve iterar os campos do JSONB `conteudo` e renderizar `Input` para strings, `Textarea` para textos longos, `Switch` para booleans, e campos repetidos (array) com botao de adicionar/remover.

- [ ] **Step 2: Criar `DepoimentosManager` — CRUD de depoimentos**

Lista depoimentos em cards. Cada card mostra nome, cargo, trecho do depoimento, toggle de ativo. Botao "Novo Depoimento" abre Dialog com form (nome, cargo, depoimento, avatar_url, ordem). Chama `actionCriarDepoimento` / `actionAtualizarDepoimento` / `actionDeletarDepoimento`.

- [ ] **Step 3: Criar `FaqManager` — CRUD de FAQs**

Lista FAQs em cards. Cada card mostra pergunta, categoria, toggle ativo. Dialog para criar/editar com campos (pergunta, resposta, categoria select, ordem). Chama `actionCriarFaq` / `actionAtualizarFaq` / `actionDeletarFaq`.

- [ ] **Step 4: Criar `CategoriasManager` — CRUD de categorias**

Lista categorias em tabela simples. Dialog para criar/editar com campos (nome, slug auto-gerado, cor select, ordem). Chama `actionCriarCategoria` / `actionAtualizarCategoria` / `actionDeletarCategoria`.

- [ ] **Step 5: Criar `ArtigoLista` — lista de artigos com filtros**

Tabela de artigos com colunas: titulo, categoria, status (badge), data publicacao. Botao "Novo Artigo" linka para `/blog/novo`. Cada row linka para `/blog/[id]`. Filtro por status (todos/rascunho/publicado).

- [ ] **Step 6: Criar `ArtigoEditor` — editor de artigo com Plate.js**

Form com campos do `artigoFormSchema` (titulo, slug, resumo, categoria, tags, imagem_capa, tempo_leitura, SEO). Abaixo dos campos, integra o componente `PlateEditor` existente em `src/components/editor/plate/plate-editor.tsx`. O conteudo Plate.js e salvo como JSONB no campo `conteudo`. Botoes: "Salvar Rascunho" e "Publicar". Ao publicar, seta `status: 'publicado'` e `publicado_em: new Date().toISOString()`.

- [ ] **Step 7: Commit**

```bash
git add src/features/cms/components/admin/
git commit -m "feat(cms): add admin UI components for sections, articles, testimonials, FAQ, and categories"
```

---

## Task 10: Refatorar demais paginas publicas — contato, servicos, expertise, solucoes, faq, insights

**Files:**
- Modify: `src/app/contato/page.tsx`
- Modify: `src/app/servicos/page.tsx`
- Modify: `src/app/expertise/page.tsx`
- Modify: `src/app/solucoes/page.tsx`
- Modify: `src/app/faq/page.tsx`
- Modify: `src/app/insights/page.tsx`
- Modify: `src/app/insights/tendencias/page.tsx`

- [ ] **Step 1: Refatorar cada page.tsx para buscar dados do CMS**

Cada pagina segue o mesmo pattern:

```tsx
// Exemplo: src/app/contato/page.tsx
import { buscarPaginaComSecoes } from '@/features/cms/service';
import type { HeroConteudo, ContatoInfoConteudo, SocialConteudo } from '@/features/cms/domain';

export default async function ContatoPage() {
  const resultado = await buscarPaginaComSecoes('contato');
  const secoes = resultado?.secoes ?? [];

  const hero = secoes.find(s => s.slug === 'hero')?.conteudo as HeroConteudo | undefined;
  const info = secoes.find(s => s.slug === 'info')?.conteudo as ContatoInfoConteudo | undefined;
  const social = secoes.find(s => s.slug === 'social')?.conteudo as SocialConteudo | undefined;

  // Passar dados para os componentes via props
  // Manter fallbacks hardcoded para cada campo
  return (/* JSX com dados dinamicos */);
}
```

Aplicar o mesmo pattern para servicos, expertise, solucoes.

- [ ] **Step 2: Refatorar FAQ para buscar FAQs do banco**

```tsx
import { buscarPaginaComSecoes, buscarFaqsAtivas } from '@/features/cms/service';

export default async function FaqPage() {
  const [resultado, faqs] = await Promise.all([
    buscarPaginaComSecoes('faq'),
    buscarFaqsAtivas(),
  ]);
  // Renderizar faqs dinamicamente em vez de hardcoded
}
```

- [ ] **Step 3: Refatorar Insights para buscar artigos do banco**

```tsx
import { buscarPaginaComSecoes, buscarArtigosPublicados, buscarCategoriasPublicas } from '@/features/cms/service';

export default async function InsightsPage() {
  const [resultado, artigos, categorias] = await Promise.all([
    buscarPaginaComSecoes('insights'),
    buscarArtigosPublicados({ limit: 10 }),
    buscarCategoriasPublicas(),
  ]);
  // Renderizar artigos e categorias dinamicamente
}
```

- [ ] **Step 4: Criar rota dinamica para artigo individual**

Create: `src/app/insights/[slug]/page.tsx`

```tsx
import { buscarArtigoPublicado } from '@/features/cms/service';
import { notFound } from 'next/navigation';

export default async function ArtigoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artigo = await buscarArtigoPublicado(slug);
  if (!artigo) notFound();

  return (/* Renderizar artigo com PlateEditor em modo read-only */);
}
```

- [ ] **Step 5: Adicionar `generateMetadata` para SEO dinamico**

Cada page.tsx que busca dados do CMS deve exportar `generateMetadata()`:

```tsx
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const resultado = await buscarPaginaComSecoes('contato');
  const pagina = resultado?.pagina;

  return {
    title: pagina?.seo_titulo ?? 'Contato — Zattar Advogados',
    description: pagina?.seo_descricao ?? 'Entre em contato com a Zattar Advogados.',
  };
}
```

- [ ] **Step 6: Testar manualmente**

Run: `npm run dev`
Expected: Todas as paginas renderizam com dados do banco. Conteudo identico ao original.

- [ ] **Step 7: Commit**

```bash
git add src/app/contato/ src/app/servicos/ src/app/expertise/ src/app/solucoes/ src/app/faq/ src/app/insights/
git commit -m "feat(cms): refactor all marketing pages to consume CMS data with SEO metadata"
```

---

## Task 11: Refatorar footer — dados de contato do CMS

**Files:**
- Modify: `src/features/website/components/layout/footer.tsx`

- [ ] **Step 1: Criar componente de footer que aceita props opcionais**

O footer precisa dos dados de contato (endereco, email, telefone, redes sociais) que estao na secao `info` e `social` da pagina `contato`. Como o footer aparece em todas as paginas, a busca deve ser feita no layout ou passada via props.

Refatorar para aceitar props opcionais com fallback para os valores atuais hardcoded.

- [ ] **Step 2: Commit**

```bash
git add src/features/website/components/layout/footer.tsx
git commit -m "feat(cms): refactor footer to accept dynamic contact data with fallbacks"
```

---

## Task 12: Verificacao final e limpeza

**Files:**
- Verify: todas as paginas publicas
- Verify: todas as rotas admin

- [ ] **Step 1: Verificar build**

Run: `npm run build`
Expected: Build completo sem erros

- [ ] **Step 2: Verificar paginas publicas no browser**

- `/` — Home com hero, services, about, testimonials
- `/contato` — Formulario de contato com dados dinamicos
- `/servicos` — Calculadoras e servicos
- `/expertise` — Especialidades e equipe
- `/solucoes` — Solucoes digitais
- `/faq` — Perguntas frequentes do banco
- `/insights` — Artigos do banco

- [ ] **Step 3: Verificar admin no browser**

- `/app/configuracoes/website` — Lista de paginas
- `/app/configuracoes/website/home` — Editar secoes da home
- `/app/configuracoes/website/blog` — Lista de artigos
- `/app/configuracoes/website/blog/novo` — Criar artigo com Plate.js
- `/app/configuracoes/website/depoimentos` — Gerenciar depoimentos
- `/app/configuracoes/website/faq` — Gerenciar FAQs
- `/app/configuracoes/website/categorias` — Gerenciar categorias

- [ ] **Step 4: Commit final**

```bash
git commit -m "feat(cms): complete CMS implementation — admin UI, public pages, cache, and seed data"
```
