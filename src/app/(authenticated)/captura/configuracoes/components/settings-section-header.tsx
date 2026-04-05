import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: SettingsSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/20 bg-white/3">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground/70 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
