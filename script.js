/**
 * KATALOG VILLA TRETES - APPLICATION INTERACTIVE LOGIC (SEWA KAMARAN)
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
      billiard: false,
      karaoke: false,
      mountainView: false
    },
    bookmarks: JSON.parse(localStorage.getItem('villa_bookmarks') || '[]'),
    activeVilla: null,
    activeRoomIndex: 0
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
      if (window.VILLAS_DATA && Array.isArray(window.VILLAS_DATA) && window.VILLAS_DATA.length > 0) {
        state.villas = window.VILLAS_DATA;
        state.filteredVillas = [...state.villas];
        applyFiltersAndRender();
        return;
      }

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
          <h3>Gagal Memuat Data Penginapan</h3>
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

  // Helper to get minimum room price
  function getMinRoomPrice(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 0;
    return Math.min(...v.roomTypes.map(r => r.priceWeekday));
  }

  // Helper to get maximum room price
  function getMaxRoomPrice(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 0;
    return Math.max(...v.roomTypes.map(r => r.priceWeekday));
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
        v.description.toLowerCase().includes(query) ||
        (v.roomTypes && v.roomTypes.some(r => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)))
      );
    }

    // 2. Category Filter
    if (state.currentCategory !== 'ALL') {
      result = result.filter(v => v.category === state.currentCategory);
    }

    // 3. Amenity Toggles Filter
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
      result.sort((a, b) => getMinRoomPrice(a) - getMinRoomPrice(b));
    } else if (state.sortOption === 'PRICE_HIGH') {
      result.sort((a, b) => getMaxRoomPrice(b) - getMaxRoomPrice(a));
    } else if (state.sortOption === 'RATING') {
      result.sort((a, b) => b.rating - a.rating);
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
      const minPrice = getMinRoomPrice(v);
      const roomTypesCount = v.roomTypes ? v.roomTypes.length : 0;
      
      let categoryBadgeClass = 'badge-gold';
      if (v.category === 'Modern') categoryBadgeClass = 'badge-cyan';
      if (v.category === 'Classic') categoryBadgeClass = 'badge-emerald';

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
                <i class="ri-hotel-bed-fill"></i>
                <span>${roomTypesCount} Tipe Kamar</span>
              </div>
              <div class="spec-item">
                <i class="ri-checkbox-circle-fill"></i>
                <span>${v.amenities.length} Fasilitas</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="price-label">Mulai Dari</span>
                <span class="price-amount">${formatIDR(minPrice)} <small>/ malam</small></span>
              </div>

              <button class="btn-card-action" onclick="openVillaModal('${v.id}')">
                <span>Lihat Kamar</span>
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

  // Open Interactive Room & Villa Detail Modal
  window.openVillaModal = function(villaId) {
    const villa = state.villas.find(v => v.id === villaId);
    if (!villa) return;
    state.activeVilla = villa;
    state.activeRoomIndex = 0;

    renderModalContent();

    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Render Content inside Modal for Active Room
  function renderModalContent() {
    const villa = state.activeVilla;
    if (!villa || !villa.roomTypes || villa.roomTypes.length === 0) return;

    const currentRoom = villa.roomTypes[state.activeRoomIndex] || villa.roomTypes[0];
    const roomImages = (currentRoom.images && currentRoom.images.length > 0) ? currentRoom.images : villa.images;

    modalDynamicContent.innerHTML = `
      <!-- Property Overview Header -->
      <div style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
        <span class="badge badge-gold" style="margin-bottom: 0.5rem;">${villa.category} Penginapan</span>
        <h2 class="modal-title" style="margin-top: 0.25rem;">${villa.name}</h2>
        <div class="modal-tagline">${villa.tagline}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">
          <i class="ri-map-pin-2-fill" style="color: var(--accent-gold);"></i> ${villa.location}
        </div>
      </div>

      <!-- ROOM TYPES SELECTOR TABS -->
      <div class="room-selector-wrapper">
        <label style="font-size: 0.85rem; font-weight: 700; color: var(--accent-gold); text-transform: uppercase; display: block; margin-bottom: 0.5rem;">
          <i class="ri-hotel-bed-line"></i> Pilih Tipe Kamar:
        </label>
        <div class="room-tabs-list">
          ${villa.roomTypes.map((rt, idx) => `
            <button class="room-tab-btn ${idx === state.activeRoomIndex ? 'active' : ''}" onclick="switchRoomTab(${idx})">
              <span>${rt.name}</span>
              <small style="display:block; font-size: 0.75rem; opacity: 0.85;">${formatIDR(rt.priceWeekday)}/malam</small>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- GALLERY FOR ACTIVE ROOM -->
      <div class="modal-gallery-main" style="margin-top: 1.25rem;">
        <img id="modalMainImg" src="${roomImages[0]}" alt="${currentRoom.name}">
      </div>

      ${roomImages.length > 1 ? `
        <div class="modal-thumbnails">
          ${roomImages.map((img, idx) => `
            <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchModalGallery('${img}', this)">
              <img src="${img}" alt="Gallery ${idx}">
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="modal-body-content" style="margin-top: 1.5rem;">
        <div class="modal-main-info">
          <!-- Room Title & Specs -->
          <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-bold);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--accent-gold);">${currentRoom.name}</h3>
              <span class="badge badge-cyan">${currentRoom.bedType || 'Kasur Premium'}</span>
            </div>

            <div class="modal-specs-grid">
              <div class="modal-spec-card">
                <i class="ri-group-fill"></i>
                <strong>${currentRoom.capacity} Orang</strong>
                <span>Kapasitas Kamar</span>
              </div>
              <div class="modal-spec-card">
                <i class="ri-hotel-bed-fill"></i>
                <strong>${currentRoom.bedType || '1 King Bed'}</strong>
                <span>Tipe Tempat Tidur</span>
              </div>
              <div class="modal-spec-card">
                <i class="ri-drop-fill"></i>
                <strong>${currentRoom.bathrooms || 1} Kamar</strong>
                <span>Kamar Mandi Dalam</span>
              </div>
              <div class="modal-spec-card">
                <i class="ri-money-dollar-circle-line"></i>
                <strong>${formatIDR(currentRoom.priceWeekday)}</strong>
                <span>Tarif Weekday</span>
              </div>
            </div>
          </div>

          <!-- Room Specific Description -->
          <div style="margin-top: 1.25rem;">
            <h4 style="font-family: var(--font-heading); margin-bottom: 0.5rem; font-size: 1.1rem; color: var(--text-primary);">
              <i class="ri-file-text-line" style="color: var(--accent-gold);"></i> Deskripsi Tipe Kamar Ini
            </h4>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              ${currentRoom.description || 'Kamar nyaman dengan pemandangan sejuk pegunungan Tretes.'}
            </p>
          </div>

          <!-- Room Amenities -->
          <div style="margin-top: 1.25rem;">
            <h4 style="font-family: var(--font-heading); margin-bottom: 0.75rem; font-size: 1.1rem;">Fasilitas Dalam Kamar</h4>
            <div class="modal-amenities-list">
              ${(currentRoom.amenities || villa.amenities).map(item => `
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
            <i class="ri-calculator-line" style="color: var(--accent-gold);"></i> Hitung Sewa Kamar Ini
          </div>

          <div class="calc-input-group">
            <label for="modalRoomSelect">Tipe Kamar Dipilih</label>
            <select id="modalRoomSelect" class="calc-select" onchange="switchRoomSelect(this.value)">
              ${villa.roomTypes.map((rt, idx) => `
                <option value="${idx}" ${idx === state.activeRoomIndex ? 'selected' : ''}>${rt.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="calc-input-group">
            <label for="modalDayType">Tipe Hari</label>
            <select id="modalDayType" class="calc-select" onchange="updateModalPrice()">
              <option value="weekday" data-price="${currentRoom.priceWeekday}">Weekday (Hari Kerja) - ${formatIDR(currentRoom.priceWeekday)}/malam</option>
              <option value="weekend" data-price="${currentRoom.priceWeekend}">Weekend (Sabtu/Minggu) - ${formatIDR(currentRoom.priceWeekend)}/malam</option>
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
              <strong id="modalRatePerNight">${formatIDR(currentRoom.priceWeekday)}</strong>
            </div>
            <div class="summary-row">
              <span>Durasi:</span>
              <strong id="modalNightCount">1 Malam</strong>
            </div>
            <div class="summary-row total">
              <span>Total Estimasi:</span>
              <strong id="modalTotalPrice">${formatIDR(currentRoom.priceWeekday)}</strong>
            </div>
          </div>

          <button class="btn-wa-modal-submit" onclick="submitWaBooking()">
            <i class="ri-whatsapp-fill" style="font-size: 1.3rem;"></i>
            <span>Booking Kamar via WhatsApp</span>
          </button>
          
          <div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 0.75rem;">
            <i class="ri-shield-check-line"></i> Konfirmasi Instan ke Admin Official
          </div>
        </div>
      </div>
    `;
  }

  // Switch Room Tab
  window.switchRoomTab = function(roomIdx) {
    state.activeRoomIndex = roomIdx;
    renderModalContent();
  };

  // Switch Room Select Dropdown in Calculator
  window.switchRoomSelect = function(roomIdxStr) {
    state.activeRoomIndex = parseInt(roomIdxStr, 10);
    renderModalContent();
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

  // Submit Pre-filled WhatsApp Booking Message with Selected Room Type
  window.submitWaBooking = function() {
    if (!state.activeVilla) return;
    const currentRoom = state.activeVilla.roomTypes[state.activeRoomIndex] || state.activeVilla.roomTypes[0];

    const dayTypeSelect = document.getElementById('modalDayType');
    const nightsSelect = document.getElementById('modalNights');
    const totalElem = document.getElementById('modalTotalPrice');

    const dayTypeText = dayTypeSelect.options[dayTypeSelect.selectedIndex].text;
    const nightsText = `${nightsSelect.value} Malam`;
    const totalCost = totalElem.textContent;

    const message = `Halo Admin VillaTretes, saya berminat untuk sewa kamar berikut:\n\n` +
      `🏨 *${state.activeVilla.name}*\n` +
      `🛏️ *Tipe Kamar: ${currentRoom.name}*\n` +
      `📍 Lokasi: ${state.activeVilla.location}\n` +
      `📅 Tipe Hari: ${dayTypeText}\n` +
      `⏳ Durasi: ${nightsText}\n` +
      `💰 Estimasi Biaya: ${totalCost}\n\n` +
      `Mohon konfirmasi ketersediaan kamar & prosedur DP nya. Terima kasih!`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/6285536581733?text=${encodedMsg}`;

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
  if (filterBilliard) {
    filterBilliard.addEventListener('change', (e) => {
      state.amenityFilters.billiard = e.target.checked;
      applyFiltersAndRender();
    });
  }
  if (filterKaraoke) {
    filterKaraoke.addEventListener('change', (e) => {
      state.amenityFilters.karaoke = e.target.checked;
      applyFiltersAndRender();
    });
  }
  if (filterMountainView) {
    filterMountainView.addEventListener('change', (e) => {
      state.amenityFilters.mountainView = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Reset Filters Function
  window.resetFilters = function() {
    state.searchQuery = '';
    state.currentCategory = 'ALL';
    state.sortOption = 'DEFAULT';
    state.amenityFilters = { billiard: false, karaoke: false, mountainView: false };

    searchInput.value = '';
    categorySelect.value = 'ALL';
    sortSelect.value = 'DEFAULT';

    if (filterBilliard) filterBilliard.checked = false;
    if (filterKaraoke) filterKaraoke.checked = false;
    if (filterMountainView) filterMountainView.checked = false;

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
