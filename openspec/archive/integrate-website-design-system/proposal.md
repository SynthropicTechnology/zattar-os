# Change: Integrar Website com Design System do Synthropic

## Why

O website da Atar Advogados foi copiado para `src/app/website/` mas possui imports quebrados, CSS duplicado e falta integração com o design system do Synthropic. Isso causa erros de build, inconsistência visual e dificulta a manutenção.

## What Changes

- **Correção de imports**: Todos os imports no website serão corrigidos para usar caminhos relativos corretos
- **Integração com design system**: Fontes (Inter, Montserrat), espaçamentos e transições do Synthropic serão aplicados
- **Configuração de URLs**: Variáveis de ambiente para URLs dos três apps (Dashboard, Meu Processo, Website)
- **Link para Meu Processo**: Botão "Consultar Processo" no Hero direcionará para o portal do cliente
- **Padronização de componentes UI**: Componentes do website serão alinhados com tokens do design system

## Impact

- **Affected specs**: website (nova spec)
- **Affected code**:
  - `src/app/(website)/page.tsx`
  - `src/app/(website)/layout.tsx`
  - `src/app/(website)/components/**/*`
  - `.env.example`
  - `src/lib/urls.ts`
  - `docs/multi-app-setup.md`
- **Breaking changes**: Nenhum
