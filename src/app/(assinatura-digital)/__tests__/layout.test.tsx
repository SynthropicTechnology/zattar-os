import { render } from '@testing-library/react'
import PublicRouteLayout from '../layout'

describe('PublicRouteLayout', () => {
  it('wraps children with a light-theme enforcement script', () => {
    const { container } = render(
      <PublicRouteLayout>
        <div data-testid="public-child">hello</div>
      </PublicRouteLayout>,
    )
    expect(container.querySelector('[data-testid="public-child"]')).toBeTruthy()
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    expect(script).toBeTruthy()
  })

  it('script body performs the four theme-enforcement operations', () => {
    const { container } = render(
      <PublicRouteLayout>
        <div />
      </PublicRouteLayout>,
    )
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    const code = script?.innerHTML ?? ''
    expect(code).toContain("classList.remove('dark')")
    expect(code).toContain("classList.add('light')")
    expect(code).toContain("setAttribute('data-theme', 'light')")
    expect(code).toContain("colorScheme = 'light'")
  })
})
