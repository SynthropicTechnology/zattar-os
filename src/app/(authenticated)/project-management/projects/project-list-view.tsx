"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectTable } from "../components/projects/project-table";
import { ProjectCard } from "../components/projects/project-card";
import type { Projeto } from "../lib/domain";
import { Heading } from '@/components/ui/typography';

interface ProjectListViewProps {
  projetos: Projeto[];
}

export function ProjectListView({ projetos }: ProjectListViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");

  const viewModeToggle = (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(v) => {
        if (v) setViewMode(v as "table" | "cards");
      }}
      variant="outline"
    >
      <ToggleGroupItem value="table" aria-label="Visualização em tabela">
        <List className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label="Visualização em cards">
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );

  if (viewMode === "cards") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between py-4">
          <Heading level="page">
            Projetos
          </Heading>
          <div className="flex items-center gap-2">
            {viewModeToggle}
            <Button
              onClick={() =>
                router.push("/app/project-management/projects/new")
              }
            >
              <Plus className="mr-1 size-4" />
              Novo Projeto
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {projetos.map((projeto) => (
            <ProjectCard key={projeto.id} projeto={projeto} />
          ))}
          {projetos.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">
              Nenhum projeto encontrado.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProjectTable projetos={projetos} viewModeSlot={viewModeToggle} />
  );
}
