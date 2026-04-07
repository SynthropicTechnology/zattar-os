import { Rocket, Container, Settings, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const envVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'URL do projeto Supabase',
    example: 'https://xxxxx.supabase.co',
    required: true,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
    description: 'Chave pública do Supabase',
    example: 'eyJxxxxx...',
    required: true,
  },
  {
    name: 'SUPABASE_SECRET_KEY',
    description: 'Chave secreta (service_role)',
    example: 'eyJxxxxx...',
    required: true,
  },
  {
    name: 'DOMAIN',
    description: 'Domínio da aplicação',
    example: 'sinesys.exemplo.com.br',
    required: true,
  },
];

export default function DeployPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Deploy</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guia de deploy via Portainer com Traefik como reverse proxy.
        </p>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-requisitos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              Portainer Community Edition instalado
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              Docker Swarm Mode ativado
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              Traefik configurado e rodando
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              Rede Docker <code className="bg-muted px-1 rounded">network_swarm_public</code> criada
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">5</Badge>
              Domínio configurado apontando para o servidor
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">6</Badge>
              Certificado SSL via Let&apos;s Encrypt
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Variáveis de Ambiente</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Variável</th>
                  <th className="text-left py-2 font-medium">Descrição</th>
                  <th className="text-left py-2 font-medium">Exemplo</th>
                </tr>
              </thead>
              <tbody>
                {envVars.map((v) => (
                  <tr key={v.name} className="border-b last:border-0">
                    <td className="py-2">
                      <code className="bg-muted px-1 rounded text-xs">{v.name}</code>
                      {v.required && <Badge variant="destructive" className="ml-1 text-[10px]">obrigatório</Badge>}
                    </td>
                    <td className="py-2 text-muted-foreground">{v.description}</td>
                    <td className="py-2">
                      <code className="text-xs text-muted-foreground">{v.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Build Image */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Container className="h-5 w-5" />
            <CardTitle>1. Build da Imagem</CardTitle>
          </div>
          <CardDescription>
            Docker Swarm não suporta build diretamente - faça o build antes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Opção A: Build no Portainer</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Vá em <strong>Images</strong></li>
              <li>Clique em <strong>Build a new image</strong></li>
              <li>Image: <code className="bg-muted px-1 rounded">zattar_advogados:latest</code></li>
              <li>Build method: Repository</li>
              <li>Repository URL: URL do seu repositório</li>
              <li>Clique em <strong>Build the image</strong></li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Opção B: Build Local</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`# Build da imagem
docker build -t zattar_advogados:latest .

# Se usar múltiplos nós, push para registry:
docker tag zattar_advogados:latest seu-registry.com/zattar_advogados:latest
docker push seu-registry.com/zattar_advogados:latest`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Create Stack */}
      <Card>
        <CardHeader>
          <CardTitle>2. Criar Stack no Portainer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Acesse o Portainer</li>
            <li>Vá em <strong>Stacks</strong> no menu lateral</li>
            <li>Clique em <strong>Add stack</strong></li>
            <li>Nome: <code className="bg-muted px-1 rounded">sinesys</code></li>
            <li>Escolha método: <strong>Repository</strong> ou <strong>Web editor</strong></li>
          </ol>
          <div>
            <h4 className="font-semibold mb-2">Se usar Repository:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Repository URL: URL do seu repo</li>
              <li>• Reference: <code className="bg-muted px-1 rounded">refs/heads/main</code></li>
              <li>• Compose path: <code className="bg-muted px-1 rounded">docker-compose.yml</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Docker Compose */}
      <Card>
        <CardHeader>
          <CardTitle>3. Docker Compose para Swarm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`services:
  zattar_advogados:
    image: zattar_advogados:latest
    deploy:
      mode: replicated
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.sinesys.rule=Host(\`\${DOMAIN}\`)"
        - "traefik.http.routers.sinesys.entrypoints=websecure"
        - "traefik.http.routers.sinesys.tls.certresolver=letsencrypt"
        - "traefik.http.services.sinesys.loadbalancer.server.port=3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}
      - SUPABASE_SECRET_KEY=\${SUPABASE_SECRET_KEY}
    networks:
      - traefik

networks:
  traefik:
    external: true`}
          </pre>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">✅ deploy:</Badge>
            <Badge variant="secondary">✅ restart_policy:</Badge>
            <Badge variant="outline">❌ build: (não suportado)</Badge>
            <Badge variant="outline">❌ container_name:</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Deploy */}
      <Card>
        <CardHeader>
          <CardTitle>4. Deploy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Configure as variáveis de ambiente na seção <strong>Environment variables</strong></li>
            <li>Clique em <strong>Deploy the stack</strong></li>
            <li>Aguarde o container inicializar</li>
            <li>Verifique os logs em <strong>Logs</strong></li>
          </ol>
          <div>
            <h4 className="font-semibold mb-2">Verificar Health Check</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`# Endpoint interno
curl http://localhost:3000/api/health

# Via domínio
curl https://seu-dominio.com.br/api/health`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Updates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            <CardTitle>Atualizações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Faça pull das alterações do código</li>
            <li>Rebuild da imagem (se necessário)</li>
            <li>No Portainer: <strong>Stacks</strong> → <strong>sinesys</strong> → <strong>Editor</strong></li>
            <li>Clique em <strong>Update the stack</strong></li>
            <li>Aguarde o redeploy</li>
          </ol>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Segurança</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              Nunca exponha <code className="bg-muted px-1 rounded">SUPABASE_SECRET_KEY</code> no frontend
            </li>
            <li>• Use apenas chave pública no frontend</li>
            <li>• Mantenha variáveis de ambiente seguras</li>
            <li>• Use HTTPS sempre (via Traefik)</li>
            <li>• Revise políticas RLS regularmente</li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Container não inicia</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique logs: <code className="bg-muted px-1 rounded">docker logs sinesys</code></li>
              <li>• Verifique variáveis de ambiente</li>
              <li>• Verifique se porta 3000 está livre</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Traefik não roteia</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique rede do container</li>
              <li>• Verifique labels do Traefik</li>
              <li>• Verifique logs: <code className="bg-muted px-1 rounded">docker logs traefik</code></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Erro de conexão Supabase</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique URLs e chaves</li>
              <li>• Teste conectividade do servidor</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
