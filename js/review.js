// Review System JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('selected-rating');
  const textarea = document.getElementById('review-text');
  const charUsed = document.getElementById('char-used');
  const submitBtn = document.getElementById('submit-review-btn');
  const reviewMessage = document.getElementById('review-message');

  // Star rating functionality
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = this.getAttribute('data-value');
      ratingInput.value = rating;
      updateStars(rating);
    });

    // Keyboard support (Enter or Space to activate)
    star.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const rating = this.getAttribute('data-value');
        ratingInput.value = rating;
        updateStars(rating);
      }
    });

    // Hover effect
    star.addEventListener('mouseover', function() {
      const hoverRating = this.getAttribute('data-value');
      highlightStars(hoverRating);
    });
  });

  // Reset star highlight on mouse leave
  document.querySelector('.star-rating').addEventListener('mouseleave', function() {
    const currentRating = ratingInput.value;
    updateStars(currentRating);
  });

  function updateStars(rating) {
    stars.forEach(star => {
      const value = star.getAttribute('data-value');
      if (value <= rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  function highlightStars(rating) {
    stars.forEach(star => {
      const value = star.getAttribute('data-value');
      if (value <= rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  // Character counter
  textarea.addEventListener('input', function() {
    charUsed.textContent = this.value.length;
  });

  // Submit button functionality
  submitBtn.addEventListener('click', submitReview);

  function submitReview() {
    const rating = ratingInput.value;
    const description = textarea.value.trim();

    // Validation
    if (!rating || rating === '0') {
      showMessage('Please select a star rating.', 'error');
      return;
    }

    if (!description) {
      showMessage('Please write a review description.', 'error');
      return;
    }

    if (description.length < 10) {
      showMessage('Please write at least 10 characters.', 'error');
      return;
    }

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Send review to backend
    const reviewData = {
      rating: parseInt(rating),
      description: description,
      timestamp: new Date().toISOString()
    };

    // Option 1: Send to a backend API (uncomment and adjust endpoint)
    fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    })
    .then(response => response.json())
    .then(data => {
      showMessage('Thank you! Your feedback has been submitted successfully.', 'success');
      resetForm();
    })
    .catch(error => {
      // If API fails, store locally
      console.warn('API error, storing locally:', error);
      storeReviewLocally(reviewData);
      showMessage('Thank you! Your feedback has been submitted.', 'success');
      resetForm();
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    });
  }

  function storeReviewLocally(data) {
    // Store reviews in localStorage as backup
    const reviews = JSON.parse(localStorage.getItem('e-haw-reviews') || '[]');
    reviews.push(data);
    localStorage.setItem('e-haw-reviews', JSON.stringify(reviews));
  }

  function showMessage(message, type) {
    reviewMessage.textContent = message;
    reviewMessage.classList.remove('review-msg-hidden', 'review-msg-success', 'review-msg-error');
    reviewMessage.classList.add(type === 'success' ? 'review-msg-success' : 'review-msg-error');

    // Auto-hide success message after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        reviewMessage.classList.add('review-msg-hidden');
      }, 5000);
    }
  }

  function resetForm() {
    ratingInput.value = '0';
    textarea.value = '';
    charUsed.textContent = '0';
    stars.forEach(star => star.classList.remove('active'));
  }

  // Allow Enter key for submission (Ctrl+Enter)
  textarea.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      submitReview();
    }
  });
});
