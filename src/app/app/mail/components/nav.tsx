"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface NavLink {
  title: string;
  label?: string;
  icon: LucideIcon;
  dot?: ReactNode;
  variant: "default" | "ghost";
  folder?: string;
}

interface NavProps {
  isCollapsed: boolean;
  links: NavLink[];
  onSelect?: (folder: string) => void;
}

export function Nav({ links, isCollapsed, onSelect }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav
        role="navigation"
        aria-label="Pastas de e-mail"
        className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
        {links.map((link) =>
          isCollapsed ? (
            <Tooltip key={link.folder ?? link.title} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => link.folder && onSelect?.(link.folder)}
                  aria-current={link.variant === "default" ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: link.variant === "default" ? "secondary" : "ghost", size: "icon" }),
                    "size-9",
                    link.variant === "default" && "font-semibold"
                  )}>
                  {link.dot ?? <link.icon className="size-4" />}
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && <span className="text-muted-foreground ml-auto">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={link.folder ?? link.title}
              onClick={() => link.folder && onSelect?.(link.folder)}
              aria-current={link.variant === "default" ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: link.variant === "default" ? "secondary" : "ghost", size: "sm" }),
                link.variant === "default" && "font-semibold",
                "flex justify-start gap-3"
              )}>
              {link.dot ?? <link.icon className="size-4" />}
              {link.title}
              {link.label && (
                <Badge
                  variant="secondary"
                  className="ml-auto">
                  {link.label}
                </Badge>
              )}
            </button>
          )
        )}
      </nav>
    </div>
  );
}
