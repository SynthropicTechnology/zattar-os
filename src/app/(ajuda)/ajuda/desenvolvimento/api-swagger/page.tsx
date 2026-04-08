import { BookOpen, FileCode, Settings, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ApiSwaggerPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Documentação Swagger</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Como usar e manter a documentação Swagger/OpenAPI da API do Synthropic.
        </p>
      </div>

      {/* Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Acesso à Documentação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Swagger UI</h4>
              <code className="text-sm bg-muted px-2 py-1 rounded block">
                http://localhost:3000/docs
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Interface visual interativa
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">OpenAPI JSON</h4>
              <code className="text-sm bg-muted px-2 py-1 rounded block">
                http://localhost:3000/api/docs/openapi.json
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Especificação para importação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Document */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            <CardTitle>Como Documentar uma Rota</CardTitle>
          </div>
          <CardDescription>
            Adicione comentários JSDoc no formato Swagger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`/**
 * @swagger
 * /api/captura/trt/acervo-geral:
 *   post:
 *     summary: Captura dados do acervo geral do TRT
 *     description: Descrição detalhada do que a rota faz
 *     tags:
 *       - Captura TRT
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential_id
 *               - trt_codigo
 *             properties:
 *               credential_id:
 *                 type: integer
 *                 example: 1
 *               trt_codigo:
 *                 type: string
 *                 example: "TRT3"
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  // Implementação da rota
}`}
          </pre>
        </CardContent>
      </Card>

      {/* File Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`├── swagger.config.ts              # Configuração do Swagger
├── app/
│   ├── docs/
│   │   └── page.tsx               # Página Swagger UI
│   └── api/
│       ├── docs/
│       │   └── openapi.json/
│       │       └── route.ts       # Endpoint OpenAPI JSON
│       └── captura/
│           └── trt/
│               └── acervo-geral/
│                   └── route.ts   # Rotas documentadas`}
          </pre>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Configuração</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A configuração está em <code className="bg-muted px-1 rounded">swagger.config.ts</code>:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Informações da API:</strong> título, versão, descrição</li>
            <li>• <strong>Servidores:</strong> URLs de desenvolvimento e produção</li>
            <li>• <strong>Segurança:</strong> Bearer Token e Session Auth</li>
            <li>• <strong>Schemas:</strong> Error, SuccessResponse, BaseCapturaTRTParams</li>
            <li>• <strong>Paths:</strong> <code className="bg-muted px-1 rounded">./app/api/**/*.ts</code></li>
          </ul>
        </CardContent>
      </Card>

      {/* Reusable Schemas */}
      <Card>
        <CardHeader>
          <CardTitle>Schemas Reutilizáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use referências para schemas definidos em <code className="bg-muted px-1 rounded">swagger.config.ts</code>:
          </p>
          <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`schema:
  $ref: '#/components/schemas/Error'`}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Error</Badge>
            <Badge variant="secondary">SuccessResponse</Badge>
            <Badge variant="secondary">BaseCapturaTRTParams</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Bearer Token</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">
{`Authorization: Bearer <token>`}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">
                Token JWT do Supabase
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Session Auth</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">
{`Cookie: sb-access-token=<token>`}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">
                Cookie de sessão do Supabase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle>Dependências</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`npm install swagger-ui-react swagger-jsdoc
npm install -D @types/swagger-jsdoc @types/swagger-ui-react`}
          </pre>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Documentação não aparece</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique se o servidor está rodando</li>
              <li>• Confirme formato correto dos comentários JSDoc</li>
              <li>• Verifique console do navegador</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Rotas não aparecem</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Arquivos devem estar em <code className="bg-muted px-1 rounded">app/api/**/*.ts</code></li>
              <li>• Comentários devem começar com <code className="bg-muted px-1 rounded">@swagger</code></li>
              <li>• Caminho da rota deve estar correto no comentário</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              •{' '}
              <a href="https://swagger.io/specification/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Documentação OpenAPI 3.0
              </a>
            </li>
            <li>
              •{' '}
              <a href="https://github.com/Surnet/swagger-jsdoc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Swagger JSDoc
              </a>
            </li>
            <li>
              •{' '}
              <a href="https://github.com/swagger-api/swagger-ui" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Swagger UI React
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
