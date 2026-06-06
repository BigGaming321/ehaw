/* js/login.js */
/* =============================================
   JAVASCRIPT — Form Validation & Login Functionality
============================================= */
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
  el.getBoundingClientRect();
  el.style.animation = 'shake .35s ease';
}

function setError(input) {
  input.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
}
function clearError(input) {
  input.style.boxShadow = '';
}

[email, password].forEach(inp => {
  inp.addEventListener('input', () => clearError(inp));
});

loginBtn.addEventListener('click', () => {
  let valid = true;

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

  if (valid) {
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;

    fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      
      loginBtn.textContent = '✓ Success!';
      loginBtn.style.background = '#2e7d5e';
      
      // Store the session token locally so other pages know the user is logged in
      if (data.session) {
        localStorage.setItem('supabase.session', JSON.stringify(data.session));
      }

      // Route the user based on the is_admin toggle from the user_roles table
      setTimeout(() => {
        if (data.isAdmin === true) {
          window.location.href = 'admin/index.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 800);
    })
    .catch(err => {
      setError(email);
      setError(password);
      shake(email.closest('.input-wrapper'));
      shake(password.closest('.input-wrapper'));
      
      alert(`Login failed: ${err.message}`);
      
      loginBtn.textContent = 'LOGIN';
      loginBtn.disabled = false;
      
      setTimeout(() => {
        clearError(email);
        clearError(password);
      }, 2000);
    });
  }
});