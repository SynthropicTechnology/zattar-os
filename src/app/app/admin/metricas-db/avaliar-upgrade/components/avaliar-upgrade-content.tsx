'use client';

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  actionAvaliarUpgrade,
  actionDocumentarDecisao,
  actionObterMetricasDB,
  type MetricasDB,
} from "@/app/app/admin";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradeRecommendation {
  should_upgrade: boolean;
  recommended_tier: 'small' | 'medium' | 'large' | null;
  reasons: string[];
  estimated_cost_increase: number;
  estimated_downtime_minutes: number;
}

type DecisaoUpgrade = 'manter' | 'upgrade_small' | 'upgrade_medium' | 'upgrade_large';

const COMPUTE_TIERS = [
  { name: "Micro", ram_gb: 1, iops: 2085, throughput_mbps: 87, monthly_cost_usd: 0 },
  { name: "Small", ram_gb: 2, iops: 2085, throughput_mbps: 87, monthly_cost_usd: 10 },
  { name: "Medium", ram_gb: 4, iops: 2085, throughput_mbps: 87, monthly_cost_usd: 50 },
  { name: "Large", ram_gb: 8, iops: 2085, throughput_mbps: 87, monthly_cost_usd: 100 },
  { name: "XL", ram_gb: 16, iops: 3000, throughput_mbps: 125, monthly_cost_usd: 200 },
  { name: "2XL", ram_gb: 32, iops: 3000, throughput_mbps: 125, monthly_cost_usd: 400 },
];

