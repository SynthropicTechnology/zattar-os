"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CLOUDRON_DEFAULTS = {
  imap_host: "my.zattaradvogados.com",
  imap_port: 993,
  smtp_host: "my.zattaradvogados.com",
  smtp_port: 587,
};

interface TestResult {
  imap: { success: boolean; error?: string };
  smtp: { success: boolean; error?: string };
}

export default function ConfigurarEmailPage() {
  const router = useRouter();
  const user = useUser();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Advanced fields
  const [imapHost, setImapHost] = useState(CLOUDRON_DEFAULTS.imap_host);
  const [imapPort, setImapPort] = useState(String(CLOUDRON_DEFAULTS.imap_port));
  const [smtpHost, setSmtpHost] = useState(CLOUDRON_DEFAULTS.smtp_host);
  const [smtpPort, setSmtpPort] = useState(String(CLOUDRON_DEFAULTS.smtp_port));

  // Status
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load existing credentials (uses first account for backward compat)
  useEffect(() => {
    async function loadCredentials() {
      try {
        const res = await fetch("/api/mail/credentials");
        if (!res.ok) return;
        const data = await res.json();
        if (data.configured && data.accounts?.length > 0) {
          const first = data.accounts[0];
          setIsConfigured(true);
          setEmail(first.imap_user);
          setImapHost(first.imap_host);
          setImapPort(String(first.imap_port));
          setSmtpHost(first.smtp_host);
          setSmtpPort(String(first.smtp_port));
        } else if (user?.emailCorporativo) {
          setEmail(user.emailCorporativo);
        }
      } catch {
        // Ignore load errors
      } finally {
        setIsLoading(false);
      }
    }
    loadCredentials();
  }, [user?.emailCorporativo]);

  const buildPayload = useCallback(() => {
    return {
      imap_host: imapHost || CLOUDRON_DEFAULTS.imap_host,
      imap_port: Number(imapPort) || CLOUDRON_DEFAULTS.imap_port,
      imap_user: email,
      imap_pass: password,
      smtp_host: smtpHost || CLOUDRON_DEFAULTS.smtp_host,
      smtp_port: Number(smtpPort) || CLOUDRON_DEFAULTS.smtp_port,
      smtp_user: email,
      smtp_pass: password,
    };
  }, [email, password, imapHost, imapPort, smtpHost, smtpPort]);

  const handleTest = useCallback(async () => {
    if (!email || !password) {
      setError("Preencha o e-mail e a senha antes de testar.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        throw new Error("Erro ao testar conexão");
      }

      const result = await res.json();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  }, [email, password, buildPayload]);

  const handleSave = useCallback(async () => {
    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar credenciais");
      }

      router.push("/app/mail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  }, [email, password, buildPayload, router]);

  const handleDelete = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials", { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover credenciais");

      setIsConfigured(false);
      setPassword("");
      setTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setIsSaving(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/app/mail")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurar E-mail</h1>
          <p className="text-muted-foreground text-sm">
            Conecte sua conta de e-mail do Cloudron
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais</CardTitle>
          <CardDescription>
            {isConfigured
              ? "Suas credenciais estão configuradas. Atualize a senha se necessário."
              : "Informe o e-mail e senha da sua conta Cloudron."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.nome@zattaradvogados.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isConfigured ? "••••••••  (deixe em branco para manter)" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-sm">
                Configurações avançadas
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imap-host">Servidor IMAP</Label>
                    <Input
                      id="imap-host"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imap-port">Porta IMAP</Label>
                    <Input
                      id="imap-port"
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input
                      id="smtp-host"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Porta SMTP</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Test result */}
          {testResult && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm">
                {testResult.imap.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  IMAP: {testResult.imap.success ? "Conectado" : testResult.imap.error}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {testResult.smtp.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  SMTP: {testResult.smtp.success ? "Conectado" : testResult.smtp.error}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !email || !password}
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexão
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !email || !password}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            {isConfigured && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="ml-auto"
              >
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
