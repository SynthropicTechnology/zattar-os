"use client";

import { useParams } from "next/navigation";
import { PublicSignatureFlow } from "@/app/(authenticated)/assinatura-digital/feature";

export function AssinaturaPublicaClient() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  if (!token) {
    return (
      <div className="flex items-center justify-center h-dvh bg-muted dark:bg-background">
        <p className="text-destructive font-medium">Token inválido ou não fornecido.</p>
      </div>
    );
  }

  return <PublicSignatureFlow token={token} />;
}
