import { render } from '@testing-library/react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'

describe('AmbientBackdrop', () => {
  it('renders with default tint (primary)', () => {
    const { container } = render(<AmbientBackdrop />)
    const blobs = container.querySelectorAll('.bg-primary')
    expect(blobs.length).toBeGreaterThan(0)
  })

  it('applies success tint when tint="success"', () => {
    const { container } = render(<AmbientBackdrop tint="success" />)
    const successBlobs = container.querySelectorAll('.bg-success')
    expect(successBlobs.length).toBeGreaterThan(0)
    const primaryBlobs = container.querySelectorAll('.bg-primary')
    expect(primaryBlobs.length).toBe(0)
  })
})
