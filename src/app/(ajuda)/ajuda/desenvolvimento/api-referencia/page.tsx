import { Terminal, Key, Database, Users, Calendar, FileText, Shield, Zap, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const authMethods = [
  { method: 'Bearer Token', header: 'Authorization: Bearer <token>' },
  { method: 'Cookie de sessão', header: 'Cookie: sb-access-token=<token>' },
  { method: 'API Key de serviço', header: 'x-service-api-key: <api-key>' },
];

const apiCategories = [
  {
    title: 'Health & Info',
    icon: Zap,
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health Check', auth: false },
      { method: 'GET', path: '/api/me', description: 'Dados do usuário autenticado', auth: true },
      { method: 'GET', path: '/api/dashboard', description: 'Dashboard - Dados gerais', auth: true },
    ],
  },
  {
    title: 'Acervo (Processos)',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/api/acervo', description: 'Listar processos', auth: true, params: 'pagina, limite, cliente_id, tribunal_id, busca' },
      { method: 'GET', path: '/api/acervo/[id]', description: 'Obter processo por ID', auth: true },
      { method: 'PATCH', path: '/api/acervo/[id]/responsavel', description: 'Atualizar responsável', auth: true },
      { method: 'GET', path: '/api/acervo/[id]/timeline', description: 'Timeline do processo', auth: true },
      { method: 'GET', path: '/api/acervo/cliente/cpf/[cpf]', description: 'Processos por CPF (Agente IA)', auth: 'api-key' },
    ],
  },
  {
    title: 'Audiências',
    icon: Calendar,
    endpoints: [
      { method: 'GET', path: '/api/audiencias', description: 'Listar audiências', auth: true, params: 'pagina, limite, data_inicio, data_fim, tipo, cliente_id' },
      { method: 'PATCH', path: '/api/audiencias/[id]/url-virtual', description: 'Atualizar URL virtual', auth: true },
      { method: 'PATCH', path: '/api/audiencias/[id]/responsavel', description: 'Atualizar responsável', auth: true },
      { method: 'PATCH', path: '/api/audiencias/[id]/modalidade', description: 'Atualizar modalidade', auth: true },
      { method: 'GET', path: '/api/audiencias/[id]/observacoes', description: 'Obter observações', auth: true },
      { method: 'POST', path: '/api/audiencias/[id]/observacoes', description: 'Adicionar observação', auth: true },
      { method: 'GET', path: '/api/audiencias/tipos', description: 'Listar tipos', auth: true },
      { method: 'GET', path: '/api/audiencias/cliente/cpf/[cpf]', description: 'Audiências por CPF (Agente IA)', auth: 'api-key' },
    ],
  },
  {
    title: 'Clientes',
    icon: Users,
    endpoints: [
      { method: 'GET', path: '/api/clientes', description: 'Listar clientes', auth: true, params: 'pagina, limite, busca, tipo' },
      { method: 'POST', path: '/api/clientes', description: 'Criar cliente', auth: true },
      { method: 'GET', path: '/api/clientes/[id]', description: 'Obter cliente por ID', auth: true },
      { method: 'PATCH', path: '/api/clientes/[id]', description: 'Atualizar cliente', auth: true },
      { method: 'DELETE', path: '/api/clientes/[id]', description: 'Excluir cliente', auth: true },
      { method: 'GET', path: '/api/clientes/buscar/por-cpf/[cpf]', description: 'Buscar por CPF', auth: true },
      { method: 'GET', path: '/api/clientes/buscar/por-cnpj/[cnpj]', description: 'Buscar por CNPJ', auth: true },
    ],
  },
  {
    title: 'Pendentes de Manifestação',
    icon: Clock,
    endpoints: [
      { method: 'GET', path: '/api/pendentes-manifestacao', description: 'Listar pendentes', auth: true, params: 'pagina, limite, status, responsavel_id, data_inicio' },
      { method: 'PATCH', path: '/api/pendentes-manifestacao/[id]/responsavel', description: 'Atualizar responsável', auth: true },
      { method: 'PATCH', path: '/api/pendentes-manifestacao/[id]/tipo-descricao', description: 'Atualizar tipo e descrição', auth: true },
      { method: 'POST', path: '/api/pendentes-manifestacao/[id]/baixa', description: 'Dar baixa', auth: true },
      { method: 'POST', path: '/api/pendentes-manifestacao/[id]/reverter-baixa', description: 'Reverter baixa', auth: true },
    ],
  },
  {
    title: 'Expedientes Manuais',
    icon: FileText,
    endpoints: [
      { method: 'GET', path: '/api/expedientes-manuais', description: 'Listar expedientes', auth: true, params: 'pagina, limite, status, responsavel_id' },
      { method: 'POST', path: '/api/expedientes-manuais', description: 'Criar expediente', auth: true },
      { method: 'GET', path: '/api/expedientes-manuais/[id]', description: 'Obter expediente', auth: true },
      { method: 'PATCH', path: '/api/expedientes-manuais/[id]', description: 'Atualizar expediente', auth: true },
      { method: 'DELETE', path: '/api/expedientes-manuais/[id]', description: 'Excluir expediente', auth: true },
      { method: 'POST', path: '/api/expedientes-manuais/[id]/baixa', description: 'Dar baixa', auth: true },
    ],
  },
  {
    title: 'Captura TRT',
    icon: Zap,
    endpoints: [
      { method: 'POST', path: '/api/captura/trt/acervo-geral', description: 'Capturar acervo geral', auth: true },
      { method: 'POST', path: '/api/captura/trt/arquivados', description: 'Capturar arquivados', auth: true },
      { method: 'POST', path: '/api/captura/trt/audiencias', description: 'Capturar audiências', auth: true },
      { method: 'POST', path: '/api/captura/trt/pendentes-manifestacao', description: 'Capturar pendentes', auth: true },
      { method: 'POST', path: '/api/captura/trt/timeline', description: 'Capturar timeline', auth: true },
      { method: 'POST', path: '/api/captura/trt/partes', description: 'Capturar partes', auth: true },
    ],
  },
  {
    title: 'Usuários & Permissões',
    icon: Shield,
    endpoints: [
      { method: 'GET', path: '/api/usuarios', description: 'Listar usuários', auth: true, params: 'pagina, limite' },
      { method: 'POST', path: '/api/usuarios', description: 'Criar usuário', auth: true },
      { method: 'GET', path: '/api/usuarios/[id]', description: 'Obter usuário', auth: true },
      { method: 'PATCH', path: '/api/usuarios/[id]', description: 'Atualizar usuário', auth: true },
      { method: 'DELETE', path: '/api/usuarios/[id]', description: 'Excluir usuário', auth: true },
      { method: 'POST', path: '/api/usuarios/sincronizar', description: 'Sincronizar Auth <-> DB', auth: true },
      { method: 'GET', path: '/api/permissoes/recursos', description: 'Listar recursos e permissões', auth: true },
      { method: 'GET', path: '/api/permissoes/usuarios/[id]', description: 'Permissões do usuário', auth: true },
      { method: 'POST', path: '/api/permissoes/usuarios/[id]', description: 'Atualizar permissões', auth: true },
    ],
  },
  {
    title: 'Cache & Debug',
    icon: Settings,
    endpoints: [
      { method: 'GET', path: '/api/cache/stats', description: 'Estatísticas do cache Redis', auth: true },
      { method: 'POST', path: '/api/cache/clear', description: 'Limpar cache', auth: true },
      { method: 'GET', path: '/api/debug/schema-check', description: 'Verificar schema do banco', auth: true },
      { method: 'GET', path: '/api/docs/openapi.json', description: 'Especificação OpenAPI', auth: false },
    ],
  },
];

