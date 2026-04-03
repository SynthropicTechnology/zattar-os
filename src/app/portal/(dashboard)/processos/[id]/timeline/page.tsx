"use client";

import { use } from "react";
import Link from "next/link";
import { EditorialHeader } from "@/app/website";
import {
  Scale,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileDown,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntryStatus = "done" | "current" | "pending";

interface TimelineEvent {
  id: number;
  date: string;
  time?: string;
  title: string;
  description: string;
  status: EntryStatus;
  documentLabel?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PROCESS_NUMBER = "0001234-55.2024.5.03.0001";
const PROCESS_TITLE = "Rescisão Indireta — João Silva vs Empresa XYZ";

const EVENTS: TimelineEvent[] = [
  {
    id: 1,
    date: "15/01/2024",
    time: "09:32",
    title: "Petição Inicial Protocolada",
    description:
      "A petição inicial foi protocolada eletronicamente pelo sistema PJe com pedido de rescisão indireta fundado no art. 483 da CLT, incluindo todos os pleitos de verbas rescisórias, FGTS com multa de 40%, aviso prévio indenizado e indenizações por danos morais.",
    status: "done",
    documentLabel: "Petição Inicial.pdf",
  },
  {
    id: 2,
    date: "28/01/2024",
    time: "14:15",
    title: "Despacho de Recebimento",
    description:
      "O juízo recebeu a petição inicial, determinou a citação da parte ré para audiência de conciliação e fixou prazo para a contestação. O processo foi distribuído à 1ª Vara do Trabalho de Belo Horizonte.",
    status: "done",
    documentLabel: "Despacho 28-01-2024.pdf",
  },
  {
    id: 3,
    date: "20/02/2024",
    time: "10:00",
    title: "Audiência de Conciliação",
    description:
      "Realizada audiência de conciliação inaugural. A parte ré compareceu devidamente representada. Frustrada a tentativa de conciliação, foi apresentada contestação com documentos. O juízo designou perícia técnica para apuração dos fatos alegados na inicial.",
    status: "done",
    documentLabel: "Ata de Conciliação.pdf",
  },
  {
    id: 4,
    date: "15/03/2024",
    time: "11:45",
    title: "Perícia Técnica Agendada",
    description:
      "Nomeado perito contábil de confiança do juízo. Intimadas as partes para indicação de assistentes técnicos e quesitos no prazo de 15 dias. A perícia foi agendada para realização nas dependências da empresa reclamada, com acesso aos livros fiscais e contracheques.",
    status: "done",
  },
  {
    id: 5,
    date: "10/04/2024",
    time: "—",
    title: "Laudo Pericial Apresentado",
    description:
      "O perito nomeado apresentou laudo parcial com análise dos contracheques e registros de ponto. O laudo apurou irregularidades nos pagamentos e constatou mora salarial em três competências. As partes têm 10 dias para apresentar impugnação ou esclarecimentos complementares.",
    status: "current",
    documentLabel: "Laudo Pericial Parcial.pdf",
  },
  {
    id: 6,
    date: "15/05/2024",
    time: "Previsão",
    title: "Audiência de Instrução",
    description:
      "Audiência de instrução e julgamento a ser realizada perante o(a) MM. Juiz(a) Titular. Serão ouvidas as testemunhas arroladas pelas partes (até 3 por lado) e procedida a coleta dos depoimentos pessoais dos representantes das partes. O rol de testemunhas deve ser protocolado com 48h de antecedência.",
    status: "pending",
  },
  {
    id: 7,
    date: "Previsão Jun/2024",
    time: "—",
    title: "Sentença",
    description:
      "Encerrada a instrução processual, o processo será remetido ao juízo para prolação de sentença. A previsão é de publicação em até 30 dias após a audiência de instrução. Após a sentença, as partes têm 8 dias para interposição de recurso ordinário.",
    status: "pending",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dotBg(status: EntryStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-400 ring-emerald-400/20";
    case "current":
      return "bg-primary ring-primary/20";
    case "pending":
      return "bg-outline-variant border-2 border-outline ring-transparent";
  }
}

function statusBadgeClass(status: EntryStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "current":
      return "bg-primary/10 text-primary border-primary/20";
    case "pending":
      return "bg-surface-container-high text-on-surface-variant border-outline-variant";
  }
}

function statusBadgeLabel(status: EntryStatus): string {
  switch (status) {
    case "done":
      return "Concluído";
    case "current":
      return "Em andamento";
    case "pending":
      return "Pendente";
  }
}

function StatusIcon({ status }: { status: EntryStatus }) {
  if (status === "done")
    return <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />;
  if (status === "current")
    return (
      <Clock
        className="w-3.5 h-3.5 animate-pulse"
        aria-hidden="true"
      />
    );
  return <Clock className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Timeline event card
// ---------------------------------------------------------------------------

function TimelineEventCard({
  event,
  index,
  isLast,
}: {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
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
          <div className="w-px flex-1 bg-white/5 mt-2 min-h-12" />
        )}
      </div>

      {/* Card */}
      <div
        className={`flex-1 min-w-0 mb-8 bg-surface-container rounded-xl border p-5 transition-colors hover:border-white/10 ${
          event.status === "current"
            ? "border-primary/20"
            : "border-white/5"
        }`}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-mono text-xs text-on-surface-variant/60 mb-1">
              {event.date}
              {event.time && event.time !== "—" && event.time !== "Previsão" && (
                <span> · {event.time}</span>
              )}
              {event.time === "Previsão" && (
                <span className="ml-1.5 text-on-surface-variant/40">(previsão)</span>
              )}
            </p>
            <h3
              className={`font-headline font-extrabold text-lg tracking-tight leading-snug ${
                event.status === "pending"
                  ? "text-on-surface-variant"
                  : "text-on-surface"
              }`}
            >
              {event.title}
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
              ? "text-on-surface-variant/60"
              : "text-on-surface-variant"
          }`}
        >
          {event.description}
        </p>

        {/* Document link */}
        {event.documentLabel && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              aria-label={`Baixar ${event.documentLabel}`}
            >
              <FileDown className="w-3.5 h-3.5" />
              {event.documentLabel}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProcessTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const doneCount = EVENTS.filter((e) => e.status === "done").length;
  const totalCount = EVENTS.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  return (
    <>
      {/* Back navigation */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant -mt-2 mb-2">
        <Link
          href="/portal/processos"
          className="font-semibold hover:text-on-surface transition-colors"
        >
          Processos
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
        <Link
          href={`/portal/processos/${id}`}
          className="font-semibold hover:text-on-surface transition-colors"
        >
          Detalhes
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
        <span className="font-semibold text-on-surface">Timeline</span>
      </nav>

      {/* Editorial header */}
      <EditorialHeader
        kicker="TIMELINE"
        title="Movimentações."
        actions={
          <Link
            href={`/portal/processos/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container border border-white/10 text-sm font-semibold hover:bg-surface-container-highest hover:border-white/20 transition-all group"
            aria-label="Voltar para detalhes do processo"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Voltar ao processo
          </Link>
        }
      />

      {/* Process summary strip */}
      <div
        className="bg-surface-container rounded-xl border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: "400ms", animationFillMode: "both" }}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-extrabold text-base tracking-tight leading-snug truncate">
            {PROCESS_TITLE}
          </p>
          <p className="font-mono text-xs text-on-surface-variant/60 mt-0.5">
            {PROCESS_NUMBER}
          </p>
        </div>

        {/* Progress */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <p className="text-xs font-bold text-on-surface-variant">
            {doneCount} de {totalCount} etapas concluídas
          </p>
          <div className="w-40 h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% concluído`}
            />
          </div>
        </div>
      </div>

      {/* Full timeline */}
      <ol
        className="mt-2"
        aria-label="Lista de movimentações processuais"
      >
        {EVENTS.map((event, index) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            index={index}
            isLast={index === EVENTS.length - 1}
          />
        ))}
      </ol>
    </>
  );
}
