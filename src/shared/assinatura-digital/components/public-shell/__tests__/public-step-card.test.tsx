import { render, screen } from '@testing-library/react'
import { PublicStepCard } from '../public-step-card'

describe('PublicStepCard', () => {
  it('renders title and children', () => {
    render(
      <PublicStepCard title="Identificação">
        <input data-testid="cpf" />
      </PublicStepCard>,
    )
    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByTestId('cpf')).toBeInTheDocument()
  })

  it('renders chip when provided', () => {
    render(
      <PublicStepCard title="Assinar" chip="Última etapa">
        <div />
      </PublicStepCard>,
    )
    expect(screen.getByText('Última etapa')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <PublicStepCard title="X" description="Texto de apoio">
        <div />
      </PublicStepCard>,
    )
    expect(screen.getByText('Texto de apoio')).toBeInTheDocument()
  })
})
