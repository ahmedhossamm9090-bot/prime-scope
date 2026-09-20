// Prime Scope - Data Access & Backend Integration Service (API Layer)
// ==============================================================================
// Features: Dynamic Supabase CRUD + Seamless Offline/Static Data Fallback
// ==============================================================================

(function(window) {
  const ApiService = {
    // 1. Fetch Categories
    getCategories: async function() {
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(3000);
      }
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
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(3000);
      }
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('materials')
            .select('*')
            .eq('is_active', true);

          if (!error && data && data.length > 0) {
            return data.map(m => {
              let imgs = [];
              if (Array.isArray(m.images)) {
                imgs = m.images;
              } else if (typeof m.images === 'string' && m.images.trim()) {
                try {
                  const parsed = JSON.parse(m.images);
                  if (Array.isArray(parsed)) imgs = parsed;
                  else if (typeof parsed === 'string' && parsed.startsWith('http')) imgs = [parsed];
                } catch (e) {
                  if (m.images.startsWith('http')) imgs = [m.images];
                }
              }

              return {
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
                images: imgs
              };
            });
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
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(3000);
      }
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
          // A. Generate UUID v4 for the new RFQ row
          const rfqId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });

          // Insert into rfqs table (WITHOUT .select() to avoid RLS 42501 permission error for guest visitors)
          const { error: rfqErr } = await client
            .from('rfqs')
            .insert([{
              id: rfqId,
              rfq_ref: rfqRef,
              customer_name: rfqData.customerName,
              customer_phone: rfqData.customerPhone,
              project_city: rfqData.projectCity,
              quantity: rfqData.quantity || null,
              application: rfqData.application || null,
              thickness: rfqData.thickness || null,
              waterjet: rfqData.waterjet || null,
              notes: rfqData.notes || null,
              selected_material_id: rfqData.selectedMaterialId || null,
              selected_material_name: rfqData.selectedMaterialName || null,
              status: 'received'
            }]);

          if (!rfqErr) {
            savedToDb = true;

            // B. Upload file to Private Storage bucket if present
            if (fileBlob && fileBlob.name) {
              const fileExt = fileBlob.name.split('.').pop() || 'dat';
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
                // Insert into rfq_files metadata table (WITHOUT .select())
                await client.from('rfq_files').insert([{
                  rfq_id: rfqId,
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
          // Attempt RPC tracking first (safe for guest visitors under RLS)
          const { data: rpcData, error: rpcErr } = await client.rpc('track_rfq_by_ref', { p_ref: rfqRef.trim() });
          if (!rpcErr && rpcData && rpcData.length > 0) {
            return {
              found: true,
              data: rpcData[0]
            };
          }

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
    },

    // 7. Admin: Upload Image to Storage (Products or Projects)
    uploadImage: async function(file, bucketName = 'projects') {
      const client = window.PrimeSupabase?.getClient();
      if (!window.PrimeSupabase?.isReady()) return { error: 'Supabase not ready' };
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await client.storage.from(bucketName).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        // Fallback to 'products' bucket if 'projects' doesn't exist
        if (bucketName === 'projects' && error.message.includes('bucket not found')) {
          console.warn("Bucket 'projects' not found. Falling back to 'products' bucket.");
          return this.uploadImage(file, 'products');
        }
        return { error };
      }
      
      const { data: { publicUrl } } = client.storage.from(bucketName).getPublicUrl(filePath);
      return { url: publicUrl, path: filePath };
    },

    // 8. Admin: Add New Project
    addProject: async function(projectData) {
      const client = window.PrimeSupabase?.getClient();
      if (!window.PrimeSupabase?.isReady()) return { error: 'Supabase not ready' };

      const { data, error } = await client.from('projects').insert([{
        title_ar: projectData.titleAr,
        title_en: projectData.titleEn || projectData.titleAr,
        category: projectData.category || 'general',
        location_ar: projectData.locationAr || '',
        scope_ar: projectData.description || '',
        hero_grad: projectData.imageUrl || '',
        is_active: true
      }]).select();

      return { data, error };
    },

    // 9. Admin: Update Project
    updateProject: async function(id, updates) {
      const client = window.PrimeSupabase?.getClient();
      if (!window.PrimeSupabase?.isReady()) return { error: 'Supabase not ready' };

      const { data, error } = await client.from('projects').update(updates).eq('id', id).select();
      return { data, error };
    },

    // 10. Admin: Delete Project
    deleteProject: async function(id) {
      const client = window.PrimeSupabase?.getClient();
      if (!window.PrimeSupabase?.isReady()) return { error: 'Supabase not ready' };

      const { error } = await client.from('projects').delete().eq('id', id);
      return { error };
    }
  };

  window.PrimeAPI = ApiService;
})(window);
