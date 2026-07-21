/**
 * KATALOG VILLA TRETES - ADMIN DASHBOARD LOGIC
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
  const formPriceWeekday = document.getElementById('formPriceWeekday');
  const formPriceWeekend = document.getElementById('formPriceWeekend');
  const formCapacity = document.getElementById('formCapacity');
  const formBedrooms = document.getElementById('formBedrooms');
  const formBathrooms = document.getElementById('formBathrooms');
  const formRating = document.getElementById('formRating');
  const formLocation = document.getElementById('formLocation');
  const formPoolType = document.getElementById('formPoolType');
  const formAmenities = document.getElementById('formAmenities');
  const formImages = document.getElementById('formImages');
  const formDescription = document.getElementById('formDescription');

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

  // Load Initial Data (Check LocalStorage, fallback to window.VILLAS_DATA or fetch)
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
    // Also sync window.VILLAS_DATA for immediate local tab preview
    window.VILLAS_DATA = villas;
  }

  // Render Table Rows
  function renderTable(dataset) {
    if (!adminVillaTableBody) return;

    if (dataset.length === 0) {
      adminVillaTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Belum ada data villa. Klik <strong>Tambah Villa Baru</strong> di atas.
          </td>
        </tr>
      `;
      return;
    }

    adminVillaTableBody.innerHTML = dataset.map(v => `
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
        <td>${v.capacity} Tamu</td>
        <td style="color: var(--accent-gold); font-weight: 700;">${formatIDR(v.priceWeekday)}</td>
        <td style="color: var(--accent-gold); font-weight: 700;">${formatIDR(v.priceWeekend)}</td>
        <td>⭐ ${v.rating}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.4rem; justify-content: center;">
            <button class="btn-action-icon btn-action-edit" onclick="editVilla('${v.id}')" title="Ubah Data">
              <i class="ri-pencil-fill"></i>
            </button>
            <button class="btn-action-icon btn-action-delete" onclick="deleteVilla('${v.id}')" title="Hapus Villa">
              <i class="ri-delete-bin-fill"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
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

  // Open Form Modal for Add
  if (btnAddVilla) {
    btnAddVilla.addEventListener('click', () => {
      formModalTitle.textContent = 'Tambah Villa Baru';
      villaForm.reset();
      formVillaId.value = '';
      formModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Open Form Modal for Edit
  window.editVilla = function(id) {
    const v = villas.find(item => item.id === id);
    if (!v) return;

    formModalTitle.textContent = `Ubah Data: ${v.name}`;
    formVillaId.value = v.id;
    formName.value = v.name;
    formCategory.value = v.category;
    formTagline.value = v.tagline || '';
    formPriceWeekday.value = v.priceWeekday;
    formPriceWeekend.value = v.priceWeekend;
    formCapacity.value = v.capacity;
    formBedrooms.value = v.bedrooms;
    formBathrooms.value = v.bathrooms;
    formRating.value = v.rating;
    formLocation.value = v.location;
    formPoolType.value = v.poolType || '';
    formAmenities.value = Array.isArray(v.amenities) ? v.amenities.join(', ') : '';
    formImages.value = Array.isArray(v.images) ? v.images.join('\n') : '';
    formDescription.value = v.description || '';

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

  // Form Submit Handler (Add or Update)
  if (villaForm) {
    villaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const existingId = formVillaId.value;
      const amenitiesList = formAmenities.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const imagesList = formImages.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);

      const villaObj = {
        id: existingId || ('v-' + Date.now()),
        name: formName.value,
        tagline: formTagline.value,
        category: formCategory.value,
        priceWeekday: parseInt(formPriceWeekday.value, 10) || 0,
        priceWeekend: parseInt(formPriceWeekend.value, 10) || 0,
        rating: parseFloat(formRating.value) || 4.8,
        reviewsCount: existingId ? (villas.find(x => x.id === existingId)?.reviewsCount || 10) : 1,
        capacity: parseInt(formCapacity.value, 10) || 10,
        bedrooms: parseInt(formBedrooms.value, 10) || 3,
        bathrooms: parseInt(formBathrooms.value, 10) || 2,
        location: formLocation.value,
        hasPool: amenitiesList.some(a => a.toLowerCase().includes('pool')) || formPoolType.value.length > 0,
        poolType: formPoolType.value || 'Private Swimming Pool',
        amenities: amenitiesList.length > 0 ? amenitiesList : ['Private Pool', 'Wifi', 'Dapur Lengkap'],
        images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'],
        description: formDescription.value || 'Villa nyaman di Tretes Prigen.'
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

      alert('Berhasil menyimpan data villa! Jangan lupa klik "Export Data" untuk mengunduh berkas data.json baru.');
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
