import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Grid3x3, Focus, PanelRight } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSecureStorage } from "@/hooks/use-secure-storage";

export type LayoutType = 'grid' | 'spotlight' | 'sidebar';

const LAYOUT_STORAGE_KEY = 'call-layout';

interface LayoutSwitcherProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  const [savedLayout, setSavedLayout] = useSecureStorage<LayoutType>(
    LAYOUT_STORAGE_KEY,
    'grid',
    { migrateFromPlaintext: true }
  );

  useEffect(() => {
    if (savedLayout && ['grid', 'spotlight', 'sidebar'].includes(savedLayout)) {
      onLayoutChange(savedLayout);
    }
  }, [savedLayout, onLayoutChange]);

  // Handle layout change and persist to localStorage
  const handleLayoutChange = (layout: LayoutType) => {
    onLayoutChange(layout);
    setSavedLayout(layout);
  };
    
  return (
    <div className="absolute top-4 left-4 z-50 flex gap-1 bg-gray-900/80 backdrop-blur-md rounded-lg p-1 border border-gray-800">
      <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-gray-700", currentLayout === 'grid' && "bg-blue-600 text-white hover:bg-blue-700")}
                    onClick={() => handleLayoutChange('grid')}
                >
                    <Grid3x3 className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Grid</TooltipContent>
        </Tooltip>
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-gray-700", currentLayout === 'spotlight' && "bg-blue-600 text-white hover:bg-blue-700")}
                    onClick={() => handleLayoutChange('spotlight')}
                >
                    <Focus className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Destaque</TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 hover:bg-gray-700", currentLayout === 'sidebar' && "bg-blue-600 text-white hover:bg-blue-700")}
                    onClick={() => handleLayoutChange('sidebar')}
                >
                    <PanelRight className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Barra Lateral</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
