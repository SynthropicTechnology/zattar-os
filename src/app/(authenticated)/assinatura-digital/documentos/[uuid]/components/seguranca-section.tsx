"use client";

import { useState } from "react";
import {
  Globe,
  Monitor,
  Fingerprint,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SignatarioVerificacaoData } from '@/shared/assinatura-digital/types/types';

interface SegurancaSectionProps {
  signatario: SignatarioVerificacaoData;
}

function CopyableValue({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2 group">
      <div className="flex-1 min-w-0">
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
        <p className="text-sm font-mono break-all">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon" aria-label="Confirmar"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-success" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={mono ? "text-sm font-mono break-all" : "text-sm"}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function SegurancaSection({ signatario }: SegurancaSectionProps) {
  const [fingerprintOpen, setFingerprintOpen] = useState(false);

  const hasGeolocation = signatario.geolocation?.latitude != null;
  const hasFingerprint =
    signatario.dispositivoFingerprint &&
    Object.keys(signatario.dispositivoFingerprint).length > 0;
  const hasAnySecurityData =
    signatario.ipAddress ||
    signatario.userAgent ||
    hasGeolocation ||
    hasFingerprint ||
    signatario.termosAceiteVersao;

  if (!hasAnySecurityData) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum dado de segurança coletado.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {/* IP Address */}
      {signatario.ipAddress && (
        <InfoRow
          icon={Globe}
          label="Endereço IP"
          value={<CopyableValue value={signatario.ipAddress} />}
        />
      )}

      {/* User Agent */}
      {signatario.userAgent && (
        <InfoRow
          icon={Monitor}
          label="User Agent"
          value={signatario.userAgent}
          mono
        />
      )}

      {/* Geolocation */}
      {hasGeolocation && (
        <InfoRow
          icon={Globe}
          label="Geolocalização"
          value={
            <div className="space-y-1">
              <p className="text-sm font-mono">
                {signatario.geolocation!.latitude?.toFixed(6)}, {" "}
                {signatario.geolocation!.longitude?.toFixed(6)}
              </p>
              {signatario.geolocation!.accuracy != null && (
                <p className="text-xs text-muted-foreground">
                  Precisão: ~{Math.round(signatario.geolocation!.accuracy)}m
                </p>
              )}
              {signatario.geolocation!.timestamp && (
                <p className="text-xs text-muted-foreground">
                  Capturado em:{" "}
                  {new Date(
                    signatario.geolocation!.timestamp
                  ).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          }
        />
      )}

      {/* Termos de Aceite */}
      {signatario.termosAceiteVersao && (
        <InfoRow
          icon={FileCheck}
          label="Termos de Aceite"
          value={
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">
                {signatario.termosAceiteVersao}
              </Badge>
              {signatario.termosAceiteData && (
                <p className="text-xs text-muted-foreground">
                  Aceito em:{" "}
                  {new Date(signatario.termosAceiteData).toLocaleString(
                    "pt-BR"
                  )}
                </p>
              )}
            </div>
          }
        />
      )}

      {/* Device Fingerprint (Collapsible) */}
      {hasFingerprint && (
        <Collapsible open={fingerprintOpen} onOpenChange={setFingerprintOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between rounded-lg px-0 py-2 hover:bg-transparent"
            >
              <div className="flex min-w-0 items-start gap-3 text-left">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground">
                    Device Fingerprint
                  </span>
                  <p className="text-sm">
                    {Object.keys(signatario.dispositivoFingerprint!).length}{" "}
                    campos coletados
                  </p>
                </div>
              </div>
              {fingerprintOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-md bg-muted/50 p-3 max-h-64 overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(
                  signatario.dispositivoFingerprint,
                  null,
                  2
                )}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
