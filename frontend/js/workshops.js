/* ============================================================
   AIcyberX — Workshops Page JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('workshops-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let allWorkshops = [];
  let currentFilter = 'all';

  const categoryIcons = { ai: '🤖', cyber: '🛡️', competition: '🏆' };
  const categoryTags  = { ai: 'tag-ai', cyber: 'tag-cyber', competition: 'tag-comp' };
  const categoryNames = { ai: 'AI', cyber: 'Cybersecurity', competition: 'Competition' };

  // ─── Skeleton Loader ─────────────────────────────────────
  function showSkeleton() {
    grid.innerHTML = Array.from({ length: 6 }, () => `
      <div class="workshop-card">
        <div class="workshop-card-img-wrap skeleton" style="height:200px"></div>
        <div class="workshop-card-body">
          <div class="skeleton" style="height:20px;width:60%;margin-bottom:12px"></div>
          <div class="skeleton" style="height:16px;width:90%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:70%;margin-bottom:20px"></div>
          <div class="skeleton" style="height:36px;width:40%"></div>
        </div>
      </div>
    `).join('');
  }

  // ─── Render Workshops ─────────────────────────────────────
  function render(workshops) {
    if (workshops.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:16px">🔍</div>
          <p style="font-size:16px">No workshops in this category yet. Check back soon!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = workshops.map(w => {
      const seatsLeft = w.seats_total - w.seats_filled;
      const seatsPercent = Math.round((w.seats_filled / w.seats_total) * 100);
      const icon = categoryIcons[w.category] || '📚';
      const isRegistered = false; // Would need to check against stored registrations

      return `
        <div class="workshop-card reveal" data-id="${w.id}">
          <div class="workshop-card-img-wrap">
            <div class="workshop-img-placeholder-small" id="ws-icon-${w.id}">${icon}</div>
          </div>
          <div class="workshop-card-body">
            <div class="workshop-card-meta">
              <span class="tag ${categoryTags[w.category] || 'tag-ai'}">${categoryNames[w.category] || w.category}</span>
              ${w.is_featured ? '<span class="tag tag-new">⭐ Featured</span>' : ''}
            </div>
            <div class="workshop-card-title">${w.title}</div>
            <div class="workshop-card-desc">${w.description || ''}</div>
            <div style="margin-bottom:16px">
              ${w.date ? `<div style="font-size:12px;color:var(--text-muted);display:flex;gap:16px;flex-wrap:wrap">
                <span>📅 ${new Date(w.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long' })}</span>
                ${w.time ? `<span>🕐 ${w.time}</span>` : ''}
                ${w.location ? `<span>📍 ${w.location}</span>` : ''}
              </div>` : ''}
            </div>
            <div style="margin-bottom:16px">
              <div class="seats-label" style="font-size:11px;color:var(--text-muted);margin-bottom:4px">
                ${seatsLeft <= 5 && seatsLeft > 0 ? `⚠️ Only ${seatsLeft} seats left!` : `${seatsLeft} / ${w.seats_total} seats available`}
              </div>
              <div class="seats-progress">
                <div class="seats-fill" style="width:${seatsPercent}%;background:${seatsPercent > 80 ? 'linear-gradient(90deg,#ff4060,#ff6b35)' : 'linear-gradient(90deg,var(--cyan),var(--blue))'}"></div>
              </div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" onclick="handleRegister(${w.id})" ${seatsLeft <= 0 ? 'disabled' : ''} id="reg-btn-${w.id}">
                ${seatsLeft <= 0 ? '🔒 Fully Booked' : '📝 Register Free'}
              </button>
              ${w.registration_link ? `<a href="${w.registration_link}" target="_blank" class="btn btn-ghost btn-sm">External Link ↗</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-run scroll reveal
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('visible');
    });
    setTimeout(() => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }, 50);
  }

  // ─── Register Handler ─────────────────────────────────────
  window.handleRegister = async (id) => {
    if (!Auth.isLoggedIn()) {
      showToast('Please log in to register for workshops.', 'info');
      setTimeout(() => window.location.href = 'login.html?tab=register', 1500);
      return;
    }

    const btn = document.getElementById(`reg-btn-${id}`);
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Registering...';

    try {
      const res = await WorkshopsAPI.register(id);
      showToast(res.message, 'success', 5000);
      btn.innerHTML = '✅ Registered!';
      btn.style.background = 'rgba(0,255,136,0.15)';
      btn.style.color = 'var(--green)';
      btn.style.borderColor = 'rgba(0,255,136,0.3)';
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  };

  // ─── Filter Buttons ───────────────────────────────────────
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      const filtered = currentFilter === 'all'
        ? allWorkshops
        : allWorkshops.filter(w => w.category === currentFilter);
      render(filtered);
    });
  });

  // ─── Load Workshops ───────────────────────────────────────
  showSkeleton();
  try {
    allWorkshops = await WorkshopsAPI.getAll();
    render(allWorkshops);
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
        <p>Could not load workshops. Make sure the backend is running.</p>
        <button class="btn btn-secondary" style="margin-top:16px" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
});
