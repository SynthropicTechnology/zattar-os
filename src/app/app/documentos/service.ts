import {
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  DocumentoComUsuario,
  Pasta,
  CriarPastaParams,
  AtualizarPastaParams,
  PastaComContadores,
  PastaHierarquia,
  Template,
  ListarTemplatesParams,
  CriarTemplateParams,
  AtualizarTemplateParams,
  TemplateComUsuario,
  DocumentoCompartilhado,
  DocumentoCompartilhadoComUsuario,
  DocumentoVersao,
  DocumentoVersaoComUsuario,
  DocumentoUpload,
  DocumentoUploadComInfo,
  AutoSavePayload,
  // Arquivos genéricos
  Arquivo,
  ListarArquivosParams,
  ItemDocumento,
} from "./domain";
import * as documentosRepo from "./repository";
import * as pastasRepo from "./repository";
import * as templatesRepo from "./repository";
import * as compartilhamentoRepo from "./repository";
import * as versoesRepo from "./repository";
import * as uploadsRepo from "./repository";
import * as arquivosRepo from "./repository";
import { usuarioRepository } from "@/app/app/usuarios/repository";
import * as domain from "./domain";
import {
  uploadFileToB2,
  generatePresignedUploadUrl,
  getTipoMedia,
  validateFileType,
  validateFileSize,
} from "./services/b2-upload.service";
import { checkQuota, incrementQuota } from "@/lib/mcp/quotas"; // Moved to feature
import { checkPermission } from "@/lib/auth/authorization";
import { generatePresignedUrl as generatePresignedDownloadUrl } from "@/lib/storage/backblaze-b2.service";

// ============================================================================
// DOCUMENTOS
// ============================================================================

export async function listarDocumentos(
  params: ListarDocumentosParams,
  usuario_id?: number
): Promise<{ documentos: DocumentoComUsuario[]; total: number }> {
  if (usuario_id) {
    if (params.pasta_id) {
      const temAcesso = await pastasRepo.verificarAcessoPasta(
        params.pasta_id,
        usuario_id
      );
      if (!temAcesso) {
        throw new Error("Acesso negado à pasta.");
      }
    }
    // Adiciona o filtro de acesso pelo usuário
    params.acesso_por_usuario_id = usuario_id;
  }

  return documentosRepo.listarDocumentos(params);
}

export async function buscarDocumento(
  id: number,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const { temAcesso } = await documentosRepo.verificarAcessoDocumento(
    id,
    usuario_id
  );
  if (!temAcesso) {
    throw new Error("Acesso negado ao documento");
  }
  const documento = await documentosRepo.buscarDocumentoComUsuario(id);
  if (!documento) {
    throw new Error("Documento não encontrado");
  }
  return documento;
}

export async function criarDocumento(
  params: unknown,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedParams = domain.criarDocumentoSchema.parse(params);
  const documento = await documentosRepo.criarDocumento(
    parsedParams as CriarDocumentoParams,
    usuario_id
  );
  const novoDocumento = await documentosRepo.buscarDocumentoComUsuario(
    documento.id
  );
  if (!novoDocumento) {
    throw new Error("Documento criado mas não encontrado.");
  }
  return novoDocumento;
}

export async function atualizarDocumento(
  id: number,
  params: unknown,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedParams = domain.atualizarDocumentoSchema.parse(params);
  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    id,
    usuario_id
  );

  if (!temAcesso || (permissao !== "editar" && permissao !== "proprietario")) {
    throw new Error(
      "Acesso negado: você não tem permissão para editar este documento."
    );
  }

  const documentoAtualizado = await documentosRepo.atualizarDocumento(
    id,
    parsedParams as AtualizarDocumentoParams,
    usuario_id
  );
  if (
    parsedParams.conteudo !== undefined &&
    documentoAtualizado.conteudo !== parsedParams.conteudo
  ) {
    // Apenas cria nova versão se o conteúdo for fornecido e mudar significativamente
    await versoesRepo.criarVersao(
      {
        documento_id: id,
        versao: documentoAtualizado.versao, // será incrementado na persistência
        conteudo: parsedParams.conteudo,
        titulo: parsedParams.titulo ?? documentoAtualizado.titulo,
      },
      usuario_id
    );
  }
  const result = await documentosRepo.buscarDocumentoComUsuario(id);
  if (!result) {
    throw new Error("Documento atualizado mas não encontrado.");
  }
  return result;
}

