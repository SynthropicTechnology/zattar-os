import { Wifi, WifiOff, WifiHigh, WifiLow } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSemanticBadgeVariant, type BadgeVisualVariant } from '@/lib/design-system';

interface NetworkQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  score: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * Maps network quality to semantic text color classes.
 * Uses design system's network_quality category for consistency.
 */
function getNetworkQualityColor(quality: 'excellent' | 'good' | 'poor' | 'unknown'): string {
  const variant = getSemanticBadgeVariant('network_quality', quality);

  const colorMap: Record<BadgeVisualVariant, string> = {
    success: 'text-green-500',
    info: 'text-blue-500',
    destructive: 'text-red-500',
    neutral: 'text-gray-500',
    warning: 'text-orange-500',
    default: 'text-gray-500',
    secondary: 'text-gray-500',
    outline: 'text-gray-500',
    accent: 'text-purple-500',
  };

  return colorMap[variant] || 'text-gray-500';
}

export function NetworkQualityIndicator({
  quality,
  score,
  showLabel = false,
  className
}: NetworkQualityIndicatorProps) {

  const getQualityConfig = () => {
    switch (quality) {
      case 'excellent':
        return {
          icon: Wifi,
          color: getNetworkQualityColor('excellent'),
          label: 'Conexão Excelente',
          description: 'Áudio e vídeo em alta qualidade'
        };
      case 'good':
        return {
          icon: WifiHigh,
          color: getNetworkQualityColor('good'),
          label: 'Conexão Boa',
          description: 'Pode haver pequenas instabilidades'
        };
      case 'poor':
        return {
          icon: WifiLow,
          color: getNetworkQualityColor('poor'),
          label: 'Conexão Instável',
          description: 'Recomendado desativar vídeo'
        };
      case 'unknown':
      default:
        return {
          icon: WifiOff,
          color: getNetworkQualityColor('unknown'),
          label: 'Verificando conexão...',
          description: 'Aguardando dados da rede'
        };
    }
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  if (quality === 'unknown' && score === -1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 cursor-help", className)}>
            <Icon 
              className={cn(
                "w-5 h-5 transition-colors duration-300", 
                config.color,
                quality === 'poor' && "animate-pulse"
              )} 
            />
            {showLabel && (
              <span className={cn("text-xs font-medium hidden md:inline-block", config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {score >= 0 && <p className="text-xs opacity-70">Score: {score}/5</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
