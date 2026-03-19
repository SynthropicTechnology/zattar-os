"use client";

import Link from "next/link";
import { Check, ChevronDown, Mail as MailIcon, Pencil, Plus, Settings } from "lucide-react";
import { Nav } from "./nav";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMailStore } from "../use-mail";
import { buildFolderLinks } from "../lib/constants";

interface NavDesktopProps {
  isCollapsed: boolean;
}

export function NavDesktop({ isCollapsed }: NavDesktopProps) {
  const { folders, selectedFolder, setSelectedFolder, accounts, selectedAccountId, setSelectedAccountId, setIsComposing } = useMailStore();
  const folderLinks = buildFolderLinks(folders, selectedFolder);
  const currentAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0] ?? null;

  const accountSwitcherPopover = (
    <PopoverContent className="w-72 p-0" align="start">
      {accounts.length > 0 && (
        <div className="border-b p-1">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              onClick={() => setSelectedAccountId(acc.id)}>
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <MailIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{acc.nome_conta || acc.email}</p>
                <p className="text-muted-foreground truncate text-xs">{acc.email}</p>
              </div>
              {acc.id === selectedAccountId && (
                <Check className="text-primary h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
      <div className="p-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
          <Link href="/app/mail/configurar">
            <Settings className="h-4 w-4" />
            Configurar conta
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start gap-2" asChild>
          <Link href="/app/mail/configurar">
            <Plus className="h-4 w-4" />
            Adicionar conta
          </Link>
        </Button>
      </div>
    </PopoverContent>
  );

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-13 shrink-0 items-center",
          isCollapsed ? "justify-center" : "px-4"
        )}>
        <Popover>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-muted">
                    <MailIcon className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                {currentAccount?.nome_conta || currentAccount?.email || "Contas"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-muted">
                <span className="truncate">{currentAccount?.nome_conta || currentAccount?.email || "E-mail"}</span>
                <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              </button>
            </PopoverTrigger>
          )}
          {accountSwitcherPopover}
        </Popover>
      </div>

      <Separator />

      <div className={cn("shrink-0 px-2 py-2", isCollapsed && "px-1")}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="icon" className="w-full" onClick={() => setIsComposing(true)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Novo E-mail</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Novo E-mail</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="default" className="w-full gap-2" onClick={() => setIsComposing(true)}>
            <Pencil className="h-4 w-4" />
            Novo E-mail
          </Button>
        )}
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
