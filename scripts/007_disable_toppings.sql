-- Hide csirke, paprika, tonhal, bacon from the customisation flow without
-- deleting them — past orders may still reference these rows, so a hard
-- DELETE could break the order history. Setting is_available = false makes
-- them invisible in the menu UI (which filters on is_available) but keeps
-- the historical FK references intact.
--
-- Idempotent. Safe to re-run. Run once in the Supabase SQL Editor.

UPDATE toppings
SET is_available = false
WHERE LOWER(name_hu) IN ('csirke', 'paprika', 'tonhal', 'bacon')
   OR LOWER(name_en) IN ('chicken', 'bell pepper', 'pepper', 'tuna', 'bacon');

-- Reload PostgREST schema cache so anything currently looking at toppings
-- picks up the change immediately.
NOTIFY pgrst, 'reload schema';
