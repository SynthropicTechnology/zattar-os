import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  type LucideIcon,
  Send,
  Trash2,
} from "lucide-react";
import type { MailFolder } from "@/lib/mail/types";

export const FOLDER_ICONS: Record<string, LucideIcon> = {
  INBOX: Inbox,
  Drafts: File,
  Sent: Send,
  Junk: ArchiveX,
  Trash: Trash2,
  Archive: Archive,
};

export const FOLDER_LABELS: Record<string, string> = {
  INBOX: "Caixa de Entrada",
  Drafts: "Rascunhos",
  Sent: "Enviados",
  Junk: "Lixo eletrônico",
  Trash: "Lixeira",
  Archive: "Arquivo",
};

export const DEFAULT_FOLDER_LINKS = [
  { title: "Caixa de Entrada", label: "", icon: Inbox, variant: "default" as const, folder: "INBOX" },
  { title: "Rascunhos", label: "", icon: File, variant: "ghost" as const, folder: "Drafts" },
  { title: "Enviados", label: "", icon: Send, variant: "ghost" as const, folder: "Sent" },
  { title: "Lixo eletrônico", label: "", icon: ArchiveX, variant: "ghost" as const, folder: "Junk" },
  { title: "Lixeira", label: "", icon: Trash2, variant: "ghost" as const, folder: "Trash" },
  { title: "Arquivo", label: "", icon: Archive, variant: "ghost" as const, folder: "Archive" },
];

export function buildFolderLinks(
  folders: MailFolder[],
  selectedFolder: string
) {
  if (folders.length === 0) return DEFAULT_FOLDER_LINKS;

  return folders.map((folder) => ({
    title: FOLDER_LABELS[folder.path] ?? folder.name,
    label: folder.unread > 0 ? String(folder.unread) : "",
    icon: FOLDER_ICONS[folder.path] ?? Inbox,
    variant: (folder.path === selectedFolder ? "default" : "ghost") as
      | "default"
      | "ghost",
    folder: folder.path,
  }));
}
