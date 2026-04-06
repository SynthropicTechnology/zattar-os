# CMS Interno — Design Spec

**Data:** 2026-03-27
**Status:** Aprovado
**Abordagem:** CMS Full Supabase com admin integrado ao app

---

## 1. Contexto

O site institucional da Zattar Advogados possui 8 paginas de marketing (home, contato, servicos, expertise, solucoes, faq, insights, insights/tendencias) com **todo conteudo hardcoded** nos componentes React — 200+ strings, 20+ imagens, 8 artigos ficticios, 3 depoimentos. Qualquer alteracao de texto exige deploy.

### Objetivo

Permitir que pessoas nao-tecnicas (marketing, socios do escritorio) editem o conteudo do site atraves de uma interface admin dentro da area logada do sistema de gestao juridica, em `/app/configuracoes/website/`.

### Decisoes de Design

| Decisao | Escolha |
|---|---|
| Quem edita | Nao-tecnicos (marketing, socios) |
| Onde fica o admin | Dentro da area logada, em Configuracoes |
| Flexibilidade das paginas | Campos estruturados (layout fixo, conteudo editavel) |
| Editor do blog | Plate.js com AI Kit (rich text WYSIWYG) |
| Workflow | Simples: rascunho -> publicado |
| Backend | Supabase (tabelas + storage + RLS) |
| Cache | Redis com invalidacao ao salvar |

---

## 2. Modelo de Dados

### 2.1 `cms_paginas`

Registro de cada pagina do site.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `slug` | `text` UNIQUE NOT NULL | Identificador da pagina (`home`, `contato`, `servicos`, `expertise`, `solucoes`, `faq`, `insights`) |
| `titulo` | `text` NOT NULL | Nome da pagina para o admin (ex: "Pagina Inicial") |
| `seo_titulo` | `text` | `<title>` tag |
| `seo_descricao` | `text` | `<meta description>` |
| `status` | `text` NOT NULL DEFAULT `'rascunho'` | `rascunho` ou `publicado` |
| `atualizado_em` | `timestamptz` DEFAULT `now()` | Ultima edicao |
| `atualizado_por` | `uuid` FK -> usuarios | Quem editou por ultimo |
| `criado_em` | `timestamptz` DEFAULT `now()` | Criacao |

**CHECK:** `status IN ('rascunho', 'publicado')`

### 2.2 `cms_secoes`

Cada secao dentro de uma pagina, com campos estruturados em JSONB.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `pagina_id` | `uuid` FK -> cms_paginas ON DELETE CASCADE | Pagina pai |
| `slug` | `text` NOT NULL | Identificador da secao (`hero`, `services`, `about`, `cta`) |
| `titulo` | `text` NOT NULL | Nome para o admin (ex: "Secao Hero") |
| `conteudo` | `jsonb` NOT NULL DEFAULT `'{}'` | Campos estruturados — schema varia por secao |
| `ordem` | `integer` NOT NULL DEFAULT `0` | Ordem de exibicao |
| `ativo` | `boolean` NOT NULL DEFAULT `true` | Permite ocultar secoes sem deletar |
| `atualizado_em` | `timestamptz` DEFAULT `now()` | Ultima edicao |

**UNIQUE:** `(pagina_id, slug)`
**INDEX:** `(pagina_id, ordem)`

### 2.3 `cms_artigos`

Blog/Insights com Plate.js.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `slug` | `text` UNIQUE NOT NULL | URL slug (`impacto-ia-processos-trabalhistas`) |
| `titulo` | `text` NOT NULL | Titulo do artigo |
| `resumo` | `text` | Resumo/descricao curta |
| `conteudo` | `jsonb` | Plate.js JSON — documento do editor |
| `imagem_capa_url` | `text` | URL da imagem de capa |
| `categoria_id` | `uuid` FK -> cms_categorias ON DELETE SET NULL | Categoria |
| `tags` | `text[]` DEFAULT `'{}'` | Array de tags |
| `tempo_leitura` | `integer` | Minutos estimados |
| `status` | `text` NOT NULL DEFAULT `'rascunho'` | `rascunho` ou `publicado` |
| `publicado_em` | `timestamptz` | Data de publicacao |
| `autor_id` | `uuid` FK -> usuarios | Autor |
| `seo_titulo` | `text` | SEO title override |
| `seo_descricao` | `text` | SEO description |
| `criado_em` | `timestamptz` DEFAULT `now()` | Criacao |
| `atualizado_em` | `timestamptz` DEFAULT `now()` | Ultima edicao |

