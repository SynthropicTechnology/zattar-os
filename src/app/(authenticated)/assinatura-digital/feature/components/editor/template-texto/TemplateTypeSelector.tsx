'use client';

import { FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/typography';

export type TemplateType = 'pdf' | 'texto';

interface TemplateTypeSelectorProps {
  value: TemplateType;
  onChange: (type: TemplateType) => void;
  disabled?: boolean;
}

interface TemplateTypeOption {
  type: TemplateType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const templateTypes: TemplateTypeOption[] = [
  {
    type: 'pdf',
    title: 'Upload de PDF',
    description: 'Faça upload de um documento PDF existente e mapeie campos para preenchimento automático',
    icon: Upload,
  },
  {
    type: 'texto',
    title: 'Documento de Texto',
    description: 'Crie um documento de texto do zero com formatação e variáveis dinâmicas',
    icon: FileText,
  },
];

/**
 * Component for selecting template type (PDF upload vs Text document)
 */
export function TemplateTypeSelector({
  value,
  onChange,
  disabled = false,
}: TemplateTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {templateTypes.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => !disabled && onChange(option.type)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-input bg-background',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                'absolute right-3 top-3 h-4 w-4 rounded-full border-2 transition-colors',
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/50'
              )}
            >
              {isSelected && (
                <div className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Icon */}
            <div
              className={cn(
                'rounded-lg p-2',
                isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="space-y-1 pr-6">
              <Heading level="subsection">{option.title}</Heading>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default TemplateTypeSelector;
