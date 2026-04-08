import { Settings, Server, Database, Lock, Cloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnvVariable {
  name: string;
  description: string;
  example: string;
  location?: string;
  required: boolean;
  public: boolean;
}

interface Category {
  title: string;
  icon: typeof Database;
  variables: EnvVariable[];
}

const categories: Category[] = [
  {
    title: 'Supabase',
    icon: Database,
    variables: [
      {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        description: 'URL do projeto Supabase',
        example: 'https://xxxxx.supabase.co',
        location: 'Dashboard → Settings → API → Project URL',
        required: true,
        public: true,
      },
      {
        name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
        description: 'Chave pública (anon) do Supabase',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...(token completo)',
        location: 'Dashboard → Settings → API → anon public',
        required: true,
        public: true,
      },
      {
        name: 'SUPABASE_SECRET_KEY',
        description: 'Chave secreta (service_role)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...(token completo)',
        location: 'Dashboard → Settings → API → service_role',
        required: true,
        public: false,
      },
    ],
  },
  {
    title: 'Domínio',
    icon: Server,
    variables: [
      {
        name: 'DOMAIN',
        description: 'Domínio onde a aplicação estará disponível',
        example: 'synthropic.exemplo.com.br',
        location: 'Seu domínio configurado no DNS',
        required: true,
        public: false,
      },
    ],
  },
  {
    title: 'Redis',
    icon: Database,
    variables: [
      {
        name: 'ENABLE_REDIS_CACHE',
        description: 'Habilitar cache Redis',
        example: 'true',
        required: false,
        public: false,
      },
      {
        name: 'REDIS_URL',
        description: 'URL de conexão do Redis',
        example: 'redis://localhost:6379',
        required: false,
        public: false,
      },
      {
        name: 'REDIS_PASSWORD',
        description: 'Senha do Redis',
        example: 'redis_password_xxxxxxxxxxxxxxxx',
        required: false,
        public: false,
      },
      {
        name: 'REDIS_CACHE_TTL',
        description: 'TTL padrão do cache em segundos',
        example: '600',
        required: false,
        public: false,
      },
    ],
  },
  {
    title: '2FAuth (OTP)',
    icon: Lock,
    variables: [
      {
        name: 'TWOFAUTH_API_URL',
        description: 'URL da API 2FAuth',
        example: 'https://2fauth.exemplo.com/api',
        required: false,
        public: false,
      },
      {
        name: 'TWOFAUTH_API_TOKEN',
        description: 'Token de autenticação',
        example: '2fauth_token_xxxxxxxxxxxxxxxxxxxxxxxx',
        required: false,
        public: false,
      },
      {
        name: 'TWOFAUTH_ACCOUNT_ID',
        description: 'ID da conta para OTP',
        example: '1',
        required: false,
        public: false,
      },
    ],
  },
  {
    title: 'Automação',
    icon: Settings,
    variables: [
      {
        name: 'DEFAULT_BROWSER',
        description: 'Navegador para automação',
        example: 'firefox',
        required: false,
        public: false,
      },
      {
        name: 'HEADLESS',
        description: 'Executar em modo headless',
        example: 'true',
        required: false,
        public: false,
      },
      {
        name: 'SCRAPING_TIMEOUT',
        description: 'Timeout para scraping (ms)',
        example: '60000',
        required: false,
        public: false,
      },
    ],
  },
  {
    title: 'Google Drive',
    icon: Cloud,
    variables: [
      {
        name: 'STORAGE_PROVIDER',
        description: 'Provider de storage',
        example: 'google-drive',
        required: false,
        public: false,
      },
      {
        name: 'GOOGLE_DRIVE_WEBHOOK_URL',
        description: 'URL do webhook n8n',
        example: 'https://n8n.exemplo.com/webhook/google-drive',
        required: false,
        public: false,
      },
      {
        name: 'GOOGLE_DRIVE_WEBHOOK_TOKEN',
        description: 'Token de autenticação do webhook',
        example: 'webhook_token_xxxxxxxxxxxxxxxxxxxxxxxx',
        required: false,
        public: false,
      },
    ],
  },
];

export default function VariaveisAmbientePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Variáveis de Ambiente</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configuração de variáveis de ambiente para diferentes ambientes.
        </p>
      </div>

      {/* Important Note */}
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="text-warning">Diferença entre SUPABASE_URL e DOMAIN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <h4 className="font-semibold mb-1">NEXT_PUBLIC_SUPABASE_URL</h4>
              <p className="text-muted-foreground">
                URL do serviço <strong>Supabase</strong> (backend)
              </p>
              <code className="text-xs bg-muted px-1 rounded">https://xxxxx.supabase.co</code>
            </div>
            <div>
              <h4 className="font-semibold mb-1">DOMAIN</h4>
              <p className="text-muted-foreground">
                Domínio da <strong>sua aplicação</strong> (frontend)
              </p>
              <code className="text-xs bg-muted px-1 rounded">synthropic.exemplo.com.br</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {categories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              <CardTitle>{category.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.variables.map((v) => (
                <div key={v.name} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold">{v.name}</code>
                    {v.required && (
                      <Badge variant="destructive" className="text-[10px]">obrigatório</Badge>
                    )}
                    {v.public && (
                      <Badge variant="secondary" className="text-[10px]">público</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Exemplo:</span>{' '}
                    <code className="bg-muted px-1 rounded">{v.example}</code>
                  </div>
                  {v.location && (
                    <div className="text-xs mt-1">
                      <span className="text-muted-foreground">Localização:</span>{' '}
                      <span className="text-muted-foreground">{v.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Example .env */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de .env.local</CardTitle>
          <CardDescription>Copie e preencha com suas configurações</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJxxxxx
SUPABASE_SECRET_KEY=eyJxxxxx

# Domínio (produção)
DOMAIN=synthropic.exemplo.com.br

# Redis (opcional)
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_CACHE_TTL=600

# 2FAuth (para automação PJE)
TWOFAUTH_API_URL=https://2fauth.exemplo.com/api
TWOFAUTH_API_TOKEN=seu-token
TWOFAUTH_ACCOUNT_ID=1

# Automação
DEFAULT_BROWSER=firefox
HEADLESS=true
SCRAPING_TIMEOUT=60000

# Storage
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_WEBHOOK_URL=https://n8n.exemplo.com/webhook/google-drive`}
          </pre>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Variáveis com prefixo <code className="bg-muted px-1 rounded">NEXT_PUBLIC_</code> são expostas no frontend
            </li>
            <li>
              • <strong>Nunca</strong> exponha <code className="bg-muted px-1 rounded">SUPABASE_SECRET_KEY</code> no frontend
            </li>
            <li>
              • Use <code className="bg-muted px-1 rounded">.env.local</code> para desenvolvimento (não commitado)
            </li>
            <li>
              • Configure variáveis de produção no Portainer ou CI/CD
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
