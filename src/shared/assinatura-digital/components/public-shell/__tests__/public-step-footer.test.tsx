import { render, screen, fireEvent } from '@testing-library/react'
import { PublicStepFooter } from '../public-step-footer'

describe('PublicStepFooter', () => {
  it('renders both buttons and fires callbacks', () => {
    const onPrevious = jest.fn()
    const onNext = jest.fn()
    render(<PublicStepFooter onPrevious={onPrevious} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onPrevious).toHaveBeenCalled()
    expect(onNext).toHaveBeenCalled()
  })

  it('disables next when isNextDisabled', () => {
    render(<PublicStepFooter onNext={() => {}} isNextDisabled />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('shows Processando… when isLoading', () => {
    render(<PublicStepFooter onNext={() => {}} isLoading />)
    expect(screen.getByText(/processando/i)).toBeInTheDocument()
  })

  it('hides previous when hidePrevious', () => {
    render(<PublicStepFooter onNext={() => {}} hidePrevious />)
    expect(screen.queryByRole('button', { name: /voltar/i })).toBeNull()
  })

  it('uses custom labels', () => {
    render(<PublicStepFooter onNext={() => {}} nextLabel="Finalizar" previousLabel="Atrás" />)
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument()
  })

  it('submits a form when formId is set', () => {
    render(<PublicStepFooter formId="my-form" />)
    const btn = screen.getByRole('button', { name: /continuar/i })
    expect(btn.getAttribute('form')).toBe('my-form')
    expect(btn.getAttribute('type')).toBe('submit')
  })

  describe('decisões do redesign Glass Briefing', () => {
    it('container usa surface-container-lowest com backdrop-blur (não bg-background)', () => {
      const { container } = render(<PublicStepFooter onNext={() => {}} />)
      const footer = container.querySelector('footer') as HTMLElement
      expect(footer.className).toMatch(/bg-surface-container-lowest/)
      expect(footer.className).toMatch(/backdrop-blur-xl/)
      // Não deve usar bg-background (decisão da linha 41 → uniformidade com header/sidebar)
      expect(footer.className).not.toMatch(/bg-background/)
    })

    it('separador via border-t com outline-variant (token do design system)', () => {
      const { container } = render(<PublicStepFooter onNext={() => {}} />)
      const footer = container.querySelector('footer') as HTMLElement
      expect(footer.className).toMatch(/border-t/)
      expect(footer.className).toMatch(/border-outline-variant/)
    })

    it('botões usam flex-1 no mobile (sm:flex-initial no desktop) — evita overflow no iPhone SE', () => {
      render(<PublicStepFooter onPrevious={() => {}} onNext={() => {}} />)
      const next = screen.getByRole('button', { name: /continuar/i })
      const prev = screen.getByRole('button', { name: /voltar/i })
      // Mobile: ambos flex-1 (dividem espaço); desktop: voltam pro min-w fixo
      expect(prev.className).toMatch(/flex-1/)
      expect(prev.className).toMatch(/sm:flex-initial/)
      expect(prev.className).toMatch(/sm:min-w-28/)
      expect(next.className).toMatch(/flex-1/)
      expect(next.className).toMatch(/sm:flex-initial/)
      expect(next.className).toMatch(/sm:min-w-40/)
    })

    it('botão Continuar herda Button default (bg-primary) e mantém altura h-12', () => {
      render(<PublicStepFooter onNext={() => {}} />)
      const next = screen.getByRole('button', { name: /continuar/i })
      expect(next.className).toMatch(/bg-primary/)
      expect(next.className).toMatch(/h-12/)
    })

    it('botão Voltar tem visual glass (surface-container-lowest + backdrop-blur)', () => {
      render(<PublicStepFooter onPrevious={() => {}} onNext={() => {}} />)
      const prev = screen.getByRole('button', { name: /voltar/i })
      expect(prev.className).toMatch(/bg-surface-container-lowest/)
      expect(prev.className).toMatch(/backdrop-blur-sm/)
      expect(prev.className).toMatch(/border-outline-variant/)
    })

    // jsdom rejeita env() no parser CSS e descarta o atributo style inteiro.
    // Esse comportamento (empurrar footer acima do teclado mobile via
    // paddingBottom: env(keyboard-inset-height, 0px)) só é testável em E2E real.
    it.skip('paddingBottom usa env(keyboard-inset-height) — testado em E2E', () => {})

    it('quando só Continuar (sem Voltar), justify-end alinha botão à direita', () => {
      const { container } = render(<PublicStepFooter onNext={() => {}} />)
      // Voltar ausente → flex container deve usar justify-end
      const flexContainer = container.querySelector('.flex.gap-3')
      expect(flexContainer?.className).toMatch(/justify-end/)
      expect(flexContainer?.className).not.toMatch(/justify-between/)
    })

    it('quando ambos botões, justify-between separa Voltar e Continuar', () => {
      const { container } = render(
        <PublicStepFooter onPrevious={() => {}} onNext={() => {}} />,
      )
      const flexContainer = container.querySelector('.flex.gap-3')
      expect(flexContainer?.className).toMatch(/justify-between/)
    })
  })
})
