// Prime Scope - Client-Side Environment Configuration

window.PRIME_CONFIG = {
  SUPABASE_URL:
    window.ENV?.SUPABASE_URL ||
    "https://vkpbcjjpoiktrai1mhkf.supabase.co",

  SUPABASE_ANON_KEY:
    window.ENV?.SUPABASE_ANON_KEY ||
    "PUT_YOUR_PUBLISHABLE_KEY_HERE",

  STORAGE_BUCKETS: {
    MATERIALS: "materials",
    PROJECTS: "projects",
    RFQ_FILES: "rfq-files"
  },

  SALES_PHONE: "966534248861"
};
