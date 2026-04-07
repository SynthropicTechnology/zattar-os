import { Scale, Key, Clock, AlertTriangle, FileText, Link2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const loginSteps = [
  { step: 1, action: 'Acesso inicial', url: 'pje.trt3.jus.br/primeirograu/login.seam' },
  { step: 2, action: 'Click SSO PDPJ', selector: '#btnSsoPdpj' },
  { step: 3, action: 'Redirect SSO', url: 'sso.cloud.pje.jus.br/auth/realms/pje/...' },
  { step: 4, action: 'Credenciais', selectors: '#username, #password, #kc-login' },
  { step: 5, action: 'OTP (se necessário)', selector: '#otp' },
  { step: 6, action: 'authenticateSSO.seam', note: 'Cookie access_token é criado aqui' },
  { step: 7, action: 'Redirect pjekz', url: 'pje.trt3.jus.br/pjekz' },
  { step: 8, action: 'Cookie disponível', cookie: 'access_token (JWT)' },
];

const timeouts = [
  { etapa: 'Login SSO', normal: '30-60s', maximo: '120s' },
  { etapa: 'OTP (se necessário)', normal: '10-20s', maximo: '60s (3 tentativas)' },
  { etapa: 'Redirects SSO', normal: '20-40s', maximo: '90s' },
  { etapa: 'Carregamento pjekz', normal: '10-20s', maximo: '60s' },
  { etapa: 'Chamada API', normal: '5-10s', maximo: '30s' },
  { etapa: 'Total', normal: '75-150s', maximo: '5-8 minutos' },
];

const agrupamentos = [
  { id: 1, nome: 'Acervo Geral', descricao: 'Todos os processos ativos' },
  { id: 2, nome: 'Pendentes de Manifestação', descricao: 'Processos aguardando manifestação' },
  { id: 5, nome: 'Arquivados', descricao: 'Processos arquivados' },
];

const situacoesAudiencia = [
  { codigo: 'M', descricao: 'Marcada/Designada (agendada)' },
  { codigo: 'R', descricao: 'Realizada' },
  { codigo: 'C', descricao: 'Cancelada' },
];

export default function IntegracaoPjePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Integração PJE</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Documentação completa das APIs REST do PJE (Processo Judicial Eletrônico).
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>PJE 2.15.2 - COPAÍBA</Badge>
          <Badge variant="outline">SSO Authentication</Badge>
          <Badge variant="outline">24 TRTs</Badge>
        </div>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Fluxo de Autenticação</CardTitle>
          </div>
          <CardDescription>Login SSO com suporte a 2FA/OTP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium w-12">Passo</th>
                  <th className="text-left py-2 font-medium">Ação</th>
                  <th className="text-left py-2 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {loginSteps.map((step) => (
                  <tr key={step.step} className="border-b last:border-0">
                    <td className="py-2">
                      <Badge variant="outline">{step.step}</Badge>
                    </td>
                    <td className="py-2 font-medium">{step.action}</td>
                    <td className="py-2 text-muted-foreground font-mono text-xs">
                      {step.url || step.selector || step.selectors || step.cookie || step.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Cookie access_token</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Domínio:</strong> .pje.trt3.jus.br (com ponto inicial)</li>
              <li>• <strong>HttpOnly:</strong> true (não acessível via JavaScript)</li>
              <li>• <strong>Secure:</strong> true (apenas HTTPS)</li>
              <li>• <strong>Formato:</strong> JWT (header.payload.signature)</li>
            </ul>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`// Extrair cookie e decodificar
const cookies = await page.context().cookies();
const accessToken = cookies.find(c =>
  c.name === 'access_token' &&
  c.domain.includes('pje.trt3.jus.br')
);

const parts = accessToken.value.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
const idAdvogado = payload.id;`}
            </pre>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">OTP Retry Logic</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Tentativas máximas:</strong> 3</li>
              <li>• <strong>Validade do token:</strong> 30 segundos</li>
              <li>• <strong>Detecção de erro:</strong> Busca por &quot;inválido&quot;, &quot;invalid&quot;, &quot;código&quot;, &quot;incorreto&quot;</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Timeouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Timeouts Esperados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Etapa</th>
                  <th className="text-left py-2 font-medium">Tempo Normal</th>
                  <th className="text-left py-2 font-medium">Tempo Máximo</th>
                </tr>
              </thead>
              <tbody>
                {timeouts.map((t) => (
                  <tr key={t.etapa} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.etapa}</td>
                    <td className="py-2 text-muted-foreground">{t.normal}</td>
                    <td className="py-2 text-muted-foreground">{t.maximo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Recomendação:</strong> Configure timeout de pelo menos 600 segundos (10 minutos).
          </p>
        </CardContent>
      </Card>

      {/* Main APIs */}
      <Card>
        <CardHeader>
          <CardTitle>APIs Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Totalizadores */}
          <div className="space-y-3 border-l-2 border-primary pl-4">
            <h4 className="font-semibold">1. Totalizadores do Painel</h4>
            <pre className="text-xs bg-muted p-3 rounded-md">
              GET /pje-comum-api/api/paineladvogado/{'{idAdvogado}'}/totalizadores?tipoPainelAdvogado=0
            </pre>
            <p className="text-sm text-muted-foreground">
              Retorna contagem de processos por categoria (Acervo Geral, Pendentes, Arquivados).
            </p>
          </div>

          {/* Lista de Processos */}
          <div className="space-y-3 border-l-2 border-primary pl-4">
            <h4 className="font-semibold">2. Lista de Processos (Paginada)</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              GET /pje-comum-api/api/paineladvogado/{'{idAdvogado}'}/processos
              ?idAgrupamentoProcessoTarefa={'{id}'}
              &amp;pagina={'{pagina}'}
              &amp;tamanhoPagina=100
            </pre>
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Agrupamentos:</p>
              <div className="flex flex-wrap gap-2">
                {agrupamentos.map((a) => (
                  <Badge key={a.id} variant="outline">
                    {a.id} = {a.nome}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Audiências */}
          <div className="space-y-3 border-l-2 border-primary pl-4">
            <h4 className="font-semibold">3. Pauta de Audiências</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              GET /pje-comum-api/api/pauta-usuarios-externos
              ?dataInicio=YYYY-MM-DD
              &amp;dataFim=YYYY-MM-DD
              &amp;codigoSituacao=M
              &amp;numeroPagina=1
              &amp;tamanhoPagina=100
            </pre>
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Situações:</p>
              <div className="flex flex-wrap gap-2">
                {situacoesAudiencia.map((s) => (
                  <Badge key={s.codigo} variant="outline">
                    {s.codigo} = {s.descricao}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Arquivados */}
          <div className="space-y-3 border-l-2 border-primary pl-4">
            <h4 className="font-semibold">4. Processos Arquivados</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              GET /pje-comum-api/api/paineladvogado/{'{idAdvogado}'}/processos
              ?idAgrupamentoProcessoTarefa=5
              &amp;tipoPainelAdvogado=5
              &amp;pagina=1
              &amp;tamanhoPagina=100
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Download de Documentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Download de Documentos (PDFs)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Endpoint Principal</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              GET /pje-comum-api/api/processos/id/{'{idProcesso}'}/documentos/id/{'{idDocumento}'}/conteudo
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Endpoints Alternativos (Fallback)</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li><code className="bg-muted px-1 rounded">/pje-comum-api/api/binarios/{'{idBin}'}</code></li>
              <li><code className="bg-muted px-1 rounded">/pje-comum-api/api/documentos/{'{idDocumento}'}/conteudo</code></li>
              <li><code className="bg-muted px-1 rounded">/pje-comum-api/api/documentos/{'{idDocumento}'}/download</code></li>
              <li><code className="bg-muted px-1 rounded">/pje-comum-api/api/expedientes/{'{idDocumento}'}/pdf</code></li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Validação de PDF</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Signature check:</strong> PDF deve começar com %PDF nos primeiros 4 bytes</li>
              <li>• <strong>Content-Type:</strong> application/pdf ou application/octet-stream</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Processos Associados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            <CardTitle>Processos Associados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Endpoint</h4>
            <pre className="text-xs bg-muted p-3 rounded-md">
              GET /pje-comum-api/api/processos/id/{'{idProcesso}'}/associacoes
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quando Buscar</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`if (processo.temAssociacao === true) {
  const associado = await fetchProcessoAssociado(page, processo.id);
  if (associado) {
    processo.processoAssociado = associado;
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Segurança e Boas Práticas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-success">✅ Correto</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`const response = await fetch(endpoint, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'X-XSRF-Token': xsrfToken, // Opcional
  },
  credentials: 'include', // Envia cookies automaticamente
});`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-destructive">❌ Incorreto</h4>
            <p className="text-sm text-muted-foreground">
              NÃO use <code className="bg-muted px-1 rounded">Authorization: Bearer {'{token}'}</code> - causa erro 401.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Limites e Rate Limiting</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Paginação:</strong> Tamanho máximo 100 registros</li>
              <li>• <strong>Rate Limiting:</strong> Não mais que 2 req/segundo, delay 500ms recomendado</li>
              <li>• <strong>Sessão:</strong> Expira após ~30 minutos de inatividade</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-2 border-destructive pl-4">
            <h4 className="font-semibold mb-1">Cookie access_token não encontrado</h4>
            <p className="text-sm text-muted-foreground">
              Verifique se o fluxo de login completou até <code className="bg-muted px-1 rounded">authenticateSSO.seam</code>.
            </p>
          </div>

          <div className="border-l-2 border-destructive pl-4">
            <h4 className="font-semibold mb-1">Timeout durante login SSO</h4>
            <p className="text-sm text-muted-foreground">
              Aumente timeout para 600 segundos (10 minutos).
            </p>
          </div>

          <div className="border-l-2 border-destructive pl-4">
            <h4 className="font-semibold mb-1">403 Forbidden (CloudFront)</h4>
            <p className="text-sm text-muted-foreground">
              WAF detectou bot. Use Firefox, aumente delays (2-3s), aguarde 5-10 min antes de tentar novamente.
            </p>
          </div>

          <div className="border-l-2 border-destructive pl-4">
            <h4 className="font-semibold mb-1">429 Too Many Requests</h4>
            <p className="text-sm text-muted-foreground">
              Aumente delays entre requisições (500ms-1s). Implemente retry com exponential backoff.
            </p>
          </div>

          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <h4 className="font-semibold text-success mb-2">✅ Recomendação: Use Firefox</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Não exibe popovers de gerenciamento de senha</li>
              <li>• Mais estável para automação de login com OTP</li>
              <li>• Menos detectável como bot</li>
            </ul>
            <pre className="text-xs bg-muted p-2 rounded-md mt-2">
{`# .env ou .env.local
DEFAULT_BROWSER=firefox
HEADLESS=false
SCRAPING_TIMEOUT=60000`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referência Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">URLs Base</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>TRT:</strong> https://pje.trt{'{N}'}.jus.br</li>
                <li>• <strong>API:</strong> /pje-comum-api/api</li>
                <li>• <strong>Segurança:</strong> /pje-seguranca/api</li>
                <li>• <strong>Frontend:</strong> /pjekz</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Implementação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code className="bg-muted px-1 rounded">lib/services/pje/auth-helpers.ts</code></li>
                <li>• <code className="bg-muted px-1 rounded">lib/services/pje/enrichment-helpers.ts</code></li>
                <li>• <code className="bg-muted px-1 rounded">backend/captura/services/</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
