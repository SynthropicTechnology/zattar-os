'use client';

import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ALL_NAV_ITEMS, type SettingsTab } from './settings-nav-items';

interface SettingsMobileNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsMobileNav({ activeTab, onTabChange }: SettingsMobileNavProps) {
  return (
    <div className="md:hidden">
      <ScrollArea className="w-full">
        <GlassPanel className="flex-row gap-1 p-1 rounded-xl">
          {ALL_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-white/5 text-foreground'
                    : 'text-muted-foreground hover:bg-white/4'
                )}
              >
                <item.icon className={cn('size-3.5', isActive ? 'text-primary' : 'text-muted-foreground/50')} />
                {item.label}
              </button>
            );
          })}
        </GlassPanel>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
