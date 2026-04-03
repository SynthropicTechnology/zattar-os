"use client";

import { useState } from "react";
import { EditorialHeader } from "@/app/website";
import {
  CalendarPlus,
  Video,
  Clock,
  MapPin,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type AppointmentType = "Presencial" | "Videoconferência";

interface Appointment {
  id: number;
  title: string;
  specialist: string;
  day: number;
  month: string;
  monthIndex: number; // 0-based month for calendar matching
  year: number;
  time: string;
  type: AppointmentType;
}

interface PastConsultation {
  id: number;
  title: string;
  specialist: string;
  dateLabel: string;
}

const UPCOMING: Appointment[] = [
  {
    id: 1,
    title: "Audiência Trabalhista",
    specialist: "Dra. Carolina Zattar",
    day: 28,
    month: "MAR",
    monthIndex: 2,
    year: 2026,
    time: "14:00",
    type: "Presencial",
  },
  {
    id: 2,
    title: "Revisão de Contrato",
    specialist: "Dr. Felipe Andrade",
    day: 2,
    month: "ABR",
    monthIndex: 3,
    year: 2026,
    time: "10:30",
    type: "Videoconferência",
  },
  {
    id: 3,
    title: "Consulta Inicial",
    specialist: "Dra. Marina Costa",
    day: 8,
    month: "ABR",
    monthIndex: 3,
    year: 2026,
    time: "16:00",
    type: "Presencial",
  },
];

const PAST: PastConsultation[] = [
  {
    id: 1,
    title: "Depoimento Preparatório",
    specialist: "Dr. Felipe Andrade",
    dateLabel: "15 de Mar • 2026",
  },
  {
    id: 2,
    title: "Análise Documental",
    specialist: "Dra. Carolina Zattar",
    dateLabel: "08 de Mar • 2026",
  },
  {
    id: 3,
    title: "Orientação Trabalhista",
    specialist: "Dra. Marina Costa",
    dateLabel: "01 de Mar • 2026",
  },
];

// Today reference (matches system date: 2026-03-25)
const TODAY_YEAR = 2026;
const TODAY_MONTH = 2; // March (0-based)
const TODAY_DAY = 25;

function isAppointmentToday(appt: Appointment) {
  return (
    appt.day === TODAY_DAY &&
    appt.monthIndex === TODAY_MONTH &&
    appt.year === TODAY_YEAR
  );
}

// Future video appointments whose link is not yet active
// (more than 1 day away → show "link available in N days" message)
function videoLinkDaysUntilAvailable(appt: Appointment): number | null {
  if (appt.type !== "Videoconferência") return null;
  const apptDate = new Date(appt.year, appt.monthIndex, appt.day);
  const today = new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DAY);
  const diffMs = apptDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 1 ? diffDays : null;
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function buildCalendarGrid(year: number, month: number) {
  // month is 0-based
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];

  // Leading padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  // Trailing padding to complete last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      cells.push({ day: d, current: false });
    }
  }

  return cells;
}

