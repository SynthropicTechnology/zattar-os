/**
 * DEV LIBRARY — Layout
 * ============================================================================
 * Layout com sidebar de navegação para a biblioteca visual de componentes
 * do Synthropic. Vive sob (dev)/ — não vai pro build de produção.
 *
 * Estrutura: index categorizado (Foundations, Shared, Badges, Portal,
 * Domain Mocks). Cada categoria tem sub-rotas próprias.
 * ============================================================================
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

interface NavSection {
  title: string
  items: Array<{ href: string; label: string; status?: 'new' | 'wip' }>
}

const NAV: NavSection[] = [
  {
    title: 'Foundations',
    items: [
      { href: '/library', label: 'Visão geral' },
      { href: '/library/tokens/colors', label: 'Cores & Tokens' },
      { href: '/library/tokens/semantic-tones', label: 'Semantic Tones', status: 'new' },
      { href: '/library/tokens/palette', label: 'Paleta selecionável' },
      { href: '/library/tokens/event-colors', label: 'Event colors' },
      { href: '/library/tokens/typography', label: 'Tipografia' },
      { href: '/library/tokens/spacing', label: 'Spacing & Radius' },
    ],
  },
  {
    title: 'Visual Diff',
    items: [
      { href: '/library/visual-diff/widgets', label: 'Widgets — Antes vs Depois', status: 'new' },
    ],
  },
  {
    title: 'Shared',
    items: [
      { href: '/library/shared/brand-mark', label: 'BrandMark' },
      { href: '/library/shared/ambient-backdrop', label: 'AmbientBackdrop' },
      { href: '/library/shared/glass-panel', label: 'GlassPanel' },
      { href: '/library/shared/tone-dot', label: 'ToneDot', status: 'new' },
      { href: '/library/shared/page-shell', label: 'PageShell' },
      { href: '/library/shared/data-shell', label: 'DataShell' },
      { href: '/library/shared/dialog-form-shell', label: 'DialogFormShell' },
      { href: '/library/shared/empty-state', label: 'EmptyState' },
    ],
  },
  {
    title: 'Badges',
    items: [
      { href: '/library/badges/all', label: 'Todos os badges' },
      { href: '/library/badges/semantic', label: 'SemanticBadge' },
      { href: '/library/badges/tag', label: 'TagBadge' },
      { href: '/library/badges/portal', label: 'PortalBadge' },
    ],
  },
  {
    title: 'Domain Mocks',
    items: [
      { href: '/library/domain-mocks', label: 'Visão geral dos mocks' },
    ],
  },
]

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 overflow-y-auto border-r border-border bg-surface-container-low p-6 lg:block">
          <Link href="/library" className="block">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
              Synthropic
            </div>
            <div className="font-headline text-lg font-bold tracking-tight">
              Dev Library
            </div>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Catálogo visual de componentes
          </p>

          <nav className="mt-8 space-y-6">
            {NAV.map((section) => (
              <div key={section.title}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                      >
                        <span>{item.label}</span>
                        {item.status === 'new' && (
                          <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">
                            New
                          </span>
                        )}
                        {item.status === 'wip' && (
                          <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning">
                            WIP
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