export async function deletarDocumento(
  id: number,
  usuario_id: number
): Promise<void> {
  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    id,
    usuario_id
  );
  const isProprietario = temAcesso && permissao === "proprietario";
  if (!isProprietario) {
    const podeDeletar = await checkPermission(usuario_id, "documentos", "deletar");
    if (!podeDeletar) {
      throw new Error(
        "Acesso negado: apenas o proprietário ou usuários com permissão podem deletar o documento."
      );
    }
  }
  await documentosRepo.deletarDocumento(id);
}

export async function autoSalvarDocumento(
  payload: AutoSavePayload,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedPayload = domain.autoSavePayloadSchema.parse(payload);
  const { documento_id, conteudo, titulo } = parsedPayload;

  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );

  if (!temAcesso || (permissao !== "editar" && permissao !== "proprietario")) {
    throw new Error(
      "Acesso negado: você não tem permissão para editar este documento."
    );
  }

  await documentosRepo.atualizarDocumento(
    documento_id,
    { conteudo, titulo },
    usuario_id
  );
  // Não cria nova versão para auto-save, apenas para salvamento manual ou atualizacao completa
  const result = await documentosRepo.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error("Documento auto-salvo mas não encontrado.");
  }
  return result;
}

// ============================================================================
// PASTAS
// ============================================================================

export async function listarPastas(
  usuario_id: number
): Promise<PastaComContadores[]> {
  return pastasRepo.listarPastasComContadores(undefined, usuario_id);
}

/**
 * Lista pastas com contadores (documentos/subpastas), suportando filtro por pasta pai.
 * Usado por rotas API e pela UI de navegação de pastas.
 */
export async function listarPastasComContadores(
  pasta_pai_id: number | null | undefined,
  usuario_id: number
): Promise<PastaComContadores[]> {
  return pastasRepo.listarPastasComContadores(pasta_pai_id, usuario_id);
}

/**
 * Busca hierarquia (árvore) de pastas.
 */
export async function buscarHierarquiaPastas(
  pasta_raiz_id: number | null | undefined,
  incluir_documentos: boolean,
  usuario_id: number
): Promise<PastaHierarquia[]> {
  return pastasRepo.buscarHierarquiaPastas(
    pasta_raiz_id,
    incluir_documentos,
    usuario_id
  );
}

/**
 * Busca o caminho completo de uma pasta (breadcrumbs)
 */
export async function buscarCaminhoPasta(
  pasta_id: number,
  usuario_id: number
): Promise<Pasta[]> {
  const temAcesso = await pastasRepo.verificarAcessoPasta(pasta_id, usuario_id);
  if (!temAcesso) {
    throw new Error("Acesso negado à pasta.");
  }
  return pastasRepo.buscarCaminhoPasta(pasta_id);
}

export async function criarPasta(
  params: unknown,
  usuario_id: number
): Promise<Pasta> {
  const parsedParams = domain.criarPastaSchema.parse(params);

  if (parsedParams.pasta_pai_id) {
    const temAcessoPastaPai = await pastasRepo.verificarAcessoPasta(
      parsedParams.pasta_pai_id,
      usuario_id
    );
    if (!temAcessoPastaPai) {
      throw new Error("Acesso negado à pasta pai.");
    }
  }

  return pastasRepo.criarPasta(parsedParams as CriarPastaParams, usuario_id);
}

export async function buscarPasta(
  id: number,
  usuario_id: number
): Promise<Pasta> {
  const pasta = await pastasRepo.buscarPastaPorId(id);
  if (!pasta) {
    throw new Error("Pasta não encontrada.");
  }

  const temAcesso = await pastasRepo.verificarAcessoPasta(id, usuario_id);
  if (!temAcesso) {
    throw new Error("Acesso negado à pasta.");
  }

  return pasta;
}