// Days in the visible month that have upcoming appointments
function appointmentDaysInMonth(year: number, month: number): Set<number> {
  return new Set(
    UPCOMING.filter((a) => a.monthIndex === month && a.year === year).map(
      (a) => a.day
    )
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: AppointmentType }) {
  if (type === "Presencial") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <MapPin className="w-3 h-3" />
        Presencial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-info/10 text-info border border-info/20">
      <Video className="w-3 h-3" />
      Videoconferência
    </span>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const today = isAppointmentToday(appt);
  const linkDays = videoLinkDaysUntilAvailable(appt);

  return (
    <div className="group relative bg-surface-container rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row items-start gap-6">
      {/* "Hoje" badge — top-right corner */}
      {today && (
        <span className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Hoje
        </span>
      )}

      {/* Date box */}
      <div className="shrink-0 bg-primary/10 rounded-xl p-4 text-center w-18">
        <span className="text-2xl font-black font-headline text-primary block leading-none">
          {appt.day}
        </span>
        <span className="text-xs uppercase tracking-widest text-primary/70 mt-1 block">
          {appt.month}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-bold font-headline tracking-tight text-on-surface group-hover:text-primary transition-colors mb-1">
          {appt.title}
        </h4>
        <p className="text-sm text-on-surface-variant mb-3">
          {appt.specialist}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant">
            <Clock className="w-3.5 h-3.5" />
            {appt.time}
          </span>
          <TypeBadge type={appt.type} />
          {linkDays !== null && (
            <span className="text-on-surface-variant text-xs flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              Link disponível em {linkDays} dias
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {appt.type === "Videoconferência" && linkDays === null && (
          <button
            aria-label="Entrar na videochamada"
            className="p-2 rounded-lg hover:bg-info/10 text-on-surface-variant hover:text-info transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
        )}
        <button
          aria-label="Editar agendamento"
          className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          aria-label="Mais opções"
          className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PastConsultationItem({ item }: { item: PastConsultation }) {
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-xl border border-white/5 bg-surface-container hover:border-white/10 transition-all duration-200">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-500/50 mt-0.5 shrink-0 group-hover:text-emerald-400 transition-colors" />
        <div>
          <p className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">
            {item.title}
          </p>
          <p className="text-xs text-on-surface-variant/60 mt-0.5">
            {item.dateLabel} &bull; {item.specialist}
          </p>
        </div>
      </div>
      <div className="ml-8 sm:ml-0 flex flex-col items-start sm:items-end gap-1.5 shrink-0">
        <span className="text-xs font-bold text-on-surface-variant/40 bg-white/5 px-3 py-1.5 rounded-lg">
          Concluída
        </span>
        <button className="text-primary text-xs font-semibold hover:underline cursor-pointer">
          Ver Resumo
        </button>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const [viewYear, setViewYear] = useState(TODAY_YEAR);
  const [viewMonth, setViewMonth] = useState(TODAY_MONTH);

  const cells = buildCalendarGrid(viewYear, viewMonth);
  const eventDays = appointmentDaysInMonth(viewYear, viewMonth);

  const isToday = (day: number, current: boolean) =>
    current &&
    day === TODAY_DAY &&
    viewMonth === TODAY_MONTH &&
    viewYear === TODAY_YEAR;

  function prev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function next() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="bg-surface-container rounded-xl p-6 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-bold font-headline text-on-surface">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prev}
            aria-label="Mês anterior"
            className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo mês"
            className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center mb-2">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span
            key={i}
            className="text-[10px] font-black tracking-widest text-on-surface-variant/40 py-1"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {cells.map((cell, i) => {
          const today = isToday(cell.day, cell.current);
          const hasEvent = cell.current && eventDays.has(cell.day);

          return (
            <button
              key={i}
              disabled={!cell.current}
              aria-label={
                cell.current
                  ? `${cell.day} de ${MONTH_NAMES[viewMonth]}`
                  : undefined
              }
              className={[
                "relative flex flex-col items-center justify-center w-full aspect-square rounded-full text-xs font-medium transition-colors",
                !cell.current
                  ? "text-on-surface-variant/20 cursor-default"
                  : today
                  ? "bg-primary text-on-primary-fixed font-bold"
                  : hasEvent
                  ? "text-on-surface ring-2 ring-primary/30 hover:bg-primary/10"
                  : "text-on-surface-variant hover:bg-white/5 cursor-pointer",
              ].join(" ")}
            >
              {cell.day}
              {hasEvent && !today && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpecialistCard() {
  return (
    <div className="glass-card rounded-xl p-6 border border-white/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-5">
        Seu Especialista
      </p>
      <div className="flex items-center gap-4 mb-5">
        {/* Avatar placeholder */}
        <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-white/10">
          <User className="w-7 h-7 text-on-surface-variant/50" />
        </div>
        <div>
          <p className="font-bold text-on-surface font-headline leading-tight">
            Dra. Carolina Zattar
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Direito Trabalhista
          </p>
        </div>
      </div>

      <div className="h-px bg-white/5 mb-4" />

      <div className="flex flex-col gap-2.5 mb-5">
        {[
          { label: "Consultas realizadas", value: "12" },
          { label: "Próxima consulta", value: "28 Mar" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">{label}</span>
            <span className="text-xs font-bold text-on-surface">{value}</span>
          </div>
        ))}
      </div>

      <button className="w-full text-xs font-bold text-primary hover:text-on-surface transition-colors flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-primary/10 border border-primary/20">
        Ver perfil completo
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgendamentosPage() {
  return (
    <>
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EditorialHeader
          kicker="AGENDAMENTOS"
          title="Consultas."
          actions={
            <Button className="gap-2">
              <CalendarPlus className="w-4 h-4" />
              Agendar Consulta
            </Button>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Left column                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          {/* Upcoming */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/50 mb-4 flex items-center gap-3">
              <span className="w-2 h-5 bg-primary rounded-full" />
              Próximas Consultas
            </h3>
            <div className="space-y-3">
              {UPCOMING.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          </section>

          {/* History */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/50 mb-4 flex items-center gap-3">
              <span className="w-2 h-5 bg-on-surface-variant/20 rounded-full" />
              Histórico de Consultas
            </h3>
            <div className="space-y-2">
              {PAST.map((item) => (
                <PastConsultationItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right column                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <MiniCalendar />
          <SpecialistCard />
        </div>
      </div>
    </>
  );
}
