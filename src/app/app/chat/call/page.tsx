"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CallWindowContent } from "@/features/chat/components/call-window-content";
import { MeetingSkeleton } from "@/features/chat/components/meeting-skeleton";

function CallPageInner() {
  const searchParams = useSearchParams();

  const chamadaId = searchParams.get("chamadaId")
    ? Number(searchParams.get("chamadaId"))
    : undefined;
  const tipo = (searchParams.get("tipo") as "audio" | "video") || "video";
  const salaNome = searchParams.get("salaNome") || "Chamada";
  const isInitiator = searchParams.get("isInitiator") === "true";

  return (
    <CallWindowContent
      chamadaId={chamadaId}
      tipo={tipo}
      salaNome={salaNome}
      isInitiator={isInitiator}
    />
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<MeetingSkeleton />}>
      <CallPageInner />
    </Suspense>
  );
}
