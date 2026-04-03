import { AppBadge as Badge } from "@/components/ui/app-badge";
import {
  STATUS_PROJETO_LABELS,
  STATUS_PROJETO_COLORS,
  STATUS_TAREFA_LABELS,
  STATUS_TAREFA_COLORS,
  type StatusProjeto,
  type StatusTarefa,
} from "../../lib/domain";

interface ProjectStatusBadgeProps {
  status: StatusProjeto;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  return (
    <Badge className={`${STATUS_PROJETO_COLORS[status]} ${className ?? ""}`}>
      {STATUS_PROJETO_LABELS[status]}
    </Badge>
  );
}

interface TaskStatusBadgeProps {
  status: StatusTarefa;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge className={`${STATUS_TAREFA_COLORS[status]} ${className ?? ""}`}>
      {STATUS_TAREFA_LABELS[status]}
    </Badge>
  );
}
