"use client";

import { useState } from "react";
import { EditorialHeader, FilterChips } from "@/app/website";
import {
  FileText,
  PlusCircle,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Pen,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractStatus = "Assinado" | "Pendente" | "Em Revisão";

interface Contract {
  id: string;
  ref: string;
  title: string;
  status: ContractStatus;
  value: string;
  createdAt: string;
}

interface DeadlineItem {
  ref: string;
  title: string;
  label: string;
  urgency: "critical" | "warning" | "normal";
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const featuredContract = {
  ref: "#2024-001",
  title: "Contrato de Prestação de Serviços",
  status: "Assinado" as ContractStatus,
  value: "R$ 45.000",
  description:
    "Acordo de prestação de serviços jurídicos especializados, englobando consultoria, representação processual e elaboração de pareceres técnicos para o período vigente.",
  createdAt: "15/01/2024",
  expiresAt: "15/01/2025",
  parties: ["Zattar Advocacia", "Tech-Consortium Intl."],
};

const contracts: Contract[] = [
  {
    id: "1",
    ref: "#2024-002",
    title: "Acordo Trabalhista",
    status: "Pendente",
    value: "R$ 28.000",
    createdAt: "20/02/2024",
  },
  {
    id: "2",
    ref: "#2024-003",
    title: "Contrato de Honorários",
    status: "Em Revisão",
    value: "R$ 15.000",
    createdAt: "10/03/2024",
  },
  {
    id: "3",
    ref: "#2024-004",
    title: "Termo de Confidencialidade",
    status: "Assinado",
    value: "R$ 0",
    createdAt: "05/01/2024",
  },
  {
    id: "4",
    ref: "#2024-005",
    title: "Contrato de Consultoria",
    status: "Pendente",
    value: "R$ 35.000",
    createdAt: "22/03/2024",
  },
  {
    id: "5",
    ref: "#2024-006",
    title: "Procuração Ad Judicia",
    status: "Assinado",
    value: "R$ 0",
    createdAt: "12/01/2024",
  },
];

const deadlines: DeadlineItem[] = [
  {
    ref: "#2024-002",
    title: "Acordo Trabalhista",
    label: "Vence em 5 dias",
    urgency: "critical",
  },
  {
    ref: "#2024-003",
    title: "Honorários",
    label: "Vence em 15 dias",
    urgency: "warning",
  },
  {
    ref: "#2024-005",
    title: "Consultoria",
    label: "Vence em 30 dias",
    urgency: "normal",
  },
];

// ---------------------------------------------------------------------------
// Sub-components (pure, no interactivity needed at server level)
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ContractStatus }) {
  if (status === "Assinado") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
        <CheckCircle className="w-3 h-3" aria-hidden="true" />
        Assinado
      </span>
    );
  }
  if (status === "Pendente") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">
        <Clock className="w-3 h-3" aria-hidden="true" />
        Pendente
      </span>
    );
  }
  // Em Revisão
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-info/10 text-info border border-info/20 whitespace-nowrap">
      <Pen className="w-3 h-3" aria-hidden="true" />
      Em Revisão
    </span>
  );
}

function ContractIconBg({ status }: { status: ContractStatus }) {
  const colorMap: Record<ContractStatus, string> = {
    Assinado:
      "text-emerald-400 group-hover:bg-emerald-500/10",
    Pendente:
      "text-amber-500 group-hover:bg-amber-500/10",
    "Em Revisão":
      "text-info group-hover:bg-info/10",
  };
  return (
    <div
      className={`w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 border border-white/5 shrink-0 ${colorMap[status]}`}
    >
      <FileText className="w-6 h-6" aria-hidden="true" />
    </div>
  );
}

const deadlineAccentMap: Record<DeadlineItem["urgency"], string> = {
  critical: "border-l-destructive",
  warning: "border-l-warning",
  normal: "border-l-primary",
};

const deadlineLabelColorMap: Record<DeadlineItem["urgency"], string> = {
  critical: "text-destructive-foreground",
  warning: "text-warning-foreground",
  normal: "text-primary",
};

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

const CONTRACT_FILTER_OPTIONS = [
  "Todos (6)",
  "Assinados (3)",
  "Pendentes (2)",
  "Em Revisão (1)",
];

