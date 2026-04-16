-- ============================================================
-- RodeioStore — Seed de produtos para desenvolvimento
-- Execute após a 001_initial_schema.sql
-- ============================================================

-- Guardar os IDs das categorias criadas na 001
-- (usamos subselects pelo slug para não depender de UUIDs fixos)

-- ============================================================
-- PRODUTOS
-- ============================================================

-- 1. Camisa Xadrez Austin
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Camisa Xadrez Austin',
  'camisa-xadrez-austin',
  'Camisa xadrez masculina de algodão com fechamento em botões de pressão. Ideal para o dia a dia no campo ou uma noite de rodeio. Tecido leve e respirável.',
  149.90,
  189.90,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  '{}',
  TRUE
);

-- 2. Camisa Xadrez Dallas
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Camisa Xadrez Dallas',
  'camisa-xadrez-dallas',
  'Camisa xadrez feminina slim fit com bordado country no bolso. Tecido macio de flanela com toque premium.',
  159.90,
  NULL,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  '{}',
  TRUE
);

-- 3. Camisa Country Bordada Rodeo
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Camisa Country Bordada Rodeo',
  'camisa-country-bordada-rodeo',
  'Camisa country com bordados detalhados nas mangas e costas. Estilo clássico de competição com ajuste perfeito.',
  199.90,
  249.90,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  '{}',
  FALSE
);

-- 4. Calça Jeans Ranch
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Calça Jeans Ranch',
  'calca-jeans-ranch',
  'Calça jeans reta com costura reforçada. Denim 100% algodão com lavagem escura. Perfeita para encaixar por dentro da bota.',
  189.90,
  229.90,
  (SELECT id FROM categories WHERE slug = 'calcas-jeans'),
  '{}',
  TRUE
);

-- 5. Calça Jeans Bootcut Feminina
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Calça Jeans Bootcut Feminina',
  'calca-jeans-bootcut-feminina',
  'Calça jeans feminina com boca de sino que valoriza o uso com botas. Cintura alta e modelagem confortável.',
  179.90,
  NULL,
  (SELECT id FROM categories WHERE slug = 'calcas-jeans'),
  '{}',
  FALSE
);

-- 6. Bota Texana Montana
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Bota Texana Montana',
  'bota-texana-montana',
  'Bota texana em couro legítimo com bico quadrado e solado em borracha antiderrapante. Conforto e durabilidade para o peão de verdade.',
  449.90,
  549.90,
  (SELECT id FROM categories WHERE slug = 'botas-calcados'),
  '{}',
  TRUE
);

-- 7. Botina Country Durango
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Botina Country Durango',
  'botina-country-durango',
  'Botina de cano curto em couro com zíper lateral. Praticidade para o dia a dia com estilo country autêntico.',
  329.90,
  NULL,
  (SELECT id FROM categories WHERE slug = 'botas-calcados'),
  '{}',
  FALSE
);

-- 8. Chapéu de Couro Sertanejo
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Chapéu de Couro Sertanejo',
  'chapeu-de-couro-sertanejo',
  'Chapéu de couro legítimo com acabamento artesanal. Aba curvada estilo caubói com fita decorativa trançada.',
  259.90,
  319.90,
  (SELECT id FROM categories WHERE slug = 'chapeus'),
  '{}',
  TRUE
);

-- 9. Chapéu de Feltro Rodeio
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Chapéu de Feltro Rodeio',
  'chapeu-de-feltro-rodeio',
  'Chapéu de feltro premium com aba larga. Proteção solar com estilo clássico country. Ideal para festas e rodeios.',
  289.90,
  NULL,
  (SELECT id FROM categories WHERE slug = 'chapeus'),
  '{}',
  TRUE
);

-- 10. Cinto de Couro com Fivela Rodeio
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Cinto de Couro com Fivela Rodeio',
  'cinto-couro-fivela-rodeio',
  'Cinto de couro legítimo com fivela grande estampada de rodeio. O acessório essencial para completar o look country.',
  129.90,
  159.90,
  (SELECT id FROM categories WHERE slug = 'acessorios'),
  '{}',
  TRUE
);

-- 11. Lenço Bandana Country
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Lenço Bandana Country',
  'lenco-bandana-country',
  'Lenço bandana 100% algodão com estampa paisley clássica. Versátil: use no pescoço, cabeça ou como acessório de chapéu.',
  39.90,
  NULL,
  (SELECT id FROM categories WHERE slug = 'acessorios'),
  '{}',
  FALSE
);

-- 12. Vestido Country Floral Belle
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, is_featured) VALUES
(
  'Vestido Country Floral Belle',
  'vestido-country-floral-belle',
  'Vestido midi com estampa floral e detalhes em renda. Perfeito para festas country e eventos ao ar livre. Tecido leve e fluido.',
  219.90,
  279.90,
  (SELECT id FROM categories WHERE slug = 'vestidos-saias'),
  '{}',
  TRUE
);