export async function atualizarPasta(
  id: number,
  params: unknown,
  usuario_id: number
): Promise<Pasta> {
  const parsedParams = domain.atualizarPastaSchema.parse(params);

  const temAcesso = await pastasRepo.verificarAcessoPasta(id, usuario_id);
  // Nota: Para atualizar, talvez precise ser proprietário ou ter permissão de edição.
  // A lógica atual de `pastasRepo.verificarAcessoPasta` retorna boolean simples.
  // Se for pasta privada, só criador vê. Se for comum, todos veem.
  // Mas para EDITAR, deveria ser mais restrito?
  // A lógica original não especificava, mas vamos assumir que se tem acesso, pode editar
  // OU devemos verificar propriedade?
  // O backend original apenas verificava `verificarAcessoPasta` para GET/PUT/DELETE.
  // Vamos manter a paridade.

  if (!temAcesso) {
    throw new Error("Acesso negado à pasta.");
  }

  // Vamos adicionar uma restrição extra de segurança: apenas criador edita pastas comuns/privadas?
  // Ou pastas comuns são wiki-style?
  // O código original `verificarAcessoPasta` retorna true se comum OU se criado_por user.
  // Vamos assumir que apenas o criador deve editar para evitar vandalismo, a menos que seja admin.
  // Por segurança, vamos buscar a pasta e checar criador se quisermos ser estritos.
  // Mas para migração fiel, vamos usar o que o repository provê + verificação de acesso.

  // Porém, a rota PUT original fazia `verificarAcessoPasta`.

  return pastasRepo.atualizarPasta(id, parsedParams as AtualizarPastaParams);
}

export async function moverDocumento(
  documento_id: number,
  pasta_id: number | null,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso || (permissao !== "editar" && permissao !== "proprietario")) {
    throw new Error(
      "Acesso negado: você não tem permissão para mover este documento."
    );
  }

  if (pasta_id) {
    const temAcessoPasta = await pastasRepo.verificarAcessoPasta(
      pasta_id,
      usuario_id
    );
    if (!temAcessoPasta) {
      throw new Error("Acesso negado à pasta de destino.");
    }
  }

  await documentosRepo.atualizarDocumento(documento_id, { pasta_id }, usuario_id);
  const result = await documentosRepo.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error("Documento movido mas não encontrado.");
  }
  return result;
}

