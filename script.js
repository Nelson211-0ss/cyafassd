// Preloader: fade out once the page has loaded (shown on the first page of a visit only)
const root = document.documentElement;
const finishPreload = () => {
  if (!root.classList.contains('preloading') || root.classList.contains('loaded')) return;
  root.classList.add('loaded');
  try { sessionStorage.setItem('cyafa-loaded', '1'); } catch (e) {}
  setTimeout(() => root.classList.remove('preloading', 'loaded'), 650);
};
window.addEventListener('load', () => setTimeout(finishPreload, 350));
setTimeout(finishPreload, 4000); // never keep visitors waiting on a slow image

// Render Lucide icons
if (window.lucide) lucide.createIcons();

const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

// Mobile menu
function setMenu(open) {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

// About dropdown: opens on hover (desktop) or with the arrow button (touch, keyboard, mobile menu)
const subItems = [...document.querySelectorAll('.nav-item.has-sub')];
const closeSubs = except => subItems.forEach(item => {
  if (item === except) return;
  item.classList.remove('open');
  item.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
});
subItems.forEach(item => {
  const btn = item.querySelector('.sub-toggle');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !item.classList.contains('open');
    closeSubs(item);
    item.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });
});
document.addEventListener('click', e => { if (!e.target.closest('.nav-item.has-sub')) closeSubs(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeSubs();
  if (nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
});

// Solid header once the page scrolls past the top
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Stagger sibling reveals (cards in a grid fade in one after another)
document.querySelectorAll('.reveal').forEach(el => {
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  const i = siblings.indexOf(el);
  if (i > 0) el.style.setProperty('--delay', `${Math.min(i, 6) * 0.08}s`);
});

// Fade elements in as they scroll into view
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .cta-band').forEach(el => revealObserver.observe(el));

// Home hero: background photo slideshow
const slides = [...document.querySelectorAll('.hero-slides img')];
if (slides.length) {
  const dots = [...document.querySelectorAll('.slide-dot')];
  const caption = document.querySelector('.slide-caption-text');
  let current = 0;
  let timer;

  const show = i => {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].removeAttribute('aria-current');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    // Restart the dot's fill animation
    void dots[current].offsetWidth;
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-current', 'true');
    if (caption) {
      caption.style.opacity = 0;
      setTimeout(() => {
        caption.textContent = slides[current].dataset.caption || '';
        caption.style.opacity = 1;
      }, 300);
    }
  };

  const start = () => {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 6000);
  };

  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
}

// Home: "who we serve" tabs
const tabs = [...document.querySelectorAll('.tab-btn')];
if (tabs.length) {
  const images = [...document.querySelectorAll('.serve-visual img')];
  const select = tab => {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      images[i].classList.toggle('active', on);
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
}

// Work page: highlight the program in view in the sticky program menu
const progLinks = [...document.querySelectorAll('.prog-nav a')];
if (progLinks.length) {
  const targets = progLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const progObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      progLinks.forEach(a => {
        const on = a.getAttribute('href') === '#' + entry.target.id;
        a.classList.toggle('active', on);
        if (on) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  targets.forEach(t => progObserver.observe(t));
}

// Contact form: open the visitor's email app with the message filled in
const form = document.getElementById('contact-form');
if (form) {
  // form.elements avoids clashing with built-in form properties such as form.name
  const f = form.elements;
  const params = new URLSearchParams(location.search);
  if (params.get('topic')) f.topic.value = params.get('topic');
  if (params.get('cause')) f.message.value = `I would like to support: ${params.get('cause')}.

`;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const subject = `${f.topic.value}: message from ${f.name.value}`;
    const body = `${f.message.value}\n\nName: ${f.name.value}\nEmail: ${f.email.value}` +
      (f.phone.value ? `\nPhone: ${f.phone.value}` : '');
    location.href = `mailto:info@cyafassd.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// Smooth page-to-page fade for browsers without cross-document view transitions
if (!('onpagereveal' in window)) {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname) || samePage) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = link.href; }, 250);
  });
  // Restore the page if the visitor comes back with the browser's back button
  window.addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('is-leaving'); });
}

// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();
