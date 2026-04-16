'use client'

import { FileSignature } from 'lucide-react'
import { BrandMark } from '@/components/shared/brand-mark'
import { Text } from '@/components/ui/typography'

export function PublicWizardHeader() {
  return (
    <header className="shrink-0 bg-surface-container-lowest/60 backdrop-blur-xl shadow-[0_1px_0_0_color-mix(in_oklch,var(--outline-variant)_25%,transparent)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        {/* Logo: alinhada à esquerda no desktop, centralizada no mobile */}
        <div className="flex flex-1 items-center sm:flex-initial sm:justify-start">
          <BrandMark
            variant="auto"
            size="custom"
            priority
            className="h-8 w-auto sm:h-9"
          />
        </div>

        {/* Contexto discreto à direita no desktop — ajuda a entender "onde estou" */}
        <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          <FileSignature className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} />
          <Text variant="meta-label" className="text-muted-foreground">
            Assinatura Digital
          </Text>
        </div>
      </div>
    </header>
  )
}
