-- ==============================================================================
-- Prime Scope - Row Level Security (RLS) & Role-Based Access Control Policies
-- Description: Strict data access boundaries for Public, Staff, and Admin users
-- ==============================================================================

-- 1. Enable RLS on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Helper Security Functions (SECURITY DEFINER with safe search_path)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ==============================================================================
-- 3. Profiles Policies
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin manage all profiles" ON public.profiles;
CREATE POLICY "Admin manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 4. Categories & Materials Policies (Public Catalog)
-- ==============================================================================
-- Categories
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
    ON public.categories FOR ALL
    USING (public.is_staff_or_admin());

-- Materials
DROP POLICY IF EXISTS "Public read active materials" ON public.materials;
CREATE POLICY "Public read active materials"
    ON public.materials FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage materials" ON public.materials;
CREATE POLICY "Admin manage materials"
    ON public.materials FOR ALL
    USING (public.is_staff_or_admin());

-- ==============================================================================
-- 5. Projects Policies (Public Showcase)
-- ==============================================================================
DROP POLICY IF EXISTS "Public read active projects" ON public.projects;
CREATE POLICY "Public read active projects"
    ON public.projects FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin manage projects" ON public.projects;
CREATE POLICY "Admin manage projects"
    ON public.projects FOR ALL
    USING (public.is_staff_or_admin());

-- ==============================================================================
-- 6. RFQs Policies (Quotes & Orders)
-- ==============================================================================
-- Visitors and authenticated users can submit new RFQs
DROP POLICY IF EXISTS "Public insert rfqs" ON public.rfqs;
CREATE POLICY "Public insert rfqs"
    ON public.rfqs FOR INSERT
    WITH CHECK (true);

-- Authenticated users can view their own RFQs, Staff/Admin can view all
DROP POLICY IF EXISTS "Users and Staff view rfqs" ON public.rfqs;
CREATE POLICY "Users and Staff view rfqs"
    ON public.rfqs FOR SELECT
    USING (
        public.is_staff_or_admin() 
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

-- Only Admin & Staff can update or delete RFQs
DROP POLICY IF EXISTS "Admin manage rfqs" ON public.rfqs;
CREATE POLICY "Admin manage rfqs"
    ON public.rfqs FOR UPDATE
    USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin delete rfqs" ON public.rfqs;
CREATE POLICY "Admin delete rfqs"
    ON public.rfqs FOR DELETE
    USING (public.is_admin());

-- Secure RPC Function for Guest Status Tracking (prevents bulk dumping of client data)
CREATE OR REPLACE FUNCTION public.track_rfq_by_ref(p_ref TEXT)
RETURNS TABLE (
    rfq_ref TEXT,
    status TEXT,
    selected_material_name TEXT,
    project_city TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.rfq_ref, r.status, r.selected_material_name, r.project_city, r.created_at
    FROM public.rfqs r
    WHERE r.rfq_ref = UPPER(TRIM(p_ref))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ==============================================================================
-- 7. RFQ Files Policies (Private Client Attachments)
-- ==============================================================================
-- Visitors can attach BOQ/Blueprints during RFQ submission
DROP POLICY IF EXISTS "Public insert rfq files" ON public.rfq_files;
CREATE POLICY "Public insert rfq files"
    ON public.rfq_files FOR INSERT
    WITH CHECK (true);

-- Only Staff, Admin, or the authenticated owner can access attached private files
DROP POLICY IF EXISTS "Private read rfq files" ON public.rfq_files;
CREATE POLICY "Private read rfq files"
    ON public.rfq_files FOR SELECT
    USING (
        public.is_staff_or_admin()
        OR (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by)
    );

-- Only Admin can delete files
DROP POLICY IF EXISTS "Admin delete rfq files" ON public.rfq_files;
CREATE POLICY "Admin delete rfq files"
    ON public.rfq_files FOR DELETE
    USING (public.is_admin());

-- ==============================================================================
-- 8. AI Requests Policies (Advisor Logs)
-- ==============================================================================
DROP POLICY IF EXISTS "Public insert ai requests" ON public.ai_requests;
CREATE POLICY "Public insert ai requests"
    ON public.ai_requests FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin view ai requests" ON public.ai_requests;
CREATE POLICY "Admin view ai requests"
    ON public.ai_requests FOR SELECT
    USING (public.is_staff_or_admin());
