-- Migration: Add numeroSequencial field to Cliente
-- This adds an auto-incrementing sequential number for clients

-- Add the numeroSequencial column with auto-increment
ALTER TABLE "clientes" 
ADD COLUMN "numeroSequencial" SERIAL;

-- Create a unique index on numeroSequencial for better performance
CREATE UNIQUE INDEX "clientes_numeroSequencial_key" 
ON "clientes"("numeroSequencial");

-- Update existing records to have sequential numbers (if any exist)
-- This will assign sequential numbers starting from 1
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "clientes"
)
UPDATE "clientes" 
SET "numeroSequencial" = numbered_rows.rn
FROM numbered_rows 
WHERE "clientes".id = numbered_rows.id;