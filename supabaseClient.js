// Prime Scope - Supabase Client Initialization & Security Wrapper
// ==============================================================================

(function(window) {
  let supabaseInstance = null;
  let isConfigured = false;

  function initSupabase() {
    const config = window.PRIME_CONFIG;
    if (!config) return null;

    const url = config.SUPABASE_URL;
    const key = config.SUPABASE_ANON_KEY;

    // Check if real credentials are provided (not placeholders)
    if (url && key && !url.includes("your-project-ref") && !key.includes("your-anon-key")) {
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
      }
    } else {
      console.log("ℹ️ [Prime Scope] Running in Offline / Built-in Data mode (Supabase credentials not configured yet).");
      isConfigured = false;
    }

    return supabaseInstance;
  }

  // Global helper namespace
  window.PrimeSupabase = {
    getClient: function() {
      if (!supabaseInstance && !isConfigured) {
        initSupabase();
      }
      return supabaseInstance;
    },
    isReady: function() {
      return isConfigured && supabaseInstance !== null;
    }
  };

  // Initialize on script execution if library is already loaded
  initSupabase();
})(window);
