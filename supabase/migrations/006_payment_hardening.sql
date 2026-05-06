-- ============================================================
-- Endurecimento de pagamentos, idempotencia e reserva de estoque
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_attempt_id TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS mp_status TEXT,
  ADD COLUMN IF NOT EXISTS mp_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_released_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_checkout_attempt
  ON orders(user_id, checkout_attempt_id)
  WHERE checkout_attempt_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external_reference
  ON orders(external_reference)
  WHERE external_reference IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_checkout_attempt_length'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_checkout_attempt_length
      CHECK (
        checkout_attempt_id IS NULL
        OR length(checkout_attempt_id) BETWEEN 12 AND 120
      );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS stock_reservations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  status      TEXT NOT NULL DEFAULT 'reserved'
                CHECK (status IN ('reserved', 'confirmed', 'released')),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  released_at  TIMESTAMPTZ,
  UNIQUE (order_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order
  ON stock_reservations(order_id);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_variant
  ON stock_reservations(variant_id);

CREATE TABLE IF NOT EXISTS mercadopago_payment_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key     TEXT NOT NULL UNIQUE,
  event_id      TEXT,
  payment_id    TEXT,
  action        TEXT,
  event_type    TEXT,
  x_request_id  TEXT,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed     BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_events_payment
  ON mercadopago_payment_events(payment_id);

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_reservations_admin_all" ON stock_reservations;
CREATE POLICY "stock_reservations_admin_all" ON stock_reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "mp_payment_events_admin_all" ON mercadopago_payment_events;
CREATE POLICY "mp_payment_events_admin_all" ON mercadopago_payment_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE OR REPLACE FUNCTION create_checkout_order(
  p_user_id UUID,
  p_checkout_attempt_id TEXT,
  p_payment_method TEXT,
  p_address_snapshot JSONB,
  p_items JSONB,
  p_shipping_cost NUMERIC,
  p_pix_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing orders%ROWTYPE;
  v_order_id UUID;
  v_item_count INTEGER;
  v_locked_count INTEGER;
  v_subtotal NUMERIC(10, 2);
  v_total NUMERIC(10, 2);
  v_insufficient_product TEXT;
BEGIN
  IF p_payment_method NOT IN ('pix', 'credit_card') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  IF p_checkout_attempt_id IS NULL
    OR length(trim(p_checkout_attempt_id)) < 12
    OR length(trim(p_checkout_attempt_id)) > 120 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;

  SELECT *
    INTO v_existing
  FROM orders
  WHERE user_id = p_user_id
    AND checkout_attempt_id = p_checkout_attempt_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'orderId', v_existing.id,
      'subtotal', v_existing.subtotal,
      'shippingCost', v_existing.shipping_cost,
      'total', v_existing.total,
      'paymentId', v_existing.payment_id,
      'paymentMethod', v_existing.payment_method,
      'paymentStatus', v_existing.payment_status,
      'orderStatus', v_existing.status,
      'pixQrCode', v_existing.pix_qr_code,
      'pixQrCodeBase64', v_existing.pix_qr_code_base64,
      'pixExpiresAt', v_existing.pix_expires_at,
      'wasExisting', TRUE
    );
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS checkout_items (
    variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL
  ) ON COMMIT DROP;
  TRUNCATE TABLE pg_temp.checkout_items;

  INSERT INTO pg_temp.checkout_items (variant_id, quantity)
  SELECT item.variant_id, SUM(item.quantity)::INTEGER
  FROM jsonb_to_recordset(p_items) AS item(variant_id UUID, quantity INTEGER)
  GROUP BY item.variant_id;

  SELECT COUNT(*) INTO v_item_count FROM pg_temp.checkout_items;
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_temp.checkout_items WHERE quantity <= 0) THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  PERFORM 1
  FROM product_variants pv
  JOIN pg_temp.checkout_items ci ON ci.variant_id = pv.id
  FOR UPDATE OF pv;

  CREATE TEMP TABLE IF NOT EXISTS checkout_locked (
    variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
  ) ON COMMIT DROP;
  TRUNCATE TABLE pg_temp.checkout_locked;

  INSERT INTO pg_temp.checkout_locked (
    variant_id,
    quantity,
    product_id,
    product_name,
    product_image,
    size,
    color,
    stock,
    unit_price
  )
  SELECT
    ci.variant_id,
    ci.quantity,
    pv.product_id,
    p.name,
    CASE WHEN cardinality(p.images) > 0 THEN p.images[1] ELSE NULL END,
    pv.size,
    pv.color,
    pv.stock,
    p.price
  FROM pg_temp.checkout_items ci
  JOIN product_variants pv ON pv.id = ci.variant_id
  JOIN products p ON p.id = pv.product_id
  WHERE p.is_active = TRUE;

  SELECT COUNT(*) INTO v_locked_count FROM pg_temp.checkout_locked;
  IF v_locked_count <> v_item_count THEN
    RAISE EXCEPTION 'ITEM_UNAVAILABLE';
  END IF;

  SELECT product_name
    INTO v_insufficient_product
  FROM pg_temp.checkout_locked
  WHERE stock < quantity
  LIMIT 1;

  IF v_insufficient_product IS NOT NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_insufficient_product;
  END IF;

  SELECT COALESCE(SUM(unit_price * quantity), 0)
    INTO v_subtotal
  FROM pg_temp.checkout_locked;

  v_total := v_subtotal + COALESCE(p_shipping_cost, 0);

  INSERT INTO orders (
    user_id,
    status,
    payment_method,
    payment_status,
    checkout_attempt_id,
    pix_expires_at,
    subtotal,
    shipping_cost,
    total,
    address_snapshot
  )
  VALUES (
    p_user_id,
    'pending',
    p_payment_method,
    'pending',
    trim(p_checkout_attempt_id),
    CASE WHEN p_payment_method = 'pix' THEN p_pix_expires_at ELSE NULL END,
    v_subtotal,
    COALESCE(p_shipping_cost, 0),
    v_total,
    p_address_snapshot
  )
  RETURNING id INTO v_order_id;

  UPDATE orders
  SET external_reference = v_order_id::TEXT
  WHERE id = v_order_id;

  INSERT INTO order_items (
    order_id,
    product_id,
    variant_id,
    product_name,
    product_image,
    size,
    color,
    quantity,
    unit_price
  )
  SELECT
    v_order_id,
    product_id,
    variant_id,
    product_name,
    product_image,
    size,
    color,
    quantity,
    unit_price
  FROM pg_temp.checkout_locked;

  UPDATE product_variants pv
  SET stock = pv.stock - cl.quantity
  FROM pg_temp.checkout_locked cl
  WHERE pv.id = cl.variant_id;

  INSERT INTO stock_reservations (order_id, variant_id, quantity)
  SELECT v_order_id, variant_id, quantity
  FROM pg_temp.checkout_locked;

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'subtotal', v_subtotal,
    'shippingCost', COALESCE(p_shipping_cost, 0),
    'total', v_total,
    'paymentId', NULL,
    'paymentMethod', p_payment_method,
    'paymentStatus', 'pending',
    'orderStatus', 'pending',
    'pixQrCode', NULL,
    'pixQrCodeBase64', NULL,
    'pixExpiresAt', CASE WHEN p_payment_method = 'pix' THEN p_pix_expires_at ELSE NULL END,
    'wasExisting', FALSE
  );
