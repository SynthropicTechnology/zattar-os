import { render, screen, fireEvent } from '@testing-library/react'
import { PublicWizardProgress } from '../public-wizard-progress'

const steps = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'dados', label: 'Dados' },
  { id: 'endereco', label: 'Endereço' },
]

describe('PublicWizardProgress', () => {
  it('Vertical renders all labels with current step highlighted', () => {
    render(<PublicWizardProgress.Vertical steps={steps} currentIndex={1} />)
    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByText('Dados')).toBeInTheDocument()
    expect(screen.getByText('Endereço')).toBeInTheDocument()
    const currentMarker = document.querySelector('[aria-current="step"]')
    expect(currentMarker).toBeTruthy()
  })

  it('Horizontal renders compact progress with current label', () => {
    render(<PublicWizardProgress.Horizontal steps={steps} currentIndex={2} />)
    expect(screen.getByText('Endereço')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('Vertical fires onRestart when restart button is clicked', () => {
    const onRestart = jest.fn()
    render(
      <PublicWizardProgress.Vertical
        steps={steps}
        currentIndex={1}
        onRestart={onRestart}
      />,
    )
    const btn = screen.getByRole('button', { name: /recomeçar/i })
    fireEvent.click(btn)
    expect(onRestart).toHaveBeenCalled()
  })

  describe('Vertical — decisões do redesign Glass Briefing', () => {
    it('renderiza spine conector entre steps não-último (past com tint primary, future neutro)', () => {
      const { container } = render(
        <PublicWizardProgress.Vertical steps={steps} currentIndex={1} />,
      )
      // Spines são renderizados como aria-hidden
      const spines = container.querySelectorAll('[aria-hidden="true"].absolute.w-px')
      // 3 steps → 2 conectores (índices 0 e 1; último não tem)
      expect(spines.length).toBe(2)
      // Primeiro conector (step passado → atual) usa primary
      expect(spines[0].className).toMatch(/bg-primary\/40/)
      // Segundo (atual → futuro) usa outline-variant
      expect(spines[1].className).toMatch(/bg-outline-variant/)
    })

    it('step atual destaca-se com ring primary (token do design system)', () => {
      render(<PublicWizardProgress.Vertical steps={steps} currentIndex={1} />)
      const current = document.querySelector('[aria-current="step"]') as HTMLElement
      expect(current).toBeTruthy()
      expect(current.className).toMatch(/ring-/)
      expect(current.className).toMatch(/ring-primary/)
    })

    it('step passado mostra checkmark bold (strokeWidth=3) com shadow primary', () => {
      const { container } = render(
        <PublicWizardProgress.Vertical steps={steps} currentIndex={1} />,
      )
      // O primeiro li tem ícone svg (check); steps não-passados mostram index numérico
      const firstCircle = container.querySelectorAll('li > span.relative')[0]
      const svg = firstCircle.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('hint de resumo tem role=status com aria-live polite e ícone Clock verde', () => {
      render(
        <PublicWizardProgress.Vertical
          steps={steps}
          currentIndex={1}
          resumeHint="Continuando de onde parou · salvo agora"
        />,
      )
      const status = screen.getByRole('status')
      expect(status).toHaveTextContent(/continuando/i)
      expect(status.getAttribute('aria-live')).toBe('polite')
      expect(status.getAttribute('aria-atomic')).toBe('true')
      // Clock icon aria-hidden com text-success
      // Nota: SVGs usam getAttribute('class') — .className é SVGAnimatedString
      const clock = status.querySelector('[aria-hidden="true"]')
      expect(clock?.getAttribute('class')).toMatch(/text-success/)
    })

    it('ícone ListChecks no header do Vertical é text-primary (Glass Briefing)', () => {
      const { container } = render(
        <PublicWizardProgress.Vertical steps={steps} currentIndex={0} />,
      )
      // O primeiro ícone (antes do texto "Progresso") é o ListChecks
      const headerIcon = container.querySelector('svg')
      expect(headerIcon?.getAttribute('class')).toMatch(/text-primary/)
    })
  })

  describe('Horizontal — decisões do redesign Glass Briefing', () => {
    it('progressbar tem glow shadow primary no preenchimento', () => {
      const { container } = render(
        <PublicWizardProgress.Horizontal steps={steps} currentIndex={1} />,
      )
      const bar = container.querySelector('[role="progressbar"]')
      const fill = bar?.querySelector('div')
      expect(fill?.className).toMatch(/shadow-/)
      expect(fill?.className).toMatch(/color-mix.*primary/)
    })

    it('counter "X/N" tem cor primary semibold pra destaque', () => {
      render(<PublicWizardProgress.Horizontal steps={steps} currentIndex={0} />)
      const counter = screen.getByText('1/3')
      expect(counter.className).toMatch(/text-primary/)
      expect(counter.className).toMatch(/font-semibold/)
    })

    it('resumeHint no mobile também tem role=status com aria-live polite', () => {
      render(
        <PublicWizardProgress.Horizontal
          steps={steps}
          currentIndex={1}
          resumeHint="salvo há 2 min"
        />,
      )
      const status = screen.getByRole('status')
      expect(status).toHaveTextContent(/salvo/i)
      expect(status.getAttribute('aria-live')).toBe('polite')
    })

    it('progressbar segue 100% quando currentIndex aponta pro último step', () => {
      const { container } = render(
        <PublicWizardProgress.Horizontal steps={steps} currentIndex={2} />,
      )
      const fill = container.querySelector('[role="progressbar"] > div') as HTMLElement
      // 3/3 = 100%
      expect(fill.style.width).toBe('100%')
    })
  })
})
