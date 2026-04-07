"use client"

import * as React from "react"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-breakpoint"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface FilterGroup {
    label: string
    options: FilterOption[]
}

export interface FilterOption {
    value: string
    label: string
    searchText?: string
}

interface ResponsiveFilterPanelProps {
    /**
     * Grupos de filtros a serem exibidos
     */
    filterGroups: FilterGroup[]

    /**
     * IDs dos filtros atualmente selecionados
     */
    selectedFilters: string[]

    /**
     * Callback quando os filtros mudam
     */
    onFiltersChange: (filters: string[]) => void

    /**
     * Título do painel de filtros (usado no mobile)
     */
    title?: string

    /**
     * Descrição do painel de filtros (usado no mobile)
     */
    description?: string

    /**
     * Classe CSS adicional para o container
     */
    className?: string

    /**
     * Renderização customizada para cada grupo de filtros
     * Se não fornecido, usa renderização padrão com checkboxes
     */
    renderFilterGroup?: (group: FilterGroup, selectedFilters: string[], onToggle: (value: string) => void) => React.ReactNode
}

/**
 * Componente de filtro individual com checkbox
 */
function FilterCheckbox({
    option,
    isSelected,
    onToggle,
}: {
    option: FilterOption
    isSelected: boolean
    onToggle: () => void
}) {
    return (
        <label
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
                isSelected && "bg-accent"
            )}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">{option.label}</span>
        </label>
    )
}

/**
 * Renderização padrão de um grupo de filtros
 */
function DefaultFilterGroup({
    group,
    selectedFilters,
    onToggle,
}: {
    group: FilterGroup
    selectedFilters: string[]
    onToggle: (value: string) => void
}) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold px-3">{group.label}</h3>
            <div className="space-y-1">
                {group.options.map((option) => (
                    <FilterCheckbox
                        key={option.value}
                        option={option}
                        isSelected={selectedFilters.includes(option.value)}
                        onToggle={() => onToggle(option.value)}
                    />
                ))}
            </div>
        </div>
    )
}

/**
 * Painel de filtros responsivo que se adapta entre desktop e mobile
 * 
 * - Desktop (≥768px): Exibe filtros inline
 * - Mobile (<768px): Exibe botão "Filtros" que abre Sheet lateral
 */
export function ResponsiveFilterPanel({
    filterGroups,
    selectedFilters,
    onFiltersChange,
    title = "Filtros",
    description,
    className,
    renderFilterGroup,
}: ResponsiveFilterPanelProps) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = React.useState(false)

    const handleToggleFilter = React.useCallback((value: string) => {
        const newSelected = selectedFilters.includes(value)
            ? selectedFilters.filter((v) => v !== value)
            : [...selectedFilters, value]
        onFiltersChange(newSelected)
    }, [selectedFilters, onFiltersChange])

    const handleClearAll = React.useCallback(() => {
        onFiltersChange([])
    }, [onFiltersChange])

    const filterCount = selectedFilters.length

    // Conteúdo dos filtros (reutilizado em desktop e mobile)
    const filterContent = (
        <div className="space-y-4">
            {filterGroups.map((group) => (
                <div key={group.label}>
                    {renderFilterGroup ? (
                        renderFilterGroup(group, selectedFilters, handleToggleFilter)
                    ) : (
                        <DefaultFilterGroup
                            group={group}
                            selectedFilters={selectedFilters}
                            onToggle={handleToggleFilter}
                        />
                    )}
                </div>
            ))}
        </div>
    )

    // Mobile: Botão + Sheet
    if (isMobile) {
        return (
            <>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className={cn("gap-2", className)}
                >
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                    {filterCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full"
                        >
                            {filterCount}
                        </Badge>
                    )}
                </Button>

                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent side="left" className="w-[min(92vw,24rem)] flex flex-col p-0">
                        <SheetHeader className="px-4 pt-4 pb-2 border-b">
                            <SheetTitle>{title}</SheetTitle>
                            {description && <SheetDescription>{description}</SheetDescription>}
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-4 py-4">
                            {filterContent}
                        </ScrollArea>

                        {filterCount > 0 && (
                            <SheetFooter className="px-4 pb-4 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="w-full"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Limpar filtros ({filterCount})
                                </Button>
                            </SheetFooter>
                        )}
                    </SheetContent>
                </Sheet>
            </>
        )
    }

    // Desktop: Filtros inline
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{title}</h3>
                {filterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-8 text-xs"
                    >
                        Limpar ({filterCount})
                    </Button>
                )}
            </div>
            {filterContent}
        </div>
    )
}