export async function deletarPasta(
  id: number,
  usuario_id: number
): Promise<void> {
  const pasta = await pastasRepo.buscarPastaPorId(id);
  if (!pasta) {
    throw new Error("Pasta não encontrada.");
  }
  if (pasta.criado_por !== usuario_id) {
    const podeDeletar = await checkPermission(usuario_id, "documentos", "deletar");
    if (!podeDeletar) {
      throw new Error(
        "Acesso negado: apenas o proprietário ou usuários com permissão podem deletar a pasta."
      );
    }
  }

  const { documentos, subpastas } = await pastasRepo
    .listarPastasComContadores(id, usuario_id)
    .then((pastasComContadores) => ({
      documentos: pastasComContadores.reduce(
        (acc, p) => acc + p.total_documentos,
        0
      ),
      subpastas: pastasComContadores.length, // Já considera subpastas diretas
    }));

  if (documentos > 0 || subpastas > 0) {
    throw new Error(
      "Não é possível deletar pastas com documentos ou subpastas. Mova-os ou delete-os primeiro."
    );
  }

  await pastasRepo.deletarPasta(id);
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function listarTemplates(
  params: ListarTemplatesParams,
  usuario_id?: number
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  return templatesRepo.listarTemplates(params, usuario_id);
}

export async function criarTemplate(
  params: unknown,
  usuario_id: number
): Promise<Template> {
  const parsedParams = domain.criarTemplateSchema.parse(params);
  return templatesRepo.criarTemplate(
    parsedParams as CriarTemplateParams,
    usuario_id
  );
}

export async function buscarTemplate(
  id: number,
  usuario_id: number
): Promise<TemplateComUsuario> {
  const template = await templatesRepo.buscarTemplateComUsuario(id);
  if (!template) {
    throw new Error("Template não encontrado.");
  }

  if (
    template.visibilidade === "privado" &&
    template.criado_por !== usuario_id
  ) {
    throw new Error("Acesso negado a este template.");
  }

  return template;
}

export async function atualizarTemplate(
  id: number,
  params: unknown,
  usuario_id: number
): Promise<Template> {
  const parsedParams = domain.atualizarTemplateSchema.parse(params);
  const template = await templatesRepo.buscarTemplatePorId(id);

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  if (template.criado_por !== usuario_id) {
    throw new Error(
      "Acesso negado: apenas o proprietário pode editar este template."
    );
  }

  return templatesRepo.atualizarTemplate(
    id,
    parsedParams as AtualizarTemplateParams
  );
}

export async function usarTemplate(
  template_id: number,
  usuario_id: number,
  opcoes?: { titulo?: string; pasta_id?: number | null }
): Promise<DocumentoComUsuario> {
  const template = await templatesRepo.buscarTemplatePorId(template_id);
  if (!template) {
    throw new Error("Template não encontrado.");
  }

  if (
    template.visibilidade === "privado" &&
    template.criado_por !== usuario_id
  ) {
    throw new Error("Acesso negado a este template.");
  }

  if (opcoes?.pasta_id) {
    const temAcessoPasta = await pastasRepo.verificarAcessoPasta(
      opcoes.pasta_id,
      usuario_id
    );
    if (!temAcessoPasta) {
      throw new Error("Acesso negado à pasta de destino.");
    }
  }

  const novoDocumento = await templatesRepo.criarDocumentoDeTemplate(
    template_id,
    usuario_id,
    opcoes
  );
  await templatesRepo.incrementarUsoTemplate(template_id);
  const result = await documentosRepo.buscarDocumentoComUsuario(novoDocumento.id);
  if (!result) {
    throw new Error("Documento criado de template mas não encontrado.");
  }
  return result;
}

export async function deletarTemplate(
  id: number,
  usuario_id: number
): Promise<void> {
  const template = await templatesRepo.buscarTemplatePorId(id);
  if (!template || template.criado_por !== usuario_id) {
    throw new Error(
      "Acesso negado: apenas o proprietário pode deletar este template."
    );
  }
  await templatesRepo.deletarTemplate(id);
}

export async function listarCategoriasTemplates(
  usuario_id: number
): Promise<string[]> {
  return templatesRepo.listarCategoriasTemplates(usuario_id);
}

export async function listarTemplatesMaisUsados(
  limit: number,
  usuario_id: number
): Promise<TemplateComUsuario[]> {
  return templatesRepo.listarTemplatesMaisUsados(limit, usuario_id);
}

// ============================================================================
// COMPARTILHAMENTO
// ============================================================================

export async function compartilharDocumento(
  params: unknown,
  compartilhado_por: number
): Promise<DocumentoCompartilhado> {
  const parsedParams = domain.criarCompartilhamentoSchema.parse(params);
  const { documento_id, usuario_id } = parsedParams;

  const documento = await documentosRepo.buscarDocumentoPorId(documento_id);
  if (!documento || documento.criado_por !== compartilhado_por) {
    throw new Error("Acesso negado: apenas o proprietário pode compartilhar.");
  }

  if (usuario_id === compartilhado_por) {
    throw new Error("Não é possível compartilhar um documento consigo mesmo.");
  }

  const usuario = await usuarioRepository.findById(usuario_id);
  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }
  return compartilhamentoRepo.compartilharDocumento(parsedParams, compartilhado_por);
}

export async function listarCompartilhamentos(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoCompartilhadoComUsuario[]> {
  const { temAcesso } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso) {
    throw new Error("Acesso negado ao documento.");
  }
  return compartilhamentoRepo.listarCompartilhamentos({ documento_id });
}

export async function listarDocumentosCompartilhadosComUsuario(
  usuario_id: number
): Promise<DocumentoComUsuario[]> {
  return documentosRepo.listarDocumentosCompartilhadosComUsuario(usuario_id);
}

export async function atualizarPermissao(
  compartilhamento_id: number,
  updates: { permissao?: string; pode_deletar?: boolean },
  usuario_id: number
): Promise<DocumentoCompartilhado> {
  const parsed = domain.atualizarPermissaoCompartilhamentoSchema.parse(updates);

  const compartilhamento = await compartilhamentoRepo.buscarCompartilhamentoPorId(
    compartilhamento_id
  );
  if (!compartilhamento) {
    throw new Error("Compartilhamento não encontrado.");
  }

  const documento = await documentosRepo.buscarDocumentoPorId(
    compartilhamento.documento_id
  );
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error(
      "Acesso negado: apenas o proprietário pode alterar permissões."
    );
  }

  if (compartilhamento.usuario_id === usuario_id) {
    throw new Error("Não é possível alterar sua própria permissão.");
  }

  return compartilhamentoRepo.atualizarPermissaoCompartilhamentoPorId(
    compartilhamento_id,
    parsed.permissao as "visualizar" | "editar" | undefined,
    parsed.pode_deletar
  );
}