**CHECK:** `status IN ('rascunho', 'publicado')`
**INDEX:** `(status, publicado_em DESC)` — para listar artigos publicados

### 2.4 `cms_categorias`

Categorias dos artigos.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `nome` | `text` NOT NULL | Nome (ex: "Novas Leis", "Tecnologia no Judiciario") |
| `slug` | `text` UNIQUE NOT NULL | URL slug |
| `cor` | `text` | Cor do badge (referencia ao design system) |
| `ordem` | `integer` DEFAULT `0` | Ordem de exibicao |

### 2.5 `cms_depoimentos`

Testimonials.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `nome` | `text` NOT NULL | Nome do cliente |
| `cargo` | `text` | Cargo/profissao |
| `depoimento` | `text` NOT NULL | Texto do depoimento |
| `avatar_url` | `text` | Foto (opcional) |
| `ativo` | `boolean` DEFAULT `true` | Visivel no site |
| `ordem` | `integer` DEFAULT `0` | Ordem de exibicao |

### 2.6 `cms_faq`

Perguntas frequentes.

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador |
| `pergunta` | `text` NOT NULL | A pergunta |
| `resposta` | `text` NOT NULL | A resposta |
| `categoria` | `text` | Tag de categoria (`trabalhista`, `plataforma`, `seguranca`, `custos`) |
| `ativo` | `boolean` DEFAULT `true` | Visivel |
| `ordem` | `integer` DEFAULT `0` | Ordem |

---

## 3. Arquitetura de Codigo

### 3.1 Estrutura da Feature

```
src/features/cms/
├── domain/
│   ├── index.ts              # Types exportados
│   ├── tipos.ts              # Interfaces: CmsPagina, CmsSecao, CmsArtigo, etc.
│   └── schemas.ts            # Zod schemas dos conteudos JSONB por secao
├── repository.ts             # Queries diretas ao Supabase
├── service.ts                # Logica de negocio (validacao, cache)
├── actions.ts                # Server Actions (CRUD)
├── hooks/
│   ├── use-paginas.ts        # Hook para listar/editar paginas
│   ├── use-artigos.ts        # Hook para listar/editar artigos
│   ├── use-depoimentos.ts    # Hook para depoimentos
│   └── use-faq.ts            # Hook para FAQs
└── components/
    ├── admin/                # Componentes da area admin (Configuracoes)
    │   ├── pagina-editor.tsx         # Editor de pagina (lista de secoes)
    │   ├── secao-form.tsx            # Form dinamico por tipo de secao
    │   ├── artigo-editor.tsx         # Editor de artigo (Plate.js + AI Kit)
    │   ├── artigo-lista.tsx          # Lista de artigos com filtros
    │   ├── depoimentos-manager.tsx   # CRUD de depoimentos
    │   ├── faq-manager.tsx           # CRUD de FAQs
    │   ├── categorias-manager.tsx    # CRUD de categorias
    │   ├── media-upload.tsx          # Upload de imagens
    │   └── cms-sidebar-nav.tsx       # Nav lateral do CMS
    └── public/               # Componentes de renderizacao (site publico)
        ├── secao-renderer.tsx        # Renderiza secao baseado no slug
        └── artigo-renderer.tsx       # Renderiza Plate.js JSON -> HTML
```

### 3.2 Rotas Admin

```
/app/configuracoes/website/                    # Dashboard CMS (lista de paginas)
/app/configuracoes/website/[slug]/             # Editor de pagina (ex: /website/home)
/app/configuracoes/website/blog/               # Lista de artigos
/app/configuracoes/website/blog/novo/          # Criar artigo (Plate.js)
/app/configuracoes/website/blog/[id]/          # Editar artigo (Plate.js)
/app/configuracoes/website/depoimentos/        # Gerenciar depoimentos
/app/configuracoes/website/faq/                # Gerenciar FAQs
/app/configuracoes/website/categorias/         # Gerenciar categorias do blog
```

### 3.3 Schemas Zod por Secao

Cada slug de secao tem um schema fixo que valida o JSONB `conteudo`.

**Secoes por pagina:**

