-- ============================================================
-- Storage: bucket "images" para fotos de produtos
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Criar o bucket público "images" (idempotente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ============================================================
-- POLÍTICAS DE ACESSO (RLS)
-- ============================================================

-- Leitura pública (qualquer visitante pode ver as imagens)
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Upload permitido apenas para admins
DROP POLICY IF EXISTS "images_admin_insert" ON storage.objects;
CREATE POLICY "images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Atualização permitida apenas para admins
DROP POLICY IF EXISTS "images_admin_update" ON storage.objects;
CREATE POLICY "images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Remoção permitida apenas para admins
DROP POLICY IF EXISTS "images_admin_delete" ON storage.objects;
CREATE POLICY "images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
