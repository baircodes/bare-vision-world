// =========================
// BARE VISION — Unified Navigation
// =========================

document.addEventListener('DOMContentLoaded', () => {

  // Mobile hamburger
  const burger = document.getElementById('bv-hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';

      burger.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('open', !open);
      mobileMenu.setAttribute('aria-hidden', String(open));
    });
  }

  // Close mobile menu on link click
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger?.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  // Nav background on scroll (hero-aware)
  const headerBar = document.querySelector('.bv-header-bar');
  const hero = document.getElementById('hero');

  function updateNav() {
    if (!headerBar || !hero) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    headerBar.classList.toggle('bv-nav-solid', heroBottom < 90);
  }

  window.addEventListener('scroll', updateNav);
  window.addEventListener('resize', updateNav);
  updateNav();

});