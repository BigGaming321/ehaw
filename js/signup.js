/* js/signup.js */
/* ==========================================================================
   JAVASCRIPT — Unified Serverless Account Registration Handler
========================================================================== */

'use strict';

const signupBtn = document.getElementById('signupBtn');
const username  = document.getElementById('username');
const email     = document.getElementById('email');
const password  = document.getElementById('password');
const confirmPw = document.getElementById('confirmPassword');

function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect(); // trigger DOM reflow
  el.style.animation = 'shake .35s ease';
}

function setError(input, msg) {
  input.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
  input.title = msg;
}

function clearError(input) {
  input.style.boxShadow = '';
  input.title = '';
}

if (signupBtn) {
  signupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    let valid = true;

    // 1. Structural Form Input Validation checks
    if (!username.value.trim()) {
      setError(username, 'Username is required'); 
      shake(username.closest('.input-wrapper')); 
      valid = false;
    }
    if (!email.value.includes('@')) {
      setError(email, 'Enter a valid email'); 
      shake(email.closest('.input-wrapper')); 
      valid = false;
    }
    if (password.value.length < 8) {
      setError(password, 'Password must be at least 8 characters long'); 
      shake(password.closest('.input-wrapper')); 
      valid = false;
    }
    if (password.value !== confirmPw.value) {
      setError(confirmPw, 'Passwords do not match'); 
      shake(confirmPw.closest('.input-wrapper')); 
      valid = false;
    }

    /* ==========================================================================
    UPDATED LIFECYCLE FOR SIGNUP (REPLACE THE LOWER HALF OF YOUR FILE)
    ========================================================================== */
    if (!valid) return;

    // Change button state to show loading status
    signupBtn.textContent = 'Sending Verification...';
    signupBtn.disabled = true;

    try {
      // Register the account directly with Supabase Auth
      const { data, error } = await window.supabaseClient.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          data: { 
            name: username.value.trim() // The trigger handles pulling your email automatically now!
          },
          emailRedirectTo: window.location.origin + '/login.html'
        }
      });

      if (error) throw error;

      // Direct the user to verify their account link
      alert('Registration initiated! A verification link has been sent to your email address. Please check your inbox and click the link to confirm your account before logging in.');
      window.location.href = 'login.html';

    } catch (err) {
      console.error('Registration failed:', err.message);
      alert('Sign Up Error: ' + err.message);
      
      // Restore original interaction button states
      signupBtn.textContent = 'Sign Up';
      signupBtn.disabled = false;
    }
  });
}