'use client';

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { MetricasDB } from "@/app/app/admin";
import { DiskIOCard } from "./disk-io-card";

interface MetricasDBContentProps {
  metricas: MetricasDB;
}

function getColorClass(ratio: number): string {
  if (ratio >= 99) return "text-success";
  if (ratio >= 95) return "text-warning";
  return "text-destructive";
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

export function MetricasDBContent({ metricas }: MetricasDBContentProps) {
  const router = useRouter();

  const [indexHitRate, tableHitRate] = useMemo(() => {
    const cacheHitRate = metricas.cacheHitRate || [];
    const indexRate = cacheHitRate.find((c) => c.name.includes("index"));
    const tableRate = cacheHitRate.find((c) => c.name.includes("table"));
    return [indexRate?.ratio ?? 0, tableRate?.ratio ?? 0];
  }, [metricas.cacheHitRate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => router.push("/app/admin/metricas-db/avaliar-upgrade")}
        >
          Avaliar Upgrade
        </Button>
        <Button variant="secondary" onClick={() => router.refresh()}>
          Atualizar
        </Button>
      </div>

      <DiskIOCard diskIO={metricas.diskIO} diskIOStatus={metricas.diskIOStatus} diskIOMessage={metricas.diskIOMessage} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cache Hit Rate</CardTitle>
            <CardDescription>Cache de índices e tabelas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Index hit rate</span>
                <span className={`text-sm font-semibold ${getColorClass(indexHitRate)}`}>
                  {formatPercent(indexHitRate)}
                </span>
              </div>
              <Progress value={indexHitRate} className="mt-2" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Table hit rate</span>
                <span className={`text-sm font-semibold ${getColorClass(tableHitRate)}`}>
                  {formatPercent(tableHitRate)}
                </span>
              </div>
              <Progress value={tableHitRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Índices não utilizados</CardTitle>
            <CardDescription>Índices com idx_scan igual a zero</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Índice</TableHead>
                  <TableHead className="text-right">idx_scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.indicesNaoUtilizados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      Nenhum índice sem uso recente.
                    </TableCell>
                  </TableRow>
                )}
                {metricas.indicesNaoUtilizados.slice(0, 8).map((indice) => (
                  <TableRow key={`${indice.relname}-${indice.indexrelname}`}>
                    <TableCell>{indice.relname}</TableCell>
                    <TableCell className="font-mono text-xs">{indice.indexrelname}</TableCell>
                    <TableCell className="text-right">{indice.idx_scan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queries Lentas</CardTitle>
          <CardDescription>Top 10 por tempo máximo</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Query</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Total (ms)</TableHead>
                <TableHead className="text-right">Max (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.queriesLentas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nenhuma query lenta registrada.
                  </TableCell>
                </TableRow>
              )}
              {metricas.queriesLentas.slice(0, 10).map((query, index) => (
                <TableRow key={`${index}-${query.max_time}`}>
                  <TableCell>{query.rolname}</TableCell>
                  <TableCell className="max-w-xl truncate font-mono text-xs">{query.query}</TableCell>
                  <TableCell className="text-right">{query.calls}</TableCell>
                  <TableCell className="text-right">{query.total_time.toFixed(0)}</TableCell>
                  <TableCell className="text-right font-semibold">{query.max_time.toFixed(0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sequential Scans</CardTitle>
            <CardDescription>Tabelas com leitura sequencial elevada</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right">seq_scan</TableHead>
                  <TableHead className="text-right">avg_seq_tup</TableHead>
                  <TableHead className="text-right">idx_scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.tabelasSeqScan.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Nenhuma tabela crítica.
                    </TableCell>
                  </TableRow>
                )}
                {metricas.tabelasSeqScan.slice(0, 10).map((tabela) => (
                  <TableRow key={tabela.relname}>
                    <TableCell>{tabela.relname}</TableCell>
                    <TableCell className="text-right">{tabela.seq_scan}</TableCell>
                    <TableCell className="text-right">{tabela.avg_seq_tup?.toFixed(0) ?? "-"}</TableCell>
                    <TableCell className="text-right">{tabela.idx_scan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bloat</CardTitle>
            <CardDescription>Tabelas com maior desperdício de espaço</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right">Bloat %</TableHead>
                  <TableHead className="text-right">Tamanho</TableHead>
                  <TableHead>Vacuum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricas.bloat.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Nenhum bloat reportado.
                    </TableCell>
                  </TableRow>
                )}
                {metricas.bloat.map((linha) => (
                  <TableRow key={linha.tabela}>
                    <TableCell>{linha.tabela}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          linha.bloat_percent > 50
                            ? "bg-destructive/10 text-destructive"
                            : linha.bloat_percent > 20
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }
                      >
                        {linha.bloat_percent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{linha.tamanho_total}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>Vacuum: {linha.last_vacuum || "-"}</div>
                      <div>Autovacuum: {linha.last_autovacuum || "-"}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
