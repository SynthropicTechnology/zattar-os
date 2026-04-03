'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { MetricasDiskIO, DiskIOStatus } from "@/app/(authenticated)/admin";

interface DiskIOCardProps {
  diskIO: MetricasDiskIO | null;
  diskIOStatus: DiskIOStatus;
  diskIOMessage?: string;
}

function getColorClass(percent: number): string {
  if (percent < 80) return "bg-success";
  if (percent < 90) return "bg-warning";
  return "bg-destructive";
}

function getTextColorClass(percent: number): string {
  if (percent < 80) return "text-success";
  if (percent < 90) return "text-warning";
  return "text-destructive";
}

function getStatusConfig(status: DiskIOStatus, message?: string): { title: string; description: string; isLoading: boolean } {
  switch (status) {
    case "not_configured":
      return {
        title: "Metrics API não configurada",
        description: message ?? "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local",
        isLoading: false,
      };
    case "waiting_samples":
      return {
        title: "Coletando amostras...",
        description: message ?? "Aguarde 10-15 segundos e clique em Atualizar para ver as métricas.",
        isLoading: true,
      };
    case "interval_too_short":
      return {
        title: "Aguardando intervalo...",
        description: message ?? "O intervalo entre amostras é muito curto. Aguarde alguns segundos.",
        isLoading: true,
      };
    case "api_error":
      return {
        title: "Erro na API",
        description: message ?? "Verifique se a chave SUPABASE_SECRET_KEY tem permissão service_role.",
        isLoading: false,
      };
    default:
      return {
        title: "Métricas indisponíveis",
        description: message ?? "Erro desconhecido ao obter métricas.",
        isLoading: false,
      };
  }
}

export function DiskIOCard({ diskIO, diskIOStatus, diskIOMessage }: DiskIOCardProps) {
  const router = useRouter();

  if (!diskIO) {
    const { title, description, isLoading } = getStatusConfig(diskIOStatus, diskIOMessage);
    const bgClass = isLoading
      ? "bg-info/10 text-info"
      : "bg-warning/10 text-warning";
    const icon = isLoading ? "⏳" : "⚠️";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Disk IO Budget</CardTitle>
          <CardDescription>Métricas de Disk IO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`rounded-md p-4 text-sm ${bgClass}`}>
            <p className="font-medium">{icon} {title}</p>
            <p className="mt-1 text-xs">{description}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { disk_io_budget_percent, disk_io_consumption_mbps, disk_io_limit_mbps, disk_iops_consumption, disk_iops_limit, compute_tier } = diskIO;
  const shouldShowUpgradeButton = disk_io_budget_percent >= 80;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Disk IO Budget</CardTitle>
            <CardDescription>Consumo de I/O do banco de dados</CardDescription>
          </div>
          <Badge variant={disk_io_budget_percent >= 90 ? "destructive" : disk_io_budget_percent >= 80 ? "warning" : "success"}>
            {compute_tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar principal */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Consumo total</span>
            <span className={`text-sm font-semibold ${getTextColorClass(disk_io_budget_percent)}`}>
              {disk_io_budget_percent.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={disk_io_budget_percent} 
            className="mt-2"
            indicatorClassName={getColorClass(disk_io_budget_percent)}
          />
        </div>

        {/* IOPS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">IOPS</p>
            <p className="mt-1 text-lg font-semibold">
              {disk_iops_consumption.toLocaleString('pt-BR')}
              <span className="text-sm font-normal text-muted-foreground"> / {disk_iops_limit.toLocaleString('pt-BR')}</span>
            </p>
          </div>

          {/* Throughput */}
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Throughput</p>
            <p className="mt-1 text-lg font-semibold">
              {disk_io_consumption_mbps.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground"> / {disk_io_limit_mbps.toFixed(1)} MB/s</span>
            </p>
          </div>
        </div>

        {/* Botão de upgrade */}
        {shouldShowUpgradeButton && (
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => router.push('/app/admin/metricas-db/avaliar-upgrade')}
          >
            Ver Opções de Upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
