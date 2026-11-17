const root = document.documentElement;
root.classList.add('js');

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
  root.classList.toggle('menu-locked', open);
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
window.matchMedia('(min-width: 1121px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

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

// Header shadow once the page scrolls
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fade content in as it scrolls into view; items in the same group appear one after another
const revealSelector = [
  'main .section-head', 'main .head-row', '.intro-grid > *', '.work-lead', '.work-list li', '.work-also',
  '.serve-col', '.mission-text', '.donate-priority', '.cause-list li', '.plain-list li', '.cta-copy',
  '.cta-band .hero-actions', '.about-split > *', '.ed-row', '.icon-cell', '.sub-card', '.zz-row > *',
  '.prog-cell', '.focus-tile', '.panel-body', '.value-tile', '.split-sticky .sticky', '.guide-list li',
  '.step', '.principle-quote', '.ct-quick-card', '.ct-panel', '.ct-involve-card', '.ct-offices > *',
  '.sch-intro > *', '.sch-flagship-inner > *', '.sch-support > *', '.sch-route', '.sch-concern',
  '.cause-feature', '.cause', '.donate-note', '.partner', '.founder-inner', '.founder-plate', '.pc'
].join(',');
const revealTargets = [...document.querySelectorAll(revealSelector)].filter(el => !el.closest('.hero'));
if ('IntersectionObserver' in window) {
  revealTargets.forEach(el => {
    el.classList.add('reveal');
    const group = [...el.parentElement.children].filter(c => c.matches(revealSelector));
    const i = group.indexOf(el);
    if (i > 0) el.style.setProperty('--delay', `${Math.min(i, 6) * 0.08}s`);
  });
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    io.unobserve(entry.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(el => io.observe(el));
}

// Home hero: cross-fade the background photos
const heroPhotos = [...document.querySelectorAll('.hero-bg img')];
if (heroPhotos.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let current = 0;
  setInterval(() => {
    heroPhotos[current].classList.remove('active');
    current = (current + 1) % heroPhotos.length;
    heroPhotos[current].classList.add('active');
  }, 6500);
}

// Home: learner slideshow in the ongoing project section
const show = document.querySelector('.learner-show');
if (show) {
  const pics = [...show.querySelectorAll('.show-slides img')];
  const thumbs = [...show.querySelectorAll('.show-thumb')];
  const counter = show.querySelector('.show-count strong');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = 5000;
  show.style.setProperty('--show-time', `${delay}ms`);
  let at = 0, timer = null;

  const go = i => {
    pics[at].classList.remove('active');
    thumbs[at].classList.remove('active');
    thumbs[at].removeAttribute('aria-current');
    at = (i + pics.length) % pics.length;
    pics[at].classList.add('active');
    void thumbs[at].offsetWidth; // restart the progress bar
    thumbs[at].classList.add('active');
    thumbs[at].setAttribute('aria-current', 'true');
    counter.textContent = at + 1;
  };
  const play = () => { if (reduce) return; clearInterval(timer); timer = setInterval(() => go(at + 1), delay); };
  const stop = () => clearInterval(timer);

  show.querySelectorAll('.show-arrow').forEach(b => b.addEventListener('click', () => { go(at + Number(b.dataset.dir)); play(); }));
  thumbs.forEach((t, i) => t.addEventListener('click', () => { go(i); play(); }));
  show.addEventListener('mouseenter', () => { stop(); show.classList.add('paused'); });
  show.addEventListener('mouseleave', () => { show.classList.remove('paused'); play(); });
  let sx = null;
  show.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { go(at + (dx < 0 ? 1 : -1)); play(); }
  });
  // Only run while the section is on screen
  new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.3 }).observe(show);
}

// Home: count the metrics up once the page loads (the year stays fixed)
const counters = [...document.querySelectorAll('.count:not([data-plain])')];
if (counters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const run = el => {
    const to = Number(el.dataset.to);
    const start = performance.now(), dur = 1800;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick); else el.textContent = to;
    };
    el.textContent = 0;
    requestAnimationFrame(tick);
  };
  // Start a little after the card has risen into place
  setTimeout(() => counters.forEach(run), 600);
}

// Work page: highlight the program in view in the sticky program menu
const progLinks = [...document.querySelectorAll('.prog-nav a')];
if (progLinks.length) {
  const targets = progLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const progList = document.querySelector('.prog-nav ul');
  let activeLink = null;
  const progObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const link = progLinks.find(a => a.getAttribute('href') === '#' + entry.target.id);
      if (!link || link === activeLink) return;
      activeLink = link;
      progLinks.forEach(a => a.classList.toggle('active', a === link));
      // Centre the link by scrolling only the menu sideways. scrollIntoView would also
      // smooth-scroll the page, which cancels the visitor's own scrolling and feels stuck.
      const linkBox = link.getBoundingClientRect();
      const listBox = progList.getBoundingClientRect();
      const left = progList.scrollLeft + linkBox.left - listBox.left - (listBox.width - linkBox.width) / 2;
      progList.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
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

// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();
