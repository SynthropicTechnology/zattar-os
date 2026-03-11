## 1. Database (Migration SQL)

- [x] 1.1 Criar enum `tipo_litigio_trabalhista` (trabalhista_classico, gig_economy, pejotizacao) e enum `status_entrevista` (rascunho, em_andamento, concluida) em `supabase/schemas/01_enums.sql`
- [x] 1.2 Criar tabela `entrevistas_trabalhistas` com campos: id, contrato_id (FK UNIQUE), tipo_litigio, perfil_reclamante, status, respostas (JSONB), notas_operador (JSONB), modulo_atual, testemunhas_mapeadas, created_by (FK), created_at, updated_at — em `supabase/schemas/`
- [x] 1.3 Criar tabela `entrevista_anexos` com campos: id, entrevista_id (FK), modulo, no_referencia, tipo_anexo, arquivo_url, descricao, created_at
- [x] 1.4 Criar indexes (contrato_id, entrevista_id, modulo), trigger updated_at e habilitar RLS em ambas as tabelas
- [ ] 1.5 Executar migration no banco de desenvolvimento e validar estrutura

## 2. Domain Types & Zod Schemas

- [x] 2.1 Criar `src/features/entrevistas-trabalhistas/domain.ts` com interfaces: EntrevistaTrabalhista, EntrevistaAnexo, tipos enum (TipoLitigio, StatusEntrevista, PerfilReclamante)
- [x] 2.2 Criar schemas Zod para RespostasClassico (vinculo, jornada, saude_ambiente, ruptura) com campos condicionais e validações
- [x] 2.3 Criar schemas Zod para createEntrevista, updateRespostas, finalizarEntrevista, createAnexo
- [x] 2.4 Criar constantes de labels (TIPO_LITIGIO_LABELS, STATUS_ENTREVISTA_LABELS, PERFIL_RECLAMANTE_LABELS, opções de dropdown/checkbox para cada módulo)

## 3. Backend (Repository, Service, Actions)

- [x] 3.1 Criar `src/features/entrevistas-trabalhistas/repository.ts` com funções: findByContratoId, create, updateRespostas, updateStatus, updateModuloAtual, findAnexos, createAnexo, deleteAnexo
- [x] 3.2 Criar `src/features/entrevistas-trabalhistas/service.ts` com lógica de negócio: iniciarEntrevista, salvarModulo (merge JSONB), finalizarEntrevista (validação completa), reabrirEntrevista
- [x] 3.3 Criar `src/features/entrevistas-trabalhistas/actions/entrevista-actions.ts` com server actions: iniciarEntrevistaAction, salvarModuloAction, finalizarEntrevistaAction, reabrirEntrevistaAction
- [x] 3.4 Criar `src/features/entrevistas-trabalhistas/actions/anexo-actions.ts` com server actions: uploadAnexoAction, deleteAnexoAction
- [x] 3.5 Criar `src/features/entrevistas-trabalhistas/queries.ts` com fetching server-side: fetchEntrevistaByContratoId (com anexos)
- [x] 3.6 Criar `src/features/entrevistas-trabalhistas/hooks/use-entrevista.ts` com React Query hooks para mutations (salvar módulo, finalizar, reabrir)
- [x] 3.7 Criar `src/features/entrevistas-trabalhistas/index.ts` com exports públicos

## 4. Frontend — Nó Zero (Bifurcação)

- [x] 4.1 Criar `src/features/entrevistas-trabalhistas/components/no-zero-selector.tsx` com 3 cards visuais grandes (trabalhista_classico habilitado, gig_economy e pejotizacao desabilitados com badge "Em breve")
- [x] 4.2 Adicionar campo de seleção de perfil do reclamante (domestica, comerciario, industrial, rural) como etapa do Nó Zero
- [x] 4.3 Conectar seleção à server action iniciarEntrevistaAction (cria registro no banco)

## 5. Frontend — Wizard Stepper (Módulos A.1–A.4)

- [x] 5.1 Criar `src/features/entrevistas-trabalhistas/components/entrevista-wizard.tsx` com DesktopStepper de 4 passos + navegação anterior/próximo + botão "Salvar Rascunho"
- [x] 5.2 Criar `src/features/entrevistas-trabalhistas/components/modulo-vinculo.tsx` (Módulo A.1): dropdown CTPS, campo condicional de subordinação, upload de anexos
- [x] 5.3 Criar `src/features/entrevistas-trabalhistas/components/modulo-jornada.tsx` (Módulo A.2): múltipla escolha controle de ponto, checkboxes horas extras/intervalo, campo numérico intervalo real, textarea dia típico, tooltip inversão de ônus
- [x] 5.4 Criar `src/features/entrevistas-trabalhistas/components/modulo-saude-ambiente.tsx` (Módulo A.3): radio riscos, dropdown condicional tipificação, textarea descrição, radio assédio, campos condicionais relato/testemunhas, upload provas
- [x] 5.5 Criar `src/features/entrevistas-trabalhistas/components/modulo-ruptura.tsx` (Módulo A.4): dropdown motivo término, checkboxes verbas rescisórias, upload TRCT/FGTS
- [x] 5.6 Implementar auto-save por módulo: ao clicar "Próximo", chamar salvarModuloAction que faz merge no JSONB e atualiza modulo_atual
- [x] 5.7 Implementar retomada de progresso: ao abrir wizard com entrevista em_andamento, posicionar no modulo_atual e preencher campos salvos

## 6. Frontend — Componentes Auxiliares

- [ ] 6.1 Criar `src/features/entrevistas-trabalhistas/components/entrevista-anexo-upload.tsx` para upload contextual por módulo/nó com listagem de anexos existentes
- [x] 6.2 Criar tooltips/alertas do operador como componente reutilizável (ícone info + popover com texto de orientação jurídica)
- [x] 6.3 Criar toggle de testemunhas mapeadas (visível em todos os módulos ou na finalização)

## 7. Frontend — Visualização Read-Only

- [x] 7.1 Criar `src/features/entrevistas-trabalhistas/components/entrevista-resumo.tsx` com Accordion por módulo, exibindo perguntas e respostas formatadas
- [x] 7.2 Renderizar anexos inline por módulo (preview para imagens, link para documentos/áudios)
- [x] 7.3 Adicionar botão "Editar" que chama reabrirEntrevistaAction e recarrega o wizard

## 8. Integração na Página de Detalhe do Contrato

- [x] 8.1 Criar `src/features/entrevistas-trabalhistas/components/entrevista-tab.tsx` como componente principal da aba (orquestra: estado vazio → Nó Zero → Wizard → Resumo read-only)
- [x] 8.2 Atualizar `src/app/app/contratos/[id]/contrato-detalhes-client.tsx`: adicionar aba "Entrevista" ao array TABS, tipo ContratoTab union, e renderização no switch
- [x] 8.3 Atualizar `src/app/app/contratos/[id]/page.tsx` (server component): buscar entrevista em paralelo via fetchEntrevistaByContratoId e passar para o client component
- [x] 8.4 Atualizar props do ContratoDetalhesClient para aceitar dados da entrevista (opcionais)

## 9. Validação e Testes

- [ ] 9.1 Testar fluxo completo: iniciar entrevista → preencher módulos → salvar/retomar → finalizar → visualizar read-only → reabrir
- [ ] 9.2 Testar campos condicionais: verificar que campos aparecem/desaparecem corretamente baseado nas respostas
- [ ] 9.3 Testar constraint UNIQUE: verificar que não é possível criar duas entrevistas para o mesmo contrato
- [ ] 9.4 Testar upload de anexos: verificar vinculação correta ao módulo/nó e listagem
