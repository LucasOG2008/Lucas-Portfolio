window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if (loader) loader.classList.add('hidden');
    }, 1000);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, 60);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .stagger-children, .section-header').forEach(el => {
    observer.observe(el);
});

const progressBar = document.getElementById('progress-bar');
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrolled / total * 100) + '%';
    navbar.classList.toggle('scrolled', scrolled > 40);
    scrollTopBtn.classList.toggle('visible', scrolled > 300);
});

/* ---- Menu mobile ---- */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
    const closeMenu = () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu');
    };
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.classList.toggle('open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

/* ---- Destaque do link ativo conforme a seção visível ---- */
const navAnchors = navLinks ? [...navLinks.querySelectorAll('a')] : [];
const sectionMap = navAnchors
    .map(a => ({ a, sec: document.querySelector(a.getAttribute('href')) }))
    .filter(item => item.sec);

if (sectionMap.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navAnchors.forEach(a => a.classList.remove('active'));
                const match = sectionMap.find(item => item.sec === entry.target);
                if (match) match.a.classList.add('active');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMap.forEach(item => sectionObserver.observe(item.sec));
}

scrollTopBtn.addEventListener('click', e => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = 'Copiado!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = 'Copiar';
                btn.classList.remove('copied');
            }, 2000);
        }).catch(() => alert('Copie manualmente: ' + text));
    });
});

const EMAILJS_PUBLIC_KEY  = '70IaSjvJ23bu5kCo8';
const EMAILJS_SERVICE_ID  = 'service_9j4kmz6';
const EMAILJS_TEMPLATE_ID = 'template_rmpijsu';

const isConfigured = !EMAILJS_PUBLIC_KEY.startsWith('SEU');

if (isConfigured && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    const notice = document.getElementById('configNotice');
    if (notice) notice.classList.remove('show');
}

const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
const feedback    = document.getElementById('formFeedback');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name    = document.getElementById('from_name').value.trim();
    const email   = document.getElementById('from_email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
        showFeedback('error', '✗  Preencha todos os campos antes de enviar.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFeedback('error', '✗  Informe um endereço de e-mail válido.');
        return;
    }

    if (!isConfigured) {
        showFeedback('error', '✗  Configure o EmailJS primeiro.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    feedback.style.display = 'none';

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm)
        .then(() => {
            showFeedback('success', '✓  Mensagem enviada com sucesso! Responderei em breve.');
            contactForm.reset();
        })
        .catch(err => {
            console.error('EmailJS error:', err);
            showFeedback('error', '✗  Falha ao enviar. Tente novamente ou use o e-mail diretamente.');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        });
});

function showFeedback(type, msg) {
    feedback.className = 'form-feedback ' + type;
    feedback.textContent = msg;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* =========================================================
   Motion-Driven enhancements — Lenis (smooth scroll) + GSAP
   + spotlight / magnetic / tilt / parallax (21st.dev inspired)
   Tudo com fallback e respeitando prefers-reduced-motion.
   ========================================================= */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof window.gsap !== 'undefined';
const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
let lenis = null;

/* ---- Smooth scroll (Lenis) ---- */
if (!prefersReducedMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.1 });

    if (hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }
}

/* Helper: rolagem suave para âncoras (usa Lenis quando disponível) */
function smoothScrollTo(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    else el.scrollIntoView({ behavior: 'smooth' });
}

/* Liga todos os links âncora internos à rolagem suave com offset da navbar */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    if (!document.querySelector(href)) return;
    link.addEventListener('click', e => {
        e.preventDefault();
        smoothScrollTo(href);
    });
});

if (!prefersReducedMotion) {
    /* ---- Parallax do kanji de fundo do hero ---- */
    const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
    parallaxEls.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.16;
        if (hasScrollTrigger) {
            gsap.set(el, { xPercent: -50, yPercent: -50 });
            gsap.to(el, {
                y: () => window.innerHeight * speed,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
        } else {
            let ticking = false;
            const run = () => {
                const y = window.scrollY;
                if (y < window.innerHeight) {
                    el.style.transform = `translate(-50%, calc(-50% + ${y * speed}px))`;
                }
                ticking = false;
            };
            window.addEventListener('scroll', () => {
                if (!ticking) { requestAnimationFrame(run); ticking = true; }
            }, { passive: true });
        }
    });

    /* ---- Spotlight cards: glow radial segue o cursor ---- */
    const spotlightTargets = document.querySelectorAll(
        '.sobre-block, .project-single, .contact-form-wrap'
    );
    spotlightTargets.forEach(card => {
        card.classList.add('spotlight');
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    /* ---- Tilt 3D nos cards de projeto ---- */
    document.querySelectorAll('.project-single').forEach(card => {
        const STRENGTH = 4;
        let raf = null;
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                card.style.setProperty('--ry', (px * STRENGTH).toFixed(2) + 'deg');
                card.style.setProperty('--rx', (-py * STRENGTH).toFixed(2) + 'deg');
            });
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--rx', '0deg');
        });
    });

    /* ---- Magnetic buttons (seguem levemente o cursor) ---- */
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
        document.querySelectorAll('.magnetic').forEach(btn => {
            const moveX = hasGSAP ? gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' }) : null;
            const moveY = hasGSAP ? gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' }) : null;
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.35;
                const y = (e.clientY - r.top - r.height / 2) * 0.5;
                if (hasGSAP) { moveX(x); moveY(y); }
                else btn.style.transform = `translate(${x}px, ${y}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                if (hasGSAP) { moveX(0); moveY(0); }
                else btn.style.transform = '';
            });
        });
    }
}