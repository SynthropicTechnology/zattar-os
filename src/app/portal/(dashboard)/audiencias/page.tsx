import { EditorialHeader } from "@/app/website";
import {
  Calendar,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";

interface Audiencia {
  id: string;
  processo: string;
  vara: string;
  dataHora: string;
  local: string;
  tipo: string;
  status: "Agendada" | "Realizada" | "Adiada";
}

const mockAudiencias: Audiencia[] = [
  {
    id: "1",
    processo: "0012345-67.2024.8.26.0100",
    vara: "1ª Vara Cível — Foro Central",
    dataHora: "28 Mar 2026, 09:30",
    local: "Sala 302, Bloco B",
    tipo: "Audiência de Conciliação",
    status: "Agendada",
  },
  {
    id: "2",
    processo: "0098765-43.2023.8.26.0050",
    vara: "3ª Vara do Trabalho — TRT 2ª Região",
    dataHora: "02 Abr 2026, 14:00",
    local: "Sala 11, Térreo",
    tipo: "Audiência Instrução e Julgamento",
    status: "Agendada",
  },
  {
    id: "3",
    processo: "0054321-89.2023.8.26.0100",
    vara: "5ª Vara de Família — Foro Central",
    dataHora: "10 Mar 2026, 10:00",
    local: "Sala 501, Bloco A",
    tipo: "Audiência de Mediação",
    status: "Realizada",
  },
  {
    id: "4",
    processo: "0011223-44.2024.8.26.0200",
    vara: "2ª Vara Criminal — Foro Regional",
    dataHora: "15 Mar 2026, 15:30",
    local: "Sala 210, Bloco C",
    tipo: "Audiência de Custódia",
    status: "Adiada",
  },
  {
    id: "5",
    processo: "0077889-12.2025.8.26.0100",
    vara: "7ª Vara Cível — Foro Central",
    dataHora: "05 Abr 2026, 11:00",
    local: "Sala 705, Bloco A",
    tipo: "Audiência de Julgamento",
    status: "Agendada",
  },
];

const statusConfig = {
  Agendada: {
    className: "bg-primary/10 text-primary",
    label: "Agendada",
  },
  Realizada: {
    className: "bg-emerald-500/10 text-emerald-400",
    label: "Realizada",
  },
  Adiada: {
    className: "bg-amber-500/10 text-amber-500",
    label: "Adiada",
  },
} satisfies Record<Audiencia["status"], { className: string; label: string }>;

export default function AudienciasPage() {
  return (
    <>
      <EditorialHeader kicker="AUDIÊNCIAS" title="Audiências." />

      <div className="space-y-4">
        {mockAudiencias.map((audiencia) => {
          const status = statusConfig[audiencia.status];
          return (
            <div
              key={audiencia.id}
              className="bg-surface-container rounded-xl p-6 border border-white/5 flex flex-col md:flex-row md:items-center gap-6"
            >
              {/* Date block */}
              <div className="flex items-center gap-3 shrink-0 min-w-48">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {audiencia.dataHora.split(",")[0]}
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    {audiencia.dataHora.split(",")[1]?.trim()}
                  </p>
                </div>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {audiencia.tipo}
                </p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {audiencia.processo}
                </p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {audiencia.vara} — {audiencia.local}
                </p>
              </div>

              {/* Status badge */}
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
