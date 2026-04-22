-- Allow guest (anonymous) users to place orders
-- This script updates RLS policies to permit orders without requiring authentication

-- Drop existing insert policies for orders table
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Allow insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;

-- Create new policy that allows anyone (including anonymous) to insert orders
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Drop existing insert policies for order_items
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Allow insert order_items" ON order_items;

-- Create policy for order_items that allows insert for anyone
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT
  WITH CHECK (true);

-- Drop existing insert policies for order_item_toppings
DROP POLICY IF EXISTS "Users can create order item toppings" ON order_item_toppings;
DROP POLICY IF EXISTS "Allow insert order_item_toppings" ON order_item_toppings;

-- Create policy for order_item_toppings that allows insert for anyone
CREATE POLICY "Anyone can create order item toppings" ON order_item_toppings
  FOR INSERT
  WITH CHECK (true);

-- Ensure read policies exist for products and related tables (for menu display)
DROP POLICY IF EXISTS "Anyone can read products" ON products;
CREATE POLICY "Anyone can read products" ON products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read sizes" ON sizes;
CREATE POLICY "Anyone can read sizes" ON sizes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read toppings" ON toppings;
CREATE POLICY "Anyone can read toppings" ON toppings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read delivery zones" ON delivery_zones;
CREATE POLICY "Anyone can read delivery zones" ON delivery_zones
  FOR SELECT
  USING (true);

-- Allow users to view their own orders (for logged in users) or by order number
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view orders" ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL  -- Guest orders can be viewed
  );
