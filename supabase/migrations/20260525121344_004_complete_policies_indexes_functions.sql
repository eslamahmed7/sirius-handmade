/*
  # Complete RLS Policies, Indexes, and Helper Functions

  1. New RLS Policies
    - orders: Admin DELETE (for canceling/removing orders from admin panel)
    - order_items: Admin DELETE (for removing items from admin), Admin INSERT (for admin-created orders)
    - notifications: Admin SELECT (for admin analytics on notifications), Admin UPDATE (for admin to mark read)
    - products: Fix public SELECT to use `is_active` column (currently correct but adding clarity)

  2. New Indexes
    - order_items: product_id index (for product sales analytics)
    - orders: created_at index (for date-range analytics queries)
    - orders: composite (user_id, status) for customer order filtering
    - discounts: composite (is_active, starts_at, expires_at) for public discount lookups
    - products: composite (is_active, is_featured) for homepage featured products
    - notifications: composite (user_id, is_read) for unread notification count
    - users: is_admin index for admin lookups

  3. New Helper Functions
    - update_product_rating(): Recalculates product rating/review_count after review approval
    - get_order_stats(): Returns order statistics for a given period
    - get_top_products(): Returns top selling products with quantities

  4. New Triggers
    - Auto-update product rating when review is inserted/updated/deleted
    - Auto-increment discount current_uses when order with discount is created

  5. Security
    - All new policies follow the same pattern: admin checks via users.is_admin
    - Helper functions are SECURITY DEFINER with restricted search_path
*/

-- ============================================
-- MISSING RLS POLICIES
-- ============================================

-- Orders: Admin can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Order Items: Admin can delete order items
CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Order Items: Admin can insert order items
CREATE POLICY "Admins can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Notifications: Admin can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Notifications: Admin can update notifications
CREATE POLICY "Admins can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Notifications: Admin can delete notifications
CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- MISSING INDEXES
-- ============================================

-- Order items: product_id for sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Orders: created_at for date-range analytics
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Orders: composite user_id + status for customer order filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Discounts: active + dates for public discount lookups
CREATE INDEX IF NOT EXISTS idx_discounts_active_dates ON discounts(is_active, starts_at, expires_at)
  WHERE is_active = true;

-- Products: active + featured for homepage queries
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured)
  WHERE is_active = true AND is_featured = true;

-- Notifications: user_id + is_read for unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)
  WHERE is_read = false;

-- Users: is_admin for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin)
  WHERE is_admin = true;

-- Order items: created_at for time-based product analytics
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at DESC);

-- Users: created_at for customer growth analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- HELPER FUNCTION: Update product rating
-- ============================================
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  avg_rating numeric;
  review_cnt integer;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, review_cnt
  FROM reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_approved = true;

  UPDATE products
  SET rating = ROUND(avg_rating, 2),
      review_count = review_cnt
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger: auto-update product rating on review changes
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ============================================
-- HELPER FUNCTION: Increment discount usage
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_discount_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.discount_code IS NOT NULL AND NEW.discount_code != '' THEN
    UPDATE discounts
    SET current_uses = current_uses + 1
    WHERE code = NEW.discount_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: auto-increment discount usage when order is created
DROP TRIGGER IF EXISTS on_order_created_discount ON orders;
CREATE TRIGGER on_order_created_discount
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_discount_usage();

-- ============================================
-- HELPER FUNCTION: Get order statistics
-- ============================================
CREATE OR REPLACE FUNCTION public.get_order_stats(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_orders bigint,
  total_revenue numeric,
  total_discounts numeric,
  avg_order_value numeric,
  new_orders bigint,
  processing_orders bigint,
  shipped_orders bigint,
  delivered_orders bigint,
  cancelled_orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(SUM(discount_amount), 0) as total_discounts,
    COALESCE(AVG(total_amount), 0) as avg_order_value,
    COUNT(*) FILTER (WHERE status = 'new') as new_orders,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
    COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders
  FROM orders
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get top selling products
-- ============================================
CREATE OR REPLACE FUNCTION public.get_top_products(
  p_limit integer DEFAULT 10,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  product_id uuid,
  product_name_ar text,
  product_name_en text,
  total_quantity bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.product_id,
    oi.product_name_ar,
    oi.product_name_en,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY oi.product_id, oi.product_name_ar, oi.product_name_en
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get customer growth
-- ============================================
CREATE OR REPLACE FUNCTION public.get_customer_growth(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  period text,
  new_customers bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at, 'YYYY-MM') as period,
    COUNT(*) as new_customers
  FROM users
  WHERE is_admin = false
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY period;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get revenue by period
-- ============================================
CREATE OR REPLACE FUNCTION public.get_revenue_by_period(
  p_period text DEFAULT 'monthly',
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  period text,
  revenue numeric,
  order_count bigint,
  discount_total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_period = 'daily' THEN TO_CHAR(created_at, 'YYYY-MM-DD')
      WHEN p_period = 'weekly' THEN TO_CHAR(date_trunc('week', created_at), 'YYYY-MM-DD')
      WHEN p_period = 'monthly' THEN TO_CHAR(created_at, 'YYYY-MM')
      WHEN p_period = 'yearly' THEN TO_CHAR(created_at, 'YYYY')
      ELSE TO_CHAR(created_at, 'YYYY-MM')
    END as period,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count,
    SUM(discount_amount) as discount_total
  FROM orders
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  GROUP BY period
  ORDER BY period;
END;
$$;
