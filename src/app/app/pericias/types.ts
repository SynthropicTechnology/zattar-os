import type { Usuario } from "@/app/app/usuarios";

export type UsuarioOption = Pick<Usuario, "id" | "nomeExibicao" | "nomeCompleto" | "avatarUrl"> & {
  nome_exibicao?: string;
  nome?: string;
};

export type EspecialidadePericiaOption = {
  id: number;
  descricao: string;
};

export type PeritoOption = {
  id: number;
  nome: string;
};


