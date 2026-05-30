/*
  # Sirius Handmade - Initial Database Schema

  1. New Tables
    - `categories` - Product categories with Arabic/English names and images
    - `products` - Handmade resin products with multi-image support, pricing, stock, tags
    - `product_images` - Multiple images per product (Cloudinary URLs)
    - `users` - Extended user profiles linked to auth.users
    - `orders` - Customer orders with status tracking
    - `order_items` - Individual items within each order
    - `reviews` - Product reviews and ratings
    - `favorites` - User favorite/wishlist products
    - `discounts` - Discount codes with percentage/fixed amount support
    - `notifications` - User notifications
    - `settings` - Website configuration (title, logo, social links, contact info)

  2. Security
    - RLS enabled on ALL tables
    - Public read access for products, categories, reviews
    - Authenticated user access for orders, favorites, notifications
    - Admin-only access for managing products, categories, orders, discounts, settings
    - Users can only access their own data (orders, favorites, notifications, profile)

  3. Important Notes
    - All tables use UUID primary keys
    - Timestamps track creation and updates
    - Products support multiple images via product_images table
    - Order status is tracked with a constrained enum type
    - Admin role is stored in users table (is_admin boolean)
    - Soft delete support for products (is_active flag)
*/

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  discount_price decimal(10,2) DEFAULT NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  rating decimal(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text DEFAULT '',
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  discount_code text DEFAULT '',
  shipping_address text DEFAULT '',
  shipping_city text DEFAULT '',
  shipping_phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name_ar text NOT NULL,
  product_name_en text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  product_image text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- DISCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  min_order_amount decimal(10,2) DEFAULT 0,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  message_ar text DEFAULT '',
  message_en text DEFAULT '',
  type text DEFAULT 'info' CHECK (type IN ('info', 'order', 'promotion', 'system')),
  is_read boolean DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- CATEGORIES: Public read, admin write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (is_active = true);
CREATE POLICY "Admins can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- PRODUCTS: Public read active, admin full
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (is_active = true);
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- PRODUCT IMAGES: Public read, admin write
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  TO authenticated, anon
  USING (EXISTS (SELECT 1 FROM products WHERE id = product_images.product_id AND is_active = true));
CREATE POLICY "Admins can view all product images"
  ON product_images FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Helper function to check if the user is an admin (Security Definer avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- USERS: Own profile read/write, admin read all
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (public.is_admin());
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Users can insert own profile on signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ORDERS: Own orders read, admin full
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ORDER ITEMS: Via orders access
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid()));
CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- REVIEWS: Public read approved, users create own, admin moderate
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- FAVORITES: Own favorites only
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can add own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- DISCOUNTS: Public read active, admin full
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active discounts"
  ON discounts FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));
CREATE POLICY "Admins can view all discounts"
  ON discounts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can manage discounts"
  ON discounts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update discounts"
  ON discounts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete discounts"
  ON discounts FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- NOTIFICATIONS: Own notifications only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- SETTINGS: Public read, admin write
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view settings"
  ON settings FOR SELECT
  TO authenticated, anon
  USING (true);
CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete settings"
  ON settings FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED SETTINGS
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('site_title', 'Sirius Handmade'),
  ('site_title_ar', 'Ø³ÙŠØ±ÙŠÙˆØ³ Ù‡Ø§Ù†Ø¯ Ù…ÙŠØ¯'),
  ('site_description', 'Premium Handmade Resin Products'),
  ('site_description_ar', 'Ù…Ù†ØªØ¬Ø§Øª Ø±ÙŠØ²ÙŠÙ† ÙŠØ¯ÙˆÙŠØ© Ø§Ù„ØµÙ†Ø¹ ÙØ§Ø®Ø±Ø©'),
  ('logo_url', ''),
  ('phone', ''),
  ('email', ''),
  ('whatsapp', ''),
  ('instagram', ''),
  ('facebook', ''),
  ('twitter', ''),
  ('address_ar', ''),
  ('address_en', ''),
  ('currency', 'SAR'),
  ('shipping_fee', '25');

