/* ════════════════════════════════════════════════
   E-HAW PANEL — queue.js
════════════════════════════════════════════════ */

'use strict';

/* ── Sample Queue Data ───────────────────────── */
const QUEUE = [
  { reportNumber: '2026-000001', date: 'Jun 7, 2026', action: 'Approve' },
  { reportNumber: '2026-000002', date: 'Jun 7, 2026', action: 'Decline' },
  { reportNumber: '2026-000003', date: 'Jun 7, 2026', action: 'Hold'    },
  { reportNumber: '2026-000004', date: 'Jun 7, 2026', action: 'Approve' },
  { reportNumber: '2026-000005', date: 'Jun 7, 2026', action: 'Decline' },
  { reportNumber: '2026-000006', date: 'Jun 7, 2026', action: 'Decline' },
  { reportNumber: '2026-000007', date: 'Jun 8, 2026', action: 'Approve' },
  { reportNumber: '2026-000008', date: 'Jun 8, 2026', action: 'Hold'    },
];

/* ── DOM References ───────────────────────────── */
const tableBody     = document.getElementById('queueTableBody');
const userMenu      = document.getElementById('userMenu');
const userDropdown  = document.getElementById('userDropdown');
const logoutBtn     = document.getElementById('logoutBtn');
const sidebarLogout = document.getElementById('sidebarLogout');

/* ── Escape HTML ─────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Action Config ───────────────────────────── */
const ACTION_CONFIG = {
  Approve: { modifier: 'approve', icon: '✅' },
  Decline: { modifier: 'decline', icon: '❌' },
  Hold:    { modifier: 'hold',    icon: '⏸️'  },
};

/* ── Populate Table ───────────────────────────── */
function buildTable(data = QUEUE) {
  tableBody.innerHTML = '';

  if (data.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3" style="text-align:center;padding:24px;color:var(--text-muted);">No items in queue.</td>`;
    tableBody.appendChild(tr);
    return;
  }

  data.forEach((item, index) => {
    const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.Hold;
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    tr.innerHTML = `
      <td data-label="Report Number">${escapeHTML(item.reportNumber)}</td>
      <td data-label="Date">
        <span class="date-pill">${escapeHTML(item.date)}</span>
      </td>
      <td data-label="Actions">
        <button
          class="action-btn action-btn--${escapeHTML(cfg.modifier)}"
          data-index="${index}"
          aria-label="${escapeHTML(item.action)} report ${escapeHTML(item.reportNumber)}"
        >
          <span class="action-btn__icon" aria-hidden="true">${cfg.icon}</span>
          ${escapeHTML(item.action)}
          <span aria-hidden="true">&#8964;</span>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ── Action Button Handler ───────────────────── */
tableBody.addEventListener('click', e => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const index = Number(btn.dataset.index);
  const item = QUEUE[index];
  if (!item) return;

  // Cycle through actions: Approve → Decline → Hold → Approve
  const cycle = ['Approve', 'Decline', 'Hold'];
  const next = cycle[(cycle.indexOf(item.action) + 1) % cycle.length];
  QUEUE[index] = { ...item, action: next };
  buildTable();
});

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