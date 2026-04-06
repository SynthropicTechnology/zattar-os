"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, ArchiveX, MailOpen, MailWarning, Pencil, Search, Settings, Trash2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { useMailStore } from "../use-mail";
import { useMailFolders, useMailMessages, useMailActions } from "../hooks/use-mail-api";
import { FOLDER_LABELS } from "../lib/constants";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { ComposeMailDialog } from "./compose-mail-dialog";
import { ComposeMailPanel } from "./compose-mail-panel";
import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";
import { NavDesktop } from "./nav-desktop";
import { NavMobile } from "./nav-mobile";
import { MailDisplayMobile } from "./mail-display-mobile";
import { cn } from "@/lib/utils";

const DEFAULT_LAYOUT = [16, 36, 48];

export function Mail({
  defaultLayout = DEFAULT_LAYOUT,
  cookieID,
  defaultCollapsed,
  collapsedCookieID
}: {
  defaultLayout?: number[];
  cookieID: string;
  defaultCollapsed: boolean;
  collapsedCookieID: string;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const isMobile = useIsMobile();
  const { selectedMail, messages, selectedFolder, searchQuery, setSearchQuery, serviceUnavailable, isMailExpanded, isComposing, setIsComposing: _setIsComposing, selectedUids, selectAllUids, clearSelectedUids } =
    useMailStore();
  const [tab, setTab] = React.useState("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [bulkLoading, setBulkLoading] = React.useState(false);

  useMailFolders();
  useMailMessages();
  const { searchMessages, refreshMessages, bulkDelete, bulkMove, bulkMarkRead } = useMailActions();

  const filteredMessages = React.useMemo(() => {
    if (tab === "all") return messages;
    return messages.filter((item) => !item.read);
  }, [messages, tab]);

  const currentMail = selectedMail
    ? messages.find((item) => item.uid === selectedMail.uid) ?? selectedMail
    : null;

  const handleSearch = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput.trim()) {
        setSearchQuery(searchInput.trim());
        await searchMessages(searchInput.trim());
      } else {
        setSearchQuery("");
        await refreshMessages();
      }
    },
    [searchInput, searchMessages, refreshMessages, setSearchQuery]
  );

  const handleClearSearch = React.useCallback(async () => {
    setSearchInput("");
    setSearchQuery("");
    await refreshMessages();
  }, [setSearchQuery, refreshMessages]);

  const folderDisplay = FOLDER_LABELS[selectedFolder] ?? selectedFolder;
  const hasSelection = selectedUids.size > 0;
  const allSelected = filteredMessages.length > 0 && selectedUids.size === filteredMessages.length;

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      clearSelectedUids();
    } else {
      selectAllUids(filteredMessages.map((m) => m.uid));
    }
  }, [allSelected, filteredMessages, selectAllUids, clearSelectedUids]);

  const runBulkAction = React.useCallback(
    async (action: (uids: number[], folder: string) => Promise<void>) => {
      const uids = Array.from(selectedUids);
      if (uids.length === 0) return;
      setBulkLoading(true);
      try {
        await action(uids, selectedFolder);
      } finally {
        setBulkLoading(false);
      }
    },
    [selectedUids, selectedFolder]
  );

  if (serviceUnavailable) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <MailWarning className="text-muted-foreground h-12 w-12" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">E-mail não configurado</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Configure sua conta de e-mail para começar a enviar e receber mensagens.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/mail/configurar">
            <Settings className="mr-2 h-4 w-4" />
            Configurar E-mail
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Skip link for keyboard accessibility */}
      <a
        href="#mail-list"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Ir para lista de e-mails
      </a>

      <ResizablePanelGroup
        direction="horizontal"
        id={cookieID}
        onLayout={(layout: number[]) => {
          document.cookie = `${cookieID}=${JSON.stringify(layout)}; path=/;`;
        }}
        className="h-full items-stretch">
        <ResizablePanel
          id="left-panel"
          hidden={isMobile || isMailExpanded}
          collapsedSize={4}
          collapsible={true}
          defaultSize={defaultLayout[0]}
          minSize={15}
          maxSize={20}
          onResize={(size: number) => {
            if (size < 14) {
              setIsCollapsed(true);
              document.cookie = `${collapsedCookieID}=${JSON.stringify(true)}`;
            } else {
              setIsCollapsed(false);
              document.cookie = `${collapsedCookieID}=${JSON.stringify(false)}`;
            }
          }}
          className={cn(
            "bg-card",
            isCollapsed && "max-w-12.5 transition-all duration-300 ease-in-out"
          )}>
          <NavDesktop isCollapsed={isCollapsed} />
        </ResizablePanel>
        <ResizableHandle hidden={isMobile || isMailExpanded} withHandle />
        <ResizablePanel id="middle-panel" hidden={isMailExpanded} defaultSize={defaultLayout[1]} minSize={28}>
          <Tabs
            defaultValue="all"
            className="flex h-full flex-col gap-0 bg-card"
            onValueChange={(value) => setTab(value)}>
            <div className="flex h-13 shrink-0 items-center gap-2 px-4">
              {hasSelection ? (
                <>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                  <span className="text-muted-foreground text-xs">
                    {selectedUids.size} selecionado{selectedUids.size > 1 ? "s" : ""}
                  </span>

                  <div className="ml-auto flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Arquivar"
                          className="h-7 w-7"
                          disabled={bulkLoading}
                          onClick={() => runBulkAction((uids, folder) => bulkMove(uids, folder, "Archive"))}>
                          <Archive className="h-4 w-4" />
                          <span className="sr-only">Arquivar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Arquivar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Lixo eletrônico"
                          className="h-7 w-7"
                          disabled={bulkLoading}
                          onClick={() => runBulkAction((uids, folder) => bulkMove(uids, folder, "Junk"))}>
                          <ArchiveX className="h-4 w-4" />
                          <span className="sr-only">Lixo eletrônico</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lixo eletrônico</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Excluir"
                          className="h-7 w-7"
                          disabled={bulkLoading}
                          onClick={() => runBulkAction(bulkDelete)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-4" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Marcar como lido"
                          className="h-7 w-7"
                          disabled={bulkLoading}
                          onClick={() => runBulkAction(bulkMarkRead)}>
                          <MailOpen className="h-4 w-4" />
                          <span className="sr-only">Marcar como lido</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Marcar como lido</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-4" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Cancelar seleção"
                          className="h-7 w-7"
                          onClick={clearSelectedUids}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancelar seleção</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancelar seleção</TooltipContent>
                    </Tooltip>
                  </div>
                </>
              ) : (
                <>
                  {isMobile && <NavMobile />}

                  <span className="text-sm font-semibold">{folderDisplay}</span>

                  {isMobile && (
                    <ComposeMailDialog>
                      <Button variant="ghost" size="icon" aria-label="Novo E-mail" className="h-7 w-7 shrink-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Novo E-mail</span>
                      </Button>
                    </ComposeMailDialog>
                  )}

                  <TabsList className="ml-auto h-7">
                    <TabsTrigger value="all" className="text-xs px-2 h-5">
                      Todos
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs px-2 h-5">
                      Não lidos
                    </TabsTrigger>
                  </TabsList>
                </>
              )}
            </div>
            <Separator />
            <div className="p-4">
              <form onSubmit={handleSearch}>
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Buscar e-mails..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchQuery && (
                    <InputGroupAddon>
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Limpar busca">
                        <X className="h-4 w-4" />
                      </button>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </form>
            </div>
            <Separator />
            <div id="mail-list" className="min-h-0 flex-1 overflow-hidden">
              <MailList items={filteredMessages} />
            </div>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle hidden={isMobile || isMailExpanded} withHandle />
        <ResizablePanel
          id="right-panel"
          hidden={isMobile}
          defaultSize={defaultLayout[2]}
          minSize={24}
          className="bg-card">
          {isComposing ? <ComposeMailPanel /> : <MailDisplay mail={currentMail} />}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile display — rendered outside panels, uses portal via Drawer */}
      {isMobile && <MailDisplayMobile mail={currentMail} />}
    </TooltipProvider>
  );
}
