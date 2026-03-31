"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "#solucoes", label: "Soluções" },
  { href: "/expertise", label: "Especialidades" },
  { href: "/insights", label: "Insights" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl rounded-full border border-white/5 bg-surface-container-highest/60 backdrop-blur-xl flex justify-between items-center px-4 sm:px-6 md:px-8 py-2.5 md:py-3 z-50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger className="md:hidden p-2 -ml-1 text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-surface-container-highest border-white/10 w-70">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <Link href="/" className="relative block w-40 h-10 mb-2">
              <Image
                src="/logos/logomarca-dark.svg"
                alt="Logo Zattar Advogados"
                fill
                className="object-contain object-left"
              />
            </Link>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors font-headline tracking-tight py-3 px-3 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto p-4">
            <Link
              href="/portal"
              className="block w-full text-center bg-primary text-on-primary-fixed px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all"
            >
              Acessar Portal
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link href="/" className="relative w-32 sm:w-40 md:w-64 h-8 sm:h-10 md:h-12 flex border-none outline-none">
        <Image
          src="/logos/logomarca-light.svg"
          alt="Logo Zattar Advogados"
          fill
          className="object-contain object-left dark:hidden"
          priority
        />
        <Image
          src="/logos/logomarca-dark.svg"
          alt="Logo Zattar Advogados"
          fill
          className="object-contain object-left hidden dark:block"
          priority
        />
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-300 font-headline tracking-tight hover:text-primary-dim ${
              link.href === "#solucoes"
                ? "text-primary font-bold"
                : "text-on-surface-variant"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CTA button — hidden on very small screens, visible from sm+ */}
      <Link
        href="/portal"
        className="hidden sm:inline-flex bg-primary text-on-primary-fixed px-4 md:px-6 py-2 rounded-full font-bold text-sm md:text-base scale-95 active:scale-90 hover:brightness-110 transition-all"
      >
        Acessar Portal
      </Link>
    </nav>
  );
}