-- ============================================================
-- VARIANTES (Tamanho × Cor × Estoque)
-- ============================================================

-- Camisa Xadrez Austin — 2 cores × 5 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'P',  'Vermelho e Preto', '#991B1B', 12, 'CXA-VP-P'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'M',  'Vermelho e Preto', '#991B1B', 20, 'CXA-VP-M'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'G',  'Vermelho e Preto', '#991B1B', 15, 'CXA-VP-G'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'GG', 'Vermelho e Preto', '#991B1B', 8,  'CXA-VP-GG'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'XG', 'Vermelho e Preto', '#991B1B', 4,  'CXA-VP-XG'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'P',  'Azul e Branco',    '#1E40AF', 10, 'CXA-AB-P'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'M',  'Azul e Branco',    '#1E40AF', 18, 'CXA-AB-M'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'G',  'Azul e Branco',    '#1E40AF', 14, 'CXA-AB-G'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'GG', 'Azul e Branco',    '#1E40AF', 6,  'CXA-AB-GG'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-austin'), 'XG', 'Azul e Branco',    '#1E40AF', 3,  'CXA-AB-XG');

-- Camisa Xadrez Dallas — 2 cores × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'PP', 'Rosa e Branco', '#DB2777', 8,  'CXD-RB-PP'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'P',  'Rosa e Branco', '#DB2777', 15, 'CXD-RB-P'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'M',  'Rosa e Branco', '#DB2777', 20, 'CXD-RB-M'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'G',  'Rosa e Branco', '#DB2777', 10, 'CXD-RB-G'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'PP', 'Verde e Bege',  '#166534', 6,  'CXD-VB-PP'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'P',  'Verde e Bege',  '#166534', 12, 'CXD-VB-P'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'M',  'Verde e Bege',  '#166534', 16, 'CXD-VB-M'),
((SELECT id FROM products WHERE slug = 'camisa-xadrez-dallas'), 'G',  'Verde e Bege',  '#166534', 8,  'CXD-VB-G');

-- Camisa Country Bordada Rodeo — 1 cor × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'camisa-country-bordada-rodeo'), 'P',  'Branco',  '#FFFFFF', 10, 'CCR-BR-P'),
((SELECT id FROM products WHERE slug = 'camisa-country-bordada-rodeo'), 'M',  'Branco',  '#FFFFFF', 14, 'CCR-BR-M'),
((SELECT id FROM products WHERE slug = 'camisa-country-bordada-rodeo'), 'G',  'Branco',  '#FFFFFF', 12, 'CCR-BR-G'),
((SELECT id FROM products WHERE slug = 'camisa-country-bordada-rodeo'), 'GG', 'Branco',  '#FFFFFF', 5,  'CCR-BR-GG');

-- Calça Jeans Ranch — 2 cores × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'P',  'Azul Escuro', '#1E3A5F', 10, 'CJR-AE-P'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'M',  'Azul Escuro', '#1E3A5F', 16, 'CJR-AE-M'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'G',  'Azul Escuro', '#1E3A5F', 12, 'CJR-AE-G'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'GG', 'Azul Escuro', '#1E3A5F', 6,  'CJR-AE-GG'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'P',  'Preto',       '#1C1C1C', 8,  'CJR-PR-P'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'M',  'Preto',       '#1C1C1C', 14, 'CJR-PR-M'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'G',  'Preto',       '#1C1C1C', 10, 'CJR-PR-G'),
((SELECT id FROM products WHERE slug = 'calca-jeans-ranch'), 'GG', 'Preto',       '#1C1C1C', 4,  'CJR-PR-GG');

-- Calça Jeans Bootcut Feminina — 1 cor × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'calca-jeans-bootcut-feminina'), 'PP', 'Azul Médio', '#3B82F6', 6,  'CJB-AM-PP'),
((SELECT id FROM products WHERE slug = 'calca-jeans-bootcut-feminina'), 'P',  'Azul Médio', '#3B82F6', 12, 'CJB-AM-P'),
((SELECT id FROM products WHERE slug = 'calca-jeans-bootcut-feminina'), 'M',  'Azul Médio', '#3B82F6', 18, 'CJB-AM-M'),
((SELECT id FROM products WHERE slug = 'calca-jeans-bootcut-feminina'), 'G',  'Azul Médio', '#3B82F6', 10, 'CJB-AM-G');

