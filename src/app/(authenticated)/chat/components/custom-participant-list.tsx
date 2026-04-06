/**
 * @component CustomParticipantList
 * @description Lista de participantes para chamadas Dyte
 * @note Este componente é lazy-loaded via next/dynamic no parent (VideoCallDialog/CallDialog)
 *       que carrega CustomMeetingUI de forma assíncrona para otimização de bundle
 * @see src/features/chat/components/video-call-dialog.tsx
 */
import { useDyteSelector } from "@dytesdk/react-web-core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Users, Video, VideoOff } from "lucide-react";
import { memo, useMemo } from "react";

interface DyteParticipant {
  id: string;
  name?: string;
  picture?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface CustomParticipantListProps {
  isVisible: boolean;
  className?: string;
}

export const CustomParticipantList = memo(function CustomParticipantList({ isVisible, className }: CustomParticipantListProps) {
  const joinedParticipants = useDyteSelector((m) => m.participants.joined);
  const participants = useMemo(() => [...joinedParticipants.toArray()], [joinedParticipants]);
  const self = useDyteSelector((m) => m.self);

  // Add self to list if not already there (Dyte usually separates self)
  const allParticipants = useMemo(() => [self, ...participants].filter(Boolean), [self, participants]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute right-4 top-4 bottom-24 w-64 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-800 shadow-lg z-30 flex flex-col",
      "animate-in slide-in-from-right-10 duration-300",
      className
    )}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-white font-semibold">Participantes ({allParticipants.length})</h3>
        {/* Close button for mobile could go here */}
      </div>

      <ScrollArea className="flex-1 p-2">
        {allParticipants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem participantes"
            description="Aguardando participantes entrarem na chamada."
            className="py-6 [&_h3]:text-sm [&_h3]:text-white [&_p]:text-xs [&_p]:text-gray-400 [&>div:first-child]:mb-2 [&>div:first-child]:h-12 [&>div:first-child]:w-12 [&_svg]:h-6 [&_svg]:w-6 [&>div:first-child]:bg-gray-800"
          />
        ) : (
        <div className="space-y-1">
          {allParticipants.map((p: DyteParticipant) => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors rounded-lg group">
              {/* Avatar */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm",
                "bg-linear-to-br from-blue-500 to-purple-600",
                p.audioEnabled && "ring-2 ring-green-500"
              )}>
                 {p.picture ? (
                     
                    <img src={p.picture} alt={p.name} className="w-full h-full rounded-full object-cover" />
                 ) : (
                    <span>{p.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                 )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {p.name} {p.id === self?.id && "(Você)"}
                </p>
                <p className="text-xs text-gray-400">
                    {p.id === self?.id ? "Conectado" : "Na chamada"}
                </p>
              </div>

              {/* Status Icons */}
              <div className="flex gap-2">
                 {p.audioEnabled ? (
                     <Mic className="w-3 h-3 text-success" />
                 ) : (
                     <MicOff className="w-3 h-3 text-destructive" />
                 )}
                 {p.videoEnabled ? (
                     <Video className="w-3 h-3 text-info" />
                 ) : (
                     <VideoOff className="w-3 h-3 text-muted-foreground" />
                 )}
              </div>
            </div>
          ))}
        </div>
        )}
      </ScrollArea>
    </div>
  );
});
