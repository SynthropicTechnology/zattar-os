"use client";

import { useState } from "react";
import { EditorialHeader, FilterChips, PhaseStepper, StatCard } from "@/app/website";
import type { PhaseStep } from "@/app/website";
import {
  Scale,
  Eye,
  Download,
  MoreVertical,
  Search,
  Filter,
  TrendingUp,
  Target,
  Award,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProcessStatus = "Em Andamento" | "Concluído" | "Arquivado";
type ProcessExpectation = "Favorável" | "Neutro";

interface ProcessItem {
  id: string;
  number: string;
  court: string;
  title: string;
  description: string;
  dateFiled: string;
  value: number;
  expectation: ProcessExpectation;
  status: ProcessStatus;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PROCESSES: ProcessItem[] = [
  {
    id: "1",
    number: "0001234-55.2024.5.03.0001",
    court: "TRT 3ª Região",
    title: "Rescisão Indireta",
    description: "João Silva — Pedido de rescisão indireta por descumprimento contratual reiterado e mora salarial superior a três meses.",
    dateFiled: "15 Mar 2024",
    value: 85000,
    expectation: "Favorável",
    status: "Em Andamento",
  },
  {
    id: "2",
    number: "0005678-90.2024.5.03.0002",
    court: "TRT 3ª Região",
    title: "Horas Extras",
    description: "Maria Santos — Cobrança de horas extras não remuneradas, adicional noturno e reflexos sobre verbas rescisórias.",
    dateFiled: "02 Jun 2024",
    value: 42000,
    expectation: "Favorável",
    status: "Em Andamento",
  },
  {
    id: "3",
    number: "0009012-34.2023.5.03.0003",
    court: "TRT 3ª Região",
    title: "FGTS",
    description: "Pedro Costa — Recolhimentos fundiários omissos durante todo o contrato de trabalho com pedido de multa de 40%.",
    dateFiled: "20 Nov 2023",
    value: 28500,
    expectation: "Neutro",
    status: "Em Andamento",
  },
  {
    id: "4",
    number: "0003456-78.2023.5.03.0004",
    court: "TRT 3ª Região",
    title: "Acidente de Trabalho",
    description: "Ana Lima — Indenização por danos materiais, morais e estéticos decorrentes de acidente típico com sequelas permanentes.",
    dateFiled: "08 Ago 2023",
    value: 120000,
    expectation: "Favorável",
    status: "Concluído",
  },
  {
    id: "5",
    number: "0007890-12.2023.5.03.0005",
    court: "TRT 3ª Região",
    title: "Equiparação Salarial",
    description: "Carlos Mendes — Reconhecimento de isonomia salarial em relação a paradigma que exercia função idêntica na mesma empresa.",
    dateFiled: "14 Abr 2023",
    value: 55000,
    expectation: "Neutro",
    status: "Arquivado",
  },
];

const FILTER_OPTIONS = ["Todos", "Em Andamento", "Concluídos", "Arquivados"];

// Phase steps for "Em Andamento" processes
const STEPS_IN_PROGRESS: PhaseStep[] = [
  { label: "Inicial", status: "completed" },
  { label: "Citação", status: "completed" },
  { label: "Instrução", status: "current" },
  { label: "Sentença", status: "pending" },
];

// Phase steps for "Concluído" processes — all completed
const STEPS_CONCLUDED: PhaseStep[] = [
  { label: "Inicial", status: "completed" },
  { label: "Citação", status: "completed" },
  { label: "Instrução", status: "completed" },
  { label: "Sentença", status: "completed" },
];

// Phase steps for "Arquivado" processes
const STEPS_ARCHIVED: PhaseStep[] = [
  { label: "Inicial", status: "completed" },
  { label: "Citação", status: "completed" },
  { label: "Instrução", status: "completed" },
  { label: "Sentença", status: "pending" },
];

function getPhaseSteps(status: ProcessStatus): PhaseStep[] {
  switch (status) {
    case "Em Andamento":
      return STEPS_IN_PROGRESS;
    case "Concluído":
      return STEPS_CONCLUDED;
    case "Arquivado":
      return STEPS_ARCHIVED;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusDot(status: ProcessStatus): string {
  switch (status) {
    case "Em Andamento":
      return "bg-emerald-400";
    case "Concluído":
      return "bg-primary";
    case "Arquivado":
      return "bg-outline";
  }
}

function getStatusLabel(status: ProcessStatus): string {
  switch (status) {
    case "Em Andamento":
      return "Em Andamento";
    case "Concluído":
      return "Concluído";
    case "Arquivado":
      return "Arquivado";
  }
}

function getStatusLabelColor(status: ProcessStatus): string {
  switch (status) {
    case "Em Andamento":
      return "text-emerald-400";
    case "Concluído":
      return "text-primary";
    case "Arquivado":
      return "text-on-surface-variant";
  }
}

function getExpectationClasses(expectation: ProcessExpectation): string {
  switch (expectation) {
    case "Favorável":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "Neutro":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
  }
}

function filterLabelToStatus(label: string): ProcessStatus | null {
  switch (label) {
    case "Em Andamento":
      return "Em Andamento";
    case "Concluídos":
      return "Concluído";
    case "Arquivados":
      return "Arquivado";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Process Card
// ---------------------------------------------------------------------------

interface ProcessCardProps {
  process: ProcessItem;
  index: number;
}

function ProcessCard({ process, index }: ProcessCardProps) {
  return (
    <div
      className="group bg-surface-container rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">

        {/* Left — status + number + court */}
        <div className="flex flex-col gap-2 lg:w-64 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDot(process.status)}`}
            />
            <span
              className={`text-xs font-semibold ${getStatusLabelColor(process.status)}`}
            >
              {getStatusLabel(process.status)}
            </span>
          </div>
          <p className="font-mono text-xs text-on-surface-variant leading-relaxed break-all">
            {process.number}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>{process.court}</span>
          </div>
        </div>

        {/* Center — title + description + date */}
        <div className="flex-1 min-w-0">
          <h3 className="font-headline font-extrabold text-lg tracking-tight leading-snug mb-1">
            {process.title}
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
            {process.description}
          </p>
          <p className="text-xs text-on-surface-variant/60 mt-2 font-mono">
            Protocolado em {process.dateFiled}
          </p>
        </div>

        {/* Right — value + expectation badge + actions */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-on-surface-variant/60 uppercase tracking-wider mb-0.5">
              Valor esperado
            </p>
            <p className="font-headline font-extrabold text-xl tracking-tight">
              {formatCurrency(process.value)}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${getExpectationClasses(process.expectation)}`}
          >
            {process.expectation}
          </span>

          <div className="flex items-center gap-1">
            <button
              aria-label="Visualizar processo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              aria-label="Baixar documentos"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              aria-label="Mais opções"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Phase stepper — at the bottom of the card */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <PhaseStepper steps={getPhaseSteps(process.status)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProcessosPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProcesses = PROCESSES.filter((p) => {
    const statusFilter = filterLabelToStatus(activeFilter);
    const matchesStatus = statusFilter === null || p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      p.title.toLowerCase().includes(q) ||
      p.number.includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* Editorial header */}
      <EditorialHeader
        kicker="PROCESSOS"
        title="Meus Processos."
        description="Gestão inteligente e acompanhamento dos seus processos jurídicos."
        actions={
          <>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container border border-white/10 text-sm font-semibold hover:bg-surface-container-highest hover:border-white/20 transition-all">
              <Filter className="w-4 h-4 text-primary" />
              Filtrar
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar processo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-surface-container border border-white/10 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all w-56"
                aria-label="Buscar processo"
              />
            </div>
          </>
        }
      />

      {/* Metric grid — 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total sob Gestão"
          value="R$ 450.000"
          icon={<TrendingUp className="w-5 h-5" />}
          change={12.5}
          className="border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
        />
        <StatCard
          label="Previsão de Êxito"
          value="R$ 280.000"
          icon={<Target className="w-5 h-5" />}
          change={8.3}
          className="border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
        />
        <StatCard
          label="Processos Ativos"
          value="5"
          icon={<Scale className="w-5 h-5" />}
          className="border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
        />
        <StatCard
          label="Taxa de Vitória"
          value="92%"
          icon={<Award className="w-5 h-5" />}
          className="border border-white/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] transition-shadow duration-300"
        />
      </div>

      {/* Filter chips */}
      <FilterChips
        options={FILTER_OPTIONS}
        activeOption={activeFilter}
        onSelect={setActiveFilter}
      />

      {/* Process cards */}
      {filteredProcesses.length > 0 ? (
        <div className="grid gap-6">
          {filteredProcesses.map((process, index) => (
            <ProcessCard key={process.id} process={process} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant animate-in fade-in duration-300">
          <Scale className="w-12 h-12 opacity-30" />
          <p className="text-lg font-semibold">Nenhum processo encontrado.</p>
          <p className="text-sm opacity-70">
            Tente ajustar o filtro ou o termo de busca.
          </p>
        </div>
      )}
    </>
  );
}
