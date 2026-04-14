import type { CSSProperties } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { GlassPanel } from "@/components/shared/glass-panel";
import { Heading, Text } from "@/components/ui/typography";

import { SidebarSection, ProfileData } from "../../configs/types";

interface ProfileSidebarProps {
  sections: SidebarSection[];
  data: ProfileData;
  showProgress?: boolean;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

// Calculate profile completion based on filled fields
function calculateProfileCompletion(sections: SidebarSection[], data: ProfileData): number {
  let totalFields = 0;
  let filledFields = 0;

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      totalFields++;
      const value = getNestedValue(data, field.valuePath);
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    });
  });

  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
}

export function ProfileSidebar({ sections, data, showProgress = false }: ProfileSidebarProps) {
  const profileCompletion = calculateProfileCompletion(sections, data);

  const sectionHasVisibleFields = (section: SidebarSection): boolean => {
    return section.fields.some((field) => {
      const value = getNestedValue(data, field.valuePath);
      return value !== null && value !== undefined && value !== '';
    });
  };

  const progressStyle: CSSProperties = {
    width: `${profileCompletion}%`,
    background: 'var(--tipo-color, var(--primary))',
  };

  return (
    <div className="space-y-4">
      {/* Progress card */}
      {showProgress && (
        <GlassPanel depth={2} className="p-4">
          <Text variant="overline" className="mb-3 block">
            Completude do perfil
          </Text>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={progressStyle} />
            </div>
            <Text variant="meta-label" className="tabular-nums">
              {profileCompletion}%
            </Text>
          </div>
        </GlassPanel>
      )}

      {/* Profile sections card */}
      <GlassPanel depth={1} className="p-5">
        <div className="space-y-6">
          <Heading level="subsection">Perfil</Heading>

          <div className="space-y-4 lg:space-y-8">
            {sections.map((section, idx) => {
              if (!sectionHasVisibleFields(section)) {
                return null;
              }

              return (
                <div key={idx}>
                  <Text variant="overline" className="mb-3 block">
                    {section.title}
                  </Text>
                  <div className="space-y-3">
                    {section.fields.map((field, fIdx) => {
                      const value = getNestedValue(data, field.valuePath);
                      if (value === null || value === undefined || value === '') return null;

                      const Icon = field.icon;
                      let displayValue = value;

                      if (field.type === 'date') {
                        try {
                          displayValue = format(
                            new Date(value as string | number | Date),
                            "dd/MM/yyyy",
                            { locale: ptBR },
                          );
                        } catch {
                          displayValue = String(value);
                        }
                      }

                      return (
                        <div key={fIdx} className="flex items-center gap-3 text-sm">
                          {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
                          <span className="wrap-break-word text-sm">{String(displayValue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
