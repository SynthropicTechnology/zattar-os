/**
 * Design System Tokens
 *
 * Este arquivo define os tokens fundamentais do Design System Sinesys.
 * Tokens são valores atômicos que servem como base para todas as decisões visuais.
 *
 * @ai-context Use estes tokens para garantir consistência visual em todo o sistema.
 * Nunca use valores de cor hardcoded - sempre importe deste arquivo ou use variantes semânticas.
 */

// =============================================================================
// PALETA DE CORES BASE
// =============================================================================

/**
 * Cores base do sistema usando Tailwind color palette.
 * Estas cores são usadas internamente pelos mapeamentos semânticos.
 */
// COLORS object removido — cores hardcoded (bg-blue-50, text-red-700 etc.)
// violam o Design System. Use CSS variables (bg-primary, text-success, etc.)
// e getSemanticBadgeVariant() de variants.ts para mapeamentos semânticos.

// =============================================================================
// ESPAÇAMENTOS (Grid 4px)
// =============================================================================

/**
 * Sistema de espaçamento baseado em grid de 4px.
 * Use estes valores para margins, paddings e gaps.
 */
export const SPACING = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

/**
 * Classes Tailwind de espaçamento comuns.
 * Use estas classes diretamente nos componentes.
 */
export const SPACING_CLASSES = {
  // Gaps
  gap: {
    xs: 'gap-1',     // 4px
    sm: 'gap-2',     // 8px
    md: 'gap-4',     // 16px
    lg: 'gap-6',     // 24px
    xl: 'gap-8',     // 32px
  },
  // Space-y (vertical)
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  // Space-x (horizontal)
  spaceX: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
  },
  // Padding
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
} as const;

// =============================================================================
// ESPAÇAMENTO SEMÂNTICO (Layout Patterns)
// =============================================================================

/**
 * Tokens de espaçamento semântico para padrões de layout comuns.
 * Use estes tokens para garantir consistência em layouts de página, seção e cards.
 *
 * @ai-context Prefira SPACING_SEMANTIC sobre SPACING_CLASSES para layouts.
 */
export const SPACING_SEMANTIC = {
  // Page Layout - Container principal da página
  page: {
    padding: 'p-4 sm:p-6 lg:p-8',
    paddingX: 'px-4 sm:px-6 lg:px-8',
    paddingY: 'py-4 sm:py-6 lg:py-8',
    gap: 'gap-6 lg:gap-8',
  },

  // Section Layout - Seções dentro de uma página
  section: {
    padding: 'p-4 sm:p-6',
    gap: 'gap-4 sm:gap-6',
    marginTop: 'mt-6 sm:mt-8',
    marginBottom: 'mb-6 sm:mb-8',
  },

  // Card Layout - Cards e containers
  card: {
    padding: 'p-4 sm:p-6',
    paddingCompact: 'p-3 sm:p-4',
    gap: 'gap-3 sm:gap-4',
    headerGap: 'gap-1.5',
  },

  // Inline Elements - Elementos lado a lado
  inline: {
    gap: 'gap-2',
    gapTight: 'gap-1',
    gapLoose: 'gap-3',
  },

  // Stack (vertical) - Elementos empilhados
  stack: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },

  // Form Elements - Formulários
  form: {
    gap: 'gap-4',
    fieldGap: 'gap-2',
    sectionGap: 'gap-6',
    labelGap: 'gap-1.5',
  },

  // Table Layout - Tabelas e data grids
  table: {
    cellPadding: 'px-3 py-2',
    headerPadding: 'px-3 py-3',
    gap: 'gap-4',
  },

  // Dialog/Modal Layout
  dialog: {
    padding: 'p-6',
    gap: 'gap-4',
    footerGap: 'gap-2',
  },
} as const;

// =============================================================================
// TIPOGRAFIA
// =============================================================================

