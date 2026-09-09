// Prime Scope - Client-Side Environment Configuration
// ==============================================================================
// IMPORTANT: Use ONLY the public Anon Key here. NEVER put service_role key here!
// ==============================================================================

window.PRIME_CONFIG = {
  // Supabase Project URL & Anon Key from your Supabase Dashboard
  SUPABASE_URL: window.ENV?.SUPABASE_URL || "https://vkpbcjjpoiktraiimhkf.supabase.co",
  SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || "sb_publishable_Ws1bfQcuKimvf5fyHqRbRw_OnxpIPv9",
  
  // Storage Bucket Names
  STORAGE_BUCKETS: {
    MATERIALS: "materials",
    PROJECTS: "projects",
    RFQ_FILES: "rfq-files" // Private bucket
  },

  // Sales WhatsApp Destination Number
  SALES_PHONE: "966534248861"
};
