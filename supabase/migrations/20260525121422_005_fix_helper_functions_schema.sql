/*
  # Fix Helper Functions - Add public schema prefix

  1. Changes
    - All helper functions reference tables with `public.` schema prefix
    - This is required because functions use `SET search_path = ''` for security
    - Without the prefix, PostgreSQL cannot find the tables

  2. Functions Fixed
    - get_order_stats(): public.orders
    - get_top_products(): public.order_items, public.orders
    - get_customer_growth(): public.users
    - get_revenue_by_period(): public.orders
    - update_product_rating(): public.reviews, public.products
    - increment_discount_usage(): public.discounts
*/

-- Fix: update_product_rating
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
  FROM public.reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_approved = true;

  UPDATE public.products
  SET rating = ROUND(avg_rating, 2),
      review_count = review_cnt
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix: increment_discount_usage
CREATE OR REPLACE FUNCTION public.increment_discount_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.discount_code IS NOT NULL AND NEW.discount_code != '' THEN
    UPDATE public.discounts
    SET current_uses = current_uses + 1
    WHERE code = NEW.discount_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix: get_order_stats
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
  FROM public.orders
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- Fix: get_top_products
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
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY oi.product_id, oi.product_name_ar, oi.product_name_en
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$;

-- Fix: get_customer_growth
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
  FROM public.users
  WHERE is_admin = false
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY period;
END;
$$;

-- Fix: get_revenue_by_period
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
  FROM public.orders
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  GROUP BY period
  ORDER BY period;
END;
$$;
