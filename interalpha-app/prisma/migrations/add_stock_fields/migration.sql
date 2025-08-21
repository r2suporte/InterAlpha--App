-- Migration: Adicionar campos de controle de estoque ao Product
-- Criado em: $(date)

-- Adicionar campos de estoque ao Product
ALTER TABLE "products" ADD COLUMN "quantity" INTEGER DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "minStock" INTEGER DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "maxStock" INTEGER;
ALTER TABLE "products" ADD COLUMN "stockUnit" TEXT DEFAULT 'UN';

-- Criar índices para performance
CREATE INDEX "idx_products_stock_level" ON "products"("quantity", "minStock") WHERE "quantity" <= "minStock";
CREATE INDEX "idx_products_quantity" ON "products"("quantity");

-- Comentários
COMMENT ON COLUMN "products"."quantity" IS 'Quantidade atual em estoque';
COMMENT ON COLUMN "products"."minStock" IS 'Estoque mínimo para alerta';
COMMENT ON COLUMN "products"."maxStock" IS 'Estoque máximo recomendado';
COMMENT ON COLUMN "products"."stockUnit" IS 'Unidade de medida do estoque (UN, KG, M, etc)';