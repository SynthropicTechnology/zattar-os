"use client"

import Link from "next/link"
import type { ProcessoDetalhePortal, TimelineEventPortal } from "../domain"
import {
  Scale,
  Calendar,
  FileText,
  ChevronRight,
  Clock,
  ArrowLeft,
  Zap,
  AlertCircle,
  Activity,
  Hash,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dotColorClass(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "bg-emerald-500"
    case "current":
      return "bg-primary"
    case "pending":
      return "bg-muted-foreground/30 border-2 border-muted-foreground/40"
  }
}

function dotRingClass(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "ring-emerald-500/20"
    case "current":
      return "ring-primary/20"
    case "pending":
      return "ring-transparent"
  }
}

function statusTextClass(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "text-emerald-500"
    case "current":
      return "text-primary"
    case "pending":
      return "text-muted-foreground"
  }
}

function statusLabel(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "Concluido"
    case "current":
      return "Em andamento"
    case "pending":
      return "Pendente"
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-primary">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-semibold text-foreground leading-snug ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function VerticalTimeline({ steps }: { steps: TimelineEventPortal[] }) {
  return (
    <ol className="relative space-y-0" aria-label="Timeline do processo">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        return (
          <li key={step.id} className="relative flex gap-5 pb-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full shrink-0 ring-4 z-10 relative ${dotColorClass(step.status)} ${dotRingClass(step.status)}`}
                aria-hidden="true"
              />
              {!isLast && (
                <div className="w-px flex-1 bg-border min-h-10 mt-1" />
              )}
            </div>
            <div className="flex items-start justify-between w-full min-w-0 pb-6">
              <div className="min-w-0">
                <p
                  className={`font-bold text-sm leading-snug ${
                    step.status === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {step.titulo}
                </p>
                <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                  {step.data}
                </p>
              </div>
              <span
                className={`text-xs font-bold shrink-0 ml-4 mt-0.5 ${statusTextClass(step.status)}`}
              >
                {statusLabel(step.status)}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ProcessoDetalheContent({
  processo,
  error,
}: {
  processo: ProcessoDetalhePortal | null | undefined
  error?: string
}) {
  if (error || !processo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground mb-1">
            {error || "Processo não encontrado"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Verifique se você tem acesso a este processo.
          </p>
        </div>
        <Link
          href="/portal/processos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-accent transition-all mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para processos
        </Link>
      </div>
    )
  }

  const recentTimeline = processo.timeline.slice(0, 5)
  const latestMovement = processo.timeline[0]
  const statusBadgeColor =
    processo.status === "Em Andamento"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
      : processo.status === "Arquivado"
        ? "bg-muted border-border text-muted-foreground"
        : "bg-primary/10 border-primary/20 text-primary"

  return (
    <>
      {/* Back link */}
      <Link
        href="/portal/processos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors -mt-2 mb-2 group"
        aria-label="Voltar para lista de processos"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar para processos
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">
          PROCESSO
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Detalhes do Processo.
        </h1>
        <div className="mt-3">
          <Link
            href={`/portal/processos/${encodeURIComponent(processo.id)}/timeline`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-accent transition-all"
          >
            <Clock className="w-4 h-4 text-primary" />
            Ver timeline completa
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Process info card */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: "400ms", animationFillMode: "both" }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Left block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBadgeColor}`}
                >
                  {processo.status === "Em Andamento" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {processo.status}
                </span>
                {processo.sigilo && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                    Sigilo
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-2xl tracking-tight leading-snug mb-1 text-foreground">
                {processo.descricao}
              </h3>
              <p className="font-mono text-xs text-muted-foreground/70 mb-3">
                {processo.numero}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {processo.titulo} - {processo.papelCliente}
              </p>
            </div>

            {/* Right block — metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 shrink-0 md:w-80">
              <InfoRow
                icon={<Scale className="w-4 h-4" />}
                label="Tribunal"
                value={processo.tribunal}
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Protocolado em"
                value={processo.dataProtocolo}
                mono
              />
              {processo.instancias.primeiroGrau && (
                <InfoRow
                  icon={<Hash className="w-4 h-4" />}
                  label="Vara"
                  value={processo.instancias.primeiroGrau.vara}
                />
              )}
              {processo.instancias.primeiroGrau?.proximaAudiencia && (
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Proxima audiencia"
                  value={processo.instancias.primeiroGrau.proximaAudiencia}
                  mono
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest movement highlight */}
      {latestMovement && (
        <Card
          className="border-primary/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "100ms", animationDuration: "400ms", animationFillMode: "both" }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 blur-[60px] rounded-full pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/25">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                  Ultima Movimentacao
                </p>
                <p className="font-semibold text-foreground text-sm leading-snug">
                  {latestMovement.titulo}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-xs text-muted-foreground/70">
                  {latestMovement.data}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  {statusLabel(latestMovement.status)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left column — timeline */}
        <Card
          className="lg:col-span-8 animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: "80ms",
            animationDuration: "400ms",
            animationFillMode: "both",
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Andamento Processual</CardTitle>
              <Link
                href={`/portal/processos/${encodeURIComponent(processo.id)}/timeline`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Ver tudo
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTimeline.length > 0 ? (
              <VerticalTimeline steps={recentTimeline} />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma movimentacao disponivel ainda.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  A timeline sera atualizada automaticamente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Stats card */}
          <Card
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: "120ms",
              animationDuration: "400ms",
              animationFillMode: "both",
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Estatisticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-extrabold text-2xl tracking-tighter text-primary leading-none mb-1">
                    {processo.stats.diasEmAndamento}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Dias em andamento
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-extrabold text-2xl tracking-tighter text-primary leading-none mb-1">
                    {processo.stats.totalDocumentos}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Documentos
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-extrabold text-2xl tracking-tighter text-primary leading-none mb-1">
                    {processo.stats.totalMovimentacoes}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Movimentacoes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents card */}
          {processo.documentos.length > 0 && (
            <Card
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: "160ms",
                animationDuration: "400ms",
                animationFillMode: "both",
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documentos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3" aria-label="Documentos do processo">
                  {processo.documentos.slice(0, 5).map((doc, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug truncate">
                          {doc.nome}
                        </p>
                        {doc.tipo && (
                          <p className="text-xs text-muted-foreground/60 font-mono">
                            {doc.tipo}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Instance info card */}
          {(processo.instancias.primeiroGrau || processo.instancias.segundoGrau) && (
            <Card
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: "200ms",
                animationDuration: "400ms",
                animationFillMode: "both",
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Instancias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processo.instancias.primeiroGrau && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      1o Grau
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {processo.instancias.primeiroGrau.vara}
                    </p>
                    {processo.instancias.primeiroGrau.proximaAudiencia && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Proxima audiencia: {processo.instancias.primeiroGrau.proximaAudiencia}
                      </p>
                    )}
                  </div>
                )}
                {processo.instancias.segundoGrau && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      2o Grau
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {processo.instancias.segundoGrau.vara}
                    </p>
                    {processo.instancias.segundoGrau.proximaAudiencia && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Proxima audiencia: {processo.instancias.segundoGrau.proximaAudiencia}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