#### HOME (`slug: 'home'`)
- `hero` — label, titulo, subtitulo, cta_primario, cta_secundario, video_url
- `services` — label, titulo, itens[]{titulo, descricao, icone, cta, imagem_url, overlay_texto}
- `about` — label, titulo, descricao, features[]{titulo, descricao}, cta_primario, cta_secundario, imagem_url
- `testimonials` — (via tabela cms_depoimentos, nao precisa de secao)

#### CONTATO (`slug: 'contato'`)
- `hero` — titulo, subtitulo
- `info` — endereco, email, whatsapp, status_sistema
- `social` — links[]{rede, url}
- `trust_ticker` — itens[]

#### SERVICOS (`slug: 'servicos'`)
- `hero` — label, titulo, subtitulo
- `calculadoras` — label, titulo, itens[]{titulo, descricao, icone, link}
- `servicos` — itens[]{titulo, descricao, icone, link}
- `cta` — titulo, descricao, cta_primario, cta_whatsapp

#### EXPERTISE (`slug: 'expertise'`)
- `hero` — label, titulo, descricao
- `especialidades` — itens[]{titulo, descricao, tags[], imagem_url}
- `equipe` — titulo, subtitulo, blocos[]{titulo, descricao}
- `cta` — titulo, cta_primario, cta_secundario

#### SOLUCOES (`slug: 'solucoes'`)
- `hero` — label, titulo, subtitulo, cta_primario, cta_secundario
- `solucoes` — itens[]{titulo, descricao, tags[], destaque}
- `engine` — titulo, descricao, capacidades[]{titulo, descricao, icone}, stats[]{label, valor}
- `cta` — titulo, cta_primario, cta_secundario

#### FAQ (`slug: 'faq'`)
- `hero` — label, titulo, subtitulo, search_placeholder
- `categorias` — (via campo categoria na tabela cms_faq)
- `sidebar` — titulo, descricao, cta
- `cta` — titulo, cta_primario, cta_secundario

#### INSIGHTS (`slug: 'insights'`)
- `hero` — label, titulo, subtitulo
- `filtros` — categorias[] (vem de cms_categorias, nao precisa de secao)
- `newsletter` — titulo, descricao, cta, disclaimer
- Artigos vem da tabela `cms_artigos` — a pagina lista artigos publicados, nao precisa de secoes de conteudo para os cards

---

## 4. Fluxo de Dados

### 4.1 Admin (Escrita)

```
Usuario edita form -> React Hook Form + Zod validation
                   -> Server Action (actions.ts)
                   -> Repository (repository.ts) -> Supabase INSERT/UPDATE
                   -> Invalida cache Redis (chave especifica)
                   -> Retorna Result<T> (sucesso ou erro)
```

### 4.2 Site Publico (Leitura)

```
Visitante acessa pagina -> Server Component
                        -> service.ts -> Redis cache?
                           SIM -> retorna dados do cache
                           NAO -> repository.ts -> Supabase SELECT
                               -> salva no Redis (TTL por tipo)
                               -> retorna dados
                        -> Renderiza componentes com dados dinamicos
```

### 4.3 Cache Strategy

| Conteudo | TTL Redis | Invalidacao |
|---|---|---|
| Paginas (home, contato, etc.) | 10 minutos | Ao salvar/publicar secao |
| Artigos listagem | 5 minutos | Ao publicar/despublicar artigo |
| Artigo individual | 10 minutos | Ao editar artigo especifico |
| Depoimentos | 30 minutos | Ao editar qualquer depoimento |
| FAQs | 30 minutos | Ao editar qualquer FAQ |

**Cache keys:**
```
cms:pagina:{slug}
cms:artigos:lista:{params_hash}
cms:artigo:{slug}
cms:depoimentos
cms:faq
```

---

## 5. Migracao de Conteudo Existente

### 5.1 Seed Data

A migration deve incluir um seed que popula as tabelas com o conteudo atualmente hardcoded:

- 7 paginas (`home`, `contato`, `servicos`, `expertise`, `solucoes`, `faq`, `insights`)
- ~25 secoes com o conteudo JSONB extraido dos componentes atuais
- 3 depoimentos (Ricardo Santos, Mariana Costa, Joao Oliveira)
- 4 FAQs existentes
- 4 categorias de artigos (Novas Leis, Tecnologia no Judiciario, Direitos do Trabalhador, Case Study)
- 8 artigos existentes das paginas de insights

