-- ==============================================================================
-- Prime Scope - Enterprise Database Schema (Supabase PostgreSQL)
-- Description: Core tables, relational constraints, indexes, and audit triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table (Stone Sources & Families)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    badge TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materials Table (Catalog of 140+ Natural Stones & Marble)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    color_desc TEXT,
    origin TEXT NOT NULL,
    type_ar TEXT,
    type_en TEXT,
    finish TEXT,
    usage_ar TEXT,
    usage_en TEXT,
    price_tier TEXT NOT NULL DEFAULT 'مميز',
    color_hex TEXT DEFAULT '#ffffff',
    stone_type TEXT NOT NULL DEFAULT 'marble' CHECK (stone_type IN ('marble', 'granite', 'stone', 'travertine', 'limestone', 'onyx')),
    color_group TEXT NOT NULL DEFAULT 'white' CHECK (color_group IN ('white', 'beige', 'black', 'grey', 'gold', 'pink', 'green', 'blue', 'brown')),
    density TEXT,
    water_absorption TEXT,
    compressive_strength TEXT,
    durability_score NUMERIC(3, 1) DEFAULT 4.5,
    maintenance_tier TEXT,
    texture_grad TEXT,
    images JSONB DEFAULT '[]'::JSONB,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects Table (Showcase Portfolio)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('palace', 'hotel', 'villa', 'penthouse', 'commercial')),
    category_ar TEXT,
    category_en TEXT,
    location_ar TEXT,
    location_en TEXT,
    area TEXT,
    scope_ar TEXT,
    scope_en TEXT,
    stones_used TEXT[] DEFAULT '{}',
    hero_grad TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RFQs Table (Request for Quotations & Orders)
CREATE TABLE IF NOT EXISTS public.rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_ref TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    project_city TEXT NOT NULL,
    quantity TEXT,
    application TEXT,
    thickness TEXT,
    waterjet TEXT,
    notes TEXT,
    selected_material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    selected_material_name TEXT,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'ready', 'completed', 'cancelled')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RFQ Files Table (Uploaded BOQ & Blueprints - Private)
CREATE TABLE IF NOT EXISTS public.rfq_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Requests Table (Usage & Smart Advisor Logs)
CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT,
    response TEXT,
    project_type TEXT,
    surface_area TEXT,
    budget_tier TEXT,
    style_pref TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_stone_type ON public.materials(stone_type);
CREATE INDEX IF NOT EXISTS idx_materials_color_group ON public.materials(color_group);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON public.materials(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_ref ON public.rfqs(rfq_ref);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_customer_phone ON public.rfqs(customer_phone);
CREATE INDEX IF NOT EXISTS idx_rfq_files_rfq_id ON public.rfq_files(rfq_id);

-- ==============================================================================
-- Updated At Automatic Triggers
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
