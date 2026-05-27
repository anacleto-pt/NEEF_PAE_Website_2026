/* ============================================================
   NEEF-UA — main.js
   Particles · Scroll animations · Counters · Nav
   ============================================================ */

/* ── PARTICLES ─────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const IS_PAE = document.body.classList.contains('pae-body');
  const COLORS = IS_PAE
    ? ['rgba(74,124,89,',  'rgba(157,184,138,', 'rgba(92,144,96,']
    : ['rgba(255,215,0,',  'rgba(255,165,0,',   'rgba(255,236,61,'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    spawnParticles();
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - .5) * .38;
      this.vy = (Math.random() - .5) * .38;
      this.r  = Math.random() * 1.4 + .5;
      this.a  = Math.random() * .45 + .15;
      this.col = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.col + this.a + ')';
      ctx.fill();
    }
  }

  function spawnParticles() {
    const n = Math.min(Math.floor((W * H) / 14000), 90);
    particles = Array.from({ length: n }, () => new Particle());
  }

  function drawLinks() {
    const MAX = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < MAX) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = (IS_PAE ? 'rgba(74,124,89,' : 'rgba(255,215,0,') + ((1 - d / MAX) * .1) + ')';
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLinks();
    particles.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  })();

  window.addEventListener('resize', resize);
  resize();
})();


/* ── NAVBAR ─────────────────────────────────────────────── */
(function initNav() {
  const nav  = document.getElementById('navbar');
  const ham  = document.getElementById('hamburger');
  const menu = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  ham.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    ham.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      ham.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


/* ── SCROLL FADE-IN ─────────────────────────────────────── */
(function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => io.observe(el));
})();


/* ── COUNTERS ───────────────────────────────────────────── */
(function initCounters() {
  const stats = document.querySelector('.about-stats');
  if (!stats) return;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function runCounter(el) {
    const target = +el.dataset.target;
    const dur    = 1800;
    const start  = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(easeOut(p) * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    })(start);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-number').forEach(runCounter);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  io.observe(stats);
})();


/* ── CARD TILT ──────────────────────────────────────────── */
(function initTilt() {
  document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `translateY(-5px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


/* ── BACK TO TOP ─────────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ── CONTACT FORM ───────────────────────────────────────── */
(function initForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome    = (document.getElementById('nome')?.value    || '').trim();
    const email   = (document.getElementById('email')?.value   || '').trim();
    const assunto = (document.getElementById('assunto')?.value || '').trim() || 'Contacto via site NEEF-UA';
    const msg     = (document.getElementById('mensagem')?.value || '').trim();

    const body = `Nome: ${nome}\nEmail: ${email}\n\n${msg}`;
    window.location.href =
      `mailto:neef@ua.pt?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(body)}`;
  });
})();
