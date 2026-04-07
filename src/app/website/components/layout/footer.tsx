import Link from "next/link";
import Image from "next/image";
import {
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Heart,
} from "lucide-react";

const siteLinks = [
  { href: "#solucoes", label: "Soluções" },
  { href: "/expertise", label: "Especialidades" },
  { href: "/servicos", label: "Serviços" },
  { href: "/insights", label: "Insights" },
  { href: "/faq", label: "Perguntas Frequentes" },
];

const portalLinks = [
  { href: "/portal", label: "Acesso ao Portal" },
  { href: "/login", label: "ZattarOS" },
  { href: "/contato", label: "Fale Conosco" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/zattar.advogados/",
    label: "Instagram Zattar Advogados",
    icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/company/zattaradvogados",
    label: "LinkedIn Zattar Advogados",
    icon: Linkedin,
  },
  {
    href: "https://www.facebook.com/share/14Qyx3EPgxy/",
    label: "Facebook Zattar Advogados",
    icon: Facebook,
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* ─── Zona 1: Closing Statement ─── */}
      <div className="relative bg-surface-container-low border-t border-white/5">
        <div className="absolute inset-0 bg-primary/3 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-extrabold tracking-tighter leading-[1.05] mb-4 md:mb-6">
              Pronto para defender{" "}
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                seus direitos?
              </span>
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto">
              Cada dia sem ação é um direito que pode prescrever. Fale com quem
              une tecnologia e experiência para acelerar sua causa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/contato"
                className="bg-primary text-on-primary-fixed px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:brightness-110 transition-all flex items-center gap-2 group"
              >
                Fale com um Especialista
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+5531984382217"
                className="text-on-surface-variant hover:text-on-surface transition-colors font-bold text-base sm:text-lg flex items-center gap-2"
              >
                <Phone className="w-5 h-5 text-primary" />
                (31) 98438-2217
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zona 2: Footer Principal ─── */}
      <div className="bg-surface-container-lowest border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 pr-0 lg:pr-8">
              <Link
                href="/"
                className="relative block w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 mb-5 md:mb-6 border-none outline-none"
              >
                <Image
                  src="/logos/logo-small-light.svg"
                  alt="Logo Zattar Advogados"
                  fill
                  className="object-contain object-left dark:hidden"
                />
                <Image
                  src="/logos/logo-small-dark.svg"
                  alt="Logo Zattar Advogados"
                  fill
                  className="object-contain object-left hidden dark:block"
                />
              </Link>
              <p className="text-on-surface-variant font-sans text-sm antialiased leading-relaxed mb-6 max-w-xs">
                Tecnologia e estratégia jurídica a favor de quem trabalha.
                Advocacia trabalhista com precisão digital.
              </p>
              <div className="flex gap-3">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all duration-200"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links + Contato */}
            <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
              {/* Navegação */}
              <div className="lg:col-span-4">
                <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-5 tracking-wide text-sm">
                  Navegação
                </h5>
                <ul className="space-y-3">
                  {siteLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Portal */}
              <div className="lg:col-span-3">
                <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-5 tracking-wide text-sm">
                  Portal
                </h5>
                <ul className="space-y-3">
                  {portalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contato — visualmente destacado */}
              <div className="col-span-2 lg:col-span-5">
                <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-5 tracking-wide text-sm">
                  Contato
                </h5>
                <div className="space-y-4 text-on-surface-variant font-sans text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="leading-relaxed">
                      <span className="text-on-surface font-medium block mb-0.5">
                        Belo Horizonte
                      </span>
                      Rua dos Inconfidentes, 911 — 7º andar
                      <br />
                      Savassi · CEP 30140-120
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <a
                      href="mailto:contato@zattaradvogados.com"
                      className="hover:text-primary transition-colors"
                    >
                      contato@zattaradvogados.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <a
                      href="tel:+5531984382217"
                      className="hover:text-primary transition-colors font-medium text-on-surface"
                    >
                      (31) 98438-2217
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zona 3: Bottom Bar ─── */}
      <div className="border-t border-white/5 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-4 md:py-5 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-on-surface-variant/50 font-sans text-xs text-center md:text-left">
            © {new Date().getFullYear()} Zattar Advogados · OAB/MG 128.404 ·
            Feito com{" "}
            <Heart className="inline w-3 h-3 text-destructive fill-destructive animate-pulse" />{" "}
            pela{" "}
            <a
              href="https://synthropic.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-surface-variant transition-colors duration-200 underline underline-offset-2"
            >
              Synthropic
            </a>
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/politica-de-privacidade"
              className="text-on-surface-variant/50 hover:text-on-surface-variant transition-colors duration-200 font-sans text-xs"
            >
              Política de Privacidade
            </Link>
            <span className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
            <Link
              href="/termos-de-uso"
              className="text-on-surface-variant/50 hover:text-on-surface-variant transition-colors duration-200 font-sans text-xs"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
