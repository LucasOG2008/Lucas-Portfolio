window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('page-loader').classList.add('hidden');
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
    const indicator = document.querySelector('.scroll-indicator');
    if (indicator) indicator.style.opacity = scrolled > 80 ? '0' : '1';
});

scrollTopBtn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

if (isConfigured) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    document.getElementById('configNotice').classList.remove('show');
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
