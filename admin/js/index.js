/**
 * E-HAW PANEL — index.js
 * Handles: Supabase data fetching, dashboard statistics, 
 * summary table rendering, and UI animations.
 */

'use strict';

/* ============================================================
   1. DATA FETCHING (SUPABASE API INTEGRATION)
   ============================================================ */

/**
 * Main initializer. Fetches stats and the report list.
 * Note: Server only returns reports where validity = 'Valid'.
 */
async function loadDashboardData() {
  try {
    // 1. Fetch live stats for the 7 grid boxes
    const statsRes = await fetch('https://e-haw.onrender.com/api/stats');
    if (!statsRes.ok) throw new Error('Stats fetch failed');
    const stats = await statsRes.json();
    
    updateStatBoxes(stats);

    // 2. Fetch live reports for the summary table
    const reportsRes = await fetch('https://e-haw.onrender.com/api/reports');
    if (!reportsRes.ok) throw new Error('Reports fetch failed');
    const reports = await reportsRes.json();
    
    populateSummaryTable(reports);

  } catch (err) {
    console.error('Dashboard Sync Error:', err);
    // Visual feedback for database connection issues
    const tbody = document.getElementById('summaryTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff6b6b; padding:20px;">Database offline or connection refused.</td></tr>`;
    }
  }
}

/**
 * Updates the 7 UI boxes using the [data-stat] attributes.
 */
/**
 * Updates the numbers in the top grid.
 * @param {Object} stats - The stats object from the server.
 */
function updateStatBoxes(stats) {
  // Select all values that have the data-stat attribute
  const statElements = document.querySelectorAll('.stat-box__value');

  statElements.forEach((el) => {
    const statType = el.getAttribute('data-stat');
    
    // If the server returned a value for this type, update it
    if (stats[statType] !== undefined) {
      el.textContent = stats[statType];
    }
  });

  // Re-run the count-up animation for the new numbers
  animateCountUp();
}

/**
 * Renders reports into the summary table.
 * Modified: Filters for 'Valid' (Accepted) reports only.
 */
function populateSummaryTable(reports) {
  const tbody = document.getElementById('summaryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // 1. Filter: Only Accepted (Valid) reports
  const validOnly = reports.filter(r => r.validity === 'Valid');

  if (validOnly.length === 0) {
    // Reset colspan back to 4
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No validated reports found.</td></tr>`;
    return;
  }

  // 2. Slice: Get the 6 most recent
  const recentValid = validOnly.slice(0, 6);

  recentValid.forEach((row) => {
    const tr = document.createElement('tr');
    const displayDate = new Date(row.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // 3. Render: 4 columns only
    tr.innerHTML = `
        <td>${escapeHtml(row.custom_id)}</td>
        <td>${escapeHtml(displayDate)}</td>
        <td>
          <span class="status-badge ${getStatusClass(row.status)}">
              ${escapeHtml(row.status || 'Unresolved')}
          </span>
        </td>
        <td>${escapeHtml(row.category || 'Uncategorized')}</td> 
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Maps status string to its CSS modifier class.
 */
function getStatusClass(status) {
  const map = {
    'Resolved':   'status-badge--resolved',
    'Unresolved': 'status-badge--unresolved',
    'Pending':    'status-badge--pending',
  };
  return map[status] || 'status-badge--unresolved';
}

/* ============================================================
   2. UI INTERACTIONS (DROPDOWN & SIDEBAR)
   ============================================================ */

const userMenu     = document.getElementById('userMenu');
const userDropdown = document.getElementById('userDropdown');

function toggleDropdown(force) {
  const isOpen = userDropdown.classList.contains('open');
  const shouldOpen = (force !== undefined) ? force : !isOpen;

  userDropdown.classList.toggle('open', shouldOpen);
  userMenu.setAttribute('aria-expanded', String(shouldOpen));

  if (shouldOpen) {
    const firstItem = userDropdown.querySelector('[role="menuitem"]');
    if (firstItem) setTimeout(() => firstItem.focus(), 30);
  }
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

function initSidebarNav() {
  const navItems = document.querySelectorAll('.sidebar__nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', function () {
      if (this.classList.contains('sidebar__logout')) return;
      navItems.forEach((i) => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ============================================================
   3. UTILITIES & ANIMATIONS
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

/**
 * Animates numbers from 0 to target for a "live" feel.
 */
function animateCountUp() {
  const statValues = document.querySelectorAll('.stat-box__value');
  statValues.forEach((el) => {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target) || target === 0) return;

    let current = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quadratic function
      const eased = 1 - (1 - progress) * (1 - progress);
      current = Math.round(eased * target);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ============================================================
   4. INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Pull live data from Supabase-backed API
  loadDashboardData();
  // 2. Initialize UI listeners
  initSidebarNav();
});
