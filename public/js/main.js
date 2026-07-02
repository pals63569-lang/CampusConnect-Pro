const API_URL = '/api';

// Authentication helper utilities
const getToken = () => localStorage.getItem('cc_token');
const setToken = (token) => localStorage.setItem('cc_token', token);
const removeToken = () => localStorage.removeItem('cc_token');

const getCurrentUser = () => {
  const user = localStorage.getItem('cc_user');
  return user ? JSON.parse(user) : null;
};
const setCurrentUser = (user) => localStorage.setItem('cc_user', JSON.stringify(user));

const logout = () => {
  removeToken();
  localStorage.removeItem('cc_user');
  window.location.href = '/login.html';
};

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Formatting utilities
const formatDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr) => timeStr || 'TBD';

// SweetAlert2 wrapper helpers
const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    background: document.documentElement.getAttribute('data-theme') === 'light' ? '#fff' : '#111126',
    color: document.documentElement.getAttribute('data-theme') === 'light' ? '#1e1b4b' : '#f3f4f6',
    confirmButtonColor: '#6366f1'
  });
};

const showToast = (title, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: document.documentElement.getAttribute('data-theme') === 'light' ? '#fff' : '#111126',
    color: document.documentElement.getAttribute('data-theme') === 'light' ? '#1e1b4b' : '#f3f4f6',
  });
  Toast.fire({ icon, title });
};

// Navigation menu active highlight helper
const highlightActiveMenu = () => {
  const path = window.location.pathname;
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (path.includes(href) && href !== '#') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

// Route Authorization Guard
const checkAuth = (allowedRoles = []) => {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    logout();
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their home dashboard
    if (user.role === 'Admin' || user.role === 'Super Admin') {
      window.location.href = '/dashboards/admin.html';
    } else if (user.role === 'Faculty Coordinator') {
      window.location.href = '/dashboards/faculty.html';
    } else {
      window.location.href = '/dashboards/student.html';
    }
    return false;
  }
  return true;
};

// Countdown Timer logic
const initCountdown = (targetDateStr, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const targetDate = new Date(targetDateStr).getTime();

  const updateTimer = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      container.innerHTML = `<span class="text-danger fw-bold">EVENT HAS STARTED / ENDED</span>`;
      clearInterval(timerInterval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    container.innerHTML = `
      <div class="countdown-item">
        <div class="countdown-value">${days}</div>
        <div class="countdown-label">Days</div>
      </div>
      <div class="countdown-item">
        <div class="countdown-value">${hours}</div>
        <div class="countdown-label">Hrs</div>
      </div>
      <div class="countdown-item">
        <div class="countdown-value">${minutes}</div>
        <div class="countdown-label">Min</div>
      </div>
      <div class="countdown-item">
        <div class="countdown-value">${seconds}</div>
        <div class="countdown-label">Sec</div>
      </div>
    `;
  };

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
};

// Global Topbar dynamic rendering
const renderNavbar = () => {
  const user = getCurrentUser();
  const navContainer = document.getElementById('navbar-auth-section');
  if (!navContainer) return;

  if (user) {
    let dashboardLink = '/dashboards/student.html';
    if (user.role === 'Admin' || user.role === 'Super Admin') {
      dashboardLink = '/dashboards/admin.html';
    } else if (user.role === 'Faculty Coordinator') {
      dashboardLink = '/dashboards/faculty.html';
    }

    navContainer.innerHTML = `
      <li class="nav-item">
        <a class="nav-link fw-semibold" href="${dashboardLink}"><i class="fas fa-th-large me-1"></i> Dashboard</a>
      </li>
      <li class="nav-item">
        <a class="btn btn-outline-glass ms-2" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-1"></i> Logout</a>
      </li>
    `;
  } else {
    navContainer.innerHTML = `
      <li class="nav-item">
        <a class="nav-link fw-semibold" href="/login.html"><i class="fas fa-sign-in-alt me-1"></i> Sign In</a>
      </li>
      <li class="nav-item">
        <a class="btn btn-glow ms-2" href="/register.html">Sign Up</a>
      </li>
    `;
  }
};
