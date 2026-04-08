/**
 * DEV LIBRARY — Index
 * ============================================================================
 * Landing da biblioteca visual. Cards categorizados levam para sub-rotas.
 * ============================================================================
 */

import Link from 'next/link'
import {
  Palette,
  Layers,
  Shapes,
  Sparkles,
  Calendar,
  Tag as TagIcon,
} from 'lucide-react'

interface CategoryCard {
  href: string
  icon: typeof Palette
  title: string
  description: string
  count?: string
}

const CATEGORIES: CategoryCard[] = [
  {
    href: '/library/tokens/colors',
    icon: Palette,
    title: 'Foundations',
    description:
      'Tokens semânticos, paleta selecionável, event colors, tipografia, spacing & radius.',
    count: '6 páginas',
  },
  {
    href: '/library/shared/brand-mark',
    icon: Shapes,
    title: 'Shared Components',
    description:
      'Primitivas reutilizáveis: BrandMark, AmbientBackdrop, GlassPanel, PageShell, DataShell, EmptyState.',
    count: '7 componentes',
  },
  {
    href: '/library/badges/all',
    icon: TagIcon,
    title: 'Badges',
    description:
      'SemanticBadge (8 categorias), TagBadge, PortalBadge e wrappers especializados de domínio.',
    count: '12+ variantes',
  },
  {
    href: '/library/domain-mocks',
    icon: Layers,
    title: 'Domain Mocks',
    description:
      'Páginas mock dos módulos do app — calendário, dashboard, audiências, partes, contratos, assinatura digital.',
    count: '17 rotas',
  },
]

export default function LibraryIndexPage() {
  return (
    <div>
      <header className="mb-12 border-b border-border pb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Catálogo visual interno
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Dev Library
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Referência viva do Design System Synthropic. Cada componente exposto
          aqui é a forma <em>canônica</em> de uso — se você precisar de algo
          que não está documentado, prefira{' '}
          <strong className="text-foreground">criar/extender</strong> em vez
          de duplicar.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {cat.count && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    {cat.count}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold tracking-tight">
                  {cat.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-surface-container-low p-6">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Novidades recentes</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">BrandMark</strong> — logo
                reutilizável que substituiu 6 implementações ad-hoc.
              </li>
              <li>
                <strong className="text-foreground">AmbientBackdrop</strong> —
                padrão de hero/landing extraído da página de login do portal.
              </li>
              <li>
                <strong className="text-foreground">--palette-1..18</strong>{' '}
                — paleta canônica para tags, labels e cores escolhidas pelo
                usuário.
              </li>
              <li>
                <strong className="text-foreground">--event-*</strong> —
                tokens semânticos para cores de evento de calendário/agenda.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
