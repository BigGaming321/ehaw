/* ==========================================================================
   E-HAW PANEL — ACCOUNTS LIST CONTROLLER (SERVERLESS)
   ========================================================================== */

'use strict';

/* ── DOM References ────────────────────────────────────────────────────── */
const tableBody     = document.getElementById('accountTableBody');
const userMenu      = document.getElementById('userMenu');
const userDropdown  = document.getElementById('userDropdown');
const logoutBtn     = document.getElementById('logoutBtn');
const sidebarLogout = document.getElementById('sidebarLogout');

/* ── Escape HTML Utility (Prevents XSS Injection Attacks) ───────────────── */
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Populate Table Natively from Supabase ──────────────────────────────── */
/* ── Populate Table Natively from Supabase ──────────────────────────────── */
async function buildTable() {
  if (!tableBody) return;

  try {
    // 1. Show structural loading feedback to dashboard operators
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;\">
          Loading active personnel profiles...
        </td>
      </tr>
    `;

    // 2. Fetch live employee roster details using your updated column names
    const { data: accounts, error } = await window.supabaseClient
      .from('accounts')
      .select('id, name, email, role'); // Changed from 'contact' to 'email'

    if (error) {
      throw error;
    }

    // 3. Wipe loading animation state out of DOM tree elements container
    tableBody.innerHTML = '';

    if (!accounts || accounts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;\">
            No registered profiles found.
          </td>
        </tr>
      `;
      return;
    }

    // 4. Run loop to dynamically inject matching personnel data lines
    accounts.forEach(account => {
      console.log("Account UUID:", account.id);
      const row = document.createElement('tr');

      // Setup clean clearance level labels matching your CSS status design variables
      const isUserAdmin = account.role && account.role.toLowerCase() === 'admin';
      const statusClass = isUserAdmin ? 'status-pill--admin' : 'status-pill--user';
      const roleText    = isUserAdmin ? 'ADMIN' : 'USER';

      // Ensure the final data cell wrapper block looks exactly like this line:
      row.innerHTML = `
        <td>${escapeHTML(account.name || 'Unknown')}</td>
        <td>${escapeHTML(account.email || '—')}</td>
        <td style="text-align: center;"> 
          <span class="status-pill ${statusClass}" 
                onclick="openRoleModal('${account.id}', '${account.role}', '${escapeHTML(account.name)}')">
            ${roleText}
          </span>
        </td>
      `;

      tableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Table visualization data drop:', err.message);
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--status-unresolved); padding: 2rem;\">
          Failed to load accounts ledger: ${escapeHTML(err.message)}
        </td>
      </tr>
    `;
  }
}

/* ── User Menu Dropdown Panel Controls ──────────────────────────────────── */
function toggleUserDropdown() {
  const isOpen = userDropdown.classList.toggle('open');
  userMenu.setAttribute('aria-expanded', String(isOpen));
}

if (userMenu && userDropdown) {
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
}

/* ── Log Out Controller (Terminates Live Serverless Client Sessions) ────── */
async function handleLogout() {
  if (confirm('Are you sure you want to logout from E-HAW Panel?')) {
    try {
      // Use built-in Auth signOut engine to clear storage tokens securely
      await window.supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Error ending cloud session token context:', err.message);
    } finally {
      // Kick client immediately back out to the authorization screen layout
      window.location.href = 'index.html';
    }
  }
}

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (sidebarLogout) sidebarLogout.addEventListener('click', handleLogout);

/* ── Export Layout Action Handler (Reverses UI Listing Order) ───────────── */
document.querySelector('.section__action-btn[title="Export"]')?.addEventListener('click', () => {
  if (!tableBody) return;
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  if (rows.length <= 1) return;
  
  rows.reverse().forEach(r => tableBody.appendChild(r));
});

/* ── Automatic Entry Loop Initialization ───────────────────────────────── */
buildTable();

/* ── Updated Role Update Controller ────────────────────────── */
async function updateRole(userId, newRole) {
  console.log("Supabase Client:", window.supabaseClient); // Check if this is initialized
  console.log("Updating User ID:", userId, "to Role:", newRole); 

  const { data, error } = await window.supabaseClient
    .from('accounts')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error("FULL ERROR OBJECT:", error); // Copy the ENTIRE object from console
    alert("Update failed: " + error.message);
  } else {
    location.reload();
  }
}

/* ── Role Management Modal Controller ────────────────────────────── */
window.openRoleModal = (userId, currentRole, userName) => {
  const modal = document.getElementById('roleModal');
  const btn = document.getElementById('roleActionBtn');
  const modalPermissions = document.getElementById('modalPermissions');
  
  // Normalize roles (handle undefined/null cases)
  const isAdmin = currentRole?.toLowerCase() === 'admin';

  document.getElementById('modalUserTitle').innerText = `Manage: ${userName}`;
  modalPermissions.innerText = isAdmin 
    ? "This user is an Admin. They have full access to management features." 
    : "This user is a User. They have limited operational access.";

  btn.innerText = isAdmin ? "Demote to User" : "Promote to Admin";
  btn.className = isAdmin ? "action-btn demote" : "action-btn promote";
  
  // Set the dynamic click action
  btn.onclick = () => updateRole(userId, isAdmin ? 'User' : 'Admin');
  modal.style.display = 'flex';
};

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

/* ── Log Out Controller (Terminates Live Serverless Client Sessions) ────── */
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