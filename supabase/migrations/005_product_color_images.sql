-- ============================================================
-- Imagens por cor do produto
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE product_color_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       TEXT NOT NULL,
  images      TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, color),
  CHECK (cardinality(images) <= 5)
);

CREATE INDEX idx_product_color_images_product ON product_color_images(product_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE product_color_images ENABLE ROW LEVEL SECURITY;

-- Leitura pública (segue o produto, que é visível)
CREATE POLICY "product_color_images_select_all"
  ON product_color_images FOR SELECT USING (TRUE);

-- Admin pode tudo
CREATE POLICY "product_color_images_admin_all"
  ON product_color_images FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
