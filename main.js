/* TAXCORE · 세무회계 정우 */
(() => {
  // ▼ 연락처 설정 — 실제 정보로 교체하세요
  const CONFIG = {
    tel: '',          // 예: '02-000-0000'
    email: '',        // 예: 'hello@taxcore.kr'
    kakao: '',        // 예: 'https://pf.kakao.com/_xxxx'
    address: '',      // 예: '서울시 OO구 OO로 00'
    bizNo: ''         // 예: '000-00-00000'
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* contact config */
  const telHref = CONFIG.tel ? 'tel:' + CONFIG.tel.replace(/[^0-9+]/g, '') : '';
  $$('.js-tel-link').forEach(a => { if (telHref) a.href = telHref; });
  $$('.js-tel-label').forEach(s => { if (CONFIG.tel) s.textContent = '☎ ' + CONFIG.tel; });
  $$('.js-mail-link').forEach(a => { if (CONFIG.email) a.href = 'mailto:' + CONFIG.email; });
  $$('.js-mail-label').forEach(s => { if (CONFIG.email) s.textContent = '✉ ' + CONFIG.email; });
  $$('.js-kakao-link').forEach(a => { if (CONFIG.kakao) { a.href = CONFIG.kakao; a.target = '_blank'; a.rel = 'noopener'; } });
  $$('.js-tel-text').forEach(e => e.textContent = CONFIG.tel || '등록 예정');
  $$('.js-mail-text').forEach(e => e.textContent = CONFIG.email || '등록 예정');
  $$('.js-addr-text').forEach(e => e.textContent = CONFIG.address || '등록 예정');
  if (CONFIG.address) $('.js-addr-foot').textContent = CONFIG.address;
  if (CONFIG.bizNo) $('.js-biz').textContent = '사업자등록번호 ' + CONFIG.bizNo;
  $('.js-year').textContent = new Date().getFullYear();

  /* service card → preselect inquiry type */
  $$('.scard__btn[data-type]').forEach(b => b.addEventListener('click', () => {
    const sel = $('#cform select[name="type"]');
    const opt = [...sel.options].find(o => o.text === b.dataset.type);
    if (opt) sel.value = opt.value || opt.text;
  }));

  /* inquiry form (정적 사이트: 메일 앱 / 문자 앱으로 전달) */
  const form = $('#cform');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('.cform__msg', form);
    let ok = true;
    $$('[required]', form).forEach(el => {
      const bad = el.type === 'checkbox' ? !el.checked : !el.value.trim();
      (el.closest('.field') || el.closest('.agree')).classList.toggle('err', bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.className = 'cform__msg bad'; msg.textContent = '필수 항목(*)을 확인해 주세요.'; return; }
    const f = Object.fromEntries(new FormData(form));
    const body = `[세무회계 정우 상담 문의]\n이름: ${f.name}\n연락처: ${f.phone}\n문의 유형: ${f.type}\n연락 방법: ${f.via}\n\n${f.msg || ''}`;
    if (CONFIG.email) {
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('[상담 문의] ' + f.type + ' - ' + f.name)}&body=${encodeURIComponent(body)}`;
      msg.className = 'cform__msg ok'; msg.textContent = '메일 앱이 열리면 전송 버튼을 눌러주세요.';
    } else if (CONFIG.tel) {
      location.href = `sms:${CONFIG.tel.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(body)}`;
      msg.className = 'cform__msg ok'; msg.textContent = '문자 앱이 열리면 전송 버튼을 눌러주세요.';
    } else {
      msg.className = 'cform__msg bad'; msg.textContent = '온라인 접수 채널을 준비 중입니다. 잠시 후 다시 시도해 주세요.';
    }
  });
  $$('input, select', form).forEach(el => el.addEventListener('change', () => (el.closest('.field') || el.closest('.agree'))?.classList.remove('err')));

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
  ['about', 'services', 'promise', 'profile', 'process', 'contact'].forEach(id => { const s = document.getElementById(id); s && secIO.observe(s); });

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
  $$('.pcard, .scard').forEach(c => c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
})();
