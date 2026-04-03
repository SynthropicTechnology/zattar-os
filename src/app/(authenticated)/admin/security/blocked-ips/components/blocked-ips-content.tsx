"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface BlockedIpInfo {
  ip: string;
  reason: {
    type: "auth_failures" | "rate_limit_abuse" | "invalid_endpoints" | "manual";
    count: number;
    timestamp: number;
    details?: string;
  };
  blockedAt: string;
  expiresAt: string | null;
  permanent: boolean;
}

interface BlockedIpsData {
  blocked: BlockedIpInfo[];
  whitelist: string[];
  stats: {
    totalBlocked: number;
    permanent: number;
    temporary: number;
    whitelisted: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getReasonBadge(type: BlockedIpInfo["reason"]["type"]) {
  switch (type) {
    case "auth_failures":
      return <Badge variant="destructive">Falhas de Auth</Badge>;
    case "rate_limit_abuse":
      return <Badge variant="warning">Rate Limit Abuso</Badge>;
    case "invalid_endpoints":
      return <Badge variant="secondary">Endpoints Inválidos</Badge>;
    case "manual":
      return <Badge variant="outline">Manual</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BlockedIpsContent() {
  const [data, setData] = useState<BlockedIpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "unblock" | "whitelist" | "block" | "remove_whitelist";
    ip: string;
  } | null>(null);
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    ip: string;
    reason: string;
    permanent: boolean;
  }>({ open: false, ip: "", reason: "", permanent: false });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/security/blocked-ips");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const handleAction = async (
    action: "unblock" | "whitelist" | "block" | "clear_suspicious",
    ip: string,
    extra?: { reason?: string; permanent?: boolean }
  ) => {
    setActionLoading(ip);

    try {
      const response = await fetch("/api/admin/security/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ip, ...extra }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Action failed");
      }

      toast.success(result.message);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
      setBlockDialog({ open: false, ip: "", reason: "", permanent: false });
    }
  };

  const handleRemoveFromWhitelist = async (ip: string) => {
    setActionLoading(ip);

    try {
      const response = await fetch(`/api/admin/security/blocked-ips?ip=${encodeURIComponent(ip)}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Action failed");
      }

      toast.success(result.message);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bloqueados</CardTitle>
            <ShieldX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalBlocked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanentes</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.permanent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporários</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.temporary}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Whitelist</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.whitelisted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Blocked IPs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IPs Bloqueados
            </CardTitle>
            <CardDescription>IPs que estão atualmente bloqueados</CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {data.blocked.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum IP bloqueado no momento
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Contagem</TableHead>
                    <TableHead>Bloqueado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.blocked.map((item) => (
                    <TableRow key={item.ip}>
                      <TableCell className="font-mono">{item.ip}</TableCell>
                      <TableCell>{getReasonBadge(item.reason.type)}</TableCell>
                      <TableCell>{item.reason.count}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(item.blockedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {item.permanent ? (
                          <Badge variant="destructive">Permanente</Badge>
                        ) : item.expiresAt ? (
                          formatDistanceToNow(new Date(item.expiresAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === item.ip}
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                action: "unblock",
                                ip: item.ip,
                              })
                            }
                          >
                            {actionLoading === item.ip ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1 sr-only sm:not-sr-only">Desbloquear</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoading === item.ip}
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                action: "whitelist",
                                ip: item.ip,
                              })
                            }
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span className="ml-1 sr-only sm:not-sr-only">Whitelist</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Whitelist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            Whitelist
          </CardTitle>
          <CardDescription>IPs que nunca serão bloqueados</CardDescription>
        </CardHeader>
        <CardContent>
          {data.whitelist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum IP na whitelist
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.whitelist.map((ip) => (
                    <TableRow key={ip}>
                      <TableCell className="font-mono">{ip}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === ip}
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              action: "remove_whitelist",
                              ip,
                            })
                          }
                        >
                          {actionLoading === ip ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1 sr-only sm:not-sr-only">Remover</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "unblock" && "Desbloquear IP"}
              {confirmDialog?.action === "whitelist" && "Adicionar à Whitelist"}
              {confirmDialog?.action === "remove_whitelist" && "Remover da Whitelist"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "unblock" && (
                <>
                  Tem certeza que deseja desbloquear o IP <strong>{confirmDialog.ip}</strong>?
                  Este IP poderá acessar o sistema novamente.
                </>
              )}
              {confirmDialog?.action === "whitelist" && (
                <>
                  Tem certeza que deseja adicionar o IP <strong>{confirmDialog?.ip}</strong> à
                  whitelist? Este IP nunca será bloqueado automaticamente.
                </>
              )}
              {confirmDialog?.action === "remove_whitelist" && (
                <>
                  Tem certeza que deseja remover o IP <strong>{confirmDialog?.ip}</strong> da
                  whitelist? Este IP poderá ser bloqueado automaticamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.action === "remove_whitelist") {
                  handleRemoveFromWhitelist(confirmDialog.ip);
                } else {
                  handleAction(confirmDialog.action, confirmDialog.ip);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block IP Dialog */}
      <AlertDialog
        open={blockDialog.open}
        onOpenChange={(open) =>
          setBlockDialog((prev) => ({ ...prev, open, ip: "", reason: "", permanent: false }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear IP Manualmente</AlertDialogTitle>
            <AlertDialogDescription>
              Insira o IP que deseja bloquear e o motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip">Endereço IP</Label>
              <Input
                id="ip"
                placeholder="192.168.1.1"
                value={blockDialog.ip}
                onChange={(e) => setBlockDialog((prev) => ({ ...prev, ip: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                placeholder="Descrição do motivo do bloqueio"
                value={blockDialog.reason}
                onChange={(e) => setBlockDialog((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permanent"
                checked={blockDialog.permanent}
                onChange={(e) =>
                  setBlockDialog((prev) => ({ ...prev, permanent: e.target.checked }))
                }
              />
              <Label htmlFor="permanent">Bloqueio permanente</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!blockDialog.ip}
              onClick={() =>
                handleAction("block", blockDialog.ip, {
                  reason: blockDialog.reason,
                  permanent: blockDialog.permanent,
                })
              }
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
