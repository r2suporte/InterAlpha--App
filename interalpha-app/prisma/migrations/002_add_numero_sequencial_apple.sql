-- Migration: Add numeroSequencial field to OrdemServicoApple
-- This adds an auto-incrementing sequential number for Apple service orders

-- Add the numeroSequencial column with auto-increment
ALTER TABLE "ordens_servico_apple" 
ADD COLUMN "numeroSequencial" SERIAL;

-- Create a unique index on numeroSequencial for better performance
CREATE UNIQUE INDEX "ordens_servico_apple_numeroSequencial_key" 
ON "ordens_servico_apple"("numeroSequencial");

-- Update existing records to have sequential numbers (if any exist)
-- This will assign sequential numbers starting from 1
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "ordens_servico_apple"
)
UPDATE "ordens_servico_apple" 
SET "numeroSequencial" = numbered_rows.rn
FROM numbered_rows 
WHERE "ordens_servico_apple".id = numbered_rows.id;