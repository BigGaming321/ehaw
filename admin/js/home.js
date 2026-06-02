/* ============================================================
   E-HAW PANEL — welcome.js
   ============================================================ */

(function () {
  'use strict';

  // ── USER DROPDOWN ──────────────────────────────────────────
  const userMenu    = document.getElementById('userMenu');
  const dropdown    = document.getElementById('dropdownMenu');
  const logoutBtn   = document.getElementById('logoutBtn');

  if (userMenu && dropdown) {
    userMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      userMenu.setAttribute('aria-expanded', isOpen);
    });

    userMenu.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userMenu.click();
      }
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      userMenu.setAttribute('aria-expanded', 'false');
    });
  }

  // ── LOGOUT ─────────────────────────────────────────────────
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // ── ACTIVE NAV ITEM ────────────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.sidebar__nav-item').forEach((item) => {
    const href = item.getAttribute('href') || '';
    if (href === currentPage) {
      item.classList.add('active');
    }
  });

  // ── USERNAME & INITIALS FROM SESSION ──────────────────────
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

})();