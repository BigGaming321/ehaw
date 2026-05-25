/* =============================================
   PREVENT PAGE RELOAD
============================================= */
window.addEventListener('submit', (e) => {
  e.preventDefault();
});

window.onbeforeunload = function () {
  console.log('PAGE IS RELOADING');
};


/* =============================================
   HAMBURGER MENU
============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});


/* =============================================
   CATEGORY CHIPS (Single Select)
============================================= */
const chips = document.querySelectorAll('.chip');

// Ensure no chip is selected on initial page load
chips.forEach(chip => chip.classList.remove('selected'));

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    // 1. Remove selection from all others
    chips.forEach(c => c.classList.remove('selected'));

    // 2. Add selection to the one clicked
    chip.classList.add('selected');
  });
});


/* =============================================
   FILE UPLOAD
============================================= */
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');

uploadBtn.addEventListener('click', () => {

  fileInput.click();

});

fileInput.addEventListener('change', () => {

  if (fileInput.files.length) {

    const f = fileInput.files[0];

    /* ---------- FILE SIZE LIMIT ---------- */
    if (f.size > 10 * 1024 * 1024) {

      alert('File exceeds 10MB limit. Please choose a smaller image.');

      fileInput.value = '';

      return;

    }

    fileName.textContent = f.name;

    uploadPreview.classList.add('visible');

    uploadBtn.style.display = 'none';

  }

});

removeFile.addEventListener('click', () => {

  fileInput.value = '';

  uploadPreview.classList.remove('visible');

  uploadBtn.style.display = '';

});


/* =============================================
   SHAKE ANIMATION
============================================= */
function shake(el) {

  el.style.animation = 'none';

  el.getBoundingClientRect();

  el.style.animation = 'shake .35s ease';

}

const shakeStyle = document.createElement('style');

shakeStyle.textContent = `
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}`;

document.head.appendChild(shakeStyle);


/* =============================================
   FORM SUBMISSION (Updated for Supabase + Images)
============================================= */
submitBtn.addEventListener('click', async (e) => {
  
  e.preventDefault();
  e.stopPropagation();

  const selected = document.querySelector('.chip.selected');
  const subject = subjectInput.value.trim();
  
  // Elements for Name and Email (optional)
  const nameInput = document.getElementById('nameInput'); 
  const emailInput = document.getElementById('emailInput');

  let valid = true;

  /* --- CATEGORY VALIDATION --- */
  const categoryBox = document.getElementById('categoryChips');
  if (!selected) {
    categoryBox.style.outline = '2px solid rgba(220,60,60,.4)';
    categoryBox.style.borderRadius = '14px';
    shake(categoryBox);
    valid = false;
  } else {
    categoryBox.style.outline = '';
  }

  /* --- SUBJECT VALIDATION --- */
  if (!subject) {
    subjectInput.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
    shake(subjectInput);
    valid = false;
  }

  if (!valid) return;

  /* --- LOADING STATE --- */
  // Create the spinner element
  const spinner = '<span class="spinner"></span>';
  submitBtn.innerHTML = `${spinner} Uploading...`;
  submitBtn.disabled = true;

  /* --- DATA PREPARATION (FormData for Images) --- */
  // We use FormData because JSON cannot carry file data.
  const formData = new FormData();
  
  formData.append('name', nameInput ? nameInput.value.trim() : 'Anonymous');
  formData.append('email', emailInput ? emailInput.value.trim() : 'N/A');
  formData.append('category', selected.innerText);
  formData.append('subject', subject);

  // Check if a file is actually selected before appending
  if (fileInput.files[0]) {
    // The key 'reportPhoto' MUST match upload.single('reportPhoto') in server.js
    formData.append('reportPhoto', fileInput.files[0]);
  }

  // Inside submitBtn listener in report.js
  try {
    const response = await fetch('https://e-haw.onrender.com/api/reports', {
      method: 'POST',
      body: formData
    });

    // Check status before parsing JSON
    if (response.status === 201) {
      successOverlay.classList.add('visible');
      document.body.classList.add('overlay-open');
      submitBtn.innerText = 'Submitted';
      return;
    }

    // If not 201, check if the response is actually JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      alert('Server Error: ' + (errorData.error || 'Check server logs'));
    } else {
      // This catches 404/500 HTML error pages
      alert(`Server Error: ${response.status}. Ensure server.js has the POST route.`);
    }

  } catch (error) {
    console.error('CONNECTION FAILED:', error);
    alert('Could not connect to the server.');
  } finally {
    /* --- THIS ALWAYS RUNS --- */
    // Remove the spinner and re-enable the button
    submitBtn.innerHTML = 'Submit Report'; 
    submitBtn.disabled = false;
  }
});


/* =============================================
   CLOSE OVERLAY & RESET FORM
============================================= */
successOverlay.addEventListener('click', (e) => {
  if (e.target === successOverlay) {
    // 1. Hide the overlay
    successOverlay.classList.remove('visible');
    document.body.classList.remove('overlay-open');

    // 2. RESET THE FORM DATA
    const reportForm = document.querySelector('form');
    if (reportForm) reportForm.reset();

    // 3. RESET CATEGORY CHIPS
    chips.forEach(c => c.classList.remove('selected'));

    // 4. RESET FILE UPLOAD UI (The fix for your "disappearing" button)
    if (fileInput) fileInput.value = ''; // Clear the actual file data
    
    if (uploadPreview) {
      uploadPreview.classList.remove('visible'); // Hide the checkmark/preview
    }

    if (uploadBtn) {
      uploadBtn.style.display = 'flex'; // BRING THE BUTTON BACK
    }

    if (fileName) {
      fileName.innerText = 'No file chosen';
    }

    // 5. RESET SUBMIT BUTTON
    submitBtn.innerHTML = 'Submit Report';
    submitBtn.disabled = false;
  }
});
