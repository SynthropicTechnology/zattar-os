"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Building2,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Coffee,
  Brain,
  ArrowRight,
  ExternalLink,
  Gavel,
  Timer,
  Briefcase,
  Sun,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GlassPanel,
} from "@/app/app/dashboard/mock/widgets/primitives";

// ============================================================================
// AGENDA MOCK — "Daily Command Center"
// ============================================================================
// Acesse em: /app/agenda/mock
// Conceito: A agenda não é uma grade de horários — é um briefing operacional.
// O advogado abre e entende em 3 segundos: intensidade, preparação, riscos.
// ============================================================================

// ─── Types ─────────────────────────────────────────────────────────────

type EventType = "audiencia" | "reuniao" | "prazo" | "pericia" | "pessoal";
type Modalidade = "presencial" | "virtual" | "hibrida";
type PrepStatus = "preparado" | "parcial" | "pendente";

interface PrepInfo {
  documentos: number;
  documentosProntos: number;
  testemunhas?: number;
  testemunhasConfirmadas?: number;
}

interface MockEvent {
  id: number;
  tipo: EventType;
  titulo: string;
  processo?: string;
  partes?: string;
  horaInicio: string;
  horaFim: string;
  local?: string;
  modalidade?: Modalidade;
  prepStatus?: PrepStatus;
  preparo?: PrepInfo;
  urgencia: "normal" | "atencao" | "critico";
  descricao?: string;
  trt?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────

const HOJE = new Date();
const DIA_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ─── Mock Data ─────────────────────────────────────────────────────────

const MOCK_EVENTS: MockEvent[] = [
  {
    id: 1,
    tipo: "audiencia",
    titulo: "Audiência de Instrução e Julgamento",
    processo: "0001234-56.2024.5.02.0001",
    partes: "Maria A. Silva vs. Ind. Metalúrgica ABC Ltda.",
    horaInicio: "09:00",
    horaFim: "10:30",
    local: "TRT-2 — 1ª Vara do Trabalho de São Paulo",
    modalidade: "presencial",
    trt: "TRT-2",
    prepStatus: "preparado",
    preparo: { documentos: 4, documentosProntos: 4, testemunhas: 2, testemunhasConfirmadas: 2 },
    urgencia: "normal",
  },
  {
    id: 2,
    tipo: "audiencia",
    titulo: "Audiência de Conciliação",
    processo: "0005678-90.2024.5.02.0003",
    partes: "João C. Santos vs. Tech Solutions S.A.",
    horaInicio: "11:00",
    horaFim: "12:00",
    local: "Microsoft Teams",
    modalidade: "virtual",
    trt: "TRT-2",
    prepStatus: "parcial",
    preparo: { documentos: 5, documentosProntos: 2 },
    urgencia: "atencao",
  },
  {
    id: 3,
    tipo: "reuniao",
    titulo: "Reunião Estratégica — Caso Metalúrgica",
    horaInicio: "14:00",
    horaFim: "15:00",
    local: "Sala de Reuniões",
    modalidade: "presencial",
    urgencia: "normal",
    descricao: "Alinhar estratégia de defesa com equipe",
  },
  {
    id: 4,
    tipo: "prazo",
    titulo: "Contestação — Prazo Final",
    processo: "0009876-12.2024.5.15.0042",
    partes: "Construtora Delta vs. Roberto Mendes",
    horaInicio: "16:30",
    horaFim: "17:00",
    prepStatus: "pendente",
    preparo: { documentos: 3, documentosProntos: 0 },
    urgencia: "critico",
    descricao: "Prazo fatal — vence hoje às 23:59",
    trt: "TRT-15",
  },
  {
    id: 5,
    tipo: "audiencia",
    titulo: "Audiência UNA (Instrução + Julgamento)",
    processo: "0002468-33.2024.5.02.0012",
    partes: "Fernanda Oliveira vs. Rest. Sabor & Arte Ltda.",
    horaInicio: "15:30",
    horaFim: "16:30",
    local: "Pje — Videoconferência",
    modalidade: "virtual",
    trt: "TRT-2",
    prepStatus: "parcial",
    preparo: { documentos: 6, documentosProntos: 4, testemunhas: 3, testemunhasConfirmadas: 1 },
    urgencia: "atencao",
  },
];

const WEEK_PULSE = [
  { dia: "Seg", eventos: 5, horas: 6.5, hoje: true },
  { dia: "Ter", eventos: 3, horas: 4, hoje: false },
  { dia: "Qua", eventos: 7, horas: 8, hoje: false },
  { dia: "Qui", eventos: 2, horas: 2.5, hoje: false },
  { dia: "Sex", eventos: 4, horas: 5, hoje: false },
  { dia: "Sáb", eventos: 0, horas: 0, hoje: false },
  { dia: "Dom", eventos: 0, horas: 0, hoje: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, { color: string; bg: string; accent: string; icon: LucideIcon }> = {
  audiencia: { color: "text-primary", bg: "bg-primary/[0.06]", accent: "border-l-primary", icon: Gavel },
  reuniao: { color: "text-info", bg: "bg-info/[0.06]", accent: "border-l-info", icon: Briefcase },
  prazo: { color: "text-destructive", bg: "bg-destructive/[0.06]", accent: "border-l-destructive", icon: Timer },
  pericia: { color: "text-warning", bg: "bg-warning/[0.06]", accent: "border-l-warning", icon: Shield },
  pessoal: { color: "text-success", bg: "bg-success/[0.06]", accent: "border-l-success", icon: Coffee },
};

const PREP_CONFIG: Record<PrepStatus, { color: string; bg: string; label: string }> = {
  preparado: { color: "text-success", bg: "bg-success/10", label: "Preparado" },
  parcial: { color: "text-warning", bg: "bg-warning/10", label: "Parcial" },
  pendente: { color: "text-destructive", bg: "bg-destructive/10", label: "Pendente" },
};

function intensityColor(h: number) {
  if (h === 0) return "bg-border/8";
  if (h <= 3) return "bg-success/30";
  if (h <= 5) return "bg-primary/35";
  if (h <= 7) return "bg-warning/35";
  return "bg-destructive/35";
}

function intensityGlow(h: number) {
  if (h <= 3) return "";
  if (h <= 5) return "shadow-[0_0_6px_rgba(132,44,211,0.12)]";
  if (h <= 7) return "shadow-[0_0_6px_rgba(217,119,6,0.12)]";
  return "shadow-[0_0_6px_rgba(215,51,87,0.12)]";
}

// ============================================================================
// Components
// ============================================================================

/* ── Command Header (Stats + Week Pulse unified) ───────────────────── */

function CommandHeader() {
  const audiencias = MOCK_EVENTS.filter((e) => e.tipo === "audiencia").length;
  const pendentes = MOCK_EVENTS.filter(
    (e) => e.prepStatus === "pendente" || e.prepStatus === "parcial"
  ).length;
  const maxH = Math.max(...WEEK_PULSE.map((d) => d.horas), 1);

  return (
    <GlassPanel depth={2} className="p-4 sm:p-5">
      {/* Row 1: Stats */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-3 border-b border-border/10">
        {[
          { icon: Calendar, value: "5", label: "eventos", color: "text-primary" },
          { icon: Gavel, value: String(audiencias), label: "audiências", color: "text-primary" },
          { icon: Clock, value: "5h30", label: "ocupado", color: "text-warning" },
          { icon: Brain, value: "2h30", label: "foco livre", color: "text-success" },
          { icon: AlertTriangle, value: String(pendentes), label: "alertas", color: "text-destructive" },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 min-w-max">
            {i > 0 && <div className="w-px h-6 bg-border/8 shrink-0 -ml-2 mr-0 hidden sm:block" />}
            <s.icon className={cn("size-3 opacity-40 shrink-0", s.color)} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-sm font-bold tabular-nums">{s.value}</span>
              <span className="text-[9px] text-muted-foreground/35 hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Week Pulse */}
      <div className="flex items-end justify-between gap-1.5 sm:gap-2 pt-3">
        {WEEK_PULSE.map((day) => {
          const h = day.horas > 0 ? Math.max(12, (day.horas / maxH) * 100) : 6;
          return (
            <button
              key={day.dia}
              className="flex flex-col items-center gap-1 flex-1 group cursor-pointer transition-all duration-200"
            >
              <span className={cn(
                "text-[9px] tabular-nums font-medium",
                day.hoje ? "text-primary" : day.eventos > 0 ? "text-muted-foreground/40" : "text-muted-foreground/15",
              )}>
                {day.eventos || "–"}
              </span>
              <div
                className={cn(
                  "w-2.5 sm:w-3 rounded-full transition-all duration-500",
                  intensityColor(day.horas),
                  intensityGlow(day.horas),
                  day.hoje && "ring-1 ring-primary/25 ring-offset-1 ring-offset-transparent",
                )}
                style={{ height: `${h}%`, minHeight: 4, maxHeight: 36 }}
              />
              <span className={cn(
                "text-[9px] font-medium",
                day.hoje ? "text-primary font-semibold" : "text-muted-foreground/30",
              )}>
                {day.dia}
              </span>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

/* ── Daily Briefing ─────────────────────────────────────────────────── */

function DailyBriefing() {
  const audiencias = MOCK_EVENTS.filter((e) => e.tipo === "audiencia");
  const primeira = audiencias[0];
  const pendentes = MOCK_EVENTS.filter(
    (e) => e.prepStatus === "pendente" || e.prepStatus === "parcial"
  );
  const saudacao = HOJE.getHours() < 12 ? "Bom dia" : HOJE.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const total = MOCK_EVENTS.length;
  const intensidade = total <= 2 ? "leve" : total <= 4 ? "moderado" : "intenso";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/8 bg-primary/[0.02] px-4 py-3.5 sm:px-5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <div className="size-1.5 rounded-full bg-primary animate-pulse mt-2 shrink-0" />
        <p className="text-[13px] text-foreground/70 leading-relaxed">
          <span className="font-medium text-foreground">{saudacao}.</span>{" "}
          Dia{" "}
          <span className={cn(
            "font-medium",
            intensidade === "leve" ? "text-success" : intensidade === "moderado" ? "text-warning" : "text-destructive",
          )}>
            {intensidade}
          </span>
          {" "}com{" "}
          <span className="font-medium text-foreground">{audiencias.length} audiência{audiencias.length !== 1 ? "s" : ""}</span>
          {primeira && (
            <>
              . Primeira às{" "}
              <span className="font-medium text-foreground tabular-nums">{primeira.horaInicio}</span>
              {" "}no {primeira.trt}
              {primeira.modalidade === "presencial" && " (presencial)"}
              {primeira.modalidade === "virtual" && " (virtual)"}
            </>
          )}
          .{" "}
          {pendentes.length > 0 ? (
            <span className="text-warning/80 font-medium">{pendentes.length} evento{pendentes.length > 1 ? "s" : ""} precisa{pendentes.length > 1 ? "m" : ""} de preparo.</span>
          ) : (
            <span className="text-success/70">Tudo preparado.</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Phase Label ────────────────────────────────────────────────────── */

function PhaseLabel({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 first:pt-0">
      <Icon className="size-2.5 text-muted-foreground/15" />
      <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/20 font-semibold">{label}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

/* ── Focus Slot ─────────────────────────────────────────────────────── */

function FocusSlot({ inicio, fim, label }: { inicio: string; fim: string; label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-11 text-right text-[10px] tabular-nums text-muted-foreground/20 shrink-0">{inicio}</span>
      <div className="size-1.5 rounded-full border border-dashed border-success/25 shrink-0" />
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-success/10 bg-success/[0.015]">
        <Brain className="size-2.5 text-success/30" />
        <span className="text-[9px] text-success/40 font-medium">{label ?? "Foco"}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/15 ml-auto">{inicio}–{fim}</span>
      </div>
    </div>
  );
}

/* ── Travel Indicator ───────────────────────────────────────────────── */

function TravelSlot({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="w-11 shrink-0" />
      <MapPin className="size-1.5 text-warning/30 shrink-0" />
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-warning/[0.03] border border-warning/8">
        <MapPin className="size-2 text-warning/35" />
        <span className="text-[8px] text-warning/50 font-medium">~{minutes}min deslocamento</span>
      </div>
    </div>
  );
}

/* ── Break Slot ─────────────────────────────────────────────────────── */

function BreakSlot({ inicio, fim, label, icon: Icon }: { inicio: string; fim: string; label: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-11 text-right text-[10px] tabular-nums text-muted-foreground/15 shrink-0">{inicio}</span>
      <div className="size-1.5 rounded-full border border-dashed border-muted-foreground/10 shrink-0" />
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-muted-foreground/8 bg-muted/[0.01]">
        <Icon className="size-2.5 text-muted-foreground/20" />
        <span className="text-[9px] text-muted-foreground/20 font-medium">{label}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/10 ml-auto">{inicio}–{fim}</span>
      </div>
    </div>
  );
}

/* ── Now Line ───────────────────────────────────────────────────────── */

function NowLine() {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-3 py-0.5 -my-0.5 z-10 relative">
      <span className="w-11 text-right text-[10px] tabular-nums text-primary font-semibold shrink-0">{t}</span>
      <div className="size-2 rounded-full bg-primary shadow-[0_0_6px_rgba(132,44,211,0.35)] animate-pulse shrink-0" />
      <div className="flex-1 h-px bg-primary/25" />
    </div>
  );
}

/* ── Timeline Event Card ────────────────────────────────────────────── */

function EventCard({ event }: { event: MockEvent }) {
  const cfg = EVENT_CONFIG[event.tipo];
  const Icon = cfg.icon;
  const ModalIcon = event.modalidade === "virtual" || event.modalidade === "hibrida" ? Video : Building2;
  const prep = event.prepStatus ? PREP_CONFIG[event.prepStatus] : null;

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      {/* Time */}
      <div className="w-11 shrink-0 flex flex-col items-end pt-2.5">
        <span className="text-[11px] tabular-nums font-medium text-foreground/60">{event.horaInicio}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/25">{event.horaFim}</span>
      </div>

      {/* Dot */}
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn(
          "size-2 rounded-full border-[1.5px]",
          event.urgencia === "critico" ? "border-destructive bg-destructive/20"
            : event.urgencia === "atencao" ? "border-warning bg-warning/20"
            : "border-primary/35 bg-primary/10",
        )} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 rounded-xl border-l-[3px] p-3 transition-all duration-200 min-w-0",
        "border border-border/12 hover:border-border/20 hover:shadow-sm cursor-pointer",
        cfg.accent, cfg.bg,
      )}>
        {/* Row 1: Icon + Title + Prep badge */}
        <div className="flex items-start gap-2">
          <div className={cn("size-6 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
            <Icon className={cn("size-3", cfg.color)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-foreground truncate">{event.titulo}</h3>
              {prep && (
                <span className={cn("flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold shrink-0", prep.bg, prep.color)}>
                  {event.prepStatus === "preparado" ? <CheckCircle2 className="size-2" /> : event.prepStatus === "parcial" ? <Circle className="size-2" /> : <AlertTriangle className="size-2" />}
                  {prep.label}
                </span>
              )}
            </div>

            {/* Process number */}
            {event.processo && (
              <span className="text-[9px] font-mono text-muted-foreground/30 tabular-nums">{event.processo}</span>
            )}
          </div>
        </div>

        {/* Row 2: Partes or description */}
        {(event.partes || event.descricao) && (
          <p className="text-[10px] text-muted-foreground/40 mt-1 truncate ml-8">{event.partes ?? event.descricao}</p>
        )}

        {/* Row 3: Meta tags + prep counters */}
        <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
          {event.local && (
            <div className="flex items-center gap-1 max-w-48">
              <ModalIcon className="size-2 text-muted-foreground/25 shrink-0" />
              <span className="text-[9px] text-muted-foreground/30 truncate">{event.local}</span>
            </div>
          )}
          {event.trt && (
            <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/[0.05] text-primary/40">{event.trt}</span>
          )}
          {event.modalidade && (
            <span className={cn(
              "text-[8px] font-semibold px-1.5 py-px rounded",
              event.modalidade === "presencial" ? "bg-warning/8 text-warning/50" : "bg-info/8 text-info/50",
            )}>
              {event.modalidade === "presencial" ? "Presencial" : "Virtual"}
            </span>
          )}

          {/* Prep counters inline */}
          {event.preparo && (
            <>
              <div className="w-px h-3 bg-border/8 mx-0.5" />
              <div className="flex items-center gap-0.5">
                <FileText className="size-2 text-muted-foreground/20" />
                <span className={cn(
                  "text-[9px] tabular-nums",
                  event.preparo.documentosProntos === event.preparo.documentos ? "text-success/50" : "text-warning/50",
                )}>
                  {event.preparo.documentosProntos}/{event.preparo.documentos}
                </span>
              </div>
              {event.preparo.testemunhas !== undefined && event.preparo.testemunhas > 0 && (
                <div className="flex items-center gap-0.5">
                  <Users className="size-2 text-muted-foreground/20" />
                  <span className={cn(
                    "text-[9px] tabular-nums",
                    event.preparo.testemunhasConfirmadas === event.preparo.testemunhas ? "text-success/50" : "text-warning/50",
                  )}>
                    {event.preparo.testemunhasConfirmadas ?? 0}/{event.preparo.testemunhas}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Prep Radar Item ────────────────────────────────────────────────── */

function PrepRadarItem({ event }: { event: MockEvent }) {
  if (!event.preparo) return null;
  const pct = (event.preparo.documentosProntos / event.preparo.documentos) * 100;
  const cfg = EVENT_CONFIG[event.tipo];
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl border border-border/8 hover:border-border/15 transition-all cursor-pointer">
      <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("size-2.5", cfg.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-[10px] font-medium text-foreground truncate">{event.titulo}</h4>
          <span className="text-[9px] tabular-nums text-muted-foreground/30 shrink-0">{event.horaInicio}</span>
        </div>
        <div className="mt-1.5 h-0.5 rounded-full bg-border/8 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700",
              pct === 100 ? "bg-success/50" : pct >= 50 ? "bg-warning/50" : "bg-destructive/50",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] text-muted-foreground/25">{event.preparo.documentosProntos}/{event.preparo.documentos} docs</span>
          {event.preparo.testemunhas !== undefined && event.preparo.testemunhas > 0 && (
            <span className="text-[8px] text-muted-foreground/25">{event.preparo.testemunhasConfirmadas ?? 0}/{event.preparo.testemunhas} test.</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Alert Card ─────────────────────────────────────────────────────── */

function AlertCard({ icon: Icon, title, desc, variant = "warning" }: {
  icon: LucideIcon;
  title: string;
  desc: string;
  variant?: "warning" | "destructive" | "info";
}) {
  const c = {
    warning: { bg: "bg-warning/[0.03]", border: "border-warning/10", icon: "text-warning/50", title: "text-warning/70" },
    destructive: { bg: "bg-destructive/[0.03]", border: "border-destructive/10", icon: "text-destructive/50", title: "text-destructive/70" },
    info: { bg: "bg-info/[0.03]", border: "border-info/10", icon: "text-info/50", title: "text-info/70" },
  }[variant];

  return (
    <div className={cn("p-2.5 rounded-xl border flex items-start gap-2", c.bg, c.border)}>
      <Icon className={cn("size-3 mt-0.5 shrink-0", c.icon)} />
      <div className="min-w-0">
        <h4 className={cn("text-[10px] font-medium leading-tight", c.title)}>{title}</h4>
        <p className="text-[9px] text-muted-foreground/30 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function AgendaMockPage() {
  const eventsNeedPrep = MOCK_EVENTS.filter((e) => e.preparo && e.prepStatus !== "preparado");
  const dataFmt = `${DIA_SEMANA[HOJE.getDay()]}, ${HOJE.getDate()} de ${MESES[HOJE.getMonth()]}`;

  return (
    <div className="max-w-350 mx-auto space-y-4 pb-12">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{dataFmt}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronLeft className="size-4" />
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors cursor-pointer">
            Hoje
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Command Header (Stats + Week Pulse) ─────── */}
      <CommandHeader />

      {/* ── Briefing ─────────────────────────────────── */}
      <DailyBriefing />

      {/* ── Main Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

        {/* ── Timeline (5/7) ─────────────────────────── */}
        <div className="lg:col-span-5">
          <GlassPanel className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-muted-foreground/25" />
                <span className="text-[11px] font-medium text-muted-foreground/50">Linha do Tempo</span>
              </div>
              <div className="flex items-center gap-2.5">
                {(["audiencia", "reuniao", "prazo"] as EventType[]).map((t) => (
                  <div key={t} className="flex items-center gap-1">
                    <div
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: `hsl(var(--${t === "audiencia" ? "primary" : t === "reuniao" ? "info" : "destructive"}))`,
                        opacity: 0.35,
                      }}
                    />
                    <span className="text-[8px] text-muted-foreground/25">
                      {t === "audiencia" ? "Audiência" : t === "reuniao" ? "Reunião" : "Prazo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              <PhaseLabel label="Manhã" icon={Sun} />
              <FocusSlot inicio="08:00" fim="09:00" label="Preparação" />
              <EventCard event={MOCK_EVENTS[0]} />
              <TravelSlot minutes={25} />
              <EventCard event={MOCK_EVENTS[1]} />
              <NowLine />
              <BreakSlot inicio="12:00" fim="13:30" label="Intervalo" icon={Coffee} />

              <PhaseLabel label="Tarde" icon={Sunset} />
              <EventCard event={MOCK_EVENTS[2]} />
              <EventCard event={MOCK_EVENTS[4]} />
              <EventCard event={MOCK_EVENTS[3]} />
              <FocusSlot inicio="17:00" fim="18:30" label="Encerramento" />
            </div>
          </GlassPanel>
        </div>

        {/* ── Sidebar (2/7) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Prep Radar */}
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-3 text-warning/40" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Preparação</span>
              {eventsNeedPrep.length > 0 && (
                <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-full bg-warning/8 text-warning/50 font-semibold ml-auto">
                  {eventsNeedPrep.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {eventsNeedPrep.length > 0 ? (
                eventsNeedPrep.map((e) => <PrepRadarItem key={e.id} event={e} />)
              ) : (
                <div className="py-4 text-center">
                  <CheckCircle2 className="size-5 text-success/25 mx-auto mb-1.5" />
                  <p className="text-[10px] text-success/40 font-medium">Tudo pronto</p>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Alerts */}
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-3 text-destructive/40" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Alertas</span>
            </div>
            <div className="space-y-2">
              <AlertCard
                icon={Timer}
                title="Prazo fatal hoje"
                desc="Contestação Proc. 0009876-12.2024.5.15.0042 — vence às 23:59. 0/3 docs preparados."
                variant="destructive"
              />
              <AlertCard
                icon={FileText}
                title="3 docs pendentes"
                desc="Aud. Conciliação 11h — anexar ao processo antes da audiência."
                variant="warning"
              />
              <AlertCard
                icon={Users}
                title="Testemunha não confirmada"
                desc="2/3 testemunhas da Aud. UNA (15:30) sem confirmação."
                variant="warning"
              />
            </div>
          </GlassPanel>

          {/* Quick Actions */}
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="size-3 text-primary/40" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Ações</span>
            </div>
            <div className="space-y-0.5">
              {[
                { label: "Abrir PJe", icon: ExternalLink },
                { label: "Preparar peça", icon: FileText },
                { label: "Confirmar testemunhas", icon: Users },
                { label: "Pauta da semana", icon: Calendar },
              ].map((a) => (
                <button
                  key={a.label}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/4 transition-all cursor-pointer group"
                >
                  <a.icon className="size-2.5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                  {a.label}
                  <ArrowRight className="size-2 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
