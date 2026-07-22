/**
 * KATALOG VILLA TRETES - ADMIN DASHBOARD LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  // Admin State
  let villas = [];
  let categories = ['Luxury', 'Modern', 'Classic'];
  let currentAmenities = [];
  let currentMainImages = [];

  // DOM Elements
  const adminVillaTableBody = document.getElementById('adminVillaTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const btnAddVilla = document.getElementById('btnAddVilla');
  const btnExportData = document.getElementById('btnExportData');
  
  // Category Elements
  const btnManageCategories = document.getElementById('btnManageCategories');
  const categoryModal = document.getElementById('categoryModal');
  const categoryModalCloseBtn = document.getElementById('categoryModalCloseBtn');
  const adminCategoryListContainer = document.getElementById('adminCategoryListContainer');
  const btnAddNewCategory = document.getElementById('btnAddNewCategory');
  const newCategoryInput = document.getElementById('newCategoryInput');

  // Form Modal Elements
  const formModal = document.getElementById('formModal');
  const formModalCloseBtn = document.getElementById('formModalCloseBtn');
  const formModalTitle = document.getElementById('formModalTitle');
  const villaForm = document.getElementById('villaForm');
  const formVillaId = document.getElementById('formVillaId');
  const formName = document.getElementById('formName');
  const formCategory = document.getElementById('formCategory');
  const formTagline = document.getElementById('formTagline');
  const formRating = document.getElementById('formRating');
  const formLocation = document.getElementById('formLocation');
  const formAmenities = document.getElementById('formAmenities');
  const formAmenitiesChips = document.getElementById('formAmenitiesChips');
  const newAmenityInput = document.getElementById('newAmenityInput');
  const btnAddAmenityChip = document.getElementById('btnAddAmenityChip');

  // Image Upload & Preview Elements
  const formImages = document.getElementById('formImages');
  const formMainImageFile = document.getElementById('formMainImageFile');
  const formMainImagesPreview = document.getElementById('formMainImagesPreview');
  const mainImagesCount = document.getElementById('mainImagesCount');
  const formDescription = document.getElementById('formDescription');

  // Room Editor Elements
  const btnAddRoomType = document.getElementById('btnAddRoomType');
  const adminRoomsContainer = document.getElementById('adminRoomsContainer');

  // Export Modal Elements
  const exportModal = document.getElementById('exportModal');
  const exportModalCloseBtn = document.getElementById('exportModalCloseBtn');
  const btnDownloadJson = document.getElementById('btnDownloadJson');
  const btnDownloadJs = document.getElementById('btnDownloadJs');
  const btnCopyJson = document.getElementById('btnCopyJson');
  const jsonOutputText = document.getElementById('jsonOutputText');

  // Format Currency
  function formatIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  }

  // ==========================================
  // 1. DYNAMIC CATEGORIES MANAGEMENT
  // ==========================================
  function loadCategories() {
    const savedCats = localStorage.getItem('admin_categories_list');
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categories = parsed;
        }
      } catch (e) {
        console.error('Error loading categories:', e);
      }
    }
    renderCategoryDropdown();
  }

  function saveCategories() {
    localStorage.setItem('admin_categories_list', JSON.stringify(categories));
    renderCategoryDropdown();
    renderCategoryManagerList();
  }

  function renderCategoryDropdown() {
    if (!formCategory) return;
    const currentVal = formCategory.value;
    formCategory.innerHTML = categories.map(cat => 
      `<option value="${cat}">${cat}</option>`
    ).join('');
    if (categories.includes(currentVal)) {
      formCategory.value = currentVal;
    }
  }

  function renderCategoryManagerList() {
    if (!adminCategoryListContainer) return;
    if (categories.length === 0) {
      adminCategoryListContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Belum ada kategori kustom.</div>`;
      return;
    }

    adminCategoryListContainer.innerHTML = categories.map((cat, idx) => `
      <div class="category-item-row">
        <input type="text" class="category-edit-input" value="${cat}" onchange="updateCategoryName(${idx}, this.value)">
        <button type="button" class="btn-icon-danger" onclick="deleteCategory(${idx})" title="Hapus Kategori">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `).join('');
  }

  window.updateCategoryName = function(idx, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('Nama kategori tidak boleh kosong!');
      renderCategoryManagerList();
      return;
    }
    categories[idx] = trimmed;
    saveCategories();
  };

  window.deleteCategory = function(idx) {
    if (categories.length <= 1) {
      alert('Setidaknya harus menyisa 1 kategori!');
      return;
    }
    if (confirm(`Hapus kategori "${categories[idx]}"?`)) {
      categories.splice(idx, 1);
      saveCategories();
    }
  };

  if (btnAddNewCategory && newCategoryInput) {
    btnAddNewCategory.addEventListener('click', () => {
      const val = newCategoryInput.value.trim();
      if (!val) {
        alert('Masukkan nama kategori baru!');
        return;
      }
      if (categories.includes(val)) {
        alert('Kategori ini sudah ada!');
        return;
      }
      categories.push(val);
      saveCategories();
      newCategoryInput.value = '';
    });
  }

  if (btnManageCategories && categoryModal) {
    btnManageCategories.addEventListener('click', () => {
      renderCategoryManagerList();
      categoryModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  window.closeCategoryModal = function() {
    if (categoryModal) categoryModal.classList.remove('active');
    document.body.style.overflow = '';
  };
  if (categoryModalCloseBtn) categoryModalCloseBtn.addEventListener('click', closeCategoryModal);


  // ==========================================
  // 2. INTERACTIVE AMENITIES (FASILITAS) TAG EDITOR
  // ==========================================
  function renderAmenitiesChips() {
    if (!formAmenitiesChips) return;
    if (currentAmenities.length === 0) {
      formAmenitiesChips.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Belum ada fasilitas. Ketik nama fasilitas di bawah atau pilih preset.</span>`;
    } else {
      formAmenitiesChips.innerHTML = currentAmenities.map((item, idx) => `
        <div class="amenity-chip-item">
          <input type="text" class="amenity-chip-edit-input" value="${item}" onchange="updateAmenityChip(${idx}, this.value)" style="width: ${Math.max(item.length * 9, 60)}px;">
          <span class="amenity-chip-remove" onclick="removeAmenityChip(${idx})" title="Hapus Fasilitas">✕</span>
        </div>
      `).join('');
    }
    if (formAmenities) formAmenities.value = currentAmenities.join(', ');
  }

  window.updateAmenityChip = function(idx, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
      removeAmenityChip(idx);
      return;
    }
    currentAmenities[idx] = trimmed;
    renderAmenitiesChips();
  };

  window.removeAmenityChip = function(idx) {
    currentAmenities.splice(idx, 1);
    renderAmenitiesChips();
  };

  window.addAmenityPreset = function(text) {
    if (!currentAmenities.includes(text)) {
      currentAmenities.push(text);
      renderAmenitiesChips();
    }
  };

  if (btnAddAmenityChip && newAmenityInput) {
    btnAddAmenityChip.addEventListener('click', () => {
      const val = newAmenityInput.value.trim();
      if (val) {
        if (!currentAmenities.includes(val)) {
          currentAmenities.push(val);
          renderAmenitiesChips();
        }
        newAmenityInput.value = '';
      }
    });

    newAmenityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnAddAmenityChip.click();
      }
    });
  }


  // ==========================================
  // 3. IMAGE FILE UPLOAD & LIVE PREVIEW WITH VALIDATION (MAIN FOTO)
  // ==========================================
  function syncMainImagesArrayFromTextarea() {
    const raw = formImages ? formImages.value : '';
    const lines = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    // Keep local data URLs (uploaded files) that might not be in textarea plain text
    const localDataUrls = currentMainImages.filter(img => img.startsWith('data:'));
    currentMainImages = [...localDataUrls, ...lines.filter(url => !localDataUrls.includes(url))];
    
    renderMainImagesPreview();
  }

  if (formImages) {
    formImages.addEventListener('input', syncMainImagesArrayFromTextarea);
  }

  if (formMainImageFile) {
    formMainImageFile.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (!files || files.length === 0) return;

      let loadedCount = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          if (!currentMainImages.includes(dataUrl)) {
            currentMainImages.push(dataUrl);
          }
          loadedCount++;
          if (loadedCount === files.length) {
            renderMainImagesPreview();
          }
        };
        reader.readAsDataURL(file);
      });
      formMainImageFile.value = '';
    });
  }

  function renderMainImagesPreview() {
    if (!formMainImagesPreview) return;

    if (mainImagesCount) {
      mainImagesCount.textContent = `${currentMainImages.length} foto`;
    }

    if (currentMainImages.length === 0) {
      formMainImagesPreview.innerHTML = `
        <div style="grid-column: 1 / -1; color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem 0;">
          Belum ada foto yang di-upload / dimasukkan.
        </div>
      `;
      return;
    }

    formMainImagesPreview.innerHTML = currentMainImages.map((src, idx) => {
      const isLocal = src.startsWith('data:');
      const labelText = isLocal ? 'File JPG/PNG' : 'Link URL';

      return `
        <div class="preview-thumb-card" id="main-preview-card-${idx}">
          <img src="${src}" class="preview-thumb-img" alt="Preview Foto ${idx+1}" 
               onload="handleImagePreviewLoad(${idx}, true)" 
               onerror="handleImagePreviewLoad(${idx}, false)">
          <div class="preview-status-bar" id="main-status-bar-${idx}">
            <span>${labelText}</span>
            <span class="status-indicator">Testing...</span>
          </div>
          <button type="button" class="preview-delete-btn" onclick="removeMainImage(${idx})" title="Hapus Foto Ini">✕</button>
        </div>
      `;
    }).join('');
  }

  window.handleImagePreviewLoad = function(idx, isSuccess) {
    const card = document.getElementById(`main-preview-card-${idx}`);
    const statusBar = document.getElementById(`main-status-bar-${idx}`);
    if (!card || !statusBar) return;

    if (isSuccess) {
      card.classList.remove('status-error');
      card.classList.add('status-success');
      statusBar.className = 'preview-status-bar success';
      statusBar.querySelector('.status-indicator').textContent = '✅ Terbaca';
    } else {
      card.classList.remove('status-success');
      card.classList.add('status-error');
      statusBar.className = 'preview-status-bar error';
      statusBar.querySelector('.status-indicator').textContent = '❌ Broken';
    }
  };

  window.removeMainImage = function(idx) {
    currentMainImages.splice(idx, 1);
    if (formImages) {
      formImages.value = currentMainImages.filter(img => !img.startsWith('data:')).join('\n');
    }
    renderMainImagesPreview();
  };


  // ==========================================
  // 4. LOAD INITIAL DATA & RENDER VILLA TABLE
  // ==========================================
  async function loadAdminData() {
    loadCategories();

    const savedData = localStorage.getItem('admin_villas_dataset');
    if (savedData) {
      try {
        villas = JSON.parse(savedData);
        renderTable(villas);
        return;
      } catch (e) {
        console.error('Error parsing localStorage dataset:', e);
      }
    }

    if (window.VILLAS_DATA && Array.isArray(window.VILLAS_DATA)) {
      villas = [...window.VILLAS_DATA];
      renderTable(villas);
      return;
    }

    try {
      const res = await fetch('data.json');
      if (res.ok) {
        villas = await res.json();
        renderTable(villas);
      }
    } catch (err) {
      console.error('Gagal memuat data admin:', err);
    }
  }

  function saveLocalDataset() {
    localStorage.setItem('admin_villas_dataset', JSON.stringify(villas));
    window.VILLAS_DATA = villas;
  }

  function getRoomPriceRange(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 'Belum Ada Kamar';
    const prices = v.roomTypes.map(r => r.priceWeekday);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatIDR(min);
    return `${formatIDR(min)} - ${formatIDR(max)}`;
  }

  function renderTable(dataset) {
    if (!adminVillaTableBody) return;

    if (dataset.length === 0) {
      adminVillaTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Belum ada data penginapan. Klik <strong>Tambah Penginapan Baru</strong> di atas.
          </td>
        </tr>
      `;
      return;
    }

    adminVillaTableBody.innerHTML = dataset.map(v => {
      const roomTypesCount = v.roomTypes ? v.roomTypes.length : 0;
      const priceRange = getRoomPriceRange(v);

      return `
        <tr>
          <td>
            <img src="${v.images && v.images[0] ? v.images[0] : 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=300&q=80'}" alt="${v.name}" class="admin-thumb">
          </td>
          <td>
            <strong style="color: var(--text-primary); font-size: 0.95rem;">${v.name}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${v.location}</div>
          </td>
          <td>
            <span class="badge badge-gold">${v.category}</span>
          </td>
          <td>
            <span class="badge badge-gold">${roomTypesCount} Tipe Kamar</span>
          </td>
          <td style="color: var(--accent-gold); font-weight: 700;">${priceRange}</td>
          <td>⭐ ${v.rating}</td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.4rem; justify-content: center;">
              <button class="btn-action-icon btn-action-edit" onclick="editVilla('${v.id}')" title="Ubah Data Penginapan & Kamar">
                <i class="ri-pencil-fill"></i>
              </button>
              <button class="btn-action-icon btn-action-delete" onclick="deleteVilla('${v.id}')" title="Hapus Penginapan">
                <i class="ri-delete-bin-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }


  // ==========================================
  // 5. ROOM CARD EDITOR (HOURLY RATES & LIVE IMAGE PREVIEW STATUS)
  // ==========================================
  function renderRoomTypeCard(room = {}) {
    const cardId = 'room-card-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const card = document.createElement('div');
    card.className = 'admin-room-card';
    card.id = cardId;

    const price3H = room.price3Hours || Math.round((room.priceWeekday || 350000) * 0.45);
    const price6H = room.price6Hours || Math.round((room.priceWeekday || 350000) * 0.70);
    const initialImages = Array.isArray(room.images) ? room.images.join('\n') : '';

    card.innerHTML = `
      <div class="admin-room-header">
        <span class="admin-room-title">
          <i class="ri-hotel-bed-fill"></i> <span class="room-title-display">${room.name || 'Tipe Kamar Baru'}</span>
        </span>
        <button type="button" class="btn-action-icon btn-action-delete" onclick="removeRoomCard('${cardId}')" title="Hapus Kamar Ini">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>

      <input type="hidden" class="room-id" value="${room.id || ('rt-' + Date.now() + '-' + Math.floor(Math.random() * 100))}">

      <div class="filter-grid" style="grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="filter-group">
          <label style="font-size: 0.8rem;">Nama Tipe Kamar *</label>
          <input type="text" class="input-control room-name" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem;" 
                 placeholder="Contoh: Superior Mountain View" value="${room.name || ''}" 
                 oninput="this.closest('.admin-room-card').querySelector('.room-title-display').textContent = this.value || 'Tipe Kamar Baru'" required>
        </div>

        <div class="filter-group">
          <label style="font-size: 0.8rem;">Tipe Kasur & Kapasitas</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" class="input-control room-bed-type" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem; flex: 2;" 
                   placeholder="Contoh: 1 King Bed" value="${room.bedType || '1 King Bed'}">
            <input type="number" class="input-control room-capacity" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem; flex: 1;" 
                   placeholder="Orang" value="${room.capacity || 2}" title="Kapasitas Orang" required>
          </div>
        </div>
      </div>

      <!-- PRICE & DURATION RATES (PER JAM & MENGINAP) -->
      <div style="background: var(--bg-primary); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 0.75rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.5rem; text-transform: uppercase;">
          💰 Pengaturan Tarif Sewa (Per Jam & Menginap):
        </div>

        <div class="filter-grid" style="grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
          <div class="filter-group">
            <label style="font-size: 0.75rem;">Tarif 3 Jam (Rp)</label>
            <input type="number" class="input-control room-price-3h" style="padding-left: 0.5rem; height: 36px; font-size: 0.82rem;" 
                   placeholder="150000" value="${price3H}">
          </div>

          <div class="filter-group">
            <label style="font-size: 0.75rem;">Tarif 6 Jam (Rp)</label>
            <input type="number" class="input-control room-price-6h" style="padding-left: 0.5rem; height: 36px; font-size: 0.82rem;" 
                   placeholder="250000" value="${price6H}">
          </div>

          <div class="filter-group">
            <label style="font-size: 0.75rem;">Weekday / Malam (Rp) *</label>
            <input type="number" class="input-control room-price-weekday" style="padding-left: 0.5rem; height: 36px; font-size: 0.82rem;" 
                   placeholder="350000" value="${room.priceWeekday || 350000}" required>
          </div>

          <div class="filter-group">
            <label style="font-size: 0.75rem;">Weekend / Malam (Rp) *</label>
            <input type="number" class="input-control room-price-weekend" style="padding-left: 0.5rem; height: 36px; font-size: 0.82rem;" 
                   placeholder="450000" value="${room.priceWeekend || 450000}" required>
          </div>
        </div>
      </div>

      <div class="filter-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.8rem;">Deskripsi Kamar *</label>
        <textarea class="calc-select room-description" style="height: 55px; font-size: 0.85rem; resize: vertical;" 
                  placeholder="Ketikkan deskripsi lengkap kamar ini...">${room.description || ''}</textarea>
      </div>

      <div class="filter-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.8rem;">Fasilitas Khusus Kamar (Pisahkan Koma)</label>
        <input type="text" class="input-control room-amenities" style="padding-left: 0.75rem; height: 38px; font-size: 0.85rem;" 
               placeholder="AC, Smart TV, Hot Shower, Balkon Private" value="${Array.isArray(room.amenities) ? room.amenities.join(', ') : ''}">
      </div>

      <!-- ROOM IMAGE FILE UPLOAD & LIVE PREVIEW WITH VALIDATION STATUS -->
      <div class="filter-group">
        <label style="font-size: 0.8rem;"><i class="ri-image-line" style="color: var(--accent-gold);"></i> Foto Tipe Kamar (Upload JPG/PNG atau Paste URL)</label>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="file" class="room-file-input" accept="image/*" multiple style="display: none;">
          <button type="button" class="btn-upload-file" style="padding: 0.4rem 0.75rem; font-size: 0.78rem;" onclick="this.previousElementSibling.click()">
            <i class="ri-upload-cloud-line"></i> Upload Foto Kamar (JPG/PNG)
          </button>
        </div>
        <textarea class="calc-select room-images" style="height: 45px; font-size: 0.82rem; resize: vertical;" 
                  placeholder="https://images.unsplash.com/photo-kamar-1&#10;https://images.unsplash.com/photo-kamar-2"
                  oninput="updateRoomImagesPreview('${cardId}')">${initialImages}</textarea>

        <!-- Live Preview Grid for Room Images -->
        <div class="images-preview-container" style="margin-top: 0.5rem;">
          <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent-gold); display: flex; align-items: center; justify-content: space-between;">
            <span><i class="ri-eye-line"></i> Pratinjau Foto Kamar (Live Status Test)</span>
            <span class="room-images-count" style="font-weight: normal; color: var(--text-muted); font-size: 0.72rem;">0 foto</span>
          </div>
          <div class="room-images-preview-grid images-preview-grid">
            <!-- Room Thumbnails rendered dynamically -->
          </div>
        </div>
      </div>
    `;

    adminRoomsContainer.appendChild(card);

    // Setup room file input listener
    const roomFileInput = card.querySelector('.room-file-input');
    const roomImagesTextarea = card.querySelector('.room-images');

    if (roomFileInput && roomImagesTextarea) {
      roomFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;

        let existingUrls = roomImagesTextarea.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        let loaded = 0;

        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            existingUrls.push(event.target.result);
            loaded++;
            if (loaded === files.length) {
              roomImagesTextarea.value = existingUrls.join('\n');
              updateRoomImagesPreview(cardId);
            }
          };
          reader.readAsDataURL(file);
        });
        roomFileInput.value = '';
      });
    }

    // Initial render of room images preview
    updateRoomImagesPreview(cardId);
  }

  // Room Image Preview Helper Function
  window.updateRoomImagesPreview = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const textarea = card.querySelector('.room-images');
    const previewGrid = card.querySelector('.room-images-preview-grid');
    const countBadge = card.querySelector('.room-images-count');
    if (!textarea || !previewGrid) return;

    const raw = textarea.value;
    const images = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    if (countBadge) {
      countBadge.textContent = `${images.length} foto`;
    }

    if (images.length === 0) {
      previewGrid.innerHTML = `
        <div style="grid-column: 1 / -1; color: var(--text-muted); font-size: 0.78rem; padding: 0.35rem 0;">
          Belum ada foto kamar yang di-upload / dimasukkan.
        </div>
      `;
      return;
    }

    previewGrid.innerHTML = images.map((src, idx) => {
      const isLocal = src.startsWith('data:');
      const labelText = isLocal ? 'File JPG/PNG' : 'Link URL';

      return `
        <div class="preview-thumb-card" id="room-preview-card-${cardId}-${idx}">
          <img src="${src}" class="preview-thumb-img" alt="Preview Foto Kamar ${idx+1}" 
               onload="handleRoomImagePreviewLoad('${cardId}', ${idx}, true)" 
               onerror="handleRoomImagePreviewLoad('${cardId}', ${idx}, false)">
          <div class="preview-status-bar" id="room-status-bar-${cardId}-${idx}">
            <span>${labelText}</span>
            <span class="status-indicator">Testing...</span>
          </div>
          <button type="button" class="preview-delete-btn" onclick="removeRoomImage('${cardId}', ${idx})" title="Hapus Foto Kamar Ini">✕</button>
        </div>
      `;
    }).join('');
  };

  window.handleRoomImagePreviewLoad = function(cardId, idx, isSuccess) {
    const cardElem = document.getElementById(`room-preview-card-${cardId}-${idx}`);
    const statusBar = document.getElementById(`room-status-bar-${cardId}-${idx}`);
    if (!cardElem || !statusBar) return;

    if (isSuccess) {
      cardElem.classList.remove('status-error');
      cardElem.classList.add('status-success');
      statusBar.className = 'preview-status-bar success';
      statusBar.querySelector('.status-indicator').textContent = '✅ Terbaca';
    } else {
      cardElem.classList.remove('status-success');
      cardElem.classList.add('status-error');
      statusBar.className = 'preview-status-bar error';
      statusBar.querySelector('.status-indicator').textContent = '❌ Broken';
    }
  };

  window.removeRoomImage = function(cardId, idx) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const textarea = card.querySelector('.room-images');
    if (!textarea) return;

    let images = textarea.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    images.splice(idx, 1);
    textarea.value = images.join('\n');
    updateRoomImagesPreview(cardId);
  };

  window.removeRoomCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    if (adminRoomsContainer.children.length <= 1) {
      alert('Setidaknya penginapan harus memiliki 1 tipe kamar!');
      return;
    }
    card.remove();
  };

  if (btnAddRoomType) {
    btnAddRoomType.addEventListener('click', () => {
      renderRoomTypeCard({
        name: 'Tipe Kamar Baru',
        price3Hours: 150000,
        price6Hours: 250000,
        priceWeekday: 350000,
        priceWeekend: 450000,
        capacity: 2,
        bedType: '1 King Bed',
        description: 'Kamar nyaman dengan pemandangan pegunungan.',
        amenities: ['AC', 'Smart TV', 'Hot Shower'],
        images: []
      });
    });
  }

  // Filter Table Search
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = villas.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
      renderTable(filtered);
    });
  }


  // ==========================================
  // 6. FORM MODAL OPEN / EDIT / SUBMIT
  // ==========================================
  if (btnAddVilla) {
    btnAddVilla.addEventListener('click', () => {
      formModalTitle.textContent = 'Tambah Penginapan Baru';
      villaForm.reset();
      formVillaId.value = '';
      currentAmenities = ['View Gunung', 'Wifi', 'Water Heater', 'BBQ Area'];
      renderAmenitiesChips();

      currentMainImages = ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'];
      if (formImages) formImages.value = currentMainImages.join('\n');
      renderMainImagesPreview();

      adminRoomsContainer.innerHTML = '';
      renderRoomTypeCard({
        name: 'Superior Room',
        price3Hours: 150000,
        price6Hours: 250000,
        priceWeekday: 350000,
        priceWeekend: 450000,
        capacity: 2,
        bedType: '1 King Bed',
        description: 'Kamar Superior nyaman dengan pemandangan pegunungan.',
        amenities: ['AC', 'Smart TV', 'Kamar Mandi Dalam', 'Hot Shower'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80']
      });

      formModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  window.editVilla = function(id) {
    const v = villas.find(item => item.id === id);
    if (!v) return;

    formModalTitle.textContent = `Ubah Data: ${v.name}`;
    formVillaId.value = v.id;
    formName.value = v.name;
    formCategory.value = v.category;
    formTagline.value = v.tagline || '';
    formRating.value = v.rating;
    formLocation.value = v.location;

    // Load Amenities Chips
    currentAmenities = Array.isArray(v.amenities) ? [...v.amenities] : ['View Gunung', 'Wifi'];
    renderAmenitiesChips();

    // Load Main Images
    currentMainImages = Array.isArray(v.images) ? [...v.images] : [];
    if (formImages) formImages.value = currentMainImages.filter(img => !img.startsWith('data:')).join('\n');
    renderMainImagesPreview();

    formDescription.value = v.description || '';

    // Render Room Type Sub-Cards
    adminRoomsContainer.innerHTML = '';
    if (v.roomTypes && v.roomTypes.length > 0) {
      v.roomTypes.forEach(rt => renderRoomTypeCard(rt));
    } else {
      renderRoomTypeCard({
        name: 'Standard Room',
        price3Hours: 150000,
        price6Hours: 250000,
        priceWeekday: 300000,
        priceWeekend: 400000,
        capacity: 2,
        bedType: '1 King Bed',
        description: 'Kamar nyaman di Tretes.',
        amenities: ['AC', 'Hot Shower'],
        images: []
      });
    }

    formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.deleteVilla = function(id) {
    const v = villas.find(item => item.id === id);
    if (!v) return;

    if (confirm(`Apakah Anda yakin ingin menghapus "${v.name}"?`)) {
      villas = villas.filter(item => item.id !== id);
      saveLocalDataset();
      renderTable(villas);
    }
  };

  window.closeFormModal = function() {
    formModal.classList.remove('active');
    document.body.style.overflow = '';
  };
  if (formModalCloseBtn) formModalCloseBtn.addEventListener('click', closeFormModal);

  // Submit Handler
  if (villaForm) {
    villaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const existingId = formVillaId.value;
      const roomCards = adminRoomsContainer.querySelectorAll('.admin-room-card');
      const roomTypes = [];

      roomCards.forEach(card => {
        const rId = card.querySelector('.room-id').value;
        const rName = card.querySelector('.room-name').value.trim() || 'Tipe Kamar';
        const rBedType = card.querySelector('.room-bed-type').value.trim() || '1 King Bed';
        const rPrice3H = parseInt(card.querySelector('.room-price-3h').value, 10) || 150000;
        const rPrice6H = parseInt(card.querySelector('.room-price-6h').value, 10) || 250000;
        const rPriceWk = parseInt(card.querySelector('.room-price-weekday').value, 10) || 350000;
        const rPriceWknd = parseInt(card.querySelector('.room-price-weekend').value, 10) || 450000;
        const rCapacity = parseInt(card.querySelector('.room-capacity').value, 10) || 2;
        const rDescription = card.querySelector('.room-description').value.trim() || 'Kamar nyaman.';
        const rAmenities = card.querySelector('.room-amenities').value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const rImages = card.querySelector('.room-images').value.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        roomTypes.push({
          id: rId,
          name: rName,
          price3Hours: rPrice3H,
          price6Hours: rPrice6H,
          priceWeekday: rPriceWk,
          priceWeekend: rPriceWknd,
          capacity: rCapacity,
          bedType: rBedType,
          bathrooms: 1,
          description: rDescription,
          amenities: rAmenities.length > 0 ? rAmenities : ['AC', 'Hot Shower', 'Smart TV'],
          images: rImages.length > 0 ? rImages : (currentMainImages.length > 0 ? [currentMainImages[0]] : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'])
        });
      });

      if (roomTypes.length === 0) {
        alert('Mohon isi setidaknya 1 tipe kamar!');
        return;
      }

      const villaObj = {
        id: existingId || ('v-' + Date.now()),
        name: formName.value,
        tagline: formTagline.value,
        category: formCategory.value,
        rating: parseFloat(formRating.value) || 4.8,
        reviewsCount: existingId ? (villas.find(x => x.id === existingId)?.reviewsCount || 10) : 1,
        location: formLocation.value,
        amenities: currentAmenities.length > 0 ? currentAmenities : ['View Gunung', 'Wifi', 'Water Heater', 'BBQ Area'],
        images: currentMainImages.length > 0 ? currentMainImages : ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'],
        description: formDescription.value || 'Penginapan nyaman di Tretes Prigen.',
        roomTypes: roomTypes
      };

      if (existingId) {
        const idx = villas.findIndex(x => x.id === existingId);
        if (idx !== -1) villas[idx] = villaObj;
      } else {
        villas.unshift(villaObj);
      }

      saveLocalDataset();
      renderTable(villas);
      closeFormModal();

      alert('Berhasil menyimpan data penginapan! Klik "Export Data" untuk mengunduh berkas data.json / villas-data.js terbaru.');
    });
  }


  // ==========================================
  // 7. EXPORT DATA MODAL
  // ==========================================
  if (btnExportData) {
    btnExportData.addEventListener('click', () => {
      const jsonFormatted = JSON.stringify(villas, null, 2);
      jsonOutputText.value = jsonFormatted;
      exportModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeExportModal() {
    exportModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (exportModalCloseBtn) exportModalCloseBtn.addEventListener('click', closeExportModal);

  function downloadFile(filename, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (btnDownloadJson) {
    btnDownloadJson.addEventListener('click', () => {
      const jsonContent = JSON.stringify(villas, null, 2);
      downloadFile('data.json', jsonContent, 'application/json');
    });
  }

  if (btnDownloadJs) {
    btnDownloadJs.addEventListener('click', () => {
      const jsContent = `/**\n * KATALOG VILLA TRETES - VILLAS DATASET\n */\n\nwindow.VILLAS_DATA = ${JSON.stringify(villas, null, 2)};\n`;
      downloadFile('villas-data.js', jsContent, 'text/javascript');
    });
  }

  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', () => {
      jsonOutputText.select();
      navigator.clipboard.writeText(jsonOutputText.value).then(() => {
        alert('Teks JSON berhasil disalin ke clipboard!');
      }).catch(err => {
        console.error('Gagal menyalin:', err);
      });
    });
  }

  // Initialize
  loadAdminData();
});
