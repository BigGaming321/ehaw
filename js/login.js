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
    // Check for specific credentials
    if (email.value === 'junegooner@email.com' && password.value === 'ilovegooning') {
      loginBtn.textContent = '✓ Logging in…';
      loginBtn.style.background = '#2e7d5e';
      loginBtn.disabled = true;
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 800);
    } 
    else if (email.value === 'juneadmin@gmail.com' && password.value === 'goonerbayot69') {
      loginBtn.textContent = '✓ Logging in…';
      loginBtn.style.background = '#2e7d5e';
      loginBtn.disabled = true;
      
      // Redirect to admin page after a short delay
      setTimeout(() => {
        window.location.href = 'admin/index.html';
      }, 800);
    }
    else {
      // Show error for incorrect credentials
      setError(email);
      setError(password);
      shake(email.closest('.input-wrapper'));
      shake(password.closest('.input-wrapper'));
      
      // Show an alert or error message
      alert('Invalid email or password. Please try again.\n\nUse: junegooner@email.com\nPassword: ilovegooning\n\nUse: juneadmin@gmail.com\nPassword: goonerbayot69');
      
      // Clear the error styling after a moment
      setTimeout(() => {
        clearError(email);
        clearError(password);
      }, 2000);
    }
  }
});

// Also allow Enter key to submit
[email, password].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginBtn.click();
    }
  });
});