END;
$$;

CREATE OR REPLACE FUNCTION release_order_stock(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'payment_failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS reservations_to_release (
    reservation_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL
  ) ON COMMIT DROP;
  TRUNCATE TABLE pg_temp.reservations_to_release;

  INSERT INTO pg_temp.reservations_to_release (reservation_id, variant_id, quantity)
  SELECT id, variant_id, quantity
  FROM stock_reservations
  WHERE order_id = p_order_id
    AND status = 'reserved'
  FOR UPDATE;

  SELECT COUNT(*) INTO v_count FROM pg_temp.reservations_to_release;
  IF v_count = 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE product_variants pv
  SET stock = pv.stock + r.quantity
  FROM pg_temp.reservations_to_release r
  WHERE pv.id = r.variant_id;

  UPDATE stock_reservations sr
  SET
    status = 'released',
    reason = p_reason,
    released_at = NOW()
  FROM pg_temp.reservations_to_release r
  WHERE sr.id = r.reservation_id;

  UPDATE orders
  SET
    stock_released_at = COALESCE(stock_released_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION confirm_order_stock(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE stock_reservations
  SET
    status = 'confirmed',
    confirmed_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'reserved';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    UPDATE orders
    SET
      stock_confirmed_at = COALESCE(stock_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = p_order_id;
  END IF;

  RETURN v_count > 0;
END;
$$;
