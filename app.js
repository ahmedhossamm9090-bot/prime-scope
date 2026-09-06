// Prime Scope - Architectural Enterprise Application Controller (Version 2.0 Full-Stack)

// Application State
let currentLang = 'ar';
let activeCategory = 'all';
let filterType = 'all';
let filterColor = 'all';
let filterPrice = 'all';
let searchQuery = '';
let visibleCount = 12;
const PAGE_SIZE = 12;

// In-Memory Cached State (Populated dynamically from Supabase API / Fallback)
let appCategories = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
let appMaterials = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
let appProjects = typeof PRIME_PROJECTS !== 'undefined' ? PRIME_PROJECTS : [];

// Comparison State
let comparisonList = [];

// AI Advisor State
let aiWizardData = {
  projectType: 'villa',
  surfaceArea: 'flooring',
  budgetTier: 'premium',
  stylePref: 'modern'
};

// Selected product for RFQ
let selectedProductForQuote = null;
let attachedBOQFile = null;

// Multi-Zone Calculator State
let calcZones = [
  { id: 1, name: 'الصالة الرئيسية والمجالس', length: 12, width: 8, pieces: 1, wastage: 0.10 }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupLanguage();
  renderCategories();
  renderFilterOptions();
  renderProducts();
  renderProjects('all');
  setupEventListeners();
  renderMultiZoneCalculator();
  renderComparisonDock();

  // Asynchronous Data Synchronization from Supabase
  await loadDynamicData();
});

// Load Dynamic Data from Supabase API Service
async function loadDynamicData() {
  if (typeof window.PrimeAPI !== 'undefined') {
    try {
      const [cats, mats, projs] = await Promise.all([
        window.PrimeAPI.getCategories(),
        window.PrimeAPI.getMaterials(),
        window.PrimeAPI.getProjects()
      ]);

      if (cats && cats.length > 0) appCategories = cats;
      if (mats && mats.length > 0) appMaterials = mats;
      if (projs && projs.length > 0) appProjects = projs;

      // Re-render components with synchronized data
      renderCategories();
      renderProducts();
      renderProjects('all');
    } catch (err) {
      console.log("ℹ️ [Prime Scope] Using cached local database dataset.");
    }
  }
}

// Setup Translations & Direction
function setupLanguage() {
  const t = TRANSLATIONS[currentLang];
  document.body.className = `lang-${currentLang}`;
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerHTML = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });

  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = t.langToggle;
}

// Toggle Language
function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  setupLanguage();
  renderCategories();
  renderFilterOptions();
  renderProducts();
  renderProjects('all');
  renderComparisonDock();
}

// Render Category Filter Tabs
function renderCategories() {
  const container = document.getElementById('categoriesScroll');
  if (!container) return;

  container.innerHTML = appCategories.map(cat => {
    const name = currentLang === 'ar' ? cat.nameAr : cat.nameEn;
    const isActive = cat.id === activeCategory;
    return `
      <button class="cat-btn ${isActive ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
        <span>${cat.icon || '💎'}</span>
        <span>${name}</span>
      </button>
    `;
  }).join('');
}

function selectCategory(catId) {
  activeCategory = catId;
  visibleCount = PAGE_SIZE;
  renderCategories();
  renderProducts();
}

// Render Precision Filter Dropdown Options
function renderFilterOptions() {
  const typeSelect = document.getElementById('filterTypeSelect');
  const colorSelect = document.getElementById('filterColorSelect');
  if (!typeSelect || !colorSelect) return;

  typeSelect.innerHTML = STONE_TYPES.map(t => {
    const label = currentLang === 'ar' ? t.nameAr : t.nameEn;
    return `<option value="${t.id}">${label}</option>`;
  }).join('');

  colorSelect.innerHTML = COLOR_GROUPS.map(c => {
    const label = currentLang === 'ar' ? c.nameAr : c.nameEn;
    return `<option value="${c.id}">${label}</option>`;
  }).join('');
}

// Reset All Filters
function resetAllFilters() {
  activeCategory = 'all';
  filterType = 'all';
  filterColor = 'all';
  filterPrice = 'all';
  searchQuery = '';
  
  const searchInput = document.getElementById('searchInput');
  const typeSelect = document.getElementById('filterTypeSelect');
  const colorSelect = document.getElementById('filterColorSelect');
  const priceSelect = document.getElementById('filterPriceSelect');

  if (searchInput) searchInput.value = '';
  if (typeSelect) typeSelect.value = 'all';
  if (colorSelect) colorSelect.value = 'all';
  if (priceSelect) priceSelect.value = 'all';

  visibleCount = PAGE_SIZE;
  renderCategories();
  renderProducts();
}

