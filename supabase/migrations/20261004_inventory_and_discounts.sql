-- ==============================================================================
-- Prime Scope Migration: Inventory & Discount Management System
-- Description: Adds stock_status, stock_quantity, price, discount_type,
--              and discount_percent to materials table with RLS enforcement.
-- ==============================================================================

-- 1. Add new columns safely if they do not exist
ALTER TABLE public.materials 
    ADD COLUMN IF NOT EXISTS stock_status TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'unavailable', 'out_of_stock')),
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT NULL CHECK (price IS NULL OR price >= 0),
    ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage')),
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- 2. Populate estimated default base prices according to luxury tiers for any rows with NULL price
UPDATE public.materials 
SET price = CASE 
    WHEN price_tier ILIKE '%ultra%' THEN 850.00
    WHEN price_tier ILIKE '%vip%' THEN 550.00
    WHEN price_tier ILIKE '%مميز%' OR price_tier ILIKE '%premium%' THEN 380.00
    WHEN price_tier ILIKE '%طلب%' OR price_tier ILIKE '%popular%' THEN 260.00
    WHEN price_tier ILIKE '%اقتصادي%' OR price_tier ILIKE '%economic%' THEN 180.00
    ELSE 290.00
END
WHERE price IS NULL;

-- 3. Create index for fast lookups and filtering
CREATE INDEX IF NOT EXISTS idx_materials_stock_status ON public.materials(stock_status);
CREATE INDEX IF NOT EXISTS idx_materials_discount_type ON public.materials(discount_type);

-- 4. Confirm RLS policies (Ensure public can read active, only admin/staff can update)
-- Public read active materials
DROP POLICY IF EXISTS "Public read active materials" ON public.materials;
CREATE POLICY "Public read active materials"
    ON public.materials FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

-- Admin manage materials (full CRUD including stock and discounts)
DROP POLICY IF EXISTS "Admin manage materials" ON public.materials;
CREATE POLICY "Admin manage materials"
    ON public.materials FOR ALL
    USING (public.is_staff_or_admin());
