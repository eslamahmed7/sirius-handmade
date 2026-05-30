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
