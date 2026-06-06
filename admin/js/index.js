/**
 * E-HAW PANEL — index.js
 * Handles: Live Supabase analytics calculations, 
 * summary table rendering, and UI count-up animations.
 */

'use strict';

/* ============================================================
   1. DATA FETCHING & METRICS ENGINE (SUPABASE INTEGRATION)
   ============================================================ */

/**
 * Main initializer. Fetches and processes live records.
 */
async function loadDashboardData() {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase global instance connection link is broken.');
    }

    console.log('Querying cloud logging rows to generate dashboard metrics...');

    // Fetch all records from the database table
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = reports || [];

    // Initialize our 8 tracking counters
    let countTotal    = 0;
    let countDay      = 0;
    let countWeek     = 0;
    let countMonth    = 0;
    let countPending  = 0;
    let countHold     = 0;
    let countResolved = 0;
    let countAwaiting = 0;

    // Time-boundary baselines for date filtering
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek  = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Sunday baseline
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    items.forEach(report => {
      // 1. Awaiting Acceptance tracks reports still pending screening in the intake queue
      if (!report.validity || report.validity === 'Pending') {
        countAwaiting++;
      }

      // 2. The remaining metrics block exclusively counts validated entries
      if (report.validity !== 'Valid') return;

      countTotal++;

      // Date calculations
      const reportDate = report.created_at ? new Date(report.created_at) : null;
      if (reportDate) {
        if (reportDate >= startOfToday) countDay++;
        if (reportDate >= startOfWeek)  countWeek++;
        if (reportDate >= startOfMonth) countMonth++;
      }

      // Status conditions mapping
      if (report.status === 'Pending') {
        countPending++;
      } else if (report.status === 'On Hold') {
        countHold++;
      } else if (report.status === 'Resolved') {
        countResolved++;
      }
    });

    // Package metrics object to send to the UI updater
    const statsPayload = {
      total: countTotal,
      day: countDay,
      week: countWeek,
      month: countMonth,
      pending: countPending,
      hold: countHold, // Maps to your new data-stat="hold" slot
      resolved: countResolved,
      awaiting: countAwaiting
    };

    updateStatBoxes(statsPayload);
    populateSummaryTable(items);

  } catch (err) {
    console.error('Dashboard Sync Error:', err);
    // Visual error logging feedback for structural interface bugs
    const tbody = document.getElementById('summaryTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff6b6b; padding:20px;">Database offline or connection refused: ${err.message}</td></tr>`;
    }
  }
}

/**
 * Updates the 8 UI grid boxes using the [data-stat] selector keys.
 */
function updateStatBoxes(stats) {
  const statElements = document.querySelectorAll('.stat-box__value');

  statElements.forEach((el) => {
    const statType = el.getAttribute('data-stat');
    
    if (stats[statType] !== undefined) {
      el.textContent = stats[statType];
    }
  });

  animateCountUp();
}

/**
 * Renders the 6 most recent validated records into the overview summary table grid.
 */
function populateSummaryTable(reports) {
  const tbody = document.getElementById('summaryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Filter: Only display validated reports that have passed screening
  const validOnly = reports.filter(r => r.validity === 'Valid');

  if (validOnly.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No validated reports found.</td></tr>`;
    return;
  }

  // Slice down to the 6 most recent entries
  const recentValid = validOnly.slice(0, 6);

  recentValid.forEach((row) => {
    const tr = document.createElement('tr');
    const displayDate = new Date(row.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // Construct the 4-column data grid row string layout loop
    // FIXED: The status badge class format now generates reports-style syntax (e.g., status-badge--on-hold)
    const statusClassKey = row.status ? row.status.toLowerCase().replace(/ /g, '-') : 'pending';

    tr.innerHTML = `
        <td>${escapeHtml(row.custom_id)}</td>
        <td>${escapeHtml(displayDate)}</td>
        <td>
          <span class="status-badge status-badge--${statusClassKey}">
              ${escapeHtml(row.status || 'Pending')}
          </span>
        </td>
        <td>${escapeHtml(row.category || 'General')}</td> 
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Maps the exact status strings to your native layout index.css rules
 * REMOVED: Bypassed in favor of the direct uniform class key string mapping generator above
 */
function getStatusClass(status) {
  return '';
}

/* ============================================================
   2. UI INTERACTIONS (DROPDOWN NAVIGATION MANAGEMENT)
   ============================================================ */

const userMenu     = document.getElementById('userMenu');
const userDropdown = document.getElementById('userDropdown');

function toggleDropdown(force) {
  if (!userDropdown || !userMenu) return;
  const isOpen = userDropdown.classList.contains('open');
  const shouldOpen = (force !== undefined) ? force : !isOpen;

  userDropdown.classList.toggle('open', shouldOpen);
  userMenu.setAttribute('aria-expanded', String(shouldOpen));
}

if (userMenu) {
  userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}

document.addEventListener('click', (e) => {
  if (userMenu && !userMenu.contains(e.target)) toggleDropdown(false);
});

/* ============================================================
   3. UTILITIES & COUNT-UP ANIMATION FUNCTIONS
   ============================================================ */

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function animateCountUp() {
  const statValues = document.querySelectorAll('.stat-box__value');
  statValues.forEach((el) => {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target) || target === 0) return;

    let current = 0;
    const duration = 800;
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      current = Math.round(eased * target);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ============================================================
   4. INITIALIZATION LAYER
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});