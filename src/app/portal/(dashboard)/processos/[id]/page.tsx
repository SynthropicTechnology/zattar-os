"use client";

import { use } from "react";
import Link from "next/link";
import { EditorialHeader, PhaseStepper } from "@/app/website";
import type { PhaseStep } from "@/app/website";
import {
  Scale,
  Calendar,
  User,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
  FileDown,
  ArrowLeft,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineStatus = "done" | "current" | "pending";

interface TimelineStep {
  id: number;
  title: string;
  date: string;
  status: TimelineStatus;
}

interface RelatedDocument {
  id: number;
  name: string;
  size: string;
  type: string;
}

interface NextStep {
  id: number;
  title: string;
  dueDate: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PROCESS = {
  number: "0001234-55.2024.5.03.0001",
  title: "Rescisão Indireta",
  fullTitle: "Rescisão Indireta — João Silva vs Empresa XYZ",
  court: "TRT 3ª Região — 1ª Vara do Trabalho",
  dateFiled: "15/01/2024",
  status: "Em Andamento",
  value: "R$ 85.000,00",
  lawyer: "Dra. Carolina Zattar",
  expectation: "Favorável",
  description:
    "Pedido de rescisão indireta por descumprimento contratual reiterado e mora salarial superior a três meses, com pleito de todas as verbas rescisórias pertinentes.",
};

const TIMELINE: TimelineStep[] = [
  {
    id: 1,
    title: "Petição Inicial Protocolada",
    date: "15/01/2024",
    status: "done",
  },
  {
    id: 2,
    title: "Audiência de Conciliação",
    date: "20/02/2024",
    status: "done",
  },
  {
    id: 3,
    title: "Perícia Técnica Agendada",
    date: "15/03/2024",
    status: "done",
  },
  {
    id: 4,
    title: "Laudo Pericial Apresentado",
    date: "10/04/2024",
    status: "current",
  },
  {
    id: 5,
    title: "Audiência de Instrução",
    date: "15/05/2024",
    status: "pending",
  },
  {
    id: 6,
    title: "Sentença",
    date: "Previsão Jun/2024",
    status: "pending",
  },
];

const DOCUMENTS: RelatedDocument[] = [
  { id: 1, name: "Petição Inicial", size: "248 KB", type: "PDF" },
  { id: 2, name: "Ata de Conciliação", size: "112 KB", type: "PDF" },
  { id: 3, name: "Laudo Pericial Parcial", size: "1,4 MB", type: "PDF" },
];

const NEXT_STEPS: NextStep[] = [
  { id: 1, title: "Aguardar conclusão do laudo pericial", dueDate: "10/04/2024" },
  { id: 2, title: "Confirmar data da audiência de instrução", dueDate: "20/04/2024" },
  { id: 3, title: "Preparar rol de testemunhas", dueDate: "30/04/2024" },
];

const STATS = [
  { label: "Dias em andamento", value: "70" },
  { label: "Documentos", value: "12" },
  { label: "Movimentações", value: "6" },
];

// Phase steps for this process (Em Andamento — at Instrução phase)
const PHASE_STEPS: PhaseStep[] = [
  { label: "Inicial", status: "completed" },
  { label: "Citação", status: "completed" },
  { label: "Instrução", status: "current" },
  { label: "Sentença", status: "pending" },
];

// Latest movement from timeline (the most recent "done" or "current" step)
const LATEST_MOVEMENT = TIMELINE.find((s) => s.status === "current") ?? TIMELINE[TIMELINE.length - 1];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dotColorClass(status: TimelineStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-400";
    case "current":
      return "bg-primary";
    case "pending":
      return "bg-outline border-2 border-outline-variant";
  }
}

function dotRingClass(status: TimelineStatus): string {
  switch (status) {
    case "done":
      return "ring-emerald-400/20";
    case "current":
      return "ring-primary/20";
    case "pending":
      return "ring-transparent";
  }
}

function statusTextClass(status: TimelineStatus): string {
  switch (status) {
    case "done":
      return "text-emerald-400";
    case "current":
      return "text-primary";
    case "pending":
      return "text-on-surface-variant";
  }
}

function statusLabel(status: TimelineStatus): string {
  switch (status) {
    case "done":
      return "Concluído";
    case "current":
      return "Em andamento";
    case "pending":
      return "Pendente";
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
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-primary">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-semibold text-on-surface leading-snug ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function VerticalTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-0" aria-label="Timeline do processo">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-5 pb-0">
            {/* Vertical line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full shrink-0 ring-4 z-10 relative ${dotColorClass(step.status)} ${dotRingClass(step.status)}`}
                aria-hidden="true"
              />
              {!isLast && (
                <div className="w-px flex-1 bg-white/5 min-h-10 mt-1" />
              )}
            </div>

            {/* Content */}
            <div
              className={`flex items-start justify-between w-full min-w-0 pb-6 ${isLast ? "" : ""}`}
            >
              <div className="min-w-0">
                <p
                  className={`font-bold text-sm leading-snug ${
                    step.status === "pending"
                      ? "text-on-surface-variant"
                      : "text-on-surface"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-on-surface-variant/60 font-mono mt-0.5">
                  {step.date}
                </p>
              </div>
              <span
                className={`text-xs font-bold shrink-0 ml-4 mt-0.5 ${statusTextClass(step.status)}`}
              >
                {statusLabel(step.status)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      {/* Back link */}
      <Link
        href="/portal/processos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors -mt-2 mb-2 group"
        aria-label="Voltar para lista de processos"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar para processos
      </Link>

      {/* Editorial header */}
      <EditorialHeader
        kicker="PROCESSO"
        title="Detalhes do Processo."
        actions={
          <Link
            href={`/portal/processos/${id}/timeline`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container border border-white/10 text-sm font-semibold hover:bg-surface-container-highest hover:border-white/20 transition-all"
          >
            <Clock className="w-4 h-4 text-primary" />
            Ver timeline completa
            <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
          </Link>
        }
      />

      {/* Process info card */}
      <div
        className="bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: "400ms", animationFillMode: "both" }}
      >
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Left block — number + title + badge */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {PROCESS.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                {PROCESS.expectation}
              </span>
            </div>
            <h3 className="font-headline font-extrabold text-2xl tracking-tight leading-snug mb-1">
              {PROCESS.fullTitle}
            </h3>
            <p className="font-mono text-xs text-on-surface-variant/70 mb-3">
              {PROCESS.number}
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
              {PROCESS.description}
            </p>
          </div>

          {/* Right block — metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 shrink-0 md:w-80">
            <InfoRow
              icon={<Scale className="w-4 h-4" />}
              label="Vara"
              value={PROCESS.court}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Protocolado em"
              value={PROCESS.dateFiled}
              mono
            />
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="Advogada"
              value={PROCESS.lawyer}
            />
            <InfoRow
              icon={<FileText className="w-4 h-4" />}
              label="Valor esperado"
              value={PROCESS.value}
            />
          </div>
        </div>
      </div>

      {/* Phase stepper — horizontal overview of process phases */}
      <div
        className="bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDelay: "60ms", animationDuration: "400ms", animationFillMode: "both" }}
      >
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
          Fase do Processo
        </p>
        <PhaseStepper steps={PHASE_STEPS} />
      </div>

      {/* Última Movimentação highlight card */}
      <div
        className="glass-card rounded-xl border border-primary/20 p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDelay: "100ms", animationDuration: "400ms", animationFillMode: "both" }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/25">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
              Última Movimentação
            </p>
            <p className="font-semibold text-on-surface text-sm leading-snug">
              {LATEST_MOVEMENT.title}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-xs text-on-surface-variant/70">
              {LATEST_MOVEMENT.date}
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
              {statusLabel(LATEST_MOVEMENT.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left column — timeline */}
        <div
          className="lg:col-span-8 bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: "80ms",
            animationDuration: "400ms",
            animationFillMode: "both",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-extrabold text-lg tracking-tight">
              Andamento Processual
            </h3>
            <Link
              href={`/portal/processos/${id}/timeline`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Ver tudo
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <VerticalTimeline steps={TIMELINE} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Stats card */}
          <div
            className="bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: "120ms",
              animationDuration: "400ms",
              animationFillMode: "both",
            }}
          >
            <h3 className="font-headline font-extrabold text-lg tracking-tight mb-5">
              Estatísticas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-lg p-3 text-center"
                >
                  <p className="font-headline font-extrabold text-2xl tracking-tighter text-primary leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents card */}
          <div
            className="bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: "160ms",
              animationDuration: "400ms",
              animationFillMode: "both",
            }}
          >
            <h3 className="font-headline font-extrabold text-lg tracking-tight mb-5">
              Documentos Recentes
            </h3>
            <ul className="space-y-3" aria-label="Documentos do processo">
              {DOCUMENTS.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface leading-snug truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 font-mono">
                        {doc.type} · {doc.size}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={`Baixar ${doc.name}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all shrink-0"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Next steps card */}
          <div
            className="bg-surface-container rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: "200ms",
              animationDuration: "400ms",
              animationFillMode: "both",
            }}
          >
            <h3 className="font-headline font-extrabold text-lg tracking-tight mb-5">
              Próximos Passos
            </h3>
            <ul className="space-y-3" aria-label="Próximos passos do processo">
              {NEXT_STEPS.map((step) => (
                <li
                  key={step.id}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-on-surface-variant/40 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface leading-snug">
                      {step.title}
                    </p>
                    <p className="text-xs text-on-surface-variant/60 font-mono mt-0.5">
                      até {step.dueDate}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
