'use client';

import { PenTool, FileCheck, Camera, MapPin, Settings, FileText, Layers, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

const userSteps = [
  {
    step: 1,
    title: 'Verificação de CPF',
    description: 'Digite seu CPF. Se você já está cadastrado, seus dados serão carregados automaticamente.',
    tips: ['Digite apenas números ou use formato com pontos e traço', 'Ambos funcionam: 12345678900 ou 123.456.789-00'],
  },
  {
    step: 2,
    title: 'Dados Pessoais',
    description: 'Preencha seus dados: nome completo, RG, endereço, telefone e e-mail.',
    tips: ['Digite o CEP primeiro - endereço é preenchido automaticamente!', 'Campos com * são obrigatórios'],
  },
  {
    step: 3,
    title: 'Formulário Dinâmico',
    description: 'Preencha os campos específicos do formulário (variam conforme o tipo).',
    tips: ['Alguns campos aparecem/desaparecem conforme suas respostas', 'Use os placeholders como exemplo'],
  },
  {
    step: 4,
    title: 'Captura de Foto',
    description: 'Se necessário, capture sua foto usando a câmera do dispositivo.',
    tips: ['Use boa iluminação', 'Olhe para a câmera', 'Pode recapturar se não gostar'],
  },
  {
    step: 5,
    title: 'Geolocalização',
    description: 'Se necessário, permita o acesso à sua localização.',
    tips: ['Ative o GPS do dispositivo', 'Aguarde a precisão melhorar (< 50m é bom)'],
  },
  {
    step: 6,
    title: 'Visualização do PDF',
    description: 'Revise o documento gerado com seus dados antes de assinar.',
    tips: ['Leia com atenção!', 'Clique em "Voltar" se encontrar erros'],
  },
  {
    step: 7,
    title: 'Assinatura Manuscrita',
    description: 'Assine usando mouse (desktop) ou dedo (mobile) na área indicada.',
    tips: ['Assine como normalmente faz', 'Pode limpar e refazer', 'Evite traços muito rápidos'],
  },
  {
    step: 8,
    title: 'Download dos PDFs',
    description: 'Baixe os documentos gerados e guarde em local seguro.',
    tips: ['Baixe TODOS os PDFs', 'Faça backup (Google Drive, Dropbox, etc.)'],
  },
];

const userProblems = [
  { problem: 'Página não encontrada (404)', solution: 'Verifique o link com quem te enviou' },
  { problem: 'Câmera não funciona', solution: 'Recarregue a página e clique "Permitir" quando pedir. Feche outros apps que usam câmera.' },
  { problem: 'Localização não funciona', solution: 'Ative o GPS no dispositivo e clique "Permitir" quando pedir.' },
  { problem: 'PDF não gera', solution: 'Volte e verifique se todos os campos estão preenchidos. Tente recarregar.' },
  { problem: 'Não consigo baixar PDF', solution: 'Desative bloqueador de pop-ups. Tente botão direito → "Salvar como".' },
  { problem: 'Perdi dados no meio do preenchimento', solution: 'Infelizmente precisa preencher novamente. Não feche a aba até finalizar!' },
];

const userFaq = [
  { q: 'Quanto tempo leva para preencher?', a: 'Entre 5 e 15 minutos, dependendo do formulário.' },
  { q: 'Posso preencher no celular?', a: 'Sim! Mas desktop é mais confortável.' },
  { q: 'Preciso criar conta?', a: 'Não! Basta ter CPF.' },
  { q: 'Meus dados ficam salvos?', a: 'Sim, para facilitar preenchimentos futuros.' },
  { q: 'Posso editar depois de finalizar?', a: 'Não. Revise bem antes de assinar!' },
  { q: 'Os PDFs têm validade jurídica?', a: 'Sim! Incluem assinatura digital, IP, localização e timestamp.' },
  { q: 'Posso preencher para outra pessoa?', a: 'Não. Cada pessoa deve preencher com seu próprio CPF.' },
  { q: 'Posso deletar meus dados?', a: 'Sim. Entre em contato com o suporte.' },
];

const adminVariables = [
  { category: 'Cliente', vars: ['nome', 'cpf', 'rg', 'data_nascimento', 'nacionalidade', 'estado_civil', 'profissao', 'endereco_completo', 'telefone', 'email'] },
  { category: 'Ação', vars: ['reclamada_nome', 'modalidade', 'trt'] },
  { category: 'Sistema', vars: ['data_atual', 'hora_atual'] },
  { category: 'Assinatura', vars: ['imagem', 'data', 'ip', 'localizacao'] },
];

export default function AssinaturaDigitalPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PenTool className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Assinatura Digital</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Sistema de formulários digitais com assinatura manuscrita, captura de foto e geolocalização.
        </p>
      </div>

      {/* Tabs: Usuário vs Administrador */}
      <Tabs defaultValue="usuario" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usuario">Guia do Usuário</TabsTrigger>
          <TabsTrigger value="administrador">Guia do Administrador</TabsTrigger>
        </TabsList>

        {/* === GUIA DO USUÁRIO === */}
        <TabsContent value="usuario" className="space-y-6">
          {/* Requisitos */}
          <Card>
            <CardHeader>
              <CardTitle>O que você vai precisar</CardTitle>
              <CardDescription>Prepare estes itens antes de começar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <FileCheck className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">CPF válido</p>
                    <p className="text-sm text-muted-foreground">Para identificação</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Documentos pessoais</p>
                    <p className="text-sm text-muted-foreground">RG, endereço, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Camera className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Câmera</p>
                    <p className="text-sm text-muted-foreground">Se o formulário exigir foto</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Localização</p>
                    <p className="text-sm text-muted-foreground">Se o formulário exigir GPS</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Tempo estimado:</strong> 5-10 minutos
              </p>
            </CardContent>
          </Card>

          {/* Passo a Passo */}
          <Card>
            <CardHeader>
              <CardTitle>Passo a Passo do Preenchimento</CardTitle>
              <CardDescription>Siga estes 8 passos para completar o formulário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {userSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {step.step}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.tips.map((tip, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Problemas Comuns */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Problemas Comuns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {userProblems.map((item, index) => (
                  <AccordionItem key={index} value={`problem-${index}`}>
                    <AccordionTrigger className="text-left">{item.problem}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.solution}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                <CardTitle>Perguntas Frequentes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {userFaq.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === GUIA DO ADMINISTRADOR === */}
        <TabsContent value="administrador" className="space-y-6">
          {/* Permissões */}
          <Card>
            <CardHeader>
              <CardTitle>Permissões Necessárias</CardTitle>
              <CardDescription>Recurso: assinatura_digital</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Listar</Badge>
                <Badge>Visualizar</Badge>
                <Badge>Criar</Badge>
                <Badge>Editar</Badge>
                <Badge>Deletar</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Super admins têm todas as permissões automaticamente.
              </p>
            </CardContent>
          </Card>

          {/* Conceitos */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  <CardTitle className="text-lg">Segmentos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Categorias para organizar formulários.
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Exemplos:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>trabalhista</li>
                    <li>previdenciario</li>
                    <li>civel</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle className="text-lg">Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Modelos de PDF com campos variáveis.
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Tipos de campos:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Texto simples</li>
                    <li>Imagem (assinatura/foto)</li>
                    <li>Texto composto (rich text)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle className="text-lg">Formulários</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Combinação de templates + schema dinâmico.
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Opções:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Foto necessária</li>
                    <li>Geolocalização necessária</li>
                    <li>Múltiplos templates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Criando Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Criando seu Primeiro Formulário</CardTitle>
              <CardDescription>Passo a passo completo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">1</Badge>
                  <div>
                    <h4 className="font-semibold">Criar Segmento</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesse <code className="bg-muted px-1 rounded">/assinatura-digital/segmentos</code> → &quot;Novo Segmento&quot;
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">2</Badge>
                  <div>
                    <h4 className="font-semibold">Criar Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload de PDF (10KB-10MB) → Abrir editor visual → Posicionar campos
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">3</Badge>
                  <div>
                    <h4 className="font-semibold">Editar Template no Editor</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicionar campos de texto, imagem e texto composto. Testar preview.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">4</Badge>
                  <div>
                    <h4 className="font-semibold">Criar Formulário</h4>
                    <p className="text-sm text-muted-foreground">
                      Vincular ao segmento e templates. Configurar foto/geolocalização.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">5</Badge>
                  <div>
                    <h4 className="font-semibold">Editar Schema</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicionar seções e campos dinâmicos (texto, select, checkbox, etc.).
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">6</Badge>
                  <div>
                    <h4 className="font-semibold">Testar Fluxo</h4>
                    <p className="text-sm text-muted-foreground">
                      Abrir URL pública em aba anônima e simular preenchimento completo.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variáveis */}
          <Card>
            <CardHeader>
              <CardTitle>Variáveis Disponíveis</CardTitle>
              <CardDescription>Use no formato {'{{categoria.variavel}}'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {adminVariables.map((group) => (
                  <div key={group.category}>
                    <h4 className="font-semibold mb-2">{group.category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {group.vars.map((v) => (
                        <code key={v} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {`{{${group.category.toLowerCase()}.${v}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editor Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Editor Visual de Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Modos de Edição</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Selecionar:</strong> Mover e redimensionar campos</li>
                    <li><strong>Adicionar Texto:</strong> Campos de texto simples</li>
                    <li><strong>Adicionar Imagem:</strong> Assinatura ou foto</li>
                    <li><strong>Adicionar Texto Composto:</strong> Rich text com variáveis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Atalhos de Teclado</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><Badge variant="outline" className="text-xs">Delete</Badge> Deletar campo</li>
                    <li><Badge variant="outline" className="text-xs">Escape</Badge> Desselecionar</li>
                    <li><Badge variant="outline" className="text-xs">Setas</Badge> Mover 1px</li>
                    <li><Badge variant="outline" className="text-xs">Shift+Setas</Badge> Mover 10px</li>
                  </ul>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Controles</h4>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span><strong>Zoom:</strong> 50% - 200%</span>
                  <span>•</span>
                  <span><strong>Navegação:</strong> Setas para páginas</span>
                  <span>•</span>
                  <span><strong>Autosave:</strong> A cada 5 segundos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FormSchemaBuilder */}
          <Card>
            <CardHeader>
              <CardTitle>Editor de Schema (FormSchemaBuilder)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tipos de Campo</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">text</Badge>
                  <Badge variant="secondary">email</Badge>
                  <Badge variant="secondary">textarea</Badge>
                  <Badge variant="secondary">number</Badge>
                  <Badge variant="secondary">date</Badge>
                  <Badge variant="secondary">select</Badge>
                  <Badge variant="secondary">radio</Badge>
                  <Badge variant="secondary">checkbox</Badge>
                  <Badge variant="secondary">CPF</Badge>
                  <Badge variant="secondary">CNPJ</Badge>
                  <Badge variant="secondary">phone</Badge>
                  <Badge variant="secondary">CEP</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Propriedades</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>ID (chave no JSON)</li>
                    <li>Label, Placeholder, Descrição</li>
                    <li>Obrigatório (validação)</li>
                    <li>Largura (33%, 50%, 100%)</li>
                    <li>Min/Max (texto, número)</li>
                    <li>Regex (validação customizada)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Campos Condicionais</h4>
                  <p className="text-sm text-muted-foreground">
                    Mostrar campo apenas se outro campo tiver determinado valor.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Operadores:</strong> =, !=, &gt;, &lt;, contains, empty, notEmpty
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boas Práticas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <CardTitle>Boas Práticas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Segmentos</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Use nomes descritivos e curtos</li>
                    <li>Slugs em kebab-case</li>
                    <li>Não altere slugs após publicação</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Templates</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Use status &quot;Rascunho&quot; durante edição</li>
                    <li>Teste preview antes de ativar</li>
                    <li>Campos mínimo 50x20px</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Formulários</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Foto/geo apenas quando necessário</li>
                    <li>Organize em seções lógicas</li>
                    <li>Teste fluxo completo antes de publicar</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Schemas</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>IDs descritivos (ex: reclamada_nome)</li>
                    <li>Máximo 20 campos por seção</li>
                    <li>Use condicionais para simplificar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Admin */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                <CardTitle>Perguntas Frequentes (Admin)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>Posso usar o mesmo template em múltiplos formulários?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sim! Um template pode ser vinculado a vários formulários.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger>Como alterar o slug de um segmento/formulário?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Não é possível após criação para evitar quebrar URLs públicas. Crie um novo e desative o antigo.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger>O que acontece se deletar um template usado em formulários?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    O formulário continua funcionando, mas não conseguirá gerar PDFs. Desative ao invés de deletar.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4">
                  <AccordionTrigger>Como funciona o cálculo do TRT?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    É calculado automaticamente com base no UF do endereço do cliente.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-5">
                  <AccordionTrigger>Como funciona o autosave no editor?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Salva automaticamente a cada 5 segundos. Não é necessário clicar em &quot;Salvar&quot;.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-6">
                  <AccordionTrigger>Como rastrear quem assinou um formulário?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Todos os dados são salvos no banco, incluindo IP, geolocalização, data/hora e métricas da assinatura.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
