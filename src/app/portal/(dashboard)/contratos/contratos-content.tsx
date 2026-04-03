"use client"

import { useState } from "react"
import { FileText, Search, FileSearch, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import type { ContratoPortal, StatusContratoPortal } from "./domain"

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { label: string; value: StatusContratoPortal | null }[] = [
  { label: "Todos", value: null },
  { label: "Ativos", value: "Ativo" },
  { label: "Pendentes", value: "Pendente" },
  { label: "Encerrados", value: "Encerrado" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusDot(status: StatusContratoPortal): string {
  switch (status) {
    case "Ativo":
      return "bg-emerald-500"
    case "Pendente":
      return "bg-amber-500"
    case "Encerrado":
      return "bg-muted-foreground"
  }
}

function getStatusLabelColor(status: StatusContratoPortal): string {
  switch (status) {
    case "Ativo":
      return "text-emerald-600 dark:text-emerald-400"
    case "Pendente":
      return "text-amber-600 dark:text-amber-400"
    case "Encerrado":
      return "text-muted-foreground"
  }
}

function getStatusIcon(status: StatusContratoPortal) {
  switch (status) {
    case "Ativo":
      return <CheckCircle2 className="w-3.5 h-3.5" />
    case "Pendente":
      return <Clock className="w-3.5 h-3.5" />
    case "Encerrado":
      return <XCircle className="w-3.5 h-3.5" />
  }
}

function getStatusBadgeVariant(status: StatusContratoPortal): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Ativo":
      return "default"
    case "Pendente":
      return "secondary"
    case "Encerrado":
      return "outline"
  }
}

// ---------------------------------------------------------------------------
// Contract Card
// ---------------------------------------------------------------------------

interface ContratoCardProps {
  contrato: ContratoPortal
  index: number
}

function ContratoCard({ contrato, index }: ContratoCardProps) {
  return (
    <div
      className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left -- status + type */}
        <div className="flex flex-col gap-2 lg:w-48 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDot(contrato.status)}`}
            />
            <span
              className={`text-xs font-semibold flex items-center gap-1 ${getStatusLabelColor(contrato.status)}`}
            >
              {getStatusIcon(contrato.status)}
              {contrato.status}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            #{contrato.id}
          </p>
        </div>

        {/* Center -- title + metadata */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg tracking-tight leading-snug mb-1 text-foreground">
            {contrato.titulo}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={getStatusBadgeVariant(contrato.status)}>
              {contrato.status}
            </Badge>
            <Badge variant="outline">{contrato.tipoCobranca}</Badge>
            <Badge variant="outline">{contrato.papelCliente}</Badge>
          </div>
          {contrato.partes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {contrato.partes.map((parte, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                >
                  {parte}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right -- date */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 lg:w-40">
          <div className="text-right">
            <p className="text-xs text-muted-foreground/60 mb-0.5">
              Cadastrado em
            </p>
            <p className="text-sm font-medium font-mono text-foreground">
              {contrato.dataCadastro}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Content
// ---------------------------------------------------------------------------

interface ContratosContentProps {
  contratos?: ContratoPortal[]
  error?: string
}

export function ContratosContent({ contratos, error }: ContratosContentProps) {
  const [activeFilter, setActiveFilter] = useState<StatusContratoPortal | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  if (error) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Erro ao carregar contratos"
        description={error}
      />
    )
  }

  if (!contratos || contratos.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum contrato encontrado"
        description="Nao foram encontrados contratos vinculados ao seu CPF."
      />
    )
  }

  const filteredContratos = contratos.filter((c) => {
    const matchesStatus = activeFilter === null || c.status === activeFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      q === "" ||
      c.titulo.toLowerCase().includes(q) ||
      c.tipoCobranca.toLowerCase().includes(q) ||
      c.papelCliente.toLowerCase().includes(q) ||
      c.partes.some((p) => p.toLowerCase().includes(q)) ||
      String(c.id).includes(q)
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
            placeholder="Buscar contrato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            aria-label="Buscar contrato"
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
        {filteredContratos.length}{" "}
        {filteredContratos.length === 1 ? "contrato encontrado" : "contratos encontrados"}
      </p>

      {/* Contract cards */}
      {filteredContratos.length > 0 ? (
        <div className="grid gap-4">
          {filteredContratos.map((contrato, index) => (
            <ContratoCard
              key={contrato.id}
              contrato={contrato}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileSearch}
          title="Nenhum contrato encontrado"
          description="Tente ajustar o filtro ou o termo de busca."
        />
      )}
    </div>
  )
}
