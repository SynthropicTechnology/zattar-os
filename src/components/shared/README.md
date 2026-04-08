## Padrões de Componentes Compartilhados (`shared/`)

Este diretório contém componentes de UI reutilizáveis e agnósticos de negócio, que formam a base para a construção de interfaces consistentes em todo o Synthropic.

> **Para Agentes de IA:** Consulte o arquivo [CLAUDE.md](./CLAUDE.md) para instruções detalhadas e padrões obrigatórios.

### Componentes Principais

- **`PageShell`**: Um componente de layout que envolve o conteúdo principal de uma página. Inclui título, descrição e slots para ações (como botões).
  - **Quando usar:** Em todas as páginas de nível superior dentro de um módulo para garantir consistência visual.

- **`DataShell`**: Container visual para superfícies de dados (listas/tabelas), com narrativa "colada" (header + conteúdo scrollável + footer).
  - **Quando usar:** Em páginas de listagem para unir toolbar, tabela e paginação com consistência.

- **`DataTable`**: Tabela baseada em TanStack Table, projetada para ser usada dentro do `DataShell`.
  - **Quando usar:** Para exibir conjuntos de dados tabulares (com paginação/ordenação server-side quando necessário).

- **`DataTableToolbar`**: Barra de ferramentas para DataTable com busca, filtros, densidade e exportação.
  - **Quando usar:** Sempre dentro do `DataShell` como `header`.

- **`DialogFormShell`**: Container para formulários em modal/dialog com suporte a multi-step.
  - **Quando usar:** Para criar/editar entidades em dialogs modais.

- **`DetailSheet`**: Painel lateral para exibir detalhes de uma entidade.
  - **Quando usar:** Para visualização rápida de detalhes sem sair da listagem.

### Exemplo de Composição para Agentes

Siga este padrão ao construir uma nova página de listagem em um módulo. Isso garante consistência e aproveita ao máximo os componentes compartilhados.

```tsx
// ✅ CORRETO: Usar DataShell com DataTableToolbar
import { PageShell } from '@/components/shared/page-shell';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination
} from '@/components/shared/data-shell';

export default function MinhaPaginaDeListagem() {
  return (
    <PageShell
      title="Lançamentos Financeiros"
    >
      <DataShell
        actionButton={{
          label: 'Novo Lançamento',
          onClick: () => setDialogOpen(true),
        }}
        header={
          <DataTableToolbar
            table={table}
            searchValue={busca}
            onSearchValueChange={setBusca}
            filtersSlot={/* filtros customizados */}
          />
        }
        footer={<DataPagination {...propsPaginacao} />}
      >
        <DataTable
          data={dados}
          columns={columns}
          // Tabela renderiza sua própria borda
        />
      </DataShell>
    </PageShell>
  );
}

// ❌ ERRADO: Recriar layout manualmente na página
export function PaginaIncorreta() {
    return (
        <div className="p-6">
            <h1 className="text-2xl">Lançamentos</h1>
            {/* ... recriar toolbar e tabela manualmente ... */}
        </div>
    );
}

// ❌ ERRADO: Usar TableToolbar de @/components/ui
// import { TableToolbar } from '@/components/ui/table-toolbar'; // DEPRECATED
```
