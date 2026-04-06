# Zattar OS Design System — MASTER

> **Source of Truth** para todas as decisoes visuais do Zattar OS.
> Extraido da implementacao real de Dashboard, Partes, Contratos e Assinatura Digital.
> Ultima atualizacao: 2026-04-06

---

## 1. Manifesto

### O que somos

Zattar OS e um sistema de gestao juridica para escritorios brasileiros. Nao e um SaaS generico, nao e um dashboard corporativo frio. E a **mesa de trabalho digital** de um advogado — precisa ser funcional como uma ferramenta de precisao e ter a presenca visual de um escritorio premium.

### Principios de Design

| # | Principio | Significado |
|---|-----------|-------------|
| 1 | **Vidro sobre pedra** | Glass morphism sutil sobre fundacao solida. Transparencia para elegancia, nao para confusao |
| 2 | **Dados primeiro, decoracao nunca** | Cada pixel serve informacao. Sem badges fake, sem teatro corporativo |
| 3 | **Roxo com proposito** | O roxo Zattar (`#5523eb`) aparece apenas onde ha intencao — CTAs, foco, estados ativos |
| 4 | **Hierarquia por opacidade** | Nao multiplicamos cores; usamos opacidade do mesmo token para criar profundidade |
| 5 | **Mobile-honest** | Responsive real — escondemos o que nao cabe, nunca comprimimos ate ficar ilegivel |
| 6 | **Tipografia e arquitetura** | Montserrat para titulos, Inter para o conteudo que importa |
| 7 | **Animacao e feedback, nao espetaculo** | 150-300ms, transform/opacity apenas. Respeitar prefers-reduced-motion |

### Personalidade Visual

- **Tom**: Profissional-premium, nunca corporativo-frio
- **Densidade**: Alta (informacao densa com espacamento preciso)
- **Contraste**: Forte em light mode, sutil em dark mode
- **Estetica**: Glass Briefing — vidro fosco com bordas sutis e sombras de ambiente
- **Tint**: Todos os neutros carregam micro-tint roxo (hue 281, croma 0.005-0.01)

---

## 2. Cores

### 2.0 Sistema de Cor

Todas as cores usam **OKLCH** com hue 281 (roxo Zattar) como ancora tonal. Ate neutros e cinzas possuem micro-tint do primary para coesao visual. O formato e:

```
oklch(Lightness Chroma Hue / Alpha)
```

