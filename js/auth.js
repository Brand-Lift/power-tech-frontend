/**
 * auth.js — Authentication logic for Power Tech
 * Handles: signup, login, logout, token storage, UI state updates
 *
 * API Endpoints:
 *   POST /api/auth/register  → { name, phone, email?, password }
 *   POST /api/auth/login     → { phone, password }
 */

// ─── Current Auth State ───────────────────────────────────────────────────────
// We store both JWT token and user object in localStorage.
let _currentUser = null;
let _token = null;

/**
 * Initialise auth state from localStorage on page load.
 * Called by app.js on DOMContentLoaded.
 */
function initAuth() {
  try {
    const storedToken = localStorage.getItem('pt_token');
    const storedUser  = localStorage.getItem('pt_user');
    if (storedToken && storedUser) {
      _token       = storedToken;
      _currentUser = JSON.parse(storedUser);
      updateAuthUI(true);
    } else {
      updateAuthUI(false);
    }
  } catch (err) {
    console.warn('[Auth] Failed to read stored auth:', err);
    clearAuth();
  }
}

/** Returns the stored JWT token (or null if not logged in). */
function getToken() { return _token; }

/** Returns the current user object (or null). */
function getCurrentUser() { return _currentUser; }

/** Returns true if a user is currently authenticated. */
function isLoggedIn() { return !!_token && !!_currentUser; }

// ─── Sign-In Handler ──────────────────────────────────────────────────────────
/**
 * Handles the Sign In form submission.
 * Validates inputs, calls POST /api/auth/login, stores token, updates UI.
 * @param {Event} event — form submit event
 */
async function handleSignIn(event) {
  event.preventDefault();

  // Grab inputs
  const phone    = document.getElementById('signin-phone').value.trim();
  const password = document.getElementById('signin-password').value;
  const errEl    = document.getElementById('signin-error');

  // Clear previous errors
  clearAuthErrors('signin');

  // Client-side validation
  let valid = true;
  if (!phone || !/^\d{10}$/.test(phone)) {
    showFieldError('signin-phone', 'signin-phone-err', 'Please enter a valid 10-digit phone number.');
    valid = false;
  }
  if (!password) {
    showFieldError('signin-password', 'signin-pass-err', 'Password is required.');
    valid = false;
  }
  if (!valid) return;

  // Disable button, show loading
  const btn = document.getElementById('signin-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const res  = await fetch(`${CONFIG.BACKEND_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      // Show server error (e.g., wrong credentials)
      errEl.textContent = data.error || 'Invalid phone or password.';
      errEl.classList.add('visible');
    } else {
      // Success — store token and user, update UI
      storeAuth(data.token, data.user);
      closeAuthModal();
      showToast('success', '👋 Welcome back!', `Signed in as ${data.user.name}.`);
      updateAuthUI(true);
    }
  } catch (err) {
    console.error('[Auth] Sign in error:', err);
    errEl.textContent = 'Network error. Please check your connection.';
    errEl.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
}

// ─── Sign-Up Handler ──────────────────────────────────────────────────────────
/**
 * Handles the Sign Up form submission.
 * Validates inputs, calls POST /api/auth/register, stores token, updates UI.
 * @param {Event} event — form submit event
 */
