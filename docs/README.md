# Documentação Synthropic

Bem-vindo à documentação do Synthropic. Esta pasta concentra documentação técnica, guias operacionais, relatórios e material interno.

## 📖 Navegação Rápida

Consulte o [INDEX.md](./INDEX.md) para uma lista completa e organizada de toda a documentação disponível.

## 📁 Estrutura

```
docs/
├── INDEX.md                    # Índice completo da documentação
├── README.md                   # Este arquivo
├── ORGANIZACAO_PROJETO.md      # Mapa da organização documental
├── archive/                   # Documentos históricos arquivados
│   └── 2026-Q1/               # Auditórias, migrações e correções concluídas em Q1 2026
├── architecture/               # Arquitetura e design do sistema
├── integrations/              # Guias de integrações
├── migrations/                # Documentação de migrations
├── audits/                    # Relatórios de auditoria (resumos ativos)
├── dify/                      # Documentação Dify AI
├── features/                  # Documentação de features
├── modules/                   # Documentação por módulo do produto
├── troubleshooting/           # Troubleshooting público
├── configuracao/              # Guias de configuração
└── internal/                  # Documentação interna (segurança, deploy, mcp, etc.)
```

## 🚀 Começando

### Para Novos Desenvolvedores

1. Leia [ARCHITECTURE.md](./architecture/ARCHITECTURE.md)
2. Consulte [AGENTS.md](./architecture/AGENTS.md)
3. Verifique [STATUS.md](./architecture/STATUS.md)
4. Consulte [docs/modules/README.md](./modules/README.md)

### Para Configurar Integrações

1. Leia [QUICK_START_INTEGRACOES.md](./integrations/QUICK_START_INTEGRACOES.md)
2. Siga o [migration-guide.md](./integrations/migration-guide.md)

### Para Aplicar Migrations

1. Consulte [APPLY_MIGRATION.md](./migrations/APPLY_MIGRATION.md)
2. Veja exemplos em [SUPABASE_MIGRATION_SUMMARY.md](./migrations/SUPABASE_MIGRATION_SUMMARY.md)

## 📝 Contribuindo

Ao adicionar nova documentação:

1. Coloque na pasta apropriada
2. Atualize o [INDEX.md](./INDEX.md)
3. Use formato Markdown
4. Indique claramente se o conteúdo é **normativo** (estado atual) ou **histórico** (relatório de execução)

## 🔗 Links Úteis

- [Repositório Principal](../)
- [Scripts](../scripts/)
- [Código Fonte](../src/)

---

**Última atualização:** 2026-04-02