export default function GestaoContratosPage() {
  const [activeFilter, setActiveFilter] = useState("Todos (6)");

  return (
    <>
      {/* Editorial Header */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EditorialHeader
          kicker="CONTRATOS"
          title="Gestão de Contratos."
          description="Gerencie seus acordos legais com controle total e segurança."
          actions={
            <Link
              href="/portal/contratos/gerador"
              className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-[0_4px_20px_rgba(204,151,255,0.4)] transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              Novo Contrato
            </Link>
          }
        />
        <FilterChips
          options={CONTRACT_FILTER_OPTIONS}
          activeOption={activeFilter}
          onSelect={setActiveFilter}
          className="mt-6"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Featured Contract — full-width glass card, 12-col grid             */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="glass-card gradient-border rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700"
        aria-label="Contrato em destaque"
      >
        {/* Left: featured contract details */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Top row: ref + status */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest font-mono">
                    {featuredContract.ref}
                  </p>
                  <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Prioritário
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold font-headline tracking-tighter text-white leading-tight">
                  {featuredContract.title}
                </h3>
                <span className="text-on-surface-variant text-xs">
                  Atualizado há 2 horas
                </span>
              </div>
            </div>
            <StatusBadge status={featuredContract.status} />
          </div>

          {/* Description */}
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-prose">
            {featuredContract.description}
          </p>

          {/* Metadata row */}
          <dl className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">
                Criado em
              </dt>
              <dd className="text-white font-bold text-sm font-mono">
                {featuredContract.createdAt}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">
                Vencimento
              </dt>
              <dd className="text-white font-bold text-sm font-mono">
                {featuredContract.expiresAt}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">
                Valor
              </dt>
              <dd className="text-white font-bold text-sm font-mono tabular-nums">
                {featuredContract.value}
              </dd>
            </div>
          </dl>

          {/* Parties */}
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
              Partes Contratantes
            </p>
            <div className="flex flex-wrap gap-2">
              {featuredContract.parties.map((party) => (
                <span
                  key={party}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-on-surface"
                >
                  {party}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="flex items-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/15 hover:border-primary/40 transition-all"
              aria-label="Visualizar contrato"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              Visualizar
            </button>
            <button
              className="flex items-center gap-2 border border-white/10 text-on-surface-variant px-5 py-2.5 rounded-xl font-bold text-sm hover:text-white hover:border-white/20 transition-all"
              aria-label="Baixar PDF do contrato"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Baixar PDF
            </button>
          </div>
        </div>

        {/* Right: upcoming deadlines sidebar */}
        <aside
          className="lg:col-span-4 flex flex-col gap-4"
          aria-label="Próximos vencimentos"
        >
          <h4 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">
            Proximos Vencimentos
          </h4>
          <ul className="flex flex-col gap-3" role="list">
            {deadlines.map((item) => (
              <li
                key={item.ref}
                className={`border-l-4 py-3 px-4 bg-surface-container-high rounded-r-lg ${deadlineAccentMap[item.urgency]}`}
              >
                <p className="text-xs font-mono font-bold text-on-surface-variant mb-0.5">
                  {item.ref}
                </p>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p
                  className={`text-xs font-bold mt-1 flex items-center gap-1.5 ${deadlineLabelColorMap[item.urgency]}`}
                >
                  {item.urgency === "critical" && (
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  )}
                  {item.urgency === "warning" && (
                    <Clock className="w-3 h-3" aria-hidden="true" />
                  )}
                  {item.urgency === "normal" && (
                    <Clock className="w-3 h-3" aria-hidden="true" />
                  )}
                  {item.label}
                </p>
              </li>
            ))}
          </ul>

          {/* Ambient glow accent */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-xs text-on-surface-variant">
              <span className="font-bold text-white">6 contratos</span> no
              total &mdash; 3 requerem atenção nos próximos 30 dias.
            </p>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Contract List                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Lista de contratos"
        className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4">
          Todos os Contratos
        </h3>

        <ul className="grid gap-4" role="list">
          {contracts.map((contract) => (
            <li
              key={contract.id}
              className="group bg-surface-container border border-white/5 hover:border-white/10 hover:bg-surface-container-high rounded-xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-sm"
            >
              {/* Left: icon + title + meta */}
              <div className="flex items-center gap-4 min-w-0">
                <ContractIconBg status={contract.status} />
                <div className="min-w-0">
                  <h4 className="font-bold text-base font-headline tracking-tight text-white truncate">
                    {contract.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-on-surface-variant">
                      {contract.ref}
                    </span>
                    <span
                      className="text-xs text-outline hidden sm:inline"
                      aria-hidden="true"
                    >
                      &bull;
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {contract.createdAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: status + value + actions */}
              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 md:pl-4 border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                <StatusBadge status={contract.status} />

                <span
                  className="text-sm font-mono tabular-nums font-bold text-on-surface min-w-20 text-right"
                  aria-label={`Valor: ${contract.value}`}
                >
                  {contract.value}
                </span>

                <div
                  className="flex items-center gap-1"
                  role="group"
                  aria-label="Ações do contrato"
                >
                  <button
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                    aria-label={`Visualizar ${contract.title}`}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                    aria-label={`Baixar ${contract.title}`}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                    aria-label={`Mais opções para ${contract.title}`}
                  >
                    <MoreVertical className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