Todos com `status: 'publicado'` para que o site funcione imediatamente apos o deploy.

### 5.2 Refatoracao dos Componentes

Os componentes de pagina existentes (`hero.tsx`, `services.tsx`, `about.tsx`, etc.) serao refatorados para:

1. Receber dados via props (em vez de conteudo hardcoded)
2. A page.tsx faz o fetch dos dados via Server Action
3. Passa os dados como props para cada componente de secao

**Antes:**
```tsx
// hero.tsx
export function Hero() {
  return <h1>Justica para quem trabalha.</h1>
}
```

**Depois:**
```tsx
// hero.tsx
export function Hero({ dados }: { dados: HeroConteudo }) {
  return <h1>{dados.titulo}</h1>
}

// page.tsx
export default async function HomePage() {
  const secoes = await buscarSecoesDaPagina('home');
  const hero = secoes.find(s => s.slug === 'hero');
  return <Hero dados={hero.conteudo} />;
}
```

---

## 6. Supabase Storage

### 6.1 Bucket

Criar bucket `website` no Supabase Storage para imagens do CMS.

- **Politica:** Leitura publica (sem auth), escrita apenas autenticado
- **Estrutura de pastas:**
  - `website/paginas/{slug}/` — imagens das secoes
  - `website/artigos/{slug}/` — imagens de artigos
  - `website/depoimentos/` — avatares de depoimentos

### 6.2 Upload

O componente `media-upload.tsx` usa o `supabase-storage.service.ts` ja existente para upload, retornando a URL publica que e salva no campo correspondente do JSONB.

---

## 7. RLS (Row Level Security)

### 7.1 Leitura Publica

Todas as tabelas `cms_*` permitem `SELECT` sem autenticacao, filtrado por:
- `cms_paginas`: `status = 'publicado'`
- `cms_secoes`: via join com pagina publicada + `ativo = true`
- `cms_artigos`: `status = 'publicado'`
- `cms_categorias`: sempre visivel
- `cms_depoimentos`: `ativo = true`
- `cms_faq`: `ativo = true`

### 7.2 Escrita Admin

`INSERT`, `UPDATE`, `DELETE` requerem usuario autenticado com permissao adequada (verificado via tabela `permissoes` existente ou role check).

---

## 8. SEO

Cada pagina e artigo pode definir `seo_titulo` e `seo_descricao`. Os page.tsx do Next.js usam a funcao `generateMetadata()` para:

1. Buscar a pagina/artigo do Supabase
2. Retornar os metadados SEO dinamicos
3. Fallback para titulo/descricao padrao se nao definido

---

## 9. Fora de Escopo

- i18n / multiplos idiomas
- Agendamento de publicacao
- Fluxo de aprovacao/revisao
- Versionamento de conteudo (historico de edicoes)
- Block editor / drag-and-drop de secoes
- Preview antes de publicar (pode ser adicionado depois)
- Busca full-text nos artigos (pode usar Supabase text search depois)

---

## 10. Mapa de Paginas Afetadas

### Paginas Publicas (refatoracao de hardcoded -> dinamico)
- `/` (home) — `src/app/page.tsx` + `src/features/website/components/home/*.tsx`
- `/contato` — `src/app/contato/page.tsx`
- `/servicos` — `src/app/servicos/page.tsx`
- `/expertise` — `src/app/expertise/page.tsx`
- `/solucoes` — `src/app/solucoes/page.tsx`
- `/faq` — `src/app/faq/page.tsx`
- `/insights` — `src/app/insights/page.tsx`
- `/insights/tendencias` — `src/app/insights/tendencias/page.tsx`

### Componentes Compartilhados (refatoracao)
- `src/features/website/components/layout/header.tsx` — nav links podem vir do CMS
- `src/features/website/components/layout/footer.tsx` — contato, links, social media
- `src/features/website/components/home/hero.tsx`
- `src/features/website/components/home/services.tsx`
- `src/features/website/components/home/about.tsx`
- `src/features/website/components/home/testimonials.tsx`
- `src/features/website/components/shared/trust-ticker.tsx`

### Novas Rotas Admin
- `src/app/app/configuracoes/website/*` — todas as rotas do CMS admin

### Nova Feature
- `src/features/cms/*` — toda a feature CMS
