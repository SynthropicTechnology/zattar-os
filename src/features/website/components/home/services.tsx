/**
 * Services section — v2 asymmetrical image+text blocks.
 * Three service blocks alternating image-left / text-left layout.
 *
 * Usage:
 *   import { Services } from "@/features/website/components/home/services";
 *   <Services />
 */

import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface OverlayCardProps {
  icon: React.ReactNode;
  label: string;
}

function OverlayCard({ icon, label }: OverlayCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3 border border-white/5">
      <span className="text-primary">{icon}</span>
      <span className="font-sans text-sm font-bold text-white whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

interface ServiceBlockProps {
  /** "image-left" places the image in columns 1–7, text in 8–12. */
  layout: "image-left" | "text-left";
  imageSrc: string;
  imageAlt: string;
  overlayCard: React.ReactNode;
  kicker: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

function ServiceBlock({
  layout,
  imageSrc,
  imageAlt,
  overlayCard,
  kicker,
  title,
  description,
  href,
  ctaLabel,
}: ServiceBlockProps) {
  const imageCol =
    layout === "image-left"
      ? "md:col-span-7 md:order-1"
      : "md:col-span-7 md:order-2";
  const textCol =
    layout === "image-left"
      ? "md:col-span-5 md:order-2"
      : "md:col-span-5 md:order-1";

  return (
    <div className="grid md:grid-cols-12 gap-12 items-center">
      {/* Image column */}
      <div className={`relative ${imageCol}`}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full aspect-video object-cover rounded-2xl grayscale hover:grayscale-0 hover:scale-105 transition-all duration-700"
        />
        {/* Floating overlay card — bottom corner opposite to text side */}
        <div
          className={`absolute bottom-5 ${
            layout === "image-left" ? "right-5" : "left-5"
          }`}
        >
          {overlayCard}
        </div>
      </div>

      {/* Text column */}
      <div className={`flex flex-col gap-6 ${textCol}`}>
        <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
          {kicker}
        </span>
        <h3 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          {title}
        </h3>
        <p className="font-sans text-on-surface-variant text-lg leading-relaxed">
          {description}
        </p>
        <Link
          href={href}
          className="group/link text-primary font-bold flex items-center gap-2 w-fit hover:text-primary-dim transition-colors duration-200"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
}

export function Services() {
  return (
    <section id="solucoes" className="bg-surface py-32">
      <div className="container mx-auto px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="max-w-2xl">
            <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
              Especialidades
            </span>
            <h2 className="font-headline text-4xl md:text-6xl font-bold mt-4 tracking-tight text-white">
              Soluções jurídicas de{" "}
              <span className="text-on-surface-variant">alta precisão.</span>
            </h2>
          </div>
          <p className="font-sans text-on-surface-variant text-lg max-w-sm">
            Focamos na resolução estratégica de conflitos trabalhistas
            utilizando análise de dados e inteligência jurídica.
          </p>
        </div>

        {/* Service blocks */}
        <div className="flex flex-col gap-28">
          {/* Block 1 — Image Left, Text Right */}
          <ServiceBlock
            layout="image-left"
            imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=450&fit=crop"
            imageAlt="Equipe jurídica em reunião de estratégia legal"
            overlayCard={
              <OverlayCard
                icon={<Clock className="w-4 h-4" />}
                label="Análise em 24h"
              />
            }
            kicker="Direito Trabalhista"
            title="Demissão sem justa causa"
            description="Proteção completa dos seus direitos em rescisões contratuais inesperadas ou abusivas. Analisamos cada cláusula para garantir que você receba tudo que é devido por lei."
            href="/expertise"
            ctaLabel="Consultar caso"
          />

          {/* Block 2 — Text Left, Image Right */}
          <ServiceBlock
            layout="text-left"
            imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop"
            imageAlt="Documentos financeiros e análise de verbas rescisórias"
            overlayCard={
              <OverlayCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="R$ 15M+ recuperados"
              />
            }
            kicker="Verbas Trabalhistas"
            title="FGTS e Verbas Rescisórias"
            description="Recuperação integral de depósitos de FGTS, horas extras e verbas rescisórias pendentes. Nossa equipe audita cada período trabalhado para identificar o valor exato do seu direito."
            href="/expertise"
            ctaLabel="Verificar depósitos"
          />

          {/* Block 3 — Image Left, Text Right */}
          <ServiceBlock
            layout="image-left"
            imageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=450&fit=crop"
            imageAlt="Ambiente médico e segurança do trabalho"
            overlayCard={
              <OverlayCard
                icon={<ShieldCheck className="w-4 h-4" />}
                label="98% de êxito"
              />
            }
            kicker="Saúde e Segurança"
            title="Acidentes de Trabalho"
            description="Indenizações justas e suporte completo para doenças ocupacionais e acidentes laborais. Acompanhamos todo o processo, do laudo pericial à homologação judicial."
            href="/expertise"
            ctaLabel="Relatar ocorrência"
          />
        </div>
      </div>
    </section>
  );
}
