-- Per D-04: Add fixada (pinned) boolean per-user on the participants junction table.
-- This allows each user to pin different conversations independently.
-- Existing RLS on salas_chat_participantes already restricts by user, no extra policy needed.

ALTER TABLE salas_chat_participantes
  ADD COLUMN IF NOT EXISTS fixada BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN salas_chat_participantes.fixada IS 'Whether this user has pinned this conversation';
