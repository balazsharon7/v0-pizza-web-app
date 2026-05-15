-- Fix infinite recursion in RLS policies that reference `profiles`.
--
-- The original policies (see 002_rls_policies.sql) embedded:
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
-- directly inside every admin check, including the policy ON the profiles table
-- itself. That triggers Postgres's "infinite recursion detected in policy for
-- relation profiles" error as soon as an authenticated user touches a table
-- whose policy needs to look up the profile, which in turn re-applies its own
-- policy, and so on.
--
-- The fix is to route all admin checks through a SECURITY DEFINER function
-- that bypasses RLS for the inner lookup. Idempotent — safe to re-run.
--
-- Run this in the Supabase SQL Editor.

-- 1. SECURITY DEFINER helper. Owned by the table owner so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = uid),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon, authenticated, service_role;

-- 2. Recreate every policy that previously referenced the recursive subquery.
--    Each pair of DROP + CREATE is idempotent.

-- profiles -------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (
  auth.uid() = id OR public.is_admin_user(auth.uid())
);

-- categories -----------------------------------------------------------------
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT WITH CHECK (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE USING (
  public.is_admin_user(auth.uid())
);

-- products -------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (
  public.is_admin_user(auth.uid())
);

-- sizes ----------------------------------------------------------------------
DROP POLICY IF EXISTS "sizes_admin_insert" ON sizes;
CREATE POLICY "sizes_admin_insert" ON sizes FOR INSERT WITH CHECK (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "sizes_admin_update" ON sizes;
CREATE POLICY "sizes_admin_update" ON sizes FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "sizes_admin_delete" ON sizes;
CREATE POLICY "sizes_admin_delete" ON sizes FOR DELETE USING (
  public.is_admin_user(auth.uid())
);

-- toppings -------------------------------------------------------------------
DROP POLICY IF EXISTS "toppings_admin_insert" ON toppings;
CREATE POLICY "toppings_admin_insert" ON toppings FOR INSERT WITH CHECK (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "toppings_admin_update" ON toppings;
CREATE POLICY "toppings_admin_update" ON toppings FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "toppings_admin_delete" ON toppings;
CREATE POLICY "toppings_admin_delete" ON toppings FOR DELETE USING (
  public.is_admin_user(auth.uid())
);

-- orders ---------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  user_id = auth.uid() OR user_id IS NULL OR public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);

-- order_items ----------------------------------------------------------------
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR orders.user_id IS NULL
        OR public.is_admin_user(auth.uid())
      )
  )
);

-- order_item_toppings --------------------------------------------------------
DROP POLICY IF EXISTS "order_item_toppings_select" ON order_item_toppings;
CREATE POLICY "order_item_toppings_select" ON order_item_toppings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.id = order_item_toppings.order_item_id
      AND (
        orders.user_id = auth.uid()
        OR orders.user_id IS NULL
        OR public.is_admin_user(auth.uid())
      )
  )
);

-- settings -------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_admin_insert" ON settings;
CREATE POLICY "settings_admin_insert" ON settings FOR INSERT WITH CHECK (
  public.is_admin_user(auth.uid())
);
DROP POLICY IF EXISTS "settings_admin_update" ON settings;
CREATE POLICY "settings_admin_update" ON settings FOR UPDATE USING (
  public.is_admin_user(auth.uid())
);
