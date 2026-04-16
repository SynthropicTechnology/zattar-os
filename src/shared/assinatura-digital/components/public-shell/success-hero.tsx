'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface SuccessHeroProps {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function SuccessHero({ title, subtitle, children, className }: SuccessHeroProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <div
        className="flex h-18 w-18 items-center justify-center rounded-full bg-linear-to-br from-success to-success/80 text-success-foreground"
        style={{
          boxShadow:
            '0 12px 32px -8px color-mix(in oklch, var(--success) 40%, transparent), 0 0 0 6px color-mix(in oklch, var(--success) 10%, transparent)',
        }}
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <div className="space-y-1">
        <Heading level="section" className="font-display text-2xl tracking-tight">
          {title}
        </Heading>
        {subtitle && (
          <Text variant="caption" className="text-muted-foreground">
            {subtitle}
          </Text>
        )}
      </div>
      {children && <div className="w-full">{children}</div>}
    </div>
  )
}
