/**
 * @component CustomAudioGrid
 * @description Grid de áudio para chamadas somente voz Dyte.
 *   Renderiza avatares visuais + DyteParticipantTile oculto para cada participante
 *   remoto, garantindo que o áudio WebRTC seja reproduzido pelo navegador.
 * @see src/features/chat/components/video-call-dialog.tsx
 */
import { useDyteSelector, useDyteMeeting } from "@dytesdk/react-web-core";
import { DyteParticipantTile } from "@dytesdk/react-ui-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Users } from "lucide-react";

interface DyteParticipant {
  id: string;
  name?: string;
  picture?: string;
  audioEnabled: boolean;
}

interface CustomAudioGridProps {
  className?: string;
}

export function CustomAudioGrid({ className }: CustomAudioGridProps) {
  const { meeting } = useDyteMeeting();
  const joinedParticipants = useDyteSelector((m) => m.participants.joined);
  const participants = [...joinedParticipants.toArray()];
  // Include self
  const self = useDyteSelector((m) => m.self);

  const allParticipants = [self, ...participants].filter(Boolean);

  if (allParticipants.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sem participantes"
        description="Aguardando participantes entrarem na chamada."
        className="h-full [&_h3]:text-white [&_p]:text-gray-400 [&>div:first-child]:bg-gray-800"
      />
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-8 p-8 h-full relative", className)}>
      {/* Tiles ocultos para reprodução de áudio dos participantes remotos */}
      <div className="sr-only" aria-hidden="true">
        {participants.map((p) => (
          <DyteParticipantTile key={`audio-${p.id}`} participant={p} meeting={meeting} />
        ))}
      </div>

      {/* UI visual (avatares) */}
      {allParticipants.map((p: DyteParticipant) => (
        <div key={p.id} className="flex flex-col items-center gap-4 group">
          <div className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-transform",
            "bg-linear-to-br from-info to-primary",
            p.audioEnabled && "animate-pulse ring-4 ring-success/30",
            "group-hover:scale-105"
          )}>
            {p.picture ? (
               <img src={p.picture} alt={p.name} className="w-full h-full rounded-full object-cover" />
            ) : (
               <span>{p.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
            )}

            <div className={cn(
              "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black",
              p.audioEnabled ? "bg-success" : "bg-destructive"
            )}>
              {p.audioEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
            </div>
          </div>

          <div className="text-center">
            <p className="font-semibold text-white text-lg">{p.name} {p.id === self?.id && "(Você)"}</p>
            <p className="text-sm text-gray-400">{p.audioEnabled ? "Falando..." : "Mudo"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
