import { MapPin, Globe, FileJson, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const responseFields = [
  { field: 'cep', type: 'string', description: 'CEP formatado (01001-000)' },
  { field: 'logradouro', type: 'string', description: 'Nome da rua/avenida' },
  { field: 'complemento', type: 'string', description: 'Complemento (lado ímpar, etc.)' },
  { field: 'bairro', type: 'string', description: 'Nome do bairro' },
  { field: 'localidade', type: 'string', description: 'Nome da cidade' },
  { field: 'uf', type: 'string', description: 'Sigla do estado (2 letras)' },
  { field: 'estado', type: 'string', description: 'Nome completo do estado' },
  { field: 'regiao', type: 'string', description: 'Região geográfica' },
  { field: 'ibge', type: 'string', description: 'Código IBGE do município' },
  { field: 'ddd', type: 'string', description: 'Código DDD da cidade' },
];

export default function IntegracaoViacepPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Integração ViaCEP</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Webservice gratuito de consulta de CEP para auto-preenchimento de endereços.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O ViaCEP é um webservice gratuito de alto desempenho para consulta de
            Códigos de Endereçamento Postal (CEP) do Brasil. Utilizado no Synthropic
            para auto-preenchimento de endereços em formulários.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Gratuito</Badge>
            <Badge variant="secondary">Sem autenticação</Badge>
            <Badge variant="secondary">JSON/XML</Badge>
            <Badge variant="secondary">Alta disponibilidade</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Endpoint de Consulta</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Consulta por CEP</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`GET https://viacep.com.br/ws/{cep}/json/

# Exemplo
GET https://viacep.com.br/ws/01001000/json/`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Parâmetros</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code className="bg-muted px-1 rounded">cep</code>: 8 dígitos (apenas números)</li>
              <li>• Formatos aceitos: <code className="bg-muted px-1 rounded">01001000</code> ou <code className="bg-muted px-1 rounded">01001-000</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            <CardTitle>Resposta JSON</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "unidade": "",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "estado": "São Paulo",
  "regiao": "Sudeste",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7107"
}`}
          </pre>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Campo</th>
                  <th className="text-left py-2 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {responseFields.map((field) => (
                  <tr key={field.field} className="border-b last:border-0">
                    <td className="py-2">
                      <code className="bg-muted px-1 rounded">{field.field}</code>
                    </td>
                    <td className="py-2 text-muted-foreground">{field.type}</td>
                    <td className="py-2 text-muted-foreground">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Validação e Erros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">CEP Inválido (formato)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              CEPs com formato inválido (9 dígitos, alfanumérico, espaços) retornam <code className="bg-muted px-1 rounded">400 Bad Request</code>.
            </p>
            <pre className="text-sm bg-muted p-3 rounded-md">
{`// Exemplos de formatos inválidos:
"950100100"   // 9 dígitos
"95010A10"    // alfanumérico
"95010 10"    // espaço`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">CEP Inexistente</h4>
            <p className="text-sm text-muted-foreground mb-2">
              CEPs com formato válido mas inexistentes retornam JSON com <code className="bg-muted px-1 rounded">erro: true</code>.
            </p>
            <pre className="text-sm bg-muted p-3 rounded-md">
{`{
  "erro": true
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Implementation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Implementação no Synthropic</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Exemplo TypeScript</h4>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  erro?: boolean;
}

async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  // Remove caracteres não numéricos
  const cepNumerico = cep.replace(/\\D/g, '');

  // Valida formato (8 dígitos)
  if (cepNumerico.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  const response = await fetch(
    \`https://viacep.com.br/ws/\${cepNumerico}/json/\`
  );

  if (!response.ok) {
    throw new Error('Erro ao consultar CEP');
  }

  const data = await response.json();

  if (data.erro) {
    return null; // CEP não encontrado
  }

  return data;
}`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Uso em Formulários</h4>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// Hook para auto-preenchimento
function useAutoFillEndereco(form: UseFormReturn) {
  const buscarEndereco = useCallback(async (cep: string) => {
    const endereco = await buscarCep(cep);

    if (endereco) {
      form.setValue('logradouro', endereco.logradouro);
      form.setValue('bairro', endereco.bairro);
      form.setValue('cidade', endereco.localidade);
      form.setValue('uf', endereco.uf);
    }
  }, [form]);

  return { buscarEndereco };
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Search by Address */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisa por Endereço</CardTitle>
          <CardDescription>Buscar CEP a partir do endereço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Endpoint</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`GET https://viacep.com.br/ws/{UF}/{Cidade}/{Logradouro}/json/

# Exemplo
GET https://viacep.com.br/ws/RS/Porto%20Alegre/Domingos/json/`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Requisitos</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Mínimo de 3 caracteres para Cidade e Logradouro</li>
              <li>• Retorna até 50 CEPs ordenados por proximidade</li>
              <li>• Aceita espaços ou <code className="bg-muted px-1 rounded">+</code> no logradouro</li>
            </ul>
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
              <strong className="text-foreground">Debounce:</strong> Aguarde 500ms-1s após
              o usuário parar de digitar antes de consultar
            </li>
            <li>
              <strong className="text-foreground">Validação prévia:</strong> Valide o formato
              do CEP antes de fazer a requisição
            </li>
            <li>
              <strong className="text-foreground">Fallback manual:</strong> Permita que o
              usuário preencha manualmente se a API falhar
            </li>
            <li>
              <strong className="text-foreground">Cache:</strong> CEPs raramente mudam,
              considere cachear resultados
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referência</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Documentação oficial:{' '}
            <a
              href="https://viacep.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              viacep.com.br
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
