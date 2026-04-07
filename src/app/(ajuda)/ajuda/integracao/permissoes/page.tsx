'use client';

import { Shield, Key, Users, Database, Code, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const permissionMatrix = [
  { recurso: 'advogados', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'credenciais', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'ativar_desativar'], total: 6 },
  { recurso: 'acervo', operacoes: ['listar', 'visualizar', 'editar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel'], total: 6 },
  { recurso: 'audiencias', operacoes: ['listar', 'visualizar', 'editar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel', 'editar_url_virtual'], total: 7 },
  { recurso: 'pendentes', operacoes: ['listar', 'visualizar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel', 'baixar_expediente', 'reverter_baixa', 'editar_tipo_descricao'], total: 8 },
  { recurso: 'expedientes_manuais', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel', 'baixar_expediente', 'reverter_baixa'], total: 10 },
  { recurso: 'usuarios', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'ativar_desativar', 'gerenciar_permissoes', 'sincronizar'], total: 8 },
  { recurso: 'clientes', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'partes_contrarias', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'terceiros', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'representantes', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'enderecos', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'contratos', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'associar_processo', 'desassociar_processo'], total: 7 },
  { recurso: 'processo_partes', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'vincular_parte', 'desvincular_parte'], total: 7 },
  { recurso: 'acordos_condenacoes', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'gerenciar_parcelas', 'receber_pagamento', 'pagar', 'registrar_repasse'], total: 9 },
  { recurso: 'parcelas', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'editar_valores', 'marcar_como_recebida', 'marcar_como_paga', 'anexar_comprovante', 'registrar_repasse'], total: 10 },
  { recurso: 'agendamentos', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'executar', 'ativar_desativar'], total: 7 },
  { recurso: 'captura', operacoes: ['executar_acervo_geral', 'executar_arquivados', 'executar_audiencias', 'executar_pendentes', 'visualizar_historico', 'gerenciar_credenciais'], total: 6 },
  { recurso: 'tipos_expedientes', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'], total: 5 },
  { recurso: 'cargos', operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'ativar_desativar'], total: 6 },
];

const apiEndpoints = {
  cargos: [
    { method: 'GET', endpoint: '/api/cargos', description: 'Listar cargos (paginado)' },
    { method: 'POST', endpoint: '/api/cargos', description: 'Criar cargo' },
    { method: 'GET', endpoint: '/api/cargos/[id]', description: 'Buscar cargo por ID' },
    { method: 'PUT', endpoint: '/api/cargos/[id]', description: 'Atualizar cargo' },
    { method: 'DELETE', endpoint: '/api/cargos/[id]', description: 'Deletar cargo' },
    { method: 'GET', endpoint: '/api/cargos/[id]/usuarios', description: 'Listar usuários de um cargo' },
  ],
  permissoes: [
    { method: 'GET', endpoint: '/api/permissoes/recursos', description: 'Matriz completa de recursos/operações' },
    { method: 'GET', endpoint: '/api/permissoes/usuarios/[id]', description: 'Listar permissões de um usuário' },
    { method: 'POST', endpoint: '/api/permissoes/usuarios/[id]', description: 'Atribuir permissões (batch)' },
    { method: 'PUT', endpoint: '/api/permissoes/usuarios/[id]', description: 'Substituir todas as permissões' },
  ],
};

const auditLogs = [
  { evento: 'Atribuir permissão', tipoEvento: 'permissao_atribuida' },
  { evento: 'Revogar permissão', tipoEvento: 'permissao_revogada' },
  { evento: 'Atribuir em lote', tipoEvento: 'permissoes_atribuidas_lote' },
  { evento: 'Substituir permissões', tipoEvento: 'permissoes_substituidas' },
  { evento: 'Promover super admin', tipoEvento: 'promovido_super_admin' },
  { evento: 'Remover super admin', tipoEvento: 'removido_super_admin' },
  { evento: 'Mudar cargo', tipoEvento: 'mudanca_cargo' },
];

