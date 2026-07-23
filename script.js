/**
 * KATALOG VILLA TRETES - APPLICATION INTERACTIVE LOGIC (SEWA KAMARAN)
 */

// Configuration dinamis kontak WhatsApp admin resmi
const CONFIG = {
  waPhone: '6285536581733',
  waTextHeader: 'Halo Admin VillaTretes, saya ingin tanya informasi sewa villa'
};

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
      mountainView: false,
      bookmarks: false
    },
    bookmarks: JSON.parse(localStorage.getItem('villa_bookmarks') || '[]'),
    activeVilla: null,
    activeRoomIndex: 0,
    checkInDate: '',
    checkOutDate: ''
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
  
  // Tabs container
  const categoryTabsContainer = document.querySelector('.category-tabs');

  // Modal Elements
  const detailModal = document.getElementById('detailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDynamicContent = document.getElementById('modalDynamicContent');

  // Sync Categories from LocalStorage if added via Admin
  function syncDynamicCategories() {
    const saved = localStorage.getItem('admin_categories_list');
    if (!saved) return;
    try {
      const cats = JSON.parse(saved);
      if (!Array.isArray(cats) || cats.length === 0) return;

      // Update categorySelect dropdown
      if (categorySelect) {
        categorySelect.innerHTML = `<option value="ALL">Semua Kategori</option>` + 
          cats.map(c => `<option value="${c}">${c}</option>`).join('');
      }

      // Update Tabs
      if (categoryTabsContainer) {
        categoryTabsContainer.innerHTML = `<button class="tab-btn active" data-category="ALL"><i class="ri-grid-fill"></i> Semua Penginapan</button>` +
          cats.map(c => `<button class="tab-btn" data-category="${c}"><i class="ri-building-line"></i> ${c}</button>`).join('');

        // Re-attach listener
        categoryTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            categoryTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCategory = btn.getAttribute('data-category');
            if (categorySelect) categorySelect.value = state.currentCategory;
            applyFiltersAndRender();
          });
        });
      }
    } catch (e) {
      console.error('Error syncing categories in script.js:', e);
    }
  }

  // Dynamic WhatsApp URL syncing from CONFIG
  function syncWhatsAppLinks() {
    const waUrlHeader = `https://wa.me/${CONFIG.waPhone}?text=${encodeURIComponent(CONFIG.waTextHeader)}`;
    const headerCtaLink = document.querySelector('.btn-header-wa');
    if (headerCtaLink) headerCtaLink.href = waUrlHeader;

    const floatingWaBtn = document.querySelector('.floating-wa-btn');
    if (floatingWaBtn) floatingWaBtn.href = waUrlHeader;

    const footerWa = document.getElementById('footerWaContact');
    if (footerWa) {
      const formattedPhone = `+${CONFIG.waPhone.substring(0, 2)} ${CONFIG.waPhone.substring(2, 5)}-${CONFIG.waPhone.substring(5, 9)}-${CONFIG.waPhone.substring(9)}`;
      const footerWaSpan = footerWa.querySelector('span');
      if (footerWaSpan) footerWaSpan.textContent = `WhatsApp Admin: ${formattedPhone}`;
    }
  }

  // Mapping kata kunci fasilitas ke kelas ikon Remixicon
  function getAmenityIcon(name) {
    const text = name.toLowerCase();
    if (text.includes('biliar') || text.includes('billiard')) return 'ri-gamepad-line';
    if (text.includes('karaoke')) return 'ri-mic-line';
    if (text.includes('wifi')) return 'ri-wifi-line';
    if (text.includes('gunung') || text.includes('view gunung') || text.includes('mountain')) return 'ri-landscape-line';
    if (text.includes('pool') || text.includes('kolam') || text.includes('renang')) return 'ri-water-flash-line';
    if (text.includes('dapur') || text.includes('kitchen')) return 'ri-restaurant-line';
    if (text.includes('heaters') || text.includes('air hangat') || text.includes('hot water') || text.includes('heater') || text.includes('shower hot') || text.includes('hot shower')) return 'ri-temp-hot-line';
    if (text.includes('garasi') || text.includes('parkir') || text.includes('car') || text.includes('mobil')) return 'ri-car-fill';
    if (text.includes('tv') || text.includes('smart tv') || text.includes('cinema')) return 'ri-tv-2-line';
    if (text.includes('bbq') || text.includes('grill')) return 'ri-fire-line';
    if (text.includes('rooftop') || text.includes('sky')) return 'ri-building-line';
    if (text.includes('bed') || text.includes('kasur') || text.includes('kamar')) return 'ri-hotel-bed-line';
    if (text.includes('ac')) return 'ri-windy-line';
    if (text.includes('bathtub') || text.includes('jacuzzi')) return 'ri-hand-sanitizer-line';
    if (text.includes('aman') || text.includes('keamanan') || text.includes('security')) return 'ri-shield-user-line';
    if (text.includes('balkon') || text.includes('balcony')) return 'ri-door-open-line';
    return 'ri-checkbox-circle-fill';
  }

  // Mock ulasan pelanggan premium untuk social proof
  function getMockReviews(villaId, villaName) {
    const defaultReviews = [
      {
        name: "Budi Santoso",
        date: "Juni 2026",
        rating: "5.0",
        avatar: "B",
        text: `Kamar di ${villaName} sangat nyaman dan bersih. Udara dingin khas Tretes terasa segar sekali di balkon. Fasilitas hiburan lengkap.`
      },
      {
        name: "Rina Wijaya",
        date: "Juli 2026",
        rating: "4.8",
        avatar: "R",
        text: "Kamar mandi bersih dengan air hangat yang berfungsi normal. Adminnya ramah dan fast respon saat di-chat via WA."
      }
    ];

    const specificReviews = {
      'v-grand-arjuno': [
        {
          name: "Hendry Prasetyo",
          date: "Juli 2026",
          rating: "5.0",
          avatar: "H",
          text: "Pemandangan Gunung Arjuno dari balkon kamar Superior benar-benar menakjubkan di pagi hari! Kamar sangat luas dan bersih."
        },
        {
          name: "Siti Rahma",
          date: "Juni 2026",
          rating: "4.9",
          avatar: "S",
          text: "Menginap di tipe Family Room bersama anak-anak sangat memuaskan. Area dapurnya bersih dan perlengkapannya lengkap."
        }
      ],
      'v-black-diamond': [
        {
          name: "Kevin Sanjaya",
          date: "Mei 2026",
          rating: "5.0",
          avatar: "K",
          text: "Desain industrial hitamnya sangat elegan dan modern. Fasilitas cinema room & biliar 9ft benar-benar luar biasa untuk kumpul teman."
        },
        {
          name: "Amalia Putri",
          date: "Juni 2026",
          rating: "5.0",
          avatar: "A",
          text: "VIP Suite sangat mewah dengan bathtub privat. Suasana malam hari di dekat fire pit outdoor sangat hangat dan nyaman."
        }
      ],
      'v-pinus-horizon': [
        {
          name: "Dimas Anggara",
          date: "Juli 2026",
          rating: "4.8",
          avatar: "D",
          text: "Atmosfer pepohonan pinus di sekitar penginapan sangat asri. Balkon belakang menghadap langsung ke taman pinus yang tenang."
        },
        {
          name: "Fitri Handayani",
          date: "Juni 2026",
          rating: "4.9",
          avatar: "F",
          text: "Sangat dekat dengan Air Terjun Kakek Bodo. Halaman rumputnya luas sekali, anak-anak senang berlarian di sini."
        }
      ]
    };

    return specificReviews[villaId] || defaultReviews;
  }

  // Header Scroll
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });

  // Mobile Hamburger Menu
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

    const navLinksList = navMenu.querySelectorAll('a');
    navLinksList.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'ri-menu-line';
      });
    });
  }

  // Load Data
  async function loadData() {
    syncDynamicCategories();
    syncWhatsAppLinks();

    // Check localStorage first
    const savedData = localStorage.getItem('admin_villas_dataset');
    if (savedData) {
      try {
        state.villas = JSON.parse(savedData);
        state.filteredVillas = [...state.villas];
        applyFiltersAndRender();
        return;
      } catch (e) {
        console.error('Error parsing localStorage dataset in script.js:', e);
      }
    }

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

  function formatIDR(number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  }

  function getMinRoomPrice(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 0;
    return Math.min(...v.roomTypes.map(r => r.priceWeekday));
  }

  function getMaxRoomPrice(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 0;
    return Math.max(...v.roomTypes.map(r => r.priceWeekday));
  }

  function applyFiltersAndRender() {
    let result = [...state.villas];

    if (state.searchQuery.trim() !== '') {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query) ||
        (v.tagline && v.tagline.toLowerCase().includes(query)) ||
        (v.description && v.description.toLowerCase().includes(query)) ||
        (v.roomTypes && v.roomTypes.some(r => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)))
      );
    }

    if (state.currentCategory !== 'ALL') {
      result = result.filter(v => v.category === state.currentCategory);
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
    if (state.amenityFilters.bookmarks) {
      result = result.filter(v => state.bookmarks.includes(v.id));
    }

    if (state.sortOption === 'PRICE_LOW') {
      result.sort((a, b) => getMinRoomPrice(a) - getMinRoomPrice(b));
    } else if (state.sortOption === 'PRICE_HIGH') {
      result.sort((a, b) => getMaxRoomPrice(b) - getMaxRoomPrice(a));
    } else if (state.sortOption === 'RATING') {
      result.sort((a, b) => b.rating - a.rating);
    }

    state.filteredVillas = result;

    resultsCount.textContent = result.length;
    let badgeText = state.currentCategory === 'ALL' ? 'Menampilkan Semua' : `Kategori: ${state.currentCategory}`;
    if (state.searchQuery) badgeText += ` | Cari: "${state.searchQuery}"`;
    if (state.amenityFilters.bookmarks) badgeText += ` | Hanya Favorit`;
    activeFilterBadge.textContent = badgeText;

    renderGrid(result);
  }

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
      
      return `
        <div class="villa-card">
          <div class="card-media">
            <img src="${v.images && v.images[0] ? v.images[0] : 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'}" alt="${v.name}" loading="lazy">
            <span class="card-badge badge-gold">${v.category}</span>
            <button class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark(event, '${v.id}')" title="Simpan Bookmark">
              <i class="${isBookmarked ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
            </button>
          </div>

          <div class="card-body">
            <div class="card-rating">
              <i class="ri-star-fill"></i>
              <span>${v.rating} (${v.reviewsCount || 10} ulasan)</span>
            </div>

            <h3 class="card-title">${v.name}</h3>
            <div class="card-location">
              <i class="ri-map-pin-line"></i> ${v.location}
            </div>

            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem;">${v.tagline || v.description.substring(0, 75) + '...'}</p>

            <div class="card-specs">
              <div class="spec-item">
                <i class="ri-hotel-bed-line" style="color: var(--accent-gold);"></i> ${roomTypesCount} Tipe Kamar
              </div>
              <div class="spec-item">
                <i class="ri-temp-cold-line" style="color: var(--accent-cyan);"></i> Hawa Sejuk
              </div>
            </div>

            <div class="card-amenities-tags">
              ${v.amenities.slice(0, 3).map(a => `<span class="amenity-tag"><i class="${getAmenityIcon(a)}"></i> ${a}</span>`).join('')}
              ${v.amenities.length > 3 ? `<span class="amenity-tag">+${v.amenities.length - 3} lagi</span>` : ''}
            </div>

            <div class="card-footer">
              <div class="card-price">
                <span class="price-label">Mulai dari</span>
                <div class="price-amount">${formatIDR(minPrice)} <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">/malam</span></div>
              </div>

              <button class="btn-card-action" onclick="openVillaModal('${v.id}')">
                Detail & Sewa <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Bookmark Toggle
  window.toggleBookmark = function(e, id) {
    e.stopPropagation();
    const index = state.bookmarks.indexOf(id);
    if (index === -1) {
      state.bookmarks.push(id);
    } else {
      state.bookmarks.splice(index, 1);
    }
    localStorage.setItem('villa_bookmarks', JSON.stringify(state.bookmarks));
    applyFiltersAndRender();
  };

  // Open Detail Modal
  window.openVillaModal = function(id) {
    const v = state.villas.find(item => item.id === id);
    if (!v) return;

    state.activeVilla = v;
    state.activeRoomIndex = 0;

    const today = new Date();
    state.checkInDate = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    state.checkOutDate = tomorrow.toISOString().split('T')[0];

    renderModalContent();
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Render Modal Content
  function renderModalContent() {
    if (!state.activeVilla) return;
    const villa = state.activeVilla;
    const currentRoom = villa.roomTypes[state.activeRoomIndex] || villa.roomTypes[0] || {};
    const roomImages = (currentRoom.images && currentRoom.images.length > 0) ? currentRoom.images : (villa.images || []);

    const price3H = currentRoom.price3Hours || Math.round((currentRoom.priceWeekday || 350000) * 0.45);
    const price6H = currentRoom.price6Hours || Math.round((currentRoom.priceWeekday || 350000) * 0.70);

    modalDynamicContent.innerHTML = `
      <!-- Gallery Header -->
      <div class="modal-gallery">
        <div class="modal-gallery-main">
          <img id="modalMainImg" src="${roomImages[0] || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'}" alt="${villa.name}">
        </div>
        ${roomImages.length > 1 ? `
          <div class="modal-thumbnails">
            ${roomImages.map((img, idx) => `
              <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchModalGallery('${img}', this)">
                <img src="${img}" alt="Thumbnail ${idx+1}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="modal-body-content">
        <!-- Main Details -->
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
            <span class="badge badge-gold">${villa.category}</span>
            <span class="badge badge-cyan"><i class="ri-map-pin-line"></i> ${villa.location}</span>
          </div>

          <h2 class="modal-title">${villa.name}</h2>
          <p class="modal-subtitle">${villa.tagline || villa.description}</p>

          <!-- ROOM TYPES SELECTION TABS -->
          <div style="margin: 1.5rem 0;">
            <h4 style="font-family: var(--font-heading); font-size: 1rem; color: var(--accent-gold); margin-bottom: 0.75rem;">
              <i class="ri-hotel-bed-fill"></i> Pilih Tipe Kamar (${villa.roomTypes.length} Pilihan):
            </h4>

            <div class="modal-room-tabs">
              ${villa.roomTypes.map((rt, idx) => `
                <div class="modal-room-tab-item ${idx === state.activeRoomIndex ? 'active' : ''}" onclick="switchRoomTab(${idx})">
                  <div class="room-tab-title">${rt.name}</div>
                  <div class="room-tab-price">mulai ${formatIDR(rt.priceWeekday)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SELECTED ROOM SPECS -->
          <div style="background: var(--bg-card); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-bold); margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; color: var(--accent-gold); margin-bottom: 0.75rem; font-family: var(--font-heading);">
              Fasilitas & Rincian: ${currentRoom.name}
            </h3>

            <div class="modal-specs-grid" style="margin-bottom: 1rem;">
              <div class="modal-spec-card">
                <i class="ri-hotel-bed-line"></i>
                <div>
                  <div class="spec-label">Kasur</div>
                  <div class="spec-value">${currentRoom.bedType || '1 King Bed'}</div>
                </div>
              </div>

              <div class="modal-spec-card">
                <i class="ri-user-line"></i>
                <div>
                  <div class="spec-label">Kapasitas</div>
                  <div class="spec-value">${currentRoom.capacity || 2} Orang</div>
                </div>
              </div>

              <div class="modal-spec-card">
                <i class="ri-time-line"></i>
                <div>
                  <div class="spec-label">Tarif 3 Jam</div>
                  <div class="spec-value" style="color: var(--accent-gold);">${formatIDR(price3H)}</div>
                </div>
              </div>

              <div class="modal-spec-card">
                <i class="ri-time-line"></i>
                <div>
                  <div class="spec-label">Tarif 6 Jam</div>
                  <div class="spec-value" style="color: var(--accent-gold);">${formatIDR(price6H)}</div>
                </div>
              </div>
            </div>

            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
              ${currentRoom.description || 'Kamar nyaman di kawasan sejuk Tretes.'}
            </p>

            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              Fasilitas Dalam Kamar Ini:
            </div>
            <div class="modal-amenities-list">
              ${(currentRoom.amenities || ['AC', 'Hot Shower', 'Smart TV']).map(a => `
                <div class="modal-amenity-item">
                  <i class="${getAmenityIcon(a)}"></i>
                  <span>${a}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- ALL VILLA AMENITIES -->
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-family: var(--font-heading); font-size: 1rem; color: var(--text-primary); margin-bottom: 0.5rem;">
              Fasilitas Umum Penginapan:
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${villa.amenities.map(a => `<span class="amenity-tag" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="${getAmenityIcon(a)}"></i> ${a}</span>`).join('')}
            </div>
          </div>

          <!-- MOCK CUSTOMER REVIEWS -->
          <div style="margin-top: 2rem; border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
            <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <i class="ri-message-3-line" style="color: var(--accent-gold);"></i> Ulasan Pengunjung (${villa.reviewsCount || 10} Ulasan)
            </h4>
            
            <div class="modal-reviews-list">
              ${getMockReviews(villa.id, villa.name).map(r => `
                <div class="review-item">
                  <div class="review-header">
                    <div class="review-user">
                      <div class="user-avatar">${r.avatar}</div>
                      <div>
                        <div class="user-name">${r.name}</div>
                        <div class="review-date">${r.date}</div>
                      </div>
                    </div>
                    <div class="review-rating">
                      <i class="ri-star-fill"></i> ${r.rating}
                    </div>
                  </div>
                  <p class="review-text">${r.text}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Interactive Price & Booking Calculator (Supports Hourly & Nightly Rates) -->
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

          <!-- DURATION PACKAGE SELECTOR (3 JAM, 6 JAM, MENGINAP) -->
          <div class="calc-input-group">
            <label for="modalDurationPackage">Pilihan Durasi Sewa</label>
            <select id="modalDurationPackage" class="calc-select" onchange="updateModalPrice()">
              <option value="3H" data-price="${price3H}">Sewa Short Time (3 Jam) - ${formatIDR(price3H)}</option>
              <option value="6H" data-price="${price6H}">Sewa Short Time (6 Jam) - ${formatIDR(price6H)}</option>
              <option value="NIGHT" selected>Menginap / Per Malam</option>
            </select>
          </div>

          <div id="nightlyOptionsBox">
            <div class="calc-input-group">
              <label for="modalCheckInDate">Tanggal Check-In</label>
              <input type="date" id="modalCheckInDate" class="calc-select" value="${state.checkInDate}" onchange="updateModalPrice()">
            </div>

            <div class="calc-input-group">
              <label for="modalCheckOutDate">Tanggal Check-Out</label>
              <input type="date" id="modalCheckOutDate" class="calc-select" value="${state.checkOutDate}" onchange="updateModalPrice()">
            </div>
          </div>

          <div class="calc-price-summary">
            <div class="summary-row">
              <span>Tarif Pilihan:</span>
              <strong id="modalRatePerNight">${formatIDR(currentRoom.priceWeekday)}</strong>
            </div>
            <div class="summary-row">
              <span>Durasi:</span>
              <strong id="modalNightCount">1 Malam (Menginap)</strong>
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

    updateModalPrice();
  }

  window.switchRoomTab = function(roomIdx) {
    state.activeRoomIndex = roomIdx;
    renderModalContent();
  };

  window.switchRoomSelect = function(roomIdxStr) {
    state.activeRoomIndex = parseInt(roomIdxStr, 10);
    renderModalContent();
  };

  window.switchModalGallery = function(imgSrc, thumbElem) {
    const mainImg = document.getElementById('modalMainImg');
    if (mainImg) mainImg.src = imgSrc;

    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
    if (thumbElem) thumbElem.classList.add('active');
  };

  // Dynamic Price Calculator
  window.updateModalPrice = function() {
    const packageSelect = document.getElementById('modalDurationPackage');
    const checkInInput = document.getElementById('modalCheckInDate');
    const checkOutInput = document.getElementById('modalCheckOutDate');
    const nightlyBox = document.getElementById('nightlyOptionsBox');
    
    const rateElem = document.getElementById('modalRatePerNight');
    const countElem = document.getElementById('modalNightCount');
    const totalElem = document.getElementById('modalTotalPrice');

    if (!packageSelect || !state.activeVilla) return;

    const currentRoom = state.activeVilla.roomTypes[state.activeRoomIndex] || state.activeVilla.roomTypes[0] || {};
    const pkg = packageSelect.value;

    if (pkg === '3H' || pkg === '6H') {
      if (nightlyBox) nightlyBox.style.display = 'none';
      
      const opt = packageSelect.options[packageSelect.selectedIndex];
      const price = parseInt(opt.getAttribute('data-price'), 10) || (pkg === '3H' ? 150000 : 250000);
      const labelText = pkg === '3H' ? '3 Jam (Short Time)' : '6 Jam (Short Time)';

      rateElem.textContent = formatIDR(price);
      countElem.textContent = labelText;
      totalElem.textContent = formatIDR(price);
    } else {
      if (nightlyBox) nightlyBox.style.display = 'block';
      if (!checkInInput || !checkOutInput) return;

      const checkInVal = checkInInput.value;
      const checkOutVal = checkOutInput.value;
      state.checkInDate = checkInVal;
      state.checkOutDate = checkOutVal;

      const d1 = new Date(checkInVal);
      const d2 = new Date(checkOutVal);

      if (d2 <= d1) {
        const nextDay = new Date(d1);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        checkOutInput.value = nextDayStr;
        state.checkOutDate = nextDayStr;
        updateModalPrice();
        return;
      }

      let totalNights = 0;
      let totalPrice = 0;
      let tempDate = new Date(d1);

      while (tempDate < d2) {
        const dayOfWeek = tempDate.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
        const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0);
        const priceForNight = isWeekend ? currentRoom.priceWeekend : currentRoom.priceWeekday;
        totalPrice += priceForNight;
        totalNights++;
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const avgRate = Math.round(totalPrice / totalNights);

      rateElem.textContent = `Rata-rata ${formatIDR(avgRate)}/malam`;
      countElem.textContent = `${totalNights} Malam (Menginap)`;
      totalElem.textContent = formatIDR(totalPrice);
    }
  };

  // WhatsApp Booking
  window.submitWaBooking = function() {
    if (!state.activeVilla) return;
    const currentRoom = state.activeVilla.roomTypes[state.activeRoomIndex] || state.activeVilla.roomTypes[0];

    const packageSelect = document.getElementById('modalDurationPackage');
    const checkInInput = document.getElementById('modalCheckInDate');
    const checkOutInput = document.getElementById('modalCheckOutDate');
    const totalElem = document.getElementById('modalTotalPrice');

    const pkg = packageSelect.value;
    let durationText = '';
    let dateRangeText = '';

    if (pkg === '3H') {
      durationText = '3 Jam (Short Time)';
      dateRangeText = 'Hari ini / Fleksibel';
    } else if (pkg === '6H') {
      durationText = '6 Jam (Short Time)';
      dateRangeText = 'Hari ini / Fleksibel';
    } else {
      if (!checkInInput || !checkOutInput) return;
      const checkInVal = checkInInput.value;
      const checkOutVal = checkOutInput.value;
      const d1 = new Date(checkInVal);
      const d2 = new Date(checkOutVal);
      const nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      
      const formatDateIndo = (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
      };
      
      durationText = `${nights} Malam`;
      dateRangeText = `${formatDateIndo(checkInVal)} s/d ${formatDateIndo(checkOutVal)}`;
    }

    const totalCost = totalElem.textContent;

    const message = `Halo Admin VillaTretes, saya berminat untuk sewa kamar berikut:\n\n` +
      `🏨 *${state.activeVilla.name}*\n` +
      `🛏️ *Tipe Kamar: ${currentRoom.name}*\n` +
      `📍 Lokasi: ${state.activeVilla.location}\n` +
      `📅 Rentang Tanggal: ${dateRangeText}\n` +
      `⏳ Durasi: ${durationText}\n` +
      `💰 Estimasi Biaya: ${totalCost}\n\n` +
      `Mohon konfirmasi ketersediaan kamar & prosedur reservasinya. Terima kasih!`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${CONFIG.waPhone}?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
  };

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

  // Filter Event Listeners
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyFiltersAndRender();
  });

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      state.currentCategory = e.target.value;
      if (categoryTabsContainer) {
        categoryTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-category') === state.currentCategory);
        });
      }
      applyFiltersAndRender();
    });
  }

  sortSelect.addEventListener('change', (e) => {
    state.sortOption = e.target.value;
    applyFiltersAndRender();
  });

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
  const filterBookmarks = document.getElementById('filterBookmarks');
  if (filterBookmarks) {
    filterBookmarks.addEventListener('change', (e) => {
      state.amenityFilters.bookmarks = e.target.checked;
      applyFiltersAndRender();
    });
  }

  window.resetFilters = function() {
    state.searchQuery = '';
    state.currentCategory = 'ALL';
    state.sortOption = 'DEFAULT';
    state.amenityFilters = { billiard: false, karaoke: false, mountainView: false, bookmarks: false };

    searchInput.value = '';
    if (categorySelect) categorySelect.value = 'ALL';
    sortSelect.value = 'DEFAULT';

    if (filterBilliard) filterBilliard.checked = false;
    if (filterKaraoke) filterKaraoke.checked = false;
    if (filterMountainView) filterMountainView.checked = false;
    if (filterBookmarks) filterBookmarks.checked = false;

    if (categoryTabsContainer) {
      const tabBtns = categoryTabsContainer.querySelectorAll('.tab-btn');
      tabBtns.forEach(b => b.classList.remove('active'));
      if (tabBtns[0]) tabBtns[0].classList.add('active');
    }

    applyFiltersAndRender();
  };

  loadData();
});
