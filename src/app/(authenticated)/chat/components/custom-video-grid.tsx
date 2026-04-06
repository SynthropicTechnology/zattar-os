/**
 * @component CustomVideoGrid
 * @description Grid de vídeo para chamadas Dyte com suporte a múltiplos layouts
 * @note Este componente é lazy-loaded via next/dynamic no parent (VideoCallDialog/CallDialog)
 *       que carrega CustomMeetingUI de forma assíncrona para otimização de bundle
 * @see src/features/chat/components/video-call-dialog.tsx
 */
import { memo, useMemo } from "react";
import { DyteParticipantTile } from "@dytesdk/react-ui-kit";
import { useDyteSelector, useDyteMeeting } from "@dytesdk/react-web-core";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface CustomVideoGridProps {
  layout: 'grid' | 'spotlight' | 'sidebar';
  className?: string;
}

export const CustomVideoGrid = memo(function CustomVideoGrid({
  layout,
  className
}: CustomVideoGridProps) {
  const { meeting } = useDyteMeeting();
  const activeParticipants = useDyteSelector((m) => m.participants.active);
  const joinedParticipants = useDyteSelector((m) => m.participants.joined);
  const pinnedParticipants = useDyteSelector((m) => m.participants.pinned);
  
  // Combine active and pinned, prioritizing pinned
  // Filter out self if needed, but Dyte usually handles self in active
  const participants = useMemo(() => {
    const active = activeParticipants.toArray();
    if (active.length > 0) return [...active];
    return [...joinedParticipants.toArray()];
  }, [activeParticipants, joinedParticipants]);
  
  // If screenshare is active, we might want to change layout behavior
  // But DyteGrid usually handles this if configured.
  // Since we are building CUSTOM grid, we manually iterate.

  // Helper to determine grid cols based on count (simple logic, or use useResponsiveLayout)
  const getGridClass = (count: number) => {
    if (layout === 'sidebar') return 'grid-cols-1';
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  const isSpotlight = layout === 'spotlight';
  const isSidebar = layout === 'sidebar';

  // Find dominant speaker or pinned user for spotlight
  const spotlightParticipant = participants.find(p => p.id === pinnedParticipants.toArray()[0]?.id) || participants[0];
  const sidebarParticipants = participants.filter(p => p.id !== spotlightParticipant?.id);

  if (isSidebar || (isSpotlight && participants.length > 0)) {
    return (
      <div className={cn("flex h-full gap-4 p-4", className)}>
        {/* Main Stage */}
        <div className="flex-1 rounded-lg overflow-hidden bg-gray-900/50 relative">
           {spotlightParticipant ? (
             <DyteParticipantTile participant={spotlightParticipant} meeting={meeting} className="w-full h-full object-cover" />
           ) : (
             <EmptyState
               icon={Users}
               title="Aguardando participantes"
               description="Nenhum participante na chamada ainda."
               className="h-full [&_h3]:text-white [&_p]:text-gray-400 [&>div:first-child]:bg-gray-800"
             />
           )}
        </div>
        
        {/* Sidebar */}
        <div className="w-64 flex flex-col gap-2 overflow-y-auto">
          {sidebarParticipants.map(p => (
             <div key={p.id} className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                <DyteParticipantTile participant={p} meeting={meeting} />
             </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div className={cn(
      "grid gap-4 p-4 h-full content-center", 
      getGridClass(participants.length),
      className
    )}>
      <AnimatePresence mode="popLayout">
        {participants.map((participant, index) => (
          <motion.div
            key={participant.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="rounded-lg overflow-hidden bg-gray-900 shadow-lg relative aspect-video"
          >
            <DyteParticipantTile participant={participant} meeting={meeting} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
              {participant.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {participants.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={Users}
            title="Você é o único na chamada"
            description="Aguardando outros participantes entrarem..."
            className="[&_h3]:text-white [&_p]:text-gray-400 [&>div:first-child]:bg-gray-800"
          />
        </div>
      )}
    </div>
  );
});
