/* ============================================================
   E-HAW PANEL — home.js (SUPABASE LIVE COUNTERS)
   ============================================================ */

(function () {
  'use strict';

  // ── USER DROPDOWN & SIDEBAR LOGOUT ─────────────────────────
  const userMenu    = document.getElementById('userMenu');
  const dropdown    = document.getElementById('dropdownMenu');
  const logoutBtn   = document.getElementById('logoutBtn');

  if (userMenu && dropdown) {
    userMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      userMenu.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      userMenu.setAttribute('aria-expanded', 'false');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // ── ACTIVE NAV ITEM HIGH-LIGHTER ───────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar__nav-item').forEach((item) => {
    const href = item.getAttribute('href') || '';
    if (href === currentPage) {
      item.classList.add('active');
    }
  });

  // ── USERNAME SESSION DATA PARSER ───────────────────────────
  const usernameDisplay = document.getElementById('usernameDisplay');
  const avatarInitials  = document.getElementById('avatarInitials');

  const storedUsername = sessionStorage.getItem('username') || localStorage.getItem('username');
  if (storedUsername && usernameDisplay) {
    usernameDisplay.textContent = storedUsername;
    if (avatarInitials) {
      const parts    = storedUsername.trim().split(/\s+/);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : storedUsername.slice(0, 2).toUpperCase();
      avatarInitials.textContent = initials;
    }
  }

  // ── SUPABASE ANALYTICS CALCULATIONS ENGINE ─────────────────
  async function computeLiveMetrics() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) {
        console.error('Supabase configuration missing from global client context.');
        return;
      }

      console.log('Querying cloud logging rows to generate home metric balances...');

      // Pull down the key rows from the reports table
      const { data, error } = await supabase
        .from('reports')
        .select('status, validity');

      if (error) throw error;

      const items = data || [];

      // Initialize counter storage
      let countTotal    = 0;
      let countPending  = 0;
      let countHold     = 0;
      let countResolved = 0;

      items.forEach(report => {
        // Condition: Exclude unverified or completely invalid reports from metrics board completely
        if (report.validity !== 'Valid') return;

        // Count toward total valid submissions
        countTotal++;

        // Sort into specific metric status buckets
        if (report.status === 'Pending') {
          countPending++;
        } else if (report.status === 'On Hold') {
          countHold++;
        } else if (report.status === 'Resolved') {
          countResolved++;
        }
      });

      // Safely write the calculated balances straight to your HTML nodes
      if (document.getElementById('counterTotal'))    document.getElementById('counterTotal').textContent = countTotal;
      if (document.getElementById('counterPending'))  document.getElementById('counterPending').textContent = countPending;
      if (document.getElementById('counterHold'))     document.getElementById('counterHold').textContent = countHold;
      if (document.getElementById('counterResolved')) document.getElementById('counterResolved').textContent = countResolved;

    } catch (err) {
      console.error('DASHBOARD METRIC GENERATION CRITICAL CRASH:', err);
    }
  }

  // Fire engine calculations as soon as DOM content tree settles safely
  document.addEventListener('DOMContentLoaded', () => {
    computeLiveMetrics();
  });

})();