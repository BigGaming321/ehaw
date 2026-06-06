/* =============================================
   PREVENT DEFAULT FORM REFRESHES
============================================= */
window.addEventListener('submit', (e) => {
  e.preventDefault();
});

/* =============================================
   HAMBURGER MENU
============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
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
}

/* =============================================
   CATEGORY CHIPS (Single Select)
============================================= */
const chips = document.querySelectorAll('.chip');
chips.forEach(chip => chip.classList.remove('selected'));

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });
});

/* =============================================
   FILE UPLOAD UI HANDLING (VANISHING + VIEWABLE)
============================================= */
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');

const uploadBtnEl = document.querySelector('.upload-btn');
const sectionHintEl = uploadBtnEl ? uploadBtnEl.nextElementSibling : null;

if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      const f = fileInput.files[0];

      /* ---------- FILE SIZE LIMIT (10MB) ---------- */
      if (f.size > 10 * 1024 * 1024) {
        alert('File exceeds 10MB limit. Please choose a smaller image.');
        fileInput.value = '';
        return;
      }

      if (fileName) fileName.textContent = f.name;
      if (uploadPreview) uploadPreview.classList.add('visible');

      if (uploadBtnEl) uploadBtnEl.classList.add('hidden');
      if (sectionHintEl && sectionHintEl.classList.contains('section-hint')) {
        sectionHintEl.classList.add('hidden');
      }
    }
  });
}

/* ---------- CLICK PREVIEW TO VIEW IMAGE FULL-SCREEN ---------- */
if (uploadPreview) {
  uploadPreview.style.cursor = 'zoom-in';
  
  uploadPreview.addEventListener('click', (e) => {
    if (e.target === removeFile || removeFile?.contains(e.target)) return;

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        
        const img = document.createElement('img');
        img.src = event.target.result;
        
        lightbox.appendChild(img);
        document.body.appendChild(lightbox);
        
        requestAnimationFrame(() => {
          lightbox.classList.add('active');
        });
        
        lightbox.addEventListener('click', () => {
          lightbox.classList.remove('active');
          setTimeout(() => lightbox.remove(), 250);
        });

        img.addEventListener('click', (innerEvent) => {
          innerEvent.stopPropagation();
        });
      };
      
      reader.readAsDataURL(fileInput.files[0]);
    }
  });
}

if (removeFile) {
  removeFile.addEventListener('click', (e) => {
    e.stopPropagation();
    if (fileInput) fileInput.value = '';
    if (uploadPreview) uploadPreview.classList.remove('visible');
    if (fileName) fileName.textContent = 'photo.jpg';

    if (uploadBtnEl) uploadBtnEl.classList.remove('hidden');
    if (sectionHintEl && sectionHintEl.classList.contains('section-hint')) {
      sectionHintEl.classList.remove('hidden');
    }
  });
}

/* =============================================
   SHAKE ANIMATION FOR FIELD VALIDATION
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

/* ============================================================
   FORM SUBMISSION (REPLACED PART: DIRECT TO SUPABASE VIA SDK)
   ============================================================ */
/* --- NEW: Trigger Modal instead of immediate upload --- */
if (submitBtn) {
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Keep your exact validation logic
    const selected = document.querySelector('.chip.selected');
    const subject = subjectInput ? subjectInput.value.trim() : '';
    let valid = true;

    const categoryBox = document.getElementById('categoryChips');
    if (!selected && categoryBox) {
      categoryBox.style.outline = '2px solid rgba(220,60,60,.4)';
      categoryBox.style.borderRadius = '14px';
      shake(categoryBox);
      valid = false;
    } else if (categoryBox) {
      categoryBox.style.outline = '';
    }

    if (!subject && subjectInput) {
      subjectInput.style.boxShadow = '0 0 0 3px rgba(220,60,60,.30)';
      shake(subjectInput);
      valid = false;
    } else if (subjectInput) {
      subjectInput.style.boxShadow = '';
    }

    if (!valid) return;

    // 2. Instead of uploading, show the pop-up modal
    const confirmOverlay = document.getElementById('confirmOverlay');
    if (confirmOverlay) {
      confirmOverlay.classList.add('visible');
    }
  });
}

/* --- NEW: Logic to handle user choice --- */
async function performSubmit(isAnonymous) {
  const confirmOverlay = document.getElementById('confirmOverlay');
  confirmOverlay.classList.remove('visible');

  submitBtn.innerText = 'Uploading...';
  submitBtn.disabled = true;

  // Set defaults
  let contact = 'N/A';
  let name = 'Anonymous';

  // If they choose to share info, fetch from 'accounts'
  if (!isAnonymous) {
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (user) {
        const { data: profile } = await window.supabaseClient
          .from('accounts')
          .select('name')
          .eq('email', user.email)
          .single();
        
        contact = user.email; // Map to contact column
        name = profile?.name || 'User';
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
    }
  }

  // --- Proceed with your original Supabase logic ---
  try {
    const supabase = window.supabaseClient;
    const selected = document.querySelector('.chip.selected');
    const categoryValue = selected.getAttribute('data-cat') || selected.dataset.cat || 'Others';
    let publicPhotoUrl = null;

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const filePath = `public/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage.from('report-evidence').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      publicPhotoUrl = supabase.storage.from('report-evidence').getPublicUrl(filePath).data.publicUrl;
    }

    const { error: insertError } = await supabase
      .from('reports')
      .insert([{
        category: categoryValue,
        subject: subjectInput.value.trim(),
        image_url: publicPhotoUrl,
        contact: contact, // Dynamically set
        name: name        // Dynamically set
      }]);

    if (insertError) throw insertError;

    submitBtn.innerText = 'Submitted';
    setTimeout(() => {
      if (successOverlay) {
        successOverlay.classList.add('visible');
        document.body.classList.add('overlay-open');
      }
    }, 1000);

  } catch (err) {
    alert('Could not submit: ' + err.message);
    submitBtn.innerText = 'Submit Report';
    submitBtn.disabled = false;
  }
}

// Hook up the buttons in your modal
document.getElementById('shareBtn').addEventListener('click', () => performSubmit(false));
document.getElementById('anonBtn').addEventListener('click', () => performSubmit(true));

/* =============================================
   CLOSE OVERLAY AND CLEAN RESET CONTEXT
============================================= */
if (successOverlay) {
  successOverlay.addEventListener('click', (e) => {
    if (e.target === successOverlay) {
      if (!canCloseOverlay) {
        console.log('Action blocked: Reading delay rules enforced.');
        return;
      }

      successOverlay.classList.remove('visible');
      document.body.classList.remove('overlay-open');

      const reportForm = document.getElementById('reportForm');
      if (reportForm) reportForm.reset();

      chips.forEach(c => c.classList.remove('selected'));
      if (fileInput) fileInput.value = '';
      if (uploadPreview) uploadPreview.classList.remove('visible');
      if (fileName) fileName.textContent = 'photo.jpg';

      if (uploadBtnEl) uploadBtnEl.classList.remove('hidden');
      if (sectionHintEl && sectionHintEl.classList.contains('section-hint')) {
        sectionHintEl.classList.remove('hidden');
      }

      if (submitBtn) {
        submitBtn.innerText = 'Submit Report';
        submitBtn.disabled = false;
      }
      
      canCloseOverlay = false;
    }
  });
}

if (subjectInput) {
  subjectInput.addEventListener('input', () => {
    subjectInput.style.boxShadow = '';
  });
}