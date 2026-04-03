import { validarCpfDigitos, normalizarDocumento } from "@/app/(authenticated)/partes";

export interface ValidacaoCpf {
  valido: boolean;
  cpfLimpo: string;
  erro?: string;
}

export function validarCpf(cpf: string): ValidacaoCpf {
  const cpfLimpo = normalizarDocumento(cpf);
  if (!validarCpfDigitos(cpfLimpo)) {
    return { valido: false, cpfLimpo, erro: "CPF inválido" };
  }
  return { valido: true, cpfLimpo };
}