export async function removerCompartilhamento(
  compartilhamento_id: number,
  usuario_id: number
): Promise<void> {
  const compartilhamento = await compartilhamentoRepo.buscarCompartilhamentoPorId(
    compartilhamento_id
  );
  if (!compartilhamento) {
    throw new Error("Compartilhamento não encontrado.");
  }

  const documento = await documentosRepo.buscarDocumentoPorId(
    compartilhamento.documento_id
  );
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error(
      "Acesso negado: apenas o proprietário pode remover compartilhamentos."
    );
  }

  await compartilhamentoRepo.removerCompartilhamentoPorId(compartilhamento_id);
}

// ============================================================================
// VERSÕES
// ============================================================================

export async function listarVersoes(
  documento_id: number,
  usuario_id: number
): Promise<{ versoes: DocumentoVersaoComUsuario[]; total: number }> {
  const { temAcesso } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso) {
    throw new Error("Acesso negado ao documento.");
  }
  return versoesRepo.listarVersoes({ documento_id });
}

export async function criarVersao(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoVersao> {
  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso || (permissao !== "editar" && permissao !== "proprietario")) {
    throw new Error(
      "Acesso negado: você não tem permissão para criar versões deste documento."
    );
  }
  const documento = await documentosRepo.buscarDocumentoPorId(documento_id);
  if (!documento) {
    throw new Error("Documento não encontrado.");
  }
  const ultimaVersao = await versoesRepo.buscarVersaoMaisRecente(documento_id);
  const proximaVersaoNumero = (ultimaVersao?.versao || 0) + 1;

  return versoesRepo.criarVersao(
    {
      documento_id,
      versao: proximaVersaoNumero,
      conteudo: documento.conteudo,
      titulo: documento.titulo,
    },
    usuario_id
  );
}

export async function restaurarVersao(
  versao_id: number,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const versao = await versoesRepo.buscarVersaoPorId(versao_id);
  if (!versao) {
    throw new Error("Versão não encontrada.");
  }
  const { documento_id } = versao;

  const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso || (permissao !== "editar" && permissao !== "proprietario")) {
    throw new Error(
      "Acesso negado: você não tem permissão para restaurar versões deste documento."
    );
  }

  await versoesRepo.restaurarVersao(documento_id, versao.versao, usuario_id);
  const result = await documentosRepo.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error("Documento restaurado mas não encontrado.");
  }
  return result;
}

// ============================================================================
// UPLOADS
// ============================================================================

export async function uploadArquivo(
  file: File,
  documento_id: number | null,
  usuario_id: number
): Promise<DocumentoUpload> {
  const { name, type, size } = file;
  const buffer = Buffer.from(await file.arrayBuffer()); // Converter File para Buffer

  if (!validateFileType(type)) {
    throw new Error("Tipo de arquivo não permitido.");
  }
  if (!validateFileSize(size)) {
    throw new Error("Tamanho do arquivo excede o limite (50MB).");
  }

  if (documento_id) {
    const { temAcesso, permissao } = await documentosRepo.verificarAcessoDocumento(
      documento_id,
      usuario_id
    );
    if (
      !temAcesso ||
      (permissao !== "editar" && permissao !== "proprietario")
    ) {
      throw new Error(
        "Acesso negado: você não tem permissão para fazer upload para este documento."
      );
    }
  }

  const b2UploadResult = await uploadFileToB2({
    file: buffer,
    fileName: name,
    contentType: type,
    folder: documento_id ? `documentos/${documento_id}` : "uploads",
  });

  return uploadsRepo.registrarUpload(
    {
      documento_id,
      nome_arquivo: name,
      tipo_mime: type,
      tamanho_bytes: size,
      b2_key: b2UploadResult.key,
      b2_url: b2UploadResult.url,
      tipo_media: getTipoMedia(type),
    },
    usuario_id
  );
}

