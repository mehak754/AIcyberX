/* ============================================================
   AIcyberX — Main JavaScript
   Particles, scroll reveal, navbar, toast, modals, forms
   ============================================================ */

// ─── Toast System ──────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:16px;flex-shrink:0">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  };

  toast.addEventListener('click', remove);
  setTimeout(remove, duration);
}
window.showToast = showToast;

// ─── Particles Canvas ──────────────────────────────────────
function initParticles(canvasId = 'particles-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, connections;
  const PARTICLE_COUNT = Math.min(80, Math.floor(window.innerWidth / 15));
  const MAX_DIST = 120;
  const CYAN = '0, 212, 255';
  const BLUE = '0, 119, 255';

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width = parent.offsetWidth;
    H = canvas.height = parent.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? CYAN : BLUE,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, 0.05)`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); particles.forEach(p => {
    if (p.x > W) p.x = W - 10;
    if (p.y > H) p.y = H - 10;
  }); });

  init();
  draw();
}

// ─── Scroll Reveal ─────────────────────────────────────────
function initScrollReveal() {
  const opts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, opts);

  document.querySelectorAll('.reveal, .reveal-group').forEach(el => io.observe(el));
}

// ─── Navbar ────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!navbar) return;

  // Scroll style
  const updateNav = () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Hamburger
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlighting
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.navbar-links a[href^="#"], .mobile-menu a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // Auth state in nav
  updateNavAuth();
}

function updateNavAuth() {
  const student = Auth?.getStudent?.();
  const loginBtn = document.getElementById('nav-login-btn');
  const dashBtn = document.getElementById('nav-dash-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');

  if (student) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (dashBtn) { dashBtn.style.display = 'inline-flex'; dashBtn.textContent = `Hi, ${student.name.split(' ')[0]}`; }
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (dashBtn) dashBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// ─── Stat Counter Animation ─────────────────────────────────
function animateCounter(el, target, duration = 2000) {
  const start = performance.now();
  const startVal = 0;

  requestAnimationFrame(function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current.toLocaleString() + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  });
}

function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target || '0');
        animateCounter(el, target);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => io.observe(el));
}

// ─── Modal System ───────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

window.openModal = openModal;
window.closeModal = closeModal;

function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  // Open triggers
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
  });
}

// ─── Contact Form ───────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
      await ContactAPI.submit(data);
      showToast('Message sent! We\'ll get back to you soon 🚀', 'success', 5000);
      form.reset();
    } catch (err) {
      showToast(err.message || 'Failed to send. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Message';
    }
  });
}

// ─── WhatsApp Community Form ────────────────────────────────
function initCommunityForm() {
  const form = document.getElementById('community-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Joining...';

    try {
      await ContactAPI.joinCommunity(data);
      showToast('You\'re in! 🎉 Redirecting you to the WhatsApp group...', 'success', 5000);
      
      // WhatsApp Group Link provided by user
      const whatsappLink = 'https://chat.whatsapp.com/FhFZqVEoRMVEAMC2DxeLMB';
      
      setTimeout(() => {
        window.open(whatsappLink, '_blank');
        closeModal('whatsapp-modal');
        form.reset();
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Could not join. Try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Join Community';
    }
  });
}

// ─── Logout ─────────────────────────────────────────────────
function initLogout() {
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clear();
      showToast('Logged out successfully.', 'info');
      setTimeout(() => location.reload(), 1000);
    });
  }
}

// ─── Typewriter Effect ──────────────────────────────────────
function typewriter(el, words, speed = 80, deleteSpeed = 40, pause = 2000) {
  let wordIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIdx % words.length];
    if (deleting) {
      el.textContent = word.slice(0, charIdx--);
      if (charIdx < 0) {
        deleting = false;
        wordIdx++;
        setTimeout(tick, 400);
        return;
      }
    } else {
      el.textContent = word.slice(0, charIdx++);
      if (charIdx > word.length) {
        deleting = true;
        setTimeout(tick, pause);
        return;
      }
    }
    setTimeout(tick, deleting ? deleteSpeed : speed);
  }
  tick();
}

// ─── Featured Workshops Preview (Homepage) ──────────────────
async function loadFeaturedWorkshops() {
  const container = document.getElementById('featured-workshops');
  if (!container) return;

  try {
    const workshops = await WorkshopsAPI.getAll({ featured: 'true' });
    const categoryIcons = { ai: '🤖', cyber: '🛡️', competition: '🏆' };
    const categoryTags = { ai: 'tag-ai', cyber: 'tag-cyber', competition: 'tag-comp' };

    container.innerHTML = workshops.slice(0, 3).map(w => `
      <div class="workshop-card reveal">
        <div class="workshop-card-img-wrap">
          <div class="workshop-img-placeholder-small">${categoryIcons[w.category] || '📚'}</div>
        </div>
        <div class="workshop-card-body">
          <div class="workshop-card-meta">
            <span class="tag ${categoryTags[w.category] || 'tag-ai'}">${w.category.toUpperCase()}</span>
            <span>📅 ${w.date ? new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
          </div>
          <div class="workshop-card-title">${w.title}</div>
          <div class="workshop-card-desc">${w.description?.slice(0, 100)}...</div>
          <div class="workshop-card-footer">
            <div class="seats-bar">
              <div class="seats-label">${w.seats_total - w.seats_filled} / ${w.seats_total} seats left</div>
              <div class="seats-progress">
                <div class="seats-fill" style="width:${(w.seats_filled / w.seats_total) * 100}%"></div>
              </div>
            </div>
            <a href="workshops.html" class="btn btn-sm btn-secondary" style="margin-left:16px; flex-shrink:0">View</a>
          </div>
        </div>
      </div>
    `).join('');

    // Re-run scroll reveal for new elements
    initScrollReveal();
  } catch (err) {
    container.innerHTML = `
      <div class="workshop-card"><div class="workshop-card-body">
        <div class="workshop-card-title">🤖 AI Workshops</div>
        <div class="workshop-card-desc">Hands-on sessions covering machine learning, voice AI, and image recognition. Start from zero!</div>
        <a href="workshops.html" class="btn btn-sm btn-secondary">Explore</a>
      </div></div>
      <div class="workshop-card"><div class="workshop-card-body">
        <div class="workshop-card-title">🛡️ Cyber Bootcamp</div>
        <div class="workshop-card-desc">Learn how hackers think! Real-world simulations of phishing, password attacks, and countermeasures.</div>
        <a href="workshops.html" class="btn btn-sm btn-secondary">Explore</a>
      </div></div>
      <div class="workshop-card"><div class="workshop-card-body">
        <div class="workshop-card-title">🏆 Summer Challenge</div>
        <div class="workshop-card-desc">Annual AIcyberX tech competition with prizes, certificates, and recognition for top performers!</div>
        <a href="competitions.html" class="btn btn-sm btn-secondary">Register</a>
      </div></div>
    `;
  }
}

// ─── Smooth Scroll ──────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ─── Cursor Glow (desktop only) ─────────────────────────────
function initCursorGlow() {
  if (window.innerWidth < 1024) return;
  const cursor = document.createElement('div');
  cursor.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
  `;
  document.body.appendChild(cursor);

  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  function animate() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(animate);
  }
  animate();
}

// ─── Init All ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initCounters();
  initModals();
  initContactForm();
  initCommunityForm();
  initLogout();
  initSmoothScroll();
  initParticles('particles-canvas');
  loadFeaturedWorkshops();

  // Cursor glow only on desktop
  if (!('ontouchstart' in window)) initCursorGlow();

  // Typewriter on hero if element exists
  const tw = document.getElementById('typewriter-text');
  if (tw) {
    typewriter(tw, ['AI Workshops', 'Cyber Bootcamps', 'Hackathons', 'Innovation Challenges', 'Live Demos']);
  }
});
