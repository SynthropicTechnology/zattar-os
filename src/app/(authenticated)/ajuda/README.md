# Ajuda (Sistema de Documentação)

## Status
**Módulo intencionalmente minimal** — não tem regras de negócio. É um sistema de documentação dinâmica baseado em registry + lazy loading.

## O que este módulo é
Central de Ajuda do Sinesys que serve documentação interna para usuários do sistema. Implementa:
- **Rota dinâmica**: `[...slug]/page.tsx` resolve qualquer caminho como uma entrada do registry
- **Registry**: `docs-registry.ts` lista todas as docs disponíveis em uma estrutura hierárquica
- **Conteúdo**: Cada doc é um componente React em `content/<slug>.tsx` carregado via `lazy()`
- **Sidebar**: Navegação lateral renderizada por `components/docs-sidebar.tsx`

## Estrutura
```
ajuda/
├── [...slug]/page.tsx      # Rota dinâmica que resolve slugs
├── components/             # Sidebar e componentes auxiliares
├── content/                # Componentes React de conteúdo (1 por doc)
├── design-system/          # Docs específicas do design system
├── docs-registry.ts        # Registry central de todas as docs
└── layout.tsx              # Layout com sidebar fixa
```

## Como adicionar uma nova documentação
1. Criar arquivo em `content/<slug>.tsx` exportando um componente React default
2. Adicionar entrada em `docs-registry.ts`:
   ```ts
   {
     title: 'Título da Doc',
     slug: 'meu-slug',
     keywords: ['palavra1', 'palavra2'],
     component: lz('meu-slug'),  // lazy loader
   }
   ```
3. Para hierarquia, usar `children: []` na entrada pai

## Por que não tem `domain.ts`/`service.ts`/`repository.ts`?
- Não há entidades de negócio
- Não há persistência (todo o conteúdo é estático em arquivos `.tsx`)
- Não há regras de validação
- O "domínio" é o próprio `docs-registry.ts` — essa é a fonte da verdade
- Forçar FSD aqui criaria arquivos vazios

## Quando este módulo evoluiria
Se a documentação passar a ser:
- **Editável pelo usuário** (ex: notas internas do escritório)
- **Versionada com histórico**
- **Indexada para busca semântica**

Aí faria sentido criar `domain.ts` (Doc, DocVersion), `service.ts` (CRUD + indexação) e `repository.ts` (Supabase). **Hoje, é documentação estática servida via lazy loading.**
