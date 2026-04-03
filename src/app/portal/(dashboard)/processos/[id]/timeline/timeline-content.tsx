"use client"

import Link from "next/link"
import type { ProcessoDetalhePortal, TimelineEventPortal } from "../../domain"
import {
  Scale,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  ChevronRight,
  AlertCircle,
  Activity,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dotBg(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "bg-emerald-500 ring-emerald-500/20"
    case "current":
      return "bg-primary ring-primary/20"
    case "pending":
      return "bg-muted-foreground/30 border-2 border-muted-foreground/40 ring-transparent"
  }
}

function statusBadgeClass(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "current":
      return "bg-primary/10 text-primary border-primary/20"
    case "pending":
      return "bg-muted text-muted-foreground border-border"
  }
}

function statusBadgeLabel(status: TimelineEventPortal["status"]): string {
  switch (status) {
    case "done":
      return "Concluido"
    case "current":
      return "Em andamento"
    case "pending":
      return "Pendente"
  }
}

function StatusIcon({ status }: { status: TimelineEventPortal["status"] }) {
  if (status === "done")
    return <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
  if (status === "current")
    return <Clock className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
  return <Clock className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
}

// ---------------------------------------------------------------------------
// Timeline Event Card
// ---------------------------------------------------------------------------

function TimelineEventCard({
  event,
  index,
  isLast,
}: {
  event: TimelineEventPortal
  index: number
  isLast: boolean
}) {
  return (
    <li
      className="relative flex gap-6 animate-in fade-in slide-in-from-bottom-4"
      style={{
        animationDelay: `${index * 80}ms`,
        animationDuration: "400ms",
        animationFillMode: "both",
      }}
    >
      {/* Dot + line column */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className={`w-4 h-4 rounded-full ring-4 z-10 shrink-0 ${dotBg(event.status)}`}
          aria-hidden="true"
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-2 min-h-12" />
        )}
      </div>

      {/* Card */}
      <Card
        className={`flex-1 min-w-0 mb-8 transition-colors hover:border-border/80 ${
          event.status === "current" ? "border-primary/20" : ""
        }`}
      >
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground/60 mb-1">
                {event.data}
                {event.hora && event.hora !== "—" && (
                  <span> - {event.hora}</span>
                )}
              </p>
              <h3
                className={`font-extrabold text-lg tracking-tight leading-snug ${
                  event.status === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {event.titulo}
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusBadgeClass(event.status)}`}
            >
              <StatusIcon status={event.status} />
              {statusBadgeLabel(event.status)}
            </span>
          </div>

          {/* Description */}
          <p
            className={`text-sm leading-relaxed ${
              event.status === "pending"
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            }`}
          >
            {event.descricao}
          </p>

          {/* Document link */}
          {event.documento && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                <FileText className="w-3.5 h-3.5" />
                {event.documento}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TimelineContent({
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

  const events = processo.timeline
  const doneCount = events.filter((e) => e.status === "done" || e.status === "current").length
  const totalCount = events.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <>
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-2 mb-2">
        <Link
          href="/portal/processos"
          className="font-semibold hover:text-foreground transition-colors"
        >
          Processos
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
        <Link
          href={`/portal/processos/${encodeURIComponent(processo.id)}`}
          className="font-semibold hover:text-foreground transition-colors"
        >
          Detalhes
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
        <span className="font-semibold text-foreground">Timeline</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">
            TIMELINE
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Movimentacoes.
          </h1>
        </div>
        <Link
          href={`/portal/processos/${encodeURIComponent(processo.id)}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-accent transition-all group"
          aria-label="Voltar para detalhes do processo"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar ao processo
        </Link>
      </div>

      {/* Process summary strip */}
      <Card
        className="animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: "400ms", animationFillMode: "both" }}
      >
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base tracking-tight leading-snug truncate text-foreground">
              {processo.descricao}
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-0.5">
              {processo.numero}
            </p>
          </div>

          {/* Progress */}
          {totalCount > 0 && (
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <p className="text-xs font-bold text-muted-foreground">
                {doneCount} de {totalCount} etapas
              </p>
              <div className="w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${progressPercent}% concluido`}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full timeline */}
      {events.length > 0 ? (
        <ol className="mt-6" aria-label="Lista de movimentacoes processuais">
          {events.map((event, index) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              index={index}
              isLast={index === events.length - 1}
            />
          ))}
        </ol>
      ) : (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">
              Nenhuma movimentacao disponivel
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              A timeline deste processo sera atualizada automaticamente
              conforme novas movimentacoes forem registradas no tribunal.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