export default function PermissoesDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Permissões</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Sistema granular de permissões baseado em usuários com 126 permissões em 20 recursos.
        </p>
      </div>

      {/* Características */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">126</div>
            <p className="text-sm text-muted-foreground">Permissões granulares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">20</div>
            <p className="text-sm text-muted-foreground">Recursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">5 min</div>
            <p className="text-sm text-muted-foreground">TTL de cache</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">Auditoria</span>
            </div>
            <p className="text-sm text-muted-foreground">Logs completos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matriz" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matriz">Matriz</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="integracao">Integração</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        {/* === MATRIZ === */}
        <TabsContent value="matriz" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>20 recursos com suas operações disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Operações</TableHead>
                      <TableHead className="w-16 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionMatrix.map((item, index) => (
                      <TableRow key={item.recurso}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.recurso}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.operacoes.map((op) => (
                              <Badge key={op} variant="outline" className="text-xs">
                                {op}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Arquitetura */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Arquitetura</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tabela: permissoes</h4>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {`- id (bigint, PK)
- usuario_id (bigint, FK usuarios, ON DELETE CASCADE)
- recurso (text)
- operacao (text)
- permitido (boolean, default true)
- UNIQUE(usuario_id, recurso, operacao)`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Fluxo de Verificação</h4>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {`Requisição → Autenticação → Autorização → Lógica de Negócio
                ↓                ↓
          authenticateRequest  checkPermission
                                ↓
                         1. Super admin? → true
                         2. Cache hit? → cached result
                         3. Query DB → result + cache`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === API === */}
        <TabsContent value="api" className="space-y-6">
          {/* Endpoints de Cargos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Endpoints de Cargos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Método</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiEndpoints.cargos.map((ep) => (
                    <TableRow key={`${ep.method}-${ep.endpoint}`}>
                      <TableCell>
                        <Badge variant={ep.method === 'GET' ? 'secondary' : ep.method === 'DELETE' ? 'destructive' : 'default'}>
                          {ep.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{ep.endpoint}</TableCell>
                      <TableCell className="text-muted-foreground">{ep.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Endpoints de Permissões */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>Endpoints de Permissões</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Método</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiEndpoints.permissoes.map((ep) => (
                    <TableRow key={`${ep.method}-${ep.endpoint}`}>
                      <TableCell>
                        <Badge variant={ep.method === 'GET' ? 'secondary' : 'default'}>
                          {ep.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{ep.endpoint}</TableCell>
                      <TableCell className="text-muted-foreground">{ep.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Exemplos de Uso */}
          <Card>
            <CardHeader>
              <CardTitle>Exemplos de Uso da API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Atribuir Permissões (Batch)</h4>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {`POST /api/permissoes/usuarios/1
Content-Type: application/json

[
  {"recurso": "contratos", "operacao": "criar"},
  {"recurso": "contratos", "operacao": "editar"},
  {"recurso": "audiencias", "operacao": "listar"}
]`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Verificar Permissões</h4>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  {`GET /api/permissoes/usuarios/1

// Resposta (usuário normal):
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "is_super_admin": false,
    "permissoes": [
      {"recurso": "contratos", "operacao": "criar", "permitido": true},
      {"recurso": "contratos", "operacao": "editar", "permitido": true}
    ]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === INTEGRAÇÃO === */}
        <TabsContent value="integracao" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <CardTitle>Verificar Permissão em Rota</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`import { checkPermission } from '@/lib/auth/authorization';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar permissão
  const hasPermission = await checkPermission(
    authResult.usuarioId,
    'contratos',
    'criar'
  );

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continuar com a lógica...
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Helper Reutilizável (requirePermission)</CardTitle>
              <CardDescription>Simplifica autenticação + autorização em uma chamada</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`import { requirePermission } from '@/lib/auth/require-permission';

export async function POST(request: NextRequest) {
  // Verifica autenticação + autorização em uma linha
  const authOrError = await requirePermission(request, 'contratos', 'criar');

  // Se retornou NextResponse, é um erro (401 ou 403)
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  // Caso contrário, temos o usuarioId
  const { usuarioId } = authOrError;
  // ... continuar com a lógica
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invalidação de Cache</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {`import { invalidarCacheUsuario } from '@/lib/auth/authorization';

// Após atribuir permissões
await atribuirPermissoesBatch(usuarioId, permissoes);
invalidarCacheUsuario(usuarioId);`}
              </pre>
            </CardContent>
          </Card>

          {/* Logs de Auditoria */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>Todas as operações são registradas em logs_alteracao</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>tipo_evento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.tipoEvento}>
                      <TableCell>{log.evento}</TableCell>
                      <TableCell className="font-mono text-sm">{log.tipoEvento}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TROUBLESHOOTING === */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Problemas Comuns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cache">
                  <AccordionTrigger>Permissão negada mesmo tendo permissão</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-muted-foreground"><strong>Causa:</strong> Cache desatualizado</p>
                    <p className="text-muted-foreground"><strong>Solução:</strong></p>
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                      {`import { invalidarCacheUsuario } from '@/lib/auth/authorization';
await invalidarCacheUsuario(usuarioId);`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="super-admin">
                  <AccordionTrigger>Super admin não consegue executar operação</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p><strong>Causa:</strong> Verificação de permissão não implementada na rota</p>
                    <p><strong>Solução:</strong> Integrar <code className="bg-muted px-1 rounded">checkPermission</code> ou <code className="bg-muted px-1 rounded">requirePermission</code> na rota</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="delete-cargo">
                  <AccordionTrigger>Erro ao deletar cargo</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p><strong>Causa:</strong> Cargo está associado a usuários</p>
                    <p><strong>Solução:</strong></p>
                    <ol className="list-decimal list-inside mt-2">
                      <li>Remover cargo dos usuários: <code className="bg-muted px-1 rounded">PUT /api/usuarios/[id]</code> com <code className="bg-muted px-1 rounded">cargoId: null</code></li>
                      <li>Depois deletar cargo: <code className="bg-muted px-1 rounded">DELETE /api/cargos/[id]</code></li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="performance">
                  <AccordionTrigger>Performance lenta ao verificar permissões</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-muted-foreground"><strong>Causa:</strong> Cache não está funcionando</p>
                    <p className="text-muted-foreground"><strong>Solução:</strong> Verificar estatísticas do cache:</p>
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                      {`import { getCacheStats } from '@/lib/auth/authorization';
console.log(getCacheStats());`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Segurança</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Super admins devem ser usados com moderação
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Sempre validar permissões no backend (server-side)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  RLS habilitado em todas as tabelas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Logs de auditoria não podem ser deletados
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
