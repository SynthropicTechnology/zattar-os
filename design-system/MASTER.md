# Zattar OS Design System — MASTER

> **Source of Truth** para todas as decisoes visuais do Zattar OS.
> Extraido da implementacao real de Dashboard, Partes, Contratos e Assinatura Digital.
> Ultima atualizacao: 2026-03-31

---

## 1. Manifesto

### O que somos

Zattar OS e um sistema de gestao juridica para escritorios brasileiros. Nao e um SaaS generico, nao e um dashboard corporativo frio. E a **mesa de trabalho digital** de um advogado — precisa ser funcional como uma ferramenta de precisao e ter a presenca visual de um escritorio premium.

### Principios de Design

| # | Principio | Significado |
|---|-----------|-------------|
| 1 | **Vidro sobre pedra** | Glass morphism sutil sobre fundacao solida. Transparencia para elegancia, nao para confusao |
| 2 | **Dados primeiro, decoracao nunca** | Cada pixel serve informacao. Sem badges fake, sem teatro corporativo |
| 3 | **Roxo com proposito** | O roxo Zattar (#842cd3) aparece apenas onde ha intencao — CTAs, foco, estados ativos |
| 4 | **Hierarquia por opacidade** | Nao multiplicamos cores; usamos opacidade do mesmo token para criar profundidade |
| 5 | **Mobile-honest** | Responsive real — escondemos o que nao cabe, nunca comprimimos ate ficar ilegivel |
| 6 | **Tipografia e arquitetura** | Montserrat para titulos da forma, Inter para o conteudo que importa |
| 7 | **Animacao e feedback, nao espetaculo** | 150-300ms, transform/opacity apenas. Respeitar prefers-reduced-motion |

### Personalidade Visual

- **Tom**: Profissional-premium, nunca corporativo-frio
- **Densidade**: Alta (informacao densa com espacamento preciso)
- **Contraste**: Forte em light mode, sutil em dark mode
- **Estetica**: Glass Briefing — vidro fosco com bordas sutis e sombras de ambiente

---

## 2. Cores

### 2.1 Paleta Primaria (CSS Variables)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--primary` | `#842cd3` | `oklch(0.55 0.25 285)` | CTAs, links, foco, estados ativos |
| `--primary-foreground` | `#ffffff` | `oklch(1 0 0)` | Texto sobre primary |
| `--highlight` | `oklch(0.6 0.22 45)` | `oklch(0.68 0.22 45)` | Badges de acao, alertas que pedem atencao |
| `--brand` | `#842cd3` | `#842cd3` | Referencia pura da marca |
| `--background` | `#fafafa` | `oklch(0.18 0 0)` | Canvas principal |
| `--foreground` | `#1a1a1a` | `oklch(0.98 0 0)` | Texto principal |
| `--card` | `#ffffff` | `oklch(0.24 0 0)` | Fundo de cards |
| `--secondary` | `#f3eeff` | `oklch(0.24 0.02 285)` | Accent suave, lavanda |
| `--muted` | `#f5f5f5` | `oklch(0.22 0 0)` | Fundos desabilitados |
| `--muted-foreground` | `#6b6b6b` | `oklch(0.7 0 0)` | Texto secundario |
| `--border` | `#e5e5e5` | `oklch(1 0 0 / 0.15)` | Bordas de containers |
| `--destructive` | `#d73357` | `oklch(0.6 0.2 25)` | Erros, acoes perigosas |
| `--accent` | `#f3eeff` | `oklch(0.28 0 0)` | Hover states |

### 2.2 Status Semanticos

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--success` | `#16a34a` | `oklch(0.7 0.18 145)` | Concluido, ativo, positivo |
| `--warning` | `#d97706` | `oklch(0.78 0.16 85)` | Atencao, pendente, suspense |
| `--info` | `#2563eb` | `oklch(0.65 0.18 250)` | Informacional, terceiros |
| `--destructive` | `#d73357` | `oklch(0.6 0.2 25)` | Erro, cancelado, perigoso |

### 2.3 Chart Colors

| Token | Cor | Uso |
|-------|-----|-----|
| `--chart-1` | `#842cd3` | Dados primarios (roxo) |
| `--chart-2` | `oklch(0.6 0.22 45)` | Dados secundarios (laranja) |
| `--chart-3` | `#e5e5e5` | Background/referencia (cinza) |
| `--chart-4` | `oklch(0.55 0.18 150)` | Positivo (verde) |
| `--chart-5` | `#aaaaaa` | Neutro (cinza medio) |

### 2.4 Sidebar (Sempre escura, ambos os temas)

| Token | Valor |
|-------|-------|
| `--sidebar` | `oklch(0.24 0 0)` |
| `--sidebar-primary` | `oklch(0.45 0.25 285)` |
| `--sidebar-accent` | `oklch(0.32 0 0)` |
| `--sidebar-border` | `oklch(1 0 0 / 0.1)` |

### 2.5 Glassmorphism

| Classe | Background Light | Background Dark | Blur | Uso |
|--------|-----------------|-----------------|------|-----|
| `glass-kpi` | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.06)` | `12px` | KPI cards, stat cards |
| `glass-widget` | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.04)` | `16px` | Widget containers |

