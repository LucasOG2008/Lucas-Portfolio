/* =========================================================
   Lucas Oliveira Gomes · portfólio
   Sem dependências além do EmailJS. Todo o conteúdo aparece
   sem JavaScript; o script só acrescenta movimento e interação.
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- avisos (toasts) ---------- */
  const toaster = $('#toaster');
  function toast(message, { error = false, duration = 3200 } = {}) {
    if (!toaster) return;
    const el = document.createElement('div');
    el.className = 'toast' + (error ? ' is-error' : '');
    el.dataset.state = 'enter';
    el.textContent = message;
    toaster.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.dataset.state = 'idle'; }));

    let remaining = duration;
    let started = Date.now();
    let timer = setTimeout(leave, remaining);
    // pausa enquanto a aba está oculta ou o cursor está sobre o aviso
    const pause = () => { clearTimeout(timer); remaining -= Date.now() - started; };
    const resume = () => { started = Date.now(); timer = setTimeout(leave, Math.max(remaining, 800)); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', onVis);

    function leave() {
      document.removeEventListener('visibilitychange', onVis);
      el.dataset.state = 'leave';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 400);
    }
  }

  /* ---------- entradas escalonadas por seção ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    // atraso por posição dentro do mesmo bloco pai
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.closest('section, article, .split, .asgard-top') || document.body;
      const i = groups.get(parent) || 0;
      el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
      groups.set(parent, i + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- menu do celular ---------- */
  const nav = $('#nav');
  const toggle = $('#menuToggle');
  if (nav && toggle) {
    const label = $('.menu-toggle-label', toggle);
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Fechar' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- link ativo na navegação ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === id)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- palco: vídeo e troca de camadas ---------- */
  const layers = $$('.stage .layer');
  const video = $('.stage-video');
  const setLayer = (name) => {
    layers.forEach((l) => l.classList.toggle('is-on', l.dataset.layer === name));
  };

  if (video) {
    const tryPlay = () => {
      if (reduceMotion.matches || document.hidden) return;
      if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    video.addEventListener('playing', () => video.classList.add('is-playing'));
    // só toca quando o palco está visível e a aba ativa
    let visible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? tryPlay() : video.pause();
      }, { threshold: 0.2 }).observe(video.closest('.stage'));
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause(); else if (visible) tryPlay();
    });
    reduceMotion.addEventListener?.('change', () => {
      if (reduceMotion.matches) { video.pause(); video.classList.remove('is-playing'); } else if (visible) tryPlay();
    });
  }

  const rows = $$('.row[data-stage]');
  const ledgerList = $('.ledger-list');
  const activate = (row) => {
    rows.forEach((r) => r.classList.toggle('is-active', r === row));
    setLayer(row ? row.dataset.stage : 'home');
  };
  rows.forEach((row) => {
    row.addEventListener('focus', () => activate(row));
    row.addEventListener('blur', () => activate(null));
    if (finePointer.matches) row.addEventListener('mouseenter', () => activate(row));
  });
  if (ledgerList && finePointer.matches) {
    ledgerList.addEventListener('mouseleave', () => activate(null));
  }

  /* ---------- monitor ao vivo (a regra do ASGARD: dado real ou "indisponível") ---------- */
  const ui = $('.ui[data-ui]');
  if (ui) {
    const put = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      const na = value == null || value === '';
      el.textContent = na ? 'indisponível' : value;
      el.classList.toggle('is-na', na);
    };
    const nf = new Intl.NumberFormat('pt-BR');

    put('m-cores', navigator.hardwareConcurrency ? nf.format(navigator.hardwareConcurrency) : null);
    put('m-mem', navigator.deviceMemory ? `${nf.format(navigator.deviceMemory)} GB ou mais` : null);
    const paintScreen = () => {
      const dpr = window.devicePixelRatio || 1;
      put('m-screen', `${screen.width} × ${screen.height}${dpr !== 1 ? ` · ${nf.format(Math.round(dpr * 100) / 100)}x` : ''}`);
    };
    paintScreen();
    window.addEventListener('resize', paintScreen, { passive: true });
    const conn = navigator.connection;
    const paintNet = () => put('m-net', conn && conn.effectiveType ? conn.effectiveType.toUpperCase() : (navigator.onLine ? null : 'offline'));
    paintNet();
    conn?.addEventListener?.('change', paintNet);

    const started = performance.now();
    const fpsEl = document.getElementById('m-fps');
    const timeEl = document.getElementById('m-time');
    const line = document.getElementById('m-line');
    const samples = [];
    const MAX = 48;
    let frames = 0, last = performance.now(), raf = 0, running = false;

    // taste-skill-ignore: zero à esquerda só no relógio de tempo na página
    const fmtTime = (s) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`);
    const drawLine = () => {
      const top = 70;
      const pts = samples.map((v, i) => {
        const x = (i / (MAX - 1)) * 240;
        const y = 58 - (Math.min(v, top) / top) * 54;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      line.setAttribute('points', pts.join(' '));
    };
    const tick = (now) => {
      frames++;
      if (now - last >= 500) {
        const fps = Math.round((frames * 1000) / (now - last));
        frames = 0; last = now;
        samples.push(fps); if (samples.length > MAX) samples.shift();
        fpsEl.textContent = nf.format(fps);
        drawLine();
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (running || document.hidden) return; running = true; frames = 0; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    setInterval(() => { timeEl.textContent = fmtTime(Math.floor((performance.now() - started) / 1000)); }, 1000);

    let uiVisible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { uiVisible = e.isIntersecting; uiVisible ? start() : stop(); }).observe(ui);
    } else { uiVisible = true; start(); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (uiVisible) start(); });
  }

  /* ---------- copiar contato ---------- */
  $$('.copy[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        toast(`${text} copiado.`);
      } catch {
        toast(`Não consegui copiar. Selecione: ${text}`, { error: true, duration: 6000 });
      }
    });
  });

  /* ---------- formulário (EmailJS) ---------- */
  const EMAILJS_PUBLIC_KEY = '70IaSjvJ23bu5kCo8';
  const EMAILJS_SERVICE_ID = 'service_9j4kmz6';
  const EMAILJS_TEMPLATE_ID = 'template_rmpijsu';

  const form = $('#contactForm');
  const submitBtn = $('#submitBtn');
  const errorEl = $('#formError');
  if (form && submitBtn) {
    const btnLabel = $('.btn-label', submitBtn);
    const fields = ['from_name', 'from_email', 'subject', 'message'].map((id) => document.getElementById(id));
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    let emailjsReady = false;
    const ensureEmailJS = () => {
      if (!emailjsReady && window.emailjs) { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); emailjsReady = true; }
      return emailjsReady;
    };

    fields.forEach((f) => f.addEventListener('input', () => {
      if (f.getAttribute('aria-invalid') === 'true' && f.value.trim()) f.removeAttribute('aria-invalid');
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const empty = fields.filter((f) => !f.value.trim());
      fields.forEach((f) => (empty.includes(f) ? f.setAttribute('aria-invalid', 'true') : f.removeAttribute('aria-invalid')));
      if (empty.length) {
        errorEl.textContent = 'Preencha todos os campos.';
        empty[0].focus();
        return;
      }
      const email = document.getElementById('from_email');
      if (!emailOk(email.value.trim())) {
        email.setAttribute('aria-invalid', 'true');
        errorEl.textContent = 'Esse e-mail parece incompleto.';
        email.focus();
        return;
      }
      if (!ensureEmailJS()) {
        errorEl.textContent = 'O envio não carregou. Escreva para lucasogomes2020@gmail.com.';
        return;
      }

      submitBtn.classList.add('is-loading');
      submitBtn.setAttribute('aria-busy', 'true');
      btnLabel.textContent = 'Enviando…';
      try {
        await window.emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
        form.reset();
        toast('Mensagem enviada. Respondo em até 24 horas.', { duration: 5000 });
      } catch (err) {
        console.error('EmailJS:', err);
        errorEl.textContent = 'Não foi possível enviar agora. Tente de novo ou use o e-mail acima.';
      } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.removeAttribute('aria-busy');
        btnLabel.textContent = 'Enviar mensagem';
      }
    });
  }

  /* ---------- ano ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
