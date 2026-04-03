'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import {
    Folder,
    File,
    FileText,
    Home,
    Search,
    Plus,
    ArrowDown,
    ArrowUp,
    ChevronsUpDown,
    UploadIcon,
    FolderPlus,
    X,
    ImageIcon,
    FileVideoIcon,
    FileAudioIcon,
    ExternalLink,
    Share2,
    Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/app/(authenticated)/usuarios';

import { FileUploadDialogUnified } from './file-upload-dialog-unified';
import { CreateFolderDialog } from './create-folder-dialog';
import { CreateDocumentDialog } from './create-document-dialog';
import {
    actionListarItensUnificados,
    actionDeletarArquivo,
    actionBuscarCaminhoPasta,
} from '../actions/arquivos-actions';
import { actionDeletarDocumento } from '../actions/documentos-actions';
import type { ItemDocumento } from '../domain';

type SortOption = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

/**
 * Retorna ícone colorido baseado no tipo de item/arquivo.
 *
 * @ai-context Cores alinhadas com design system:
 * - orange: pastas (folders)
 * - blue: documentos de texto
 * - green: imagens
 * - purple: vídeos
 * - red: PDFs
 */
function getItemIcon(item: ItemDocumento) {
    if (item.tipo === 'pasta') {
        return <Folder className="h-5 w-5 text-orange-600" />;
    } else if (item.tipo === 'documento') {
        return <FileText className="h-5 w-5 text-blue-600" />;
    } else {
        const mime = item.dados.tipo_mime;
        if (mime.startsWith('image/')) {
            return <ImageIcon className="h-5 w-5 text-green-600" />;
        } else if (mime.startsWith('video/')) {
            return <FileVideoIcon className="h-5 w-5 text-purple-600" />;
        } else if (mime.startsWith('audio/')) {
            return <FileAudioIcon className="h-5 w-5 text-orange-600" />;
        } else if (mime === 'application/pdf') {
            return <FileText className="h-5 w-5 text-red-600" />;
        }
        return <File className="h-5 w-5 text-gray-500" />;
    }
}

