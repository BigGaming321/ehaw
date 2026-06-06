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
const statusFilter    = document.getElementById('statusFilter'); 
const accountBtn      = document.getElementById('userMenu');
const accountDropdown = document.getElementById('userDropdown');
const imageLightbox   = document.getElementById('imageLightbox');
const lightboxImg     = document.getElementById('lightboxImg');
const lightboxClose   = document.getElementById('lightboxClose');
const modalProfileImg = document.getElementById('modalProfileImg');

/* ── Fetch Reports (UPDATED FOR SUPABASE SERVERLESS) ──────────────── */
async function fetchReports() {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase client was not initialized properly.');
    }

    console.log('Fetching all database records for administrative review...');

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    allReports = data || [];
    
    // Sort logic: Pending first, On Hold second, then by Date
    allReports.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      if (a.status === 'On Hold' && b.status !== 'On Hold') return -1;
      if (a.status !== 'On Hold' && b.status === 'On Hold') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    renderTable();

  } catch (err) {
    console.error('SUPABASE FETCH QUEUE FAILURE:', err);
    alert('Could not load administrative review logs: ' + err.message);
  }
}

/* ── UI Helpers ───────────────────────────────── */
function toggleDropdown() {
  accountDropdown.classList.toggle('open');
}

if (accountBtn) {
  accountBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}

document.addEventListener('click', () => accountDropdown?.classList.remove('open'));

/* ════════════════════════════════════════════════
   E-HAW PANEL — reports.js
   PART 2: Table Rendering & Filter Logic
════════════════════════════════════════════════ */