Ancora Light: `oklch(0.48 0.26 281)` (#5523eb)
Ancora Dark: `oklch(0.70 0.20 281)` (tom 70 para contraste 6:1 em fundo escuro)

### 2.1 Paleta Primaria (CSS Variables)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--primary` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | CTAs, links, foco, estados ativos |
| `--primary-foreground` | `oklch(1.0 0 0)` | `oklch(0.15 0.10 281)` | Texto sobre primary |
| `--brand` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | Referencia pura da marca |
| `--highlight` | `oklch(0.60 0.22 45)` | `oklch(0.70 0.20 45)` | Badges de acao, alertas que pedem atencao |
| `--background` | `oklch(0.96 0.01 281)` | `oklch(0.17 0.005 281)` | Canvas principal |
| `--foreground` | `oklch(0.15 0.01 281)` | `oklch(0.98 0 0)` | Texto principal |
| `--card` | `oklch(1.0 0 0)` | `oklch(0.22 0.005 281)` | Fundo de cards |
| `--card-foreground` | `oklch(0.15 0.01 281)` | `oklch(0.98 0 0)` | Texto de cards |
| `--secondary` | `oklch(0.95 0.04 281)` | `oklch(0.28 0.01 281)` | Accent suave, purple wash |
| `--muted` | `oklch(0.92 0.01 281)` | `oklch(0.28 0.005 281)` | Fundos desabilitados |
| `--muted-foreground` | `oklch(0.42 0.01 281)` | `oklch(0.65 0.005 281)` | Texto secundario |
| `--border` | `oklch(0.87 0.01 281)` | `oklch(1.0 0 0 / 0.12)` | Bordas de containers |
| `--input` | `oklch(0.87 0.01 281)` | `oklch(1.0 0 0 / 0.12)` | Bordas de inputs |
| `--destructive` | `oklch(0.55 0.22 25)` | `oklch(0.65 0.20 25)` | Erros, acoes perigosas |
| `--accent` | `oklch(0.95 0.04 281)` | `oklch(0.28 0.01 281)` | Hover states |
| `--popover` | `oklch(1.0 0 0)` | `oklch(0.22 0.005 281)` | Fundo de popovers |
| `--ring` | `transparent` | `transparent` | Anel de foco (desabilitado) |

### 2.2 Status Semanticos

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--success` | `oklch(0.55 0.18 145)` | `oklch(0.70 0.18 145)` | Concluido, ativo, positivo |
| `--warning` | `oklch(0.60 0.18 75)` | `oklch(0.78 0.16 85)` | Atencao, pendente, suspense |
| `--info` | `oklch(0.55 0.18 250)` | `oklch(0.70 0.18 250)` | Informacional, terceiros |
| `--destructive` | `oklch(0.55 0.22 25)` | `oklch(0.65 0.20 25)` | Erro, cancelado, perigoso |

### 2.3 Chart Colors

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--chart-1` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | Dados primarios (roxo) |
| `--chart-2` | `oklch(0.60 0.22 45)` | `oklch(0.70 0.20 45)` | Dados secundarios (laranja) |
| `--chart-3` | `oklch(0.92 0.01 281)` | `oklch(0.35 0.005 281)` | Background/referencia (cinza) |
| `--chart-4` | `oklch(0.55 0.18 150)` | `oklch(0.65 0.18 150)` | Positivo (verde) |
| `--chart-5` | `oklch(0.70 0.01 281)` | `oklch(0.50 0.005 281)` | Neutro (cinza medio) |

### 2.4 Sidebar (Premium escura em ambos os temas)

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `oklch(0.22 0.01 281)` | `oklch(0.17 0.005 281)` |
| `--sidebar-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` |
| `--sidebar-primary` | `oklch(0.70 0.20 281)` | `oklch(0.70 0.20 281)` |
| `--sidebar-primary-foreground` | `oklch(1.0 0 0)` | `oklch(1.0 0 0)` |
| `--sidebar-accent` | `oklch(0.30 0.01 281)` | `oklch(0.26 0.005 281)` |
| `--sidebar-border` | `oklch(1.0 0 0 / 0.1)` | `oklch(1.0 0 0 / 0.1)` |
| `--sidebar-ring` | `oklch(0.70 0.20 281)` | `oklch(0.70 0.20 281)` |

### 2.5 Glassmorphism

| Classe | Background Light | Background Dark | Blur | Uso |
|--------|-----------------|-----------------|------|-----|
| `glass-kpi` | `rgba(255,255,255,0.70)` | `rgba(255,255,255,0.06)` | `12px` | KPI cards, stat cards |
| `glass-widget` | `rgba(255,255,255,0.62)` | `rgba(255,255,255,0.04)` | `16px` | Widget containers |
| `glass-card` | `rgba(255,255,255,0.72)` | - | `20px` | Cards premium |
| `glass-panel` | `rgba(255,255,255,0.65)` | - | `20px` | Panels gerais |

**Sombras Glass (Light Mode):**
```css
glass-kpi:       0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.85)
glass-kpi:hover: 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)
glass-widget:    0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)
glass-widget:hover: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)
```

**Regras do Glass:**
- Sempre com `border` sutil (`border-border/20` ou `border-border/30`)
- Sombra inset para "brilho de borda" em light mode
- NUNCA usar `bg-white/10` em light mode (invisivel) — minimo `bg-white/55`
- Light mode auto-inverte `bg-white/*` patterns via CSS rule em globals.css

### 2.6 Hierarquia por Opacidade (Pattern Principal)

Em vez de criar dezenas de cores, modulamos opacidade sobre tokens semanticos:

```
Texto principal:     text-foreground
Texto secundario:    text-muted-foreground
Texto terciario:     text-muted-foreground/50
Texto quaternario:   text-muted-foreground/40
Texto fantasma:      text-muted-foreground/55 (mono nums)
Texto minimo:        text-muted-foreground/60 (subtitulos widgets — .text-widget-sub)

Borda forte:         border-border
Borda media:         border-border/30
Borda sutil:         border-border/20
Borda minima:        border-border/10
Borda fantasma:      border-border/[0.06]

Fundo primary:       bg-primary/15 (hover forte)
Fundo primary medio: bg-primary/10 (icon backgrounds)
Fundo primary soft:  bg-primary/8  (badges, icon containers)
Fundo primary sutil: bg-primary/6  (tags pill)
Fundo primary tint:  bg-primary/5  (container tags)
Fundo primary leve:  bg-primary/4  (insight banners)
Fundo primary min:   bg-primary/3  (card selecionado)
```

### 2.7 Cores por Tipo de Entidade

Definidas como CSS variables em globals.css:

```css
--entity-cliente:         var(--primary);
--entity-parte-contraria: var(--warning);
--entity-terceiro:        var(--info);
--entity-representante:   var(--success);
```

| Tipo | Text | Background | Uso |
|------|------|------------|-----|
| Cliente | `text-primary/70` | `bg-primary/8` | Cards, badges |
| Parte Contraria | `text-warning/70` | `bg-warning/8` | Cards, badges |
| Terceiro | `text-info/70` | `bg-info/8` | Cards, badges |
| Representante | `text-success/70` | `bg-success/8` | Cards, badges |

### 2.8 Surface Tokens (Layering)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--surface-1` | `oklch(0.98 0.005 281)` | `oklch(0.20 0.005 281)` | Layer 1 |
| `--surface-2` | `oklch(0.97 0.005 281)` | `oklch(0.22 0.005 281)` | Layer 2 |
| `--surface-3` | `oklch(0.95 0.005 281)` | `oklch(0.26 0.005 281)` | Layer 3 |

### 2.9 Chat Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--chat-thread-bg` | `oklch(0.97 0.005 281)` | `oklch(0.15 0.005 281)` |
| `--chat-bubble-received` | `oklch(1.0 0 0)` | `oklch(0.26 0.005 281)` |
| `--chat-bubble-sent` | `var(--primary)` | `var(--primary)` |
| `--chat-sidebar-active` | `oklch(0.95 0.04 281)` | `oklch(0.24 0.01 281)` |

---

## 3. Tipografia

### 3.0 Root Font Size

**IMPORTANTE**: `html { font-size: 18px }` — todos os tamanhos `rem` sao inflados.

```
text-xs  (0.75rem)  → 13.5px real
text-sm  (0.875rem) → 15.75px real
text-base (1rem)    → 18px real
text-lg  (1.125rem) → 20.25px real
text-xl  (1.25rem)  → 22.5px real
text-2xl (1.5rem)   → 27px real
```

Tamanhos micro usam `px` fixo para precisao (imunes ao root 18px).

### 3.1 Font Stack

| Variavel CSS | Classe Tailwind | Fonte | Uso |
|-------------|----------------|-------|-----|
| `--font-sans` | `font-sans` | **Inter** | Corpo de texto, formularios, tabelas |
| `--font-heading` | `font-heading` | **Montserrat** | Titulos de pagina, secoes, cards |
| `--font-display` | `font-display` | **Montserrat** (alias) | KPIs, metricas grandes (bold + tabular-nums) |
| `--font-headline` | `font-headline` | **Manrope** | Headlines do Magistrate AI |
| `--font-mono` | `font-mono` | **Geist Mono** | Codigo, numeros de processo |

> **Nota**: `font-display` e `font-heading` apontam para a mesma fonte (Montserrat). A separacao semantica facilita buscas: `font-display` = numeros/metricas, `font-heading` = titulos/headers.

### 3.2 Componentes Tipados (Enforcement)

Usar os componentes tipados `<Heading>` e `<Text>` de `@/components/ui/typography`:

| Componente | Uso | CSS Class |
|-----------|-----|-----------|
| `<Heading level="page">` | Titulo de pagina | `.text-page-title` |
| `<Heading level="section">` | Secao principal | `.text-section-title` |
| `<Heading level="card">` | Card grande, painel | `.text-card-title` |
| `<Heading level="subsection">` | Subsecao, accordion | `.text-subsection-title` |
| `<Heading level="widget">` | Widget header | `.text-widget-title` |
| `<Text variant="kpi-value">` | Metricas de destaque | `.text-kpi-value` |
| `<Text variant="meta-label">` | Labels uppercase | `.text-meta-label` |
| `<Text variant="mono-num">` | Numeros de processo | `.text-mono-num` |
| `<Text variant="widget-sub">` | Subtitulo de widget | `.text-widget-sub` |
| `<Text variant="caption">` | Texto auxiliar | `.text-caption` |
| `<Text variant="micro-badge">` | Texto de badge | `.text-micro-badge` |
| `<Text variant="overline">` | Label ALL-CAPS | `.text-overline` |
| `<Text variant="label">` | Labels de campo | `.text-label` |
| `<Text variant="micro-caption">` | Timestamps terciarios | `.text-micro-caption` |

> **Regra**: NUNCA compor `font-heading text-2xl font-bold` manualmente.
> Usar `<Heading level="page">` que resolve para a CSS class correta.
> Variantes invalidas produzem erro de TypeScript em tempo de compilacao.

### 3.3 Escala Tipografica (Classes CSS Utilitarias)

O sistema define classes CSS em `globals.css` com tamanhos em **px fixo** para headings/UI e **rem** para body text:

| Classe CSS | Tamanho | Peso | Familia | Uso Real |
|------------|---------|------|---------|----------|
| `.text-display-1` | 36-60px (clamp) | Bold | `font-heading` | Hero, landing |
| `.text-display-2` | 30-48px (clamp) | Bold | `font-heading` | Hero secundario |
| `.text-page-title` | 24px | Bold | `font-heading` | PageShell title ("Processos", "Partes") |
| `.text-section-title` | 20px | Semibold | `font-heading` | Secao principal |
| `.text-card-title` | 18px | Semibold | `font-heading` | Card grande, painel detalhe |
| `.text-subsection-title` | 16px | Semibold | `font-heading` | Subsecao, accordion |
| `.text-widget-title` | 14px | Semibold | `font-heading` | Widget header (dashboard) |
| `.text-kpi-value` | 24px | Bold | `font-heading` | Metricas de destaque + `tabular-nums` |
| `.text-label` | 14px | Medium | Default | Labels de campo |
| `.text-caption` | 13px | Normal | Default | Texto auxiliar |
| `.text-widget-sub` | 12px | Normal | Default | Subtitulo de widget (`text-muted-foreground/60`) |
| `.text-overline` | 11px | Semibold | Default | Labels ALL-CAPS |
| `.text-meta-label` | 11px | Semibold | Default | Metadata uppercase (tracking 0.14em) |
| `.text-mono-num` | 10px | Normal | `font-mono` | Numeros de processo, datas (tabular-nums) |
| `.text-micro-caption` | 10px | Normal | Default | Timestamps tercarios |
| `.text-micro-badge` | 9px | Medium | Default | Texto dentro de badges |

### 3.4 Patterns Tipograficos Recorrentes (tokens.ts)

```
Titulo de pagina:     text-page-title (ou font-heading text-2xl font-bold tracking-tight)
Subtitulo de pagina:  text-sm text-muted-foreground/50 mt-0.5
Titulo de widget:     text-widget-title (ou text-sm font-heading font-semibold)
KPI valor:            text-kpi-value (ou font-heading text-2xl font-bold tabular-nums)
Label uppercase:      text-meta-label (ou text-[11px] font-semibold uppercase tracking-[0.14em])
Numero mono:          text-mono-num (ou text-[10px] font-mono text-muted-foreground/55 tabular-nums)
Micro badge:          text-micro-badge (ou text-[9px] font-medium)
Tag inline:           text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50 border border-primary/10
Tag pill:             text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10
Numero tabular:       tabular-nums (em qualquer numero alinhado)
Texto truncado:       truncate (single line), line-clamp-2 (multi)
```

### 3.5 Regras Criticas

- **Minimo body text**: `text-sm` (~15.75px real) em desktop, `text-xs` (~13.5px real) em mobile
- **Numeros financeiros**: Sempre `tabular-nums` para alinhamento
- **KPIs**: `font-heading font-bold tabular-nums` (Montserrat)
- **tracking-tight**: Apenas em titulos de pagina (`.text-page-title` ja inclui)
- **tracking-wider**: Apenas em labels uppercase (`.text-meta-label` ja inclui)
- **Headings automaticos**: `h1-h6` recebem `font-heading text-foreground` via globals.css

---

## 4. Espacamento

### 4.1 Grid Base: 4px

Todo espacamento e multiplo de 4px. Usamos a escala do Tailwind.

### 4.2 Tokens Semanticos de Layout

| Contexto | Padding | Gap | Classes |
|----------|---------|-----|---------|
| **Pagina** | `p-4 sm:p-6 lg:p-8` | `gap-6 lg:gap-8` | Container principal |
| **Secao** | `p-4 sm:p-6` | `gap-4 sm:gap-6` | Blocos dentro da pagina |
| **Card padrao** | `p-4 sm:p-6` | `gap-3 sm:gap-4` | Cards normais |
| **Card compacto** | `p-3 sm:p-4` | `gap-2` | Cards em grids densos |
| **Card minimal** | `p-3` | `gap-1.5` | Kanban cards |
| **GlassPanel** | `p-5` | `gap-3` | Panels glass |
| **PulseStrip** | `px-5 py-3` | `gap-6` | Barra de stats |
| **Formulario** | - | `gap-4` (fields), `gap-6` (secoes) | Forms |
| **Tabela** | `px-3 py-2` (cell), `px-3 py-3` (header) | `gap-4` | DataTable |
| **Dialog** | `p-6` | `gap-4`, `gap-2` (footer) | Modais |

### 4.3 Escala de Gap

| Nome | Classe | Pixels | Uso |
|------|--------|--------|-----|
| Tight | `gap-1` | 4px | Icon+text inline |
| Compact | `gap-1.5` | 6px | Dentro de cards pequenos |
| Default | `gap-2` | 8px | Entre elementos inline |
| Loose | `gap-3` | 12px | Entre cards, entre items |
| Section | `gap-4` | 16px | Entre secoes |
| Block | `gap-6` | 24px | Entre blocos maiores |
| Page | `gap-8` | 32px | Espacamento de pagina |

### 4.4 Container Max-Widths

| Contexto | Classe | Uso |
|----------|--------|-----|
| Pagina CRM | `max-w-350` (~1400px) | Partes, Contratos |
| Dialog padrao | `sm:max-w-md` | Forms simples |
| Dialog largo | `sm:max-w-lg` | Side panels |
| Sheet | `w-full sm:w-96` | Widget picker |
| Detail Panel | `380px` (`--detail-panel-width`) | Panel de detalhe lateral |

---

## 5. Bordas e Raio

### 5.1 Border Radius

| Token | Classe | Pixels | Uso |
|-------|--------|--------|-----|
| Base | `--radius: 0.5rem` | 8px | Valor de referencia |
| 2XL | `rounded-2xl` | 16px | GlassPanel, containers externos |
| XL | `rounded-xl` | 12px | Cards, botoes grandes, avatares |
| LG | `rounded-lg` | 8px | Inputs, alert banners, cards menores |
| MD | `rounded-md` | 6px | Botoes pequenos, badges |
| SM | `rounded-sm` | 4px | Elementos minimos |
| Full | `rounded-full` | 50% | Badges pill, dots, avatares circulares |

### 5.2 Hierarquia de Uso

```
Container externo (GlassPanel):  rounded-2xl
Card / button grande:            rounded-xl
Input / card menor:              rounded-lg
Badge / botao pequeno:           rounded-md
Elemento minimo:                 rounded-sm
Dot / avatar / pill:             rounded-full
```

### 5.3 Bordas

```
Container padrao:     border border-border/20
Container depth-2:    border border-border/30
Divider sutil:        border-t border-border/10
Divider forte:        border-t border-border
Input:                border border-input
Accent left:          border-l-[3px] border-l-{color}
Dashed (filters):     border-dashed
Kanban header:        border-b-2 {stage.color}
```

---

## 6. Sombras e Elevacao

### 6.1 Escala de Sombra

| Nivel | Classe | Uso |
|-------|--------|-----|
| 0 | `shadow-none` | Flat elements |
| 1 | `shadow-sm` | Botoes, elevacao sutil |
| 2 | `shadow` | Cards padrao |
| 3 | `shadow-md` | Hover states, cards ativos |
| 4 | `shadow-lg` | Drag overlays, modais |
| **PROIBIDO** | ~~`shadow-xl`~~ | Nunca usar |

### 6.2 Glass Shadows (Customizadas)

```css
/* Light Mode */
KPI:         0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.85)
Widget:      0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)
KPI Hover:   0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)
Widget Hover:0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)
Ambient:     0 20px 40px rgba(0,0,0,0.08)
Purple Glow: 0 0 30px oklch(0.48 0.26 281 / 0.1)
Premium:     0 8px 30px rgb(0,0,0,0.04) (paginas publicas)
```

---

## 7. Icones

### 7.1 Biblioteca: Lucide React

Unica biblioteca de icones. Sem emojis como icones UI. Sem mistura de bibliotecas.

### 7.2 Escala de Tamanho

| Tamanho | Classe | Pixels | Uso |
|---------|--------|--------|-----|
| XS | `size-2` | 8px | Dots decorativos |
| SM | `size-2.5` | 10px | Icones de contato em cards |
| MD | `size-3` | 12px | Footer metrics, small icons |
| MD+ | `size-3.5` | 14px | Botoes, search input |
| Default | `size-4` / `h-4 w-4` | 16px | Uso padrao (headers, actions) |
| LG | `h-5 w-5` | 20px | Icones maiores |
| XL | `h-6 w-6` | 24px | Section headers |
| 2XL | `h-8 w-8` | 32px | Dialog actions, empty states |
| 3XL | `h-10 w-10` | 40px | Empty state principal |

### 7.3 Cores de Icones

```
Padrao:          text-muted-foreground
Sutil:           text-muted-foreground/50
Muito sutil:     text-muted-foreground/40
Fantasma:        text-muted-foreground/55
Primary:         text-primary
Semantico:       text-destructive, text-success, text-warning, text-info
Dinamico:        style={{ color }} (por config)
```

### 7.4 Icon Containers

| Tamanho | Classes | Pixels | Uso |
|---------|---------|--------|-----|
| LG | `size-10 rounded-xl flex items-center justify-center shrink-0` | 40px | Cards de processo, entidades |
| MD | `size-8 rounded-lg flex items-center justify-center shrink-0` | 32px | Listas, rows de tabela |
| SM | `size-6 rounded-md flex items-center justify-center shrink-0` | 24px | Inline, badges |
| XS | `size-5 rounded flex items-center justify-center shrink-0` | 20px | Indicators, dots |

---

## 8. Componentes Primitivos

### 8.1 GlassPanel (Container Base)

O bloco fundamental de construcao visual do Zattar OS.

Classe base: `rounded-2xl border transition-all duration-300 flex flex-col`

| Depth | Classes | Uso |
|-------|---------|-----|
| 1 (default) | `glass-widget bg-transparent border-border/20` | Containers de widget |
| 2 | `glass-kpi bg-transparent border-border/30` | KPI cards, stats |
| 3 | `bg-primary/[0.04] backdrop-blur-xl border-primary/10` | Destaque primary |

### 8.2 Cards

**Card shadcn/ui (padrao):**
```
rounded-xl border border-border bg-card shadow-sm
CardHeader: pb-2 (compacto) ou padrao
CardTitle: text-sm font-medium
CardContent: p-6
```

**Card de Entidade (EntityCard):**
```
GlassPanel + p-4 + gap-3
Avatar: size-10 rounded-xl {config.bg}
Nome: text-sm font-semibold truncate
Type badge: text-[9px] px-1.5 py-0.5 rounded
Tags: text-[9px] bg-primary/5 text-primary/50 border border-primary/10
Footer: border-t border-border/10
Hover: hover:scale-[1.01] transition-all duration-200
```

**Card Kanban (ContratoCard):**
```
GlassPanel + p-3
Client: text-[11px] font-semibold truncate leading-tight
Valor: text-[11px] font-bold tabular-nums
Dias: text-[9px]
Tags: text-[8px]
Stuck (30+ dias): ring-1 ring-warning/20
Bottom accent bar: computed backgroundColor from stage color
```

**Card de Lista (EntityListRow):**
```
px-4 py-2.5 rounded-xl border border-transparent
Avatar: size-8 rounded-lg
Selected: bg-primary/[0.06] border border-primary/15
Hover: hover:bg-white/4
Transition: transition-all duration-150
```

### 8.3 PulseStrip (Barra de Stats)

```
GlassPanel + px-5 py-3
Layout: flex items-center gap-6 overflow-x-auto
Divider: w-px h-8 bg-border/10
Icone: size-4 {color}/40
Numero: font-heading text-lg font-bold tabular-nums
Label: text-[10px] text-muted-foreground/40
Delta: text-success/60 ml-1
```

### 8.4 TabPills (Navegacao)

```
Container: flex gap-1 p-1 rounded-xl bg-border/[0.06]
Ativa: bg-primary/12 text-primary shadow-sm
Inativa: text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-white/4
Todos: px-3 py-1.5 rounded-lg text-xs font-medium
Count: text-[10px] tabular-nums
```

### 8.5 SearchInput

```
Container: relative
Icone: size-3.5 text-muted-foreground/30 absolute left-2.5
Input: w-56 pl-8 pr-3 py-1.5 rounded-lg bg-white/4
       border border-border/15 text-xs
       placeholder:text-muted-foreground/30
       focus:ring-1 focus:ring-primary/20
```

### 8.6 ViewToggle

```
Container: flex p-0.5 rounded-lg bg-border/6
Ativo: bg-primary/12 text-primary
Inativo: text-muted-foreground/30 hover:text-muted-foreground/50
Todos: p-1.5 rounded-md transition-all
```

### 8.7 Visualizacoes de Dados

| Componente | Tamanho Default | Uso |
|------------|----------------|-----|
| Sparkline | 60x20 | Tendencias inline |
| MiniArea | 60x20 | Areas com gradiente |
| MiniBar | variavel | Barras horizontais |
| MiniDonut | variavel | Distribuicao circular |
| StackedBar | variavel | Segmentos empilhados |
| ProgressRing | size-32 | Progresso circular |
| GaugeMeter | variavel | Velocimetro semicircular |
| CalendarHeatmap | variavel | Grid estilo GitHub |
| Treemap | variavel | Retangulos proporcionais |
| AnimatedNumber | - | Contagem animada (1200ms, cubic-out) |

### 8.8 Indicadores de Status

**UrgencyDot:**
```
Critico: bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)] animate-pulse
Alto:    bg-warning shadow-[0_0_6px_hsl(var(--warning)/0.4)]
Medio:   bg-primary/50
Baixo:   bg-muted-foreground/30
OK:      bg-success/60
```

**InsightBanner:**
```
Tipos: warning | info | success | alert
Container: rounded-lg p-3 border-l-[3px]
Background: var(--insight-{tipo}-bg) definido em globals.css
Icone: size-4
Texto: text-sm
```

---

## 9. Widget Tokens

Tokens centralizados para o sistema de widgets da dashboard, definidos em `globals.css`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--widget-radius` | `1rem` (16px) | Border radius de widgets |
| `--widget-padding` | `1.25rem` (20px) | Padding interno |
| `--widget-gap` | `1rem` (16px) | Gap entre items |
| `--widget-border-opacity` | `0.06` | Opacidade de bordas |
| `--widget-label-size` | `10px` | Tamanho de labels |
| `--widget-number-weight` | `700` | Peso de numeros |
| `--widget-transition` | `200ms` | Duracao de transicao |
| `--widget-hover-scale` | `1.01` | Scale no hover |

**Entity Card Tokens:**
| Token | Valor |
|-------|-------|
| `--card-entity-radius` | `1rem` |
| `--card-entity-padding` | `1rem` |
| `--card-entity-avatar-size` | `2.5rem` (40px) |
| `--card-entity-avatar-radius` | `0.75rem` |

**Tab Pills Tokens:**
| Token | Valor |
|-------|-------|
| `--tab-pill-radius` | `0.75rem` |
| `--tab-pill-padding-x` | `0.75rem` |
| `--tab-pill-padding-y` | `0.375rem` |
| `--tab-pill-active-bg` | `var(--primary)` |

**Pulse Strip Tokens:**
| Token | Valor |
|-------|-------|
| `--pulse-gap` | `1.5rem` |
| `--pulse-padding-x` | `1.25rem` |
| `--pulse-padding-y` | `0.75rem` |

---

## 10. Patterns de Pagina

### 10.1 Header de Pagina

```
Layout: flex items-start justify-between gap-4
Titulo: text-page-title (font-heading 24px font-bold)
Subtitulo: text-sm text-muted-foreground/50 mt-0.5
Acoes: flex items-center gap-2
```

### 10.2 Layout de Pagina (tokens.ts)

```
Container: max-w-350 mx-auto
Gap vertical: space-y-5
Padding: py-6
Completo: max-w-350 mx-auto space-y-5 py-6
Card grid: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3
Detail layout: grid gap-3 lg:grid-cols-[1fr_380px]
Toolbar: flex flex-col sm:flex-row items-start sm:items-center gap-3
```

### 10.3 Modos de Visualizacao

Tres modos padrao disponiveis nas paginas de listagem:

| Modo | Descricao | Componente |
|------|-----------|------------|
| **Grid** | Cards em grid responsivo | EntityCard / ContratoCard |
| **List** | Rows compactos | EntityListRow / ContratoListRow |
| **Pipeline/Kanban** | Colunas com drag-drop | KanbanColumn + cards |

### 10.4 Pipeline Funnel

```
Container: GlassPanel p-5 flex gap-4
Stage card: flex-1 flex flex-col items-center gap-2
Heading: text-[10px] text-muted-foreground/50 uppercase tracking-wider
Count: font-heading text-2xl font-bold
Bar: h-3 rounded-full, opacity 0.6, transition-all duration-700
Conversion rates:
  70%+: text-success/60
  50-70%: text-warning/60
  <50%: text-destructive/60
```

### 10.5 Kanban Column

```
Header: border-b-2 {stage.color}
Label: font-heading text-xs font-semibold
Badge count: text-[10px] px-1.5 py-0.5 rounded-full bg-border/10
Body: flex flex-col gap-2
Width: min-w-[260px] max-w-60 / sm:min-w-70 sm:max-w-70
Empty: py-8 text-center text-[10px] text-muted-foreground/25
```

### 10.6 Data Table (DataShell)

Padrao **OBRIGATORIO** para todas as listagens tabulares:

```
<DataShell header={<DataTableToolbar />} footer={<DataPagination />}>
  <DataTable data={data} columns={columns} />
</DataShell>
```

- Toolbar: h-9, search com debounce 500ms
- Tabela: rounded-md border bg-card
- Paginacao: 0-based no UI, 1-based na API

### 10.7 Workflow Steps (Assinatura Digital)

```
Desktop Stepper:
  Layout: flex items-center justify-center gap-2
  Connector: h-0.5 w-6 lg:w-8
  Completed: bg-primary (connector) + Check icon
  Current: border-2 border-primary + dot h-2.5 w-2.5 bg-primary
  Pending: border-2 border-border

Progress Bar (Public):
  Container: h-1.5 sm:h-2 w-full bg-muted rounded-full
  Fill: bg-primary rounded-full transition-all duration-500 ease-out
  Label: text-xs text-muted-foreground "Passo X de Y - Z%"
```

### 10.8 Upload Dropzone

```
Empty: border-dashed border-border bg-muted/30
Active: scale-[1.02] border-primary bg-primary/10
Error: border-destructive bg-destructive/5
With file: border-primary/50 bg-primary/5
Icon: size-12 + ping animation no hover
```

### 10.9 Empty States

```
Container: col-span-full flex flex-col items-center justify-center py-16 text-center
Icone: size-8 text-muted-foreground/20 mb-3
Titulo: text-sm font-medium text-muted-foreground/50
Subtitulo: text-xs text-muted-foreground/30
```

### 10.10 Skeleton Loading

```
Card: rounded-2xl border border-border/20 glass-widget bg-transparent p-4 animate-pulse
Placeholder: bg-muted-foreground/10 rounded
Placeholder subtle: bg-muted-foreground/8
```

---

## 11. Animacoes e Transicoes

### 11.1 Escala de Duracao

| Nome | Duracao | Uso |
|------|---------|-----|
| Fast | `150ms` | Hover de botao, toggle |
| Normal | `200ms` | Maioria das interacoes |
| Slow | `300ms` | Abertura de panels, glass transitions |
| Chart | `500ms` | Barras de graficos, progress |
| Long | `700ms` | Funnel bars, gauge meters |
| Count | `1200ms` | AnimatedNumber |

### 11.2 Propriedades Animaveis

```
Padrao:    transition-all duration-200
Cores:     transition-colors duration-200
Transform: transition-transform duration-200
Opacity:   transition-opacity duration-200
```

### 11.3 Easing

- **Padrao**: `ease-in-out` (a maioria)
- **Progress**: `ease-out` (barras de progresso)
- **Counting**: `cubic-out` (1 - Math.pow(1 - progress, 3))

### 11.4 Hover Effects

```
Card scale:        hover:scale-[1.01]
Card shadow:       hover:shadow-md
Background:        hover:bg-white/4 (sutil)
Background forte:  hover:bg-muted/50
Opacity reveal:    opacity-0 group-hover:opacity-100
Icon scale:        group-hover:scale-110
```

### 11.5 Regras

- Sempre respeitar `prefers-reduced-motion` (implementado em globals.css)
- Nunca animar `width`, `height`, `top`, `left` — usar `transform` e `opacity`
- Drag overlay: `opacity-95 shadow-lg rotate-1`
- Loading: `animate-pulse` para skeletons, `animate-spin` para spinners
- Ping: `animate-ping` apenas em indicadores de foco critico
- Elementos interativos (button, a, input, select, textarea) recebem `transition-all duration-200 ease-in-out` via globals.css

---

## 12. Responsividade

### 12.1 Breakpoints

| Prefixo | Largura | Dispositivo |
|---------|---------|-------------|
| (default) | < 640px | Mobile |
| `sm:` | >= 640px | Mobile landscape |
| `md:` | >= 768px | Tablet |
| `lg:` | >= 1024px | Desktop |
| `xl:` | >= 1280px | Desktop largo |
| `2xl:` | >= 1536px | Ultra wide |

### 12.2 Patterns Responsivos Consolidados

```
Grid de cards:     grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
Grid de KPIs:      grid-cols-1 md:grid-cols-2 lg:grid-cols-4
Grid de stats:     gap-4 md:grid-cols-5
Dashboard:         grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3
Direcao:           flex-col sm:flex-row
Padding:           p-4 sm:p-6 lg:p-8
Texto:             text-xs sm:text-sm (mobile/desktop)
Visibilidade:      hidden sm:block / hidden md:block / hidden lg:block
Largura:           w-full sm:w-auto
```

---

## 13. Acessibilidade

### 13.1 Contraste

- Texto normal: minimo 4.5:1 ratio
- Texto grande: minimo 3:1 ratio
- NUNCA usar `text-muted-foreground/30` para texto legivel — apenas decorativo

### 13.2 Interacao

- Touch targets: minimo 44x44px
- Focus visible: `focus-visible:ring-2 focus-visible:ring-ring`
- Todos clicaveis: `cursor-pointer`
- `aria-label` em botoes icon-only
- `sr-only` para texto acessivel escondido
- Tab order segue ordem visual

### 13.3 Motion

- Sempre verificar `prefers-reduced-motion`
- globals.css implementa: `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important`
- Fornecer alternativa estatica para animacoes

---

## 14. Badges Semanticos

### 14.1 Sistema

Nunca hardcodar cores de badges. Usar `getSemanticBadgeVariant(category, value)` de `@/lib/design-system`.

### 14.2 Categorias Mapeadas

| Categoria | Exemplos | Funcao |
|-----------|----------|--------|
| `tribunal` | TRT1, TRT2, TST, STJ | Cores alternadas por tribunal |
| `status` | ATIVO, SUSPENSO, ARQUIVADO | Semantica por estado |
| `grau` | 1o_GRAU, 2o_GRAU, TST | Por instancia judicial |
| `parte` | PERITO, TESTEMUNHA, MINISTERIO | Por papel processual |
| `polo` | ATIVO, PASSIVO, AUTOR, REU | Por polo processual |
| `audiencia_modalidade` | PRESENCIAL, VIRTUAL, HIBRIDA | Modalidade de audiencia |

### 14.3 Tones

| Tone | Estilo | Uso |
|------|--------|-----|
| `soft` | Background claro + texto colorido | Dentro de cards, tabelas (padrao) |
| `solid` | Background forte + texto branco | Destaque, headers |

---

## 15. Anti-Patterns (NUNCA fazer)

| Anti-Pattern | Correto |
|--------------|---------|
| Emojis como icones UI | SVG icons do Lucide |
| `shadow-xl` | `shadow-lg` no maximo |
| Hardcodar cores de badge (`bg-green-100`, `text-blue-600`) | `getSemanticBadgeVariant()` |
| Hardcodar cores semanticas (`text-green-600`, `text-red-500`) | `text-success`, `text-destructive` |
| `bg-white/10` em light mode | `bg-white/55` minimo (auto-invertido via CSS) |
| Fontes hardcoded | CSS variables (`font-heading`, `font-sans`) |
| Scale transforms em hover que quebram layout | `hover:scale-[1.01]` maximo, com `transition-all` |
| Misturar bibliotecas de icones | Apenas Lucide React |
| `z-index` arbitrario | Usar escala definida (10, 20, 30, 40, 50) |
| Animar width/height/top/left | Usar transform/opacity |
| Badges fake (ISO, SOC2, versoes) | Design genuino com personalidade |
| `text-gray-400` em light mode | `text-muted-foreground/50` minimo |
| `font-display` sem `tabular-nums` em KPIs | `font-display text-2xl font-bold tabular-nums` |
| `font-mono` para numeros de processo | `<Text variant="mono-num">` ou `text-mono-num` |
| `<h1 className="text-page-title">` | `<Heading level="page">` (typed component) |
| Compor `font-heading text-2xl font-bold` manualmente | `<Heading level="page">` |
| Botoes icon-only sem `aria-label` | Sempre incluir `aria-label` |

---

## 16. Checklist Pre-Entrega

### Visual
- [ ] Sem emojis como icones (apenas Lucide SVG)
- [ ] Todas as cores via tokens (CSS variables), sem hardcoded
- [ ] Hover states nao causam layout shift
- [ ] Glass elements visiveis em light mode
- [ ] Badges usando `getSemanticBadgeVariant()`, nunca classes de cor

### Interacao
- [ ] Todos clicaveis tem `cursor-pointer`
- [ ] Hover states fornecem feedback visual
- [ ] Transicoes em 150-300ms
- [ ] Focus states visiveis para teclado

### Layout
- [ ] Responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem scroll horizontal em mobile
- [ ] Conteudo nao escondido atras de elementos fixos
- [ ] `max-width` consistente

### Dados
- [ ] Numeros com `tabular-nums`
- [ ] Badges via `getSemanticBadgeVariant()`
- [ ] Empty states definidos
- [ ] Loading skeletons definidos

### Acessibilidade
- [ ] Alt text em imagens
- [ ] Labels em form inputs
- [ ] `aria-label` em botoes icon-only
- [ ] `prefers-reduced-motion` respeitado
- [ ] Contraste 4.5:1 minimo em texto

---

## Apendice: Mapa de Arquivos

```
src/app/globals.css          - CSS variables (light/dark), glass effects, tipografia utility
                               classes, widget tokens, prefers-reduced-motion (~1100 linhas)

tailwind.config.ts           - Theme extends: cores, fontes (sans, heading, mono), border-radius

src/lib/design-system/
  tokens.ts                  - Tokens TS: SPACING, TYPOGRAPHY, TEXT_PATTERNS, OPACITY_SCALE,
                               PAGE_LAYOUT, GLASS_DEPTH, ICON_CONTAINER, AVATAR_SIZES,
                               SHADOWS, RADIUS, TRANSITIONS, Z_INDEX
  variants.ts                - Mapeamentos semanticos de badges (500+ linhas)
  utils.ts                   - Formatadores brasileiros (moeda, CPF, CNPJ, data)
  index.ts                   - Barrel export

src/components/
  ui/                        - 104+ componentes shadcn/ui (new-york style)
  shared/                    - Patterns obrigatorios (PageShell, DataShell, DialogFormShell)
  dashboard/                 - Primitivos CRM (EntityCard, PulseStrip, TabPills, GlassPanel)
```

### Fontes (carregadas em layout.tsx)

```
Inter         → --font-inter       → font-sans      (corpo, UI)
Montserrat    → --font-montserrat  → font-heading   (titulos, headers)
Montserrat    → --font-montserrat  → font-display   (KPIs, metricas — alias semantico)
Manrope       → --font-manrope     → font-headline  (Magistrate AI)
Geist Mono    → --font-geist-mono  → font-mono      (codigo, numeros)
```

### @theme inline (Tailwind v4)

As variaveis de cor e fonte sao mapeadas em `globals.css` via `@theme inline { ... }` que cria automaticamente as utility classes do Tailwind (ex: `bg-primary`, `text-success`, `font-headline`).
