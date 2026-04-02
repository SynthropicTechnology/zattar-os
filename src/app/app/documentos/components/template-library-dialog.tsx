'use client';

/**
 * Dialog para biblioteca de templates
 * Permite buscar, filtrar e usar templates para criar novos documentos
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Loader2,
  Globe,
  Lock,
  Star,
} from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { TemplateCard } from './template-card';
import { useTemplates } from '../hooks/use-templates';
import { actionListarCategorias, actionListarTemplatesMaisUsados } from '../actions/templates-actions';
import type { TemplateComUsuario } from '../types';

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastaId?: number | null;
}

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  pastaId,
}: TemplateLibraryDialogProps) {
  const router = useRouter();
  const {
    templates,
    loading: templatesLoading,
    updateParams,
    createDocumentFromTemplate
  } = useTemplates({ limit: 50 });

  const [creating, setCreating] = React.useState(false);
  const [maisUsados, setMaisUsados] = React.useState<TemplateComUsuario[]>([]);
  const [categorias, setCategorias] = React.useState<string[]>([]);
  const [busca, setBusca] = React.useState('');
  const [buscaDebounced, setBuscaDebounced] = React.useState('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [visibilidade, setVisibilidade] = React.useState<string>('');
  const [tab, setTab] = React.useState('todos');

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  // Carregar dados iniciais
  React.useEffect(() => {
    if (open) {
      // Categorias
      actionListarCategorias()
        .then(result => {
          if (result.success && result.data) setCategorias(result.data);
        });

      // Mais usados
      actionListarTemplatesMaisUsados(4)
        .then(result => {
          if (result.success && result.data) setMaisUsados(result.data);
        });
    }
  }, [open]);

  // Atualizar filtros
  React.useEffect(() => {
    if (!open) return;

    updateParams({
      busca: buscaDebounced || undefined,
      categoria: categoria || undefined,
      visibilidade: (visibilidade as 'publico' | 'privado') || undefined,
    });
  }, [open, buscaDebounced, categoria, visibilidade, updateParams]);

  // Usar template
  const handleUseTemplate = async (template: TemplateComUsuario) => {
    setCreating(true);
    try {
      const doc = await createDocumentFromTemplate(template.id, { pasta_id: pastaId });

      toast.success(`Documento criado a partir de "${template.titulo}"`);
      onOpenChange(false);

      if (doc) {
        // Navegar para o novo documento
        router.push(`/documentos/${doc.id}`);
      }
    } catch (error) {
      console.error('Erro ao usar template:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar documento');
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setBusca('');
    setCategoria('');
    setVisibilidade('');
  };

  const hasFilters = busca || categoria || visibilidade;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Biblioteca de Templates
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Escolha um template para criar um novo documento
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <Tabs value={tab} onValueChange={setTab} className="flex-1">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="mais_usados">
                <Star className="h-4 w-4 mr-1" />
                Mais Usados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-0 space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={categoria}
                  onValueChange={(val) => setCategoria(val === '__all__' ? '' : val)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={visibilidade}
                  onValueChange={(val) => setVisibilidade(val === '__all__' ? '' : val)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    <SelectItem value="publico">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público
                      </div>
                    </SelectItem>
                    <SelectItem value="privado">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Privado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* Lista de templates */}
              <ScrollArea className="h-[400px]">
                {templatesLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">Nenhum template encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasFilters
                        ? 'Tente ajustar os filtros de busca'
                        : 'Crie seu primeiro template para reutilizar'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mais_usados" className="mt-0">
              <ScrollArea className="h-[400px]">
                {maisUsados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">Nenhum template popular ainda</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Templates mais usados aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {maisUsados.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Loading overlay */}
          {creating && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Criando documento...</p>
              </div>
            </div>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
