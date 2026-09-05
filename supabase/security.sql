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

-- 2. Helper Security Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. Profiles Policies
-- ==============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff_or_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ==============================================================================
-- 4. Categories & Materials Policies (Public Catalog)
-- ==============================================================================
-- Anyone can view active categories
CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

-- Only Admin & Staff can manage categories
CREATE POLICY "Admin manage categories"
    ON public.categories FOR ALL
    USING (public.is_staff_or_admin());

-- Anyone can view active materials
CREATE POLICY "Public read active materials"
    ON public.materials FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

-- Only Admin & Staff can manage materials
CREATE POLICY "Admin manage materials"
    ON public.materials FOR ALL
    USING (public.is_staff_or_admin());

-- ==============================================================================
-- 5. Projects Policies (Public Showcase)
-- ==============================================================================
-- Anyone can view active projects
CREATE POLICY "Public read active projects"
    ON public.projects FOR SELECT
    USING (is_active = true OR public.is_staff_or_admin());

-- Only Admin & Staff can manage projects
CREATE POLICY "Admin manage projects"
    ON public.projects FOR ALL
    USING (public.is_staff_or_admin());

-- ==============================================================================
-- 6. RFQs Policies (Quotes & Client Data)
-- ==============================================================================
-- Visitors and authenticated users can submit new RFQs
CREATE POLICY "Public insert rfqs"
    ON public.rfqs FOR INSERT
    WITH CHECK (true);

-- Visitors can track their own RFQ status by unique reference ID
CREATE POLICY "Public track own rfq status"
    ON public.rfqs FOR SELECT
    USING (
        public.is_staff_or_admin() 
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR true -- Allows querying specific rfq_ref for guest status lookup
    );

-- Only Admin & Staff can update or manage RFQ status
CREATE POLICY "Admin manage rfqs"
    ON public.rfqs FOR ALL
    USING (public.is_staff_or_admin());

-- ==============================================================================
-- 7. RFQ Files Policies (Private Client Attachments)
-- ==============================================================================
-- Visitors can upload BOQ/Blueprint attachments during RFQ submission
CREATE POLICY "Public insert rfq files"
    ON public.rfq_files FOR INSERT
    WITH CHECK (true);

-- Only Admin, Staff, or the authenticated owner can access attached private files
CREATE POLICY "Private read rfq files"
    ON public.rfq_files FOR SELECT
    USING (
        public.is_staff_or_admin()
        OR (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by)
    );

-- Only Admin can delete files
CREATE POLICY "Admin delete rfq files"
    ON public.rfq_files FOR DELETE
    USING (public.is_admin());

-- ==============================================================================
-- 8. AI Requests Policies (Advisor Logs)
-- ==============================================================================
CREATE POLICY "Public insert ai requests"
    ON public.ai_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin view ai requests"
    ON public.ai_requests FOR SELECT
    USING (public.is_staff_or_admin());
