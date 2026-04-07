# Assinatura Digital

## Onde está a estrutura FSD
Este módulo segue o padrão de **FSD aninhado em `feature/`**. Os arquivos principais estão em [feature/](./feature/):

```
assinatura-digital/
├── page.tsx                  # Rota Next.js (ponto de entrada)
├── feature/
│   ├── domain.ts             # Tipos e schemas Zod
│   ├── service.ts            # Casos de uso (assinatura, validação)
│   ├── repository.ts         # Persistência Supabase
│   ├── actions/              # Server Actions
│   ├── components/           # UI React
│   ├── hooks/                # React hooks
│   ├── adapters/             # Adapters para provedores externos (e2m, etc.)
│   ├── store/                # Estado client-side
│   ├── validations/          # Regras de validação adicionais
│   ├── RULES.md              # Regras de negócio (conformidade ICP-Brasil)
│   ├── README.md             # Documentação técnica do módulo
│   └── MIGRATION.md          # Histórico de migração
├── assinatura/               # Sub-rotas de fluxos de assinatura
├── documentos/               # Sub-rotas de documentos
├── formularios/              # Sub-rotas de formulários
└── templates/                # Templates de documentos
```

## Documentação principal
- **Regras de negócio**: [feature/RULES.md](./feature/RULES.md) — Conformidade legal (MP 2.200-2/2001), autenticidade, integridade, não-repúdio
- **Documentação técnica**: [feature/README.md](./feature/README.md)
- **Histórico de migração**: [feature/MIGRATION.md](./feature/MIGRATION.md)

## Por que a estrutura está aninhada?
Diferente do padrão flat dos outros módulos, este foi construído com FSD em subdiretório `feature/` por motivos históricos (ver `feature/MIGRATION.md`). A estrutura **funciona perfeitamente** — é apenas uma variação organizacional, não uma incompletude.

## Não confunda com módulo stub
Este módulo **possui estrutura FSD completa**, apenas localizada em `feature/`. Auditorias automáticas que olham apenas para a raiz do módulo podem incorretamente classificá-lo como stub. Este README existe para evitar essa confusão.
