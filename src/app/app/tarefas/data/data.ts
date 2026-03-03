import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Circle,
  Timer,
  XCircle,
  Bug,
  Lightbulb,
  BookOpen,
  Gavel,
  FileText,
  Microscope,
  CircleDollarSign,
} from "lucide-react";

export const statuses = [
  { value: "backlog", label: "Backlog", icon: Circle },
  { value: "todo", label: "A Fazer", icon: Circle },
  { value: "in progress", label: "Em Progresso", icon: Timer },
  { value: "done", label: "Concluído", icon: CheckCircle2 },
  { value: "canceled", label: "Cancelado", icon: XCircle },
];

export const priorities = [
  { value: "low", label: "Baixa", icon: ArrowDown },
  { value: "medium", label: "Média", icon: ArrowRight },
  { value: "high", label: "Alta", icon: ArrowUp },
];

export const labels = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "feature", label: "Funcionalidade", icon: Lightbulb },
  { value: "documentation", label: "Documentação", icon: BookOpen },
  { value: "audiencia", label: "Audiência", icon: Gavel },
  { value: "expediente", label: "Expediente", icon: FileText },
  { value: "pericia", label: "Perícia", icon: Microscope },
  { value: "obrigacao", label: "Obrigação", icon: CircleDollarSign },
];
