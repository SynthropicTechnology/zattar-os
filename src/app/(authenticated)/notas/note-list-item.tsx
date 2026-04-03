"use client";

import { cn, stripHtmlTags } from "@/lib/utils";
import Image from "next/image";
import { Archive, Edit3, Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Note } from "./domain";
import { useNotes } from "./notes-context";
import { EditNoteModal } from "./add-note-modal";

export default function NoteListItem({ note }: { note: Note }) {
  const { labels, archiveNote } = useNotes();
  return (
    <Card className="group relative mb-4 block break-inside-avoid gap-0 overflow-hidden rounded-md transition-shadow group-data-[view-mode=list]:py-0 group-data-[view-mode=masonry]:pt-0 hover:shadow-lg md:group-data-[view-mode=list]:flex md:group-data-[view-mode=list]:flex-row">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                aria-label={note.isArchived ? "Desarquivar nota" : "Arquivar nota"}
                className="h-8 w-8"
                onClick={() => archiveNote(note.id, !note.isArchived)}
              >
                {note.isArchived ? <Inbox className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{note.isArchived ? "Desarquivar" : "Arquivar"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <EditNoteModal note={note}>
                  <Button variant="secondary" size="icon" aria-label="Editar nota" className="h-8 w-8">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </EditNoteModal>
              </div>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {note.type === "image" && note.image && (
        <figure className="top-0 h-full shrink-0 md:group-data-[view-mode=list]:w-62">
          <Image
            width={200}
            height={150}
            src={note.image}
            className="aspect-square h-full w-full object-cover group-data-[view-mode=list]:md:absolute md:group-data-[view-mode=list]:w-62"
            alt="Imagem da nota"
            unoptimized
          />
        </figure>
      )}
      <CardContent className="pt-6 group-data-[view-mode=list]:pb-6">
        <div className="space-y-4">
          <h3 className="font-display text-xl lg:text-2xl">{note.title}</h3>
          <p className="text-muted-foreground text-sm">{stripHtmlTags(note.content)}</p>
          {note.type === "checklist" && note.items && (
            <ul className="peer space-y-4">
              {note.items.map((item, key) => (
                <li
                  key={key}
                  className={cn("flex items-center space-x-2", {
                    "text-muted-foreground line-through": item.checked
                  })}>
                  <Checkbox
                    className="peer"
                    id={`checklist_${key}`}
                    defaultChecked={item.checked}
                  />
                  <label
                    htmlFor={`checklist_${key}`}
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 aria-checked:line-through">
                    {item.text}
                  </label>
                </li>
              ))}
            </ul>
          )}
          {note.type === "text" && note.content && (
            <p className="text-muted-foreground whitespace-pre-line">{stripHtmlTags(note.content)}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {note.labels.map((id, key) => {
              const label = labels.find((e) => e.id === id);
              if (label)
                return (
                  <Badge key={key} variant="outline">
                    <span className={cn("me-1 size-2 shrink-0 rounded-full", label.color)}></span>
                    {label.title}
                  </Badge>
                );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
