/**
 * KATALOG VILLA TRETES - APPLICATION INTERACTIVE LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    villas: [],
    filteredVillas: [],
    currentCategory: 'ALL',
    searchQuery: '',
    sortOption: 'DEFAULT',
    amenityFilters: {
      pool: false,
      billiard: false,
      karaoke: false,
      mountainView: false
    },
    bookmarks: JSON.parse(localStorage.getItem('villa_bookmarks') || '[]'),
    activeVilla: null
  };

  // DOM Element References
  const villaGrid = document.getElementById('villaGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterBadge = document.getElementById('activeFilterBadge');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const sortSelect = document.getElementById('sortSelect');
  const btnResetFilter = document.getElementById('btnResetFilter');
  
  // Checkbox Filters
  const filterPool = document.getElementById('filterPool');
  const filterBilliard = document.getElementById('filterBilliard');
  const filterKaraoke = document.getElementById('filterKaraoke');
  const filterMountainView = document.getElementById('filterMountainView');
  
  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Modal Elements
  const detailModal = document.getElementById('detailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDynamicContent = document.getElementById('modalDynamicContent');

  // Site Header Scroll listener
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });

  // Mobile Hamburger Menu Handler
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = navMenu.classList.contains('active') ? 'ri-close-line' : 'ri-menu-line';
      }
    });

    // Close menu when clicking nav link
    const navLinksList = navMenu.querySelectorAll('a');
    navLinksList.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'ri-menu-line';
      });
    });
  }

  // Fetch / Load Villas Data
  async function loadData() {
    try {
      // 1. Direct JS Variable Fallback (Supports double-clicking index.html on file:// protocol without CORS errors)
      if (window.VILLAS_DATA && Array.isArray(window.VILLAS_DATA) && window.VILLAS_DATA.length > 0) {
        state.villas = window.VILLAS_DATA;
        state.filteredVillas = [...state.villas];
        applyFiltersAndRender();
        return;
      }

      // 2. HTTP Fetch Fallback (For web server environments)
      const response = await fetch('data.json');
      if (!response.ok) throw new Error('Gagal memuat data.json');
      state.villas = await response.json();
      state.filteredVillas = [...state.villas];
      applyFiltersAndRender();
    } catch (err) {
      console.error('Error loading villa data:', err);
      villaGrid.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line" style="color: var(--accent-gold);"></i>
          <h3>Gagal Memuat Data Villa</h3>
          <p>Pastikan berkas data.json atau villas-data.js tersedia.</p>
        </div>
      `;
    }
  }

  // Format Currency (IDR)
  function formatIDR(number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  }

  // Apply Filters & Sorting
  function applyFiltersAndRender() {
    let result = [...state.villas];

    // 1. Search Query Filter
    if (state.searchQuery.trim() !== '') {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query) ||
        v.tagline.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (state.currentCategory !== 'ALL') {
      result = result.filter(v => v.category === state.currentCategory);
    }

    // 3. Amenity Toggles Filter
    if (state.amenityFilters.pool) {
      result = result.filter(v => v.hasPool || v.amenities.some(a => a.toLowerCase().includes('pool')));
    }
    if (state.amenityFilters.billiard) {
      result = result.filter(v => v.amenities.some(a => a.toLowerCase().includes('biliar')));
    }
    if (state.amenityFilters.karaoke) {
      result = result.filter(v => v.amenities.some(a => a.toLowerCase().includes('karaoke')));
    }
    if (state.amenityFilters.mountainView) {
      result = result.filter(v => v.amenities.some(a => a.toLowerCase().includes('view gunung')));
    }

    // 4. Sorting Logic
    if (state.sortOption === 'PRICE_LOW') {
      result.sort((a, b) => a.priceWeekday - b.priceWeekday);
    } else if (state.sortOption === 'PRICE_HIGH') {
      result.sort((a, b) => b.priceWeekday - a.priceWeekday);
    } else if (state.sortOption === 'RATING') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (state.sortOption === 'CAPACITY') {
      result.sort((a, b) => b.capacity - a.capacity);
    }

    state.filteredVillas = result;

    // Update Counts & Badge
    resultsCount.textContent = result.length;
    let badgeText = state.currentCategory === 'ALL' ? 'Menampilkan Semua' : `Kategori: ${state.currentCategory}`;
    if (state.searchQuery) badgeText += ` | Cari: "${state.searchQuery}"`;
    activeFilterBadge.textContent = badgeText;

    // Render Grid
    renderGrid(result);
  }

  // Render Villa Cards Grid
  function renderGrid(villas) {
    if (villas.length === 0) {
      villaGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    villaGrid.style.display = 'grid';

    villaGrid.innerHTML = villas.map(v => {
      const isBookmarked = state.bookmarks.includes(v.id);
      
      // Determine Badge Theme Class
      let categoryBadgeClass = 'badge-gold';
      if (v.category === 'Modern') categoryBadgeClass = 'badge-cyan';
      if (v.category === 'Family') categoryBadgeClass = 'badge-emerald';

      return `
        <article class="villa-card">
          <div class="card-media">
            <img src="${v.images[0]}" alt="${v.name}" loading="lazy">
            <span class="badge ${categoryBadgeClass} card-category-badge">${v.category}</span>
            
            <button class="card-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    onclick="event.stopPropagation(); toggleBookmark('${v.id}')" 
                    title="Simpan Favorit">
              <i class="${isBookmarked ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
            </button>

            <div class="card-rating-overlay">
              <i class="ri-star-fill"></i>
              <span>${v.rating.toFixed(2)} (${v.reviewsCount})</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-location">
              <i class="ri-map-pin-2-fill"></i> ${v.location}
            </div>

            <h3 class="card-title">${v.name}</h3>
            <p class="card-tagline">${v.tagline}</p>

            <div class="card-specs">
              <div class="spec-item">
                <i class="ri-group-fill"></i>
                <span>${v.capacity} Tamu</span>
              </div>
              <div class="spec-item">
                <i class="ri-hotel-bed-fill"></i>
                <span>${v.bedrooms} Kamar</span>
              </div>
              <div class="spec-item">
                <i class="ri-drop-fill"></i>
                <span>${v.bathrooms} KM</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="price-label">Mulai Dari</span>
                <span class="price-amount">${formatIDR(v.priceWeekday)} <small>/ malam</small></span>
              </div>

              <button class="btn-card-action" onclick="openVillaModal('${v.id}')">
                <span>Detail & Sewa</span>
                <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Toggle Bookmark in LocalStorage
  window.toggleBookmark = function(villaId) {
    if (state.bookmarks.includes(villaId)) {
      state.bookmarks = state.bookmarks.filter(id => id !== villaId);
    } else {
      state.bookmarks.push(villaId);
    }
    localStorage.setItem('villa_bookmarks', JSON.stringify(state.bookmarks));
    applyFiltersAndRender();
  };

  // Open Interactive Villa Detail Modal
  window.openVillaModal = function(villaId) {
    const villa = state.villas.find(v => v.id === villaId);
    if (!villa) return;
    state.activeVilla = villa;

    // Build Modal Layout
    modalDynamicContent.innerHTML = `
      <div class="modal-gallery-main">
        <img id="modalMainImg" src="${villa.images[0]}" alt="${villa.name}">
      </div>

      <div class="modal-thumbnails">
        ${villa.images.map((img, idx) => `
          <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchModalGallery('${img}', this)">
            <img src="${img}" alt="Gallery ${idx}">
          </div>
        `).join('')}
      </div>

      <div class="modal-body-content">
        <div class="modal-main-info">
          <div>
            <span class="badge badge-gold" style="margin-bottom: 0.5rem;">${villa.category} Villa</span>
            <h2 class="modal-title">${villa.name}</h2>
            <div class="modal-tagline">${villa.tagline}</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">
              <i class="ri-map-pin-2-fill" style="color: var(--accent-gold);"></i> ${villa.location}
            </div>
          </div>

          <div class="modal-specs-grid">
            <div class="modal-spec-card">
              <i class="ri-group-fill"></i>
              <strong>${villa.capacity} Orang</strong>
              <span>Kapasitas</span>
            </div>
            <div class="modal-spec-card">
              <i class="ri-hotel-bed-fill"></i>
              <strong>${villa.bedrooms} Kamar</strong>
              <span>Kamar Tidur</span>
            </div>
            <div class="modal-spec-card">
              <i class="ri-drop-fill"></i>
              <strong>${villa.bathrooms} Kamar</strong>
              <span>Kamar Mandi</span>
            </div>
            <div class="modal-spec-card">
              <i class="ri-water-flash-fill"></i>
              <strong>${villa.hasPool ? 'Ada' : 'Tidak'}</strong>
              <span>Private Pool</span>
            </div>
          </div>

          <div>
            <h4 style="font-family: var(--font-heading); margin-bottom: 0.5rem; font-size: 1.1rem;">Deskripsi Villa</h4>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7;">${villa.description}</p>
          </div>

          <div>
            <h4 style="font-family: var(--font-heading); margin-bottom: 0.75rem; font-size: 1.1rem;">Fasilitas Lengkap</h4>
            <div class="modal-amenities-list">
              ${villa.amenities.map(item => `
                <div class="amenity-pill">
                  <i class="ri-checkbox-circle-fill"></i>
                  <span>${item}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Interactive Price & Booking Calculator -->
        <div class="modal-side-panel">
          <div class="calc-title">
            <i class="ri-calculator-line" style="color: var(--accent-gold);"></i> Hitung Estimasi Sewa
          </div>

          <div class="calc-input-group">
            <label for="modalDayType">Tipe Hari</label>
            <select id="modalDayType" class="calc-select" onchange="updateModalPrice()">
              <option value="weekday" data-price="${villa.priceWeekday}">Weekday (Hari Kerja) - ${formatIDR(villa.priceWeekday)}/malam</option>
              <option value="weekend" data-price="${villa.priceWeekend}">Weekend (Sabtu/Minggu) - ${formatIDR(villa.priceWeekend)}/malam</option>
            </select>
          </div>

          <div class="calc-input-group">
            <label for="modalNights">Durasi Menginap (Malam)</label>
            <select id="modalNights" class="calc-select" onchange="updateModalPrice()">
              <option value="1">1 Malam</option>
              <option value="2">2 Malam</option>
              <option value="3">3 Malam</option>
              <option value="4">4 Malam</option>
              <option value="5">5+ Malam</option>
            </select>
          </div>

          <div class="calc-price-summary">
            <div class="summary-row">
              <span>Tarif Per Malam:</span>
              <strong id="modalRatePerNight">${formatIDR(villa.priceWeekday)}</strong>
            </div>
            <div class="summary-row">
              <span>Durasi:</span>
              <strong id="modalNightCount">1 Malam</strong>
            </div>
            <div class="summary-row total">
              <span>Total Estimasi:</span>
              <strong id="modalTotalPrice">${formatIDR(villa.priceWeekday)}</strong>
            </div>
          </div>

          <button class="btn-wa-modal-submit" onclick="submitWaBooking()">
            <i class="ri-whatsapp-fill" style="font-size: 1.3rem;"></i>
            <span>Booking via WhatsApp</span>
          </button>
          
          <div style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">
            <i class="ri-shield-check-line"></i> Respon Cepat & Garansi Unit Terverifikasi
          </div>
        </div>
      </div>
    `;

    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Switch Gallery Thumbnail Image
  window.switchModalGallery = function(imgSrc, thumbElem) {
    const mainImg = document.getElementById('modalMainImg');
    if (mainImg) mainImg.src = imgSrc;

    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
    if (thumbElem) thumbElem.classList.add('active');
  };

  // Update Price Breakdown dynamically inside Modal
  window.updateModalPrice = function() {
    const dayTypeSelect = document.getElementById('modalDayType');
    const nightsSelect = document.getElementById('modalNights');
    const rateElem = document.getElementById('modalRatePerNight');
    const nightCountElem = document.getElementById('modalNightCount');
    const totalElem = document.getElementById('modalTotalPrice');

    if (!dayTypeSelect || !nightsSelect || !state.activeVilla) return;

    const selectedOption = dayTypeSelect.options[dayTypeSelect.selectedIndex];
    const pricePerNight = parseInt(selectedOption.getAttribute('data-price'), 10);
    const nights = parseInt(nightsSelect.value, 10);
    const totalPrice = pricePerNight * nights;

    rateElem.textContent = formatIDR(pricePerNight);
    nightCountElem.textContent = `${nights} Malam`;
    totalElem.textContent = formatIDR(totalPrice);
  };

  // Submit Pre-filled WhatsApp Booking Message
  window.submitWaBooking = function() {
    if (!state.activeVilla) return;

    const dayTypeSelect = document.getElementById('modalDayType');
    const nightsSelect = document.getElementById('modalNights');
    const totalElem = document.getElementById('modalTotalPrice');

    const dayTypeText = dayTypeSelect.options[dayTypeSelect.selectedIndex].text;
    const nightsText = `${nightsSelect.value} Malam`;
    const totalCost = totalElem.textContent;

    const message = `Halo Admin VillaTretes, saya berminat untuk sewa villa berikut:\n\n` +
      `🏠 *${state.activeVilla.name}*\n` +
      `📍 Lokasi: ${state.activeVilla.location}\n` +
      `📅 Tipe Hari: ${dayTypeText}\n` +
      `⏳ Durasi: ${nightsText}\n` +
      `💰 Estimasi Biaya: ${totalCost}\n\n` +
      `Mohon konfirmasi ketersediaan tanggal & prosedur DP nya. Terima kasih!`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/6281234567890?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
  };

  // Close Modal Handler
  function closeModal() {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.classList.contains('active')) closeModal();
  });

  // Event Listeners for Filters
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyFiltersAndRender();
  });

  categorySelect.addEventListener('change', (e) => {
    state.currentCategory = e.target.value;
    // Sync tab pills UI
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === state.currentCategory);
    });
    applyFiltersAndRender();
  });

  sortSelect.addEventListener('change', (e) => {
    state.sortOption = e.target.value;
    applyFiltersAndRender();
  });

  // Category Tab Pills Click
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.getAttribute('data-category');
      categorySelect.value = state.currentCategory;
      applyFiltersAndRender();
    });
  });

  // Checkbox Amenities Listeners
  filterPool.addEventListener('change', (e) => {
    state.amenityFilters.pool = e.target.checked;
    applyFiltersAndRender();
  });
  filterBilliard.addEventListener('change', (e) => {
    state.amenityFilters.billiard = e.target.checked;
    applyFiltersAndRender();
  });
  filterKaraoke.addEventListener('change', (e) => {
    state.amenityFilters.karaoke = e.target.checked;
    applyFiltersAndRender();
  });
  filterMountainView.addEventListener('change', (e) => {
    state.amenityFilters.mountainView = e.target.checked;
    applyFiltersAndRender();
  });

  // Reset Filters Function
  window.resetFilters = function() {
    state.searchQuery = '';
    state.currentCategory = 'ALL';
    state.sortOption = 'DEFAULT';
    state.amenityFilters = { pool: false, billiard: false, karaoke: false, mountainView: false };

    searchInput.value = '';
    categorySelect.value = 'ALL';
    sortSelect.value = 'DEFAULT';

    filterPool.checked = false;
    filterBilliard.checked = false;
    filterKaraoke.checked = false;
    filterMountainView.checked = false;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabBtns[0].classList.add('active');

    applyFiltersAndRender();
  };

  btnResetFilter.addEventListener('click', resetFilters);

  // FAQ Accordion Listeners
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Initialize App Data
  loadData();
});
