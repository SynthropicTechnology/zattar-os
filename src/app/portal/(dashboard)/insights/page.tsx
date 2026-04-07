"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, Bookmark, Clock } from "lucide-react";
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
    tagColor: "bg-portal-primary-soft text-portal-primary border-portal-primary/20",
    description:
      "Como os modelos de linguagem estão redefinindo a rotina dos escritórios de advocacia e quais são os riscos éticos e processuais envolvidos.",
    href: "/portal/insights/ia-peticoes",
    colSpan: "col-span-12 lg:col-span-8",
    large: true,
  },
  {
    title: "Novas Decisões sobre Vínculo Empregatício em Apps",
    tag: "Trabalhista",
    tagColor: "bg-portal-warning-soft text-portal-warning border-portal-warning/20",
    href: "/portal/insights/vinculo-apps",
    colSpan: "col-span-12 lg:col-span-4",
  },
  {
    title: "Reforma Trabalhista: 7 Anos de Impactos Práticos",
    tag: "Legislação",
    tagColor: "bg-portal-info-soft text-portal-info border-portal-info/20",
    href: "/portal/insights/reforma-trabalhista-7anos",
    colSpan: "col-span-12 lg:col-span-4",
  },
  {
    title: "Como a Zattar Reduziu Custos em 40% para a TechCorp",
    tag: "Estudo de Caso",
    tagColor: "bg-portal-success-soft text-portal-success border-portal-success/20",
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
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass}`}
    >
      {tag}
    </span>
  );
}

function BentoCard({ article }: { article: BentoArticle }) {
  return (
    <div className={`${article.colSpan}`}>
      <Card className="h-full rounded-xl p-6 flex flex-col justify-between gap-4 hover:border-border/80 transition-all duration-300 cursor-pointer min-h-48">
        <div className="flex flex-col gap-3">
          <ArticleTag tag={article.tag} colorClass={article.tagColor} />
          <h3
            className={`font-extrabold tracking-tighter text-foreground leading-snug ${
              article.large ? "text-2xl" : "text-lg"
            }`}
          >
            {article.title}
          </h3>
          {article.description && article.large && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
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
      </Card>
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
      {/* Page Header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
            INSIGHTS
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Insights.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Artigos e análises jurídicas curados para manter você informado.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Buttons                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setActiveFilter(opt)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeFilter === opt
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Featured Hero Article                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-600 delay-100">
        <Card className="relative overflow-hidden p-0">
          <CardContent className="p-0">
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5" />
            </div>

            <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-start">
              {/* Content */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <ArticleTag
                    tag={featuredArticle.tag}
                    colorClass="bg-primary/10 text-primary border-primary/20"
                  />
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {featuredArticle.readingTime}
                  </span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tighter text-foreground leading-tight max-w-2xl">
                  {featuredArticle.title}
                </h2>

                <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
                  {featuredArticle.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={featuredArticle.href}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
                    aria-label={`Ler artigo completo: ${featuredArticle.title}`}
                  >
                    Ler Artigo Completo
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <button
                    className="inline-flex items-center gap-2 bg-muted border border-border text-muted-foreground px-5 py-3 rounded-xl font-bold text-sm hover:bg-muted/80 hover:text-foreground transition-all"
                    aria-label="Salvar artigo nos favoritos"
                  >
                    <Bookmark className="w-4 h-4" aria-hidden="true" />
                    Salvar
                  </button>
                </div>
              </div>

              {/* Decorative accent badge */}
              <div className="hidden lg:flex flex-col items-center justify-center w-40 h-40 shrink-0 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="text-4xl font-bold text-primary tabular-nums">
                  #1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 text-center">
                  Mais Lido
                  <br />
                  da Semana
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </>
  );
}
