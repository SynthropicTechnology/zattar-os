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
        'shrink-0 border-t border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-xl',
        className,
      )}
      style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-2xl items-stretch gap-3 px-6 py-5 sm:items-center sm:px-10',
          showPrevious ? 'justify-between' : 'justify-end',
        )}
      >
        {showPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading}
            className="h-12 flex-1 gap-1 sm:flex-initial sm:min-w-28 cursor-pointer border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-sm hover:bg-surface-container-lowest hover:border-outline-variant active:scale-[0.98] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {previousLabel}
          </Button>
        )}
        {showNext && (
          <Button
            type={formId ? 'submit' : 'button'}
            form={formId}
            onClick={formId ? undefined : onNext}
            disabled={isNextDisabled || isLoading}
            className="h-12 flex-1 gap-1 sm:flex-initial sm:min-w-40 cursor-pointer active:scale-[0.98] transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  )
}
