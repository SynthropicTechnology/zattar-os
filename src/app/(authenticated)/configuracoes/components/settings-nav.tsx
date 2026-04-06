'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  SETTINGS_NAV_GROUPS,
  SETTINGS_EXTERNAL_LINKS,
  type SettingsTab,
} from './settings-nav-items';

interface SettingsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <nav className="w-55 shrink-0 hidden md:block">
      <GlassPanel className="p-3 sticky top-4 self-start">
        <div className="space-y-4">
          {SETTINGS_NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-heading font-semibold px-3 py-2 block">
                {group.label}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'bg-white/5 text-foreground border-l-2 border-primary font-medium'
                          : 'text-muted-foreground/80 hover:bg-white/4 hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive ? 'text-primary' : 'text-muted-foreground/50'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {SETTINGS_EXTERNAL_LINKS.length > 0 && (
          <>
            <Separator className="my-3 bg-border/20" />
            <div className="space-y-0.5">
              {SETTINGS_EXTERNAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground/80 hover:bg-white/4 hover:text-foreground transition-all duration-200"
                >
                  <link.icon className="size-4 shrink-0 text-muted-foreground/50" />
                  <span className="truncate">{link.label}</span>
                  <ArrowUpRight className="size-3 ml-auto text-muted-foreground/40" />
                </Link>
              ))}
            </div>
          </>
        )}
      </GlassPanel>
    </nav>
  );
}
