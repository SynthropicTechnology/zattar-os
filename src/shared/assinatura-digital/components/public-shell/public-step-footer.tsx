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
        'shrink-0 border-t border-outline-variant/20 bg-background/60 backdrop-blur-xl',
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
            className="h-12 min-w-28 cursor-pointer active:scale-95"
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
            className="h-12 min-w-40 cursor-pointer active:scale-95"
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