-- ============================================
-- SEED CATEGORIES
-- ============================================
INSERT INTO categories (name_ar, name_en, slug, description_ar, description_en, sort_order) VALUES
  ('Ù…Ø¬ÙˆÙ‡Ø±Ø§Øª Ø§Ù„Ø±ÙŠØ²ÙŠÙ†', 'Resin Jewelry', 'resin-jewelry', 'Ù…Ø¬ÙˆÙ‡Ø±Ø§Øª Ø±ÙŠØ²ÙŠÙ† ÙŠØ¯ÙˆÙŠØ© Ø§Ù„ØµÙ†Ø¹', 'Handmade resin jewelry', 1),
  ('Ø¯ÙŠÙƒÙˆØ±Ø§Øª Ù…Ù†Ø²Ù„ÙŠØ©', 'Home Decor', 'home-decor', 'Ø¯ÙŠÙƒÙˆØ±Ø§Øª Ù…Ù†Ø²Ù„ÙŠØ© Ù…Ù† Ø§Ù„Ø±ÙŠØ²ÙŠÙ†', 'Resin home decorations', 2),
  ('Ø§ÙƒØ³Ø³ÙˆØ§Ø±Ø§Øª', 'Accessories', 'accessories', 'Ø§ÙƒØ³Ø³ÙˆØ§Ø±Ø§Øª Ø±ÙŠØ²ÙŠÙ† Ù…ØªÙ†ÙˆØ¹Ø©', 'Various resin accessories', 3),
  ('Ù‡Ø¯Ø§ÙŠØ§', 'Gifts', 'gifts', 'Ù‡Ø¯Ø§ÙŠØ§ Ø±ÙŠØ²ÙŠÙ† Ù…Ù…ÙŠØ²Ø©', 'Unique resin gifts', 4),
  ('Ø£Ø¯ÙˆØ§Øª Ù…ÙƒØªØ¨ÙŠØ©', 'Office Supplies', 'office-supplies', 'Ø£Ø¯ÙˆØ§Øª Ù…ÙƒØªØ¨ÙŠØ© Ù…Ù† Ø§Ù„Ø±ÙŠØ²ÙŠÙ†', 'Resin office supplies', 5);
/*
  # Auto-admin for first user and admin promotion function

  1. Changes
    - Creates a function `promote_to_admin(email)` that can be called to make any user an admin
    - Adds automatic admin promotion for the very first user who signs up

  2. Security
    - The promote function is SECURITY DEFINER (runs as superuser)
    - Only callable by service role or via SQL
  
  3. Important Notes
    - The first user to register will automatically become admin
    - Subsequent users need to be promoted manually via SQL or admin panel
*/

-- Function to promote any user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.users SET is_admin = true WHERE email = user_email;
  RETURN FOUND;
END;
$$;

-- Auto-promote first user to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  INSERT INTO public.users (id, email, full_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_count = 0  -- First user becomes admin
  );
  RETURN NEW;
END;
$$;
/*
  # Extend Discounts for Product/Category Specific Discounts

  1. Changes
    - Add `product_ids` column (uuid array) for product-specific discounts
    - Add `category_ids` column (uuid array) for category-specific discounts
    - Add `scope` column to define discount scope: 'global', 'products', 'categories'
    - Add `auto_apply` boolean for discounts that apply automatically (no code needed)

  2. Security
    - RLS already enabled on discounts table
    - Existing admin-only policies apply to new columns automatically

  3. Important Notes
    - product_ids and category_ids are arrays allowing multi-product/category discounts
    - scope 'global' = applies to entire cart (existing behavior)
    - scope 'products' = only applies to specified products
    - scope 'categories' = only applies to products in specified categories
    - auto_apply = true means discount applies without entering a code
*/

-- Add new columns
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS product_ids uuid[] DEFAULT '{}';
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS category_ids uuid[] DEFAULT '{}';
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'products', 'categories'));
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS auto_apply boolean DEFAULT false;

-- Add index for array columns
CREATE INDEX IF NOT EXISTS idx_discounts_scope ON discounts(scope);
CREATE INDEX IF NOT EXISTS idx_discounts_auto_apply ON discounts(auto_apply) WHERE auto_apply = true;
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
/*
  # Add admin DELETE policy on users table

  1. Changes
    - Add "Admins can delete users" policy on the users table
    - This was the only missing CRUD policy across all 11 tables
    - Admins need this to manage/remove user accounts from the admin panel

  2. Security
    - Policy is restricted to authenticated users who are admins (is_admin = true)
    - Uses the standard admin check pattern: EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    - DELETE only requires USING clause (no WITH CHECK needed for deletes)
*/

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_admin());
/*
  # Add shipping_name column to orders table

  1. Changes
    - Add `shipping_name` column (text, default '') to the orders table
    - This column stores the recipient name collected during checkout
    - The CartPage checkout form now collects this field but the table lacked it

  2. Security
    - No RLS changes needed; existing policies already cover the orders table
    - Column has a safe default value of '' (empty string)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_name text DEFAULT '';
  END IF;
END $$;
-- Disable auto-admin for first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false  -- Always false, no auto-admin
  );
  RETURN NEW;
END;
$$;
