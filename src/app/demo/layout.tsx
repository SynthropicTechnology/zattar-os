import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo | Zattar OS',
  description: 'Páginas de demonstração',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
