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



/* CAROUSEL CODE */
const track = document.getElementById("carouselTrack");
const slides = track.querySelectorAll("img");

let index = 0;

function getVisible() {
  return window.innerWidth <= 600 ? 1 : 3;
}

function updateCarousel() {
  const visible = getVisible();
  const maxIndex = slides.length - visible;

  if (index > maxIndex) index = maxIndex;
  if (index < 0) index = 0;

  const movePercent = index * (100 / visible);
  track.style.transform = `translateX(-${movePercent}%)`;
}

function moveSlide(direction) {
  const visible = getVisible();
  const maxIndex = slides.length - visible;

  index += direction;

  if (index < 0) index = maxIndex;
  if (index > maxIndex) index = 0;

  updateCarousel();
}

window.addEventListener("resize", updateCarousel);

updateCarousel(); 
