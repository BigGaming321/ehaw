/* ════════════════════════════════════════════════
   E-HAW PANEL — queue.js (SUPABASE SERVERLESS ENGINE)
════════════════════════════════════════════════ */

'use strict';

/* ── Global Queue State ──────────────────────── */
let queueReports = []; 

/* ── DOM References ──────────────────────────── */
const tableBody       = document.getElementById('queueTableBody');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const userMenu        = document.getElementById('userMenu');
const userDropdown    = document.getElementById('userDropdown');
const logoutBtn       = document.getElementById('logoutBtn');
const sidebarLogout   = document.getElementById('sidebarLogout');
const modalProfileImg = document.getElementById('modalProfileImg');
const lightboxImg     = document.getElementById('lightboxImg');
const imageLightbox   = document.getElementById('imageLightbox');
const lightboxClose   = document.getElementById('lightboxClose');

/* ── Fetch Verification Queue from Supabase ──── */
async function fetchQueue() {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) throw new Error('Supabase configuration linkage missing.');

    console.log('Fetching awaiting screening log queue...');

    // Fetch all records from your table
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: true }); // Oldest reports show first in queue

    if (error) throw error;

    // Strict Filter: Only show reports where validity is 'Awaiting Review' or completely null/blank
    queueReports = (data || []).filter(report => {
      return report.validity === 'Pending';
    });

    buildTable();

  } catch (err) {
    console.error('QUEUE SYNC FAILURE:', err);
    alert('Could not update intake log streams: ' + err.message);
  }
}

/* ── Build Screen Queue Grid ─────────────────── */
function buildTable() {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (queueReports.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:32px;color:var(--text-muted);">No unverified reports left in queue. Screen is clear!</td></tr>`;
    return;
  }

  queueReports.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'table-row-clickable';
    
    // Clicking anywhere on the row triggers the modal details view pop-up
    tr.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      openReportModal(index);
    });

    const reportDate = item.created_at 
      ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    tr.innerHTML = `
      <td data-label="Report Number" style="font-weight:700; color:var(--text-primary);">${escapeHTML(item.custom_id || 'N/A')}</td>
      <td data-label="Date"><span class="date-pill">${escapeHTML(reportDate)}</span></td>
      <td data-label="Actions">
        <button class="queue-view-btn" onclick="openReportModal(${index})">Screen Details</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   REPLACED PART: CORE MODAL & DIRECT DB EXECUTION (NO POPUP WINDOW)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Open Verification Modal Popup Drawer ────── */
function openReportModal(index) {
  const report = queueReports[index];
  if (!report) return;

  document.getElementById('modalReportId').textContent = report.custom_id || "N/A";
  document.getElementById('modalDate').textContent = report.created_at ? new Date(report.created_at).toLocaleDateString() : "N/A";
  document.getElementById('modalName').textContent = report.name || "Anonymous Resident";
  document.getElementById('modalDescription').textContent = report.subject || "";

  const modalImgWrap = document.querySelector('.modal-profile-img-wrap');
  const modalImg = document.getElementById('modalProfileImg');

  if (report.image_url) {
    modalImg.src = report.image_url;
    modalImg.style.display = 'block';
    const placeholder = modalImgWrap ? modalImgWrap.querySelector('.no-photo-placeholder') : null;
    if (placeholder) placeholder.remove();
  } else {
    modalImg.style.display = 'none';
    if (modalImgWrap && !modalImgWrap.querySelector('.no-photo-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'no-photo-placeholder';
      placeholder.textContent = 'NO EVIDENCE ATTACHED';
      modalImgWrap.appendChild(placeholder);
    }
  }

  // Inject strict verification buttons inside modal footer that call the database execution instantly
  const footer = document.getElementById('modalFooter');
  if (footer) {
    footer.innerHTML = `
      <button class="modal-btn accept-btn" onclick="executeVerification(${report.id}, 'Valid')">Mark Valid</button>
      <button class="modal-btn decline-btn" onclick="executeVerification(${report.id}, 'Invalid')">Mark Invalid</button>
    `;
  }

  modalOverlay?.classList.add('open');
  modalOverlay?.setAttribute('aria-hidden', 'false');
}

/* ── Execute Validity Update Directly to Database ─────── */
async function executeVerification(id, targetValidity) {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) throw new Error('Supabase communication channel broken.');

    console.log(`Writing verification update for ${id} directly to: ${targetValidity}`);

    // Update the validity column cell directly in your table row
    const { error } = await supabase
      .from('reports')
      .update({ validity: targetValidity })
      .eq('id', id);

    if (error) throw error;

    closeModal();
    fetchQueue(); // Reload the filtered queue layout instantly

  } catch (err) {
    console.error('CRITICAL TRANSACTION EXCEPTION:', err);
    alert('Could not submit judgment rules: ' + err.message);
  }
}

/* ── UI Core Mechanics Controls ──────────────── */
function closeModal() {
  modalOverlay?.classList.remove('open');
  modalOverlay?.setAttribute('aria-hidden', 'true');
}

if (modalClose) modalClose.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

if (modalProfileImg) {
  modalProfileImg.style.cursor = 'zoom-in';
  modalProfileImg.addEventListener('click', () => {
    if (modalProfileImg.src && modalProfileImg.style.display !== 'none') {
      lightboxImg.src = modalProfileImg.src;
      imageLightbox?.classList.add('open');
    }
  });
}
lightboxClose?.addEventListener('click', () => imageLightbox?.classList.remove('open'));
imageLightbox?.addEventListener('click', (e) => { if (e.target === imageLightbox) imageLightbox.classList.remove('open'); });

/* ── User Dropdown Nav Options ───────────────── */
function toggleUserDropdown() { userDropdown?.classList.toggle('open'); }
userMenu?.addEventListener('click', e => { e.stopPropagation(); toggleUserDropdown(); });
document.addEventListener('click', () => userDropdown?.classList.remove('open'));

function handleLogout() { if (confirm('Are you sure you want to logout?')) window.location.href = 'index.html'; }
logoutBtn?.addEventListener('click', handleLogout);
sidebarLogout?.addEventListener('click', handleLogout);

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Initialization ──────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  fetchQueue();
});