-- Bota Texana Montana — 2 cores × 4 numerações
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '38', 'Marrom Envelhecido', '#7C5839', 5,  'BTM-ME-38'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '40', 'Marrom Envelhecido', '#7C5839', 8,  'BTM-ME-40'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '42', 'Marrom Envelhecido', '#7C5839', 10, 'BTM-ME-42'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '44', 'Marrom Envelhecido', '#7C5839', 6,  'BTM-ME-44'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '38', 'Preto',              '#1C1C1C', 4,  'BTM-PR-38'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '40', 'Preto',              '#1C1C1C', 7,  'BTM-PR-40'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '42', 'Preto',              '#1C1C1C', 9,  'BTM-PR-42'),
((SELECT id FROM products WHERE slug = 'bota-texana-montana'), '44', 'Preto',              '#1C1C1C', 5,  'BTM-PR-44');

-- Botina Country Durango — 1 cor × 4 numerações
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'botina-country-durango'), '38', 'Café', '#5C3D2E', 6,  'BCD-CF-38'),
((SELECT id FROM products WHERE slug = 'botina-country-durango'), '40', 'Café', '#5C3D2E', 10, 'BCD-CF-40'),
((SELECT id FROM products WHERE slug = 'botina-country-durango'), '42', 'Café', '#5C3D2E', 12, 'BCD-CF-42'),
((SELECT id FROM products WHERE slug = 'botina-country-durango'), '44', 'Café', '#5C3D2E', 7,  'BCD-CF-44');

-- Chapéu de Couro Sertanejo — 1 cor × 3 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'chapeu-de-couro-sertanejo'), 'P', 'Marrom', '#7C5839', 8,  'CCS-MR-P'),
((SELECT id FROM products WHERE slug = 'chapeu-de-couro-sertanejo'), 'M', 'Marrom', '#7C5839', 15, 'CCS-MR-M'),
((SELECT id FROM products WHERE slug = 'chapeu-de-couro-sertanejo'), 'G', 'Marrom', '#7C5839', 10, 'CCS-MR-G');

-- Chapéu de Feltro Rodeio — 2 cores × 3 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'P', 'Preto',       '#1C1C1C', 10, 'CFR-PR-P'),
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'M', 'Preto',       '#1C1C1C', 18, 'CFR-PR-M'),
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'G', 'Preto',       '#1C1C1C', 12, 'CFR-PR-G'),
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'P', 'Bege Claro',  '#D4C5A9', 6,  'CFR-BC-P'),
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'M', 'Bege Claro',  '#D4C5A9', 14, 'CFR-BC-M'),
((SELECT id FROM products WHERE slug = 'chapeu-de-feltro-rodeio'), 'G', 'Bege Claro',  '#D4C5A9', 9,  'CFR-BC-G');

-- Cinto de Couro com Fivela Rodeio — 1 cor × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'cinto-couro-fivela-rodeio'), 'P',  'Marrom', '#7C5839', 15, 'CCF-MR-P'),
((SELECT id FROM products WHERE slug = 'cinto-couro-fivela-rodeio'), 'M',  'Marrom', '#7C5839', 20, 'CCF-MR-M'),
((SELECT id FROM products WHERE slug = 'cinto-couro-fivela-rodeio'), 'G',  'Marrom', '#7C5839', 18, 'CCF-MR-G'),
((SELECT id FROM products WHERE slug = 'cinto-couro-fivela-rodeio'), 'GG', 'Marrom', '#7C5839', 10, 'CCF-MR-GG');

-- Lenço Bandana Country — 3 cores × tamanho único
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'lenco-bandana-country'), 'Único', 'Vermelho', '#DC2626', 30, 'LBC-VM-U'),
((SELECT id FROM products WHERE slug = 'lenco-bandana-country'), 'Único', 'Azul',     '#2563EB', 25, 'LBC-AZ-U'),
((SELECT id FROM products WHERE slug = 'lenco-bandana-country'), 'Único', 'Preto',    '#1C1C1C', 20, 'LBC-PR-U');

-- Vestido Country Floral Belle — 2 cores × 4 tamanhos
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku) VALUES
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'PP', 'Floral Rosé',   '#F9A8D4', 5,  'VCF-FR-PP'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'P',  'Floral Rosé',   '#F9A8D4', 10, 'VCF-FR-P'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'M',  'Floral Rosé',   '#F9A8D4', 14, 'VCF-FR-M'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'G',  'Floral Rosé',   '#F9A8D4', 8,  'VCF-FR-G'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'PP', 'Floral Azul',   '#93C5FD', 4,  'VCF-FA-PP'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'P',  'Floral Azul',   '#93C5FD', 9,  'VCF-FA-P'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'M',  'Floral Azul',   '#93C5FD', 12, 'VCF-FA-M'),
((SELECT id FROM products WHERE slug = 'vestido-country-floral-belle'), 'G',  'Floral Azul',   '#93C5FD', 6,  'VCF-FA-G');
