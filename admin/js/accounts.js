/* ════════════════════════════════════════════════
   E-HAW PANEL — accounts.js
════════════════════════════════════════════════ */

'use strict';

/* ── Sample Account Data ─────────────────────── */
const ACCOUNTS = [
  { username: 'JuneGooner67',    email: 'junegooner67@gmail.com',      reports: 4 },
  { username: 'mariasantos',     email: 'mariasantos@gmail.com',       reports: 1 },
  { username: 'josevillanueva', email: 'josevillanueva@yahoo.com',    reports: 3 },
  { username: 'anadsantos',      email: 'anadsantos@gmail.com',        reports: 2 },
  { username: 'robertocruz',     email: 'robertocruz@outlook.com',     reports: 5 },
  { username: 'lizabautista',    email: 'lizabautista@gmail.com',      reports: 2 },
  { username: 'edwinmendoza',    email: 'edwinmendoza@gmail.com',      reports: 1 },
  { username: 'carmelatan',      email: 'carmelatan@yahoo.com',        reports: 6 },
  { username: 'ferdiegarcia',    email: 'ferdiegarcia@gmail.com',      reports: 3 },
  { username: 'reyesmark',       email: 'reyesmark@gmail.com',         reports: 0 },
  { username: 'dalisayrose',     email: 'dalisayrose@outlook.com',     reports: 7 },
  { username: 'santos_lj',       email: 'santoslj@yahoo.com',          reports: 2 },
];

/* ── DOM References ───────────────────────────── */
const tableBody    = document.getElementById('accountTableBody');
const userMenu     = document.getElementById('userMenu');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn    = document.getElementById('logoutBtn');
const sidebarLogout= document.getElementById('sidebarLogout');

/* ── Escape HTML ─────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Populate Table ───────────────────────────── */
function buildTable() {
  tableBody.innerHTML = '';
  ACCOUNTS.forEach(account => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Username">${escapeHTML(account.username)}</td>
      <td data-label="Email">${escapeHTML(account.email)}</td>
      <td data-label="No. of Reports">
        <span class="report-count">${escapeHTML(String(account.reports))}</span>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ── User Menu Dropdown ───────────────────────── */
function toggleUserDropdown() {
  const isOpen = userDropdown.classList.toggle('open');
  userMenu.setAttribute('aria-expanded', String(isOpen));
}

userMenu.addEventListener('click', e => {
  e.stopPropagation();
  toggleUserDropdown();
});

document.addEventListener('click', e => {
  if (!userMenu.contains(e.target)) {
    userDropdown.classList.remove('open');
    userMenu.setAttribute('aria-expanded', 'false');
  }
});

userMenu.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleUserDropdown();
  }
  if (e.key === 'Escape') {
    userDropdown.classList.remove('open');
    userMenu.setAttribute('aria-expanded', 'false');
  }
});

/* ── Logout ──────────────────────────────────── */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}
logoutBtn.addEventListener('click', handleLogout);
sidebarLogout.addEventListener('click', handleLogout);

/* ── Export Button ───────────────────────────── */
document.querySelector('.section__action-btn[title="Export"]')?.addEventListener('click', () => {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  rows.reverse().forEach(r => tableBody.appendChild(r));
});

/* ── Init ────────────────────────────────────── */
buildTable();