import { AlertTriangle, Bug, Database, Lock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const issues = [
  {
    category: 'Supabase Auth',
    icon: Lock,
    problems: [
      {
        title: 'Erro: converting NULL to string is unsupported',
        symptoms: ['Erro ao deletar usuários', 'Erro ao usar signInWithOtp', 'Erro 500 no login'],
        cause: 'Colunas NULL no auth.users que o GoTrue não suporta',
        solution: `UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;`,
      },
    ],
  },
  {
    category: 'Permissões',
    icon: Lock,
    problems: [
      {
        title: 'Erro: column is_super_admin does not exist',
        symptoms: ['Erro 500 ao acessar rotas protegidas'],
        cause: 'Migrations de permissões não aplicadas',
        solution: 'Execute as migrations em supabase/migrations/ na ordem correta.',
      },
      {
        title: 'Erro 403 Forbidden',
        symptoms: ['Acesso negado a recursos'],
        cause: 'Usuário sem permissão ou políticas RLS faltando',
        solution: 'Promova-se a super admin ou adicione permissões manualmente.',
      },
    ],
  },
  {
    category: 'TypeScript',
    icon: Bug,
    problems: [
      {
        title: 'Erros de tipo durante build',
        symptoms: ['Build falha com erros de tipo'],
        cause: 'Tipos desatualizados ou inconsistentes',
        solution: `# Verificar tipos
npm run type-check

# Limpar cache do Next.js
rm -rf .next
npm run dev`,
      },
    ],
  },
  {
    category: 'Cache Redis',
    icon: Database,
    problems: [
      {
        title: 'Cache não funciona',
        symptoms: ['Dados não são cacheados', 'Sempre busca do banco'],
        cause: 'Redis não configurado ou conexão falhando',
        solution: `# Verificar configuração
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://localhost:6379

# Testar conexão
redis-cli -h host -p porta ping

# Ver estatísticas
GET /api/cache/stats`,
      },
    ],
  },
  {
    category: 'Captura PJE',
    icon: Globe,
    problems: [
      {
        title: 'Cookie access_token não encontrado',
        symptoms: ['Scraping falha após login'],
        cause: 'Fluxo de login não completou até authenticateSSO.seam',
        solution: 'Aumente timeout para 600s (10 min). Verifique credenciais e 2FA.',
      },
      {
        title: 'Timeout durante login SSO',
        symptoms: ['Timeout após 180-300s'],
        cause: 'Rede lenta ou CloudFront bloqueando',
        solution: 'Aumente SCRAPING_TIMEOUT para 600000. Use Firefox (mais estável).',
      },
      {
        title: 'Erro 403 Forbidden do CloudFront',
        symptoms: ['WAF bloqueia requisições'],
        cause: 'Comportamento detectado como bot',
        solution: `# Use Firefox
DEFAULT_BROWSER=firefox

# Aumente delays entre interações
# Aguarde 5-10 min antes de tentar novamente`,
      },
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Troubleshooting</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Solução de problemas comuns e guia de debugging.
        </p>
      </div>

      {/* Quick Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Rápido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Logs do Next.js</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">npm run dev:trace</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Verificar tipos</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">npm run type-check</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cache stats</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">GET /api/cache/stats</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Health check</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">GET /api/health</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues by Category */}
      {issues.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              <CardTitle>{category.category}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {category.problems.map((problem, index) => (
              <div key={index} className="border-l-2 border-destructive pl-4">
                <h4 className="font-semibold mb-2">{problem.title}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Sintomas:</span>
                    <ul className="text-muted-foreground ml-4 mt-1">
                      {problem.symptoms.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium">Causa:</span>{' '}
                    <span className="text-muted-foreground">{problem.cause}</span>
                  </div>
                  <div>
                    <span className="font-medium">Solução:</span>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                      {problem.solution}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Assinatura Digital */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-2 border-warning pl-4">
            <h4 className="font-semibold mb-1">Módulo não aparece</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Verifique permissão <code className="bg-muted px-1 rounded">assinatura_digital.listar</code>.
              Faça logout/login para atualizar cache.
            </p>
          </div>
          <div className="border-l-2 border-warning pl-4">
            <h4 className="font-semibold mb-1">Editor de templates não carrega</h4>
            <p className="text-sm text-muted-foreground mb-2">
              PDF muito grande (&gt;10MB), PDF corrompido, ou erro de rede.
              Verifique console (F12).
            </p>
          </div>
          <div className="border-l-2 border-warning pl-4">
            <h4 className="font-semibold mb-1">Preview não gera</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Template sem campos, variáveis incorretas, ou PDF inacessível.
              Verifique logs do backend.
            </p>
          </div>
          <div className="border-l-2 border-warning pl-4">
            <h4 className="font-semibold mb-1">Câmera não funciona</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Permissão negada, câmera em uso, ou navegador incompatível.
              Use Chrome ou Firefox. Feche outros apps com câmera.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* HTTP Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Erros HTTP Comuns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">401</Badge>
              <h4 className="font-semibold text-sm">Unauthorized</h4>
              <p className="text-xs text-muted-foreground">Token expirado. Faça login novamente.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">403</Badge>
              <h4 className="font-semibold text-sm">Forbidden</h4>
              <p className="text-xs text-muted-foreground">Sem permissão. Contate admin.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">404</Badge>
              <h4 className="font-semibold text-sm">Not Found</h4>
              <p className="text-xs text-muted-foreground">Recurso não existe ou foi deletado.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">409</Badge>
              <h4 className="font-semibold text-sm">Conflict</h4>
              <p className="text-xs text-muted-foreground">Slug duplicado. Use outro nome.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">422</Badge>
              <h4 className="font-semibold text-sm">Unprocessable</h4>
              <p className="text-xs text-muted-foreground">Dados inválidos. Verifique campos.</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="destructive" className="mb-2">500</Badge>
              <h4 className="font-semibold text-sm">Server Error</h4>
              <p className="text-xs text-muted-foreground">Erro interno. Verifique logs.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debugging Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas de Debugging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">React DevTools</h4>
              <p className="text-sm text-muted-foreground">
                Extensão do navegador para inspecionar componentes, props e state.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Network Tab (F12)</h4>
              <p className="text-sm text-muted-foreground">
                Veja requisições HTTP, payloads e respostas. Filtre por &quot;XHR&quot; ou &quot;Fetch&quot;.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Supabase Logs</h4>
              <p className="text-sm text-muted-foreground">
                Dashboard → Logs. Filtre por API, Database ou Storage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Console do Navegador</h4>
              <p className="text-sm text-muted-foreground">
                F12 → Console. Filtre por &quot;Error&quot; ou &quot;Warning&quot;.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de Mais Ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Anote o erro exato e o que estava fazendo</li>
            <li>Colete logs do console e Network tab</li>
            <li>Verifique Supabase logs (se admin)</li>
            <li>Entre em contato com o suporte técnico</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
