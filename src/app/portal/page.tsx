import Image from 'next/image'
import { CpfHeroForm } from './feature'

export default function PortalLoginPage() {
  return (
    <div className="dark">
      <div className="relative min-h-svh bg-surface text-on-surface font-sans overflow-hidden selection:bg-primary/30">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-125 h-125 rounded-full bg-primary/20 blur-[120px] opacity-20" />
          <div className="absolute -bottom-[20%] -right-[10%] w-150 h-150 rounded-full bg-primary/10 blur-[120px]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(rgba(204, 151, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div
          className="fixed bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-primary/5 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center px-6 py-6 sm:py-8">
          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="relative h-20 w-72 sm:h-24 sm:w-96">
              <Image
                src="/logos/logomarca-dark.svg"
                alt="Zattar Advogados"
                fill
                priority
                className="object-contain object-center"
              />
            </div>
          </div>

          <CpfHeroForm />
        </main>
      </div>
    </div>
  )
}
