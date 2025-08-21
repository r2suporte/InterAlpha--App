-- Migration: Add Products Management Tables
-- Created: 2024-01-15
-- Description: Adds Product and OrderItem tables for product management functionality

-- Create products table
CREATE TABLE products (
  id VARCHAR(30) PRIMARY KEY,
  part_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
  sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(30) NOT NULL REFERENCES users(id)
);

-- Create order_items table
CREATE TABLE order_items (
  id VARCHAR(30) PRIMARY KEY,
  order_id VARCHAR(30) NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  product_id VARCHAR(30) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_products_part_number ON products(part_number);
CREATE INDEX idx_products_description_gin ON products USING gin(to_tsvector('portuguese', description));
CREATE INDEX idx_products_active_created ON products(is_active, created_at DESC);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_price_range ON products(cost_price, sale_price);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_created_at ON order_items(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE products IS 'Tabela de produtos para gestão de catálogo';
COMMENT ON COLUMN products.part_number IS 'Número de peça único do produto';
COMMENT ON COLUMN products.description IS 'Descrição detalhada do produto';
COMMENT ON COLUMN products.cost_price IS 'Preço de custo do produto';
COMMENT ON COLUMN products.sale_price IS 'Preço de venda do produto';
COMMENT ON COLUMN products.image_url IS 'URL da imagem do produto';
COMMENT ON COLUMN products.is_active IS 'Indica se o produto está ativo no catálogo';

COMMENT ON TABLE order_items IS 'Itens de produtos utilizados em ordens de serviço';
COMMENT ON COLUMN order_items.quantity IS 'Quantidade do produto utilizada';
COMMENT ON COLUMN order_items.unit_price IS 'Preço unitário no momento da utilização';
COMMENT ON COLUMN order_items.total_price IS 'Preço total (quantity * unit_price)';

-- Insert sample data for testing (optional)
-- INSERT INTO products (id, part_number, description, cost_price, sale_price, created_by) 
-- VALUES 
--   ('prod_sample_001', 'SAMPLE-001', 'Produto de exemplo para testes', 50.00, 75.00, 'user_admin'),
--   ('prod_sample_002', 'SAMPLE-002', 'Outro produto de exemplo', 100.00, 150.00, 'user_admin');