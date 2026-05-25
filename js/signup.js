/* js/signup.js */
/* =============================================
   JAVASCRIPT — Form Validation & Interactions
============================================= */
const signupBtn = document.getElementById('signupBtn');
const username  = document.getElementById('username');
const email     = document.getElementById('email');
const password  = document.getElementById('password');
const confirmPw = document.getElementById('confirmPassword');

function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect(); // reflow
  el.style.animation = 'shake .35s ease';
}

/* add shake keyframes once */
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

function setError(input, msg) {
  input.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
  input.title = msg;
}
function clearError(input) {
  input.style.boxShadow = '';
  input.title = '';
}

[username, email, password, confirmPw].forEach(inp => {
  inp.addEventListener('input', () => clearError(inp));
});

signupBtn.addEventListener('click', () => {
  let valid = true;

  if (!username.value.trim()) {
    setError(username, 'Username is required'); shake(username.closest('.input-wrapper')); valid = false;
  }
  if (!email.value.includes('@')) {
    setError(email, 'Enter a valid email'); shake(email.closest('.input-wrapper')); valid = false;
  }
  if (password.value.length < 6) {
    setError(password, 'Password must be at least 6 characters'); shake(password.closest('.input-wrapper')); valid = false;
  }
  if (confirmPw.value !== password.value) {
    setError(confirmPw, 'Passwords do not match'); shake(confirmPw.closest('.input-wrapper')); valid = false;
  }

  if (valid) {
    signupBtn.textContent = '✓ Account Created!';
    signupBtn.style.background = '#2e7d5e';
    signupBtn.disabled = true;
  }
});