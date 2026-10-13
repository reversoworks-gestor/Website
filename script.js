const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setMenu = (open) => {
  if (!menuToggle || !mobileNavigation) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileNavigation.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  header?.classList.toggle('menu-active', open);
  if (open) mobileNavigation.querySelector('a')?.focus();
};

menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileNavigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach((item) => observer.observe(item));
} else {
  document.querySelectorAll('[data-reveal]').forEach((item) => item.classList.add('is-visible'));
}

const parallax = document.querySelector('[data-parallax]');
if (parallax && !reducedMotion) {
  window.addEventListener('scroll', () => {
    const shift = Math.min(window.scrollY * 0.055, 54);
    parallax.style.transform = `translateY(${shift}px)`;
  }, { passive: true });
}

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-work-grid] [data-service]').forEach((tile) => {
      tile.classList.toggle('is-filtered', filter !== 'all' && tile.dataset.service !== filter);
    });
  });
});

document.querySelectorAll('[data-comparison]').forEach((comparison) => {
  const slider = comparison.querySelector('input[type="range"]');
  const update = () => comparison.style.setProperty('--position', `${slider.value}%`);
  slider?.addEventListener('input', update);
  update();
});

document.querySelectorAll('[data-quote-form]').forEach((form) => {
  const status = form.querySelector('[data-form-status]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const photoInput = form.querySelector('input[type="file"]');
    const photoNames = photoInput?.files?.length ? [...photoInput.files].map((file) => file.name).join(', ') : 'No photos selected';
    const name = String(data.get('name') || '').trim();
    const details = [
      'Reverso Works quote request',
      '',
      `Name: ${name}`,
      `Phone: ${String(data.get('phone') || '').trim()}`,
      `Email: ${String(data.get('email') || '').trim()}`,
      `Service: ${String(data.get('service') || '').trim()}`,
      `Selected photo files: ${photoNames}`,
      '',
      'Project details:',
      String(data.get('message') || '').trim(),
      '',
      'Please attach the selected photos to this email before sending.'
    ].join('\n');
    if (status) status.textContent = 'Your email draft is opening. Attach the selected photos, then send it to Reverso Works.';
    window.location.href = `mailto:contact@reversoworks.com?subject=${encodeURIComponent(`Quote request — ${name}`)}&body=${encodeURIComponent(details)}`;
  });
});

document.querySelectorAll('[data-year]').forEach((item) => { item.textContent = new Date().getFullYear(); });
