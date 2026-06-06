/* js/home.js */
/* Mobile hamburger toggle */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

/* Close mobile menu on link click */
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});



/* Loop Carousel Gallery */
const track = document.getElementById("carouselTrack");
const slides = track.querySelectorAll("img");
const dots = document.querySelectorAll("#carouselDots span");

let index = 0;
const visible = 3;
const maxIndex = slides.length - visible;

function updateCarousel() {
  track.style.transform = `translateX(-${index * (100 / visible)}%)`;
  updateDots();
}

// update dots UI
function updateDots() {
  dots.forEach(dot => dot.classList.remove("active"));

  // display correct dots
  let dotIndex = index;
  if (dotIndex > dots.length - 1) dotIndex = 0;

  dots[dotIndex].classList.add("active");
}

// next/prev buttons
function moveSlide(direction) {
  index += direction;

  if (index < 0) index = maxIndex;
  if (index > maxIndex) index = 0;

  updateCarousel();
}

// clicking the dots
function goToSlide(i) {
  index = i;
  updateCarousel();
}


updateCarousel();