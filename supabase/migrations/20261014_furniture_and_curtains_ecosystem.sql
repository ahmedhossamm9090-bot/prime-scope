-- ==============================================================================
-- Prime Scope Ecosystem: Furniture & Curtains Multi-Division Architecture
-- Description: Independent catalog, categories, projects & inquiries for
--              Prime Scope Furniture and Prime Scope Curtains.
-- ==============================================================================

-- 1. Catalog Categories (Furniture & Curtains)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id TEXT PRIMARY KEY,
    division TEXT NOT NULL CHECK (division IN ('furniture', 'curtains')),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT DEFAULT '✨',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Catalog Products & Items (Furniture & Curtains)
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id TEXT PRIMARY KEY,
    division TEXT NOT NULL CHECK (division IN ('furniture', 'curtains')),
    category_id TEXT REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    specs JSONB DEFAULT '{}'::JSONB,
    price NUMERIC(10, 2) DEFAULT NULL,
    price_tier TEXT DEFAULT 'فاخر',
    stock_status TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'preorder', 'custom_made', 'out_of_stock')),
    stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK (stock_quantity >= 0),
    images JSONB DEFAULT '[]'::JSONB,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catalog Projects & Portfolio (Furniture & Curtains)
CREATE TABLE IF NOT EXISTS public.catalog_projects (
    id TEXT PRIMARY KEY,
    division TEXT NOT NULL CHECK (division IN ('furniture', 'curtains')),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    category TEXT NOT NULL,
    category_ar TEXT,
    category_en TEXT,
    location_ar TEXT,
    location_en TEXT,
    scope_ar TEXT,
    scope_en TEXT,
    images JSONB DEFAULT '[]'::JSONB,
    hero_image TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Division Inquiries & RFQs (Furniture & Curtains Quotes & Site Measurements)
CREATE TABLE IF NOT EXISTS public.division_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_ref TEXT UNIQUE NOT NULL,
    division TEXT NOT NULL CHECK (division IN ('furniture', 'curtains')),
    service_type TEXT NOT NULL DEFAULT 'quote',
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    project_city TEXT NOT NULL,
    details TEXT,
    selected_product_id TEXT REFERENCES public.catalog_items(id) ON DELETE SET NULL,
    selected_product_name TEXT,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'contacted', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast division filtering
CREATE INDEX IF NOT EXISTS idx_catalog_categories_division ON public.catalog_categories(division);
CREATE INDEX IF NOT EXISTS idx_catalog_items_division ON public.catalog_items(division);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON public.catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_is_active ON public.catalog_items(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_projects_division ON public.catalog_projects(division);
CREATE INDEX IF NOT EXISTS idx_division_inquiries_division ON public.division_inquiries(division);
CREATE INDEX IF NOT EXISTS idx_division_inquiries_status ON public.division_inquiries(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_inquiries ENABLE ROW LEVEL SECURITY;

-- Categories RLS
DROP POLICY IF EXISTS "Public read active catalog_categories" ON public.catalog_categories;
CREATE POLICY "Public read active catalog_categories" ON public.catalog_categories FOR SELECT USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage catalog_categories" ON public.catalog_categories;
CREATE POLICY "Admin manage catalog_categories" ON public.catalog_categories FOR ALL USING (public.is_staff_or_admin());

-- Items RLS
DROP POLICY IF EXISTS "Public read active catalog_items" ON public.catalog_items;
CREATE POLICY "Public read active catalog_items" ON public.catalog_items FOR SELECT USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage catalog_items" ON public.catalog_items;
CREATE POLICY "Admin manage catalog_items" ON public.catalog_items FOR ALL USING (public.is_staff_or_admin());

-- Projects RLS
DROP POLICY IF EXISTS "Public read active catalog_projects" ON public.catalog_projects;
CREATE POLICY "Public read active catalog_projects" ON public.catalog_projects FOR SELECT USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage catalog_projects" ON public.catalog_projects;
CREATE POLICY "Admin manage catalog_projects" ON public.catalog_projects FOR ALL USING (public.is_staff_or_admin());

-- Inquiries RLS
DROP POLICY IF EXISTS "Public insert division_inquiries" ON public.division_inquiries;
CREATE POLICY "Public insert division_inquiries" ON public.division_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage division_inquiries" ON public.division_inquiries;
CREATE POLICY "Admin manage division_inquiries" ON public.division_inquiries FOR ALL USING (public.is_staff_or_admin());
