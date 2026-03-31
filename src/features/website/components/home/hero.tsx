import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden">
      {/* Video Background (Cloudflare Stream) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <iframe
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none"
          style={{
            width: "max(100%, 177.78vh)",
            height: "max(100%, 56.25vw)",
          }}
          src="https://customer-lvnfk43x7eec1csc.cloudflarestream.com/500dc4de24fbf5ec2457f4779c4faded/iframe?muted=true&loop=true&autoplay=true&controls=false"
          allow="autoplay; fullscreen"
          title="Video de fundo"
        />
      </div>

      {/* Dark Overlay for text contrast */}
      <div className="absolute inset-0 z-1 bg-black/60" />

      {/* Content */}
      <div className="container mx-auto px-5 sm:px-6 md:px-8 z-10 text-center relative pt-20 md:pt-0">
        <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white font-label text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
          A Nova Era da Advocacia Trabalhista
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold font-headline leading-[0.95] tracking-tighter mb-6 md:mb-8 text-white">
          Justiça para <br />
          <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
            quem trabalha.
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Unimos tecnologia de ponta e expertise jurídica para garantir que seus
          direitos sejam respeitados com a velocidade que o mundo moderno exige.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/contato"
            className="bg-primary text-on-primary-fixed px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 group"
          >
            Fale com um Especialista
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#solucoes"
            className="border border-white/50 bg-white/5 backdrop-blur-sm text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-white/15 hover:border-white/70 transition-all flex items-center justify-center"
          >
            Nossas Soluções
          </Link>
        </div>
      </div>
    </section>
  );
}