async function handleSignUp(event) {
  event.preventDefault();

  // Grab inputs
  const name     = document.getElementById('signup-name').value.trim();
  const phone    = document.getElementById('signup-phone').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const errEl    = document.getElementById('signup-error');

  // Clear previous errors
  clearAuthErrors('signup');

  // Client-side validation
  let valid = true;

  if (!name || name.length < 2) {
    showFieldError('signup-name', 'signup-name-err', 'Name must be at least 2 characters.');
    valid = false;
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    showFieldError('signup-phone', 'signup-phone-err', 'Enter a valid 10-digit phone number.');
    valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('signup-email', 'signup-email-err', 'Enter a valid email address.');
    valid = false;
  }
  if (!password || password.length < 6) {
    showFieldError('signup-password', 'signup-pass-err', 'Password must be at least 6 characters.');
    valid = false;
  }
  if (password !== confirm) {
    showFieldError('signup-confirm', 'signup-confirm-err', 'Passwords do not match.');
    valid = false;
  }
  if (!valid) return;

  // Disable button
  const btn = document.getElementById('signup-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res  = await fetch(`${CONFIG.BACKEND_URL}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, email: email || null, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Registration failed. Please try again.';
      errEl.classList.add('visible');
    } else {
      // Success
      storeAuth(data.token, data.user);
      closeAuthModal();
      showToast('success', '🎉 Account Created!', `Welcome, ${data.user.name}!`);
      updateAuthUI(true);
    }
  } catch (err) {
    console.error('[Auth] Sign up error:', err);
    errEl.textContent = 'Network error. Please check your connection.';
    errEl.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
/**
 * Logs the user out, clears local state, updates UI, and resets cart.
 */
function logout() {
  clearAuth();
  updateAuthUI(false);

  // Close profile dropdown
  const chip = document.getElementById('profile-chip');
  if (chip) chip.classList.remove('open');

  showToast('info', '👋 Logged Out', 'You have been successfully signed out.');

  // Switch back to home after logout
  switchTab('home');
}

// ─── Auth Storage Helpers ─────────────────────────────────────────────────────
/** Saves JWT and user to memory + localStorage. */
function storeAuth(token, user) {
  _token       = token;
  _currentUser = user;
  localStorage.setItem('pt_token', token);
  localStorage.setItem('pt_user', JSON.stringify(user));
}

/** Clears auth state from memory and localStorage. */
function clearAuth() {
  _token       = null;
  _currentUser = null;
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pt_user');
}

// ─── UI Update ────────────────────────────────────────────────────────────────
/**
 * Updates the header to show either the auth button or profile chip.
 * @param {boolean} loggedIn
 */
function updateAuthUI(loggedIn) {
  const authBtn     = document.getElementById('auth-btn');
  const profileChip = document.getElementById('profile-chip');
  const profileName = document.getElementById('profile-name-text');
  const profileInit = document.getElementById('profile-avatar-initials');

  if (loggedIn && _currentUser) {
    // Show profile chip, hide auth button
    authBtn.classList.add('hidden');
    profileChip.classList.remove('hidden');

    // Set name and initials
    profileName.textContent = _currentUser.name;
    const initials = _currentUser.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    profileInit.textContent = initials;
  } else {
    // Show auth button, hide profile chip
    authBtn.classList.remove('hidden');
    profileChip.classList.add('hidden');
  }
}

// ─── Modal Controls ───────────────────────────────────────────────────────────
/** Opens the authentication modal. */
function openAuthModal() {
  document.getElementById('auth-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('#auth-modal input');
    if (firstInput) firstInput.focus();
  }, 300);
}

/** Closes the authentication modal and resets forms. */
function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset forms
  document.getElementById('signin-form').reset();
  document.getElementById('signup-form').reset();
  clearAuthErrors('signin');
  clearAuthErrors('signup');
}

/**
 * Switches between Sign In and Sign Up tabs.
 * @param {'signin'|'signup'} tab
 */
function switchAuthTab(tab) {
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const tabSignIn  = document.getElementById('tab-signin');
  const tabSignUp  = document.getElementById('tab-signup');

  if (tab === 'signin') {
    signinForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    tabSignIn.setAttribute('aria-selected', 'true');
    tabSignUp.setAttribute('aria-selected', 'false');
  } else {
    signinForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabSignIn.classList.remove('active');
    tabSignUp.classList.add('active');
    tabSignIn.setAttribute('aria-selected', 'false');
    tabSignUp.setAttribute('aria-selected', 'true');
  }
}

/** Handles clicking the overlay background to close modal. */
function handleModalOverlayClick(event, modalId) {
  if (event.target.id === modalId) closeAuthModal();
}

// ─── Profile Dropdown Toggle ──────────────────────────────────────────────────
function toggleProfileDropdown() {
  const chip = document.getElementById('profile-chip');
  chip.classList.toggle('open');
  chip.setAttribute('aria-expanded', chip.classList.contains('open'));
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const chip = document.getElementById('profile-chip');
  if (chip && !chip.contains(e.target)) {
    chip.classList.remove('open');
    chip.setAttribute('aria-expanded', 'false');
  }
});

// ─── Form Error Helpers ───────────────────────────────────────────────────────
/** Shows a field-level validation error. */
function showFieldError(inputId, errId, message) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) input.classList.add('error');
  if (err) {
    err.textContent = message;
    err.classList.add('visible');
  }
}

/** Clears all field errors for a form prefix ('signin' or 'signup'). */
function clearAuthErrors(prefix) {
  const form = document.getElementById(`${prefix}-form`);
  if (!form) return;
  form.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}
