"use client";

import { useState } from "react";
import { EditorialHeader, FilterChips, GlassCard } from "@/app/website";
import { ArrowRight, Bookmark, Clock, Mail } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BentoArticle {
  title: string;
  tag: string;
  tagColor: string;
  description?: string;
  href: string;
  colSpan: string;
  large?: boolean;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FILTER_OPTIONS = ["Todos", "Tendências", "Estudos de Caso", "Notícias"];

const featuredArticle = {
  tag: "Direito Digital",
  title: "Privacidade de Dados em Ambientes de Metaverso Corporativo",
  description:
    "Uma análise profunda sobre os desafios jurídicos emergentes na interseção entre o metaverso corporativo e a legislação de proteção de dados. Como as empresas devem se preparar para um cenário regulatório ainda em formação.",
  readingTime: "8 min de leitura",
  href: "/portal/insights/privacidade-metaverso",
};

const bentoArticles: BentoArticle[] = [
  {
    title: "O Impacto da IA na Redação de Petições Iniciais",
    tag: "IA Jurídica",
    tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    description:
      "Como os modelos de linguagem estão redefinindo a rotina dos escritórios de advocacia e quais são os riscos éticos e processuais envolvidos.",
    href: "/portal/insights/ia-peticoes",
    colSpan: "col-span-12 lg:col-span-8",
    large: true,
  },
  {
    title: "Novas Decisões sobre Vínculo Empregatício em Apps",
    tag: "Trabalhista",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    href: "/portal/insights/vinculo-apps",
    colSpan: "col-span-12 lg:col-span-4",
  },
  {
    title: "Reforma Trabalhista: 7 Anos de Impactos Práticos",
    tag: "Legislação",
    tagColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    href: "/portal/insights/reforma-trabalhista-7anos",
    colSpan: "col-span-12 lg:col-span-4",
  },
  {
    title: "Como a Zattar Reduziu Custos em 40% para a TechCorp",
    tag: "Estudo de Caso",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description:
      "Uma análise detalhada do processo de reestruturação jurídica que permitiu à TechCorp Brasil reduzir passivo trabalhista e otimizar contratos de terceirização.",
    href: "/portal/insights/estudo-caso-techcorp",
    colSpan: "col-span-12 lg:col-span-8",
    large: true,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ArticleTag({
  tag,
  colorClass,
}: {
  tag: string;
  colorClass: string;
}) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colorClass}`}
    >
      {tag}
    </span>
  );
}

function BentoCard({ article }: { article: BentoArticle }) {
  return (
    <div
      className={`${article.colSpan} group glass-card rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-white/15 transition-all duration-300 cursor-pointer min-h-48`}
    >
      <div className="flex flex-col gap-3">
        <ArticleTag tag={article.tag} colorClass={article.tagColor} />
        <h3
          className={`font-extrabold font-headline tracking-tighter text-white leading-snug ${
            article.large ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>
        {article.description && article.large && (
          <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
            {article.description}
          </p>
        )}
      </div>

      <Link
        href={article.href}
        className="inline-flex items-center gap-1.5 text-primary text-sm font-bold hover:gap-3 transition-all"
        aria-label={`Ler artigo: ${article.title}`}
      >
        Ler Mais
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Editorial Header                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EditorialHeader
          kicker="INSIGHTS"
          title="Insights."
          gradient
          description="Artigos e análises jurídicas curados para manter você informado."
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Chips                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <FilterChips
          options={FILTER_OPTIONS}
          activeOption={activeFilter}
          onSelect={setActiveFilter}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Featured Hero Article                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-600 delay-100">
        <GlassCard className="gradient-border relative overflow-hidden p-0">
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-violet-500/5" />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-start">
            {/* Content */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <ArticleTag
                  tag={featuredArticle.tag}
                  colorClass="bg-primary/10 text-primary border-primary/20"
                />
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {featuredArticle.readingTime}
                </span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-extrabold font-headline tracking-tighter text-gradient leading-tight max-w-2xl">
                {featuredArticle.title}
              </h2>

              <p className="text-on-surface-variant text-base leading-relaxed max-w-xl">
                {featuredArticle.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={featuredArticle.href}
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 hover:shadow-[0_0_24px_rgba(204,151,255,0.4)] transition-all active:scale-95"
                  aria-label={`Ler artigo completo: ${featuredArticle.title}`}
                >
                  Ler Artigo Completo
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <button
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-on-surface-variant px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
                  aria-label="Salvar artigo nos favoritos"
                >
                  <Bookmark className="w-4 h-4" aria-hidden="true" />
                  Salvar
                </button>
              </div>
            </div>

            {/* Decorative accent badge */}
            <div className="hidden lg:flex flex-col items-center justify-center w-40 h-40 shrink-0 bg-primary/5 border border-primary/10 rounded-2xl">
              <span className="text-4xl font-black font-headline text-primary tabular-nums">
                #1
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1 text-center">
                Mais Lido
                <br />
                da Semana
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bento Grid                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Mais artigos"
        className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
      >
        <div className="grid grid-cols-12 gap-6">
          {bentoArticles.map((article) => (
            <BentoCard key={article.title} article={article} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Newsletter CTA                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Assine a curadoria jurídica"
        className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
      >
        <GlassCard className="gradient-border relative overflow-hidden">
          {/* Ambient glow */}
          <div
            className="absolute -bottom-16 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-[80px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Text */}
            <div className="flex flex-col gap-3 max-w-lg">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-extrabold font-headline tracking-tighter text-white">
                Assine nossa Curadoria Jurídica
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Receba análises semanais sobre direito material e tendências
                jurídicas direto na sua caixa de entrada.
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto min-w-0 lg:min-w-96">
              <label htmlFor="newsletter-email" className="sr-only">
                Seu endereço de e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="seu@email.com"
                className="flex-1 bg-surface-container border border-white/10 text-white placeholder:text-on-surface-variant rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all min-w-0"
                aria-label="Endereço de e-mail para newsletter"
              />
              <button
                className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 hover:shadow-[0_0_20px_rgba(204,151,255,0.35)] transition-all active:scale-95 shrink-0"
                aria-label="Assinar curadoria jurídica"
              >
                Assinar Agora
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  );
}
