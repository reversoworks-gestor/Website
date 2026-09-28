const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const setMenu = (open) => {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
  mobileMenu.classList.toggle('is-open', open);
  header?.classList.toggle('menu-active', open);
  document.body.classList.toggle('menu-open', open);
  menuToggle.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
  if (open) mobileMenu.querySelector('a')?.focus();
};

menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760 && menuToggle?.getAttribute('aria-expanded') === 'true') setMenu(false);
}, { passive: true });

document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const mainImage = gallery.querySelector('[data-gallery-main]');
  const count = gallery.querySelector('[data-gallery-count]');
  const caption = gallery.querySelector('[data-gallery-caption]');
  const buttons = [...gallery.querySelectorAll('.gallery-thumb')];

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (!mainImage) return;
      mainImage.classList.add('is-changing');
      window.setTimeout(() => {
        mainImage.src = button.dataset.src;
        mainImage.alt = button.dataset.alt;
        if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(buttons.length).padStart(2, '0')}`;
        if (caption) caption.textContent = button.dataset.caption;
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        mainImage.classList.remove('is-changing');
      }, prefersReducedMotion ? 0 : 140);
    });
  });
});

const revealItems = document.querySelectorAll('[data-reveal]');
if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll('[data-year]').forEach((item) => { item.textContent = new Date().getFullYear(); });