**Regras do Glass:**
- Sempre com `border` sutil (`border-border/20` ou `border-border/30`)
- Sombra inset para "brilho de borda" em light mode
- NUNCA usar `bg-white/10` em light mode (invisivel) — minimo `bg-white/55`

### 2.6 Hierarquia por Opacidade (Pattern Principal)

Em vez de criar dezenas de cores, modulamos opacidade sobre tokens semanticos:

```
Texto principal:     text-foreground
Texto secundario:    text-muted-foreground
Texto terciario:     text-muted-foreground/50
Texto quaternario:   text-muted-foreground/35
Texto minimo:        text-muted-foreground/30
Texto fantasma:      text-muted-foreground/20

Borda forte:         border-border
Borda media:         border-border/30
Borda sutil:         border-border/20
Borda minima:        border-border/10
Borda fantasma:      border-border/[0.06]

Fundo hover:         bg-white/4
Fundo hover forte:   bg-white/6
Fundo primary:       bg-primary/12 (tabs ativas)
Fundo primary sutil: bg-primary/8 (badges)
Fundo primary leve:  bg-primary/[0.04] (depth-3 panels)
Fundo primary min:   bg-primary/[0.05] (tags)
```

### 2.7 Cores por Tipo de Entidade

| Tipo | Text | Background | Uso |
|------|------|------------|-----|
| Cliente | `text-primary/70` | `bg-primary/8` | Cards, badges |
| Parte Contraria | `text-warning/70` | `bg-warning/8` | Cards, badges |
| Terceiro | `text-info/70` | `bg-info/8` | Cards, badges |
| Representante | `text-success/70` | `bg-success/8` | Cards, badges |

---

## 3. Tipografia

### 3.1 Font Stack

| Variavel | Fonte | Uso |
|----------|-------|-----|
| `--font-sans` / `font-sans` | **Inter** | Corpo de texto, formularios, tabelas |
| `--font-heading` / `font-heading` | **Montserrat** | Titulos de pagina, secoes, cards |
| `--font-headline` / `font-headline` | **Manrope** | Headlines do Magistrate AI |
| `--font-mono` / `font-mono` | **Geist Mono** | Codigo, numeros de processo |

### 3.2 Escala Tipografica

| Nivel | Classe | Peso | Familia | Uso Real |
|-------|--------|------|---------|----------|
| H1 - Titulo de Pagina | `text-2xl font-semibold tracking-tight` | Semibold | `font-heading` | PageShell title |
| H2 - Titulo de Secao | `text-base font-medium` | Medium | `font-heading` | Widget headers |
| H3 - Titulo de Card | `text-sm font-medium` | Medium | Default | Card titles |
| Metrica Grande | `text-2xl font-bold` | Bold | `font-display` | KPIs, stats |
| Metrica Media | `text-lg font-bold` | Bold | `font-display` | Secondary stats |
| Corpo | `text-sm` | Normal | `font-sans` | Conteudo geral |
| Label | `text-xs font-medium` | Medium | Default | Tabs, botoes |
| Caption | `text-[10px]` | Normal/Medium | Default | Metricas, metadata |
| Micro | `text-[9px]` | Medium | Default | Tags, badges small |
| Nano | `text-[8px]` | Normal | Default | Tags minimas (cards kanban) |