function getItemName(item: ItemDocumento): string {
    if (item.tipo === 'pasta') return item.dados.nome;
    if (item.tipo === 'documento') return item.dados.titulo;
    return item.dados.nome;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getPreviewIcon(item: ItemDocumento) {
    const baseClasses = 'flex items-center justify-center rounded-xl';

    if (item.tipo === 'pasta') {
        return (
            <div className={`${baseClasses} h-20 w-20 bg-orange-50 dark:bg-orange-950/30`}>
                <Folder className="h-10 w-10 text-orange-500" />
            </div>
        );
    }

    if (item.tipo === 'documento') {
        return (
            <div className={`${baseClasses} h-20 w-20 bg-blue-50 dark:bg-blue-950/30`}>
                <FileText className="h-10 w-10 text-blue-600" />
            </div>
        );
    }

    // Arquivo
    const mime = item.dados.tipo_mime;

    // Thumbnail para imagens
    if (mime.startsWith('image/')) {
        return (
            <div className="relative h-32 w-full overflow-hidden rounded-xl border bg-muted">
                <Image
                    src={item.dados.b2_url}
                    alt={getItemName(item)}
                    fill
                    className="object-cover"
                    unoptimized={true}
                />
            </div>
        );
    }

    if (mime.startsWith('video/')) {
        return (
            <div className={`${baseClasses} h-20 w-20 bg-purple-50 dark:bg-purple-950/30`}>
                <FileVideoIcon className="h-10 w-10 text-purple-600" />
            </div>
        );
    }

    if (mime.startsWith('audio/')) {
        return (
            <div className={`${baseClasses} h-20 w-20 bg-orange-50 dark:bg-orange-950/30`}>
                <FileAudioIcon className="h-10 w-10 text-orange-500" />
            </div>
        );
    }

    if (mime === 'application/pdf') {
        return (
            <div className={`${baseClasses} relative h-20 w-20 bg-red-50 dark:bg-red-950/30`}>
                <FileText className="h-10 w-10 text-red-600" />
                <span className="absolute bottom-2 text-[10px] font-bold uppercase text-red-600 dark:text-red-600">
                    PDF
                </span>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} h-20 w-20 bg-gray-50 dark:bg-gray-800`}>
            <File className="h-10 w-10 text-gray-400" />
        </div>
    );
}

export function FileManager() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const [items, setItems] = useState<ItemDocumento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<ItemDocumento | null>(null);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Dialogs
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createDocumentOpen, setCreateDocumentOpen] = useState(false);

    // Path handling
    const pathParam = searchParams.get('pasta');
    const currentPastaId = pathParam ? parseInt(pathParam) : null;
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; nome: string }[]>([]);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const result = await actionListarItensUnificados({
                pasta_id: currentPastaId,
                busca: searchQuery || undefined,
                limit: 100,
                offset: 0,
            });

            if (result.success && result.data) {
                setItems(result.data);
            } else {
                toast.error(result.error || 'Erro ao carregar itens');
            }
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            toast.error('Erro ao carregar itens');
        } finally {
            setLoading(false);
        }
    }, [currentPastaId, searchQuery]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // Carregar breadcrumbs
    useEffect(() => {
        if (!currentPastaId) {
            setBreadcrumbs([]);
            return;
        }

        const loadBreadcrumbs = async () => {
            try {
                const result = await actionBuscarCaminhoPasta(currentPastaId);
                if (result.success && result.data) {
                    setBreadcrumbs(result.data.map(p => ({ id: p.id, nome: p.nome })));
                } else {
                    console.error('Erro ao carregar breadcrumbs:', result.error);
                }
            } catch (error) {
                console.error('Erro ao carregar breadcrumbs:', error);
            }
        };

        loadBreadcrumbs();
    }, [currentPastaId]);

    useEffect(() => {
        setSelectedItem(null);
        setShowMobileDetails(false);
    }, [currentPastaId]);

    const handleItemClick = (item: ItemDocumento) => {
        if (item.tipo === 'pasta') {
            router.push(`/documentos?pasta=${item.dados.id}`);
        } else if (item.tipo === 'documento') {
            router.push(`/documentos/${item.dados.id}`);
        } else {
            setSelectedItem(item);
            if (isMobile) {
                setShowMobileDetails(true);
            }
        }
    };

    const handleDeleteItem = async (item: ItemDocumento, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (item.tipo === 'documento') {
                const result = await actionDeletarDocumento(item.dados.id);
                if (!result.success) throw new Error(result.error);
            } else if (item.tipo === 'arquivo') {
                const result = await actionDeletarArquivo(item.dados.id);
                if (!result.success) throw new Error(result.error);
            }
            toast.success('Item movido para a lixeira');
            loadItems();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            toast.error('Erro ao deletar item');
        }
    };

    const handleShareItem = (item: ItemDocumento, e: React.MouseEvent) => {
        e.stopPropagation();
        toast.message('Compartilhar', { description: 'Em breve.' });
    };

    const _handleSortChange = (option: SortOption) => {
        if (sortBy === option) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortDirection('asc');
        }
    };

    const _getSortLabel = () => {
        const icon = sortDirection === 'asc' ? '↑' : '↓';
        const labels = { name: 'Nome', date: 'Data', size: 'Tamanho' };
        return `${labels[sortBy]} ${icon}`;
    };

    const sortedItems = [...items].sort((a, b) => {
        // Pastas sempre primeiro
        if (a.tipo === 'pasta' && b.tipo !== 'pasta') return -1;
        if (a.tipo !== 'pasta' && b.tipo === 'pasta') return 1;

        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = getItemName(a).localeCompare(getItemName(b));
                break;
            case 'date':
                comparison = new Date(a.dados.created_at).getTime() - new Date(b.dados.created_at).getTime();
                break;
            case 'size':
                const sizeA = a.tipo === 'arquivo' ? a.dados.tamanho_bytes : 0;
                const sizeB = b.tipo === 'arquivo' ? b.dados.tamanho_bytes : 0;
                comparison = sizeA - sizeB;
                break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const filteredItems = sortedItems.filter((item) =>
        getItemName(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full">
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Linha 1: Título + Botão de Ação (py-4 = mesmo espaçamento do DataTableToolbar) */}
                <div className="flex items-center justify-between py-4">
                    <h1 className="text-2xl font-bold tracking-tight font-heading">Documentos</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-9">
                                <Plus className="h-4 w-4" />
                                Novo
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Nova Pasta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCreateDocumentOpen(true)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Novo Documento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setUploadDialogOpen(true)}>
                                <UploadIcon className="mr-2 h-4 w-4" />
                                Upload
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Linha 2: Busca (pb-4 = mesmo espaçamento do DataTableToolbar) */}
                <div className="flex items-center gap-4 pb-4">
                    <div className="relative w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar arquivos e pastas..."
                            className="h-9 w-full bg-card pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Breadcrumbs (condicional) */}
                {currentPastaId && (
                    <div className="flex items-center gap-2 pb-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => router.push('/documentos')}
                                >
                                    <Home className="h-4 w-4" />
                                </BreadcrumbItem>
                                {breadcrumbs.map((bc) => (
                                    <div key={bc.id || 'root'} className="flex items-center">
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() =>
                                                router.push(bc.id ? `/documentos?pasta=${bc.id}` : '/documentos')
                                            }
                                        >
                                            {bc.nome}
                                        </BreadcrumbItem>
                                    </div>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                )}

                {/* Content */}
                <div className="flex min-h-0 flex-1 gap-4">
                    <div className="flex min-w-0 flex-1 flex-col">
                        {loading ? (
                            <div className="flex-1 overflow-hidden rounded-lg border bg-card">
                                <div className="space-y-2 p-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border bg-card text-center">
                                <File className="mx-auto h-12 w-12 opacity-50" />
                                <h2 className="mt-4 text-muted-foreground">
                                    {searchQuery ? 'Nenhum item encontrado' : 'Não há arquivos'}
                                </h2>
                                {!searchQuery && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="mt-4">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Adicionar
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center">
                                            <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                                                <FolderPlus className="mr-2 h-4 w-4" />
                                                Nova Pasta
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setCreateDocumentOpen(true)}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Novo Documento
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setUploadDialogOpen(true)}>
                                                <UploadIcon className="mr-2 h-4 w-4" />
                                                Fazer upload de arquivo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                                <div className="flex-1 overflow-auto">
                                    {/* Header — mesmo container e padding que as linhas */}
                                    <div className="sticky top-0 z-10 hidden border-b bg-card px-4 py-3 text-sm font-medium text-muted-foreground lg:block">
                                        <div className="grid grid-cols-[minmax(0,1fr)_160px_56px_112px] items-center gap-4">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="h-5 w-5 shrink-0" aria-hidden="true" />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1.5 hover:text-foreground"
                                                        >
                                                            <span>Nome</span>
                                                            {sortBy !== 'name' ? (
                                                                <ChevronsUpDown className="h-4 w-4" />
                                                            ) : sortDirection === 'desc' ? (
                                                                <ArrowDown className="h-4 w-4" />
                                                            ) : (
                                                                <ArrowUp className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSortBy('name');
                                                                setSortDirection('asc');
                                                            }}
                                                        >
                                                            <ArrowUp className="mr-2 h-4 w-4" />
                                                            Crescente
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSortBy('name');
                                                                setSortDirection('desc');
                                                            }}
                                                        >
                                                            <ArrowDown className="mr-2 h-4 w-4" />
                                                            Decrescente
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1.5 hover:text-foreground"
                                                    >
                                                        <span>Criado em</span>
                                                        {sortBy !== 'date' ? (
                                                            <ChevronsUpDown className="h-4 w-4" />
                                                        ) : sortDirection === 'desc' ? (
                                                            <ArrowDown className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUp className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSortBy('date');
                                                            setSortDirection('asc');
                                                        }}
                                                    >
                                                        <ArrowUp className="mr-2 h-4 w-4" />
                                                        Crescente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSortBy('date');
                                                            setSortDirection('desc');
                                                        }}
                                                    >
                                                        <ArrowDown className="mr-2 h-4 w-4" />
                                                        Decrescente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <span>Por</span>
                                            <span>Ações</span>
                                        </div>
                                    </div>
                                    {filteredItems.map((item) => (
                                        <div
                                            key={`${item.tipo}-${item.dados.id}`}
                                            className={cn(
                                                'cursor-pointer border-b px-4 py-4 last:border-b-0 hover:bg-muted',
                                                selectedItem?.dados.id === item.dados.id &&
                                                selectedItem?.tipo === item.tipo &&
                                                'bg-muted'
                                            )}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <div className="flex items-center justify-between gap-4 lg:hidden">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <div className="shrink-0">{getItemIcon(item)}</div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">{getItemName(item)}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {item.tipo === 'arquivo' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(item.dados.b2_url, '_blank');
                                                            }}
                                                            aria-label="Abrir"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={(e) => handleShareItem(item, e)}
                                                        aria-label="Compartilhar"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </Button>
                                                    {item.tipo !== 'pasta' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={(e) => handleDeleteItem(item, e)}
                                                            aria-label="Excluir"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_160px_56px_112px] lg:items-center lg:gap-4">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <div className="shrink-0">{getItemIcon(item)}</div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">{getItemName(item)}</div>
                                                    </div>
                                                </div>

                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(item.dados.created_at).toLocaleDateString('pt-BR')}
                                                </span>

                                                <Avatar className="h-7 w-7">
                                                    {getAvatarUrl(
                                                        (item.dados.criador as { avatarUrl?: string | null; avatar_url?: string | null } | undefined)?.avatarUrl ??
                                                        (item.dados.criador as { avatarUrl?: string | null; avatar_url?: string | null } | undefined)?.avatar_url
                                                    ) ? (
                                                        <AvatarImage
                                                            src={
                                                                getAvatarUrl(
                                                                    (item.dados.criador as { avatarUrl?: string | null; avatar_url?: string | null } | undefined)?.avatarUrl ??
                                                                    (item.dados.criador as { avatarUrl?: string | null; avatar_url?: string | null } | undefined)?.avatar_url
                                                                ) ?? undefined
                                                            }
                                                            alt={item.dados.criador?.nomeCompleto || 'Avatar'}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="text-xs">
                                                        {item.dados.criador?.nomeCompleto?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex justify-start gap-0.5">
                                                    {item.tipo === 'arquivo' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(item.dados.b2_url, '_blank');
                                                            }}
                                                            aria-label="Abrir"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={(e) => handleShareItem(item, e)}
                                                        aria-label="Compartilhar"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </Button>
                                                    {item.tipo !== 'pasta' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={(e) => handleDeleteItem(item, e)}
                                                            aria-label="Excluir"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Details Panel */}
                    {selectedItem && !isMobile && (
                        <div className="flex w-80 shrink-0 flex-col">
                            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                                <Button
                                    onClick={() => setSelectedItem(null)}
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute right-2 top-2 z-10"
                                >
                                    <X className="h-4 w-4" />
                                </Button>

                                {/* Área do ícone e nome */}
                                <div className="flex flex-col items-center gap-4 rounded-t-xl bg-muted/50 p-6 pt-10">
                                    {getPreviewIcon(selectedItem)}
                                    <h2 className="max-w-full wrap-break-word text-center text-sm font-medium leading-tight">
                                        {getItemName(selectedItem)}
                                    </h2>
                                </div>

                                {/* Conteúdo do card */}
                                <div className="flex flex-1 flex-col space-y-4 p-6">
                                    {/* Seção de metadados */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Informações
                                        </h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1">
                                                <span className="text-muted-foreground">Tipo</span>
                                                <span className="font-medium capitalize">{selectedItem.tipo}</span>
                                            </div>
                                            {selectedItem.tipo === 'arquivo' && (
                                                <div className="flex justify-between py-1">
                                                    <span className="text-muted-foreground">Tamanho</span>
                                                    <span className="font-medium">
                                                        {formatFileSize(selectedItem.dados.tamanho_bytes)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between py-1">
                                                <span className="text-muted-foreground">Criado em</span>
                                                <span className="font-medium">
                                                    {new Date(selectedItem.dados.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botão de ação */}
                                    {selectedItem.tipo === 'arquivo' && (
                                        <div className="mt-auto pt-4">
                                            <Button
                                                className="w-full gap-2"
                                                onClick={() => window.open(selectedItem.dados.b2_url, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Abrir Arquivo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <FileUploadDialogUnified
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                pastaId={currentPastaId}
                onSuccess={loadItems}
            />

            <CreateFolderDialog
                open={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
                pastaPaiId={currentPastaId}
                onSuccess={loadItems}
            />

            <CreateDocumentDialog
                open={createDocumentOpen}
                onOpenChange={setCreateDocumentOpen}
                pastaId={currentPastaId}
                onSuccess={loadItems}
            />

            {/* Mobile Sheet */}
            {selectedItem && isMobile && (
                <Sheet open={showMobileDetails} onOpenChange={setShowMobileDetails}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Detalhes</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                            {/* Área do ícone e nome */}
                            <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-6">
                                {getPreviewIcon(selectedItem)}
                                <h2 className="max-w-full wrap-break-word text-center text-sm font-medium leading-tight">
                                    {getItemName(selectedItem)}
                                </h2>
                            </div>

                            <Separator />

                            {/* Seção de metadados */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Informações
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Tipo</span>
                                        <span className="font-medium capitalize">{selectedItem.tipo}</span>
                                    </div>
                                    {selectedItem.tipo === 'arquivo' && (
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">Tamanho</span>
                                            <span className="font-medium">
                                                {formatFileSize(selectedItem.dados.tamanho_bytes)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Criado em</span>
                                        <span className="font-medium">
                                            {new Date(selectedItem.dados.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de ação */}
                            {selectedItem.tipo === 'arquivo' && (
                                <Button
                                    className="w-full gap-2"
                                    onClick={() => window.open(selectedItem.dados.b2_url, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Arquivo
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}


