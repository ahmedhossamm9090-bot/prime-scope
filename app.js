/* =========================================================
   PRIME SCOPE
   Architectural Enterprise Application Controller
   Version 2.1 - Full Stack
   ========================================================= */

'use strict';

/* =========================================================
   1. GLOBAL APPLICATION STATE
   ========================================================= */

let currentLang = 'ar';

let activeCategory = 'all';
let filterType = 'all';
let filterColor = 'all';
let filterPrice = 'all';
let searchQuery = '';

let visibleCount = 12;
const PAGE_SIZE = 12;

/* Cached / Dynamic Data */
let appCategories =
  typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)
    ? CATEGORIES
    : [];

let appMaterials =
  typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)
    ? PRODUCTS
    : [];

let appProjects =
  typeof PRIME_PROJECTS !== 'undefined' && Array.isArray(PRIME_PROJECTS)
    ? PRIME_PROJECTS
    : [];

/* Comparison */
let comparisonList = [];

/* Selected RFQ Material */
let selectedProductForQuote = null;

/* BOQ File */
let attachedBOQFile = null;

/* AI Wizard */
let currentWizardStep = 1;

let aiWizardData = {
  projectType: 'villa',
  surfaceArea: 'flooring',
  budgetTier: 'premium',
  stylePref: 'modern'
};

/* Multi Zone Calculator */
let calcZones = [
  {
    id: 1,
    name: 'الصالة الرئيسية والمجالس',
    length: 12,
    width: 8,
    pieces: 1,
    wastage: 0.10
  }
];

/* =========================================================
   2. APPLICATION INITIALIZATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    setupLanguage();
    renderCategories();
    renderFilterOptions();
    renderProducts();
    renderProjects('all');
    setupEventListeners();
    renderMultiZoneCalculator();
    renderComparisonDock();

    await loadDynamicData();

    setupModalEvents();
    setupKeyboardEvents();

  } catch (error) {
    console.error('[Prime Scope] Initialization error:', error);
  }
});


/* =========================================================
   3. SUPABASE / DYNAMIC DATA
   ========================================================= */

async function loadDynamicData() {

  if (typeof window.PrimeAPI === 'undefined') {
    console.log(
      'ℹ️ [Prime Scope] PrimeAPI not detected. Using local dataset.'
    );
    return;
  }

  try {

    const results = await Promise.allSettled([
      window.PrimeAPI.getCategories(),
      window.PrimeAPI.getMaterials(),
      window.PrimeAPI.getProjects()
    ]);

    const [cats, mats, projs] = results;

    if (
      cats.status === 'fulfilled' &&
      Array.isArray(cats.value) &&
      cats.value.length > 0
    ) {
      appCategories = cats.value;
    }

    if (
      mats.status === 'fulfilled' &&
      Array.isArray(mats.value) &&
      mats.value.length > 0
    ) {
      appMaterials = mats.value;
    }

    if (
      projs.status === 'fulfilled' &&
      Array.isArray(projs.value) &&
      projs.value.length > 0
    ) {
      appProjects = projs.value;
    }

    renderCategories();
    renderFilterOptions();
    renderProducts();
    renderProjects('all');

    console.log('✅ [Prime Scope] Dynamic data synchronized.');

  } catch (error) {

    console.warn(
      'ℹ️ [Prime Scope] Using cached local database dataset.',
      error
    );

  }
}


/* =========================================================
   4. LANGUAGE SYSTEM
   ========================================================= */

function setupLanguage() {

  if (
    typeof TRANSLATIONS === 'undefined' ||
    !TRANSLATIONS[currentLang]
  ) {
    console.warn('[Prime Scope] TRANSLATIONS not found.');
    return;
  }

  const t = TRANSLATIONS[currentLang];

  document.body.className =
    `lang-${currentLang}`;

  document.documentElement.lang =
    currentLang;

  document.documentElement.dir =
    currentLang === 'ar'
      ? 'rtl'
      : 'ltr';

  /* Text */
  document.querySelectorAll('[data-i18n]').forEach(element => {

    const key =
      element.getAttribute('data-i18n');

    if (
      Object.prototype.hasOwnProperty.call(t, key)
    ) {
      element.innerHTML = t[key];
    }

  });

  /* Placeholders */
  document
    .querySelectorAll('[data-i18n-placeholder]')
    .forEach(element => {

      const key =
        element.getAttribute(
          'data-i18n-placeholder'
        );

      if (
        Object.prototype.hasOwnProperty.call(t, key)
      ) {
        element.placeholder = t[key];
      }

    });

  const langButton =
    document.getElementById('langToggleBtn');

  if (langButton && t.langToggle) {
    langButton.textContent = t.langToggle;
  }

}


/* =========================================================
   5. LANGUAGE TOGGLE
   ========================================================= */

function toggleLanguage() {

  currentLang =
    currentLang === 'ar'
      ? 'en'
      : 'ar';

  setupLanguage();

  renderCategories();
  renderFilterOptions();
  renderProducts();
  renderProjects('all');
  renderComparisonDock();
  renderMultiZoneCalculator();

}


/* =========================================================
   6. CATEGORY SYSTEM
   ========================================================= */

function renderCategories() {

  const container =
    document.getElementById(
      'categoriesScroll'
    );

  if (!container) return;

  if (!Array.isArray(appCategories)) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML =
    appCategories
      .map(category => {

        const name =
          currentLang === 'ar'
            ? category.nameAr
            : category.nameEn;

        const isActive =
          category.id === activeCategory;

        return `
          <button
            type="button"
            class="cat-btn ${isActive ? 'active' : ''}"
            onclick="selectCategory('${escapeAttribute(category.id)}')"
          >
            <span>${category.icon || '💎'}</span>
            <span>${escapeHTML(name || '')}</span>
          </button>
        `;

      })
      .join('');

}


/* Select Category */

function selectCategory(categoryId) {

  activeCategory = categoryId;

  visibleCount = PAGE_SIZE;

  renderCategories();
  renderProducts();

}


/* =========================================================
   7. FILTER OPTIONS
   ========================================================= */

function renderFilterOptions() {

  const typeSelect =
    document.getElementById(
      'filterTypeSelect'
    );

  const colorSelect =
    document.getElementById(
      'filterColorSelect'
    );

  if (!typeSelect || !colorSelect) {
    return;
  }

  const stoneTypes =
    typeof STONE_TYPES !== 'undefined'
      ? STONE_TYPES
      : [];

  const colorGroups =
    typeof COLOR_GROUPS !== 'undefined'
      ? COLOR_GROUPS
      : [];

  typeSelect.innerHTML =
    stoneTypes
      .map(type => {

        const label =
          currentLang === 'ar'
            ? type.nameAr
            : type.nameEn;

        return `
          <option value="${escapeAttribute(type.id)}">
            ${escapeHTML(label || '')}
          </option>
        `;

      })
      .join('');

  colorSelect.innerHTML =
    colorGroups
      .map(color => {

        const label =
          currentLang === 'ar'
            ? color.nameAr
            : color.nameEn;

        return `
          <option value="${escapeAttribute(color.id)}">
            ${escapeHTML(label || '')}
          </option>
        `;

      })
      .join('');

  typeSelect.value = filterType;
  colorSelect.value = filterColor;

}


/* =========================================================
   8. RESET FILTERS
   ========================================================= */

function resetAllFilters() {

  activeCategory = 'all';
  filterType = 'all';
  filterColor = 'all';
  filterPrice = 'all';
  searchQuery = '';

  const searchInput =
    document.getElementById(
      'searchInput'
    );

  const typeSelect =
    document.getElementById(
      'filterTypeSelect'
    );

  const colorSelect =
    document.getElementById(
      'filterColorSelect'
    );

  const priceSelect =
    document.getElementById(
      'filterPriceSelect'
    );

  if (searchInput) {
    searchInput.value = '';
  }

  if (typeSelect) {
    typeSelect.value = 'all';
  }

  if (colorSelect) {
    colorSelect.value = 'all';
  }

  if (priceSelect) {
    priceSelect.value = 'all';
  }

  visibleCount = PAGE_SIZE;

  renderCategories();
  renderProducts();

}


/* =========================================================
   9. PRODUCT FILTERING
   ========================================================= */

