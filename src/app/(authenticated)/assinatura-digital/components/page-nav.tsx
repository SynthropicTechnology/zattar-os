'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSignature, LayoutTemplate, ClipboardList, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Prefixo de rota que marca a tab como ativa (inclusivo) */
  match: string;
}

const TABS: readonly TabItem[] = [
  {
    href: '/app/assinatura-digital/documentos/lista',
    label: 'Documentos',
    icon: FileSignature,
    match: '/app/assinatura-digital/documentos',
  },
  {
    href: '/app/assinatura-digital/templates',
    label: 'Templates',
    icon: LayoutTemplate,
    match: '/app/assinatura-digital/templates',
  },
  {
    href: '/app/assinatura-digital/formularios',
    label: 'Formulários',
    icon: ClipboardList,
    match: '/app/assinatura-digital/formularios',
  },
  {
    href: '/app/assinatura-digital/segmentos',
    label: 'Segmentos',
    icon: Tags,
    match: '/app/assinatura-digital/segmentos',
  },
] as const;

/**
 * Navegação entre as 4 superfícies do módulo Assinatura Digital.
 * Segue o padrão "glass pill bar" do Design System Glass Briefing.
 */
export function AssinaturaDigitalPageNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Navegação do módulo Assinatura Digital"
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border border-border/40 bg-card/60 p-1',
        'backdrop-blur-xl',
      )}
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = pathname.startsWith(match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
