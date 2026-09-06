// Prime Scope - Data Access & Backend Integration Service (API Layer)
// ==============================================================================
// Features: Dynamic Supabase CRUD + Seamless Offline/Static Data Fallback
// ==============================================================================

(function(window) {
  const ApiService = {
    // 1. Fetch Categories
    getCategories: async function() {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (!error && data && data.length > 0) {
            return data.map(c => ({
              id: c.id,
              nameAr: c.name_ar,
              nameEn: c.name_en,
              icon: c.icon || '💎',
              badge: c.badge || ''
            }));
          }
        } catch (err) {
          console.warn("⚠️ [API] Failed to fetch categories from Supabase, using fallback data:", err);
        }
      }
      // Fallback
      return typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
    },

    // 2. Fetch Materials (Stone Catalog)
    getMaterials: async function() {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('materials')
            .select('*')
            .eq('is_active', true);

          if (!error && data && data.length > 0) {
            return data.map(m => ({
              id: m.id,
              nameAr: m.name_ar,
              nameEn: m.name_en,
              category: m.category_id,
              color: m.color_desc,
              origin: m.origin,
              typeAr: m.type_ar,
              typeEn: m.type_en,
              finish: m.finish,
              usage: m.usage_ar,
              usageEn: m.usage_en,
              priceCategory: m.price_tier,
              colorCode: m.color_hex || '#ffffff',
              stoneType: m.stone_type,
              colorGroup: m.color_group,
              density: m.density,
              waterAbsorption: m.water_absorption,
              compressiveStrength: m.compressive_strength,
              durabilityScore: parseFloat(m.durability_score) || 4.5,
              maintenanceTier: m.maintenance_tier,
              textureGrad: m.texture_grad || getStoneGrad(m.category_id, m.color_hex),
              images: m.images || []
            }));
          }
        } catch (err) {
          console.warn("⚠️ [API] Failed to fetch materials from Supabase, using fallback data:", err);
        }
      }
      // Fallback
      return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
    },

    // 3. Fetch Showcase Projects
    getProjects: async function(category = 'all') {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          let query = client.from('projects').select('*').eq('is_active', true);
          if (category !== 'all') {
            query = query.eq('category', category);
          }

          const { data, error } = await query;

          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              titleAr: p.title_ar,
              titleEn: p.title_en,
              category: p.category,
              categoryAr: p.category_ar,
              categoryEn: p.category_en,
              locationAr: p.location_ar,
              locationEn: p.location_en,
              area: p.area,
              scopeAr: p.scope_ar,
              scopeEn: p.scope_en,
              stonesUsed: p.stones_used || [],
              heroGrad: p.hero_grad,
              tags: p.tags || []
            }));
          }
        } catch (err) {
          console.warn("⚠️ [API] Failed to fetch projects from Supabase, using fallback data:", err);
        }
      }
      // Fallback
      if (typeof PRIME_PROJECTS !== 'undefined') {
        return category === 'all' 
          ? PRIME_PROJECTS 
          : PRIME_PROJECTS.filter(p => p.category === category);
      }
      return [];
    },

    // 4. Submit RFQ & Upload Private BOQ/Blueprint File
    submitRFQ: async function(rfqData, fileBlob = null) {
      const client = window.PrimeSupabase?.getClient();
      const rfqRef = rfqData.rfqRef || `PS-RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      let savedToDb = false;
      let fileUploaded = false;

      if (window.PrimeSupabase?.isReady()) {
        try {
          // A. Insert into rfqs table
          const { data: rfqRow, error: rfqErr } = await client
            .from('rfqs')
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
              selected_material_id: rfqData.selectedMaterialId || null,
              selected_material_name: rfqData.selectedMaterialName || null,
              status: 'received'
            }])
            .select()
            .single();

          if (!rfqErr && rfqRow) {
            savedToDb = true;

            // B. Upload file to Private Storage bucket if present
            if (fileBlob && fileBlob.name) {
              const fileExt = fileBlob.name.split('.').pop();
              const sanitizedName = fileBlob.name.replace(/[^a-zA-Z0-9._-]/g, '_');
              const storagePath = `rfqs/${rfqRef}/${Date.now()}_${sanitizedName}`;

              const { data: uploadData, error: uploadErr } = await client.storage
                .from('rfq-files')
                .upload(storagePath, fileBlob, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadErr && uploadData) {
                fileUploaded = true;
                // Insert into rfq_files metadata table
                await client.from('rfq_files').insert([{
                  rfq_id: rfqRow.id,
                  file_name: fileBlob.name,
                  file_size: fileBlob.size,
                  file_type: fileBlob.type || fileExt,
                  storage_path: storagePath
                }]);
              } else {
                console.warn("⚠️ [API] Failed to upload private attachment:", uploadErr);
              }
            }
          } else {
            console.warn("⚠️ [API] Could not persist RFQ to Supabase:", rfqErr);
          }
        } catch (err) {
          console.warn("⚠️ [API] Error submitting RFQ to Supabase:", err);
        }
      }

      return {
        success: true,
        rfqRef: rfqRef,
        savedToDb: savedToDb,
        fileUploaded: fileUploaded
      };
    },

    // 5. Track RFQ Status by Reference Code
    trackRFQ: async function(rfqRef) {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('rfqs')
            .select('rfq_ref, status, created_at, customer_name, project_city, selected_material_name')
            .eq('rfq_ref', rfqRef.trim())
            .single();

          if (!error && data) {
            return {
              found: true,
              data: data
            };
          }
        } catch (err) {
          console.warn("⚠️ [API] Error tracking RFQ in Supabase:", err);
        }
      }

      // Simulated lookup if offline
      return {
        found: true,
        data: {
          rfq_ref: rfqRef,
          status: 'reviewing',
          created_at: new Date().toISOString()
        }
      };
    },

    // 6. Log AI Advisor Queries
    logAIRequest: async function(logData) {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('ai_requests').insert([{
            query: logData.query,
            response: logData.response,
            project_type: logData.projectType,
            surface_area: logData.surfaceArea,
            budget_tier: logData.budgetTier,
            style_pref: logData.stylePref
          }]);
        } catch (err) {
          // Non-blocking telemetry
        }
      }
    }
  };

  window.PrimeAPI = ApiService;
})(window);
