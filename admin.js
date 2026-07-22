/**
 * KATALOG VILLA TRETES - ADMIN DASHBOARD LOGIC (SEWA KAMARAN)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Admin State
  let villas = [];

  // DOM Elements
  const adminVillaTableBody = document.getElementById('adminVillaTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const btnAddVilla = document.getElementById('btnAddVilla');
  const btnExportData = document.getElementById('btnExportData');
  
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
  const formImages = document.getElementById('formImages');
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  }

  // Load Initial Data
  async function loadAdminData() {
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

  // Save State to LocalStorage
  function saveLocalDataset() {
    localStorage.setItem('admin_villas_dataset', JSON.stringify(villas));
    window.VILLAS_DATA = villas;
  }

  // Helper to calculate room price range
  function getRoomPriceRange(v) {
    if (!v.roomTypes || v.roomTypes.length === 0) return 'Belum Ada Kamar';
    const prices = v.roomTypes.map(r => r.priceWeekday);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatIDR(min);
    return `${formatIDR(min)} - ${formatIDR(max)}`;
  }

  // Render Admin Table Rows
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
            <span class="badge ${v.category === 'Luxury' ? 'badge-gold' : (v.category === 'Modern' ? 'badge-cyan' : 'badge-emerald')}">${v.category}</span>
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

  // Render Sub-Form Room Type Card
  function renderRoomTypeCard(room = {}) {
    const cardId = 'room-card-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const card = document.createElement('div');
    card.className = 'admin-room-card';
    card.id = cardId;

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
          <label style="font-size: 0.8rem;">Tipe Kasur</label>
          <input type="text" class="input-control room-bed-type" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem;" 
                 placeholder="Contoh: 1 King Bed / 2 Twin Beds" value="${room.bedType || '1 King Bed'}">
        </div>
      </div>

      <div class="filter-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div class="filter-group">
          <label style="font-size: 0.8rem;">Harga Weekday (Rp) *</label>
          <input type="number" class="input-control room-price-weekday" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem;" 
                 placeholder="350000" value="${room.priceWeekday || 350000}" required>
        </div>

        <div class="filter-group">
          <label style="font-size: 0.8rem;">Harga Weekend (Rp) *</label>
          <input type="number" class="input-control room-price-weekend" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem;" 
                 placeholder="450000" value="${room.priceWeekend || 450000}" required>
        </div>

        <div class="filter-group">
          <label style="font-size: 0.8rem;">Kapasitas (Orang) *</label>
          <input type="number" class="input-control room-capacity" style="padding-left: 0.75rem; height: 40px; font-size: 0.88rem;" 
                 placeholder="2" value="${room.capacity || 2}" required>
        </div>
      </div>

      <div class="filter-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.8rem;">Deskripsi Spesifik Kamar Ini *</label>
        <textarea class="calc-select room-description" style="height: 60px; font-size: 0.85rem; resize: vertical;" 
                  placeholder="Ketikkan deskripsi lengkap fasilitas dan keunggulan kamar ini...">${room.description || ''}</textarea>
      </div>

      <div class="filter-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.8rem;">Fasilitas Khusus Kamar (Pisahkan Koma)</label>
        <input type="text" class="input-control room-amenities" style="padding-left: 0.75rem; height: 40px; font-size: 0.85rem;" 
               placeholder="AC, Smart TV, Hot Shower, Balkon Private" value="${Array.isArray(room.amenities) ? room.amenities.join(', ') : ''}">
      </div>

      <div class="filter-group">
        <label style="font-size: 0.8rem;">URL Foto Kamar (1 URL per baris)</label>
        <textarea class="calc-select room-images" style="height: 50px; font-size: 0.82rem; resize: vertical;" 
                  placeholder="https://images.unsplash.com/photo-kamar-1&#10;https://images.unsplash.com/photo-kamar-2">${Array.isArray(room.images) ? room.images.join('\n') : ''}</textarea>
      </div>
    `;

    adminRoomsContainer.appendChild(card);
  }

  // Remove Room Card
  window.removeRoomCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    if (adminRoomsContainer.children.length <= 1) {
      alert('Setidaknya penginapan harus memiliki 1 tipe kamar!');
      return;
    }
    card.remove();
  };

  // Add New Room Card Button Click
  if (btnAddRoomType) {
    btnAddRoomType.addEventListener('click', () => {
      renderRoomTypeCard({
        name: 'Tipe Kamar Baru',
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

  // Open Form Modal for Add New Property
  if (btnAddVilla) {
    btnAddVilla.addEventListener('click', () => {
      formModalTitle.textContent = 'Tambah Penginapan Baru';
      villaForm.reset();
      formVillaId.value = '';
      adminRoomsContainer.innerHTML = '';
      
      // Add default initial room
      renderRoomTypeCard({
        name: 'Superior Room',
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

  // Open Form Modal for Edit Existing Property
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
    formAmenities.value = Array.isArray(v.amenities) ? v.amenities.join(', ') : '';
    formImages.value = Array.isArray(v.images) ? v.images.join('\n') : '';
    formDescription.value = v.description || '';

    // Render Existing Room Types Sub-Form Cards
    adminRoomsContainer.innerHTML = '';
    if (v.roomTypes && v.roomTypes.length > 0) {
      v.roomTypes.forEach(rt => renderRoomTypeCard(rt));
    } else {
      renderRoomTypeCard({
        name: 'Standard Room',
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

  // Delete Villa
  window.deleteVilla = function(id) {
    const v = villas.find(item => item.id === id);
    if (!v) return;

    if (confirm(`Apakah Anda yakin ingin menghapus "${v.name}"?`)) {
      villas = villas.filter(item => item.id !== id);
      saveLocalDataset();
      renderTable(villas);
    }
  };

  // Close Form Modal Function
  window.closeFormModal = function() {
    formModal.classList.remove('active');
    document.body.style.overflow = '';
  };
  if (formModalCloseBtn) formModalCloseBtn.addEventListener('click', closeFormModal);

  // Form Submit Handler (Add or Update Property & Nested Room Types)
  if (villaForm) {
    villaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const existingId = formVillaId.value;
      const amenitiesList = formAmenities.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const imagesList = formImages.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);

      // Collect Room Types from Sub-Form Cards
      const roomCards = adminRoomsContainer.querySelectorAll('.admin-room-card');
      const roomTypes = [];

      roomCards.forEach(card => {
        const rId = card.querySelector('.room-id').value;
        const rName = card.querySelector('.room-name').value.trim() || 'Tipe Kamar';
        const rBedType = card.querySelector('.room-bed-type').value.trim() || '1 King Bed';
        const rPriceWk = parseInt(card.querySelector('.room-price-weekday').value, 10) || 300000;
        const rPriceWknd = parseInt(card.querySelector('.room-price-weekend').value, 10) || 400000;
        const rCapacity = parseInt(card.querySelector('.room-capacity').value, 10) || 2;
        const rDescription = card.querySelector('.room-description').value.trim() || 'Kamar nyaman.';
        const rAmenities = card.querySelector('.room-amenities').value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const rImages = card.querySelector('.room-images').value.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        roomTypes.push({
          id: rId,
          name: rName,
          priceWeekday: rPriceWk,
          priceWeekend: rPriceWknd,
          capacity: rCapacity,
          bedType: rBedType,
          bathrooms: 1,
          description: rDescription,
          amenities: rAmenities.length > 0 ? rAmenities : ['AC', 'Hot Shower', 'Smart TV'],
          images: rImages.length > 0 ? rImages : (imagesList.length > 0 ? [imagesList[0]] : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'])
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
        amenities: amenitiesList.length > 0 ? amenitiesList : ['View Gunung', 'Wifi', 'Water Heater', 'BBQ Area'],
        images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'],
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

      alert('Berhasil menyimpan data penginapan dan tipe kamar! Jangan lupa klik "Export Data" untuk mengunduh berkas data.json / villas-data.js baru.');
    });
  }

  // Export Data Modal Trigger
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

  // Download File Utility
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

  // One-click Download data.json
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener('click', () => {
      const jsonContent = JSON.stringify(villas, null, 2);
      downloadFile('data.json', jsonContent, 'application/json');
    });
  }

  // One-click Download villas-data.js
  if (btnDownloadJs) {
    btnDownloadJs.addEventListener('click', () => {
      const jsContent = `/**\n * KATALOG VILLA TRETES - VILLAS DATASET\n */\n\nwindow.VILLAS_DATA = ${JSON.stringify(villas, null, 2)};\n`;
      downloadFile('villas-data.js', jsContent, 'text/javascript');
    });
  }

  // One-click Copy JSON Teks
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

  // Initialize Admin Table
  loadAdminData();
});
