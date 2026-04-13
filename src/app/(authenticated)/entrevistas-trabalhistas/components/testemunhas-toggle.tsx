'use client';

import { Users } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface TestemunhasToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function TestemunhasToggle({ checked, onCheckedChange }: TestemunhasToggleProps) {
  return (
    <GlassPanel className="flex items-center gap-3 p-4">
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className="flex flex-1 items-center gap-2">
        <Checkbox
          id="testemunhas"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        <Label htmlFor="testemunhas" className="cursor-pointer text-sm font-medium">
          Testemunhas foram mapeadas durante a entrevista
        </Label>
      </div>
    </GlassPanel>
  );
}
