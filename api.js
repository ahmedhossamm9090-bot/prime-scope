// Prime Scope - API Service
// Supabase Data Access Layer

(function (window) {
  "use strict";

  const ApiService = {

    // =========================
    // Categories
    // =========================
    async getCategories() {
      const client = window.PrimeSupabase?.getClient();

      if (!client || !window.PrimeSupabase?.isReady()) {
        return typeof CATEGORIES !== "undefined" ? CATEGORIES : [];
      }

      try {
        const { data, error } = await client
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        return (data || []).map(c => ({
          id: c.id,
          nameAr: c.name_ar || "",
          nameEn: c.name_en || "",
          icon: c.icon || "💎",
          badge: c.badge || ""
        }));

      } catch (error) {
        console.error("Categories error:", error);

        return typeof CATEGORIES !== "undefined"
          ? CATEGORIES
          : [];
      }
    },


    // =========================
    // Materials
    // =========================
    async getMaterials() {
      const client = window.PrimeSupabase?.getClient();

      if (!client || !window.PrimeSupabase?.isReady()) {
        return typeof PRODUCTS !== "undefined"
          ? PRODUCTS
          : [];
      }

      try {

        const { data, error } = await client
          .from("materials")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        console.log("SUPABASE MATERIALS:", data);
        console.log("SUPABASE MATERIALS COUNT:", data?.length || 0);

        return (data || []).map(m => {

          // images ممكن تكون Array أو JSON String
          let images = [];

          if (Array.isArray(m.images)) {
            images = m.images;
          } else if (typeof m.images === "string") {
            try {
              const parsed = JSON.parse(m.images);
              images = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn("Invalid images JSON:", m.images);
              images = [];
            }
          }

          return {
            id: m.id,

            nameAr: m.name_ar || "",
            nameEn: m.name_en || "",

            category: m.category_id || "",

            // FIXED
            color: m.color || m.color_desc || "",

            origin: m.origin || "",

            typeAr: m.type_ar || "",
            typeEn: m.type_en || "",

            finish: m.finish || "",

            usage: m.usage_ar || "",
            usageEn: m.usage_en || "",

            priceCategory: m.price_tier || "",

            colorCode: m.color_hex || "#ffffff",

            stoneType: m.stone_type || "",
            colorGroup: m.color_group || "",

            density: m.density,
            waterAbsorption: m.water_absorption,
            compressiveStrength: m.compressive_strength,

            durabilityScore:
              m.durability_score != null
                ? parseFloat(m.durability_score)
                : 4.5,

            maintenanceTier: m.maintenance_tier || "",

            textureGrad:
              m.texture_grad ||
              (
                typeof getStoneGrad === "function"
                  ? getStoneGrad(m.category_id, m.color_hex)
                  : "linear-gradient(135deg,#333,#777)"
              ),

            // IMPORTANT
            images: images
          };
        });

      } catch (error) {

        console.error("MATERIALS ERROR:", error);

        return typeof PRODUCTS !== "undefined"
          ? PRODUCTS
          : [];
      }
    },


    // =========================
    // Projects
    // =========================
    async getProjects(category = "all") {

      const client = window.PrimeSupabase?.getClient();

      if (!client || !window.PrimeSupabase?.isReady()) {

        if (typeof PRIME_PROJECTS === "undefined") {
          return [];
        }

        return category === "all"
          ? PRIME_PROJECTS
          : PRIME_PROJECTS.filter(
              p => p.category === category
            );
      }

      try {

        let query = client
          .from("projects")
          .select("*")
          .eq("is_active", true);

        if (category !== "all") {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map(p => ({
          id: p.id,

          titleAr: p.title_ar || "",
          titleEn: p.title_en || "",

          category: p.category || "",

          categoryAr: p.category_ar || "",
          categoryEn: p.category_en || "",

          locationAr: p.location_ar || "",
          locationEn: p.location_en || "",

          area: p.area || "",

          scopeAr: p.scope_ar || "",
          scopeEn: p.scope_en || "",

          stonesUsed: p.stones_used || [],

          heroGrad: p.hero_grad || "",

          tags: p.tags || []
        }));

      } catch (error) {

        console.error("PROJECTS ERROR:", error);

        if (typeof PRIME_PROJECTS === "undefined") {
          return [];
        }

        return category === "all"
          ? PRIME_PROJECTS
          : PRIME_PROJECTS.filter(
              p => p.category === category
            );
      }
    },


    // =========================
    // RFQ
    // =========================
    async submitRFQ(rfqData, fileBlob = null) {

      const client = window.PrimeSupabase?.getClient();

      const rfqRef =
        rfqData.rfqRef ||
        `PS-RFQ-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      let savedToDb = false;
      let fileUploaded = false;

      if (client && window.PrimeSupabase?.isReady()) {

        try {

          const { data: rfqRow, error: rfqErr } =
            await client
              .from("rfqs")
              .insert([{
                rfq_ref: rfqRef,

                customer_name: rfqData.customerName,
                customer_phone: rfqData.customerPhone,

                project_city: rfqData.projectCity,

                quantity: rfqData.quantity,

                application: rfqData.application,

                thickness: rfqData.thickness,

                waterjet: rfqData.waterjet,

                notes: rfqData.notes,

                selected_material_id:
                  rfqData.selectedMaterialId || null,

                selected_material_name:
                  rfqData.selectedMaterialName || null,

                status: "received"
              }])
              .select()
              .single();

          if (rfqErr) throw rfqErr;

          if (rfqRow) {
            savedToDb = true;
          }

        } catch (error) {
          console.error("RFQ ERROR:", error);
        }
      }

      return {
        success: true,
        rfqRef,
        savedToDb,
        fileUploaded
      };
    },


    // =========================
    // Track RFQ
    // =========================
    async trackRFQ(rfqRef) {

      const client = window.PrimeSupabase?.getClient();

      if (client && window.PrimeSupabase?.isReady()) {

        try {

          const { data, error } = await client
            .from("rfqs")
            .select(
              "rfq_ref,status,created_at,customer_name,project_city,selected_material_name"
            )
            .eq("rfq_ref", rfqRef.trim())
            .single();

          if (!error && data) {
            return {
              found: true,
              data
            };
          }

        } catch (error) {
          console.error("TRACK RFQ ERROR:", error);
        }
      }

      return {
        found: false,
        data: null
      };
    },


    // =========================
    // AI Logs
    // =========================
    async logAIRequest(logData) {

      const client = window.PrimeSupabase?.getClient();

      if (!client || !window.PrimeSupabase?.isReady()) {
        return;
      }

      try {

        await client
          .from("ai_requests")
          .insert([{
            query: logData.query,
            response: logData.response,
            project_type: logData.projectType,
            surface_area: logData.surfaceArea,
            budget_tier: logData.budgetTier,
            style_pref: logData.stylePref
          }]);

      } catch (error) {
        console.warn("AI LOG ERROR:", error);
      }
    }

  };

  window.PrimeAPI = ApiService;

})(window);
