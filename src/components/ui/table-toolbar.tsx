"use client"

import * as React from "react"
import { Search, Filter, Plus, Check, Loader2, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResponsiveFilterPanel } from "@/components/ui/responsive-filter-panel"

export interface ComboboxOption {
  value: string
  label: string
  searchText?: string
}

export interface FilterGroup {
  label: string
  options: ComboboxOption[]
}

/**
 * Botão de filtro individual para um grupo de opções
 */
function FilterButton({
  group,
  selectedFilters,
  onFilterSelect,
}: {
  group: FilterGroup
  selectedFilters: string[]
  onFilterSelect: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  // Conta quantas opções deste grupo estão selecionadas
  const selectedCount = group.options.filter((opt) =>
    selectedFilters.includes(opt.value)
  ).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 px-3 font-normal",
            selectedCount > 0 && "bg-accent"
          )}
        >
          <span>{group.label}</span>
          {selectedCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full"
            >
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-1 w-auto min-w-35"
        align="start"
        sideOffset={4}
      >
        <div className="max-h-75 overflow-auto">
          {group.options.map((option) => {
            const isSelected = selectedFilters.includes(option.value)
            return (
              <div
                key={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                  isSelected && "bg-accent"
                )}
                onClick={() => {
                  onFilterSelect(option.value)
                  setOpen(false)
                }}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border mr-2 shrink-0 transition-colors",
                    isSelected && "bg-primary border-primary"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="whitespace-nowrap">{option.label}</span>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * @deprecated Use `DataTableToolbar` de `@/components/shared/data-shell` em vez deste componente.
 *
 * Este componente será removido em uma versão futura.
 *
 * Migração:
 * ```tsx
 * // Antes (deprecated)
 * import { TableToolbar } from '@/components/ui/table-toolbar';
 *
 * // Depois (correto)
 * import { DataTableToolbar } from '@/components/shared/data-shell';
 *
 * // Veja src/app/(authenticated)/partes/components/clientes/clientes-table-wrapper.tsx para exemplo.
 * ```
 */
interface TableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  isSearching?: boolean
  searchPlaceholder?: string
  filterOptions?: ComboboxOption[]
  filterGroups?: FilterGroup[]
  selectedFilters: string[]
  onFiltersChange: (filters: string[]) => void
  extraButtons?: React.ReactNode
  onNewClick?: () => void
  newButtonTooltip?: string
  className?: string
  variant?: "standalone" | "integrated"
  /** @deprecated Use filterButtonsMode="single" instead */
  showFilterButton?: boolean
  /** * Modo de exibição dos filtros:
   * - "single": Um único botão de filtro com dropdown (comportamento antigo)
   * - "buttons": Botões individuais para cada grupo de filtros (novo comportamento)
   * - "panel": Painel de filtros responsivo (inline no desktop, Sheet no mobile)
   */
  filterButtonsMode?: "single" | "buttons" | "panel"
  /**
   * Título do painel de filtros (usado quando filterButtonsMode="panel")
   */
  filterPanelTitle?: string
  /**
   * Descrição do painel de filtros (usado quando filterButtonsMode="panel")
   */
  filterPanelDescription?: string
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  isSearching = false,
  searchPlaceholder = "Buscar...",
  filterOptions,
  filterGroups,
  selectedFilters = [],
  onFiltersChange,
  extraButtons,
  onNewClick,
  newButtonTooltip = "Novo",
  className,
  variant = "standalone",
  showFilterButton = true,
  filterButtonsMode = "single",
  filterPanelTitle = "Filtros",
  filterPanelDescription,
}: TableToolbarProps) {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [filterSearch, setFilterSearch] = React.useState("")
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null)

  // Limpar busca quando fechar
  React.useEffect(() => {
    if (!filterOpen) {
      setFilterSearch("")
      setActiveGroup(null)
    }
  }, [filterOpen])

  const handleFilterSelect = (optionValue: string) => {
    const newSelected = selectedFilters.includes(optionValue)
      ? selectedFilters.filter((v) => v !== optionValue)
      : [...selectedFilters, optionValue]
    onFiltersChange(newSelected)
  }

  const handleSelectAllFilters = () => {
    if (filterGroups) {
      const allValues = filterGroups.flatMap(group => group.options.map(opt => opt.value))
      onFiltersChange(allValues)
    } else {
      onFiltersChange((filterOptions ?? []).map((opt) => opt.value))
    }
  }

  const handleClearAllFilters = () => {
    onFiltersChange([])
  }

  // Usar grupos se disponível, senão fallback para lista plana
  const useGroupedFilters = filterGroups && filterGroups.length > 0

  // Determina se deve mostrar botões individuais ou o botão único de filtro
  const useFilterButtons = filterButtonsMode === "buttons" && filterGroups && filterGroups.length > 0
  const useFilterPanel = filterButtonsMode === "panel" && filterGroups && filterGroups.length > 0

  const commonClasses = "p-4"
  const standaloneClasses = "bg-card border border-border rounded-lg shadow-sm"
  const integratedClasses = "bg-card border-b border-border rounded-t-lg"

  // Modo: Painel de filtros responsivo
  if (useFilterPanel) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:items-start",
          commonClasses,
          variant === 'standalone' ? standaloneClasses : integratedClasses,
          className
        )}
      >
        <div className="flex-1">
          <ButtonGroup>
            <InputGroup className="w-full min-w-[min(92vw,37.5rem)]">
              <InputGroupAddon>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
              {isSearching && (
                <InputGroupAddon align="inline-end">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </InputGroupAddon>
              )}
            </InputGroup>
            {extraButtons && (
              <>
                <ButtonGroupSeparator />
                {extraButtons}
              </>
            )}
            {onNewClick && (
              <>
                <ButtonGroupSeparator />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" onClick={onNewClick} aria-label="Novo">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {newButtonTooltip}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </ButtonGroup>
        </div>
        <ResponsiveFilterPanel
          filterGroups={filterGroups!}
          selectedFilters={selectedFilters}
          onFiltersChange={onFiltersChange}
          title={filterPanelTitle}
          description={filterPanelDescription}
        />
      </div>
    )
  }

  // Modo: Padrão (ButtonGroup)
  return (
    <ButtonGroup
      className={cn(
        "items-center",
        commonClasses,
        variant === 'standalone' ? standaloneClasses : integratedClasses,
        className
      )}
    >
      <InputGroup className="w-full min-w-[min(92vw,37.5rem)]">
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
        {isSearching && (
          <InputGroupAddon align="inline-end">
            <Loader2 className="h-4 w-4 animate-spin" />
          </InputGroupAddon>
        )}
      </InputGroup>
      <ButtonGroupSeparator />

      {/* Modo: Botões individuais de filtro */}
      {useFilterButtons &&
        filterGroups!.map((group) => (
          <FilterButton
            key={group.label}
            group={group}
            selectedFilters={selectedFilters}
            onFilterSelect={handleFilterSelect}
          />
        ))}

      {/* Modo: Botão único de filtro (comportamento antigo) */}
      {!useFilterButtons && showFilterButton && (
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default" // UPDATED: Usando variante padrão (Primary) ao invés de hardcode
              size="icon"
              aria-label="Filtros"
              className="relative" // removido o bg-black hardcoded
            >
              <Filter className="h-4 w-4" />
              {selectedFilters.length > 0 && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {selectedFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-auto max-w-[min(92vw,37.5rem)]"
            align="start"
            sideOffset={4}
          >
            {useGroupedFilters ? (
              // Renderização hierarquizada com grupos
              <div className="flex overflow-hidden">
                {/* Lista de grupos (lado esquerdo) */}
                <div className="border-r shrink-0 w-max">
                  <div className="p-2 border-b">
                    <div className="text-sm font-semibold px-2 py-1.5 whitespace-nowrap">Filtros</div>
                  </div>
                  <div className="max-h-100 overflow-auto">
                    {filterGroups!.map((group) => {
                      const groupSelectedCount = group.options.filter(opt =>
                        selectedFilters.includes(opt.value)
                      ).length
                      const isActive = activeGroup === group.label

                      return (
                        <div
                          key={group.label}
                          className={cn(
                            "relative flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors",
                            isActive && "bg-accent"
                          )}
                          onMouseEnter={() => setActiveGroup(group.label)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">{group.label}</span>
                            {groupSelectedCount > 0 && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs shrink-0">
                                {groupSelectedCount}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Submenu com opções (lado direito) */}
                {activeGroup && (
                  <div className="border-l overflow-hidden w-max max-w-[min(92vw,25rem)]">
                    <div className="p-2 border-b">
                      <div className="text-sm font-semibold px-2 py-1.5 whitespace-nowrap">{activeGroup}</div>
                    </div>
                    <div className="max-h-100 overflow-auto p-1">
                      {filterGroups!.find(g => g.label === activeGroup)?.options.map((option) => {
                        const isSelected = selectedFilters.includes(option.value)
                        return (
                          <div
                            key={option.value}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              isSelected && "bg-accent"
                            )}
                            onClick={() => handleFilterSelect(option.value)}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border mr-2 shrink-0",
                                isSelected && "bg-primary border-primary"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="whitespace-nowrap">{option.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Renderização original (lista plana)
              <Command shouldFilter={true}>
                <CommandInput
                  placeholder="Buscar filtros..."
                  value={filterSearch}
                  onValueChange={setFilterSearch}
                />
                {/* Botões de ação */}
                {filterOptions && filterOptions.length > 0 && (
                  <div className="flex gap-2 p-2 border-b">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSelectAllFilters}
                    >
                      Selecionar todas
                    </Button>
                    {selectedFilters.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleClearAllFilters}
                      >
                        Limpar todas
                      </Button>
                    )}
                  </div>
                )}
                <CommandList>
                  <CommandEmpty>
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum filtro encontrado.
                    </div>
                  </CommandEmpty>
                  {(filterOptions ?? []).map((option) => {
                    const isSelected = selectedFilters.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        keywords={option.searchText ? [option.searchText] : undefined}
                        onSelect={() => handleFilterSelect(option.value)}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected && "bg-primary border-primary"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="flex-1">{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandList>
              </Command>
            )}
          </PopoverContent>
        </Popover>
      )}
      {extraButtons && (
        <>
          <ButtonGroupSeparator />
          {extraButtons}
        </>
      )}
      {onNewClick && (
        <>
          <ButtonGroupSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" onClick={onNewClick} aria-label="Novo">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {newButtonTooltip}
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </ButtonGroup>
  )
}