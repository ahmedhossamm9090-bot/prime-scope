-- ==============================================================================
-- Prime Scope - Supabase Storage Buckets & Policies Configuration
-- Description: Public image buckets for materials/projects & Private bucket for RFQs
-- ==============================================================================

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('materials', 'materials', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('projects', 'projects', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('rfq-files', 'rfq-files', false, 26214400, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/acad', 'application/x-dwg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 2. Storage Policies
-- ==============================================================================

-- Public Buckets (materials & projects): Public read access
DROP POLICY IF EXISTS "Public read materials bucket" ON storage.objects;
CREATE POLICY "Public read materials bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public read projects bucket" ON storage.objects;
CREATE POLICY "Public read projects bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'projects');

-- Admin upload/manage for materials and projects
DROP POLICY IF EXISTS "Admin manage materials bucket" ON storage.objects;
CREATE POLICY "Admin manage materials bucket"
    ON storage.objects FOR ALL
    USING (bucket_id IN ('materials', 'projects') AND public.is_staff_or_admin());

-- Private Bucket (rfq-files): Visitors can upload attachments
DROP POLICY IF EXISTS "Public upload to rfq-files bucket" ON storage.objects;
CREATE POLICY "Public upload to rfq-files bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'rfq-files');

-- Private Bucket (rfq-files): ONLY Admin and Staff can read or download client attachments
DROP POLICY IF EXISTS "Admin & Staff download rfq-files" ON storage.objects;
CREATE POLICY "Admin & Staff download rfq-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'rfq-files' AND public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admin delete rfq-files" ON storage.objects;
CREATE POLICY "Admin delete rfq-files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'rfq-files' AND public.is_admin());
