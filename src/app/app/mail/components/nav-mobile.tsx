"use client";

import { useState, useCallback } from "react";

import { Nav } from "./nav";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMailStore } from "../use-mail";
import { buildFolderLinks } from "../lib/constants";

export function NavMobile() {
  const { folders, selectedFolder, setSelectedFolder } = useMailStore();
  const [open, setOpen] = useState(false);
  const folderLinks = buildFolderLinks(folders, selectedFolder);

  const handleSelect = useCallback(
    (folder: string) => {
      setSelectedFolder(folder);
      setOpen(false);
    },
    [setSelectedFolder]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <HamburgerMenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-auto [&>button:first-of-type]:hidden">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Navegação</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-13 items-center justify-center px-4">
          <span className="text-sm font-semibold">E-mail</span>
        </div>

        <Separator />

        <Nav
          isCollapsed={false}
          links={folderLinks}
          onSelect={handleSelect}
        />
      </SheetContent>
    </Sheet>
  );
}
