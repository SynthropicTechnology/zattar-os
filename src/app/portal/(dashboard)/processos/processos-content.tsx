"use client"

import { useState } from "react"
import { Scale, Search, FileSearch, ShieldAlert, Calendar, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import type { ProcessoPortal, StatusProcessoPortal } from "./domain"

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { label: string; value: StatusProcessoPortal | null }[] = [
  { label: "Todos", value: null },
  { label: "Em Andamento", value: "Em Andamento" },
  { label: "Concluído", value: "Concluído" },
  { label: "Arquivado", value: "Arquivado" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusDot(status: StatusProcessoPortal): string {
  switch (status) {
    case "Em Andamento":
      return "bg-emerald-500"
    case "Concluído":
      return "bg-blue-500"
    case "Arquivado":
      return "bg-muted-foreground"
  }
}

function getStatusLabelColor(status: StatusProcessoPortal): string {
  switch (status) {
    case "Em Andamento":
      return "text-emerald-600 dark:text-emerald-400"
    case "Concluído":
      return "text-blue-600 dark:text-blue-400"
    case "Arquivado":
      return "text-muted-foreground"
  }
}

// ---------------------------------------------------------------------------
// Process Card
// ---------------------------------------------------------------------------

interface ProcessCardProps {
  processo: ProcessoPortal
  index: number
}

function ProcessCard({ processo, index }: ProcessCardProps) {
  const proximaAudiencia =
    processo.instancias.primeiroGrau?.proximaAudiencia ??
    processo.instancias.segundoGrau?.proximaAudiencia

  return (
    <div
      className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left -- status + number + court */}
        <div className="flex flex-col gap-2 lg:w-64 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDot(processo.status)}`}
            />
            <span
              className={`text-xs font-semibold ${getStatusLabelColor(processo.status)}`}
            >
              {processo.status}
            </span>
            {processo.sigilo && (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" aria-label="Sigilo de Justiça" />
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed break-all">
            {processo.numero}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>{processo.tribunal}</span>
          </div>
        </div>

        {/* Center -- title + description + date */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg tracking-tight leading-snug mb-1 text-foreground">
            {processo.titulo}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {processo.descricao}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <p className="text-xs text-muted-foreground/60 font-mono">
              Protocolado em {processo.dataProtocolo}
            </p>
            <Badge variant="outline" className="text-xs">
              {processo.papelCliente}
            </Badge>
          </div>
        </div>

        {/* Right -- instance info + last movement */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 lg:w-56">
          {/* Vara info */}
          {processo.instancias.primeiroGrau && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[200px]" title={processo.instancias.primeiroGrau.vara}>
                {processo.instancias.primeiroGrau.vara}
              </span>
            </div>
          )}

          {/* Proxima audiencia */}
          {proximaAudiencia && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Audiência: {proximaAudiencia}</span>
            </div>
          )}

          {/* Ultima movimentacao */}
          {processo.ultimaMovimentacao && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground/60 mb-0.5">
                Última movimentação
              </p>
              <p className="text-xs font-medium text-foreground">
                {processo.ultimaMovimentacao.data}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={processo.ultimaMovimentacao.descricao}>
                {processo.ultimaMovimentacao.descricao}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Content
// ---------------------------------------------------------------------------

interface ProcessosContentProps {
  processos?: ProcessoPortal[]
  error?: string
}

export function ProcessosContent({ processos, error }: ProcessosContentProps) {
  const [activeFilter, setActiveFilter] = useState<StatusProcessoPortal | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  if (error) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Erro ao carregar processos"
        description={error}
      />
    )
  }

  if (!processos || processos.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="Nenhum processo encontrado"
        description="Não foram encontrados processos vinculados ao seu CPF."
      />
    )
  }

  const filteredProcesses = processos.filter((p) => {
    const matchesStatus = activeFilter === null || p.status === activeFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      q === "" ||
      p.titulo.toLowerCase().includes(q) ||
      p.numero.includes(q) ||
      p.descricao.toLowerCase().includes(q) ||
      p.tribunal.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar processo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            aria-label="Buscar processo"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => setActiveFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {filteredProcesses.length}{" "}
        {filteredProcesses.length === 1 ? "processo encontrado" : "processos encontrados"}
      </p>

      {/* Process cards */}
      {filteredProcesses.length > 0 ? (
        <div className="grid gap-4">
          {filteredProcesses.map((processo, index) => (
            <ProcessCard
              key={processo.id}
              processo={processo}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileSearch}
          title="Nenhum processo encontrado"
          description="Tente ajustar o filtro ou o termo de busca."
        />
      )}
    </div>
  )
}
