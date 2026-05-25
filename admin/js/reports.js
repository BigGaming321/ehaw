/* ════════════════════════════════════════════════
   E-HAW PANEL — reports.js
   PART 1: State & Data Fetching
════════════════════════════════════════════════ */

'use strict';

/* ── Global State ───────────────────────────── */
let allReports = []; 

/* ── DOM References ───────────────────────────── */
const tableBody       = document.getElementById('reportTableBody');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const validityFilter  = document.getElementById('validityFilter');
const accountBtn      = document.getElementById('userMenu');
const accountDropdown = document.getElementById('userDropdown');
const imageLightbox = document.getElementById('imageLightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const modalProfileImg = document.getElementById('modalProfileImg');

/* ── Fetch Reports ────────────────────────────── */
/**
 * Pulls all records from the database and sorts them
 * so that "Awaiting Review" items appear first.
 */
async function fetchReports() {
  try {
    const response = await fetch('https://e-haw.onrender.com/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    
    allReports = await response.json();
    
    // Custom Sorting Logic: 
    // 1. "Awaiting Review" stays at the top.
    // 2. Everything else is sorted by Date (Newest first).
    allReports.sort((a, b) => {
      // 1. "Awaiting Review" stays at the very top (Priority 1)
      if (a.validity === 'Awaiting Review' && b.validity !== 'Awaiting Review') return -1;
      if (a.validity !== 'Awaiting Review' && b.validity === 'Awaiting Review') return 1;

      // 2. "Invalid" goes to the very bottom (Priority 3)
      if (a.validity === 'Invalid' && b.validity !== 'Invalid') return 1;
      if (a.validity !== 'Invalid' && b.validity === 'Invalid') return -1;

      // 3. Everything else (Valid) stays in the middle, sorted by Date (Priority 2)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    renderTable(allReports);
  } catch (err) {
    console.error('Fetch Error:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:var(--status-unresolved); padding: 2rem;">
          Error connecting to database. Please ensure server.js is running.
        </td>
      </tr>`;
  }
}

/* ── UI Helpers ───────────────────────────────── */
function toggleDropdown() {
  accountDropdown.classList.toggle('open');
}

accountBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown();
});

document.addEventListener('click', () => accountDropdown.classList.remove('open'));

/* ════════════════════════════════════════════════
   E-HAW PANEL — reports.js
   PART 2: Table Rendering & Filter Logic
════════════════════════════════════════════════ */

/**
 * Renders the filtered/sorted data into the HTML table.
 * @param {Array} data - The array of report objects.
 */
function renderTable(data) {
  tableBody.innerHTML = '';

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No matching reports found.</td></tr>`;
    return;
  }

  data.forEach((report, index) => {
    const tr = document.createElement('tr');
    
    // Format Date
    const displayDate = new Date(report.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // Validity CSS Class (handles spaces for "Awaiting Review")
    const validityClass = `validity-tag-${report.validity.toLowerCase().replace(/\s+/g, '-')}`;
    
    /**
     * Logic: If validity is "Awaiting Review", Status column is blank (—).
     * Only "Valid" reports show the Status Badge.
     */
    const statusContent = report.validity === 'Valid' 
      ? `<span class="status-badge status-badge--${report.status.toLowerCase()}">${report.status}</span>`
      : '—';

    // Inside your data.forEach loop in renderTable():
    tr.innerHTML = `
      <td>${escapeHtml(report.custom_id)}</td>
      <td>${escapeHtml(displayDate)}</td>
      <td><span class="category-text">${escapeHtml(report.category || 'General')}</span></td>
      <td><span class="validity-tag ${validityClass}">${report.validity}</span></td>
      <td>${statusContent}</td>
      <td style="text-align: right;">
        <button class="view-btn" onclick="openReportModal(${index})">
          View Details
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ── Filter Logic ─────────────────────────────── */
/**
 * Listens for changes on the validity dropdown.
 */
validityFilter.addEventListener('change', (e) => {
  const selectedValue = e.target.value;
  
  if (selectedValue === 'all') {
    renderTable(allReports);
  } else {
    const filteredReports = allReports.filter(report => report.validity === selectedValue);
    renderTable(filteredReports);
  }
});

/**
 * Basic HTML escaping to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/* ════════════════════════════════════════════════
   E-HAW PANEL — reports.js
   PART 3: Modal Logic & Database Updates
════════════════════════════════════════════════ */

/**
 * Opens the modal and populates it with the selected report's data.
 * @param {number} index - The index of the report in the allReports array.
 */
function openReportModal(index) {
  const report = allReports[index];
  
  // 1. Fill Header & Info
  document.getElementById('modalReportId').textContent = report.custom_id;
  document.getElementById('modalDate').textContent = new Date(report.created_at).toLocaleDateString();
  document.getElementById('modalName').textContent = report.name || "Anonymous Resident";
  document.getElementById('modalDescription').textContent = report.subject;

  // 2. Handle Evidence Photo
  const modalImgWrap = document.querySelector('.modal-profile-img-wrap');
  const modalImg = document.getElementById('modalProfileImg');

  if (report.image_url) {
    modalImg.src = report.image_url;
    modalImg.style.display = 'block';
    // Remove placeholder text if it exists from a previous open
    const placeholder = modalImgWrap.querySelector('.no-photo-placeholder');
    if (placeholder) placeholder.remove();
  } else {
    modalImg.style.display = 'none';
    // Create and add the placeholder if not already there
    if (!modalImgWrap.querySelector('.no-photo-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'no-photo-placeholder';
      placeholder.textContent = 'NO PHOTO AVAILABLE';
      modalImgWrap.appendChild(placeholder);
    }
  }

  // 3. Dynamic Footer Logic
  const footer = document.getElementById('modalFooter');
  footer.innerHTML = ''; // Clear previous buttons

  /**
   * TWO-STAGE ACTION LOGIC:
   * Stage 1: If Validity is not 'Valid', show Accept/Reject.
   * Stage 2: If Validity IS 'Valid', show Resolve/Unresolved.
   */
  if (report.validity !== 'Valid') {
    footer.innerHTML = `
      <button class="modal-btn accept-btn" 
        onclick="updateReportStatus('${report.id}', { validity: 'Valid', status: 'Pending' })">
        Accept Report
      </button>
      <button class="modal-btn decline-btn" 
        onclick="updateReportStatus('${report.id}', { validity: 'Invalid' })">
        Reject / Spam
      </button>
    `;
  } else {
    footer.innerHTML = `
      <button class="modal-btn accept-btn" 
        onclick="updateReportStatus('${report.id}', { status: 'Resolved' })">
        Mark Resolved
      </button>
      <button class="modal-btn decline-btn" 
        onclick="updateReportStatus('${report.id}', { status: 'Unresolved' })">
        Keep Unresolved
      </button>
    `;
  }

  // Show the modal
  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
}

/**
 * Sends a PATCH request to the server to update the report.
 * @param {string} id - The database ID of the report.
 * @param {object} updates - The fields to update (validity and/or status).
 */
async function updateReportStatus(id, updates) {
  try {
    const response = await fetch(`https://e-haw.onrender.com/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      closeModal();
      fetchReports(); // Refresh the table to show changes
    } else {
      const errorData = await response.json();
      alert('Update failed: ' + (errorData.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Update Error:', err);
    alert('Could not connect to server to update report.');
  }
}

/* ── Modal Control ────────────────────────────── */
function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
}

modalClose.addEventListener('click', closeModal);

// Close modal if user clicks on the dark overlay background
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// 1. Open Lightbox when clicking the photo in the modal
modalProfileImg.addEventListener('click', () => {
  if (modalProfileImg.src && modalProfileImg.style.display !== 'none') {
    lightboxImg.src = modalProfileImg.src;
    imageLightbox.classList.add('open');
  }
});

// 2. Close Lightbox functions
function closeLightbox() {
  imageLightbox.classList.remove('open');
}

lightboxClose.addEventListener('click', closeLightbox);
imageLightbox.addEventListener('click', (e) => {
  if (e.target === imageLightbox) closeLightbox();
});

// Add cursor pointer to the image in the main modal to show it is clickable
modalProfileImg.style.cursor = 'zoom-in';

/* ── Initialize ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  fetchReports();
});
