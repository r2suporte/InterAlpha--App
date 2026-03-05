-- Security hardening: remove plaintext temporary password storage
BEGIN;

ALTER TABLE clientes
  DROP COLUMN IF EXISTS senha_temporaria;

COMMIT;
