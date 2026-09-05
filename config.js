// Prime Scope - Client-Side Environment Configuration
// ==============================================================================
// IMPORTANT: Use ONLY the public Anon Key here. NEVER put service_role key here!
// ==============================================================================

window.PRIME_CONFIG = {
  // Replace with your actual Supabase Project URL & Anon Key from your Supabase Dashboard
  SUPABASE_URL: window.ENV?.SUPABASE_URL || "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || "your-anon-key-here",
  
  // Storage Bucket Names
  STORAGE_BUCKETS: {
    MATERIALS: "materials",
    PROJECTS: "projects",
    RFQ_FILES: "rfq-files" // Private bucket
  },

  // Sales WhatsApp Destination Number
  SALES_PHONE: "966534248861"
};
