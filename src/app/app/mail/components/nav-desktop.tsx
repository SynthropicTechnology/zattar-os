"use client";

import { Nav } from "./nav";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMailStore } from "../use-mail";
import { buildFolderLinks } from "../lib/constants";

interface NavDesktopProps {
  isCollapsed: boolean;
}

export function NavDesktop({ isCollapsed }: NavDesktopProps) {
  const { folders, selectedFolder, setSelectedFolder } = useMailStore();
  const folderLinks = buildFolderLinks(folders, selectedFolder);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-13 shrink-0 items-center justify-center",
          !isCollapsed && "px-4"
        )}>
        <span className={cn("text-sm font-semibold", isCollapsed && "hidden")}>
          E-mail
        </span>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-auto">
        <Nav
          isCollapsed={isCollapsed}
          links={folderLinks}
          onSelect={setSelectedFolder}
        />
      </div>
    </div>
  );
}
