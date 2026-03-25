import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex min-h-svh">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-low items-center justify-center p-12 xl:p-20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage:
              'radial-gradient(circle, rgba(38, 38, 38, 0.8) 1px, transparent 1px)',
          }}
          aria-hidden="true"
        />

        <div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/10 blur-[120px]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-secondary-container/5 blur-[120px]"
          aria-hidden="true"
        />

        <div
          className="absolute top-0 right-0 bottom-0 w-px bg-linear-to-b from-transparent via-outline-variant/20 to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-32 w-136 xl:h-36 xl:w-160">
            <Image
              src="/logos/logomarca-dark.svg"
              alt="Zattar Advogados"
              fill
              priority
              className="object-contain object-center"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container flex flex-col justify-center items-center p-8 lg:w-1/2 lg:p-16 relative">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
