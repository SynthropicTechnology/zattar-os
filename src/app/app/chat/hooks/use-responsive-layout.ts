import { useViewport } from "@/hooks/use-viewport";
import { useEffect, useState } from "react";

interface LayoutConfig {
  columns: number;
  showSidebar: boolean;
  controlSize: "sm" | "md" | "lg";
  gridClasses: string;
}

export function useResponsiveLayout(participantCount: number) {
  const { width } = useViewport();
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    columns: 1,
    showSidebar: false,
    controlSize: "sm",
    gridClasses: "grid-cols-1",
  });

  useEffect(() => {
    let columns = 1;
    let showSidebar = false;
    let controlSize: "sm" | "md" | "lg" = "sm";

    if (width >= 1024) {
      // Desktop
      controlSize = "lg";
      showSidebar = true;
      if (participantCount <= 1) columns = 1;
      else if (participantCount <= 4) columns = 2;
      else if (participantCount <= 9) columns = 3;
      else columns = 4;
    } else if (width >= 640) {
      // Tablet
      controlSize = "md";
      showSidebar = false; // Collapsible on tablet
      if (participantCount <= 2) columns = 1;
      else if (participantCount <= 4) columns = 2;
      else columns = 2; // Max 2 cols on tablet typically
    } else {
      // Mobile
      controlSize = "sm";
      showSidebar = false;
      columns = 1;
    }

    // Determine grid classes based on columns
    let gridClasses = "grid-cols-1";
    if (columns === 2) gridClasses = "grid-cols-1 sm:grid-cols-2";
    if (columns === 3) gridClasses = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (columns === 4) gridClasses = "grid-cols-2 lg:grid-cols-4";

    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      setLayoutConfig({
        columns,
        showSidebar,
        controlSize,
        gridClasses,
      });
    }, 0);
  }, [width, participantCount]);

  return layoutConfig;
}
