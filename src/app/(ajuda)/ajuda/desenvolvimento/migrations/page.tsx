import { Database, Terminal, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigrationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Migrations</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Como criar e aplicar migrations no Supabase.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Migrations são usadas para versionar alterações no schema do banco de dados.
            No Synthropic, usamos migrations do Supabase localizadas em:
          </p>
          <pre className="text-sm bg-muted p-3 rounded-md">
            supabase/migrations/
          </pre>
          <p className="text-sm text-muted-foreground">
            Formato do nome: <code className="bg-muted px-1 rounded">YYYYMMDDHHmmss_descricao.sql</code>
          </p>
        </CardContent>
      </Card>

      {/* Apply via Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Opção 1: Via Supabase Dashboard</CardTitle>
          <CardDescription>Recomendado para aplicação rápida</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></li>
            <li>Selecione seu projeto</li>
            <li>Vá em <strong>SQL Editor</strong></li>
            <li>Abra o arquivo de migration em <code className="bg-muted px-1 rounded">supabase/migrations/</code></li>
            <li>Copie o conteúdo SQL</li>
            <li>Cole no SQL Editor</li>
            <li>Clique em <strong>Run</strong></li>
          </ol>
        </CardContent>
      </Card>

      {/* Apply via CLI */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Opção 2: Via Supabase CLI</CardTitle>
          </div>
          <CardDescription>Recomendado para produção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Verificar status</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`npx supabase status`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Linkar projeto (se necessário)</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`npx supabase link --project-ref SEU_PROJECT_REF`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Aplicar migrations</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`npx supabase db push`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Verify */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <CardTitle>Verificar Migrations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Execute no SQL Editor para verificar se tabelas foram criadas:
          </p>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`-- Verificar tabelas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar colunas de uma tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios';`}
          </pre>
        </CardContent>
      </Card>

      {/* Create Migration */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Via CLI</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`# Gerar migration baseada em diff
npx supabase db diff -f nome_da_migration

# Ou criar arquivo manualmente
touch supabase/migrations/20250115120000_nome_da_migration.sql`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Convenções</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Timestamp em UTC: <code className="bg-muted px-1 rounded">YYYYMMDDHHmmss</code></li>
              <li>• Nome descritivo: <code className="bg-muted px-1 rounded">create_profiles</code>, <code className="bg-muted px-1 rounded">add_cargo_id_to_usuarios</code></li>
              <li>• SQL em lowercase</li>
              <li>• Comentários abundantes para operações destrutivas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Example Migration */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Migration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`-- Migration: 20250118120000_create_cargos.sql
-- Descrição: Cria tabela de cargos para sistema de permissões

-- Criar tabela cargos
create table if not exists public.cargos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  descricao text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Comentário descritivo
comment on table public.cargos is 'Cargos dos usuários para organização interna';

-- Habilitar RLS
alter table public.cargos enable row level security;

-- Política de leitura para usuários autenticados
create policy "Users can view cargos"
on public.cargos for select
to authenticated
using (true);

-- Índice para busca por nome
create index idx_cargos_nome on public.cargos(nome);`}
          </pre>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Erro: column does not exist</h4>
            <p className="text-sm text-muted-foreground">
              As migrations não foram aplicadas. Execute as migrations na ordem correta.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Erro: relation already exists</h4>
            <p className="text-sm text-muted-foreground">
              A tabela já foi criada. Use <code className="bg-muted px-1 rounded">if not exists</code> na criação.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Erro 403 após migration</h4>
            <p className="text-sm text-muted-foreground">
              Políticas RLS não configuradas. Adicione políticas de acesso às tabelas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Super Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Após aplicar migrations de permissões, promova seu usuário:
          </p>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`-- Promover usuário a super admin
UPDATE public.usuarios
SET is_super_admin = true
WHERE email_corporativo = 'seu@email.com';

-- Verificar
SELECT id, nome_exibicao, email_corporativo, is_super_admin
FROM public.usuarios
WHERE is_super_admin = true;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
