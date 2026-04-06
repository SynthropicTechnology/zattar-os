'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Archive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ComunicaCNJConsulta } from './consulta';
import { ComunicaCNJCapturadas } from './capturadas';

type DiarioOficialView = 'consulta' | 'capturadas';

const VALID_TABS = new Set<string>(['consulta', 'capturadas']);

interface ComunicaCNJTabsContentProps {
    initialTab?: DiarioOficialView;
}

export function ComunicaCNJTabsContent({ initialTab = 'consulta' }: ComunicaCNJTabsContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawTab = searchParams.get('tab');
    const activeTab = (rawTab && VALID_TABS.has(rawTab))
        ? (rawTab as DiarioOficialView)
        : initialTab;

    const handleTabChange = React.useCallback(
        (value: string) => {
            if (!value) return;
            router.push(`/app/comunica-cnj?tab=${value}`, { scroll: false });
        },
        [router]
    );

    return (
        <div className="flex flex-col min-h-0">
            <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-page-title">
                    Diário Oficial
                </h1>
                <ToggleGroup
                    type="single"
                    value={activeTab}
                    onValueChange={handleTabChange}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-card sm:w-auto"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="consulta"
                                aria-label="Consulta"
                                className="flex-1 gap-2 px-3 sm:flex-none"
                            >
                                <Search className="h-4 w-4" />
                                <span>Consulta</span>
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Consulta</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="capturadas"
                                aria-label="Capturadas"
                                className="flex-1 gap-2 px-3 sm:flex-none"
                            >
                                <Archive className="h-4 w-4" />
                                <span>Capturadas</span>
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Capturadas</TooltipContent>
                    </Tooltip>
                </ToggleGroup>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === 'consulta' ? <ComunicaCNJConsulta /> : <ComunicaCNJCapturadas />}
            </div>
        </div>
    );
}