export async function listarUploads(
  documento_id: number,
  usuario_id: number
): Promise<{ uploads: DocumentoUploadComInfo[]; total: number }> {
  const { temAcesso } = await documentosRepo.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );
  if (!temAcesso) {
    throw new Error("Acesso negado ao documento.");
  }
  return uploadsRepo.listarUploads({ documento_id });
}

export async function gerarPresignedUrl(
  filename: string,
  contentType: string,
  usuario_id: number,
  size?: number
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  // Validar tipo de arquivo
  if (!validateFileType(contentType)) {
    throw new Error("Tipo de arquivo não permitido.");
  }

  // Validar tamanho se fornecido
  if (size !== undefined && !validateFileSize(size)) {
    throw new Error("Tamanho do arquivo excede o limite (50MB).");
  }

  // Validar quota de API/Uploads
  const quotaCheck = await checkQuota(usuario_id, "authenticated");
  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason || "Limite de uploads excedido.");
  }

  const result = await generatePresignedUploadUrl({ fileName: filename, contentType });

  // Incrementar quota
  await incrementQuota(usuario_id, "authenticated");

  return result;
}

export async function gerarUrlDownload(key: string): Promise<string> {
  // TODO: Implementar validação de acesso ao documento pelo key?
  // O ideal seria passar o documento_id, verificar acesso e pegar a key.
  // Mas por enquanto vamos manter a compatibilidade com a API antiga que recebe key.
  return generatePresignedDownloadUrl(key);
}

// ============================================================================
// LIXEIRA
// ============================================================================

export async function listarLixeira(
  usuario_id: number
): Promise<DocumentoComUsuario[]> {
  return documentosRepo.listarDocumentosLixeira(usuario_id);
}

export async function restaurarDaLixeira(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const documento = await documentosRepo.buscarDocumentoPorId(documento_id, true); // Inclui deletados
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error(
      "Acesso negado: apenas o proprietário pode restaurar o documento."
    );
  }
  if (!documento.deleted_at) {
    throw new Error("Documento não está na lixeira.");
  }

  await documentosRepo.restaurarDocumento(documento_id);
  const result = await documentosRepo.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error("Documento restaurado mas não encontrado.");
  }
  return result;
}

export async function limparLixeira(
  usuario_id: number
): Promise<{ documentosDeletados: number; pastasDeletadas: number }> {
  // Este é um cenário mais complexo, pois `limparLixeira` no persistence service
  // não recebe usuario_id. Uma limpeza "por usuário" implicaria em
  // deletar apenas os documentos/pastas do usuário. Por simplicidade,
  // aqui, vamos considerar que `limparLixeira` no service de persistência
  // fará uma limpeza global (conforme implementado).
  // Se a intenção é limpar a lixeira *apenas* do usuário,
  // o método de persistência precisaria ser adaptado.

  // Por ora, apenas proprietários podem acionar a limpeza global,
  // ou a regra de negócio pode ser "limpar os meus itens".
  // Vamos assumir que o serviço aqui é para o próprio usuário limpar SEUS itens da lixeira.

  let documentosDeletados = 0;

  // Deletar documentos do usuário na lixeira
  const docsNaLixeira = await documentosRepo.listarDocumentosLixeira(usuario_id);
  for (const doc of docsNaLixeira) {
    try {
      await documentosRepo.deletarDocumentoPermanentemente(doc.id);
      documentosDeletados++;
    } catch (error) {
      console.error(
        `Erro ao deletar documento ${doc.id} do usuário ${usuario_id}:`,
        error
      );
    }
  }

  // Deletar pastas do usuário na lixeira
  // (Este é mais complexo, pois `deletarPastaPermanentemente` não verifica propriedade
  // e deletaria recursivamente. Seria melhor ter um `listarPastasLixeira(usuario_id)`
  // e então chamar `deletarPastaPermanentemente` para cada uma.)
  // Por simplicidade, vamos assumir um cenário onde apenas pastas vazias são deletadas.
  // A implementação atual de `deletarPasta` no service já lida com documentos/subpastas
  // antes de permitir a exclusão lógica. A exclusão *permanente* de pastas
  // precisaria de uma lógica mais robusta para garantir que só itens do usuário sejam afetados.

  // Para o propósito deste plano, vamos focar nos documentos do usuário.
  // A limpeza de pastas "do usuário" que estão na lixeira é mais granular
  // e provavelmente exige uma função de persistência dedicada `deletarPastaPermanentementeDoUsuario`.

  // O exemplo de `limpar-lixeira.service.ts` no backend original faz uma limpeza global.
  // Para manter a sanidade e o escopo, vou assumir que essa `limparLixeira` aqui
  // apenas orquestra a remoção permanente dos *próprios documentos* do usuário da lixeira.
  // Limpeza de pastas seria um passo separado ou exigiria um `deletarPastaPermanentemente`
  // que verificasse o criador.

  return { documentosDeletados, pastasDeletadas: 0 };
}

