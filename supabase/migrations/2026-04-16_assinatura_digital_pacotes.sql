-- Pacote de assinatura: agrupa N documentos do mesmo contrato sob 1 link público
-- compartilhado. Permite que um clique no botão do admin gere todos os documentos
-- (PDFs já preenchidos com os dados do contrato) e devolva um único link pro cliente.

CREATE TABLE assinatura_digital_pacotes (
  id                       BIGSERIAL PRIMARY KEY,
  pacote_uuid              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_compartilhado      TEXT NOT NULL UNIQUE,
  contrato_id              BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  formulario_id            BIGINT NOT NULL REFERENCES assinatura_digital_formularios(id),
  status                   TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','expirado','cancelado','concluido')),
  criado_por               BIGINT REFERENCES usuarios(id),
  expira_em                TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assinatura_digital_pacote_documentos (
  id             BIGSERIAL PRIMARY KEY,
  pacote_id      BIGINT NOT NULL REFERENCES assinatura_digital_pacotes(id) ON DELETE CASCADE,
  documento_id   BIGINT NOT NULL REFERENCES assinatura_digital_documentos(id) ON DELETE CASCADE,
  ordem          INTEGER NOT NULL,
  UNIQUE (pacote_id, documento_id),
  UNIQUE (pacote_id, ordem)
);

CREATE INDEX idx_pacotes_token ON assinatura_digital_pacotes(token_compartilhado);
CREATE INDEX idx_pacotes_contrato_status ON assinatura_digital_pacotes(contrato_id, status) WHERE status = 'ativo';
CREATE INDEX idx_pacote_documentos_pacote ON assinatura_digital_pacote_documentos(pacote_id);

ALTER TABLE assinatura_digital_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinatura_digital_pacote_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pacotes_service_admin ON assinatura_digital_pacotes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY pacote_documentos_service_admin ON assinatura_digital_pacote_documentos
  FOR ALL USING (auth.role() = 'service_role');
