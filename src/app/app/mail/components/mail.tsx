"use client";

import * as React from "react";
import Link from "next/link";
import { MailWarning, Search, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMailStore } from "../use-mail";
import { useMailFolders, useMailMessages, useMailActions } from "../hooks/use-mail-api";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
  const { selectedMail, messages, selectedFolder, setSearchQuery, serviceUnavailable } = useMailStore();
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

  // Folder name for display
  const folderDisplay = selectedFolder === "INBOX" ? "Inbox" : selectedFolder;

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
          className={cn(isCollapsed && "max-w-12.5 transition-all duration-1000 ease-in-out")}>
          <NavDesktop isCollapsed={isCollapsed} />
        </ResizablePanel>
        <ResizableHandle hidden={isMobile} withHandle />
        <ResizablePanel id="middle-panel" defaultSize={defaultLayout[1]} minSize={20}>
          <Tabs
            defaultValue="all"
            className="flex h-full flex-col gap-0"
            onValueChange={(value) => setTab(value)}>
            <div className="flex items-center px-4 py-2">
              <div className="flex items-center gap-2">
                {isMobile && <NavMobile />}
                <h1 className="text-xl font-bold">{folderDisplay}</h1>
              </div>
              <TabsList className="ml-auto">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="unread">Não lidos</TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/59 p-4 backdrop-blur-md">
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
                </InputGroup>
              </form>
            </div>
            <div className="min-h-0">
              <MailList items={filteredMessages} />
            </div>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle hidden={isMobile} withHandle />
        <ResizablePanel id="right-panel" hidden={isMobile} defaultSize={defaultLayout[2]} minSize={30}>
          {isMobile ? (
            <MailDisplayMobile mail={currentMail} />
          ) : (
            <MailDisplay mail={currentMail} />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
