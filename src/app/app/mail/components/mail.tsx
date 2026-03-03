"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Mail as MailIcon, MailWarning, Plus, Search, Settings, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMailStore } from "../use-mail";
import { useMailFolders, useMailMessages, useMailActions } from "../hooks/use-mail-api";
import { FOLDER_LABELS } from "../lib/constants";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";
import { NavDesktop } from "./nav-desktop";
import { NavMobile } from "./nav-mobile";
import { MailDisplayMobile } from "./mail-display-mobile";
import { cn } from "@/lib/utils";

const DEFAULT_LAYOUT = [16, 30, 54];

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
  const { selectedMail, messages, selectedFolder, searchQuery, setSearchQuery, serviceUnavailable, accounts, selectedAccountId, setSelectedAccountId } =
    useMailStore();
  const currentAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0] ?? null;
  const [tab, setTab] = React.useState("all");
  const [searchInput, setSearchInput] = React.useState("");

  useMailFolders();
  useMailMessages();
  const { searchMessages, refreshMessages } = useMailActions();

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
        className="items-stretch">
        <ResizablePanel
          id="left-panel"
          hidden={isMobile}
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
            isCollapsed && "max-w-12.5 transition-all duration-300 ease-in-out"
          )}>
          <NavDesktop isCollapsed={isCollapsed} />
        </ResizablePanel>
        <ResizableHandle hidden={isMobile} withHandle />
        <ResizablePanel id="middle-panel" defaultSize={defaultLayout[1]} minSize={20}>
          <Tabs
            defaultValue="all"
            className="flex h-full flex-col bg-muted/30"
            onValueChange={(value) => setTab(value)}>
            <div className="flex h-13 shrink-0 items-center gap-2 px-4">
              {isMobile && <NavMobile />}

              {/* Account switcher / folder display */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold hover:bg-muted transition-colors">
                    {folderDisplay}
                    <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
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
              </Popover>

              <TabsList className="ml-auto h-7">
                <TabsTrigger value="all" className="text-xs px-2 h-5">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs px-2 h-5">
                  Não lidos
                </TabsTrigger>
              </TabsList>
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
        <ResizableHandle hidden={isMobile} withHandle />
        <ResizablePanel
          id="right-panel"
          hidden={isMobile}
          defaultSize={defaultLayout[2]}
          minSize={30}
          className="bg-background">
          <MailDisplay mail={currentMail} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile display — rendered outside panels, uses portal via Drawer */}
      {isMobile && <MailDisplayMobile mail={currentMail} />}
    </TooltipProvider>
  );
}