### 3.3 Patterns Tipograficos Recorrentes

```
Titulo de pagina:     font-heading text-2xl font-semibold tracking-tight
Subtitulo de pagina:  text-sm text-muted-foreground/60 mt-0.5
Titulo de widget:     text-sm font-medium flex items-center gap-2
Label uppercase:      text-[10px] text-muted-foreground/50 uppercase
Label tracking:       text-[9px] uppercase tracking-wider text-muted-foreground/35
Numero com display:   font-display text-2xl font-bold tabular-nums
Numero tabular:       tabular-nums (em qualquer numero alinhado)
Texto truncado:       truncate (single line), line-clamp-2 (multi)
```

### 3.4 Regras Criticas

- **Minimo body text**: `text-sm` (14px) em desktop, `text-xs` (12px) em mobile
- **Numeros financeiros**: Sempre `tabular-nums` para alinhamento
- **font-display**: Classe customizada para KPIs (peso pesado para numeros grandes)
- **tracking-tight**: Apenas em titulos, nunca em corpo
- **tracking-wider**: Apenas em labels uppercase micro

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
KPI:         0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)
Widget:      0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)
KPI Hover:   0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)
Widget Hover:0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)
Ambient:     0 20px 40px rgba(0,0,0,0.08)
Purple Glow: 0 0 30px rgba(132,44,211,0.1)
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
Muito sutil:     text-muted-foreground/30
Fantasma:        text-muted-foreground/20
Primary:         text-primary
Semantico:       text-destructive, text-success, text-warning, text-info
Dinamico:        style={{ color }} (por config)
```

---

## 8. Componentes Primitivos

### 8.1 GlassPanel (Container Base)

O bloco fundamental de construcao visual do Zattar OS.

| Depth | Classes | Uso |
|-------|---------|-----|
| 1 (default) | `glass-widget bg-transparent rounded-2xl border border-border/20` | Containers de widget |
| 2 | `glass-kpi bg-transparent rounded-2xl border border-border/30` | KPI cards, stats |
| 3 | `bg-primary/[0.04] backdrop-blur-xl rounded-2xl border border-primary/10` | Destaque primary |

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
Tags: text-[9px] bg-primary/[0.05] text-primary/50
Footer: border-t border-border/10
Hover: hover:scale-[1.01] transition-all duration-200
```

**Card Kanban (ContratoCard):**
```
GlassPanel + p-3
Client: text-[11px] font-semibold truncate leading-tight
Valor: text-[11px] font-bold
Dias: text-[9px]
Tags: text-[8px]
Stuck (30+ dias): ring-1 ring-warning/20
Bottom accent bar: h-[0.5px]
```

**Card de Lista (EntityListRow / ContratoListRow):**
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
Numero: font-display text-lg font-bold tabular-nums
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
Tipos: warning | info | success
Container: rounded-lg p-3 border-l-[3px]
Icone: size-4
Texto: text-sm
```

---

## 9. Patterns de Pagina

### 9.1 Header de Pagina

```
Layout: flex items-end justify-between gap-4
Titulo: font-heading text-2xl font-semibold tracking-tight
Subtitulo: text-sm text-muted-foreground/60 mt-0.5
Acoes: flex items-center gap-2
```

### 9.2 Modos de Visualizacao

Tres modos padrao disponíveis nas paginas de listagem:

| Modo | Descricao | Componente |
|------|-----------|------------|
| **Grid** | Cards em grid responsivo | EntityCard / ContratoCard |
| **List** | Rows compactos | EntityListRow / ContratoListRow |
| **Pipeline/Kanban** | Colunas com drag-drop | KanbanColumn + cards |

### 9.3 Pipeline Funnel

```
Container: GlassPanel p-5 flex gap-4
Stage card: flex-1 flex flex-col items-center gap-2
Heading: text-[10px] text-muted-foreground/50 uppercase tracking-wider
Count: font-display text-2xl font-bold
Bar: h-3 rounded-full, opacity 0.6, transition-all duration-700
Conversion rates:
  70%+: text-success/60
  50-70%: text-warning/60
  <50%: text-destructive/60