export function AvaliarUpgradeContent() {
  const [recommendation, setRecommendation] = useState<UpgradeRecommendation | null>(null);
  const [metricsSnapshot, setMetricsSnapshot] = useState<MetricasDB | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDocumenting, setIsDocumenting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      const [recommendationResult, metricsResult] = await Promise.all([
        actionAvaliarUpgrade(),
        actionObterMetricasDB(),
      ]);

      if (recommendationResult.success && recommendationResult.data) {
        setRecommendation(recommendationResult.data);
      }

      if (metricsResult.success && metricsResult.data) {
        setMetricsSnapshot(metricsResult.data);
      }
    });
  }, []);

  const handleDocumentarDecisao = async () => {
    if (!metricsSnapshot || !recommendation) return;

    setIsDocumenting(true);

    // Calcular cache hit rate médio
    const cacheHitRate = metricsSnapshot.cacheHitRate.length > 0
      ? metricsSnapshot.cacheHitRate.reduce((acc, curr) => acc + curr.ratio, 0) /
        metricsSnapshot.cacheHitRate.length
      : 0;

    const diskIOBudget = metricsSnapshot.diskIO?.disk_io_budget_percent ?? 0;

    const decisao: DecisaoUpgrade = recommendation.should_upgrade
      ? recommendation.recommended_tier === 'small'
        ? 'upgrade_small'
        : recommendation.recommended_tier === 'medium'
        ? 'upgrade_medium'
        : 'upgrade_large'
      : 'manter';

    const result = await actionDocumentarDecisao(
      decisao,
      {
        cache_hit_rate_antes: 0, // Valores históricos (preencher manualmente se disponível)
        cache_hit_rate_depois: cacheHitRate,
        disk_io_antes: 0,
        disk_io_depois: diskIOBudget,
        queries_lentas_antes: 0,
        queries_lentas_depois: metricsSnapshot.queriesLentas.length,
      },
      justificativa || recommendation.reasons.join(". ")
    );

    setIsDocumenting(false);

    if (result.success) {
      toast({
        title: "Decisão documentada",
        description: "DISK_IO_OPTIMIZATION.md foi atualizado com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao documentar decisão",
        variant: "error",
      });
    }
  };

  if (isPending || !recommendation || !metricsSnapshot) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cacheHitRate = metricsSnapshot.cacheHitRate.length > 0
    ? metricsSnapshot.cacheHitRate.reduce((acc, curr) => acc + curr.ratio, 0) /
      metricsSnapshot.cacheHitRate.length
    : 0;

  const diskIOBudget = metricsSnapshot.diskIO?.disk_io_budget_percent ?? 0;
  const computeTier = metricsSnapshot.diskIO?.compute_tier ?? "unknown";

  return (
    <div className="space-y-6">
      {/* Métricas Atuais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cache Hit Rate</CardTitle>
            <CardDescription>Média de cache</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cacheHitRate.toFixed(2)}%</div>
            <p className="mt-1 text-xs text-muted-foreground">Esperado: &gt;99%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disk IO Budget</CardTitle>
            <CardDescription>Consumo de I/O</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{diskIOBudget.toFixed(0)}%</div>
            <p className="mt-1 text-xs text-muted-foreground">Crítico: &gt;90%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compute Tier</CardTitle>
            <CardDescription>Tier atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{computeTier}</div>
            <p className="mt-1 text-xs text-muted-foreground">RAM: {COMPUTE_TIERS.find(t => t.name.toLowerCase() === computeTier.toLowerCase())?.ram_gb ?? "?"}GB</p>
          </CardContent>
        </Card>
      </div>

      {/* Recomendação */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Recomendação</CardTitle>
              <CardDescription>Análise automatizada de necessidade de upgrade</CardDescription>
            </div>
            <Badge variant={recommendation.should_upgrade ? "destructive" : "success"}>
              {recommendation.should_upgrade ? "Upgrade Recomendado" : "Manter Atual"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-inside list-disc space-y-2">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="text-sm">{reason}</li>
            ))}
          </ul>

          {recommendation.should_upgrade && (
            <Alert>
              <AlertDescription>
                <strong>Custo adicional estimado:</strong> ${recommendation.estimated_cost_increase}/mês
                <br />
                <strong>Downtime estimado:</strong> ~{recommendation.estimated_downtime_minutes} minutos
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Compute Tiers Disponíveis</CardTitle>
          <CardDescription>Comparação de recursos e custos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>RAM</TableHead>
                <TableHead>IOPS</TableHead>
                <TableHead>Throughput</TableHead>
                <TableHead className="text-right">Custo/mês</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPUTE_TIERS.map((tier) => (
                <TableRow 
                  key={tier.name}
                  className={tier.name.toLowerCase() === recommendation.recommended_tier ? "bg-accent" : ""}
                >
                  <TableCell className="font-medium">
                    {tier.name}
                    {tier.name.toLowerCase() === computeTier.toLowerCase() && (
                      <Badge variant="outline" className="ml-2">Atual</Badge>
                    )}
                    {tier.name.toLowerCase() === recommendation.recommended_tier && (
                      <Badge className="ml-2">Recomendado</Badge>
                    )}
                  </TableCell>
                  <TableCell>{tier.ram_gb} GB</TableCell>
                  <TableCell>{tier.iops.toLocaleString()}</TableCell>
                  <TableCell>{tier.throughput_mbps} MB/s</TableCell>
                  <TableCell className="text-right">${tier.monthly_cost_usd}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendation.should_upgrade ? (
            <>
              <ol className="list-inside list-decimal space-y-2 text-sm">
                <li>Acessar <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a> → Settings → Compute</li>
                <li>Selecionar tier recomendado: <strong className="capitalize">{recommendation.recommended_tier}</strong></li>
                <li>Agendar upgrade para horário de baixo tráfego (ex: 3h da manhã)</li>
                <li>Avisar usuários sobre ~{recommendation.estimated_downtime_minutes}min de downtime</li>
                <li>Executar upgrade</li>
                <li>Validar métricas pós-upgrade via <a href="/app/admin/metricas-db" className="text-primary hover:underline">/app/admin/metricas-db</a></li>
                <li>Documentar resultado abaixo</li>
              </ol>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              ✅ Sistema operando dentro dos parâmetros esperados. Continuar monitorando métricas semanalmente via dashboard.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa / Observações (opcional)</Label>
            <Textarea
              id="justificativa"
              placeholder="Adicionar observações adicionais sobre a decisão..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleDocumentarDecisao} 
            disabled={isDocumenting}
            className="w-full"
          >
            {isDocumenting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Documentando...
              </>
            ) : (
              "Documentar Decisão em DISK_IO_OPTIMIZATION.md"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
