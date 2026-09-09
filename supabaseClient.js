// Prime Scope - Supabase Client Initialization & Security Wrapper
// ==============================================================================

(function(window) {
  let supabaseInstance = null;
  let isConfigured = false;

  // Default credentials fallback (prevents breakdown if browser caches older config.js)
  const FALLBACK_URL = "https://vkpbcjjpoiktraiimhkf.supabase.co";
  const FALLBACK_KEY = "sb_publishable_Ws1bfQcuKimvf5fyHqRbRw_OnxpIPv9";

  function initSupabase() {
    const config = window.PRIME_CONFIG || {};

    let url = config.SUPABASE_URL;
    let key = config.SUPABASE_ANON_KEY;

    // If missing or using old placeholder from browser cache, automatically use active project credentials
    if (!url || url.includes("your-project-ref")) {
      url = FALLBACK_URL;
    }
    if (!key || key.includes("your-anon-key")) {
      key = FALLBACK_KEY;
    }

    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      try {
        supabaseInstance = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        isConfigured = true;
        console.log("⚡ [Prime Scope] Supabase client initialized successfully.");
      } catch (e) {
        console.warn("⚠️ [Prime Scope] Error initializing Supabase:", e);
        isConfigured = false;
      }
    } else {
      console.warn("⚠️ [Prime Scope] Supabase CDN library not loaded yet.");
      isConfigured = false;
    }

    return supabaseInstance;
  }

  // Global helper namespace
  window.PrimeSupabase = {
    getClient: function() {
      if (!supabaseInstance) {
        initSupabase();
      }
      return supabaseInstance;
    },
    isReady: function() {
      if (!supabaseInstance) {
        initSupabase();
      }
      return isConfigured && supabaseInstance !== null;
    },
    waitForClient: async function(timeoutMs = 4000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const client = this.getClient();
        if (client && isConfigured) return client;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.getClient();
    }
  };

  // Initialize on script execution if library is already loaded
  initSupabase();
})(window);