function getFilteredProducts() {

  const query =
    searchQuery
      .toLowerCase()
      .trim();

  return appMaterials.filter(product => {

    const matchCategory =
      activeCategory === 'all' ||
      product.category === activeCategory;

    const matchType =
      filterType === 'all' ||
      product.stoneType === filterType;

    const matchColor =
      filterColor === 'all' ||
      product.colorGroup === filterColor;

    const matchPrice =
      filterPrice === 'all' ||
      (
        product.priceCategory &&
        String(product.priceCategory)
          .toLowerCase()
          .includes(
            filterPrice.toLowerCase()
          )
      );

    const searchableText = [
      product.nameAr,
      product.nameEn,
      product.origin,
      product.color,
      product.usage,
      product.usageEn,
      product.typeAr,
      product.typeEn
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchSearch =
      !query ||
      searchableText.includes(query);

    return (
      matchCategory &&
      matchType &&
      matchColor &&
      matchPrice &&
      matchSearch
    );

  });

}


/* =========================================================
   10. RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  const grid =
    document.getElementById(
      'productsGrid'
    );

  const countElement =
    document.getElementById(
      'productsCountDisplay'
    );

  const loadMoreContainer =
    document.getElementById(
      'loadMoreContainer'
    );

  if (!grid) return;

  const filtered =
    getFilteredProducts();

  if (countElement) {
    countElement.textContent =
      filtered.length;
  }

  if (filtered.length === 0) {

    const t =
      typeof TRANSLATIONS !== 'undefined'
        ? TRANSLATIONS[currentLang]
        : {};

    grid.innerHTML = `
      <div class="no-results-card">

        <div class="no-results-icon">
          🔍
        </div>

        <h3>
          ${t.noResultsTitle || 'لا توجد نتائج'}
        </h3>

        <p>
          ${t.noResultsText || 'لم نجد خامات مطابقة للبحث.'}
        </p>

        <button
          type="button"
          class="btn-primary"
          style="margin-top:1rem;"
          onclick="resetAllFilters()"
        >
          ${t.filterResetBtn || 'إعادة ضبط الفلاتر'}
        </button>

      </div>
    `;

    if (loadMoreContainer) {
      loadMoreContainer.style.display =
        'none';
    }

    return;
  }

  const visibleProducts =
    filtered.slice(
      0,
      visibleCount
    );

  grid.innerHTML =
    visibleProducts
      .map(product =>
        createProductCard(product)
      )
      .join('');

  renderLoadMore(
    filtered.length,
    loadMoreContainer
  );

}


/* =========================================================
   11. PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

  const t =
    TRANSLATIONS[currentLang];

  const name =
    currentLang === 'ar'
      ? product.nameAr
      : product.nameEn;

  const subName =
    currentLang === 'ar'
      ? product.nameEn
      : product.nameAr;

  const type =
    currentLang === 'ar'
      ? product.typeAr
      : product.typeEn;

  const usage =
    currentLang === 'ar'
      ? product.usage
      : product.usageEn;

  const isCompared =
    comparisonList.some(
      item => item.id === product.id
    );

  return `
    <div class="product-card">

      <div
        class="card-sample"
        style="background:${product.textureGrad || '#111827'};"
        onclick="openStoneDetail('${escapeAttribute(product.id)}')"
      >

        <span class="sample-badge">
          ${escapeHTML(
            product.priceCategory ||
            (currentLang === 'ar'
              ? 'مميز'
              : 'Premium')
          )}
        </span>

        <button
          type="button"
          class="btn-compare-card ${isCompared ? 'active' : ''}"
          onclick="
            event.stopPropagation();
            toggleCompareStone('${escapeAttribute(product.id)}')
          "
        >
          ${
            isCompared
              ? t.btnCompareAdded
              : '+ ' + t.btnCompareAdd
          }
        </button>

        <div class="sample-origin">
          <span>📍</span>
          <span>
            ${escapeHTML(product.origin || '')}
          </span>
        </div>

      </div>

      <div class="card-body">

        <div class="card-title-wrap">

          <h3
            class="card-title"
            onclick="openStoneDetail('${escapeAttribute(product.id)}')"
            style="cursor:pointer;"
          >
            ${escapeHTML(name || '')}
          </h3>

        </div>

        <div class="card-subtitle">
          ${escapeHTML(subName || '')}
          •
          ${escapeHTML(
            type ||
            (currentLang === 'ar'
              ? 'رخام فاخر'
              : 'Premium Stone')
          )}
        </div>

        <div class="card-color-desc">
          ${escapeHTML(product.color || '')}
        </div>

        <div class="card-specs">

          <div class="spec-row">
            <span class="spec-label">
              ${t.compStrengthLabel}
            </span>

            <span class="spec-val">
              ${escapeHTML(
                product.compressiveStrength ||
                '135 MPa'
              )}
            </span>
          </div>

          <div class="spec-row">
            <span class="spec-label">
              ${t.finishLabel}
            </span>

            <span class="spec-val">
              ${escapeHTML(
                product.finish ||
                (currentLang === 'ar'
                  ? 'لامع'
                  : 'Polished')
              )}
            </span>
          </div>

          <div class="spec-row">
            <span class="spec-label">
              ${t.usageLabel}
            </span>

            <span
              class="spec-val"
              style="font-size:.72rem;"
            >
              ${escapeHTML(usage || '')}
            </span>
          </div>

        </div>

        <div class="card-actions">

          <button
            type="button"
            class="btn-card-quote"
            onclick="openQuoteModal('${escapeAttribute(product.id)}')"
          >
            <span>📋</span>
            <span>${t.btnRequestThis}</span>
          </button>

          <button
            type="button"
            class="btn-card-details"
            onclick="openStoneDetail('${escapeAttribute(product.id)}')"
          >
            <span>
              🔍 ${t.btnDetails}
            </span>
          </button>

        </div>

      </div>

    </div>
  `;

}


/* =========================================================
   12. LOAD MORE
   ========================================================= */

function renderLoadMore(
  totalCount,
  container
) {

  if (!container) return;

  if (visibleCount < totalCount) {

    const remaining =
      totalCount - visibleCount;

    const buttonText =
      currentLang === 'ar'
        ? `عرض المزيد من الخامات (${remaining} خامة متبقية) ⬇️`
        : `Load More Materials (${remaining} remaining) ⬇️`;

    container.style.display =
      'block';

    container.innerHTML = `
      <button
        type="button"
        class="btn-load-more"
        onclick="loadMoreProducts()"
      >
        ${buttonText}
      </button>
    `;

  } else {

    container.style.display =
      'none';

  }

}


function loadMoreProducts() {

  visibleCount += PAGE_SIZE;

  renderProducts();

}


/* =========================================================
   13. STONE DETAIL MODAL
   ========================================================= */

function openStoneDetail(productId) {

  const product =
    appMaterials.find(
      item => item.id === productId
    );

  if (!product) return;

  const modal =
    document.getElementById(
      'stoneDetailModal'
    );

  const body =
    document.getElementById(
      'stoneDetailBody'
    );

  if (!modal || !body) return;

  const t =
    TRANSLATIONS[currentLang];

  const name =
    currentLang === 'ar'
      ? product.nameAr
      : product.nameEn;

  const subName =
    currentLang === 'ar'
      ? product.nameEn
      : product.nameAr;

  const type =
    currentLang === 'ar'
      ? product.typeAr
      : product.typeEn;

  const usage =
    currentLang === 'ar'
      ? product.usage
      : product.usageEn;

  const score =
    Number(product.durabilityScore) || 4.5;

  const stars =
    '⭐'.repeat(
      Math.max(
        1,
        Math.min(
          5,
          Math.round(score)
        )
      )
    );

  const isCompared =
    comparisonList.some(
      item => item.id === product.id
    );

  body.innerHTML = `

    <div class="stone-detail-grid">

      <div>

        <div
          class="stone-gallery-preview"
          style="background:${product.textureGrad || '#111827'};"
        >
          <span class="sample-badge">
            ${escapeHTML(
              product.priceCategory || 'VIP'
            )}
          </span>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:.5rem;
            margin-top:.5rem;
          "
        >

          <div
            style="
              height:65px;
              border-radius:8px;
              border:1px solid var(--border-gold);
              background:${product.textureGrad || '#111827'};
            "
          ></div>

          <div
            style="
              height:65px;
              border-radius:8px;
              border:1px solid var(--border-gold);
              background:radial-gradient(
                circle,
                ${product.colorCode || '#fff'} 0%,
                #0f172a 90%
              );
            "
          ></div>

          <div
            style="
              height:65px;
              border-radius:8px;
              border:1px solid var(--border-gold);
              background:linear-gradient(
                to right,
                #0a0d14,
                ${product.colorCode || '#d4af37'}
              );
            "
          ></div>

        </div>

        <div style="margin-top:1rem;">

          <button
            type="button"
            class="btn-primary"
            style="width:100%;margin-bottom:.5rem;"
            onclick="
              openQuoteModal('${escapeAttribute(product.id)}');
              closeStoneDetail();
            "
          >
            📋 ${t.btnRequestThis}
          </button>

          <button
            type="button"
            class="btn-secondary"
            style="width:100%;"
            onclick="
              toggleCompareStone('${escapeAttribute(product.id)}');
              openStoneDetail('${escapeAttribute(product.id)}');
            "
          >
            ⚖️
            ${
              isCompared
                ? t.btnCompareAdded
                : t.btnCompareAdd
            }
          </button>

        </div>

      </div>

      <div>

        <div
          style="
            border-bottom:1px solid rgba(212,175,55,.2);
            padding-bottom:.75rem;
            margin-bottom:1rem;
          "
        >

          <h2
            style="
              font-size:1.5rem;
              font-weight:900;
              color:var(--gold-primary);
            "
          >
            ${escapeHTML(name || '')}
          </h2>

          <p
            style="
              font-size:.85rem;
              color:var(--text-muted);
            "
          >
            ${escapeHTML(subName || '')}
            •
            ${escapeHTML(type || '')}
            •
            📍 ${escapeHTML(product.origin || '')}
          </p>

          <p
            style="
              font-size:.85rem;
              color:var(--text-main);
              margin-top:.4rem;
            "
          >
            ${escapeHTML(product.color || '')}
          </p>

        </div>

        <h4
          style="
            font-size:.95rem;
            font-weight:800;
            color:var(--gold-primary);
          "
        >
          ${t.stoneTechSpecs}
        </h4>

        <table class="tech-specs-table">

          <tr>
            <th>${t.compStrengthLabel}</th>
            <td>${escapeHTML(
              product.compressiveStrength ||
              '135 MPa'
            )}</td>
          </tr>

          <tr>
            <th>${t.densityLabel}</th>
            <td>${escapeHTML(
              product.density ||
              '2700 kg/m³'
            )}</td>
          </tr>

          <tr>
            <th>${t.waterAbsorbLabel}</th>
            <td>${escapeHTML(
              product.waterAbsorption ||
              '0.15%'
            )}</td>
          </tr>

          <tr>
            <th>${t.durabilityScoreLabel}</th>
            <td>
              ${stars}
              (${score} / 5.0)
            </td>
          </tr>

          <tr>
            <th>${t.maintenanceLabel}</th>
            <td>
              ${escapeHTML(
                product.maintenanceTier ||
                'متوسطة'
              )}
            </td>
          </tr>

          <tr>
            <th>${t.availableFinishesLabel}</th>
            <td>
              ${escapeHTML(
                product.finish ||
                'لامع / مطفي'
              )}
            </td>
          </tr>

          <tr>
            <th>${t.availableThicknessLabel}</th>
            <td>
              ${escapeHTML(
                t.availableThicknessVal ||
                '2 / 3 سم'
              )}
            </td>
          </tr>

          <tr>
            <th>${t.idealApplicationsLabel}</th>
            <td>
              ${escapeHTML(usage || '')}
            </td>
          </tr>

        </table>

        <div
          style="
            display:flex;
            gap:.5rem;
            margin-top:1rem;
          "
        >

          <button
            type="button"
            class="btn-secondary"
            style="flex:1;font-size:.8rem;"
            onclick="
              applyStoneToCalculator('${escapeAttribute(product.id)}')
            "
          >
            ${t.btnCalculateForThis}
          </button>

          <button
            type="button"
            class="btn-secondary"
            style="flex:1;font-size:.8rem;"
            onclick="
              askAIAboutStone('${escapeAttribute(product.nameAr || '')}')
            "
          >
            ${t.btnAskAIAboutThis}
          </button>

        </div>

      </div>

    </div>
  `;

  modal.classList.add('active');

  document.body.style.overflow =
    'hidden';

}


function closeStoneDetail() {

  const modal =
    document.getElementById(
      'stoneDetailModal'
    );

  if (modal) {
    modal.classList.remove(
      'active'
    );

    document.body.style.overflow =
      '';
  }

}


/* =========================================================
   14. CALCULATOR FROM STONE
   ========================================================= */

function applyStoneToCalculator(productId) {

  closeStoneDetail();

  const section =
    document.getElementById(
      'calculator'
    );

  if (section) {

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }

}


/* =========================================================
   15. AI ABOUT STONE
   ========================================================= */

function askAIAboutStone(stoneName) {

  closeStoneDetail();

  const aiSection =
    document.getElementById(
      'consultant'
    );

  if (aiSection) {

    aiSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    setTimeout(() => {

      sendAIMessage(
        `أخبرني عن مميزات واستخدامات خامة ${stoneName} وأفضل الأماكن لتركيبها.`
      );

    }, 400);

  }

}


/* =========================================================
   16. COMPARISON SYSTEM
   ========================================================= */

function toggleCompareStone(productId) {

  const product =
    appMaterials.find(
      item => item.id === productId
    );

  if (!product) return;

  const index =
    comparisonList.findIndex(
      item => item.id === productId
    );

  if (index !== -1) {

    comparisonList.splice(
      index,
      1
    );

  } else {

    if (comparisonList.length >= 4) {

      alert(
        currentLang === 'ar'
          ? 'الحد الأقصى للمقارنة هو 4 خامات في نفس الوقت.'
          : 'Maximum 4 stones can be compared simultaneously.'
      );

      return;
    }

    comparisonList.push(product);

  }

  renderComparisonDock();
  renderProducts();

}


/* =========================================================
   17. COMPARISON DOCK
   ========================================================= */

function renderComparisonDock() {

  const dock =
    document.getElementById(
      'comparisonDock'
    );

  const countElement =
    document.getElementById(
      'compareCountDisplay'
    );

  const listElement =
    document.getElementById(
      'dockStonesList'
    );

  if (!dock) return;

  if (comparisonList.length > 0) {

    dock.classList.add('active');

    if (countElement) {
      countElement.textContent =
        comparisonList.length;
    }

    if (listElement) {

      listElement.innerHTML =
        comparisonList
          .map(product => `

            <div
              class="dock-stone-chip"
              style="
                background:${product.textureGrad || '#111827'};
              "
              title="${escapeAttribute(
                product.nameAr || ''
              )}"
            ></div>

          `)
          .join('');

    }

  } else {

    dock.classList.remove(
      'active'
    );

    if (countElement) {
      countElement.textContent = '0';
    }

    if (listElement) {
      listElement.innerHTML = '';
    }

  }

}


/* =========================================================
   18. COMPARISON MODAL
   ========================================================= */

function openComparisonModal() {

  if (comparisonList.length === 0) {
    return;
  }

  const modal =
    document.getElementById(
      'comparisonModal'
    );

  const body =
    document.getElementById(
      'comparisonTableBody'
    );

  if (!modal || !body) return;

  const t =
    TRANSLATIONS[currentLang];

  body.innerHTML = `

    <div class="comparison-table-wrap">

      <table class="comparison-table">

        <thead>

          <tr>

            <th>
              ${t.compareColProp}
            </th>

            ${comparisonList
              .map(product => `

                <th>

                  <div
                    style="
                      font-size:.95rem;
                      font-weight:800;
                    "
                  >
                    ${escapeHTML(
                      currentLang === 'ar'
                        ? product.nameAr
                        : product.nameEn
                    )}
                  </div>

                  <small
                    style="color:var(--text-muted);"
                  >
                    ${escapeHTML(
                      product.origin || ''
                    )}
                  </small>

                  <div style="margin-top:.4rem;">

                    <button
                      type="button"
                      style="
                        background:rgba(239,68,68,.2);
                        border:none;
                        color:#ef4444;
                        padding:.2rem .5rem;
                        border-radius:6px;
                        cursor:pointer;
                      "
                      onclick="
                        toggleCompareStone('${escapeAttribute(product.id)}');
                        openComparisonModal();
                      "
                    >
                      ✕
                    </button>

                  </div>

                </th>

              `)
              .join('')}

          </tr>

        </thead>

        <tbody>

          ${createComparisonRow(
            t.filterTypeLabel,
            product =>
              currentLang === 'ar'
                ? product.typeAr
                : product.typeEn
          )}

          ${createComparisonRow(
            t.filterPriceLabel,
            product =>
              product.priceCategory || 'VIP'
          )}

          ${createComparisonRow(
            t.compStrengthLabel,
            product =>
              product.compressiveStrength ||
              '135 MPa'
          )}

          ${createComparisonRow(
            t.densityLabel,
            product =>
              product.density ||
              '2700 kg/m³'
          )}

          ${createComparisonRow(
            t.waterAbsorbLabel,
            product =>
              product.waterAbsorption ||
              '0.15%'
          )}

          ${createComparisonRow(
            t.durabilityScoreLabel,
            product => {

              const score =
                Number(
                  product.durabilityScore
                ) || 4.5;

              return `
                ${'⭐'.repeat(
                  Math.round(score)
                )}
                (${score})
              `;

            },
            true
          )}

          ${createComparisonRow(
            t.maintenanceLabel,
            product =>
              product.maintenanceTier ||
              'متوسطة'
          )}

          ${createComparisonRow(
            t.availableFinishesLabel,
            product =>
              product.finish ||
              'لامع'
          )}

          ${createComparisonRow(
            t.idealApplicationsLabel,
            product =>
              currentLang === 'ar'
                ? product.usage
                : product.usageEn
          )}

        </tbody>

      </table>

    </div>

    <div
      style="
        display:flex;
        justify-content:space-between;
        gap:.75rem;
        margin-top:1.5rem;
        flex-wrap:wrap;
      "
    >

      <button
        type="button"
        class="btn-secondary"
        onclick="clearComparison()"
      >
        ${t.compareClearAll}
      </button>

      <button
        type="button"
        class="btn-primary"
        onclick="requestQuoteForComparedStones()"
      >
        ${t.compareRequestAll}
      </button>

    </div>
  `;

  modal.classList.add('active');

  document.body.style.overflow =
    'hidden';

}


function createComparisonRow(
  label,
  valueCallback,
  allowHTML = false
) {

  return `
    <tr>

      <td
        style="
          font-weight:800;
          color:var(--gold-primary);
        "
      >
        ${label}
      </td>

      ${comparisonList
        .map(product => {

          const value =
            valueCallback(product);

          return `
            <td>
              ${
                allowHTML
                  ? value
                  : escapeHTML(
                      String(value || '')
                    )
              }
            </td>
          `;

        })
        .join('')}

    </tr>
  `;

}


function clearComparison() {

  comparisonList = [];

  renderComparisonDock();
  renderProducts();
  closeComparisonModal();

}


function closeComparisonModal() {

  const modal =
    document.getElementById(
      'comparisonModal'
    );

  if (modal) {

    modal.classList.remove(
      'active'
    );

    document.body.style.overflow =
      '';

  }

}


/* =========================================================
   19. RFQ FOR COMPARED STONES
   ========================================================= */

function requestQuoteForComparedStones() {

  if (comparisonList.length === 0) {
    return;
  }

  const names =
    comparisonList
      .map(product =>
        product.nameAr
      )
      .join(' + ');

  closeComparisonModal();

  selectedProductForQuote =
    null;

  openQuoteModal();

  const notes =
    document.getElementById(
      'custNotes'
    );

  if (notes) {

    notes.value =
      `طلب مقارنة وتسعير للخامات التالية: ${names}`;

  }

}


/* =========================================================
   20. PROJECTS
   ========================================================= */

function renderProjects(
  filterCategory = 'all'
) {

  const grid =
    document.getElementById(
      'projectsGrid'
    );

  if (!grid) return;

  const filtered =
    appProjects.filter(
      project =>
        filterCategory === 'all' ||
        project.category === filterCategory
    );

  if (filtered.length === 0) {

    grid.innerHTML = `
      <div class="no-results-card">
        <div class="no-results-icon">
          🏛️
        </div>
        <h3>
          ${
            currentLang === 'ar'
              ? 'لا توجد مشاريع'
              : 'No Projects Found'
          }
        </h3>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filtered
      .map(project =>
        createProjectCard(project)
      )
      .join('');

}


function createProjectCard(project) {

  const t =
    TRANSLATIONS[currentLang];

  const title =
    currentLang === 'ar'
      ? project.titleAr
      : project.titleEn;

  const category =
    currentLang === 'ar'
      ? project.categoryAr
      : project.categoryEn;

  const location =
    currentLang === 'ar'
      ? project.locationAr
      : project.locationEn;

  const scope =
    currentLang === 'ar'
      ? project.scopeAr
      : project.scopeEn;

  const stones =
    Array.isArray(project.stonesUsed)
      ? project.stonesUsed
      : [];

  const stonesHTML =
    stones
      .map(stoneId => {

        const stone =
          appMaterials.find(
            item => item.id === stoneId
          );

        if (!stone) return '';

        const stoneName =
          currentLang === 'ar'
            ? stone.nameAr
            : stone.nameEn;

        return `
          <button
            type="button"
            class="stone-pill-link"
            onclick="
              openStoneDetail('${escapeAttribute(stone.id)}')
            "
          >
            ${escapeHTML(stoneName || '')}
          </button>
        `;

      })
      .join('');

  return `

    <div class="project-card">

      <div
        class="project-hero-sample"
        style="
          background:${project.heroGrad || '#111827'};
        "
      >

        <span class="proj-badge">
          ${escapeHTML(category || '')}
        </span>

      </div>

      <div class="project-body">

        <h3 class="project-title">
          ${escapeHTML(title || '')}
        </h3>

        <div class="project-location">
          📍 ${escapeHTML(location || '')}
          •
          📐 ${escapeHTML(project.area || '')}
        </div>

        <p class="project-scope">
          ${escapeHTML(scope || '')}
        </p>

        <div class="project-stones-used">

          <label>
            ${t.projStonesLabel}
          </label>

          <div class="stone-pill-links">
            ${stonesHTML}
          </div>

        </div>

        <button
          type="button"
          class="btn-view-project"
          onclick="
            openProjectModal('${escapeAttribute(project.id)}')
          "
        >
          ${t.btnViewProject}
          🏛️
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   21. PROJECT FILTER
   ========================================================= */

function filterProjects(
  category,
  buttonElement
) {

  document
    .querySelectorAll('.proj-tab-btn')
    .forEach(button => {
      button.classList.remove(
        'active'
      );
    });

  if (buttonElement) {
    buttonElement.classList.add(
      'active'
    );
  }

  renderProjects(category);

}


/* =========================================================
   22. PROJECT MODAL
   ========================================================= */

function openProjectModal(
  projectId
) {

  const project =
    appProjects.find(
      item => item.id === projectId
    );

  if (!project) return;

  const modal =
    document.getElementById(
      'projectModal'
    );

  const body =
    document.getElementById(
      'projectModalBody'
    );

  if (!modal || !body) return;

  const title =
    currentLang === 'ar'
      ? project.titleAr
      : project.titleEn;

  const location =
    currentLang === 'ar'
      ? project.locationAr
      : project.locationEn;

  const scope =
    currentLang === 'ar'
      ? project.scopeAr
      : project.scopeEn;

  body.innerHTML = `

    <div
      style="
        height:200px;
        border-radius:var(--radius-md);
        background:${project.heroGrad || '#111827'};
        margin-bottom:1.25rem;
        border:1px solid var(--border-gold);
      "
    ></div>

    <h2
      style="
        font-size:1.35rem;
        font-weight:900;
        color:var(--gold-primary);
        margin-bottom:.35rem;
      "
    >
      ${escapeHTML(title || '')}
    </h2>

    <p
      style="
        font-size:.85rem;
        color:var(--text-muted);
        margin-bottom:1rem;
      "
    >
      📍 ${escapeHTML(location || '')}
      •
      المساحة:
      ${escapeHTML(project.area || '')}
    </p>

    <div
      style="
        background:#0a0d14;
        border:1px solid var(--border-gold);
        border-radius:8px;
        padding:1rem;
        margin-bottom:1.25rem;
      "
    >

      <h4
        style="
          font-size:.9rem;
          color:var(--gold-primary);
          margin-bottom:.3rem;
        "
      >
        نطاق التوريد والتركيب:
      </h4>

      <p
        style="
          font-size:.85rem;
          color:var(--text-main);
        "
      >
        ${escapeHTML(scope || '')}
      </p>

    </div>

    <button
      type="button"
      class="btn-primary"
      style="width:100%;"
      onclick="
        openQuoteModal();
        closeProjectModal();
      "
    >
      طلب تسعير لمشروع مماثل 📋
    </button>

  `;

  modal.classList.add('active');

  document.body.style.overflow =
    'hidden';

}


function closeProjectModal() {

  const modal =
    document.getElementById(
      'projectModal'
    );

  if (modal) {

    modal.classList.remove(
      'active'
    );

    document.body.style.overflow =
      '';

  }

}


/* =========================================================
   23. AI WIZARD
   ========================================================= */

function selectWizardOption(
  key,
  value,
  buttonElement
) {

  aiWizardData[key] =
    value;

  if (!buttonElement) {
    return;
  }

  const parent =
    buttonElement.closest(
      '.ai-options-grid'
    );

  if (parent) {

    parent
      .querySelectorAll(
        '.ai-opt-btn'
      )
      .forEach(button => {

        button.classList.remove(
          'selected'
        );

      });

    buttonElement.classList.add(
      'selected'
    );

  }

}


/* Next */

function nextWizardStep() {

  if (currentWizardStep >= 4) {
    return;
  }

  const current =
    document.getElementById(
      `aiStep${currentWizardStep}`
    );

  if (current) {
    current.classList.remove(
      'active'
    );
  }

  currentWizardStep++;

  const next =
    document.getElementById(
      `aiStep${currentWizardStep}`
    );

  if (next) {
    next.classList.add(
      'active'
    );
  }

}


/* Previous */

function prevWizardStep() {

  if (currentWizardStep <= 1) {
    return;
  }

  const current =
    document.getElementById(
      `aiStep${currentWizardStep}`
    );

  if (current) {
    current.classList.remove(
      'active'
    );
  }

  currentWizardStep--;

  const previous =
    document.getElementById(
      `aiStep${currentWizardStep}`
    );

  if (previous) {
    previous.classList.add(
      'active'
    );
  }

}


/* =========================================================
   24. AI RECOMMENDATION ENGINE
   ========================================================= */

function calculateAIRecommendations() {

  const step =
    document.getElementById(
      'aiStep4'
    );

  if (step) {
    step.classList.remove(
      'active'
    );
  }

  const resultsContainer =
    document.getElementById(
      'aiResultsContainer'
    );

  const resultsList =
    document.getElementById(
      'aiRecommendationsList'
    );

  if (!resultsContainer || !resultsList) {
    return;
  }

  resultsContainer.style.display =
    'block';

  let recommendations = [];

  if (
    aiWizardData.surfaceArea ===
    'facade'
  ) {

    recommendations = [
      {
        id: 'rs-4',
        score: 99,
        rationale:
          'حجر نساح الأبيض الطبيعي يوفر أعلى عزل حراري ومقاومة استثنائية للمناخ الصحراوي.'
      },
      {
        id: 'rs-1',
        score: 96,
        rationale:
          'حجر الرياض الأبيض يعكس أشعة الشمس بكفاءة ومثالي للواجهات المودرن والكلاسيك.'
      },
      {
        id: 'tr-26',
        score: 93,
        rationale:
          'الترافرتين التركي يمنح الواجهات مظهراً معمارياً فاخراً مع مسامية عازلة.'
      }
    ];

  } else if (
    aiWizardData.surfaceArea ===
    'kitchen'
  ) {

    recommendations = [
      {
        id: 'in-1',
        score: 99,
        rationale:
          'جرانيت جالاكسي هندي يتمتع بأعلى صلابة ومقاومة ممتازة للحرارة والزيوت.'
      },
      {
        id: 'sa-2',
        score: 97,
        rationale:
          'جرانيت نجران بلاك فائق الصلابة ومقاوم للبقع والخدوش للاستخدام الشاق.'
      },
      {
        id: 'tr-7',
        score: 92,
        rationale:
          'فانتازي براون يجمع بين جمال الرخام وقوة تحمل الجرانيت العالية.'
      }
    ];

  } else {

    if (
      aiWizardData.budgetTier ===
      'ultra'
    ) {

      recommendations = [
        {
          id: 'it-3',
          score: 98,
          rationale:
            'كالاكاتا جولد الإيطالي بعروقه الذهبية مناسب للقصور والمشاريع الفاخرة.'
        },
        {
          id: 'gr-1',
          score: 96,
          rationale:
            'ثاسوس سوبر وايت يتميز بلونه الأبيض النقي ومظهره الفاخر.'
        },
        {
          id: 'it-4',
          score: 94,
          rationale:
            'كالاكاتا فيولا يضيف طابعاً فخماً وجريئاً للمداخل والمغاسل.'
        }
      ];

    } else {

      recommendations = [
        {
          id: 'gr-2',
          score: 97,
          rationale:
            'فولاكاس اليوناني يوفر مظهر الرخام الأبيض الفاخر بتكلفة ممتازة.'
        },
        {
          id: 'es-3',
          score: 95,
          rationale:
            'كريما مارفيل الإسباني يمنح دفئاً وتجانساً للمساحات الكبيرة.'
        },
        {
          id: 'tr-4',
          score: 92,
          rationale:
            'تندرا جراي مناسب للتصاميم المودرن والمساحات المعاصرة.'
        }
      ];

    }

  }

  const t =
    TRANSLATIONS[currentLang];

  resultsList.innerHTML =
    recommendations
      .map(recommendation => {

        const stone =
          appMaterials.find(
            item =>
              item.id ===
              recommendation.id
          );

        if (!stone) {
          return '';
        }

        const name =
          currentLang === 'ar'
            ? stone.nameAr
            : stone.nameEn;

        return `

          <div class="ai-rec-card">

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:.5rem;
              "
            >

              <h4
                style="
                  font-size:1.1rem;
                  font-weight:800;
                  color:var(--gold-primary);
                "
              >
                ${escapeHTML(name || '')}
                (${escapeHTML(
                  stone.origin || ''
                )})
              </h4>

              <span class="ai-match-badge">
                ${recommendation.score}%
                ${t.aiMatchScore}
              </span>

            </div>

            <p
              style="
                font-size:.82rem;
                color:var(--text-muted);
              "
            >
              <strong
                style="color:var(--gold-primary);"
              >
                ${t.aiWhyThisStone}
              </strong>

              ${escapeHTML(
                recommendation.rationale
              )}
            </p>

            <div
              style="
                display:flex;
                gap:.5rem;
                margin-top:.5rem;
              "
            >

              <button
                type="button"
                class="btn-card-quote"
                style="flex:1;"
                onclick="
                  openQuoteModal('${escapeAttribute(stone.id)}')
                "
              >
                طلب عرض سعر لهذه الخامة 📋
              </button>

              <button
                type="button"
                class="btn-card-details"
                onclick="
                  openStoneDetail('${escapeAttribute(stone.id)}')
                "
              >
                عرض المواصفات 🔍
              </button>

            </div>

          </div>

        `;

      })
      .join('');

  /* AI telemetry */

  if (
    typeof window.PrimeAPI !==
    'undefined' &&
    typeof window.PrimeAPI.logAIRequest ===
    'function'
  ) {

    try {

      awaitSafe(
        window.PrimeAPI.logAIRequest({
          query:
            `Wizard: ${aiWizardData.projectType} / ` +
            `${aiWizardData.surfaceArea} / ` +
            `${aiWizardData.budgetTier} / ` +
            `${aiWizardData.stylePref}`,

          response:
            recommendations
              .map(item => item.id)
              .join(', '),

          projectType:
            aiWizardData.projectType,

          surfaceArea:
            aiWizardData.surfaceArea,

          budgetTier:
            aiWizardData.budgetTier,

          stylePref:
            aiWizardData.stylePref
        })
      );

    } catch (error) {

      console.warn(
        '[Prime Scope] AI telemetry failed.',
        error
      );

    }

  }

}


/* =========================================================
   25. RESET AI WIZARD
   ========================================================= */

function resetAIWizard() {

  const results =
    document.getElementById(
      'aiResultsContainer'
    );

  if (results) {
    results.style.display =
      'none';
  }

  currentWizardStep = 1;

  document
    .querySelectorAll(
      '.ai-wizard-step'
    )
    .forEach(step => {

      step.classList.remove(
        'active'
      );

    });

  const firstStep =
    document.getElementById(
      'aiStep1'
    );

  if (firstStep) {
    firstStep.classList.add(
      'active'
    );
  }

}


/* =========================================================
   26. AI CHAT
   ========================================================= */

function sendAIMessage(
  presetText = null
) {

  const input =
    document.getElementById(
      'aiInput'
    );

  const chatBody =
    document.getElementById(
      'aiChatBody'
    );

  if (!chatBody) {
    return;
  }

  const query =
    presetText ||
    (input
      ? input.value.trim()
      : '');

  if (!query) {
    return;
  }

  const userMessage =
    document.createElement(
      'div'
    );

  userMessage.className =
    'ai-msg user';

  userMessage.textContent =
    query;

  chatBody.appendChild(
    userMessage
  );

  if (input && !presetText) {
    input.value = '';
  }

  const lowerQuery =
    query.toLowerCase();

  let reply =
    'خامات الرخام والحجر الطبيعي المعتمدة متوفرة لدينا بأعلى معايير الجودة العالمية. يمكنك الضغط على "طلب عرض سعر" للحصول على جدول كميات وتوريد لموقع مشروعك.';

  if (
    lowerQuery.includes('واجه') ||
    lowerQuery.includes('حجر') ||
    lowerQuery.includes('نساح')
  ) {

    reply =
      'لواجهات الفلل والقصور، نوصي بـ **حجر نساح الطبيعي الفاخر** و**حجر الرياض الأبيض والكريمي** لما توفره من مظهر معماري مميز وأداء جيد للواجهات.';

  } else if (
    lowerQuery.includes('مطبخ') ||
    lowerQuery.includes('كاونتر') ||
    lowerQuery.includes('جالاكسي')
  ) {

    reply =
      'لأسطح وجزر المطابخ شديدة التحمل، **جرانيت جالاكسي الهندي** و**جرانيت نجران بلاك** و**فانتازي براون** خيارات قوية للاستخدام اليومي.';

  } else if (
    lowerQuery.includes('مجلس') ||
    lowerQuery.includes('ابيض') ||
    lowerQuery.includes('أبيض') ||
    lowerQuery.includes('كالاكاتا')
  ) {

    reply =
      'للمجالس والصالات الفاخرة، يمكن اختيار **كالاكاتا جولد الإيطالي** أو **ثاسوس اليوناني** حسب درجة العروق والميزانية والتصميم الداخلي.';

  }

  setTimeout(() => {

    const botMessage =
      document.createElement(
        'div'
      );

    botMessage.className =
      'ai-msg bot';

    botMessage.innerHTML =
      formatAIText(reply);

    chatBody.appendChild(
      botMessage
    );

    chatBody.scrollTop =
      chatBody.scrollHeight;

  }, 250);

  chatBody.scrollTop =
    chatBody.scrollHeight;

}


/* =========================================================
   27. MULTI-ZONE CALCULATOR
   ========================================================= */

function renderMultiZoneCalculator() {

  const container =
    document.getElementById(
      'calcZonesContainer'
    );

  if (!container) return;

  container.innerHTML =
    calcZones
      .map((zone, index) => `

        <div class="calc-zone-item">

          <div class="calc-group">

            <label>
              اسم المنطقة / الغرفة:
            </label>

            <input
              type="text"
              class="calc-input"
              value="${escapeAttribute(zone.name)}"
              oninput="
                calcZones[${index}].name = this.value;
                recalculateZones();
              "
            />

          </div>

          <div class="calc-group">

            <label>
              الطول (م):
            </label>

            <input
              type="number"
              min="0"
              class="calc-input"
              value="${zone.length}"
              step="0.1"
              oninput="
                calcZones[${index}].length =
                  parseFloat(this.value) || 0;
                recalculateZones();
              "
            />

          </div>

          <div class="calc-group">

            <label>
              العرض (م):
            </label>

            <input
              type="number"
              min="0"
              class="calc-input"
              value="${zone.width}"
              step="0.1"
              oninput="
                calcZones[${index}].width =
                  parseFloat(this.value) || 0;
                recalculateZones();
              "
            />

          </div>

          <div class="calc-group">

            <label>
              عدد القطع:
            </label>

            <input
              type="number"
              min="1"
              class="calc-input"
              value="${zone.pieces || 1}"
              step="1"
              oninput="
                calcZones[${index}].pieces =
                  Math.max(
                    1,
                    parseInt(this.value) || 1
                  );
                recalculateZones();
              "
            />

          </div>

          <div class="calc-group">

            <label>
              نسبة الهدر:
            </label>

            <select
              class="calc-input"
              onchange="
                calcZones[${index}].wastage =
                  parseFloat(this.value);
                recalculateZones();
              "
            >

              <option
                value="0.05"
                ${zone.wastage === 0.05 ? 'selected' : ''}
              >
                5% - قص مستقيم
              </option>

              <option
                value="0.10"
                ${zone.wastage === 0.10 ? 'selected' : ''}
              >
                10% - زوايا وديكورات
              </option>

              <option
                value="0.15"
                ${zone.wastage === 0.15 ? 'selected' : ''}
              >
                15% - بوكماتش / ووترجيت
              </option>

            </select>

          </div>

          <div>

            ${
              calcZones.length > 1
                ? `
                  <button
                    type="button"
                    class="btn-remove-zone"
                    onclick="
                      removeCalcZone(${index})
                    "
                  >
                    ✕
                  </button>
                `
                : ''
            }

          </div>

        </div>

      `)
      .join('');

  recalculateZones();

}


/* Add Zone */

function addCalcZone() {

  calcZones.push({

    id: Date.now(),

    name:
      `منطقة إضافية #${calcZones.length + 1}`,

    length: 6,

    width: 4,

    pieces: 1,

    wastage: 0.10

  });

  renderMultiZoneCalculator();

}


/* Remove Zone */

function removeCalcZone(index) {

  if (calcZones.length <= 1) {
    return;
  }

  calcZones.splice(
    index,
    1
  );

  renderMultiZoneCalculator();

}


/* Calculate */

function recalculateZones() {

  let netTotal = 0;
  let grossTotal = 0;

  calcZones.forEach(zone => {

    const length =
      Number(zone.length) || 0;

    const width =
      Number(zone.width) || 0;

    const pieces =
      Number(zone.pieces) || 1;

    const wastage =
      Number(zone.wastage) || 0.10;

    const net =
      length *
      width *
      pieces;

    const gross =
      net *
      (1 + wastage);

    netTotal += net;
    grossTotal += gross;

  });

  const netElement =
    document.getElementById(
      'calcNetDisplay'
    );

  const grossElement =
    document.getElementById(
      'calcTotalDisplay'
    );

  if (netElement) {
    netElement.textContent =
      netTotal.toFixed(2);
  }

  if (grossElement) {
    grossElement.textContent =
      grossTotal.toFixed(2);
  }

  return {
    netTotal,
    grossTotal
  };

}


/* =========================================================
   28. APPLY CALCULATOR TO RFQ
   ========================================================= */

function applyCalcToQuote() {

  const calculation =
    recalculateZones();

  const quantityInput =
    document.getElementById(
      'custQuantity'
    );

  const notesInput =
    document.getElementById(
      'custNotes'
    );

  if (quantityInput) {

    quantityInput.value =
      `${calculation.grossTotal.toFixed(2)} م² (محسوبة هندسياً مع الهدر)`;

  }

  if (notesInput) {

    const summary =
      calcZones
        .map(zone => {

          const area =
            (
              Number(zone.length) *
              Number(zone.width) *
              Number(zone.pieces || 1)
            );

          return `
            ${zone.name}: ${area.toFixed(1)}م²
          `;

        })
        .join(' | ');

    notesInput.value =
      `تفصيل المناطق: ${summary}`;

  }

  openQuoteModal();

}


/* =========================================================
   29. RFQ MODAL
   ========================================================= */

function openQuoteModal(
  productId = null
) {

  const modal =
    document.getElementById(
      'quoteModal'
    );

  if (!modal) return;

  if (productId) {

    selectedProductForQuote =
      appMaterials.find(
        product =>
          product.id === productId
      ) || null;

  }

  const reference =
    generateRFQReference();

  const referenceDisplay =
    document.getElementById(
      'rfqRefDisplay'
    );

  if (referenceDisplay) {
    referenceDisplay.textContent =
      reference;
  }

  updateSelectedProductBanner(
    selectedProductForQuote
  );

  modal.classList.add(
    'active'
  );

  document.body.style.overflow =
    'hidden';

}


/* Generate RFQ */

function generateRFQReference() {

  const year =
    new Date().getFullYear();

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `PS-RFQ-${year}-${random}`;

}


/* Close RFQ */

function closeQuoteModal() {

  const modal =
    document.getElementById(
      'quoteModal'
    );

  if (modal) {

    modal.classList.remove(
      'active'
    );

    document.body.style.overflow =
      '';

  }

}


/* =========================================================
   30. SELECTED MATERIAL BANNER
   ========================================================= */

function updateSelectedProductBanner(
  product
) {

  const banner =
    document.getElementById(
      'selectedProductBanner'
    );

  if (!banner) return;

  if (!product) {

    banner.innerHTML = `
      <div>
        <span
          style="
            color:var(--text-muted);
            font-size:.75rem;
          "
        >
          ${currentLang === 'ar'
            ? 'الخامة'
            : 'Material'}
        </span>

        <h4
          style="
            font-size:1rem;
            color:var(--gold-primary);
            font-weight:800;
          "
        >
          ${
            currentLang === 'ar'
              ? 'طلب استشارة وتوريد عام'
              : 'General Material Request'
          }
        </h4>
      </div>
    `;

    return;
  }

  const name =
    currentLang === 'ar'
      ? product.nameAr
      : product.nameEn;

  const t =
    TRANSLATIONS[currentLang];

  banner.innerHTML = `

    <div>

      <span
        style="
          color:var(--text-muted);
          font-size:.75rem;
        "
      >
        ${t.formMaterialName}
      </span>

      <h4
        style="
          font-size:1.05rem;
          color:var(--gold-primary);
          font-weight:800;
        "
      >
        ${escapeHTML(name || '')}
        (${escapeHTML(
          product.nameEn || ''
        )})
      </h4>

      <p
        style="
          font-size:.75rem;
          color:var(--text-muted);
        "
      >
        ${escapeHTML(
          product.origin || ''
        )}
        •
        ${escapeHTML(
          product.finish || ''
        )}
      </p>

    </div>

    <div
      style="
        width:34px;
        height:34px;
        border-radius:6px;
        background:${product.textureGrad || '#111827'};
        border:1px solid var(--border-gold);
        flex-shrink:0;
      "
    ></div>

  `;

}


/* =========================================================
   31. BOQ UPLOAD
   ========================================================= */

function handleBOQUploadSimulation(
  event
) {

  const file =
    event?.target?.files?.[0];

  const badge =
    document.getElementById(
      'boqUploadedBadge'
    );

  if (!file) {
    return;
  }

  attachedBOQFile =
    file;

  if (badge) {

    badge.style.display =
      'inline-block';

    badge.textContent =
      `✓ تم تجهيز الملف للرفع الآمن: ${file.name}`;

  }

}


/* =========================================================
   32. SUBMIT RFQ
   ========================================================= */

async function submitQuoteForm(
  event
) {

  if (event) {
    event.preventDefault();
  }

  const reference =
    document
      .getElementById(
        'rfqRefDisplay'
      )
      ?.textContent ||
    generateRFQReference();

  const customerName =
    getInputValue('custName');

  const customerPhone =
    getInputValue('custPhone');

  const projectCity =
    getInputValue('custCity');

  const quantity =
    getInputValue('custQuantity');

  const application =
    getInputValue('custApp');

  const thickness =
    getInputValue('custThickness');

  const waterjet =
    getInputValue('custWaterjet');

  const notes =
    getInputValue('custNotes');

  if (
    !customerName ||
    !customerPhone ||
    !projectCity
  ) {

    alert(
      currentLang === 'ar'
        ? 'يرجى إدخال الاسم ورقم الجوال والمدينة لإتمام طلب عرض السعر.'
        : 'Please fill in Name, Mobile Number, and City.'
    );

    return;

  }

  const materialName =
    selectedProductForQuote
      ? `${selectedProductForQuote.nameAr} (${selectedProductForQuote.nameEn || ''}) - ${selectedProductForQuote.origin || ''}`
      : 'طلب استشارة وتوريد عام';

  /* Backend */

  if (
    typeof window.PrimeAPI !==
      'undefined' &&
    typeof window.PrimeAPI.submitRFQ ===
      'function'
  ) {

    try {

      await window.PrimeAPI.submitRFQ(

        {
          rfqRef:
            reference,

          customerName:
            customerName,

          customerPhone:
            customerPhone,

          projectCity:
            projectCity,

          quantity:
            quantity,

          application:
            application,

          thickness:
            thickness,

          waterjet:
            waterjet,

          notes:
            notes,

          selectedMaterialId:
            selectedProductForQuote
              ? selectedProductForQuote.id
              : null,

          selectedMaterialName:
            materialName
        },

        attachedBOQFile

      );

    } catch (error) {

      console.error(
        '[Prime Scope] RFQ backend error:',
        error
      );

    }

  }


  /* WhatsApp */

  let message = '';

  if (currentLang === 'ar') {

    message =
      `السلام عليكم ورحمة الله وبركاته،

طلب عرض سعر رسمي مخصص عبر منصة *Prime Scope*:

🏷️ *الرقم المرجعي للطلب:* ${reference}

🏛️ *الخامة المطلوبة:* ${materialName}

👤 *اسم العميل / الشركة:* ${customerName}

📱 *رقم الجوال:* ${customerPhone}

📍 *موقع المشروع / المدينة:* ${projectCity}

📐 *الكمية التقديرية:* ${quantity || 'حسب المخطط'}

🏢 *نوع الاستخدام:* ${application || 'أرضيات'}

📏 *السماكة:* ${thickness || '2 سم'}

⚙️ *أعمال الووترجيت:* ${waterjet || 'قياسي'}

📝 *ملاحظات إضافية:* ${notes || 'لا يوجد'}

يرجى مراجعة المواصفات وإرسال عرض السعر المعتمد.

شكراً لكم.`;

  } else {

    message =
      `Hello Prime Scope Engineering Sales Desk,

Formal RFQ Submission:

🏷️ *RFQ Reference ID:* ${reference}

🏛️ *Material:* ${materialName}

👤 *Client / Organization:* ${customerName}

📱 *Mobile Number:* ${customerPhone}

📍 *Project City:* ${projectCity}

📐 *Quantity:* ${quantity || 'As per BOQ'}

🏢 *Application:* ${application || 'Flooring'}

📏 *Thickness:* ${thickness || '2 cm'}

⚙️ *Waterjet Works:* ${waterjet || 'Standard'}

📝 *Notes:* ${notes || 'None'}

Please provide pricing and delivery lead time.

Thank you.`;

  }


  const salesPhone =
    window.PRIME_CONFIG?.SALES_PHONE ||
    '966534248861';

  const whatsappURL =
    `https://api.whatsapp.com/send?phone=${encodeURIComponent(
      salesPhone
    )}&text=${encodeURIComponent(
      message
    )}`;

  window.open(
    whatsappURL,
    '_blank',
    'noopener,noreferrer'
  );

  closeQuoteModal();

}


/* =========================================================
   33. ORDER TRACKER
   ========================================================= */

async function trackOrderStatus() {

  const input =
    document.getElementById(
      'trackerInput'
    );

  const display =
    document.getElementById(
      'trackerStatusDisplay'
    );

  if (!input || !display) {
    return;
  }

  const code =
    input.value
      .trim()
      .toUpperCase();

  if (!code) {

    alert(
      currentLang === 'ar'
        ? 'يرجى إدخال الرقم المرجعي للطلب.'
        : 'Please enter the RFQ Reference ID.'
    );

    return;
  }

  display.style.display =
    'block';

  display.innerHTML = `
    <div
      style="
        color:var(--gold-primary);
        text-align:center;
        padding:1rem;
      "
    >
      ⏳
      ${
        currentLang === 'ar'
          ? 'جارٍ الاستعلام من قاعدة البيانات...'
          : 'Checking database...'
      }
    </div>
  `;

  let result = null;

  if (
    typeof window.PrimeAPI !==
      'undefined' &&
    typeof window.PrimeAPI.trackRFQ ===
      'function'
  ) {

    try {

      result =
        await window.PrimeAPI.trackRFQ(
          code
        );

    } catch (error) {

      console.error(
        '[Prime Scope] Tracker error:',
        error
      );

    }

  }

  const statusMapAr = {

    received:
      'تم استلام الطلب وتوزيع المواصفات للمكتب الفني 📋',

    reviewing:
      'قيد المراجعة الفنية وتدقيق الكميات بالمحجر ⏳',

    ready:
      'عرض السعر وجدول التوريد جاهز للإرسال ✅',

    completed:
      'تم التوريد والتسليم بنجاح ✨'

  };

  const statusMapEn = {

    received:
      'Request received and specifications assigned to technical office 📋',

    reviewing:
      'Under technical review and quantity verification ⏳',

    ready:
      'Quotation and supply schedule are ready ✅',

    completed:
      'Supply and delivery completed successfully ✨'

  };

  const status =
    result?.data?.status;

  const statusMap =
    currentLang === 'ar'
      ? statusMapAr
      : statusMapEn;

  const statusText =
    statusMap[status] ||
    (
      currentLang === 'ar'
        ? 'قيد التسعير الفني والتدقيق ⏳'
        : 'Under technical pricing and review ⏳'
    );

  display.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:.75rem;
        flex-wrap:wrap;
        gap:.5rem;
      "
    >

      <h4
        style="
          font-weight:800;
          color:var(--gold-primary);
        "
      >
        ${
          currentLang === 'ar'
            ? 'طلب رقم:'
            : 'Request:'
        }
        ${escapeHTML(code)}
      </h4>

      <span class="ai-match-badge">
        ${statusText}
      </span>

    </div>

    <div
      style="
        font-size:.85rem;
        color:var(--text-muted);
        line-height:1.6;
      "
    >

      <p>
        ✅
        ${
          currentLang === 'ar'
            ? 'تم تسجيل الطلب ومطابقة الخامات المحددة مع المحجر المصدر.'
            : 'Request registered and materials matched with source.'
        }
      </p>

      <p>
        ⏳
        ${
          currentLang === 'ar'
            ? 'يتم حالياً إعداد كشف المقاسات وتكاليف الشحن لموقع مشروعك.'
            : 'Measurements and shipping costs are currently being prepared.'
        }
      </p>

      <p>
        📞
        ${
          currentLang === 'ar'
            ? 'للتواصل الفوري المباشر مع المهندس المشرف:'
            : 'For direct contact with the supervising engineer:'
        }

        <strong
          style="color:var(--gold-primary);"
        >
          0534248861
        </strong>

      </p>

    </div>

  `;

}


/* =========================================================
   34. EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  /* Search */

  const searchInput =
    document.getElementById(
      'searchInput'
    );

  let searchTimeout = null;

  if (searchInput) {

    searchInput.addEventListener(
      'input',
      event => {

        clearTimeout(
          searchTimeout
        );

        searchTimeout =
          setTimeout(() => {

            searchQuery =
              event.target.value;

            visibleCount =
              PAGE_SIZE;

            renderProducts();

          }, 150);

      }
    );

  }


  /* Type */

  const typeSelect =
    document.getElementById(
      'filterTypeSelect'
    );

  if (typeSelect) {

    typeSelect.addEventListener(
      'change',
      event => {

        filterType =
          event.target.value;

        visibleCount =
          PAGE_SIZE;

        renderProducts();

      }
    );

  }


  /* Color */

  const colorSelect =
    document.getElementById(
      'filterColorSelect'
    );

  if (colorSelect) {

    colorSelect.addEventListener(
      'change',
      event => {

        filterColor =
          event.target.value;

        visibleCount =
          PAGE_SIZE;

        renderProducts();

      }
    );

  }


  /* Price */

  const priceSelect =
    document.getElementById(
      'filterPriceSelect'
    );

  if (priceSelect) {

    priceSelect.addEventListener(
      'change',
      event => {

        filterPrice =
          event.target.value;

        visibleCount =
          PAGE_SIZE;

        renderProducts();

      }
    );

  }


  /* AI Enter */

  const aiInput =
    document.getElementById(
      'aiInput'
    );

  if (aiInput) {

    aiInput.addEventListener(
      'keydown',
      event => {

        if (
          event.key ===
          'Enter'
        ) {

          event.preventDefault();

          sendAIMessage();

        }

      }
    );

  }


  /* Tracker Enter */

  const trackerInput =
    document.getElementById(
      'trackerInput'
    );

  if (trackerInput) {

    trackerInput.addEventListener(
      'keydown',
      event => {

        if (
          event.key ===
          'Enter'
        ) {

          event.preventDefault();

          trackOrderStatus();

        }

      }
    );

  }

}


/* =========================================================
   35. MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

  const modalMappings = [

    [
      'stoneDetailModal',
      closeStoneDetail
    ],

    [
      'comparisonModal',
      closeComparisonModal
    ],

    [
      'projectModal',
      closeProjectModal
    ],

    [
      'quoteModal',
      closeQuoteModal
    ]

  ];

  modalMappings.forEach(
    ([id, closeFunction]) => {

      const modal =
        document.getElementById(id);

      if (!modal) return;

      modal.addEventListener(
        'click',
        event => {

          if (
            event.target ===
            modal
          ) {

            closeFunction();

          }

        }
      );

    }
  );

}


/* =========================================================
   36. KEYBOARD SUPPORT
   ========================================================= */

function setupKeyboardEvents() {

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key !==
        'Escape'
      ) {
        return;
      }

      closeStoneDetail();
      closeComparisonModal();
      closeProjectModal();
      closeQuoteModal();

    }
  );

}


/* =========================================================
   37. UTILITY FUNCTIONS
   ========================================================= */

function getInputValue(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    return '';
  }

  return String(
    element.value || ''
  ).trim();

}


/* HTML Escape */

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* Attribute Escape */

function escapeAttribute(value) {

  return escapeHTML(
    value
  );

}


/* AI Markdown */

function formatAIText(text) {

  return escapeHTML(
    text
  ).replace(
    /\*\*(.*?)\*\*/g,
    '<strong>$1</strong>'
  );

}


/* Safe Async */

function awaitSafe(
  promise
) {

  Promise.resolve(
    promise
  ).catch(
    error => {

      console.warn(
        '[Prime Scope] Background operation failed:',
        error
      );

    }
  );

}


/* =========================================================
   38. GLOBAL API
   =========================================================
   These are intentionally exposed globally because
   the HTML uses onclick="..." handlers.
   ========================================================= */

window.toggleLanguage =
  toggleLanguage;

window.selectCategory =
  selectCategory;

window.resetAllFilters =
  resetAllFilters;

window.loadMoreProducts =
  loadMoreProducts;

window.openStoneDetail =
  openStoneDetail;

window.closeStoneDetail =
  closeStoneDetail;

window.applyStoneToCalculator =
  applyStoneToCalculator;

window.askAIAboutStone =
  askAIAboutStone;

window.toggleCompareStone =
  toggleCompareStone;

window.openComparisonModal =
  openComparisonModal;

window.closeComparisonModal =
  closeComparisonModal;

window.clearComparison =
  clearComparison;

window.requestQuoteForComparedStones =
  requestQuoteForComparedStones;

window.renderProjects =
  renderProjects;

window.filterProjects =
  filterProjects;

window.openProjectModal =
  openProjectModal;

window.closeProjectModal =
  closeProjectModal;

window.selectWizardOption =
  selectWizardOption;

window.nextWizardStep =
  nextWizardStep;

window.prevWizardStep =
  prevWizardStep;

window.calculateAIRecommendations =
  calculateAIRecommendations;

window.resetAIWizard =
  resetAIWizard;

window.sendAIMessage =
  sendAIMessage;

window.addCalcZone =
  addCalcZone;

window.removeCalcZone =
  removeCalcZone;

window.recalculateZones =
  recalculateZones;

window.applyCalcToQuote =
  applyCalcToQuote;

window.openQuoteModal =
  openQuoteModal;

window.closeQuoteModal =
  closeQuoteModal;

window.handleBOQUploadSimulation =
  handleBOQUploadSimulation;

window.submitQuoteForm =
  submitQuoteForm;

window.trackOrderStatus =
  trackOrderStatus;


/* =========================================================
   END OF PRIME SCOPE APP.JS
   ========================================================= */
