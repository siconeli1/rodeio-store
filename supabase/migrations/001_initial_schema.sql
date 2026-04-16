-- ============================================================
-- RodeioStore — Schema inicial do banco de dados
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PERFIS DE USUÁRIO
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: criar perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CATEGORIAS
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUTOS
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_price   NUMERIC(10, 2) CHECK (compare_price >= 0), -- preço original (para mostrar desconto)
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  images          TEXT[] NOT NULL DEFAULT '{}',              -- array de URLs das imagens
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VARIANTES DE PRODUTO (Tamanho × Cor × Estoque)
-- ============================================================
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL,       -- PP, P, M, G, GG, XG, Único
  color       TEXT NOT NULL,       -- Ex: "Azul Royal"
  color_hex   TEXT,                -- Ex: "#1E40AF"
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku         TEXT UNIQUE,         -- Código único da variante
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENDEREÇOS DOS USUÁRIOS
-- ============================================================
CREATE TABLE addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Casa',  -- Casa, Trabalho, etc.
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  zip_code      TEXT NOT NULL,
  street        TEXT NOT NULL,
  number        TEXT NOT NULL,
  complement    TEXT,
  neighborhood  TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,   -- Sigla: SP, RJ, etc.
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PEDIDOS
-- ============================================================
CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Status do pedido
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),

  -- Pagamento
  payment_method       TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card')),
  payment_status       TEXT NOT NULL DEFAULT 'pending'
                         CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_id           TEXT,                     -- ID da transação no Mercado Pago

  -- PIX (quando aplicável)
  pix_qr_code          TEXT,                     -- Código copia-e-cola
  pix_qr_code_base64   TEXT,                     -- Imagem do QR Code em base64
  pix_expires_at       TIMESTAMPTZ,              -- Expiração do PIX (30 min)

  -- Valores
  subtotal             NUMERIC(10, 2) NOT NULL,
  shipping_cost        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                NUMERIC(10, 2) NOT NULL,

  -- Snapshot do endereço no momento da compra (imutável)
  address_snapshot     JSONB NOT NULL,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ITENS DO PEDIDO
-- ============================================================
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  -- Snapshot dos dados do produto (imutável — preço pode mudar depois)
  product_name    TEXT NOT NULL,
  product_image   TEXT,
  size            TEXT NOT NULL,
  color           TEXT NOT NULL,

  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10, 2) NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Segurança por linha
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- PROFILES: usuário vê/edita apenas o próprio perfil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES: qualquer um lê, só admin escreve
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "categories_admin_all" ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PRODUCTS: ativos são públicos, só admin gerencia
CREATE POLICY "products_select_active" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "products_admin_all" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PRODUCT_VARIANTS: segue o produto
CREATE POLICY "variants_select_all" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "variants_admin_all" ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ADDRESSES: usuário vê/edita apenas os próprios endereços
CREATE POLICY "addresses_own" ON addresses FOR ALL USING (auth.uid() = user_id);

-- ORDERS: usuário vê os próprios pedidos; admin vê todos
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ORDER_ITEMS: segue o pedido
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))));
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));

-- ============================================================
-- SEED: Categorias iniciais de Moda Country
-- ============================================================
INSERT INTO categories (name, slug, description) VALUES
  ('Camisas', 'camisas', 'Camisas xadrez, flanelas e camisas country masculinas e femininas'),
  ('Calças e Jeans', 'calcas-jeans', 'Jeans, calças de couro e calças de montaria'),
  ('Botas e Calçados', 'botas-calcados', 'Botas texanas, botinas e calçados country'),
  ('Chapéus', 'chapeus', 'Chapéus de couro, feltro e palha estilo country'),
  ('Acessórios', 'acessorios', 'Cinturões, fivelas, lenços e acessórios country'),
  ('Vestidos e Saias', 'vestidos-saias', 'Vestidos e saias com estilo country feminino');
