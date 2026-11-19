/* TAXCORE · 세무회계 정우 */
(() => {
  // ▼ 연락처 설정 — 실제 정보로 교체하세요
  const CONFIG = {
    tel: '',          // 예: '02-000-0000'
    email: '',        // 예: 'hello@taxcore.kr'
    kakao: ''         // 예: 'https://pf.kakao.com/_xxxx'
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* contact config */
  const tel = $('.js-tel'), kakao = $('.js-kakao');
  if (CONFIG.tel) { tel.href = 'tel:' + CONFIG.tel.replace(/[^0-9+]/g, ''); $('.js-tel-text').textContent = CONFIG.tel; }
  else { tel.href = '#contact'; $('.js-tel-text').textContent = '준비 중'; }
  if (CONFIG.email) $('.js-mail-text').innerHTML = `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`;
  else $('.js-mail-text').textContent = '준비 중';
  if (CONFIG.kakao) kakao.href = CONFIG.kakao; else { kakao.removeAttribute('target'); kakao.href = '#contact'; }
  $('.js-year').textContent = new Date().getFullYear();

  /* loader */
  const finishLoad = () => {
    $('.loader').classList.add('done');
    document.body.classList.remove('is-loading');
    setTimeout(() => document.body.classList.add('ready'), 250);
    setTimeout(() => $('.loader')?.remove(), 1600);
  };
  window.addEventListener('load', () => setTimeout(finishLoad, reduce ? 0 : 1100));
  setTimeout(() => { if (document.body.classList.contains('is-loading')) finishLoad(); }, 3500);

  /* split headings into lines (by <br>) */
  $$('.split').forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p => `<span class="sl"><span>${p.trim()}</span></span>`).join('');
  });

  /* statement words */
  const st = $('[data-words]');
  if (st) {
    const keys = ['세금과', '4대보험을', '코어를', '트레이너가'];
    st.innerHTML = st.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${keys.some(k => w.startsWith(k)) ? ' key' : ''}">${w}</span>`).join(' ');
  }

  /* reveal on scroll */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.stat')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .split, .pcard, .steps, .sign').forEach(el => io.observe(el));
  // clip-path로 가려진 요소는 IO가 감지 못하므로 부모를 관찰
  const imgIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.querySelector('.reveal-img')?.classList.add('in'); imgIO.unobserve(e.target); } }), { threshold: .15 });
  $$('.reveal-img').forEach(el => imgIO.observe(el.parentElement));
  $$('.stat').forEach(el => io.observe(el));

  function countUp(stat) {
    const el = $('.count', stat); if (!el) return;
    const to = +el.dataset.to, dur = 1400, t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* scroll-driven stuff */
  const nav = $('.nav'), bar = $('.progress span'), fab = $('.fab');
  const words = $$('.statement__text .w');
  const meter = $('.meter__fill'), promise = $('.promise');
  const hero = $('.hero__visual'), copy = $('.hero__copy');
  let lastY = 0, ticking = false;

  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav.classList.toggle('scrolled', y > 40);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('hide', y > lastY && y > 400);
    fab.classList.toggle('show', y > innerHeight * .8);
    lastY = y;

    if (words.length) {
      const r = st.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0), 1);
      const n = Math.floor(p * words.length * 1.05);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (meter && promise) {
      const r = promise.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .5 - r.top) / r.height, 0), 1);
      meter.style.transform = `scaleX(${p})`;
    }
    if (!reduce && y < innerHeight * 1.2) {
      hero.style.transform = `translateY(${y * .12}px)`;
      copy.style.transform = `translateY(${y * .06}px)`;
      copy.style.opacity = Math.max(1 - y / (innerHeight * .9), 0);
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* active nav link */
  const links = $$('.nav__links a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'services', 'promise', 'profile', 'process'].forEach(id => { const s = document.getElementById(id); s && secIO.observe(s); });

  /* mobile menu */
  const burger = $('.burger');
  const toggleMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    $('.mobile-menu').setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* service cards → contact */
  $$('.svc').forEach(s => s.addEventListener('click', () => $('#contact').scrollIntoView({ behavior: 'smooth' })));

  if (!fine || reduce) return;

  /* custom cursor */
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  $$('a, button, .hero__chips li').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
  });
  $$('[data-cursor="view"]').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('view'));
    el.addEventListener('mouseleave', () => cur.classList.remove('view'));
  });

  /* magnetic buttons */
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * .25}px,${y * .35}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* 3D tilt portrait */
  const tilt = $('[data-tilt]');
  if (tilt) {
    const area = $('.hero__visual');
    area.addEventListener('mousemove', e => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transition = 'transform .25s ease-out'; tilt.style.transform = `perspective(1100px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    area.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  /* spotlight on promise cards */
  $$('.pcard').forEach(c => c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
})();
