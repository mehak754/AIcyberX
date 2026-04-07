/* ============================================================
   AIcyberX — Auth Page JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // ─── Tab Switching ───────────────────────────────────────
  function showTab(tab) {
    const isLogin = tab === 'login';
    loginTab?.classList.toggle('active', isLogin);
    registerTab?.classList.toggle('active', !isLogin);
    loginForm?.classList.toggle('hidden', !isLogin);
    registerForm?.classList.toggle('hidden', isLogin);
  }

  loginTab?.addEventListener('click', () => showTab('login'));
  registerTab?.addEventListener('click', () => showTab('register'));

  // Check URL param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'register') showTab('register');
  else showTab('login');

  // ─── Login Form ──────────────────────────────────────────
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type="submit"]');
    const data = { email: loginForm.email.value, password: loginForm.password.value };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Logging in...';

    try {
      const res = await AuthAPI.login(data);
      Auth.save(res.token, res.student);
      showToast(`Welcome back, ${res.student.name.split(' ')[0]}! 🚀`, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Login';
    }
  });

  // ─── Register Form ───────────────────────────────────────
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('[type="submit"]');

    const password = registerForm.password.value;
    const confirm = registerForm.confirm_password.value;

    if (password !== confirm) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    const data = {
      name: registerForm.name.value,
      email: registerForm.email.value,
      phone: registerForm.phone.value,
      institution: registerForm.institution.value,
      grade: registerForm.grade.value,
      city: registerForm.city.value,
      password,
    };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
      const res = await AuthAPI.register(data);
      Auth.save(res.token, res.student);
      showToast('Welcome to AIcyberX Community! 🎉', 'success', 5000);
      setTimeout(() => window.location.href = 'dashboard.html', 1200);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  });

  // ─── Password Toggle ─────────────────────────────────────
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.querySelector(btn.dataset.togglePassword);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });

  // Password strength indicator
  const pwInput = document.getElementById('reg-password');
  const pwStrength = document.getElementById('pw-strength');

  if (pwInput && pwStrength) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      let strength = 0;
      if (val.length >= 6) strength++;
      if (val.length >= 10) strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;

      const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
      const colors = ['', '#ff4060', '#ff6b35', '#f59e0b', '#00d4ff', '#00ff88'];
      pwStrength.textContent = val ? levels[strength] : '';
      pwStrength.style.color = colors[strength];
    });
  }
});