export async function deletarDocumentoPermanentemente(
  documento_id: number,
  usuario_id: number
): Promise<void> {
  const documento = await documentosRepo.buscarDocumentoPorId(documento_id, true);

  if (!documento) {
    throw new Error("Documento não encontrado.");
  }

  if (documento.criado_por !== usuario_id) {
    const podeDeletar = await checkPermission(usuario_id, "documentos", "deletar");
    if (!podeDeletar) {
      throw new Error(
        "Acesso negado: apenas o proprietário ou usuários com permissão podem excluir permanentemente."
      );
    }
  }

  return documentosRepo.deletarDocumentoPermanentemente(documento_id);
}

// ============================================================================
// ARQUIVOS GENÉRICOS
// ============================================================================

export async function uploadArquivoGenerico(
  file: File,
  pasta_id: number | null,
  usuario_id: number
): Promise<Arquivo> {
  const { name, type, size } = file;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Validações
  if (!validateFileType(type)) {
    throw new Error("Tipo de arquivo não permitido.");
  }
  if (!validateFileSize(size)) {
    throw new Error("Tamanho do arquivo excede o limite (50MB).");
  }

  // Verificar acesso à pasta
  if (pasta_id) {
    const temAcessoPasta = await pastasRepo.verificarAcessoPasta(
      pasta_id,
      usuario_id
    );
    if (!temAcessoPasta) {
      throw new Error("Acesso negado à pasta.");
    }
  }

  // Upload para B2
  const b2UploadResult = await uploadFileToB2({
    file: buffer,
    fileName: name,
    contentType: type,
    folder: pasta_id ? `pastas/${pasta_id}` : "arquivos",
  });

  // Registrar no banco
  return arquivosRepo.criarArquivo(
    {
      nome: name,
      tipo_mime: type,
      tamanho_bytes: size,
      pasta_id,
      b2_key: b2UploadResult.key,
      b2_url: b2UploadResult.url,
      tipo_media: getTipoMedia(type),
    },
    usuario_id
  );
}

export async function listarItensUnificados(
  params: ListarArquivosParams,
  _usuario_id: number
): Promise<{ itens: ItemDocumento[]; total: number }> {
  return arquivosRepo.listarItensUnificados(params);
}

export async function moverArquivo(
  arquivo_id: number,
  pasta_id: number | null,
  usuario_id: number
): Promise<Arquivo> {
  const arquivo = await arquivosRepo.buscarArquivoPorId(arquivo_id);
  if (!arquivo || arquivo.criado_por !== usuario_id) {
    throw new Error("Acesso negado ao arquivo.");
  }

  if (pasta_id) {
    const temAcessoPasta = await pastasRepo.verificarAcessoPasta(
      pasta_id,
      usuario_id
    );
    if (!temAcessoPasta) {
      throw new Error("Acesso negado à pasta de destino.");
    }
  }

  return arquivosRepo.atualizarArquivo(arquivo_id, { pasta_id });
}

export async function deletarArquivo(
  arquivo_id: number,
  usuario_id: number
): Promise<void> {
  const arquivo = await arquivosRepo.buscarArquivoPorId(arquivo_id);
  if (!arquivo) {
    throw new Error("Arquivo não encontrado.");
  }
  if (arquivo.criado_por !== usuario_id) {
    const podeDeletar = await checkPermission(usuario_id, "documentos", "deletar");
    if (!podeDeletar) {
      throw new Error(
        "Acesso negado: apenas o proprietário ou usuários com permissão podem deletar o arquivo."
      );
    }
  }

  await arquivosRepo.deletarArquivo(arquivo_id);
}
