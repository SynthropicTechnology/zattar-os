"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { AnimatedIconTabs } from "@/components/ui/animated-icon-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FolderOpen } from "lucide-react";

type TabValue = "documentos" | "templates" | "formularios";

interface AssinaturaDigitalTabsContentProps {
  documentosContent?: React.ReactNode;
  templatesContent?: React.ReactNode;
  formulariosContent?: React.ReactNode;
  defaultTab?: TabValue;
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AssinaturaDigitalTabsContent({
  documentosContent,
  templatesContent,
  formulariosContent,
  defaultTab = "documentos",
}: AssinaturaDigitalTabsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "documentos" || tab === "templates" || tab === "formularios") {
      return tab;
    }
    return defaultTab;
  }, [searchParams, defaultTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const TABS_UI = useMemo(
    () => [
      { value: "documentos", label: "Documentos", icon: <FileText /> },
      { value: "templates", label: "Templates", icon: <FileText /> },
      { value: "formularios", label: "Formulários", icon: <FolderOpen /> },
    ],
    []
  );

  const renderContent = () => {
    switch (currentTab as TabValue) {
      case "documentos":
        return (
          documentosContent || (
            <div className="text-sm text-muted-foreground">
              Carregando documentos...
            </div>
          )
        );
      case "templates":
        return (
          templatesContent || (
            <div className="text-sm text-muted-foreground">
              Carregando templates...
            </div>
          )
        );
      case "formularios":
        return (
          formulariosContent || (
            <div className="text-sm text-muted-foreground">
              Carregando formulários...
            </div>
          )
        );
      default:
        return (
          documentosContent || (
            <div className="text-sm text-muted-foreground">
              Carregando documentos...
            </div>
          )
        );
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <AnimatedIconTabs
        tabs={TABS_UI}
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
        listClassName="flex-wrap"
      />

      <div className="mt-6 flex-1 min-h-0">
        <Suspense fallback={<TabSkeleton />}>{renderContent()}</Suspense>
      </div>
    </div>
  );
}
