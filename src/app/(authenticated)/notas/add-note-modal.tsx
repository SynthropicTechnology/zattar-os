"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check, ImageIcon, PenSquare, Tag } from "lucide-react";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap";
import { Content } from "@tiptap/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import type { Note, NoteLabel } from "./domain";
import { useNotes } from "./notes-context";
import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";

type NoteModalBaseProps = {
  mode: "create" | "edit";
  note?: Note;
  children?: React.ReactNode;
};

function NoteModalBase({ mode, note, children }: NoteModalBaseProps) {
  const { labels: noteLabels, createNote, updateNote } = useNotes();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [value, setValue] = React.useState<Content>("");
  const [selectedTags, setSelectedTags] = React.useState<NoteLabel[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputId = React.useId();

  const handleReset = React.useCallback(() => {
    if (mode === "edit" && note) {
      setTitle(note.title ?? "");
      setValue(note.content ?? "");
      setImagePreview(note.type === "image" ? note.image ?? null : null);
      setSelectedTags(note.labels.map((id) => noteLabels.find((l) => l.id === id)).filter(Boolean) as NoteLabel[]);
      setError(null);
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setValue("");
    setSelectedTags([]);
    setImagePreview(null);
    setError(null);
    setIsSubmitting(false);
  }, [mode, note, noteLabels]);

  React.useEffect(() => {
    if (open) handleReset();
  }, [open, handleReset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const dialogTitle = mode === "edit" ? "Editar Nota" : "Adicionar Nota";
  const submitLabel = "Salvar";

  const defaultTrigger = (
    <Button className="w-full">
      <PenSquare />
      <span className="hidden md:block">Adicionar Nota</span>
    </Button>
  );

  const triggerNode = children ?? defaultTrigger;
  const trigger = React.isValidElement(triggerNode)
    ? React.cloneElement(triggerNode as React.ReactElement, {
        onClick: (e: unknown) => {
          // Preserva onClick original (se existir)
          const original = (triggerNode as React.ReactElement).props?.onClick;
          if (typeof original === "function") original(e);
          setOpen(true);
        },
      })
    : defaultTrigger;

  return (
    <>
      {trigger}
      <DialogFormShell
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        maxWidth="xl"
        footer={
          <Button type="submit" form="note-form" disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? "Salvando..." : submitLabel}
          </Button>
        }
      >
        <form
          id="note-form"
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);

            const trimmed = title.trim();
            if (!trimmed) {
              setError("O título é obrigatório");
              return;
            }

            setIsSubmitting(true);

            try {
              // O MinimalTiptapEditor com output="html" retorna uma string HTML
              const content = typeof value === "string" ? value : "";
              const noteType = imagePreview ? "image" : mode === "edit" && note ? note.type : "text";

              if (mode === "edit" && note) {
                await updateNote(note.id, {
                  title: trimmed,
                  content: content || undefined,
                  labels: selectedTags,
                  imageDataUrl: imagePreview,
                  type: noteType,
                });
              } else {
                await createNote({
                  title: trimmed,
                  content: content || undefined,
                  labels: selectedTags,
                  imageDataUrl: imagePreview,
                });
              }

              handleReset();
              setOpen(false);
            } catch (error) {
              console.error("Erro ao salvar nota:", error);
              setError(error instanceof Error ? error.message : "Erro ao salvar nota. Tente novamente.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {imagePreview && (
            <figure className="overflow-hidden rounded-md border">
              <Image
                src={imagePreview}
                width={800}
                height={450}
                alt="Imagem da nota"
                className="aspect-video w-full object-cover"
                unoptimized
              />
            </figure>
          )}

          <Input
            placeholder="Título"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white dark:bg-gray-950"
          />

          <MinimalTiptapEditor
            value={value}
            onChange={setValue}
            className="w-full"
            editorContentClassName={cn("p-4", {
              "min-h-48": true,
            })}
            toolbarRight={
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Input
                          id={fileInputId}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <Button type="button" variant="ghost" size="icon" asChild>
                          <label htmlFor={fileInputId} className="cursor-pointer" aria-label="Adicionar imagem">
                            <ImageIcon className="size-4" />
                          </label>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar imagem</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Adicionar etiqueta">
                              <Tag className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[220px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar etiquetas..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
                                <CommandGroup className="p-2">
                                  {noteLabels &&
                                    noteLabels.length &&
                                    noteLabels.map((label, key: number) => (
                                      <CommandItem
                                        key={key}
                                        className="flex items-center py-2"
                                        onSelect={() => {
                                          if (selectedTags.includes(label)) {
                                            return setSelectedTags(
                                              selectedTags.filter((item) => item.id !== label.id)
                                            );
                                          }

                                          return setSelectedTags(
                                            [...noteLabels].filter((u) => [...selectedTags, label].includes(u))
                                          );
                                        }}
                                      >
                                        <div className="flex grow items-center gap-2">
                                          <span className={cn("block size-3 rounded-full", label.color)} />
                                          <span className="text-sm leading-none">{label.title}</span>
                                          {selectedTags.includes(label) ? (
                                            <Check className="text-primary ms-auto size-3" />
                                          ) : null}
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar etiqueta</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            }
            output="html"
            placeholder="Digite o conteúdo da nota..."
            autofocus={true}
            editable={true}
            editorClassName="focus:outline-hidden"
          />

          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, key) => (
                <Badge key={key} variant="outline">
                  {tag.title}
                </Badge>
              ))}
            </div>
          ) : null}
        </form>
      </DialogFormShell>
    </>
  );
}

export function AddNoteModal({ children }: { children?: React.ReactNode }) {
  return <NoteModalBase mode="create">{children}</NoteModalBase>;
}

export function EditNoteModal({ note, children }: { note: Note; children: React.ReactNode }) {
  return (
    <NoteModalBase mode="edit" note={note}>
      {children}
    </NoteModalBase>
  );
}
