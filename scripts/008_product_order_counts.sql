-- product_order_counts() — SECURITY DEFINER aggregate used by the homepage's
-- "Népszerű pizzáink" section to rank products by actual order volume.
--
-- The function reads order_items + orders, but only returns
-- (product_id, total_quantity) — no PII, no per-order rows — so it's safe to
-- expose to anon. Cancelled orders are excluded. Idempotent.
--
-- Already applied to the live database via the Supabase MCP, kept here so
-- future migrations and fresh installs stay in sync.

CREATE OR REPLACE FUNCTION public.product_order_counts()
RETURNS TABLE(product_id uuid, total_quantity bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.product_id,
    COALESCE(SUM(oi.quantity), 0)::bigint AS total_quantity
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status <> 'cancelled'
  GROUP BY oi.product_id;
$$;

REVOKE ALL ON FUNCTION public.product_order_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.product_order_counts()
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
