// ============================================================
// PRIME SCOPE - API SERVICE
// Supabase Data Access Layer
// ============================================================

(function (window) {
  "use strict";

  const ApiService = {

    // ==========================================================
    // CATEGORIES
    // ==========================================================

    async getCategories() {

      const client = window.PrimeSupabase?.getClient();

      if (!client || !window.PrimeSupabase?.isReady()) {
        return typeof CATEGORIES !== "undefined"
          ? CATEGORIES
          : [];
      }

      try {

        const { data, error } = await client
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true
          });

        if (error) {
          throw error;
        }

        return (data || []).map(function (c) {

          return {
            id: c.id,
            nameAr: c.name_ar || "",
            nameEn: c.name_en || "",
            icon: c.icon || "💎",
            badge: c.badge || ""
          };

        });

      } catch (error) {

        console.error(
          "CATEGORIES ERROR:",
          error
        );

        return typeof CATEGORIES !== "undefined"
          ? CATEGORIES
          : [];
      }
    },


    // ==========================================================
    // MATERIALS
    // ==========================================================

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

        if (error) {
          throw error;
        }

        console.log(
          "SUPABASE MATERIALS:",
          data
        );

        return (data || []).map(function (m) {

          return {

            // Basic
            id: m.id,

            nameAr: m.name_ar || "",

            nameEn: m.name_en || "",


            // Category
            category: m.category_id || "",


            // Color
            color: m.color || m.color_desc || "",

            colorCode:
              m.color_hex || "#ffffff",

            colorGroup:
              m.color_group || "",


            // Origin
            origin: m.origin || "",


            // Type
            typeAr: m.type_ar || "",

            typeEn: m.type_en || "",

            stoneType:
              m.stone_type || "",


            // Finish
            finish:
              m.finish || "",


            // Usage
            usageAr:
              m.usage_ar || "",

            usage:
              m.usage_ar || "",

            usageEn:
              m.usage_en || "",


            // Price
            priceCategory:
              m.price_tier || "",


            // Technical data
            density:
              m.density,

            waterAbsorption:
              m.water_absorption,

            compressiveStrength:
              m.compressive_strength,

            durabilityScore:
              m.durability_score != null
                ? parseFloat(
                    m.durability_score
                  )
                : 4.5,

            maintenanceTier:
              m.maintenance_tier || "",

            textureGrad:
              m.texture_grad ||
              (
                typeof getStoneGrad === "function"
                  ? getStoneGrad(
                      m.category_id,
                      m.color_hex
                    )
                  : "linear-gradient(135deg,#333,#777)"
              ),


            // ==================================================
            // IMAGES
            // ==================================================

            // مهم جدًا:
            // images في Supabase لازم تفضل Array

            images:
              Array.isArray(m.images)
                ? m.images
                : [],


            // Status
            isFeatured:
              m.is_featured === true,

            isActive:
              m.is_active !== false

          };

        });

      } catch (error) {

        console.error(
          "MATERIALS ERROR:",
          error
        );

        // Fallback
        return typeof PRODUCTS !== "undefined"
          ? PRODUCTS
          : [];
      }
    },


    // ==========================================================
    // PROJECTS
    // ==========================================================

    async getProjects(category = "all") {

      const client =
        window.PrimeSupabase?.getClient();

      if (
        !client ||
        !window.PrimeSupabase?.isReady()
      ) {

        if (
          typeof PRIME_PROJECTS ===
          "undefined"
        ) {
          return [];
        }

        return category === "all"
          ? PRIME_PROJECTS
          : PRIME_PROJECTS.filter(
              function (p) {
                return p.category === category;
              }
            );
      }

      try {

        let query = client
          .from("projects")
          .select("*")
          .eq("is_active", true);

        if (category !== "all") {

          query = query.eq(
            "category",
            category
          );
        }

        const {
          data,
          error
        } = await query;

        if (error) {
          throw error;
        }

        return (data || []).map(
          function (p) {

            return {

              id: p.id,

              titleAr:
                p.title_ar || "",

              titleEn:
                p.title_en || "",

              category:
                p.category || "",

              categoryAr:
                p.category_ar || "",

              categoryEn:
                p.category_en || "",

              locationAr:
                p.location_ar || "",

              locationEn:
                p.location_en || "",

              area:
                p.area || "",

              scopeAr:
                p.scope_ar || "",

              scopeEn:
                p.scope_en || "",

              stonesUsed:
                Array.isArray(
                  p.stones_used
                )
                  ? p.stones_used
                  : [],

              heroGrad:
                p.hero_grad || "",

              tags:
                Array.isArray(p.tags)
                  ? p.tags
                  : []

            };

          }
        );

      } catch (error) {

        console.error(
          "PROJECTS ERROR:",
          error
        );

        if (
          typeof PRIME_PROJECTS ===
          "undefined"
        ) {
          return [];
        }

        return category === "all"
          ? PRIME_PROJECTS
          : PRIME_PROJECTS.filter(
              function (p) {
                return p.category === category;
              }
            );
      }
    },


    // ==========================================================
    // RFQ
    // ==========================================================

    async submitRFQ(
      rfqData,
      fileBlob = null
    ) {

      const client =
        window.PrimeSupabase?.getClient();

      const rfqRef =
        rfqData.rfqRef ||
        `PS-RFQ-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      let savedToDb = false;
      let fileUploaded = false;

      if (
        client &&
        window.PrimeSupabase?.isReady()
      ) {

        try {

          const {
            data: rfqRow,
            error: rfqErr
          } = await client
            .from("rfqs")
            .insert([
              {

                rfq_ref: rfqRef,

                customer_name:
                  rfqData.customerName,

                customer_phone:
                  rfqData.customerPhone,

                project_city:
                  rfqData.projectCity,

                quantity:
                  rfqData.quantity,

                application:
                  rfqData.application,

                thickness:
                  rfqData.thickness,

                waterjet:
                  rfqData.waterjet,

                notes:
                  rfqData.notes,

                selected_material_id:
                  rfqData.selectedMaterialId ||
                  null,

                selected_material_name:
                  rfqData.selectedMaterialName ||
                  null,

                status:
                  "received"

              }
            ])
            .select()
            .single();

          if (rfqErr) {
            throw rfqErr;
          }

          if (rfqRow) {
            savedToDb = true;
          }


          // ====================================================
          // OPTIONAL FILE UPLOAD
          // ====================================================

          if (
            fileBlob &&
            fileBlob.name
          ) {

            const fileExt =
              fileBlob.name
                .split(".")
                .pop();

            const sanitizedName =
              fileBlob.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
              );

            const storagePath =
              `rfqs/${rfqRef}/${Date.now()}_${sanitizedName}`;

            const {
              data: uploadData,
              error: uploadErr
            } = await client.storage
              .from("rfq-files")
              .upload(
                storagePath,
                fileBlob,
                {
                  cacheControl: "3600",
                  upsert: false
                }
              );

            if (
              !uploadErr &&
              uploadData
            ) {

              fileUploaded = true;

              await client
                .from("rfq_files")
                .insert([
                  {

                    rfq_id:
                      rfqRow.id,

                    file_name:
                      fileBlob.name,

                    file_size:
                      fileBlob.size,

                    file_type:
                      fileBlob.type ||
                      fileExt,

                    storage_path:
                      storagePath

                  }
                ]);
            }
          }

        } catch (error) {

          console.error(
            "RFQ ERROR:",
            error
          );
        }
      }

      return {

        success: true,

        rfqRef:

          rfqRef,

        savedToDb:

          savedToDb,

        fileUploaded:

          fileUploaded

      };
    },


    // ==========================================================
    // TRACK RFQ
    // ==========================================================

    async trackRFQ(
      rfqRef
    ) {

      const client =
        window.PrimeSupabase?.getClient();

      if (
        client &&
        window.PrimeSupabase?.isReady()
      ) {

        try {

          const {
            data,
            error
          } = await client

            .from("rfqs")

            .select(
              "rfq_ref,status,created_at,customer_name,project_city,selected_material_name"
            )

            .eq(
              "rfq_ref",
              rfqRef.trim()
            )

            .single();

          if (
            !error &&
            data
          ) {

            return {

              found: true,

              data: data

            };
          }

        } catch (error) {

          console.error(
            "TRACK RFQ ERROR:",
            error
          );
        }
      }

      return {

        found: false,

        data: null

      };
    },


    // ==========================================================
    // AI REQUEST LOG
    // ==========================================================

    async logAIRequest(
      logData
    ) {

      const client =
        window.PrimeSupabase?.getClient();

      if (
        !client ||
        !window.PrimeSupabase?.isReady()
      ) {
        return;
      }

      try {

        await client
          .from("ai_requests")
          .insert([
            {

              query:
                logData.query,

              response:
                logData.response,

              project_type:
                logData.projectType,

              surface_area:
                logData.surfaceArea,

              budget_tier:
                logData.budgetTier,

              style_pref:
                logData.stylePref

            }
          ]);

      } catch (error) {

        console.warn(
          "AI LOG ERROR:",
          error
        );
      }
    }

  };


  // ============================================================
  // EXPORT
  // ============================================================

  window.PrimeAPI =
    ApiService;

})(window);
