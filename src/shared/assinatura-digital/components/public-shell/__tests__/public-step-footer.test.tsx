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
})
