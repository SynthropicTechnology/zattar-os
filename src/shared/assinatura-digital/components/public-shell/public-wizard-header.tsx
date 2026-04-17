'use client'

import { FileSignature } from 'lucide-react'
import { BrandMark } from '@/components/shared/brand-mark'
import { Text } from '@/components/ui/typography'

export function PublicWizardHeader() {
  return (
    <header className="shrink-0 border-b border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6 sm:px-8">
        <div className="flex flex-1 items-center sm:flex-initial sm:justify-start">
          <BrandMark variant="auto" size="md" priority />
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          <FileSignature className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          <Text variant="meta-label" className="text-muted-foreground">
            Assinatura Digital
          </Text>
        </div>
      </div>
    </header>
  )
}
