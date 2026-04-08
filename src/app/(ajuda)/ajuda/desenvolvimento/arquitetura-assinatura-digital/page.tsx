import { FileSignature, Database, Shield, Workflow, Folder, Code, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const dbTables = [
  {
    name: 'assinatura_digital_templates',
    description: 'Templates de PDF com campos mapeados',
    columns: ['id', 'template_uuid', 'nome', 'arquivo_original', 'campos (JSONB)', 'status', 'versao'],
  },
  {
    name: 'assinatura_digital_formularios',
    description: 'Formulários com schema dinâmico',
    columns: ['id', 'nome', 'slug', 'segmento_id', 'template_ids', 'form_schema (JSONB)', 'versao'],
  },
  {
    name: 'segmentos',
    description: 'Segmentos (áreas de atuação) - tabela global compartilhada',
    columns: ['id', 'nome', 'slug', 'descricao', 'ativo'],
  },
  {
    name: 'assinatura_digital_assinaturas',
    description: 'Sessões de assinatura completadas',
    columns: ['id', 'sessao_uuid', 'formulario_id', 'cliente_id', 'assinatura_base64', 'pdfs_gerados'],
  },
];

const permissions = [
  { operacao: 'listar', descricao: 'Listar recursos' },
  { operacao: 'visualizar', descricao: 'Ver detalhes' },
  { operacao: 'criar', descricao: 'Criar novos' },
  { operacao: 'editar', descricao: 'Modificar existentes' },
  { operacao: 'deletar', descricao: 'Remover' },
];

const apiRoutes = [
  { method: 'GET', path: '/api/assinatura-digital/templates', description: 'Listar templates' },
  { method: 'POST', path: '/api/assinatura-digital/templates', description: 'Criar template' },
  { method: 'GET', path: '/api/assinatura-digital/templates/[id]', description: 'Obter template' },
  { method: 'PUT', path: '/api/assinatura-digital/templates/[id]', description: 'Atualizar template' },
  { method: 'DELETE', path: '/api/assinatura-digital/templates/[id]', description: 'Deletar template' },
  { method: 'POST', path: '/api/assinatura-digital/templates/[id]/preview-test', description: 'Preview com dados mock' },
  { method: 'GET', path: '/api/assinatura-digital/formularios', description: 'Listar formulários' },
  { method: 'POST', path: '/api/assinatura-digital/formularios', description: 'Criar formulário' },
  { method: 'PUT', path: '/api/assinatura-digital/formularios/[id]/schema', description: 'Atualizar schema' },
  { method: 'GET', path: '/api/assinatura-digital/segmentos', description: 'Listar segmentos' },
  { method: 'POST', path: '/api/assinatura-digital/forms/verificar-cpf', description: 'Verificar CPF (público)' },
  { method: 'POST', path: '/api/assinatura-digital/forms/save-client', description: 'Salvar cliente (público)' },
  { method: 'POST', path: '/api/assinatura-digital/signature/preview', description: 'Preview PDF (público)' },
  { method: 'POST', path: '/api/assinatura-digital/signature/finalizar', description: 'Finalizar assinatura (público)' },
];

export default function ArquiteturaAssinaturaDigitalPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Arquitetura Assinatura Digital</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Arquitetura técnica completa do módulo de Assinatura Digital.
        </p>
      </div>

      {/* Overview Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral da Arquitetura</CardTitle>
          <CardDescription>Fluxo de dados entre componentes</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
            {`┌─────────────────────────────────────────────────────────────┐
│                     SYNTHROPIC (Next.js 16)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Admin Pages    │         │   Public Pages   │         │
│  │  (Dashboard)     │         │   (Formulário)   │         │
│  │                  │         │                  │         │
│  │ • Templates      │         │ • Verificar CPF  │         │
│  │ • Formulários    │         │ • Dados Pessoais │         │
│  │ • Segmentos      │         │ • Form Dinâmico  │         │
│  │                  │         │ • Captura Foto   │         │
│  │ • Editor Visual  │         │ • Geolocalização │         │
│  │ • Schema Builder │         │ • Preview PDF    │         │
│  └────────┬─────────┘         │ • Assinatura     │         │
│           │                   └────────┬─────────┘         │
│           └────────────┬───────────────┘                   │
│                        │                                   │
│           ┌────────────▼─────────────┐                     │
│           │      API Routes          │                     │
│           └────────────┬─────────────┘                     │
│                        │                                   │
└────────────────────────┼───────────────────────────────────┘
                         │
            ┌────────────▼─────────────┐
            │   Supabase (PostgreSQL)  │
            │   + Storage (PDFs)       │
            └──────────────────────────┘`}
          </pre>
        </CardContent>
      </Card>

      {/* Directory Structure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            <CardTitle>Estrutura de Diretórios</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
            {`app/
├── (dashboard)/assinatura-digital/
│   ├── templates/
│   │   ├── page.tsx              # Lista
│   │   ├── [id]/edit/page.tsx    # Editor
│   │   └── components/           # Dialogs
│   ├── formularios/
│   │   ├── page.tsx              # Lista
│   │   ├── [id]/schema/page.tsx  # Schema Builder
│   │   └── components/
│   └── segmentos/
│       └── page.tsx
├── formulario/[segmento]/[formulario]/
│   └── page.tsx                  # Página pública
└── api/assinatura-digital/
    ├── templates/
    ├── formularios/
    ├── segmentos/
    ├── forms/
    └── signature/

components/assinatura-digital/
├── editor/
│   ├── FieldMappingEditor.tsx    # Editor principal (2177 linhas)
│   ├── ToolbarButtons.tsx
│   ├── PdfCanvasArea.tsx
│   └── PropertiesPopover.tsx
├── schema-builder/
│   ├── FormSchemaBuilder.tsx     # Builder principal (736 linhas)
│   ├── FieldPalette.tsx
│   └── FieldPropertiesPanel.tsx
├── form/
│   ├── formulario-container.tsx
│   ├── verificar-cpf.tsx
│   ├── dados-pessoais.tsx
│   ├── dynamic-form-step.tsx
│   └── assinatura-manuscrita-step.tsx
└── capture/
    ├── captura-foto.tsx
    └── geolocation-step.tsx`}
          </pre>
        </CardContent>
      </Card>

      {/* Fluxos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            <CardTitle>Fluxos de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Fluxo Admin</TabsTrigger>
              <TabsTrigger value="public">Fluxo Público</TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Criação de Template</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Admin acessa /assinatura-digital/templates</li>
                  <li>Clica em &quot;Novo Template&quot; → Upload de PDF</li>
                  <li>POST /api/assinatura-digital/templates → Retorna template_uuid</li>
                  <li>Redireciona para /templates/[uuid]/edit</li>
                  <li>FieldMappingEditor carrega para mapear campos</li>
                  <li>Autosave a cada 5 segundos</li>
                  <li>Admin testa preview com dados mock</li>
                  <li>Ativa template (status: ativo)</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Criação de Formulário</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Admin acessa /assinatura-digital/formularios</li>
                  <li>Preenche: Nome, Slug, Segmento, Templates</li>
                  <li>POST /api/assinatura-digital/formularios</li>
                  <li>Clica em &quot;Editar Schema&quot; → FormSchemaBuilder</li>
                  <li>Adiciona seções, arrasta campos da paleta</li>
                  <li>PUT /api/.../schema → Incrementa versão</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="public" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Preenchimento de Formulário</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li><strong>Step 1:</strong> VerificarCPF → POST /forms/verificar-cpf</li>
                  <li><strong>Step 2:</strong> DadosPessoais → POST /forms/save-client</li>
                  <li><strong>Step 3:</strong> DynamicFormStep → Renderiza campos do schema</li>
                  <li><strong>Step 4:</strong> CapturaFotoStep (se foto_necessaria)</li>
                  <li><strong>Step 5:</strong> GeolocationStep (se geolocation_necessaria)</li>
                  <li><strong>Step 6:</strong> VisualizacaoPdfStep → POST /signature/preview</li>
                  <li><strong>Step 7:</strong> AssinaturaManuscritaStep → Canvas de assinatura</li>
                  <li><strong>Step 8:</strong> POST /signature/finalizar → Upload PDFs</li>
                  <li><strong>Sucesso:</strong> Lista de PDFs para download</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Componentes Principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Componentes Principais</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              FieldMappingEditor
              <Badge variant="secondary">2177 linhas</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Editor visual para mapear campos no PDF. Gerencia drag-and-drop, zoom, navegação de páginas, autosave e preview.
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {`interface EditorState {
  template: Template;
  fields: TemplateCampo[];
  selectedFieldId: string | null;
  mode: 'select' | 'add-text' | 'add-image' | 'add-rich-text';
  zoom: number;
  currentPage: number;
  hasUnsavedChanges: boolean;
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              FormSchemaBuilder
              <Badge variant="secondary">736 linhas</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Construtor de schemas JSON para formulários dinâmicos. Usa @dnd-kit para drag-and-drop de campos.
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {`interface DynamicFormSchema {
  sections: Array<{
    id: string;
    title: string;
    fields: Array<{
      id: string;
      type: FormFieldType;
      label: string;
      required: boolean;
      width: 33 | 50 | 100;
      validation?: { min?: number; max?: number; pattern?: string; };
      conditional?: ConditionalRule;
    }>;
  }>;
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">DynamicFormRenderer</h4>
            <p className="text-sm text-muted-foreground">
              Renderiza formulário a partir de schema JSON com validação Zod gerada dinamicamente.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">text</Badge>
              <Badge variant="outline">email</Badge>
              <Badge variant="outline">textarea</Badge>
              <Badge variant="outline">number</Badge>
              <Badge variant="outline">date</Badge>
              <Badge variant="outline">cpf</Badge>
              <Badge variant="outline">cnpj</Badge>
              <Badge variant="outline">phone</Badge>
              <Badge variant="outline">cep</Badge>
              <Badge variant="outline">select</Badge>
              <Badge variant="outline">radio</Badge>
              <Badge variant="outline">checkbox</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Schema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Schema do Banco de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {dbTables.map((table) => (
            <div key={table.name} className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-sm font-mono">{table.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{table.description}</p>
              <div className="flex flex-wrap gap-1">
                {table.columns.map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Tipo TemplateCampo (JSONB)</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {`interface TemplateCampo {
  id: string;           // UUID
  nome: string;         // Nome do campo
  tipo: 'texto' | 'assinatura' | 'foto' | 'texto_composto';
  variavel: string;     // Ex: '{{cliente.nome}}'
  x: number;            // Coordenada X (px)
  y: number;            // Coordenada Y (px)
  width: number;        // Largura (px)
  height: number;       // Altura (px)
  pagina: number;       // Número da página (1-indexed)
  tamanho_fonte?: number;
  fonte?: 'Helvetica' | 'Times' | 'Courier';
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* API Routes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle>API Routes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Método</th>
                  <th className="text-left py-2 font-medium">Endpoint</th>
                  <th className="text-left py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {apiRoutes.map((route, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">
                      <Badge variant={route.method === 'GET' ? 'secondary' : route.method === 'POST' ? 'default' : 'outline'}>
                        {route.method}
                      </Badge>
                    </td>
                    <td className="py-2 font-mono text-xs">{route.path}</td>
                    <td className="py-2 text-muted-foreground">{route.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Permissões (assinatura_digital)</h4>
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <Badge key={perm.operacao} variant="outline">
                  {perm.operacao}: {perm.descricao}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Verificação de Permissões</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {`// Backend - requirePermission()
const user = await requirePermission('assinatura_digital', 'editar');

// Frontend - useMinhasPermissoes()
const { temPermissao } = useMinhasPermissoes('assinatura_digital');
const canEdit = temPermissao('assinatura_digital', 'editar');`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Validações</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Backend:</strong> Todas as rotas validam input com Zod</li>
              <li>• <strong>Frontend:</strong> Validação em tempo real com react-hook-form + Zod</li>
              <li>• <strong>Markdown:</strong> Sanitização com rehype-sanitize</li>
              <li>• <strong>SQL:</strong> Prepared statements via Supabase client</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card>
        <CardHeader>
          <CardTitle>Supabase Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Bucket: <code className="bg-muted px-1 rounded">assinatura-digital-pdfs</code>
          </p>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
            {`assinatura-digital-pdfs/
├── templates/
│   └── [template_uuid].pdf      # PDFs originais
└── sessoes/
    └── [sessao_uuid]/
        └── [template_nome]_[cliente_nome]_[data].pdf  # PDFs assinados`}
          </pre>
          <div className="mt-3 text-sm text-muted-foreground">
            <strong>Políticas RLS:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Templates: leitura pública, escrita apenas admin</li>
              <li>• Sessões: leitura apenas com sessao_uuid, escrita apenas backend</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Code Splitting:</strong> dynamic() para componentes pesados</li>
                <li>• <strong>Memoização:</strong> useMemo, useCallback, React.memo</li>
                <li>• <strong>Debouncing:</strong> Busca 500ms, Autosave 5s, CEP 1s</li>
                <li>• <strong>Lazy Loading:</strong> PDFs sob demanda</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Caching:</strong> Permissões 5 min, Templates no store</li>
                <li>• <strong>Paginação:</strong> Padrão 50 itens</li>
                <li>• <strong>Índices:</strong> Em campos de busca</li>
                <li>• <strong>PDF:</strong> Timeout 30s, máx 10MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
