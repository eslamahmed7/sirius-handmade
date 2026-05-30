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