function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // 1. Grab the selected status filter value safely
  const selectedStatus = typeof statusFilter !== 'undefined' && statusFilter ? statusFilter.value : 'all';
  
  // 2. Filter items matching the status, while completely excluding 'Declined' records
  /* ══════════════════════════════════════════════════════════════════════════
     UPDATED PART: HIDE ALL UNVERIFIED / INVALID INTAKE ITEMS
     ══════════════════════════════════════════════════════════════════════════ */
  // 2. Filter items matching the status, while completely excluding 'Declined' or unverified records
  const filtered = allReports.filter(report => {
    // CRITICAL GUARD: Only display reports that have been explicitly marked 'Valid' in the queue
    if (report.validity !== 'Valid') return false;

    // Force the system to completely skip and hide any Declined/Invalid report statuses
    if (report.status === 'Declined') return false;
    
    // Apply the dropdown selection filter for the remaining valid statuses
    if (selectedStatus !== 'all' && report.status !== selectedStatus) return false;
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">
          No matching valid reports found for status "${selectedStatus}".
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((report, index) => {
    const row = document.createElement('tr');
    
    const reportDate = report.created_at 
      ? new Date(report.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      : 'N/A';

    // Build the row elements—the actionButtonsHTML has been completely removed from here
    row.innerHTML = `
      <td>${escapeHtml(report.custom_id)}</td>
      <td>${escapeHtml(reportDate)}</td>
      <td><span class="category-text">${escapeHtml(report.category || 'General')}</span></td>
      <td>
        <span class="status-badge status-badge--${report.status ? report.status.toLowerCase().replace(/ /g, '-') : 'pending'}">
          ${report.status || 'Pending'}
        </span>
      </td>
      <td style="text-align: left;">
        <button class="view-btn" onclick="openReportModal(${index})">Details</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

/* ════════════════════════════════════════════════
   E-HAW PANEL — reports.js
   PART 3: Modal Logic & Database Updates
════════════════════════════════════════════════ */

function openReportModal(index) {
  const report = allReports[index];
  if (!report) return;
  
  document.getElementById('modalReportId').textContent = report.custom_id || "N/A";
  document.getElementById('modalDate').textContent = report.created_at 
    ? new Date(report.created_at).toLocaleDateString() 
    : "N/A";
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
      placeholder.textContent = 'NO PHOTO AVAILABLE';
      modalImgWrap.appendChild(placeholder);
    }
  }

/* ── ACTION BUTTONS MOVED EXCLUSIVELY HERE (CLEAN ARCHITECTURE) ── */
  let modalButtonsHTML = '';

  if (report.status === 'Pending') {
    modalButtonsHTML = `
      <button class="modal-btn accept-btn" onclick="updateReportStatus(${report.id}, 'Resolved')">Resolve</button>
      <button class="modal-btn hold-btn" onclick="updateReportStatus(${report.id}, 'On Hold')">Hold</button>
      <button class="modal-btn decline-btn" onclick="updateReportStatus(${report.id}, 'Declined')">Decline</button>
    `;
  } else if (report.status === 'On Hold') {
    modalButtonsHTML = `
      <button class="modal-btn continue-btn" onclick="updateReportStatus(${report.id}, 'Pending')">Continue</button>
      <button class="modal-btn decline-btn" onclick="updateReportStatus(${report.id}, 'Declined')">Decline</button>
    `;
  } else {
    modalButtonsHTML = '<span class="status-locked">This report transaction is finalized.</span>';
  }

  const footer = document.getElementById('modalFooter');
  if (footer) footer.innerHTML = modalButtonsHTML;

  if (modalOverlay) {
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
  }
}

async function updateReportStatus(id, newStatus) {
  // 1. Intercept finalized states with our custom HTML UI popup window injection
  if (newStatus === 'Resolved' || newStatus === 'Declined') {
    
    // Create the background overlay container dynamically
    const confirmOverlay = document.createElement('div');
    confirmOverlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.8);
      backdrop-filter: blur(6px); display: flex; align-items: center;
      justify-content: center; z-index: 5000; animation: fadeIn 0.2s ease;
    `;

    // Build the styled confirmation dialog window frame matching your theme colors
    const confirmBox = document.createElement('div');
    confirmBox.style.cssText = `
      background: var(--modal-bg, #2a3410); border: 1px solid var(--panel-border, rgba(117,145,57,0.25));
      border-radius: 14px; width: 90%; max-width: 420px; padding: 24px; text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6); animation: scaleUp 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    // Title element
    const title = document.createElement('h3');
    title.textContent = `Confirm Final Action`;
    title.style.cssText = `
      font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700;
      color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;
    `;

    // Description text body
    const msg = document.createElement('p');
    msg.innerHTML = `Are you absolutely sure you want to mark this report entry as <strong style="color: ${newStatus === 'Resolved' ? '#a7e053' : '#ff6b6b'};">${newStatus}</strong>?<br><span style="font-size: 11px; opacity: 0.6; display:inline-block; margin-top:8px;">This will permanently lock the review transaction line.</span>`;
    msg.style.cssText = `color: var(--text-dark, #e8efcf); font-size: 13px; line-height: 1.6; margin-bottom: 24px;`;

    // Button controls wrapper
    const btnWrapper = document.createElement('div');
    btnWrapper.style.cssText = `display: flex; justify-content: center; gap: 14px;`;

    // Cancel dynamic button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'modal-btn decline-btn'; // Uses your native CSS design rules
    cancelBtn.style.cssText = `min-width: 110px; padding: 8px 16px; font-size: 12px;`;
    cancelBtn.onclick = () => confirmOverlay.remove(); // Safely teardown layout immediately on cancel

    // Confirm execution dynamic button
    const proceedBtn = document.createElement('button');
    proceedBtn.textContent = `Yes, ${newStatus}`;
    proceedBtn.className = 'modal-btn accept-btn'; // Uses your native CSS design rules
    proceedBtn.style.cssText = `min-width: 110px; padding: 8px 16px; font-size: 12px;`;
    
    // Core transaction wrapper fired strictly when confirmation is clicked
    proceedBtn.onclick = async () => {
      confirmOverlay.remove(); // Remove popup prompt window frame loop
      await executeStatusUpdate(id, newStatus); // Forward payload cleanly to Supabase handler
    };

    // Assemble components into browser active DOM node structure layout tree
    btnWrapper.appendChild(cancelBtn);
    btnWrapper.appendChild(proceedBtn);
    confirmBox.appendChild(title);
    confirmBox.appendChild(msg);
    confirmBox.appendChild(btnWrapper);
    confirmOverlay.appendChild(confirmBox);
    document.body.appendChild(confirmOverlay);
    
    return; // Halt stream loop execution until explicit option button action resolves
  }

  // If status is 'On Hold' or 'Pending', bypass popup dialog wrapper window completely
  await executeStatusUpdate(id, newStatus);
}

/* ── Auxiliary Function: Segregated Direct Supabase Database Execution Stream ── */
async function executeStatusUpdate(id, newStatus) {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) throw new Error('Supabase client link is missing.');

    console.log(`Executing isolated database database cell patch for entry ID ${id} to: ${newStatus}`);

    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    closeModal();    // Clear main detailed card view drawers layout
    fetchReports();  // Redraw database rows board completely synchronized

  } catch (err) {
    console.error('SUPABASE TRANSACTION EXCEPTION:', err);
    alert('Could not update status: ' + err.message);
  }
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }
}

if (modalClose) modalClose.addEventListener('click', closeModal);

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

if (modalProfileImg) {
  modalProfileImg.style.cursor = 'zoom-in';
  modalProfileImg.addEventListener('click', () => {
    if (modalProfileImg.src && modalProfileImg.style.display !== 'none') {
      lightboxImg.src = modalProfileImg.src;
      imageLightbox?.classList.add('open');
    }
  });
}

if (lightboxClose) lightboxClose.addEventListener('click', () => imageLightbox?.classList.remove('open'));
if (imageLightbox) {
  imageLightbox.addEventListener('click', (e) => {
    if (e.target === imageLightbox) imageLightbox.classList.remove('open');
  });
}

/* ── Initialize ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  fetchReports();
});

if (statusFilter) {
  statusFilter.addEventListener('change', () => {
    renderTable();
  });
}

/* ── Dynamically Update Username ────────────────────────────── */
async function loadActiveUser() {
  const activeUserSpan = document.getElementById('activeUsername');
  
  try {
    // 1. Get current session
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (user) {
      // 2. Fetch user name from 'accounts' table based on their email or ID
      const { data: profile, error } = await window.supabaseClient
        .from('accounts')
        .select('name')
        .eq('email', user.email)
        .single();
        
      if (profile) {
        activeUserSpan.innerText = profile.name;
      } else {
        activeUserSpan.innerText = 'User';
      }
    }
  } catch (err) {
    console.error("Error loading user profile:", err);
    activeUserSpan.innerText = 'User';
  }
}

// 3. Call this function when the page initializes
loadActiveUser();

async function handleLogout() {
  if (confirm('Are you sure you want to logout from E-HAW Panel?')) {
    try {
      // Use built-in Auth signOut engine to clear storage tokens securely
      await window.supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Error ending cloud session token context:', err.message);
    } finally {
      // Redirect to login.html as requested
      window.location.href = '../login.html'; 
    }
  }
}

// Ensure listeners are added after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarLogout = document.getElementById('sidebarLogout');
  
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (sidebarLogout) sidebarLogout.addEventListener('click', handleLogout);
});