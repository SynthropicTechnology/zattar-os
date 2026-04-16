'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PublicStepFooterProps {
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  hidePrevious?: boolean
  hideNext?: boolean
  /** Quando set, botão Continuar vira type="submit" com esse form id. */
  formId?: string
  className?: string
}

export function PublicStepFooter({
  onPrevious,
  onNext,
  nextLabel = 'Continuar',
  previousLabel = 'Voltar',
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  hidePrevious = false,
  hideNext = false,
  formId,
  className,
}: PublicStepFooterProps) {
  const showPrevious = !hidePrevious && !!onPrevious
  const showNext = !hideNext

  return (
    <footer
      className={cn(
        'shrink-0 bg-surface-container-lowest/60 backdrop-blur-xl shadow-[0_-1px_0_0_color-mix(in_oklch,var(--outline-variant)_25%,transparent),0_-4px_32px_-8px_color-mix(in_oklch,black_5%,transparent)] dark:shadow-[0_-1px_0_0_color-mix(in_oklch,var(--outline-variant)_30%,transparent),0_-4px_32px_-8px_color-mix(in_oklch,black_50%,transparent)]',
        className,
      )}
      style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl items-stretch gap-3 px-4 py-4 sm:items-center sm:px-8',
          showPrevious ? 'justify-between' : 'justify-end',
        )}
      >
        {showPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading}
            className="h-12 flex-1 sm:flex-initial sm:min-w-28 cursor-pointer border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-sm hover:bg-surface-container-lowest hover:border-outline-variant active:scale-95"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {previousLabel}
          </Button>
        )}
        {showNext && (
          <Button
            type={formId ? 'submit' : 'button'}
            form={formId}
            onClick={formId ? undefined : onNext}
            disabled={isNextDisabled || isLoading}
            className="h-12 flex-1 sm:flex-initial sm:min-w-40 cursor-pointer shadow-[0_1px_2px_0_color-mix(in_oklch,black_8%,transparent),0_4px_16px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)] hover:shadow-[0_2px_4px_0_color-mix(in_oklch,black_10%,transparent),0_6px_24px_-4px_color-mix(in_oklch,var(--primary)_45%,transparent)] dark:shadow-[0_1px_2px_0_color-mix(in_oklch,black_40%,transparent),0_4px_20px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)] dark:hover:shadow-[0_2px_4px_0_color-mix(in_oklch,black_50%,transparent),0_6px_28px_-4px_color-mix(in_oklch,var(--primary)_65%,transparent)] active:scale-95 transition-shadow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  )
}
