/* js/login.js */
/* ==========================================================================
   JAVASCRIPT — Unified Role-Based Login Redirect (Supabase Serverless)
========================================================================== */

const loginBtn = document.getElementById('loginBtn');
const email    = document.getElementById('email');
const password = document.getElementById('password');

/* shake keyframes */
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100%{ transform:translateX(0) }
    20%    { transform:translateX(-6px) }
    40%    { transform:translateX(6px) }
    60%    { transform:translateX(-4px) }
    80%    { transform:translateX(4px) }
  }
`;
document.head.appendChild(style);

function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect(); // trigger DOM reflow
  el.style.animation = 'shake .35s ease';
}

function setError(input) {
  input.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
}
function clearError(input) {
  input.style.boxShadow = '';
}

if (email && password) {
  [email, password].forEach(inp => {
    inp.addEventListener('input', () => clearError(inp));
  });
}

/*
if (loginBtn) {
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    let valid = true;

    // 1. Structural Form validation
    if (!email.value.includes('@')) {
      setError(email); 
      shake(email.closest('.input-wrapper')); 
      valid = false;
    }
    if (password.value.length < 1) {
      setError(password); 
      shake(password.closest('.input-wrapper')); 
      valid = false;
    }

    ==========================================================================
    UPDATED LIFECYCLE FOR LOGIN (REPLACE THE HARDCODED CREDENTIAL CHECKS)
    ========================================================================== 
    if (!valid) return;

    loginBtn.textContent = '✓ Authenticating…';
    loginBtn.style.background = '#2e7d5e';
    loginBtn.disabled = true;

    try {
      
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      });

      if (error) throw error;

      
      const { data: profile, error: profileError } = await window.supabaseClient
        .from('accounts')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn("Profile role mapping missing, defaulting to standard route:", profileError.message);
      }

      if (profile && profile.role === 'Admin') {
        console.log('Admin clearance verified. Forwarding to dashboard panel subfolder.');
        window.location.href = 'admin/home.html';
      } else {
        console.log('Standard profile context cleared. Forwarding to home site landing.');
        window.location.href = 'index.html';
      }

    } catch (err) {
      console.error('Authorization rejected:', err.message);
      
      if (err.message.toLowerCase().includes('email not confirmed')) {
        alert('Login Blocked: Please open your inbox and click the verification link to activate your account first.');
      } else {
        alert('Login Failed: ' + err.message);
      }

      setError(email);
      setError(password);
      shake(email.closest('.input-wrapper'));
      shake(password.closest('.input-wrapper'));

      loginBtn.textContent = 'Log In';
      loginBtn.style.background = '';
      loginBtn.disabled = false;
    }
  });
}
*/

const googleLoginBtn = document.getElementById('googleLoginBtn');

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    googleLoginBtn.textContent = 'Redirecting...';
    googleLoginBtn.disabled = true;

    const { error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ensure this matches the redirect URI in your Google Cloud Console
        redirectTo: 'http://ehawreport.github.io/ehaw/callback' 
      }
    });

    if (error) {
      alert('Google Login Failed: ' + error.message);
      googleLoginBtn.textContent = 'Sign in with Google';
      googleLoginBtn.disabled = false;
    }
  });
}