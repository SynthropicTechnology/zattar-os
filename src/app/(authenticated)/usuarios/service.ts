import { usuarioRepository } from './repository';
import {
  UsuarioDados,
  ListarUsuariosParams,
  OperacaoUsuarioResult,
  criarUsuarioSchema,
  atualizarUsuarioSchema
} from './domain';
import { normalizarCpf } from './utils';

// =============================================================================
// RE-EXPORTS — Serviços especializados
// =============================================================================
export {
  registrarAtribuicaoPermissao,
  registrarRevogacaoPermissao,
  registrarAtribuicaoLote,
  registrarSubstituicaoPermissoes,
  registrarPromocaoSuperAdmin,
  registrarRemocaoSuperAdmin,
  registrarMudancaCargo,
} from './services/auditoria-permissoes';

export const service = {
  async listarUsuarios(params: ListarUsuariosParams = {}) {
    return usuarioRepository.findAll(params);
  },

  async buscarUsuario(id: number) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new Error(`Usuário com ID ${id} não encontrado`);
    }
    return usuario;
  },

  async buscarPorCpf(cpf: string) {
    return usuarioRepository.findByCpf(cpf);
  },

  async buscarPorEmail(email: string) {
    return usuarioRepository.findByEmail(email);
  },

  async listarCargos() {
    return usuarioRepository.listarCargos();
  },

  async criarUsuario(dados: UsuarioDados): Promise<OperacaoUsuarioResult> {
    try {
      // Validar schema
      const parseResult = criarUsuarioSchema.safeParse(dados);
      if (!parseResult.success) {
        const erroMsg = parseResult.error.errors.map(e => e.message).join(', ');
        return { sucesso: false, erro: erroMsg };
      }

      // Validar duplicatas
      const { cpf, emailCorporativo } = dados;

      const usuarioCpf = await usuarioRepository.findByCpf(cpf);
      if (usuarioCpf) {
        return { sucesso: false, erro: 'CPF já cadastrado no sistema' };
      }

      const usuarioEmail = await usuarioRepository.findByEmail(emailCorporativo);
      if (usuarioEmail) {
        return { sucesso: false, erro: 'E-mail corporativo já cadastrado no sistema' };
      }

      // Validar cargo se informado
      if (dados.cargoId) {
        const cargo = await usuarioRepository.getCargoById(dados.cargoId);
        if (!cargo) {
          return { sucesso: false, erro: 'Cargo não encontrado' };
        }
      }

      const novoUsuario = await usuarioRepository.create(dados);

      return { sucesso: true, usuario: novoUsuario };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { sucesso: false, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async atualizarUsuario(id: number, dados: Partial<UsuarioDados>): Promise<OperacaoUsuarioResult> {
    try {
      // Verificar existência
      const usuarioAtual = await usuarioRepository.findById(id);
      if (!usuarioAtual) {
        return { sucesso: false, erro: 'Usuário não encontrado' };
      }

      // Validar schema parcial com Zod
      // Criar objeto completo para validação (schema parcial com id)
      const dadosParaValidar = { id, ...dados };
      const parseResult = atualizarUsuarioSchema.safeParse(dadosParaValidar);

      if (!parseResult.success) {
        const erroMsg = parseResult.error.errors.map(e => e.message).join(', ');
        return { sucesso: false, erro: erroMsg };
      }

      // Validar duplicatas
      if (dados.cpf) {
        const cpfNormalizado = normalizarCpf(dados.cpf);
        if (cpfNormalizado !== usuarioAtual.cpf) {
          const existe = await usuarioRepository.findByCpf(dados.cpf);
          if (existe && existe.id !== id) {
            return { sucesso: false, erro: 'CPF já cadastrado para outro usuário' };
          }
        }
      }

      if (dados.emailCorporativo) {
        const emailLower = dados.emailCorporativo.trim().toLowerCase();
        if (emailLower !== usuarioAtual.emailCorporativo) {
          const existe = await usuarioRepository.findByEmail(dados.emailCorporativo);
          if (existe && existe.id !== id) {
            return { sucesso: false, erro: 'E-mail corporativo já cadastrado para outro usuário' };
          }
        }
      }

      // Validar cargo se informado
      if (dados.cargoId) {
        const cargo = await usuarioRepository.getCargoById(dados.cargoId);
        if (!cargo) {
          return { sucesso: false, erro: 'Cargo não encontrado' };
        }
      }

      const usuarioAtualizado = await usuarioRepository.update(id, dados);

      return { sucesso: true, usuario: usuarioAtualizado };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { sucesso: false, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async desativarUsuario(id: number, executorId: number): Promise<OperacaoUsuarioResult> {
    try {
      const usuario = await usuarioRepository.findById(id);
      if (!usuario) {
        return { sucesso: false, erro: 'Usuário não encontrado' };
      }

      const stats = await usuarioRepository.desativarComDesatribuicao(id, executorId);

      return {
        sucesso: true,
        data: stats
      };
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return { sucesso: false, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async sincronizarUsuariosAuth() {
    try {
      const naoSincronizados = await usuarioRepository.buscarUsuariosAuthNaoSincronizados();
      const resultados = [];

      for (const authUser of naoSincronizados) {
        // Lógica de mapeamento (extraída do serviço antigo)
        const email = authUser.email;
        if (!email) continue;

        let nomeCompleto = '';
        let nomeExibicao = '';

        const meta = (authUser.raw_user_meta_data as Record<string, unknown>) || {};
        if (meta.name) {
          nomeCompleto = meta.name as string;
          nomeExibicao = nomeCompleto;
        } else {
          const parts = email.split('@')[0].split('.');
          if (parts.length > 1) {
            nomeCompleto = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          } else {
            nomeCompleto = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          }
          nomeExibicao = nomeCompleto;
        }

        // CPF temporário (números do ID)
        const cpfTemp = authUser.id.replace(/\D/g, '').slice(0, 11).padStart(11, '0');

        const dados: UsuarioDados = {
          authUserId: authUser.id,
          emailCorporativo: email,
          cpf: cpfTemp,
          nomeCompleto,
          nomeExibicao,
          ativo: true
        };

        const res = await this.criarUsuario(dados);
        resultados.push(res);
      }
      return resultados;
    } catch (error) {
      throw error;
    }
  }
};