/**
 * Tokens de tipografia.
 * Prefira usar os componentes Typography em vez de classes inline.
 *
 * NOTA: html { font-size: 18px } no globals.css faz com que tamanhos rem
 * sejam maiores que o padrão (ex: text-xs = 13.5px, text-sm = 15.75px).
 * Por isso os tamanhos micro usam px fixo para garantir precisão.
 */
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    heading: 'font-heading',   // Montserrat — títulos, headers
    body: 'font-sans',         // Inter — texto corrido, UI
    mono: 'font-mono',         // Geist Mono — código, números
    display: 'font-display',   // Metrics grandes, KPIs
    headline: 'font-headline', // Manrope — Magistrate AI headlines
  },

  // Font sizes — escala completa incluindo micro sizes
  fontSize: {
    // Micro sizes (px fixo — imunes ao root font-size de 18px)
    '3xs': 'text-[9px]',    //  9px — badges micro, caption mínima
    '2xs': 'text-[10px]',   // 10px — números mono, metadata compacta
    'xs-fixed': 'text-[11px]', // 11px — labels uppercase, metadata
    // Standard sizes (rem — escalam com root)
    xs: 'text-xs',          // 12px (rem) → ~13.5px real
    sm: 'text-sm',          // 14px (rem) → ~15.75px real
    base: 'text-base',      // 16px (rem) → 18px real
    lg: 'text-lg',          // 18px (rem) → ~20.25px real
    xl: 'text-xl',          // 20px (rem) → ~22.5px real
    '2xl': 'text-2xl',      // 24px (rem) → 27px real
    '3xl': 'text-3xl',      // 30px (rem) → ~33.75px real
    '4xl': 'text-4xl',      // 36px (rem) → 40.5px real
  },

  // Font weights
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },

  // Line heights
  lineHeight: {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// =============================================================================
// PADRÕES TIPOGRÁFICOS COMPOSTOS
// =============================================================================

/**
 * Padrões tipográficos recorrentes extraídos de Processos, Audiências, Dashboard e Partes.
 * @deprecated Use typed components from `@/components/ui/typography` instead:
 *   `<Heading level="page">` instead of TEXT_PATTERNS.pageTitle
 *   `<Heading level="widget">` instead of TEXT_PATTERNS.widgetTitle
 *   `<Text variant="kpi-value">` instead of TEXT_PATTERNS.kpiValue
 *   `<Text variant="meta-label">` instead of TEXT_PATTERNS.metaLabel
 *   `<Text variant="mono-num">` instead of TEXT_PATTERNS.monoNum
 *
 * Kept for backwards compatibility. Will be removed in a future version.
 */
export const TEXT_PATTERNS = {
  /**
   * Label metadata — labels de campo em maiúsculas, compactas.
   * Ex: "RESPONSÁVEL", "LOCALIDADE", "TRIBUNAL"
   * CSS class: .text-meta-label
   */
  metaLabel: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',

  /**
   * Números monospace — datas, números de processo, valores tabulares.
   * Ex: "0001234-56.2023.5.01.0001", "15/03/2024"
   * CSS class: .text-mono-num
   */
  monoNum: 'text-[10px] font-mono text-muted-foreground/55 tabular-nums',

  /**
   * Texto micro para badges — texto compacto dentro de badges e tags.
   * Ex: "TRT1", "1º Grau", "Ativo"
   * CSS class: .text-micro-badge
   */
  microBadge: 'text-[9px] font-medium',

  /**
   * Texto micro caption — informações terciárias muito pequenas.
   * Ex: timestamps, contadores secundários
   * CSS class: .text-micro-caption
   */
  microCaption: 'text-[10px] text-muted-foreground/50',

  /**
   * Page title — título principal da página.
   * Ex: "Processos", "Audiências", "Partes"
   * CSS class: .text-page-title  (24px, heading bold)
   */
  pageTitle: 'text-page-title',

  /**
   * Widget title — título de widget/card compacto (dashboard, glass panels).
   * Ex: "Briefing do Dia", "Meu Dia", "Foco Agora"
   * CSS class: .text-widget-title  (14px, heading semibold)
   */
  widgetTitle: 'text-widget-title',

  /**
   * Card title — título de card grande ou painel de detalhe.
   * CSS class: .text-card-title  (18px, heading semibold)
   */
  cardTitle: 'text-card-title',

  /**
   * Widget subtitle — subtítulo compacto abaixo de headers de widget.
   * Ex: "Visão geral — administrador"
   * CSS class: .text-widget-sub  (12px, muted/60)
   */
  widgetSub: 'text-widget-sub',

  /**
   * Valor de KPI grande — métricas de destaque.
   * CSS class: .text-kpi-value  (24px, heading bold tabular-nums)
   */
  kpiValue: 'text-kpi-value',

  /**
   * Tag inline — texto de tag dentro de containers de tags.
   * CSS class: .text-inline-tag
   */
  inlineTag: 'text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50 border border-primary/10',

  /**
   * Tag pill — versão arredondada de tags em detalhe.
   * CSS class: .text-pill-tag
   */
  pillTag: 'text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10',
} as const;

// =============================================================================
// ESCALA DE OPACIDADE
// =============================================================================

/**
 * Escala de opacidade documentada, extraída dos padrões visuais de Processos, Audiências,
 * Dashboard e Partes. Define QUANDO usar cada nível de opacidade.
 *
 * @ai-context Consulte esta escala antes de escolher opacidades para bg, text e border.
 * NUNCA invente opacidades fora desta escala sem justificativa.
 */
export const OPACITY_SCALE = {
  /**
   * Backgrounds primários — escala de ênfase crescente.
   * Use bg-primary/{nível} conforme o destaque desejado.
   */
  primaryBg: {
    subtle: '/3',      // bg-primary/3  — card selecionado (quase imperceptível)
    whisper: '/4',     // bg-primary/4  — insight banners, hover muito sutil
    tint: '/5',        // bg-primary/5  — container de tags, backgrounds leves
    soft: '/6',        // bg-primary/6  — tags pill, badges suaves
    medium: '/8',      // bg-primary/8  — icon containers, backgrounds médios
    strong: '/10',     // bg-primary/10 — icon backgrounds, ênfase clara
    emphasis: '/15',   // bg-primary/15 — hover forte, destaque
  },

  /**
   * Borders — escala de visibilidade.
   * Use border-border/{nível} para controlar a saliência da borda.
   */
  border: {
    ghost: '/10',     // border-border/10 — divisores internos de card, separadores sutis
    subtle: '/20',    // border-border/20 — bordas padrão de glass panels
    light: '/30',     // border-border/30 — glass-kpi borders
    medium: '/40',    // border-border/40 — hover state de borders
    standard: '/50',  // border-border/50 — bordas padrão de Card (shadcn)
  },

  /**
   * Texto — escala de hierarquia visual.
   * Use text-muted-foreground/{nível} para texto secundário/terciário.
   */
  mutedText: {
    ghost: '/40',     // text-muted-foreground/40 — texto quase invisível, dicas
    faint: '/50',     // text-muted-foreground/50 — placeholders, timestamps remotos
    subtle: '/55',    // text-muted-foreground/55 — números mono, dados secundários
    soft: '/60',      // text-muted-foreground/60 — subtítulos de widgets, labels fracos
    standard: '',     // text-muted-foreground    — texto secundário padrão (sem modificador)
  },

  /**
   * Texto primário com opacidade — para elementos que usam a cor primária.
   */
  primaryText: {
    faint: '/50',     // text-primary/50  — tags suaves, ícones de fundo
    soft: '/60',      // text-primary/60  — pill tags, texto de destaque fraco
    medium: '/70',    // text-primary/70  — links suaves, ícones médios
    standard: '',     // text-primary     — texto primário completo
  },
} as const;

// =============================================================================
// LAYOUT DE PÁGINA
// =============================================================================

/**
 * Tokens de layout para containers de página e estruturas recorrentes.
 * Extraídos da arquitetura visual de Processos, Audiências, Dashboard e Partes.
 *
 * @ai-context Use PAGE_LAYOUT para containers de página e panels.
 */
export const PAGE_LAYOUT = {
  /** Container principal da página — limita largura e centraliza */
  container: 'max-w-350 mx-auto',

  /** Espaçamento vertical entre seções da página */
  sectionGap: 'space-y-5',

  /** Padding vertical da página (dentro do shell) */
  pagePadding: 'py-6',

  /** Layout completo da página: container + gap + padding */
  page: 'max-w-350 mx-auto space-y-5 py-6',

  /** Grid de cards responsivo — padrão 1/2/3 colunas */
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',

  /** Layout de duas colunas com panel de detalhe fixo */
  detailLayout: 'grid gap-3 lg:grid-cols-[1fr_380px]',

  /** Panel de detalhe sticky */
  detailPanel: 'sticky top-4 self-start',

  /** Header de página: título + actions */
  pageHeader: 'flex items-start justify-between gap-4',

  /** Toolbar responsiva: empilha em mobile, lado a lado em desktop */
  toolbar: 'flex flex-col sm:flex-row items-start sm:items-center gap-3',
} as const;

// =============================================================================
// GLASS PANEL (Depth System)
// =============================================================================

/**
 * Tokens do sistema de profundidade Glass para panels.
 * GlassPanel usa depth 1-3 para criar hierarquia visual.
 *
 * @ai-context Use GLASS_DEPTH para referência. O componente GlassPanel
 * já aplica estes estilos automaticamente via prop depth.
 *
 * Classe base de todo GlassPanel: rounded-2xl border transition-all duration-300 flex flex-col
 */
export const GLASS_DEPTH = {
  /** Depth 1 — Container padrão (widget). Mais transparente, para containers maiores. */
  1: 'glass-widget bg-transparent border-border/20',

  /** Depth 2 — KPI / card métrico. Mais opaco, melhor legibilidade. */
  2: 'glass-kpi bg-transparent border-border/30',

  /** Depth 3 — Destaque máximo. Background com tint de primary. */
  3: 'bg-primary/[0.04] backdrop-blur-xl border-primary/10',
} as const;

/**
 * Base compartilhada de todo GlassPanel.
 */
export const GLASS_BASE = 'rounded-2xl border transition-all duration-300 flex flex-col' as const;

// =============================================================================
// ICON CONTAINERS
// =============================================================================

/**
 * Padrões de containers de ícones extraídos das páginas atualizadas.
 * Define tamanhos e estilos para ícones dentro de containers coloridos.
 *
 * @ai-context Use ICON_CONTAINER para containers de ícones com background.
 */
export const ICON_CONTAINER = {
  /** Container grande (40px) — cards de processo, entidades */
  lg: 'size-10 rounded-xl flex items-center justify-center shrink-0',

  /** Container médio (32px) — listas, linhas de tabela */
  md: 'size-8 rounded-lg flex items-center justify-center shrink-0',

  /** Container pequeno (24px) — inline, badges */
  sm: 'size-6 rounded-md flex items-center justify-center shrink-0',

  /** Container mínimo (20px) — indicators, dots */
  xs: 'size-5 rounded flex items-center justify-center shrink-0',
} as const;

// =============================================================================
// AVATAR SIZES
// =============================================================================

/**
 * Tamanhos padronizados de avatar.
 */
export const AVATAR_SIZES = {
  xs: 'h-5 w-5',    // 20px — inline em texto
  sm: 'h-6 w-6',    // 24px — listas compactas
  md: 'h-8 w-8',    // 32px — listas normais
  lg: 'size-10',     // 40px — cards, headers
  xl: 'size-12',     // 48px — detail panels
} as const;

// =============================================================================
// SOMBRAS
// =============================================================================

/**
 * Sistema de sombras para elevação.
 * Evite shadow-xl - prefira shadow-lg ou menor.
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  // shadow-xl é proibido pelo design system
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Tokens de border radius.
 */
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Breakpoints responsivos.
 * Use os prefixos do Tailwind (sm:, md:, lg:, xl:, 2xl:).
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// TRANSIÇÕES
// =============================================================================

/**
 * Tokens de transição para animações suaves.
 */
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

/**
 * Sistema de z-index para gerenciar camadas.
 */
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-60',
  tooltip: 'z-70',
} as const;

// =============================================================================
// EXPORTS AGRUPADOS
// =============================================================================

export const TOKENS = {
  spacing: SPACING,
  spacingClasses: SPACING_CLASSES,
  spacingSemantic: SPACING_SEMANTIC,
  typography: TYPOGRAPHY,
  textPatterns: TEXT_PATTERNS,
  opacityScale: OPACITY_SCALE,
  pageLayout: PAGE_LAYOUT,
  glassDepth: GLASS_DEPTH,
  glassBase: GLASS_BASE,
  iconContainer: ICON_CONTAINER,
  avatarSizes: AVATAR_SIZES,
  shadows: SHADOWS,
  radius: RADIUS,
  breakpoints: BREAKPOINTS,
  transitions: TRANSITIONS,
  zIndex: Z_INDEX,
} as const;

export type TokensType = typeof TOKENS;
