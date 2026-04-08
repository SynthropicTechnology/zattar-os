# Diego Barbosa Advocacia (Synthropic) - Schema Export Documentation

## Overview

This directory contains the database schema export for the Zattar Advogados (Synthropic) application.

## Files

- **`full_schema_dump.sql`** - Template SQL file showing schema structure with ENUMs, Views, and basic structure
- **`SCHEMA_EXPORT_README.md`** - This file

## Database Statistics

- **Extensions**: 10 PostgreSQL extensions
- **ENUMs**: 40+ custom ENUM types
- **Tables**: 103 tables
- **Indexes**: 400+ indexes
- **Views**: 3 views
- **Functions**: 50+ functions
- **Triggers**: 100+ triggers
- **RLS Policies**: 100+ Row Level Security policies

## Complete Schema Export Methods

### Method 1: Supabase CLI (Recommended)

The most reliable way to get a complete schema export:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Pull the complete schema
supabase db pull

# This creates: supabase/migrations/TIMESTAMP_remote_schema.sql
```

### Method 2: pg_dump (Alternative)

Use PostgreSQL's pg_dump utility:

```bash
# Get database URL from Supabase Dashboard > Project Settings > Database
pg_dump -h YOUR_HOST -U postgres -d postgres --schema-only --no-owner --no-acl > complete_schema.sql
```

### Method 3: Manual Query Execution

Execute the queries provided in the Claude Code conversation to get specific objects:

#### Get all table DDL:
```sql
SELECT
  'CREATE TABLE public.' || c.table_name || ' (' || E'\n  ' ||
  string_agg(
    c.column_name || ' ' ||
    CASE
      WHEN c.data_type = 'USER-DEFINED' THEN 'public.' || c.udt_name
      WHEN c.data_type = 'ARRAY' THEN REPLACE(c.udt_name, '_', '') || '[]'
      ELSE c.data_type
    END ||
    CASE WHEN c.character_maximum_length IS NOT NULL
      THEN '(' || c.character_maximum_length || ')'
      ELSE ''
    END ||
    CASE WHEN c.column_default IS NOT NULL
      THEN ' DEFAULT ' || c.column_default
      ELSE ''
    END ||
    CASE WHEN c.is_nullable = 'NO'
      THEN ' NOT NULL'
      ELSE ''
    END,
    ',' || E'\n  '
    ORDER BY c.ordinal_position
  ) || E'\n);' as create_table_ddl
FROM information_schema.columns c
WHERE c.table_schema = 'public'
GROUP BY c.table_name
ORDER BY c.table_name;
```

## Schema Components Breakdown

### 1. Extensions
```sql
CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
```

### 2. ENUM Types (40+)
Key ENUMs include:
- `codigo_tribunal` - TRT1 through TRT24, TST
- `grau_tribunal` - primeiro_grau, segundo_grau, tribunal_superior
- `tipo_captura` - Different capture types for legal processes
- `status_contrato` - Contract status workflow
- `tipo_lancamento` - Financial transaction types
- And many more...

### 3. Core Tables

#### Process Management
- `acervo` - Main process registry
- `audiencias` - Hearings
- `expedientes` - Legal expedients
- `pericias` - Expert examinations

#### Parties & Contacts
- `clientes` - Clients
- `partes_contrarias` - Opposing parties
- `representantes` - Legal representatives
- `terceiros` - Third parties

#### Contracts & Financial
- `contratos` - Contracts
- `acordos_condenacoes` - Settlements
- `parcelas` - Installments
- `lancamentos_financeiros` - Financial entries
- `contas_bancarias` - Bank accounts
- `plano_contas` - Chart of accounts

#### Documents & Communication
- `documentos` - Documents
- `arquivos` - Files
- `pecas_modelos` - Legal document templates
- `mensagens_chat` - Chat messages
- `salas_chat` - Chat rooms

#### User Management
- `usuarios` - Users
- `permissoes` - Permissions
- `cargos` - Roles
- `salarios` - Salaries

#### Digital Signature
- `assinatura_digital_documentos` - Digital documents
- `assinatura_digital_assinaturas` - Signatures
- `assinatura_digital_formularios` - Forms
- `assinatura_digital_templates` - Templates

### 4. Key Relationships

#### Process Hierarchy
```
acervo (main process)
  ├─> audiencias (hearings)
  ├─> expedientes (expedients)
  ├─> pericias (examinations)
  ├─> processo_partes (parties)
  └─> acordos_condenacoes (settlements)
      └─> parcelas (installments)
```

#### Contract Flow
```
contratos (contracts)
  ├─> contrato_partes (parties)
  ├─> contrato_processos (linked processes)
  ├─> contrato_documentos (documents)
  └─> contrato_status_historico (status history)
```

## Recreating the Database

### Step 1: Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for initialization to complete

### Step 2: Enable Extensions
Execute the extension creation commands from `full_schema_dump.sql`

### Step 3: Create ENUMs
Execute all ENUM type definitions

### Step 4: Create Tables
Use `supabase db pull` output or manual queries to create all tables

### Step 5: Add Constraints
- Primary Keys
- Unique Constraints
- Foreign Keys
- Check Constraints

### Step 6: Create Indexes
Execute index creation statements (400+ indexes)

### Step 7: Create Views
Execute view definitions

### Step 8: Create Functions & Triggers
Use complete function definitions from:
```sql
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

### Step 9: Configure RLS Policies
Use Supabase Dashboard or CLI to configure Row Level Security

### Step 10: Configure Storage
Set up storage buckets in Supabase Dashboard:
- Document storage bucket
- File upload bucket
- Configure storage policies

## Important Notes

### Data Migration
This export contains **SCHEMA ONLY** (no data). To migrate data:

1. Use `pg_dump` with data:
   ```bash
   pg_dump -h OLD_HOST -U postgres -d postgres --data-only > data.sql
   ```

2. Or use Supabase's data migration tools

### Authentication
- Auth schema is managed by Supabase
- Configure auth providers in Supabase Dashboard
- Link `usuarios.auth_user_id` to `auth.users.id`

### Environment Variables
Update your application's environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

## Validation Checklist

After recreating the schema, verify:

- [ ] All 103 tables created
- [ ] All ENUMs created and used
- [ ] Foreign keys properly linked
- [ ] Indexes created (check query performance)
- [ ] Views return correct data
- [ ] Functions execute without errors
- [ ] Triggers fire correctly
- [ ] RLS policies enforce security
- [ ] Storage buckets configured
- [ ] Auth integration works

## Support

For questions or issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Review schema queries in Claude Code conversation
3. Use `supabase db pull` for most reliable export

## Version

- **Export Date**: 2026-02-10
- **PostgreSQL Version**: 15.x
- **Supabase Version**: Latest stable
- **Total Objects**: 900+ database objects

---

**Generated by Claude Code (Anthropic)**
