// Prime Scope - Data Access & Backend Integration Service (API Layer)
// ==============================================================================
// Features: Dynamic Supabase CRUD + Seamless Offline/Static Data Fallback
// ==============================================================================

const root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
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

    // 2. Fetch Materials (Stone Catalog with Inventory & Discounts)
    getMaterials: async function() {
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(3000);
      }

      function getEstimatedPrice(tier) {
        if (!tier) return 290;
        const t = String(tier).toLowerCase();
        if (t.includes('ultra')) return 850;
        if (t.includes('vip')) return 550;
        if (t.includes('مميز') || t.includes('premium')) return 380;
        if (t.includes('طلب') || t.includes('popular')) return 260;
        if (t.includes('اقتصادي') || t.includes('economic')) return 180;
        return 290;
      }

      function getOverrides() {
        try {
          const stored = localStorage.getItem('ps_materials_overrides');
          return stored ? JSON.parse(stored) : {};
        } catch(e) {
          return {};
        }
      }

      const overrides = getOverrides();

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

              const ov = overrides[m.id] || {};

              // Stock Status & Quantity
              let stockStatus = ov.stock_status || m.stock_status || 'available';
              let stockQuantity = ov.stock_quantity != null ? ov.stock_quantity : (m.stock_quantity != null ? m.stock_quantity : 100);
              stockQuantity = Math.max(0, parseInt(stockQuantity) || 0);

              // Auto-derive out of stock if quantity is 0
              if (stockStatus === 'available' && stockQuantity === 0) {
                stockStatus = 'out_of_stock';
              }

              // Pricing & Discounts
              const basePrice = ov.price != null ? parseFloat(ov.price) : (m.price != null ? parseFloat(m.price) : getEstimatedPrice(m.price_tier));
              const discountType = ov.discount_type || m.discount_type || 'none';
              const discountPercent = Math.min(100, Math.max(0, parseFloat(ov.discount_percent != null ? ov.discount_percent : (m.discount_percent || 0))));
              const hasDiscount = discountType === 'percentage' && discountPercent > 0;
              const discountedPrice = hasDiscount 
                ? Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100 
                : basePrice;

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
                textureGrad: m.texture_grad || (typeof getStoneGrad === 'function' ? getStoneGrad(m.category_id, m.color_hex) : ''),
                images: imgs,
                // Inventory & Discount System
                stockStatus: stockStatus,
                stockQuantity: stockQuantity,
                price: basePrice,
                discountType: discountType,
                discountPercent: discountPercent,
                discountedPrice: discountedPrice,
                hasDiscount: hasDiscount
              };
            });
          }
        } catch (err) {
          console.warn("⚠️ [API] Failed to fetch materials from Supabase, using fallback data:", err);
        }
      }

      // Fallback
      if (typeof PRODUCTS !== 'undefined') {
        return PRODUCTS.map(p => {
          const ov = overrides[p.id] || {};
          let stockStatus = ov.stock_status || p.stockStatus || 'available';
          let stockQuantity = ov.stock_quantity != null ? ov.stock_quantity : (p.stockQuantity != null ? p.stockQuantity : 100);
          stockQuantity = Math.max(0, parseInt(stockQuantity) || 0);

          if (stockStatus === 'available' && stockQuantity === 0) {
            stockStatus = 'out_of_stock';
          }

          const basePrice = ov.price != null ? parseFloat(ov.price) : (p.price != null ? parseFloat(p.price) : getEstimatedPrice(p.priceCategory));
          const discountType = ov.discount_type || p.discountType || 'none';
          const discountPercent = Math.min(100, Math.max(0, parseFloat(ov.discount_percent != null ? ov.discount_percent : (p.discountPercent || 0))));
          const hasDiscount = discountType === 'percentage' && discountPercent > 0;
          const discountedPrice = hasDiscount 
            ? Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100 
            : basePrice;

          return {
            ...p,
            stockStatus,
            stockQuantity,
            price: basePrice,
            discountType,
            discountPercent,
            discountedPrice,
            hasDiscount
          };
        });
      }
      return [];
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
    },

    // 11. Overrides Cache Helpers (Instant sync between Admin & Storefront)
    getMaterialOverrides: function() {
      try {
        const stored = localStorage.getItem('ps_materials_overrides');
        return stored ? JSON.parse(stored) : {};
      } catch(e) {
        return {};
      }
    },

    saveMaterialOverride: function(id, data) {
      try {
        const overrides = this.getMaterialOverrides();
        overrides[id] = Object.assign({}, overrides[id] || {}, data);
        localStorage.setItem('ps_materials_overrides', JSON.stringify(overrides));
        window.dispatchEvent(new CustomEvent('ps_inventory_updated', { detail: { id, data } }));
        return true;
      } catch(e) {
        console.warn("Could not save material override:", e);
        return false;
      }
    },

    // =========================================================================
    // MULTI-DIVISION ECOSYSTEM: FURNITURE & CURTAINS API
    // =========================================================================
    
    // Seed Data Fallbacks
    _getDivisionSeeds: function(division) {
      if (division === 'furniture') {
        return {
          categories: [
            { id: 'living-room', division: 'furniture', nameAr: 'صالونات وغرف معيشة فاخرة', nameEn: 'Living Rooms & Lounges', icon: '🛋️', sortOrder: 1 },
            { id: 'bedroom', division: 'furniture', nameAr: 'أجنحة نوم ملكية', nameEn: 'Master Bedroom Suites', icon: '🛏️', sortOrder: 2 },
            { id: 'dining', division: 'furniture', nameAr: 'طاولات طعام وكراسي فاخرة', nameEn: 'Bespoke Dining Suites', icon: '🍽️', sortOrder: 3 },
            { id: 'office', division: 'furniture', nameAr: 'مكاتب تنفيذية وخزائن مكتبية', nameEn: 'Executive Office Suites', icon: '💼', sortOrder: 4 },
            { id: 'custom', division: 'furniture', nameAr: 'قطع خاصة وتفصيل حسب المخطط', nameEn: 'Custom Architectural Joinery', icon: '📐', sortOrder: 5 }
          ],
          products: [
            {
              id: 'furn-sofa-verona',
              division: 'furniture',
              categoryId: 'living-room',
              nameAr: 'كنبة فيرونا المنحنية بقماش البوكليه الفاخر',
              nameEn: 'Verona Curved Architectural Bouclé Sofa',
              descriptionAr: 'كنبة معمارية منحنية مكسوة بقماش البوكليه العاجي الإيطالي عالي المتانة، مع هيكل داخلي من خشب الزان الصلب وقاعدة خفية بتشطيب نحاسي عتيق.',
              descriptionEn: 'Sculptural curved sofa upholstered in Italian ivory bouclé, framed with seasoned solid European beechwood and recessed aged brass architectural plinth.',
              price: 18500,
              priceTier: 'VIP Luxury',
              stockStatus: 'available',
              stockQuantity: 4,
              specs: {
                dimensions: '310W x 120D x 78H cm',
                wood: 'Solid European Beechwood',
                fabric: 'Italian Bouclé (100% Textured Wool Blend)',
                finish: 'Aged Brushed Brass Plinth',
                warranty: '10 Years Structural Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'furn-armchair-milano',
              division: 'furniture',
              categoryId: 'living-room',
              nameAr: 'كرسي ميلانو الدوار من الجلد الطبيعي المدبوغ',
              nameEn: 'Milano Swivel Accent Chair in Tuscan Saddle Leather',
              descriptionAr: 'كرسي استرخاء مفرد بتصميم عصري إيطالي، مصنوع من جلد توسكاني طبيعي نخب أول مع آلية دوران 360 درجة هادئة وهيكل من خشب الجوز الأمريكي.',
              descriptionEn: 'Contemporary Italian lounge chair crafted from top-grain Tuscan saddle leather with silent 360-degree swivel mechanism and solid American walnut framing.',
              price: 8900,
              priceTier: 'Ultra Luxury',
              stockStatus: 'available',
              stockQuantity: 6,
              specs: {
                dimensions: '88W x 92D x 82H cm',
                wood: 'American Walnut Base',
                fabric: 'Full-Grain Tuscan Saddle Leather',
                finish: 'Matte Oil Hand-Rubbed Finish',
                warranty: '10 Years Structural Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1580481077195-c228ff388dc8?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'furn-dining-roma',
              division: 'furniture',
              categoryId: 'dining',
              nameAr: 'طاولة طعام روما الملكية من خشب الجوز ورخام كالاكاتا',
              nameEn: 'Roma Royal Dining Table with Calacatta & Smoked Walnut',
              descriptionAr: 'طاولة طعام بطول 3.2 متر تتسع لـ 12 شخصاً، تجمع بين قمة رخام كالاكاتا الإيطالي الطبيعي مع أرجل هندسية مكسوة بخشب الجوز المدخن والنحاس المصقول.',
              descriptionEn: 'Commanding 3.2m 12-seater dining table pairing natural Italian Calacatta marble slab insert with sculptured smoked walnut pedestals and brushed bronze trims.',
              price: 28400,
              priceTier: 'Ultra Luxury',
              stockStatus: 'custom_made',
              stockQuantity: 2,
              specs: {
                dimensions: '320L x 115W x 76H cm',
                wood: 'Smoked French Walnut',
                fabric: 'Natural Calacatta Gold Marble Accent',
                finish: 'Hand-Polished Satin Bronze Inlays',
                warranty: '10 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'furn-bed-palermo',
              division: 'furniture',
              categoryId: 'bedroom',
              nameAr: 'سرير باليرمو المنجد الفاخر برأسية بانورامية ممتدة',
              nameEn: 'Palermo Panoramic Upholstered King Master Bed',
              descriptionAr: 'سرير ماستر ملكي كينغ بهيدبورد ممتد يدمج إضاءة LED دافئة خفية وكومودينات معلقة من خشب السنديان المشطوح والمخمل الرمادي الدافئ.',
              descriptionEn: 'Master king bed featuring wall-spanning acoustic upholstered wings with integrated warm ambient LED channels and floating rift-cut oak nightstands.',
              price: 24500,
              priceTier: 'VIP Luxury',
              stockStatus: 'available',
              stockQuantity: 3,
              specs: {
                dimensions: '340W (with wings) x 220L x 140H cm',
                wood: 'Rift-Cut European White Oak',
                fabric: 'Stain-Resistant Italian Linen-Velvet',
                finish: 'Integrated Dim-to-Warm LED Channels',
                warranty: '10 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'furn-credenza-venezia',
              division: 'furniture',
              categoryId: 'living-room',
              nameAr: 'كونسول فينيسيا الخشبي الحرفي بواجهة مخددة',
              nameEn: 'Venezia Fluted Artisan Credenza in Natural Oak',
              descriptionAr: 'كونسول وبوفيه معاصر بواجهة مضلعة مشغولة يدوياً من خشب البلوط الطبيعي وسطح رخامي داكن من النيرو ماركينا مع 4 أبواب دفع ونظام إغلاق هيدروليكي ناعم.',
              descriptionEn: 'Hand-fluted natural oak sideboard credenza adorned with polished Nero Marquina marble top, push-to-open flush doors and Blum soft-close hardware.',
              price: 13200,
              priceTier: 'Premium',
              stockStatus: 'available',
              stockQuantity: 5,
              specs: {
                dimensions: '220W x 50D x 82H cm',
                wood: 'Solid European White Oak & Nero Marquina Top',
                fabric: 'Interior Suede Drawer Linings',
                finish: 'UV Protective Natural Matte Coat',
                warranty: '5 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: false
            },
            {
              id: 'furn-desk-florence',
              division: 'furniture',
              categoryId: 'office',
              nameAr: 'مكتب فلورنسا التنفيذي الرئاسي المكسو بجلد السرج',
              nameEn: 'Florence Presidential Executive Desk in Smoked Oak',
              descriptionAr: 'مكتب تنفيذي فخم للقصور ومكاتب كبار الشخصيات، يجمع بين خشب البلوط المدخن وسطح جلدي مدمج بمسارات كهربائية وكابلات ذكية مخفية.',
              descriptionEn: 'Executive presidential desk engineered with smoked quartersawn oak, inlaid bridle leather blotter, and discreet concealed cable management ports.',
              price: 21900,
              priceTier: 'VIP Luxury',
              stockStatus: 'preorder',
              stockQuantity: 2,
              specs: {
                dimensions: '260W x 105D x 76H cm',
                wood: 'Smoked Quartersawn Oak',
                fabric: 'Hand-Stitched Italian Saddle Leather Inlay',
                finish: 'Gunmetal Titanium Hardware',
                warranty: '10 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            }
          ],
          projects: [
            {
              id: 'proj-furn-1',
              division: 'furniture',
              titleAr: 'تأثيث قصر خاص بحي حطين، الرياض',
              titleEn: 'Private Royal Palace Residence — Hittin, Riyadh',
              category: 'palace',
              categoryAr: 'قصور خاصة',
              categoryEn: 'Private Palaces',
              locationAr: 'حي حطين، شمال الرياض',
              locationEn: 'Hittin District, Riyadh',
              scopeAr: 'تصميم وتصنيع كامل الصالونات الرسمية، أجنحة النوم الرئيسية، وغرفة الطعام الكبرى وفق أدق المقاييس العالمية.',
              scopeEn: 'Custom tailoring and installation of all formal living salons, royal master bedroom suites, and grand dining ensemble.',
              heroImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
              tags: ['صالونات ملكية', 'خشب الجوز', 'أثاث مخصص']
            },
            {
              id: 'proj-furn-2',
              division: 'furniture',
              titleAr: 'تأثيث بنتهاوس برج المجدول التنفيذي',
              titleEn: 'Executive Penthouse — Majdoul Tower, Riyadh',
              category: 'penthouse',
              categoryAr: 'بنتهاوس فاخر',
              categoryEn: 'Luxury Penthouse',
              locationAr: 'طريق الملك فهد، الرياض',
              locationEn: 'King Fahd Road, Riyadh',
              scopeAr: 'أثاث معاصر بنمط Contemporary Editorial يجمع بين الجلد الإيطالي الفاخر والأخشاب الطبيعية الداكنة.',
              scopeEn: 'Bespoke contemporary editorial furnishing blending Italian saddle leathers and rich architectural smoked oak.',
              heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
              tags: ['بنتهاوس', 'طراز معاصر', 'جلد إيطالي']
            },
            {
              id: 'proj-furn-3',
              division: 'furniture',
              titleAr: 'فيلا مودرن ساحلية — أبحر، جدة',
              titleEn: 'Coastal Architectural Villa — Obhur, Jeddah',
              category: 'villa',
              categoryAr: 'فلل معمارية',
              categoryEn: 'Architectural Villas',
              locationAr: 'أبحر الشمالية، جدة',
              locationEn: 'North Obhur, Jeddah',
              scopeAr: 'تأثيث متكامل بأقمشة البوكليه العاجية وأخشاب السنديان الفاتحة المتناغمة مع الواجهات الزجاجية والبحر.',
              scopeEn: 'Turnkey interior furniture package utilizing ivory bouclés and bleached European white oak in harmony with ocean views.',
              heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
              tags: ['فيلا ساحلية', 'بوكليه', 'بلوط أبيض']
            }
          ]
        };
      } else {
        // Curtains Seeds
        return {
          categories: [
            { id: 'wave', division: 'curtains', nameAr: 'ستائر التموج الحديثة (S-Fold / Wave)', nameEn: 'Architectural Wave & S-Fold Drapery', icon: '〰️', sortOrder: 1 },
            { id: 'motorized', division: 'curtains', nameAr: 'ستائر الرول الذكية والمعتمة (Motorized)', nameEn: 'Smart Motorized Roller & Day Shades', icon: '⚡', sortOrder: 2 },
            { id: 'blackout', division: 'curtains', nameAr: 'ستائر البلاك آوت الفندقية 100%', nameEn: 'Hotel Grade 100% Acoustic Blackout', icon: '🌑', sortOrder: 3 },
            { id: 'sheer', division: 'curtains', nameAr: 'ستائر الشير والأورجانزا الفرنسية', nameEn: 'French Luminous Linen & Voile Sheers', icon: '☀️', sortOrder: 4 },
            { id: 'classic', division: 'curtains', nameAr: 'ستائر البيلتات والقصور الكلاسيكية', nameEn: 'Classical French Pleats & Palace Pelmets', icon: '👑', sortOrder: 5 }
          ],
          products: [
            {
              id: 'curt-wave-linen',
              division: 'curtains',
              categoryId: 'wave',
              nameAr: 'ستارة الكتان البلجيكي الطبيعي بنظام التموج السويسري',
              nameEn: 'Belgian Pure Linen S-Fold Architectural Drapery',
              descriptionAr: 'ستائر انسيابية متدفقة بنظام تموج منتظم ودقيق، مصنوعة من كتان بلجيكي طبيعي نقي 100% يسمح بمرور الضوء الطبيعي بنعومة مع الحفاظ على الخصوصية.',
              descriptionEn: 'Uniform floor-to-ceiling wave drapery hand-tailored from 100% natural Belgian pure linen, infusing spaces with soft filtered daylight.',
              price: 480,
              priceTier: 'Ultra Luxury',
              stockStatus: 'available',
              stockQuantity: 150,
              specs: {
                fabricOrigin: 'Belgium (100% Pure Stonewashed Linen)',
                weight: '380 GSM Heavy Drape',
                opacity: 'Semi-Sheer (Filter 60% of Direct Glare)',
                trackSystem: 'Concealed Silent Aluminum Wave Track',
                motorization: 'Compatible with Somfy Glydea & Tuya Smart Zigbee',
                warranty: '7 Years Track & Fabric Colorfastness Guarantee'
              },
              images: [
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'curt-smart-roller',
              division: 'curtains',
              categoryId: 'motorized',
              nameAr: 'نظام ستائر الرول الهندسية الذكية بمحركات Somfy الفرنسية',
              nameEn: 'Somfy Motorized Architectural Screen & Blackout Roller',
              descriptionAr: 'ستائر رول ذكية فائقة الهدوء بمحركات Somfy السلكية أو اللاسلكية، مزودة بأقمشة ألياف زجاجية عازلة للحرارة بنسبة 85% مع تحكم كامل بالصوت وتطبيقات المنازل الذكية.',
              descriptionEn: 'Whisper-quiet motorized roller shade system powered by French Somfy motors, engineered with thermal solar-screen fabrics blocking 85% heat gain.',
              price: 720,
              priceTier: 'VIP Luxury',
              stockStatus: 'available',
              stockQuantity: 80,
              specs: {
                fabricOrigin: 'France (Ferrari Soltis Fiberglass Screen)',
                motor: 'Somfy Sonesse 40 RTS Ultra-Quiet (<38dB)',
                smartHome: 'Control4, KNX, Lutron, Apple HomeKit & Tuya',
                thermalRating: 'Reflects up to 88% solar infrared heat',
                warranty: '5 Years Motor Replacement Guarantee'
              },
              images: [
                'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'curt-hotel-blackout',
              division: 'curtains',
              categoryId: 'blackout',
              nameAr: 'ستائر البلاك آوت الفندقية ثلاثية الطبقات العازلة للحرارة والصوت',
              nameEn: 'Triple-Weave 100% Hotel Blackout & Acoustic Drapery',
              descriptionAr: 'ستائر عتمة تامة بنسبة 100% بدون أي تسريب ضوء، مصممة بطبقة وسطية عازلة للصوت والحرارة مع ملمس حريري فاخر ومقاومة تامة للاشتعال بمعايير NFPA 701.',
              descriptionEn: '100% total room blackout drapery woven with dense acoustic interlining, delivering total privacy, thermal insulation, and NFPA 701 fire retardancy.',
              price: 540,
              priceTier: 'Premium',
              stockStatus: 'available',
              stockQuantity: 120,
              specs: {
                fabricOrigin: 'Germany (Trevira CS Flame Retardant)',
                blackoutRating: '100% True Blackout (0 Lux Penetration)',
                acousticDamping: 'NRC 0.65 Noise Absorption Index',
                trackSystem: 'Double Overlap Ceiling Track for Zero Center Gap',
                warranty: '10 Years Fabric Guarantee'
              },
              images: [
                'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'curt-velvet-royal',
              division: 'curtains',
              categoryId: 'classic',
              nameAr: 'ستائر المخمل الإيطالي الملكي العازل للصوت للمجالس والقصور',
              nameEn: 'Royal Italian Acoustic Velvet Drapery for Grand Salons',
              descriptionAr: 'أفخر أقمشة المخمل القطني المنسوج في فلورنسا بإيطاليا، بكثافة تدلي ملكية ووزن 600 جم/م² تمنح الصالونات والمجالس الدفء والفخامة المعمارية الاستثنائية.',
              descriptionEn: 'Sumptuous 600 GSM Italian cotton velvet loomed in Florence, imparting majestic draping weight, tactile warmth, and rich acoustic softness.',
              price: 880,
              priceTier: 'Ultra Luxury',
              stockStatus: 'available',
              stockQuantity: 45,
              specs: {
                fabricOrigin: 'Florence, Italy (100% Cotton Velvet)',
                weight: '620 GSM Heavyweight Velvet',
                pleatStyle: 'Tailored French Pinch Pleats / Box Pleats',
                lining: 'Pre-Shrunk Heavy Cotton Sateen Interlining',
                warranty: '10 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: true
            },
            {
              id: 'curt-silk-sheer',
              division: 'curtains',
              categoryId: 'sheer',
              nameAr: 'ستائر الشير الحريري الفرنسي الشفافة فائقة النعومة',
              nameEn: 'Luminous French Silk-Voile Day Drapery',
              descriptionAr: 'ستائر نهارية خفيفة وشفافة منسوجة من خيوط الحرير والكتان الدقيقة، تعكس أشعة الشمس وتمنح الفراغات المعمارية هالة ضوئية دافئة وتدفقاً ناعماً.',
              descriptionEn: 'Ethereal day sheer combining fine silk strands with combed linen, diffusing ambient sunlight into an airy, luminous architectural halo.',
              price: 360,
              priceTier: 'Premium',
              stockStatus: 'available',
              stockQuantity: 200,
              specs: {
                fabricOrigin: 'France (Silk & Linen Microfiber Blend)',
                weight: '140 GSM Featherlight Sheer',
                bottomFinish: 'Lead Weighted Continuous Bottom Band',
                washability: 'Gentle Machine Washable at 30°C',
                warranty: '5 Years Warranty'
              },
              images: [
                'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80'
              ],
              isFeatured: false
            }
          ],
          projects: [
            {
              id: 'proj-curt-1',
              division: 'curtains',
              titleAr: 'ستائر قصر الضيافة الدبلوماسي — حي السفارات، الرياض',
              titleEn: 'Diplomatic Reception Palace — Diplomatic Quarter, Riyadh',
              category: 'palace',
              categoryAr: 'قصور وسفارات',
              categoryEn: 'Palaces & Embassies',
              locationAr: 'حي السفارات، الرياض',
              locationEn: 'Diplomatic Quarter, Riyadh',
              scopeAr: 'تنفيذ ستائر التموج المزدوجة بارتفاع 7 أمتار مع نظام تحكم أوتوماتيكي KNX ومخمل إيطالي مذهب.',
              scopeEn: 'Custom 7-meter soaring double wave draperies integrated with KNX automation and gilded Italian velvet.',
              heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
              tags: ['حي السفارات', 'محركات ذكية', 'ارتفاع 7 متر']
            },
            {
              id: 'proj-curt-2',
              division: 'curtains',
              titleAr: 'ستائر فندق بوتيك فاخر — الكورنيش، الخبر',
              titleEn: 'Luxury Boutique Waterfront Hotel — Corniche, Al-Khobar',
              category: 'hotel',
              categoryAr: 'فنادق وأجنحة',
              categoryEn: 'Hotels & Suites',
              locationAr: 'كورنيش الخبر، المنطقة الشرقية',
              locationEn: 'Corniche, Al-Khobar',
              scopeAr: 'تجهيز 84 جناحاً فندقياً بستائر بلاك آوت عازلة للصوت والحرارة 100% مطابقة للمواصفات الفندقية العالمية.',
              scopeEn: 'Complete furnishing of 84 luxury guest suites with 100% acoustic blackout curtains meeting 5-star hotel codes.',
              heroImage: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
              tags: ['فندق 5 نجوم', 'بلاك آوت', 'عزل صوتي']
            },
            {
              id: 'proj-curt-3',
              division: 'curtains',
              titleAr: 'ستائر ذكية للأبراج التنفيذية — طريق الملك فهد',
              titleEn: 'Smart Executive Tower Suites — King Fahd Road, Riyadh',
              category: 'commercial',
              categoryAr: 'مكاتب وأبراج',
              categoryEn: 'Offices & Towers',
              locationAr: 'طريق الملك فهد، الرياض',
              locationEn: 'King Fahd Road, Riyadh',
              scopeAr: 'تركيب 320 ستارة رول ذكية متصلة بنظام إدارة المبنى (BMS) للتحكم الأوتوماتيكي في التوهج الشمسي وتوفير الطاقة.',
              scopeEn: 'Installation of 320 automated motorized solar screen roller blinds synchronized with the central BMS.',
              heroImage: 'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=1200&q=80',
              tags: ['أبراج ذكية', 'توفير طاقة', 'BMS']
            }
          ]
        };
      }
    },

    // 12. Fetch Division Categories (Furniture / Curtains)
    getDivisionCategories: async function(division) {
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(2000);
      }
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('catalog_categories')
            .select('*')
            .eq('division', division)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (!error && data && data.length > 0) {
            return data.map(c => ({
              id: c.id,
              division: c.division,
              nameAr: c.name_ar,
              nameEn: c.name_en,
              icon: c.icon || '✨',
              sortOrder: c.sort_order || 0
            }));
          }
        } catch(e) {
          console.warn(`⚠️ [API] Could not fetch ${division} categories from Supabase:`, e);
        }
      }

      // Check LocalStorage override
      try {
        const local = localStorage.getItem(`ps_${division}_categories`);
        if (local) return JSON.parse(local);
      } catch(e) {}

      // Default Seed
      return this._getDivisionSeeds(division).categories;
    },

    // 13. Fetch Division Products
    getDivisionProducts: async function(division, categoryId = 'all') {
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(2000);
      }
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          let query = client
            .from('catalog_items')
            .select('*')
            .eq('division', division)
            .eq('is_active', true);

          if (categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              division: p.division,
              categoryId: p.category_id,
              nameAr: p.name_ar,
              nameEn: p.name_en,
              descriptionAr: p.description_ar,
              descriptionEn: p.description_en,
              price: p.price,
              priceTier: p.price_tier || 'فاخر',
              stockStatus: p.stock_status || 'available',
              stockQuantity: p.stock_quantity != null ? p.stock_quantity : 10,
              specs: p.specs || {},
              images: Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? JSON.parse(p.images || '[]') : []),
              isFeatured: p.is_featured,
              tags: p.tags || []
            }));
          }
        } catch(e) {
          console.warn(`⚠️ [API] Could not fetch ${division} items from Supabase:`, e);
        }
      }

      // Check LocalStorage override
      try {
        const local = localStorage.getItem(`ps_${division}_products`);
        if (local) {
          const parsed = JSON.parse(local);
          return categoryId === 'all' ? parsed : parsed.filter(p => p.categoryId === categoryId);
        }
      } catch(e) {}

      // Default Seed
      const seeds = this._getDivisionSeeds(division).products;
      return categoryId === 'all' ? seeds : seeds.filter(p => p.categoryId === categoryId);
    },

    // 14. Get Single Product Details
    getDivisionProductById: async function(division, id) {
      const all = await this.getDivisionProducts(division, 'all');
      return all.find(p => p.id === id) || null;
    },

    // 15. Fetch Division Projects
    getDivisionProjects: async function(division, category = 'all') {
      if (window.PrimeSupabase?.waitForClient) {
        await window.PrimeSupabase.waitForClient(2000);
      }
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          let query = client
            .from('catalog_projects')
            .select('*')
            .eq('division', division)
            .eq('is_active', true);

          if (category !== 'all') {
            query = query.eq('category', category);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              division: p.division,
              titleAr: p.title_ar,
              titleEn: p.title_en,
              category: p.category,
              categoryAr: p.category_ar,
              categoryEn: p.category_en,
              locationAr: p.location_ar,
              locationEn: p.location_en,
              scopeAr: p.scope_ar,
              scopeEn: p.scope_en,
              heroImage: p.hero_image,
              images: Array.isArray(p.images) ? p.images : [],
              tags: p.tags || []
            }));
          }
        } catch(e) {
          console.warn(`⚠️ [API] Could not fetch ${division} projects from Supabase:`, e);
        }
      }

      // Check LocalStorage override
      try {
        const local = localStorage.getItem(`ps_${division}_projects`);
        if (local) {
          const parsed = JSON.parse(local);
          return category === 'all' ? parsed : parsed.filter(p => p.category === category);
        }
      } catch(e) {}

      const seeds = this._getDivisionSeeds(division).projects;
      return category === 'all' ? seeds : seeds.filter(p => p.category === category);
    },

    // 16. Submit Division Inquiry / Quote / Measurement Request
    submitDivisionInquiry: async function(division, data) {
      const ref = `PS-${division.toUpperCase().substring(0,4)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        inquiry_ref: ref,
        division: division,
        service_type: data.serviceType || 'quote',
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        project_city: data.projectCity || 'الرياض',
        details: data.details || '',
        selected_product_id: data.selectedProductId || null,
        selected_product_name: data.selectedProductName || null,
        status: 'received'
      };

      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('division_inquiries').insert([payload]);
        } catch(e) {
          console.warn("⚠️ Could not persist inquiry to Supabase:", e);
        }
      }

      // Always save to localStorage inquiries for admin instant view
      try {
        const stored = JSON.parse(localStorage.getItem(`ps_${division}_inquiries`) || '[]');
        stored.unshift({ ...payload, created_at: new Date().toISOString() });
        localStorage.setItem(`ps_${division}_inquiries`, JSON.stringify(stored));
      } catch(e) {}

      return { success: true, inquiryRef: ref };
    },

    // 17. Admin: Get Division Inquiries
    getDivisionInquiries: async function(division) {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          const { data, error } = await client
            .from('division_inquiries')
            .select('*')
            .eq('division', division)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data;
          }
        } catch(e) {}
      }

      // Local storage fallback
      try {
        const stored = JSON.parse(localStorage.getItem(`ps_${division}_inquiries`) || '[]');
        return stored;
      } catch(e) {
        return [];
      }
    },

    // 18. Admin: Save / Update Product
    saveDivisionProduct: async function(division, product) {
      const isNew = !product.id;
      const id = product.id || `ps-${division}-${Date.now()}`;
      const payload = {
        id: id,
        division: division,
        category_id: product.categoryId || product.category,
        name_ar: product.nameAr,
        name_en: product.nameEn || product.nameAr,
        description_ar: product.descriptionAr || '',
        description_en: product.descriptionEn || '',
        price: product.price ? parseFloat(product.price) : null,
        price_tier: product.priceTier || 'فاخر',
        stock_status: product.stockStatus || 'available',
        stock_quantity: parseInt(product.stockQuantity) || 10,
        specs: product.specs || {},
        images: Array.isArray(product.images) ? product.images : [product.images || ''],
        is_featured: product.isFeatured !== undefined ? product.isFeatured : true,
        is_active: true
      };

      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('catalog_items').upsert([payload]);
        } catch(e) {
          console.warn("Could not save product to Supabase:", e);
        }
      }

      // Sync LocalStorage
      try {
        let items = await this.getDivisionProducts(division, 'all');
        const idx = items.findIndex(i => i.id === id);
        const mapped = {
          id: payload.id,
          division: payload.division,
          categoryId: payload.category_id,
          nameAr: payload.name_ar,
          nameEn: payload.name_en,
          descriptionAr: payload.description_ar,
          descriptionEn: payload.description_en,
          price: payload.price,
          priceTier: payload.price_tier,
          stockStatus: payload.stock_status,
          stockQuantity: payload.stock_quantity,
          specs: payload.specs,
          images: payload.images,
          isFeatured: payload.is_featured
        };
        if (idx >= 0) items[idx] = mapped;
        else items.unshift(mapped);
        localStorage.setItem(`ps_${division}_products`, JSON.stringify(items));
      } catch(e) {}

      return { success: true, id };
    },

    // 19. Admin: Delete Product
    deleteDivisionProduct: async function(division, id) {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('catalog_items').delete().eq('id', id);
        } catch(e) {}
      }

      try {
        let items = await this.getDivisionProducts(division, 'all');
        items = items.filter(i => i.id !== id);
        localStorage.setItem(`ps_${division}_products`, JSON.stringify(items));
      } catch(e) {}

      return { success: true };
    },

    // 20. Admin: Save / Update Project
    saveDivisionProject: async function(division, project) {
      const id = project.id || `proj-${division}-${Date.now()}`;
      const payload = {
        id: id,
        division: division,
        title_ar: project.titleAr,
        title_en: project.titleEn || project.titleAr,
        category: project.category || 'luxury',
        category_ar: project.categoryAr || 'مشاريع فاخرة',
        category_en: project.categoryEn || 'Luxury Projects',
        location_ar: project.locationAr || '',
        location_en: project.locationEn || '',
        scope_ar: project.scopeAr || '',
        scope_en: project.scopeEn || '',
        hero_image: project.heroImage || '',
        images: project.images || [],
        tags: project.tags || [],
        is_featured: true,
        is_active: true
      };

      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('catalog_projects').upsert([payload]);
        } catch(e) {}
      }

      try {
        let projects = await this.getDivisionProjects(division, 'all');
        const idx = projects.findIndex(p => p.id === id);
        const mapped = {
          id: payload.id,
          division: payload.division,
          titleAr: payload.title_ar,
          titleEn: payload.title_en,
          category: payload.category,
          categoryAr: payload.category_ar,
          categoryEn: payload.category_en,
          locationAr: payload.location_ar,
          locationEn: payload.location_en,
          scopeAr: payload.scope_ar,
          scopeEn: payload.scope_en,
          heroImage: payload.hero_image,
          images: payload.images,
          tags: payload.tags
        };
        if (idx >= 0) projects[idx] = mapped;
        else projects.unshift(mapped);
        localStorage.setItem(`ps_${division}_projects`, JSON.stringify(projects));
      } catch(e) {}

      return { success: true, id };
    },

    // 21. Admin: Delete Project
    deleteDivisionProject: async function(division, id) {
      const client = window.PrimeSupabase?.getClient();
      if (window.PrimeSupabase?.isReady()) {
        try {
          await client.from('catalog_projects').delete().eq('id', id);
        } catch(e) {}
      }

      try {
        let projects = await this.getDivisionProjects(division, 'all');
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem(`ps_${division}_projects`, JSON.stringify(projects));
      } catch(e) {}

      return { success: true };
    }
  };

  window.PrimeAPI = ApiService;
})(root);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = root.PrimeAPI;
}