// Filter and Render Products Grid
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCountDisplay');
  const loadMoreWrap = document.getElementById('loadMoreContainer');
  if (!grid) return;

  const q = searchQuery.toLowerCase().trim();

  const filtered = appMaterials.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchType = filterType === 'all' || item.stoneType === filterType;
    const matchColor = filterColor === 'all' || item.colorGroup === filterColor;
    const matchPrice = filterPrice === 'all' || (item.priceCategory && item.priceCategory.includes(filterPrice));
    const matchSearch = !q || 
      (item.nameAr && item.nameAr.toLowerCase().includes(q)) || 
      (item.nameEn && item.nameEn.toLowerCase().includes(q)) || 
      (item.origin && item.origin.toLowerCase().includes(q)) || 
      (item.color && item.color.toLowerCase().includes(q)) || 
      (item.usage && item.usage.toLowerCase().includes(q));

    return matchCat && matchType && matchColor && matchPrice && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    const t = TRANSLATIONS[currentLang];
    grid.innerHTML = `
      <div class="no-results-card">
        <div class="no-results-icon">🔍</div>
        <h3>${t.noResultsTitle}</h3>
        <p>${t.noResultsText}</p>
        <button class="btn-primary" style="margin-top: 1rem;" onclick="resetAllFilters()">${t.filterResetBtn}</button>
      </div>
    `;
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    return;
  }

  const visibleItems = filtered.slice(0, visibleCount);

  grid.innerHTML = visibleItems.map(product => {
    const name = currentLang === 'ar' ? product.nameAr : product.nameEn;
    const subName = currentLang === 'ar' ? product.nameEn : product.nameAr;
    const type = currentLang === 'ar' ? product.typeAr : product.typeEn;
    const usage = currentLang === 'ar' ? product.usage : product.usageEn;
    const t = TRANSLATIONS[currentLang];
    const isCompared = comparisonList.some(item => item.id === product.id);

    return `
      <div class="product-card">
      <div
  class="card-sample"
  style="background: ${
    product.images && product.images.length
      ? url('${product.images[0]}') center/cover no-repeat
      : product.textureGrad || 'linear-gradient(135deg,#222,#555)'
  };"
  onclick="openStoneDetail('${product.id}')"
>
          <span class="sample-badge">${product.priceCategory || 'مميز'}</span>
          <button class="btn-compare-card ${isCompared ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompareStone('${product.id}')">
            ${isCompared ? t.btnCompareAdded : '+ ' + t.btnCompareAdd}
          </button>
          <div class="sample-origin">
            <span>📍</span>
            <span>${product.origin}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title-wrap">
            <h3 class="card-title" onclick="openStoneDetail('${product.id}')" style="cursor: pointer;">${name}</h3>
          </div>
          <div class="card-subtitle">${subName} • ${type || 'رخام فاخر'}</div>
          <div class="card-color-desc">${product.color || ''}</div>
          
          <div class="card-specs">
            <div class="spec-row">
              <span class="spec-label">${t.compStrengthLabel}</span>
              <span class="spec-val">${product.compressiveStrength || '135 MPa'}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">${t.finishLabel}</span>
              <span class="spec-val">${product.finish || 'لامع'}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">${t.usageLabel}</span>
              <span class="spec-val" style="font-size: 0.72rem;">${usage || ''}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-card-quote" onclick="openQuoteModal('${product.id}')">
              <span>📋</span>
              <span>${t.btnRequestThis}</span>
            </button>
            <button class="btn-card-details" onclick="openStoneDetail('${product.id}')">
              <span>🔍 ${t.btnDetails}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Handle Load More
  if (loadMoreWrap) {
    if (visibleCount < filtered.length) {
      loadMoreWrap.style.display = 'block';
      const remaining = filtered.length - visibleCount;
     const btnText = currentLang === 'ar'
  ? عرض المزيد من الخامات (${remaining} خامة متبقية) ⬇️
  : Load More Materials (${remaining} remaining) ⬇️;
      loadMoreWrap.innerHTML = `
        <button class="btn-load-more" onclick="loadMoreProducts()">
          ${btnText}
        </button>
      `;
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }
}

function loadMoreProducts() {
  visibleCount += PAGE_SIZE;
  renderProducts();
}

// ==========================================
// 1. Stone Detail Modal (v2.0)
// ==========================================
function openStoneDetail(productId) {
  const product = appMaterials.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('stoneDetailModal');
  const body = document.getElementById('stoneDetailBody');
  if (!modal || !body) return;

  const name = currentLang === 'ar' ? product.nameAr : product.nameEn;
  const subName = currentLang === 'ar' ? product.nameEn : product.nameAr;
  const type = currentLang === 'ar' ? product.typeAr : product.typeEn;
  const usage = currentLang === 'ar' ? product.usage : product.usageEn;
  const t = TRANSLATIONS[currentLang];
  const isCompared = comparisonList.some(item => item.id === product.id);

  body.innerHTML = `
    <div class="stone-detail-grid">
      <div>
        <div class="stone-gallery-preview" style="background: ${product.textureGrad};">
          <span class="sample-badge">${product.priceCategory || 'VIP'}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
          <div style="height: 65px; border-radius: 8px; border: 1px solid var(--border-gold); background: ${product.textureGrad};" title="Slab View"></div>
          <div style="height: 65px; border-radius: 8px; border: 1px solid var(--border-gold); background: radial-gradient(circle, ${product.colorCode || '#fff'} 0%, #0f172a 90%);" title="Macro Veining"></div>
          <div style="height: 65px; border-radius: 8px; border: 1px solid var(--border-gold); background: linear-gradient(to right, #0a0d14, ${product.colorCode || '#d4af37'});" title="Architecture Mockup"></div>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn-primary" style="width: 100%; margin-bottom: 0.5rem;" onclick="openQuoteModal('${product.id}'); closeStoneDetail();">
            <span>📋</span> ${t.btnRequestThis}
          </button>
          <button class="btn-secondary" style="width: 100%;" onclick="toggleCompareStone('${product.id}'); renderProducts();">
            <span>⚖️</span> ${isCompared ? t.btnCompareAdded : t.btnCompareAdd}
          </button>
        </div>
      </div>

      <div>
        <div style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--gold-primary);">${name}</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${subName} • ${type || 'رخام طبيعي'} • 📍 ${product.origin}</p>
          <p style="font-size: 0.85rem; color: var(--text-main); margin-top: 0.4rem;">${product.color || ''}</p>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--gold-primary);">${t.stoneTechSpecs}</h4>
        <table class="tech-specs-table">
          <tr>
            <th>${t.compStrengthLabel}</th>
            <td>${product.compressiveStrength || '135 MPa'}</td>
          </tr>
          <tr>
            <th>${t.densityLabel}</th>
            <td>${product.density || '2700 kg/m³'}</td>
          </tr>
          <tr>
            <th>${t.waterAbsorbLabel}</th>
            <td>${product.waterAbsorption || '0.15%'}</td>
          </tr>
          <tr>
            <th>${t.durabilityScoreLabel}</th>
            <td>${'⭐'.repeat(Math.round(product.durabilityScore || 4.5))} (${product.durabilityScore || 4.5} / 5.0)</td>
          </tr>
          <tr>
            <th>${t.maintenanceLabel}</th>
            <td>${product.maintenanceTier || 'متوسطة'}</td>
          </tr>
          <tr>
            <th>${t.availableFinishesLabel}</th>
            <td>${product.finish || 'لامع / مطفي'}</td>
          </tr>
          <tr>
            <th>${t.availableThicknessLabel}</th>
            <td>${t.availableThicknessVal}</td>
          </tr>
          <tr>
            <th>${t.idealApplicationsLabel}</th>
            <td>${usage || ''}</td>
          </tr>
        </table>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn-secondary" style="flex: 1; font-size: 0.8rem;" onclick="applyStoneToCalculator('${product.id}')">
            ${t.btnCalculateForThis}
          </button>
          <button class="btn-secondary" style="flex: 1; font-size: 0.8rem;" onclick="askAIAboutStone('${product.nameAr}')">
            ${t.btnAskAIAboutThis}
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStoneDetail() {
  const modal = document.getElementById('stoneDetailModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function applyStoneToCalculator(productId) {
  closeStoneDetail();
  const calcSection = document.getElementById('calculator');
  if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
}

function askAIAboutStone(stoneName) {
  closeStoneDetail();
  const aiSection = document.getElementById('consultant');
  if (aiSection) {
    aiSection.scrollIntoView({ behavior: 'smooth' });
    sendAIMessage(`أخبرني عن مميزات واستخدامات خامة ${stoneName} وأفضل الأماكن لتركيبها.`);
  }
}

// ==========================================
// 2. Comparison Manager
// ==========================================
function toggleCompareStone(productId) {
  const prod = appMaterials.find(p => p.id === productId);
  if (!prod) return;

  const idx = comparisonList.findIndex(item => item.id === productId);
  if (idx > -1) {
    comparisonList.splice(idx, 1);
  } else {
    if (comparisonList.length >= 4) {
      alert(currentLang === 'ar' ? 'الحد الأقصى للمقارنة هو 4 خامات في نفس الوقت.' : 'Maximum 4 stones can be compared simultaneously.');
      return;
    }
    comparisonList.push(prod);
  }

  renderComparisonDock();
}

function renderComparisonDock() {
  const dock = document.getElementById('comparisonDock');
  const countEl = document.getElementById('compareCountDisplay');
  const listEl = document.getElementById('dockStonesList');
  if (!dock) return;

  if (comparisonList.length > 0) {
    dock.classList.add('active');
    if (countEl) countEl.textContent = comparisonList.length;
    if (listEl) {
      listEl.innerHTML = comparisonList.map(item => `
        <div class="dock-stone-chip" style="background: ${item.textureGrad};" title="${item.nameAr}"></div>
      `).join('');
    }
  } else {
    dock.classList.remove('active');
  }
}

function openComparisonModal() {
  if (comparisonList.length === 0) return;

  const modal = document.getElementById('comparisonModal');
  const body = document.getElementById('comparisonTableBody');
  if (!modal || !body) return;

  const t = TRANSLATIONS[currentLang];

  body.innerHTML = `
    <div class="comparison-table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>${t.compareColProp}</th>
            ${comparisonList.map(p => `
              <th>
                <div style="font-size: 0.95rem; font-weight: 800;">${currentLang === 'ar' ? p.nameAr : p.nameEn}</div>
                <small style="color: var(--text-muted);">${p.origin}</small>
                <div style="margin-top: 0.4rem;">
                  <button style="background: rgba(239,68,68,0.2); border: none; color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; cursor: pointer;" onclick="toggleCompareStone('${p.id}'); openComparisonModal(); renderProducts();">✕</button>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.filterTypeLabel}</td>
            ${comparisonList.map(p => `<td>${currentLang === 'ar' ? p.typeAr : p.typeEn}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.filterPriceLabel}</td>
            ${comparisonList.map(p => `<td><strong style="color: var(--gold-primary);">${p.priceCategory || 'VIP'}</strong></td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.compStrengthLabel}</td>
            ${comparisonList.map(p => `<td>${p.compressiveStrength || '135 MPa'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.densityLabel}</td>
            ${comparisonList.map(p => `<td>${p.density || '2700 kg/m³'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.waterAbsorbLabel}</td>
            ${comparisonList.map(p => `<td>${p.waterAbsorption || '0.15%'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.durabilityScoreLabel}</td>
            ${comparisonList.map(p => `<td>${'⭐'.repeat(Math.round(p.durabilityScore || 4.5))} (${p.durabilityScore || 4.5})</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.maintenanceLabel}</td>
            ${comparisonList.map(p => `<td>${p.maintenanceTier || 'متوسطة'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.availableFinishesLabel}</td>
            ${comparisonList.map(p => `<td>${p.finish || 'لامع'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 800; color: var(--gold-primary);">${t.idealApplicationsLabel}</td>
            ${comparisonList.map(p => `<td style="font-size: 0.75rem;">${currentLang === 'ar' ? p.usage : p.usageEn}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: space-between; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;">
      <button class="btn-secondary" onclick="comparisonList = []; renderComparisonDock(); closeComparisonModal(); renderProducts();">
        ${t.compareClearAll}
      </button>
      <button class="btn-primary" onclick="requestQuoteForComparedStones()">
        ${t.compareRequestAll}
      </button>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function requestQuoteForComparedStones() {
  closeComparisonModal();
  const names = comparisonList.map(p => p.nameAr).join(' + ');
  openQuoteModal();
  const notesField = document.getElementById('custNotes');
  if (notesField) {
    notesField.value = `طلب مقارنة وتسعير للخامات التالية: ${names}`;
  }
}

// ==========================================
// 3. Projects Showcase Gallery
// ==========================================
function renderProjects(filterCategory = 'all') {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const filtered = appProjects.filter(p => filterCategory === 'all' || p.category === filterCategory);

  grid.innerHTML = filtered.map(proj => {
    const title = currentLang === 'ar' ? proj.titleAr : proj.titleEn;
    const cat = currentLang === 'ar' ? proj.categoryAr : proj.categoryEn;
    const loc = currentLang === 'ar' ? proj.locationAr : proj.locationEn;
    const scope = currentLang === 'ar' ? proj.scopeAr : proj.scopeEn;
    const t = TRANSLATIONS[currentLang];

    const stonesHtml = (proj.stonesUsed || []).map(sId => {
      const stone = appMaterials.find(p => p.id === sId);
      if (!stone) return '';
      const sName = currentLang === 'ar' ? stone.nameAr : stone.nameEn;
      return `<button class="stone-pill-link" onclick="openStoneDetail('${stone.id}')">${sName}</button>`;
    }).join('');

    return `
      <div class="project-card">
        <div class="project-hero-sample" style="background: ${proj.heroGrad};">
          <span class="proj-badge">${cat}</span>
        </div>
        <div class="project-body">
          <h3 class="project-title">${title}</h3>
          <div class="project-location">📍 ${loc} • 📐 ${proj.area}</div>
          <p class="project-scope">${scope}</p>
          
          <div class="project-stones-used">
            <label>${t.projStonesLabel}</label>
            <div class="stone-pill-links">${stonesHtml}</div>
          </div>

          <button class="btn-view-project" onclick="openProjectModal('${proj.id}')">
            ${t.btnViewProject} 🏛️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterProjects(category, btnEl) {
  document.querySelectorAll('.proj-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderProjects(category);
}

function openProjectModal(projectId) {
  const proj = appProjects.find(p => p.id === projectId);
  if (!proj) return;

  const modal = document.getElementById('projectModal');
  const body = document.getElementById('projectModalBody');
  if (!modal || !body) return;

  const title = currentLang === 'ar' ? proj.titleAr : proj.titleEn;
  const loc = currentLang === 'ar' ? proj.locationAr : proj.locationEn;
  const scope = currentLang === 'ar' ? proj.scopeAr : proj.scopeEn;

  body.innerHTML = `
    <div style="height: 200px; border-radius: var(--radius-md); background: ${proj.heroGrad}; margin-bottom: 1.25rem; border: 1px solid var(--border-gold);"></div>
    <h2 style="font-size: 1.35rem; font-weight: 900; color: var(--gold-primary); margin-bottom: 0.35rem;">${title}</h2>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">📍 ${loc} • المساحة: ${proj.area}</p>
    <div style="background: #0a0d14; border: 1px solid var(--border-gold); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
      <h4 style="font-size: 0.9rem; color: var(--gold-primary); margin-bottom: 0.3rem;">نطاق التوريد والتركيب:</h4>
      <p style="font-size: 0.85rem; color: var(--text-main);">${scope}</p>
    </div>
    <button class="btn-primary" style="width: 100%;" onclick="openQuoteModal(); closeProjectModal();">
      طلب تسعير لمشروع مماثل 📋
    </button>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ==========================================
// 4. Guided AI Stone Advisor (v2.0)
// ==========================================
let currentWizardStep = 1;

function selectWizardOption(key, value, btnEl) {
  aiWizardData[key] = value;
  const parent = btnEl.closest('.ai-options-grid');
  if (parent) {
    parent.querySelectorAll('.ai-opt-btn').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');
  }
}

function nextWizardStep() {
  if (currentWizardStep < 4) {
    document.getElementById(`aiStep${currentWizardStep}`).classList.remove('active');
    currentWizardStep++;
    document.getElementById(`aiStep${currentWizardStep}`).classList.add('active');
  }
}

function prevWizardStep() {
  if (currentWizardStep > 1) {
    document.getElementById(`aiStep${currentWizardStep}`).classList.remove('active');
    currentWizardStep--;
    document.getElementById(`aiStep${currentWizardStep}`).classList.add('active');
  }
}

function calculateAIRecommendations() {
  document.getElementById(`aiStep4`).classList.remove('active');
  const resultsContainer = document.getElementById('aiResultsContainer');
  const resultsList = document.getElementById('aiRecommendationsList');
  if (!resultsContainer || !resultsList) return;

  resultsContainer.style.display = 'block';

  let topMatches = [];

  if (aiWizardData.surfaceArea === 'facade') {
    topMatches = [
      { id: 'rs-4', score: 99, rationale: 'حجر نساح الأبيض الطبيعي يوفر أعلى عزل حراري ومقاومة استثنائية للمناخ الصحراوي.' },
      { id: 'rs-1', score: 96, rationale: 'حجر الرياض الأبيض يعكس أشعة الشمس بكفاءة ومثالي للواجهات المودرن والكلاسيك.' },
      { id: 'tr-26', score: 93, rationale: 'الترافرتين التركي يمنح الواجهات مظهراً معمارياً فاخراً مع مسامية عازلة.' }
    ];
  } else if (aiWizardData.surfaceArea === 'kitchen') {
    topMatches = [
      { id: 'in-1', score: 99, rationale: 'جرانيت جالاكسي هندي يتمتع بأعلى صلابة (240 MPa) ومقاومة تامة للحرارة والزيوت.' },
      { id: 'sa-2', score: 97, rationale: 'جرانيت نجران بلاك فائق الصلابة ومقاوم للبقع والخدوش للاستخدام الشاق.' },
      { id: 'tr-7', score: 92, rationale: 'فانتازي براون يجمع بين جمال الرخام وقوة تحمل الجرانيت العالية.' }
    ];
  } else {
    if (aiWizardData.budgetTier === 'ultra') {
      topMatches = [
        { id: 'it-3', score: 98, rationale: 'كالاكاتا جولد بعروقه الذهبية وبوكماتش المتناظر هو الاختيار الأول لقصور النخبة.' },
        { id: 'gr-1', score: 96, rationale: 'ثاسوس سوبر وايت هو الأنقى عالمياً بلونه الثلجي الناصع بدون أي عروق.' },
        { id: 'it-4', score: 94, rationale: 'كالاكاتا فيولا يضفي طابعاً فخماً وجريئاً للمغاسل ومداخل الضيوف.' }
      ];
    } else {
      topMatches = [
        { id: 'gr-2', score: 97, rationale: 'فولاكاس اليوناني يوفر مظهر الرخام الأبيض الفاخر بتكلفة ممتازة ومثالي للأرضيات.' },
        { id: 'es-3', score: 95, rationale: 'كريما مارفيل الإسباني يمنح دفئاً وتجانساً متكاملاً في المساحات الكبيرة.' },
        { id: 'tr-4', score: 92, rationale: 'تندرا جراي السحابي هو الرخام الرمادي الأكثر طلباً في التصاميم المودرن.' }
      ];
    }
  }

  const t = TRANSLATIONS[currentLang];

  resultsList.innerHTML = topMatches.map(match => {
    const stone = appMaterials.find(p => p.id === match.id);
    if (!stone) return '';
    const name = currentLang === 'ar' ? stone.nameAr : stone.nameEn;

    return `
      <div class="ai-rec-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--gold-primary);">${name} (${stone.origin})</h4>
          <span class="ai-match-badge">${match.score}% ${t.aiMatchScore}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted);"><strong style="color: var(--gold-primary);">${t.aiWhyThisStone}</strong> ${match.rationale}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <button class="btn-card-quote" style="flex: 1;" onclick="openQuoteModal('${stone.id}')">
            طلب عرض سعر لهذه الخامة 📋
          </button>
          <button class="btn-card-details" onclick="openStoneDetail('${stone.id}')">
            عرض المواصفات 🔍
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Log to Supabase AI requests telemetry
  if (typeof window.PrimeAPI !== 'undefined') {
    window.PrimeAPI.logAIRequest({
      query: `Wizard: ${aiWizardData.projectType} / ${aiWizardData.surfaceArea} / ${aiWizardData.budgetTier} / ${aiWizardData.stylePref}`,
      response: topMatches.map(m => m.id).join(', '),
      projectType: aiWizardData.projectType,
      surfaceArea: aiWizardData.surfaceArea,
      budgetTier: aiWizardData.budgetTier,
      stylePref: aiWizardData.stylePref
    });
  }
}

function resetAIWizard() {
  document.getElementById('aiResultsContainer').style.display = 'none';
  currentWizardStep = 1;
  document.querySelectorAll('.ai-wizard-step').forEach(step => step.classList.remove('active'));
  document.getElementById('aiStep1').classList.add('active');
}

// Free Conversational AI Chat
function sendAIMessage(presetText = null) {
  const input = document.getElementById('aiInput');
  const chatBody = document.getElementById('aiChatBody');
  if (!chatBody) return;

  const query = presetText || input?.value.trim();
  if (!query) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'ai-msg user';
  userDiv.textContent = query;
  chatBody.appendChild(userDiv);

  if (input && !presetText) input.value = '';

  const qLower = query.toLowerCase();
  let replyText = 'خامات الرخام والحجر الطبيعي المعتمدة متوفرة لدينا بأعلى معايير الجودة العالمية. يمكنك الضغط على "طلب عرض سعر" للحصول على جدول كميات وتوريد فوري لموقع مشروعك عبر الواتساب.';

  if (qLower.includes('واجه') || qLower.includes('حجر') || qLower.includes('نساح')) {
    replyText = 'لواجهات الفلل والقصور بالرياض والمملكة، نوصي فوراً بـ **حجر نساح الطبيعي الفاخر** و**حجر الرياض الأبيض والكريمي** لعزلها الحراري الممتاز وتناسقها الرائع.';
  } else if (qLower.includes('مطبخ') || qLower.includes('كاونتر') || qLower.includes('جالاكسي')) {
    replyText = 'لأسطح وجزر المطابخ شديدة التحمل، **جرانيت جالاكسي الهندي** و**جرانيت نجران بلاك** و**فانتازي براون** هي الأقوى عالمياً في مقاومة الحرارة والزيوت.';
  } else if (qLower.includes('مجلس') || qLower.includes('ابيض') || qLower.includes('كالاكاتا')) {
    replyText = 'للمجالس والصالات الملكية، نوصي بـ **كالاكاتا جولد الإيطالي (Calacatta Gold)** بنظام بوكماتش أو **رخام ثاسوس اليوناني (Thassos White)** لنقائه المطلق.';
  }

  setTimeout(() => {
    const botDiv = document.createElement('div');
    botDiv.className = 'ai-msg bot';
    botDiv.innerHTML = replyText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chatBody.appendChild(botDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 250);

  chatBody.scrollTop = chatBody.scrollHeight;
}

// ==========================================
// 5. Multi-Zone Area Calculator
// ==========================================
function renderMultiZoneCalculator() {
  const container = document.getElementById('calcZonesContainer');
  if (!container) return;

  container.innerHTML = calcZones.map((z, idx) => `
    <div class="calc-zone-item">
      <div class="calc-group">
        <label>اسم المنطقة / الغرفة:</label>
        <input type="text" class="calc-input" value="${z.name}" oninput="calcZones[${idx}].name = this.value; recalculateZones();">
      </div>
      <div class="calc-group">
        <label>الطول (م):</label>
        <input type="number" class="calc-input" value="${z.length}" step="0.1" oninput="calcZones[${idx}].length = parseFloat(this.value)||0; recalculateZones();">
      </div>
      <div class="calc-group">
        <label>العرض (م):</label>
        <input type="number" class="calc-input" value="${z.width}" step="0.1" oninput="calcZones[${idx}].width = parseFloat(this.value)||0; recalculateZones();">
      </div>
      <div class="calc-group">
        <label>نسبة الهدر:</label>
        <select class="calc-input" onchange="calcZones[${idx}].wastage = parseFloat(this.value); recalculateZones();">
          <option value="0.05" ${z.wastage === 0.05 ? 'selected' : ''}>5% (قص مستقيم)</option>
          <option value="0.10" ${z.wastage === 0.10 ? 'selected' : ''}>10% (زوايا وديكورات)</option>
          <option value="0.15" ${z.wastage === 0.15 ? 'selected' : ''}>15% (بوكماتش/ووترجيت)</option>
        </select>
      </div>
      <div>
        ${calcZones.length > 1 ? `<button class="btn-remove-zone" onclick="removeCalcZone(${idx})">✕</button>` : ''}
      </div>
    </div>
  `).join('');

  recalculateZones();
}

function addCalcZone() {
  calcZones.push({
    id: Date.now(),
    name: `منطقة إضافية #${calcZones.length + 1}`,
    length: 6,
    width: 4,
    pieces: 1,
    wastage: 0.10
  });
  renderMultiZoneCalculator();
}

function removeCalcZone(index) {
  calcZones.splice(index, 1);
  renderMultiZoneCalculator();
}

function recalculateZones() {
  let netTotal = 0;
  let grossTotal = 0;

  calcZones.forEach(z => {
    const net = (z.length || 0) * (z.width || 0) * (z.pieces || 1);
    const gross = net * (1 + (z.wastage || 0.1));
    netTotal += net;
    grossTotal += gross;
  });

  const netEl = document.getElementById('calcNetDisplay');
  const grossEl = document.getElementById('calcTotalDisplay');

  if (netEl) netEl.textContent = netTotal.toFixed(2);
  if (grossEl) grossEl.textContent = grossTotal.toFixed(2);
}

function applyCalcToQuote() {
  const grossTotal = document.getElementById('calcTotalDisplay')?.textContent || '100';
  const qtyInput = document.getElementById('custQuantity');
  const notesInput = document.getElementById('custNotes');

  if (qtyInput) qtyInput.value = `${grossTotal} م² (محسوبة هندسياً مع الهدر)`;
  
  if (notesInput && calcZones.length > 1) {
    const zonesSummary = calcZones.map(z => `${z.name}: ${(z.length * z.width).toFixed(1)}م²`).join(' | ');
    notesInput.value = `تفصيل المناطق: ${zonesSummary}`;
  }

  openQuoteModal();
}

// ==========================================
// 6. Enhanced RFQ & Order Tracker (Full-Stack Integrated)
// ==========================================
function openQuoteModal(productId = null) {
  const modal = document.getElementById('quoteModal');
  if (!modal) return;

  if (productId) {
    selectedProductForQuote = appMaterials.find(p => p.id === productId);
  } else if (!selectedProductForQuote && appMaterials.length > 0) {
    selectedProductForQuote = appMaterials[0];
  }

  // Generate RFQ Reference ID
  const rfqRef = `PS-RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const refDisplay = document.getElementById('rfqRefDisplay');
  if (refDisplay) refDisplay.textContent = rfqRef;

  updateSelectedProductBanner(selectedProductForQuote);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuoteModal() {
  const modal = document.getElementById('quoteModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function updateSelectedProductBanner(product) {
  const banner = document.getElementById('selectedProductBanner');
  if (!banner || !product) return;

  const name = currentLang === 'ar' ? product.nameAr : product.nameEn;
  const t = TRANSLATIONS[currentLang];

  banner.innerHTML = `
    <div>
      <span style="color: var(--text-muted); font-size: 0.75rem;">${t.formMaterialName}</span>
      <h4 style="font-size: 1.05rem; color: var(--gold-primary); font-weight: 800;">${name} (${product.nameEn || ''})</h4>
      <p style="font-size: 0.75rem; color: var(--text-muted);">${product.origin || ''} • ${product.finish || ''}</p>
    </div>
    <div style="width: 34px; height: 34px; border-radius: 6px; background: ${product.textureGrad}; border: 1px solid var(--border-gold); flex-shrink: 0;"></div>
  `;
}

function handleBOQUploadSimulation(event) {
  const file = event.target.files[0];
  const badge = document.getElementById('boqUploadedBadge');
  if (file && badge) {
    attachedBOQFile = file;
    badge.style.display = 'inline-block';
    badge.textContent = `✓ تم تجهيز الملف للرفع الآمن: ${file.name}`;
  }
}

async function submitQuoteForm(e) {
  if (e) e.preventDefault();

  const rfqRef = document.getElementById('rfqRefDisplay')?.textContent || `PS-RFQ-${new Date().getFullYear()}-0001`;
  const customerName = document.getElementById('custName')?.value.trim();
  const customerPhone = document.getElementById('custPhone')?.value.trim();
  const projectCity = document.getElementById('custCity')?.value.trim();
  const quantity = document.getElementById('custQuantity')?.value.trim();
  const application = document.getElementById('custApp')?.value;
  const thickness = document.getElementById('custThickness')?.value;
  const waterjet = document.getElementById('custWaterjet')?.value;
  const notes = document.getElementById('custNotes')?.value.trim();

  if (!customerName || !customerPhone || !projectCity) {
    alert(currentLang === 'ar' ? 'يرجى إدخال الاسم ورقم الجوال والمدينة لإتمام طلب عرض السعر.' : 'Please fill in Name, Mobile Number, and City.');
    return;
  }

  const matName = selectedProductForQuote 
    ? `${selectedProductForQuote.nameAr} (${selectedProductForQuote.nameEn || ''}) - ${selectedProductForQuote.origin || ''}`
    : 'طلب استشارة وتوريد عام';

  // 1. Submit to Supabase Backend
  if (typeof window.PrimeAPI !== 'undefined') {
    await window.PrimeAPI.submitRFQ({
      rfqRef: rfqRef,
      customerName: customerName,
      customerPhone: customerPhone,
      projectCity: projectCity,
      quantity: quantity,
      application: application,
      thickness: thickness,
      waterjet: waterjet,
      notes: notes,
      selectedMaterialId: selectedProductForQuote ? selectedProductForQuote.id : null,
      selectedMaterialName: matName
    }, attachedBOQFile);
  }

  // 2. Format and Dispatch WhatsApp Link
  let message = "";

  if (currentLang === 'ar') {
    message = `السلام عليكم ورحمة الله وبركاته،
طلب عرض سعر رسمي مخصص عبر منصة *Prime Scope*:

🏷️ *الرقم المرجعي للطلب:* ${rfqRef}
🏛️ *الخامة المطلوبة:* ${matName}
👤 *اسم العميل / الشركة:* ${customerName}
📱 *رقم الجوال:* ${customerPhone}
📍 *موقع المشروع / المدينة:* ${projectCity}
📐 *الكمية التقديرية:* ${quantity || 'حسب المخطط'}
🏢 *نوع الاستخدام:* ${application || 'أرضيات'}
📏 *السماكة:* ${thickness || '2 سم'}
⚙️ *أعمال الووترجيت:* ${waterjet || 'قياسي'}
📝 *ملاحظات إضافية:* ${notes || 'لا يوجد'}

يرجى مراجعة المواصفات وإرسال عرض السعر المعتمد. شكراً لكم.`;
  } else {
    message = `Hello Prime Scope Engineering Sales Desk,
Formal RFQ Submission:

🏷️ *RFQ Reference ID:* ${rfqRef}
🏛️ *Material:* ${matName}
👤 *Client / Organization:* ${customerName}
📱 *Mobile Number:* ${customerPhone}
📍 *Project City:* ${projectCity}
📐 *Quantity:* ${quantity || 'As per BOQ'}
🏢 *Application:* ${application || 'Flooring'}
📏 *Thickness:* ${thickness || '2 cm'}
⚙️ *Waterjet Works:* ${waterjet || 'Standard'}
📝 *Notes:* ${notes || 'None'}

Please provide pricing and delivery lead time. Thank you.`;
  }

  const salesPhone = window.PRIME_CONFIG?.SALES_PHONE || "966534248861";
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${salesPhone}&text=${encodedMsg}`;

  window.open(waUrl, '_blank');
  closeQuoteModal();
}

// Order Status Tracker Lookup
async function trackOrderStatus() {
  const input = document.getElementById('trackerInput');
  const display = document.getElementById('trackerStatusDisplay');
  if (!input || !display) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    alert(currentLang === 'ar' ? 'يرجى إدخال الرقم المرجعي للطلب.' : 'Please enter the RFQ Reference ID.');
    return;
  }

  display.style.display = 'block';
  display.innerHTML = `<div style="color: var(--gold-primary); text-align: center; padding: 1rem;">⏳ جارٍ الاستعلام من قاعدة البيانات...</div>`;

  let result = null;
  if (typeof window.PrimeAPI !== 'undefined') {
    result = await window.PrimeAPI.trackRFQ(code);
  }

  const statusMap = {
    received: 'تم استلام الطلب وتوزيع المواصفات للمكتب الفني 📋',
    reviewing: 'قيد المراجعة الفنية وتدقيق الكميات بالمحجر ⏳',
    ready: 'عرض السعر وجدول التوريد جاهز للإرسال ✅',
    completed: 'تم التوريد والتسليم بنجاح ✨'
  };

  const statusText = result && result.data && statusMap[result.data.status] 
    ? statusMap[result.data.status] 
    : 'قيد التسعير الفني والتدقيق ⏳';

  display.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <h4 style="font-weight: 800; color: var(--gold-primary);">طلب رقم: ${code}</h4>
      <span class="ai-match-badge">${statusText}</span>
    </div>
    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
      <p>✅ تم تسجيل الطلب ومطابقة الخامات المحددة مع المحجر المصدر.</p>
      <p>⏳ يتم حالياً إعداد كشف المقاسات وتكاليف الشحن المؤمن لموقع مشروعك.</p>
      <p>📞 للتواصل الفوري المباشر مع المهندس المشرف: <strong style="color: var(--gold-primary);">0534248861</strong></p>
    </div>
  `;
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  let debounceTimeout;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        visibleCount = PAGE_SIZE;
        renderProducts();
      }, 150);
    });
  }

  const typeSelect = document.getElementById('filterTypeSelect');
  const colorSelect = document.getElementById('filterColorSelect');
  const priceSelect = document.getElementById('filterPriceSelect');

  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      filterType = e.target.value;
      visibleCount = PAGE_SIZE;
      renderProducts();
    });
  }

  if (colorSelect) {
    colorSelect.addEventListener('change', (e) => {
      filterColor = e.target.value;
      visibleCount = PAGE_SIZE;
      renderProducts();
    });
  }

  if (priceSelect) {
    priceSelect.addEventListener('change', (e) => {
      filterPrice = e.target.value;
      visibleCount = PAGE_SIZE;
      renderProducts();
    });
  }
}
