# Status de Migração dos Diálogos de Cadastro

Esta tabela rastreia o progresso da migração dos diálogos de cadastro para o novo componente `DialogFormShell`.

## Módulo de Partes

| Entidade | Criação | Edição | Status | Observações |
|----------|---------|--------|--------|-------------|
| **Clientes** | ✅ Implementado | ✅ Implementado | ✅ Completo | `ClienteFormDialog` com multi-step (5 etapas), acentuação completa, botões modernizados |
| **Partes Contrárias** | ❌ Não implementado | ❌ Não implementado | ❌ Pendente | TODO encontrado em `partes-contrarias-table-wrapper.tsx:314` |
| **Terceiros** | ❌ Não implementado | ❌ Não implementado | ❌ Pendente | TODO encontrado em `terceiros-table-wrapper.tsx:282` |
| **Representantes** | ❌ Não implementado | ⚠️ Parcial | ⚠️ Parcial | Botão de edição existe mas está `disabled` em `representantes-table-wrapper.tsx:167` |

## Outros Módulos

| Feature | Arquivo | Tipo Atual | Multi-Step | Status | Prioridade |
|---------|---------|------------|------------|--------|------------|
| Usuários | `src/features/usuarios/components/forms/usuario-create-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Usuários | `src/features/usuarios/components/forms/usuario-edit-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Processos | `src/features/processos/components/processo-form.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| Contratos | `src/features/contratos/components/contrato-form.tsx` | DialogFormShell | Não | ✅ Migrado | Alta |
| RH | `src/features/rh/components/salarios/salario-form-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Média |
| Financeiro | `src/features/financeiro/components/contas-pagar/conta-pagar-form-dialog.tsx` | DialogFormShell | Não | ✅ Migrado | Média |

## Notas

### Módulo de Partes
- **ClienteForm**: ✅ Completo - Migrado, acentuação completa, botões modernizados (círculos com ícones)
- **Partes Contrárias**: ❌ Não implementado - Requer implementação completa
- **Terceiros**: ❌ Não implementado - Requer implementação completa
- **Representantes**: ⚠️ Parcial - Requer implementação de criação e habilitar edição

### Outros Módulos
- **UsuarioCreateDialog**: Migrado para `DialogFormShell`.
- **UsuarioEditDialog**: Migrado para `DialogFormShell`.
- **ProcessoForm**: Reescrito para usar `DialogFormShell` e `useActionState` (era um form simples antes).
- **ContratoForm**: Migrado de `Sheet` para `DialogFormShell` (mantendo `ResponsiveDialog` behavior).
- **SalarioFormDialog**: Migrado para `DialogFormShell`.
- **ContaPagarFormDialog**: Migrado para `DialogFormShell`.
