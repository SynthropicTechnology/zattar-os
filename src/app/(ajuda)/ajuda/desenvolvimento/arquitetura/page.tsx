import { Layers, FolderTree, FileCode, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const layers = [
  {
    name: 'Camada de Domínio',
    description: 'Lógica de negócio pura, independente de tecnologia',
    location: 'types/domain/, backend/{modulo}/domain/',
    components: ['Entidades', 'Value Objects', 'Agregados', 'Serviços de Domínio', 'Eventos'],
    examples: ['Cliente', 'Acervo', 'Audiencia', 'Usuario'],
  },
  {
    name: 'Camada de Aplicação',
    description: 'Orquestra casos de uso sem lógica de negócio',
    location: 'types/contracts/, backend/{modulo}/services/',
    components: ['Serviços de Aplicação', 'DTOs'],
    examples: ['CriarClienteService', 'ListarAcervoParams'],
  },
  {
    name: 'Camada de Infraestrutura',
    description: 'Persistência, APIs externas e detalhes técnicos',
    location: 'backend/persistence/, backend/api/, app/api/',
    components: ['Repositórios', 'Serviços de Integração'],
    examples: ['ClientePersistenceService', 'PjeTrtApiService'],
  },
  {
    name: 'Camada de Apresentação',
    description: 'Interface do usuário e componentes React',
    location: 'app/(dashboard)/, components/',
    components: ['API Routes', 'Componentes UI', 'Tipos de UI'],
    examples: ['ClienteFormData', 'ProcessosFilters'],
  },
];

const folderStructure = [
  { path: '/types', description: 'Tipos compartilhados' },
  { path: '/types/contracts', description: 'Contratos/DTOs compartilhados (APIs externas e integrações)' },
  { path: '/features/*/domain.ts', description: 'Domínio de cada feature (fonte da verdade)' },
  { path: '/backend/types', description: 'Tipos específicos de infraestrutura' },
  { path: '/app/_lib/types', description: 'Tipos específicos de UI' },
];

const conventions = [
  { category: 'Arquivos de Domínio', pattern: 'kebab-case.ts', example: 'acervo.ts' },
  { category: 'Interfaces de Domínio', pattern: 'PascalCase', example: 'Cliente, Endereco' },
  { category: 'Params de entrada', pattern: 'AcaoConceitoParams', example: 'CriarClienteParams' },
  { category: 'Resultados', pattern: 'AcaoConceitoResult', example: 'ListarClientesResult' },
  { category: 'Respostas de API', pattern: 'ConceitoApiResponse', example: 'ClientesApiResponse' },
  { category: 'Filtros', pattern: 'ConceitoFilters', example: 'ProcessosFilters' },
];

export default function ArquiteturaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Arquitetura</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Princípios de Domain-Driven Design (DDD) e organização de tipos no Sinesys.
        </p>
      </div>

      {/* DDD Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Domain-Driven Design</CardTitle>
          <CardDescription>
            Abordagem de desenvolvimento focada na modelagem do domínio de negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Conceitos Fundamentais</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Domínio:</strong> Esfera de conhecimento do negócio</li>
                <li>• <strong>Modelo de Domínio:</strong> Representação abstrata</li>
                <li>• <strong>Linguagem Ubíqua:</strong> Vocabulário comum</li>
                <li>• <strong>Contextos Delimitados:</strong> Limites do modelo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Benefícios</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reutilização de tipos sem duplicação</li>
                <li>• Uma única fonte de verdade</li>
                <li>• Separação clara de responsabilidades</li>
                <li>• Manutenção simplificada</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layers */}
      <Card>
        <CardHeader>
          <CardTitle>Camadas da Arquitetura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {layers.map((layer, index) => (
              <div key={layer.name} className="border-l-2 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-semibold">{layer.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{layer.description}</p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="font-medium">Localização:</span>{' '}
                    <code className="bg-muted px-1 rounded">{layer.location}</code>
                  </div>
                  <div>
                    <span className="font-medium">Componentes:</span>{' '}
                    {layer.components.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Exemplos:</span>{' '}
                    {layer.examples.map((ex, i) => (
                      <code key={i} className="bg-muted px-1 rounded mr-1">{ex}</code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Folder Structure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            <CardTitle>Estrutura de Pastas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto mb-4">
{`/types
├── domain/        # Tipos da camada de Domínio (DDD)
│   ├── common.ts  # Paginacao, TipoPessoa, GrauProcesso
│   ├── acervo.ts  # Entidades do Acervo
│   ├── audiencias.ts
│   ├── partes.ts  # Cliente, ParteContraria, Terceiro
│   ├── enderecos.ts
│   └── index.ts
├── contracts/     # Tipos da camada de Aplicação (DDD)
│   ├── acervo.ts  # DTOs para Acervo
│   ├── partes.ts
│   └── index.ts
└── index.ts       # Exporta domain + contracts`}
          </pre>
          <div className="space-y-2">
            {folderStructure.map((folder) => (
              <div key={folder.path} className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded font-mono">{folder.path}</code>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{folder.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Naming Conventions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            <CardTitle>Convenções de Nomenclatura</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Categoria</th>
                  <th className="text-left py-2 font-medium">Padrão</th>
                  <th className="text-left py-2 font-medium">Exemplo</th>
                </tr>
              </thead>
              <tbody>
                {conventions.map((conv) => (
                  <tr key={conv.category} className="border-b last:border-0">
                    <td className="py-2">{conv.category}</td>
                    <td className="py-2">
                      <code className="bg-muted px-1 rounded">{conv.pattern}</code>
                    </td>
                    <td className="py-2 text-muted-foreground">{conv.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guia de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Importar Tipos de Domínio</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`// Domínio vive dentro da feature (source of truth)
import type { Cliente } from '@/app/(authenticated)/partes';
import type { GrauProcesso } from '@/app/(authenticated)/partes';`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Importar Contratos/DTOs</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import type { ListarClientesParams } from '@/types/contracts';
// ou mais específico
import type { ListarClientesParams } from '@/types/contracts/partes';`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Regra de Dependência</h4>
            <p className="text-sm text-muted-foreground">
              Camadas superiores (Application/UI) importam de camadas inferiores (Domain),
              mas <strong>nunca</strong> o contrário. Isso garante que o domínio permaneça
              puro e independente de detalhes de infraestrutura.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Boas Práticas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Injeção de Dependência:</strong> Serviços
              e Repositórios são gerenciados e injetados
            </li>
            <li>
              <strong className="text-foreground">Validações:</strong> Regras aplicadas na
              camada apropriada (domínio para negócio, aplicação para DTOs)
            </li>
            <li>
              <strong className="text-foreground">Testes:</strong> Arquitetura em camadas
              facilita teste unitário isolado
            </li>
            <li>
              <strong className="text-foreground">Linguagem Ubíqua:</strong> Nomes refletem
              o vocabulário do domínio jurídico
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
