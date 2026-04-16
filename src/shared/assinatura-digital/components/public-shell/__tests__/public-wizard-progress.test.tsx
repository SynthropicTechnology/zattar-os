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
})
