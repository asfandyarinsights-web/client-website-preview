(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navbar state + scroll progress ---------- */
  const nav = $('#mainNav'), bar = $('#progress');
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', scrollY > 24);
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Close mobile menu after choosing a link ---------- */
  const menu = $('#navMenu');
  $$('#navMenu .nav-link, #navMenu .btn').forEach(a => a.addEventListener('click', () => {
    if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }));

  /* ---------- Counters ---------- */
  const countUp = el => {
    const to = +el.dataset.to, suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = to + suffix; return; }
    const t0 = performance.now(), dur = 1200;
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduce) $$('.count').forEach(el => { el.textContent = '0'; });

  /* ---------- Reveal on scroll ---------- */
  const targets = $$('.section-title, .section .label-sm.text-accent, .body-text, .stat, aside.card-ui, .skill, .timeline li, #projectGrid > .col, .filters, #contact .card-ui');
  const groups = new Map();
  targets.forEach(el => {
    const g = el.closest('.row') || el.parentElement;
    const i = groups.get(g) || 0;
    groups.set(g, i + 1);
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
  });

  const show = el => {
    el.classList.add('in');
    $$('.count', el).forEach(countUp);
    setTimeout(() => { el.style.transitionDelay = ''; }, 1000); // keep hover transitions instant
  };
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(show);
  } else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  }

  /* ---------- Project filter ---------- */
  const pills = $$('.pill-btn'), cols = $$('#projectGrid > .col'), empty = $('#noProjects');
  pills.forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active')));
  pills.forEach(btn => btn.addEventListener('click', () => {
    pills.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); });
    const f = btn.dataset.filter;
    let shown = 0;
    cols.forEach(c => {
      const match = f === 'all' || c.dataset.category === f;
      clearTimeout(c._t);
      if (match) {
        shown++;
        c.classList.remove('d-none');
        requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('is-out')));
      } else {
        c.classList.add('is-out');
        c._t = setTimeout(() => c.classList.add('d-none'), 280);
      }
    });
    empty.classList.toggle('d-none', shown > 0);
  }));

  /* ---------- Contact form ---------- */
  const form = $('#contactForm'), fields = $('#formFields'), ok = $('#formSuccess'), err = $('#formError');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.classList.add('d-none');
    form.classList.add('was-validated');
    if (!form.checkValidity() || form.elements._gotcha.value) return;

    const btn = $('button[type="submit"]', form), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    const url = form.dataset.endpoint;
    try {
      if (url && !url.includes('YOUR_')) {
        const r = await fetch(url, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('Request failed');
      } else { // no form service connected yet: open the visitor's email app instead
        const d = new FormData(form);
        location.href = `mailto:muzalamuzala84@gmail.com?subject=${encodeURIComponent('Portfolio message from ' + d.get('name'))}&body=${encodeURIComponent(d.get('message') + '\n\n' + d.get('name') + ' (' + d.get('email') + ')')}`;
      }
      fields.classList.add('d-none');
      ok.classList.remove('d-none');
      form.reset();
      form.classList.remove('was-validated');
    } catch (_) {
      err.classList.remove('d-none');
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
  $('#sendAnother').addEventListener('click', () => {
    ok.classList.add('d-none');
    fields.classList.remove('d-none');
  });
})();
