const API_BASE_URL = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://localhost:5000/api';

function isPagesDirectory() {
  return window.location.pathname.includes('/pages/');
}

function getPathForPage(page) {
  if (isPagesDirectory()) {
    const map = {
      index: '../index.html',
      login: 'login.html',
      forgot: 'forgot-password.html',
      reset: 'reset-password.html',
      signup: 'signup.html',
      request: 'request.html',
      resident: 'my-requests.html',
      admin: 'admin.html'
    };

    return map[page];
  }

  const map = {
    index: 'index.html',
    login: 'pages/login.html',
    forgot: 'pages/forgot-password.html',
    reset: 'pages/reset-password.html',
    signup: 'pages/signup.html',
    request: 'pages/request.html',
    resident: 'pages/my-requests.html',
    admin: 'pages/admin.html'
  };

  return map[page];
}

function setFormMessage(element, message, type) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-message ${type}`;
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.innerHTML.trim();
  }

  if (isLoading) {
    button.disabled = true;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${loadingText}</span>`;
    return;
  }

  button.disabled = false;
  button.classList.remove('is-loading');
  button.removeAttribute('aria-busy');
  button.innerHTML = button.dataset.defaultLabel;
}

function bindPasswordToggle(input, toggle) {
  if (!input || !toggle) {
    return;
  }

  toggle.addEventListener('click', function () {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
}

function getRememberedIdentifier() {
  return localStorage.getItem('rememberedIdentifier') || '';
}

function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

function saveRememberedIdentifier(identifier) {
  if (identifier) {
    localStorage.setItem('rememberedIdentifier', identifier);
    return;
  }

  localStorage.removeItem('rememberedIdentifier');
}

function saveAuthSession(payload, rememberMe) {
  const activeStorage = rememberMe ? localStorage : sessionStorage;
  const inactiveStorage = rememberMe ? sessionStorage : localStorage;

  inactiveStorage.removeItem('authToken');
  inactiveStorage.removeItem('authUser');
  activeStorage.setItem('authToken', payload.token);
  activeStorage.setItem('authUser', JSON.stringify(payload.user));
}

function clearAuthSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
}

function closeOpenSidebars() {
  document.querySelectorAll('.admin-sidebar.active, .nav-menu.active').forEach(element => {
    element.classList.remove('active');
  });

  document.querySelectorAll('.sidebar-overlay.active, .nav-overlay.active').forEach(element => {
    element.classList.remove('active');
  });

  document.querySelectorAll('.hamburger.active, .sidebar-toggle.active').forEach(element => {
    element.classList.remove('active');
  });

  document.documentElement.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
}

function ensureConfirmDialog() {
  let overlay = document.getElementById('confirmDialogOverlay');
  let modal = document.getElementById('confirmDialog');

  if (overlay && modal) {
    return { overlay, modal };
  }

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay confirm-dialog-overlay';
  overlay.id = 'confirmDialogOverlay';

  modal = document.createElement('div');
  modal.className = 'request-preview-modal confirm-dialog';
  modal.id = 'confirmDialog';
  modal.innerHTML = `
    <div class="modal-header">
      <h3 id="confirmDialogTitle">Confirm Action</h3>
      <button class="modal-close" id="confirmDialogClose" type="button" aria-label="Close confirmation">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="confirm-dialog-body">
      <p id="confirmDialogMessage">Are you sure you want to continue?</p>
    </div>
    <div class="preview-actions confirm-dialog-actions">
      <button class="btn btn-secondary" id="confirmDialogCancel" type="button">Cancel</button>
      <button class="btn btn-primary" id="confirmDialogConfirm" type="button">Confirm</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  return { overlay, modal };
}

function showConfirmDialog(options = {}) {
  closeOpenSidebars();

  const { overlay, modal } = ensureConfirmDialog();
  const titleEl = document.getElementById('confirmDialogTitle');
  const messageEl = document.getElementById('confirmDialogMessage');
  const closeBtn = document.getElementById('confirmDialogClose');
  const cancelBtn = document.getElementById('confirmDialogCancel');
  const confirmBtn = document.getElementById('confirmDialogConfirm');

  if (titleEl) {
    titleEl.textContent = options.title || 'Confirm Action';
  }

  if (messageEl) {
    messageEl.textContent = options.message || 'Are you sure you want to continue?';
  }

  if (confirmBtn) {
    confirmBtn.textContent = options.confirmLabel || 'Confirm';
  }

  if (cancelBtn) {
    cancelBtn.textContent = options.cancelLabel || 'Cancel';
  }

  overlay.classList.add('active');
  modal.classList.add('active');
  document.body.classList.add('modal-open');

  return new Promise(resolve => {
    function closeDialog(result) {
      overlay.classList.remove('active');
      modal.classList.remove('active');
      document.body.classList.remove('modal-open');
      overlay.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      resolve(result);
    }

    function handleCancel() {
      closeDialog(false);
    }

    function handleConfirm() {
      closeDialog(true);
    }

    overlay.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
  });
}

window.showConfirmDialog = showConfirmDialog;
window.getAuthToken = getAuthToken;

async function confirmLogout() {
  return showConfirmDialog({
    title: 'Log Out',
    message: 'Are you sure you want to log out of your account?',
    confirmLabel: 'Log Out',
    cancelLabel: 'Stay'
  });
}

function getStoredAuthUser() {
  const rawUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    clearAuthSession();
    return null;
  }
}

function redirectToLogin() {
  window.location.href = getPathForPage('login');
}

function redirectToResidentSubmitView() {
  window.location.href = `${getPathForPage('resident')}#submit-request`;
}

function revealProtectedPage() {
  document.body.classList.remove('auth-pending');
}

function getRedirectPathByRole(role) {
  if (role === 'admin' || role === 'staff') {
    return getPathForPage('admin');
  }

  return getPathForPage('resident');
}

function bindLogoutAction(element) {
  if (!element || element.dataset.logoutBound === 'true') {
    return;
  }

  element.dataset.logoutBound = 'true';
  element.addEventListener('click', async function (event) {
    event.preventDefault();

    if (!(await confirmLogout())) {
      return;
    }

    clearAuthSession();
    window.location.href = getPathForPage('login');
  });
}

function updateNavigationForSession(user) {
  const mobileSecondary = document.querySelector('.signup-mobile');
  const mobilePrimary = document.querySelector('.login-mobile');
  const desktopSecondary = document.querySelector('.signup-desktop');
  const desktopPrimary = document.querySelector('.login-desktop');
  const heroSubmitBtn = document.getElementById('heroSubmitRequestBtn');
  const myRequestsLinks = document.querySelectorAll('.nav-link[href$="my-requests.html"]');

  const guestSecondaryHref = getPathForPage('signup');
  const guestPrimaryHref = getPathForPage('login');
  const requestHref = getPathForPage('request');
  const residentHref = getPathForPage('resident');
  const adminHref = getPathForPage('admin');

  if (!user) {
    [mobileSecondary, desktopSecondary].forEach(link => {
      if (!link) {
        return;
      }

      link.textContent = 'Sign Up';
      link.setAttribute('href', guestSecondaryHref);
      link.classList.remove('logout-link');
    });

    [mobilePrimary, desktopPrimary].forEach(link => {
      if (!link) {
        return;
      }

      link.textContent = 'Login';
      link.setAttribute('href', guestPrimaryHref);
      link.classList.remove('logout-link');
    });

    myRequestsLinks.forEach(link => {
      link.style.display = 'none';
    });

    if (heroSubmitBtn) {
      heroSubmitBtn.setAttribute('href', guestPrimaryHref);
    }

    return;
  }

  const isAdmin = user.role === 'admin' || user.role === 'staff';
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'My Dashboard';
  const dashboardHref = isAdmin ? adminHref : residentHref;

  [mobileSecondary, desktopSecondary].forEach(link => {
    if (!link) {
      return;
    }

    link.textContent = dashboardLabel;
    link.setAttribute('href', dashboardHref);
    link.classList.remove('logout-link');
  });

  [mobilePrimary, desktopPrimary].forEach(link => {
    if (!link) {
      return;
    }

    link.textContent = 'Logout';
    link.setAttribute('href', '#');
    link.classList.add('logout-link');
    bindLogoutAction(link);
  });

  myRequestsLinks.forEach(link => {
    if (isAdmin) {
      link.textContent = 'Admin Dashboard';
      link.setAttribute('href', adminHref);
      link.style.display = '';
      return;
    }

    link.textContent = 'My Requests';
    link.setAttribute('href', residentHref);
    link.style.display = '';
  });

  if (heroSubmitBtn) {
    heroSubmitBtn.setAttribute('href', requestHref);
  }
}

async function hydrateCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok || !data.user) {
    throw new Error(data.message || 'Session expired.');
  }

  if (localStorage.getItem('authToken')) {
    localStorage.setItem('authUser', JSON.stringify(data.user));
  } else {
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
  }
  return data.user;
}

