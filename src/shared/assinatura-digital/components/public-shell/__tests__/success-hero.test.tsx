import { render, screen } from '@testing-library/react'
import { SuccessHero } from '../success-hero'

describe('SuccessHero', () => {
  it('renders title and subtitle', () => {
    render(<SuccessHero title="Tudo pronto!" subtitle="Documento assinado com sucesso." />)
    expect(screen.getByText('Tudo pronto!')).toBeInTheDocument()
    expect(screen.getByText('Documento assinado com sucesso.')).toBeInTheDocument()
  })

  it('renders children slot', () => {
    render(
      <SuccessHero title="x">
        <div data-testid="slot">docs</div>
      </SuccessHero>,
    )
    expect(screen.getByTestId('slot')).toBeInTheDocument()
  })
})