export default function ApiReferenciaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Terminal className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Referência de API</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guia completo de todos os endpoints da API REST do Sinesys.
        </p>
      </div>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Desenvolvimento</Badge>
            <code className="bg-muted px-2 py-1 rounded text-sm">http://localhost:3000</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Produção</Badge>
            <code className="bg-muted px-2 py-1 rounded text-sm">https://api.sinesys.com.br</code>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Autenticação</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {authMethods.map((auth) => (
              <div key={auth.method} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Badge variant="outline" className="w-fit">{auth.method}</Badge>
                <code className="bg-muted px-2 py-1 rounded text-xs">{auth.header}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Categories */}
      {apiCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              <CardTitle>{category.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium w-20">Método</th>
                    <th className="text-left py-2 font-medium">Endpoint</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-left py-2 font-medium w-16">Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {category.endpoints.map((endpoint, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2">
                        <Badge
                          variant={
                            endpoint.method === 'GET' ? 'secondary' :
                            endpoint.method === 'POST' ? 'default' :
                            endpoint.method === 'PATCH' ? 'outline' :
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <code className="text-xs">{endpoint.path}</code>
                        {endpoint.params && (
                          <p className="text-xs text-muted-foreground mt-1 md:hidden">
                            {endpoint.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground hidden md:table-cell">
                        {endpoint.description}
                      </td>
                      <td className="py-2">
                        {endpoint.auth === true && <Badge variant="outline" className="text-xs">JWT</Badge>}
                        {endpoint.auth === 'api-key' && <Badge variant="secondary" className="text-xs">API Key</Badge>}
                        {endpoint.auth === false && <Badge variant="outline" className="text-xs text-success">Público</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Example Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Requisições</CardTitle>
          <CardDescription>Comandos cURL prontos para uso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Health Check</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X GET "http://localhost:3000/api/health"`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Listar Processos com Filtros</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X GET "http://localhost:3000/api/acervo?pagina=1&limite=50&cliente_id=1" \\
  -H "Authorization: Bearer <token>"`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Criar Cliente</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "http://localhost:3000/api/clientes" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "João da Silva",
    "cpf": "12345678901",
    "tipo": "pessoa_fisica",
    "email": "joao@email.com"
  }'`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Capturar Acervo Geral</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "http://localhost:3000/api/captura/trt/acervo-geral" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "advogado_id": 1,
    "credencial_ids": [1, 2, 3]
  }'`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Atualizar Permissões de Usuário</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "http://localhost:3000/api/permissoes/usuarios/1" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "permissoes": [
      {"recurso_id": 1, "ler": true, "criar": true, "atualizar": true, "deletar": false}
    ]
  }'`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Buscar por CPF (Agente IA WhatsApp)</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`# Processos do cliente
curl -X GET "http://localhost:3000/api/acervo/cliente/cpf/12345678901" \\
  -H "x-service-api-key: <api-key>"

# Audiências do cliente
curl -X GET "http://localhost:3000/api/audiencias/cliente/cpf/12345678901" \\
  -H "x-service-api-key: <api-key>"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* N8N Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Integração N8N</CardTitle>
          <CardDescription>Configuração para automação com N8N</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Variáveis de Ambiente</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code className="bg-muted px-1 rounded">{'{{$env.SINESYS_BASE_URL}}'}</code> - URL base da API</li>
              <li>• <code className="bg-muted px-1 rounded">{'{{$env.SINESYS_API_TOKEN}}'}</code> - Token de autenticação</li>
              <li>• <code className="bg-muted px-1 rounded">{'{{$env.SINESYS_SERVICE_KEY}}'}</code> - API Key de serviço</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Exemplo de Configuração</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`{
  "method": "GET",
  "url": "={{$env.SINESYS_BASE_URL}}/api/acervo",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": {
    "headerName": "Authorization",
    "headerValue": "Bearer {{$env.SINESYS_API_TOKEN}}"
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Importando no N8N</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra o N8N e crie um novo workflow</li>
              <li>Adicione um node &quot;HTTP Request&quot;</li>
              <li>Clique em &quot;Import cURL&quot;</li>
              <li>Cole o comando curl desejado</li>
              <li>Substitua <code className="bg-muted px-1 rounded">&lt;token&gt;</code> pelo token JWT real</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle>Formato de Resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Sucesso</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "total": 100,      // Para listagens paginadas
  "pagina": 1,
  "limite": 50
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Erro</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`{
  "success": false,
  "error": "Mensagem de erro descritiva"
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Códigos HTTP</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">200</Badge>
                <span className="text-sm text-muted-foreground">Sucesso</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">201</Badge>
                <span className="text-sm text-muted-foreground">Criado</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">400</Badge>
                <span className="text-sm text-muted-foreground">Bad Request</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">401</Badge>
                <span className="text-sm text-muted-foreground">Unauthorized</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">403</Badge>
                <span className="text-sm text-muted-foreground">Forbidden</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">404</Badge>
                <span className="text-sm text-muted-foreground">Not Found</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">409</Badge>
                <span className="text-sm text-muted-foreground">Conflict</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">500</Badge>
                <span className="text-sm text-muted-foreground">Server Error</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
