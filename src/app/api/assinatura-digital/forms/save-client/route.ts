import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service-client';
import { NACIONALIDADES } from '@/app/(authenticated)/assinatura-digital/feature/constants/nacionalidades';

// ---------------------------------------------------------------------------
// Schema — aceita os campos exatamente como o form envia
// ---------------------------------------------------------------------------
const dadosSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().length(11),
  email: z.string().email(),
  celular: z.string().min(10),
  telefone: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  estadoCivil: z.string().optional(),
  genero: z.string().optional(),
  nacionalidade: z.string().optional(),
});

const schema = z.object({
  cpf: z.string().length(11),
  operation: z.enum(['insert', 'update']),
  clienteId: z.number().optional(),
  dados: dadosSchema,
});

// ---------------------------------------------------------------------------
// Parsing: form values → DB columns
// ---------------------------------------------------------------------------
const ESTADO_CIVIL_TO_ENUM: Record<string, string> = {
  '1': 'solteiro',
  '2': 'casado',
  '4': 'divorciado',
  '5': 'viuvo',
};

const GENERO_TO_ENUM: Record<string, string> = {
  '1': 'masculino',
  '2': 'feminino',
  '3': 'outro',
  '4': 'prefiro_nao_informar',
};

function splitPhone(phone: string | undefined): { ddd: string | null; numero: string | null } {
  if (!phone || phone.length < 10) return { ddd: null, numero: null };
  return { ddd: phone.slice(0, 2), numero: phone.slice(2) };
}

function parseDataNascimento(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value;
}

function hasEnderecoData(dados: z.infer<typeof dadosSchema>): boolean {
  return Boolean(dados.logradouro || dados.numero || dados.bairro || dados.cidade || dados.estado || dados.cep);
}

function buildClienteRow(dados: z.infer<typeof dadosSchema>) {
  const { ddd: dddCel, numero: numCel } = splitPhone(dados.celular);
  const { ddd: dddRes, numero: numRes } = splitPhone(dados.telefone);
  const nacId = dados.nacionalidade ? parseInt(dados.nacionalidade, 10) : null;

  return {
    nome: dados.nome,
    cpf: dados.cpf,
    rg: dados.rg || null,
    data_nascimento: parseDataNascimento(dados.dataNascimento),
    emails: dados.email ? [dados.email] : null,
    ddd_celular: dddCel,
    numero_celular: numCel,
    ddd_residencial: dddRes,
    numero_residencial: numRes,
    estado_civil: dados.estadoCivil ? ESTADO_CIVIL_TO_ENUM[dados.estadoCivil] ?? null : null,
    genero: dados.genero ? GENERO_TO_ENUM[dados.genero] ?? null : null,
    nacionalidade: nacId ? NACIONALIDADES[nacId] ?? null : null,
  };
}

function buildEnderecoRow(dados: z.infer<typeof dadosSchema>, clienteId: number) {
  return {
    entidade_tipo: 'cliente' as const,
    entidade_id: clienteId,
    logradouro: dados.logradouro || null,
    numero: dados.numero || null,
    complemento: dados.complemento || null,
    bairro: dados.bairro || null,
    cep: dados.cep || null,
    municipio: dados.cidade || null,
    estado_sigla: dados.estado || null,
  };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    if (payload.operation === 'update' && !payload.clienteId) {
      return NextResponse.json(
        { success: false, error: 'clienteId is required for update operation' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    if (payload.operation === 'insert') {
      const clienteRow = { ...buildClienteRow(payload.dados), tipo_pessoa: 'pf' as const };

      const { data: newCliente, error: insertError } = await supabase
        .from('clientes')
        .insert(clienteRow)
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({ success: false, error: 'CPF já cadastrado' }, { status: 409 });
        }
        throw insertError;
      }

      if (hasEnderecoData(payload.dados)) {
        const { data: newEndereco, error: enderecoError } = await supabase
          .from('enderecos')
          .insert(buildEnderecoRow(payload.dados, newCliente.id))
          .select('id')
          .single();

        if (!enderecoError && newEndereco) {
          await supabase
            .from('clientes')
            .update({ endereco_id: newEndereco.id })
            .eq('id', newCliente.id);
        }
      }

      return NextResponse.json({ success: true, data: { cliente_id: newCliente.id } });
    }

    // UPDATE
    const clienteRow = buildClienteRow(payload.dados);
    const { error: updateError } = await supabase
      .from('clientes')
      .update(clienteRow)
      .eq('id', payload.clienteId!);

    if (updateError) throw updateError;

    if (hasEnderecoData(payload.dados)) {
      const { data: currentCliente } = await supabase
        .from('clientes')
        .select('endereco_id')
        .eq('id', payload.clienteId!)
        .single();

      const enderecoRow = buildEnderecoRow(payload.dados, payload.clienteId!);

      if (currentCliente?.endereco_id) {
        await supabase.from('enderecos').update(enderecoRow).eq('id', currentCliente.endereco_id);
      } else {
        const { data: newEndereco, error: enderecoError } = await supabase
          .from('enderecos')
          .insert(enderecoRow)
          .select('id')
          .single();

        if (!enderecoError && newEndereco) {
          await supabase
            .from('clientes')
            .update({ endereco_id: newEndereco.id })
            .eq('id', payload.clienteId!);
        }
      }
    }

    return NextResponse.json({ success: true, data: { cliente_id: payload.clienteId! } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving client:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