```

### 9.4 Kanban Column

```
Header: border-b-2 {stage.color}
Label: font-heading text-xs font-semibold
Badge count: text-[10px] px-1.5 py-0.5 rounded-full bg-border/10
Body: flex flex-col gap-2
Width: min-w-[260px] max-w-60 / sm:min-w-70 sm:max-w-70
Empty: py-8 text-center text-[10px] text-muted-foreground/25
```

### 9.5 Data Table (DataShell)

Padrao **OBRIGATORIO** para todas as listagens tabulares:

```
<DataShell header={<DataTableToolbar />} footer={<DataPagination />}>
  <DataTable data={data} columns={columns} />
</DataShell>
```

- Toolbar: h-9, search com debounce 500ms
- Tabela: rounded-md border bg-card
- Paginacao: 0-based no UI, 1-based na API

### 9.6 Workflow Steps (Assinatura Digital)

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

### 9.7 Upload Dropzone

```
Empty: border-dashed border-border bg-muted/30
Active: scale-[1.02] border-primary bg-primary/10
Error: border-destructive bg-destructive/5
With file: border-primary/50 bg-primary/5
Icon: size-12 + ping animation no hover
```

### 9.8 Empty States

```
Container: col-span-full flex flex-col items-center justify-center py-16 text-center
Icone: size-8 text-muted-foreground/20 mb-3
Titulo: text-sm font-medium text-muted-foreground/50
Subtitulo: text-xs text-muted-foreground/30
```

### 9.9 Skeleton Loading

```
Card: rounded-2xl border border-border/20 glass-widget bg-transparent p-4 animate-pulse
Placeholder: bg-muted-foreground/10 rounded
Placeholder subtle: bg-muted-foreground/8
```

---

## 10. Animacoes e Transicoes

### 10.1 Escala de Duracao

| Nome | Duracao | Uso |
|------|---------|-----|
| Fast | `150ms` | Hover de botao, toggle |
| Normal | `200ms` | Maioria das interacoes |
| Slow | `300ms` | Abertura de panels, glass transitions |
| Chart | `500ms` | Barras de graficos, progress |
| Long | `700ms` | Funnel bars, gauge meters |
| Count | `1200ms` | AnimatedNumber |

### 10.2 Propriedades Animaveis

```
Padrao:    transition-all duration-200
Cores:     transition-colors duration-200
Transform: transition-transform duration-200
Opacity:   transition-opacity duration-200
```

### 10.3 Easing

- **Padrao**: `ease-in-out` (a maioria)
- **Progress**: `ease-out` (barras de progresso)
- **Counting**: `cubic-out` (1 - Math.pow(1 - progress, 3))

### 10.4 Hover Effects

```
Card scale:        hover:scale-[1.01]
Card shadow:       hover:shadow-md
Background:        hover:bg-white/4 (sutil)
Background forte:  hover:bg-muted/50
Opacity reveal:    opacity-0 group-hover:opacity-100
Icon scale:        group-hover:scale-110
```

### 10.5 Regras

- Sempre respeitar `prefers-reduced-motion`
- Nunca animar `width`, `height`, `top`, `left` — usar `transform` e `opacity`
- Drag overlay: `opacity-95 shadow-lg rotate-1`
- Loading: `animate-pulse` para skeletons, `animate-spin` para spinners
- Ping: `animate-ping` apenas em indicadores de foco critico

---

## 11. Responsividade

### 11.1 Breakpoints

| Prefixo | Largura | Dispositivo |
|---------|---------|-------------|
| (default) | < 640px | Mobile |
| `sm:` | >= 640px | Mobile landscape |
| `md:` | >= 768px | Tablet |
| `lg:` | >= 1024px | Desktop |
| `xl:` | >= 1280px | Desktop largo |
| `2xl:` | >= 1536px | Ultra wide |

### 11.2 Patterns Responsivos Consolidados

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

## 12. Acessibilidade

### 12.1 Contraste

- Texto normal: minimo 4.5:1 ratio
- Texto grande: minimo 3:1 ratio
- `text-muted-foreground` (#6b6b6b) em `--background` (#fafafa) = 5.1:1 (OK)
- NUNCA usar `text-muted-foreground/30` para texto legivel — apenas decorativo

### 12.2 Interacao

- Touch targets: minimo 44x44px
- Focus visible: `focus-visible:ring-2 focus-visible:ring-ring`
- Todos clicaveis: `cursor-pointer`
- `aria-label` em botoes icon-only
- `sr-only` para texto acessivel escondido
- Tab order segue ordem visual

### 12.3 Motion

- Sempre verificar `prefers-reduced-motion`
- Fornecer alternativa estatica para animacoes

---

## 13. Badges Semanticos

### 13.1 Sistema

Nunca hardcodar cores de badges. Usar `getSemanticBadgeVariant(category, value)`.

### 13.2 Categorias Mapeadas

| Categoria | Exemplos | Funcao |
|-----------|----------|--------|
| `tribunal` | TRT1, TRT2, TST, STJ | Cores alternadas por tribunal |
| `status` | ATIVO, SUSPENSO, ARQUIVADO | Semantica por estado |
| `grau` | 1o_GRAU, 2o_GRAU, TST | Por instancia judicial |
| `parte` | PERITO, TESTEMUNHA, MINISTERIO | Por papel processual |
| `polo` | ATIVO, PASSIVO, AUTOR, REU | Por polo processual |

### 13.3 Tones

| Tone | Estilo | Uso |
|------|--------|-----|
| `soft` | Background claro + texto colorido | Dentro de cards, tabelas (padrao) |
| `solid` | Background forte + texto branco | Destaque, headers |

---

## 14. Anti-Patterns (NUNCA fazer)

| Anti-Pattern | Correto |
|--------------|---------|
| Emojis como icones UI | SVG icons do Lucide |
| `shadow-xl` | `shadow-lg` no maximo |
| Hardcodar cores de badge | `getSemanticBadgeVariant()` |
| `bg-white/10` em light mode | `bg-white/55` minimo |
| Fontes hardcoded | CSS variables (`font-heading`, `font-sans`) |
| Scale transforms em hover que quebram layout | `hover:scale-[1.01]` maximo, com `transition-all` |
| Misturar bibliotecas de icones | Apenas Lucide React |
| `z-index` arbitrario | Usar escala definida (10, 20, 30, 40, 50) |
| Animar width/height | Usar transform/opacity |
| Badges fake (ISO, SOC2, versoes) | Design genuino com personalidade |
| `text-gray-400` em light mode | `text-muted-foreground/50` minimo |
| Criar helpers para operacoes unicas | Codigo direto sem abstracao prematura |

---

## 15. Checklist Pre-Entrega

### Visual
- [ ] Sem emojis como icones (apenas Lucide SVG)
- [ ] Todas as cores via tokens (CSS variables)
- [ ] Hover states nao causam layout shift
- [ ] Glass elements visiveis em light mode

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
src/lib/design-system/
  tokens.ts          - Tokens fundamentais (cores, spacing, tipografia)
  variants.ts        - Mapeamentos semanticos de badges (500+ linhas)
  utils.ts           - Formatadores brasileiros (moeda, CPF, CNPJ, data)
  index.ts           - Barrel export

src/app/globals.css  - CSS variables (light/dark, 520+ linhas)
tailwind.config.ts   - Theme extends, cores customizadas, fontes

src/components/
  ui/                - 104+ componentes shadcn/ui (new-york style)
  shared/            - Patterns obrigatorios (PageShell, DataShell, DialogFormShell)
  dashboard/         - Primitivos CRM (EntityCard, PulseStrip, TabPills)

src/app/app/dashboard/mock/widgets/
  primitives.tsx     - Primitivos visuais (GlassPanel, Sparkline, charts mini)
```
