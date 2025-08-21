-- Migration: Otimizar índices para performance
-- Criado para melhorar performance de consultas

-- Índices compostos para produtos
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_active_category" ON "products"("isActive", "categoryId") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_active_price" ON "products"("isActive", "salePrice") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_active_stock" ON "products"("isActive", "quantity") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_active_created" ON "products"("isActive", "createdAt") WHERE "isActive" = true;

-- Índice para busca full-text
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_fulltext" ON "products" USING gin(to_tsvector('portuguese', "partNumber" || ' ' || description));

-- Índices para ordenação comum
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_partnumber_active" ON "products"("partNumber", "isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_description_active" ON "products"("description", "isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_price_active" ON "products"("salePrice", "isActive");

-- Índices para estoque baixo (consulta frequente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_low_stock" ON "products"("quantity", "minStock", "isActive") 
WHERE "isActive" = true AND "quantity" <= "minStock";

-- Índices para OrderItems (performance em relatórios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_items_product_created" ON "order_items"("productId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_items_created_price" ON "order_items"("createdAt", "totalPrice");

-- Índices para StockMovements
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stock_movements_product_created" ON "stock_movements"("productId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stock_movements_type_created" ON "stock_movements"("type", "createdAt");

-- Índices para OrdemServico (melhorar joins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ordens_servico_user_status" ON "ordens_servico"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ordens_servico_client_created" ON "ordens_servico"("clienteId", "createdAt");

-- Índices para ProductCategory
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_product_categories_active_name" ON "product_categories"("isActive", "name") WHERE "isActive" = true;

-- Estatísticas para otimizador
ANALYZE "products";
ANALYZE "order_items";
ANALYZE "stock_movements";
ANALYZE "ordens_servico";
ANALYZE "product_categories";

-- Comentários para documentação
COMMENT ON INDEX "idx_products_fulltext" IS 'Índice full-text para busca rápida em produtos';
COMMENT ON INDEX "idx_products_low_stock" IS 'Índice otimizado para consultas de estoque baixo';
COMMENT ON INDEX "idx_products_active_category" IS 'Índice composto para filtros por categoria em produtos ativos';