async function protectAdminPage() {
  const storedUser = getStoredAuthUser();
  const token = getAuthToken();

  if (!token || !storedUser) {
    clearAuthSession();
    redirectToLogin();
    return;
  }

  try {
    const user = await hydrateCurrentUser();

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      clearAuthSession();
      window.location.href = '../index.html';
      return;
    }

    const nameEl = document.getElementById('adminProfileName');
    const roleEl = document.getElementById('adminProfileRole');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) {
      nameEl.textContent = user.full_name || user.username || 'Admin User';
    }

    if (roleEl) {
      roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Barangay Staff';
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function (event) {
        event.preventDefault();

        if (!(await confirmLogout())) {
          return;
        }

        clearAuthSession();
        redirectToLogin();
      });
    }

    const adminResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!adminResponse.ok) {
      throw new Error('Admin access check failed.');
    }

    revealProtectedPage();
  } catch (error) {
    clearAuthSession();
    redirectToLogin();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const currentPage = document.body.dataset.page;
  const loginForm = document.getElementById('loginForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const signupForm = document.getElementById('signupForm');
  const storedUser = getStoredAuthUser();

  updateNavigationForSession(storedUser);

  if (currentPage === 'admin') {
    protectAdminPage();
    return;
  }

  if (currentPage === 'request' && !storedUser) {
    window.location.href = getPathForPage('login');
    return;
  }

  if (currentPage === 'request' && storedUser) {
    if (storedUser.role === 'admin' || storedUser.role === 'staff') {
      revealProtectedPage();
      return;
    }

    redirectToResidentSubmitView();
    return;
  }

  if ((currentPage === 'login' || currentPage === 'signup' || currentPage === 'forgot-password' || currentPage === 'reset-password') && storedUser) {
    window.location.href = getRedirectPathByRole(storedUser.role);
    return;
  }

  if (loginForm) {
    const passwordInput = document.getElementById('passwordInput');
    const passwordToggle = document.getElementById('passwordToggle');
    const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
    const messageEl = document.getElementById('loginMessage');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    bindPasswordToggle(passwordInput, passwordToggle);

    const rememberedIdentifier = getRememberedIdentifier();
    if (rememberMeCheckbox && rememberedIdentifier) {
      rememberMeCheckbox.checked = true;
      const identifierInput = loginForm.querySelector('[name="identifier"]');
      if (identifierInput && !identifierInput.value) {
        identifierInput.value = rememberedIdentifier;
      }
    }

    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const payload = {
        identifier: String(formData.get('identifier') || '').trim(),
        password: String(formData.get('password') || '')
      };
      const rememberMe = Boolean(formData.get('rememberMe'));

      setFormMessage(messageEl, 'Signing you in. This may take a few seconds if the server is waking up...', 'info');
      setButtonLoading(submitButton, true, 'Signing In...');

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed.');
        }

        saveAuthSession(data, rememberMe);
        saveRememberedIdentifier(rememberMe ? payload.identifier : '');
        setFormMessage(messageEl, data.message || 'Login successful.', 'success');

        window.setTimeout(function () {
          window.location.href = getRedirectPathByRole(data.user.role);
        }, 700);
      } catch (error) {
        setFormMessage(messageEl, error.message || 'Unable to login right now.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }

  if (signupForm) {
    const signupPasswordInput = document.getElementById('signupPasswordInput');
    const signupPasswordToggle = document.getElementById('signupPasswordToggle');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const messageEl = document.getElementById('signupMessage');
    const submitButton = signupForm.querySelector('button[type="submit"]');

    bindPasswordToggle(signupPasswordInput, signupPasswordToggle);
    bindPasswordToggle(confirmPasswordInput, confirmPasswordToggle);

    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const formData = new FormData(signupForm);
      const payload = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        username: String(formData.get('username') || '').trim(),
        password: String(formData.get('password') || ''),
        confirmPassword: String(formData.get('confirmPassword') || '')
      };

      if (payload.password !== payload.confirmPassword) {
        setFormMessage(messageEl, 'Passwords do not match.', 'error');
        return;
      }

      setFormMessage(messageEl, 'Creating your account. This may take a few seconds if the server is waking up...', 'info');
      setButtonLoading(submitButton, true, 'Creating Account...');

      try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Signup failed.');
        }

        saveAuthSession(data);
        setFormMessage(messageEl, data.message || 'Account created successfully.', 'success');

        window.setTimeout(function () {
          window.location.href = getRedirectPathByRole(data.user.role);
        }, 700);
      } catch (error) {
        setFormMessage(messageEl, error.message || 'Unable to create account right now.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }

  if (forgotPasswordForm) {
    const emailInput = document.getElementById('forgotPasswordEmail');
    const messageEl = document.getElementById('forgotPasswordMessage');
    const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

    forgotPasswordForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = String(emailInput?.value || '').trim();

      if (!email) {
        setFormMessage(messageEl, 'Please enter your email address.', 'error');
        return;
      }

      setFormMessage(messageEl, 'Preparing reset instructions. This may take a few seconds if the server is waking up...', 'info');
      setButtonLoading(submitButton, true, 'Sending Instructions...');

      try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to prepare reset instructions.');
        }

        setFormMessage(messageEl, data.message || 'Reset instructions are ready.', 'success');

        if (data.resetToken) {
          window.setTimeout(function () {
            window.location.href = `${getPathForPage('reset')}?token=${encodeURIComponent(data.resetToken)}`;
          }, 700);
          return;
        }

        setFormMessage(
          messageEl,
          'If reset links are disabled in this environment, please contact the administrator for assistance.',
          'info'
        );
      } catch (error) {
        setFormMessage(messageEl, error.message || 'Unable to prepare reset instructions.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }

  if (resetPasswordForm) {
    const newPasswordInput = document.getElementById('resetPasswordInput');
    const newPasswordToggle = document.getElementById('resetPasswordToggle');
    const confirmPasswordInput = document.getElementById('resetConfirmPasswordInput');
    const confirmPasswordToggle = document.getElementById('resetConfirmPasswordToggle');
    const messageEl = document.getElementById('resetPasswordMessage');
    const tokenInput = document.getElementById('resetPasswordToken');
    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';

    bindPasswordToggle(newPasswordInput, newPasswordToggle);
    bindPasswordToggle(confirmPasswordInput, confirmPasswordToggle);

    if (tokenInput) {
      tokenInput.value = token;
    }

    if (!token) {
      setFormMessage(messageEl, 'This reset link is missing or invalid. Please request a new one.', 'error');
      setButtonLoading(submitButton, true, 'Link Invalid');
      return;
    }

    resetPasswordForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const formData = new FormData(resetPasswordForm);
      const payload = {
        token: String(formData.get('token') || '').trim(),
        password: String(formData.get('password') || ''),
        confirmPassword: String(formData.get('confirmPassword') || '')
      };

      if (payload.password !== payload.confirmPassword) {
        setFormMessage(messageEl, 'Passwords do not match.', 'error');
        return;
      }

      setFormMessage(messageEl, 'Resetting your password. This may take a few seconds if the server is waking up...', 'info');
      setButtonLoading(submitButton, true, 'Updating Password...');

      try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to reset password right now.');
        }

        setFormMessage(messageEl, data.message || 'Password reset successful.', 'success');

        window.setTimeout(function () {
          window.location.href = getPathForPage('login');
        }, 900);
      } catch (error) {
        setFormMessage(messageEl, error.message || 'Unable to reset password right now.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }
});
