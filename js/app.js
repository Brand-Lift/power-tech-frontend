/**
 * app.js — Main application orchestrator for Power Tech
 * Responsibilities:
 *   - DOM ready initialisation
 *   - Splash screen timing
 *   - Render product cards with 3D tilt effect
 *   - Tab navigation (Home / Cart / My Orders)
 *   - Toast notification system
 *   - Bottom nav synchronisation
 */

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Init auth state from localStorage
  initAuth();

  // 2. Sync cart badge from localStorage
  syncCartBadge();

  // 3. Render products (after a very brief delay so splash is visible)
  setTimeout(() => {
    renderProducts();
  }, 400);

  // 4. Init payment radio listeners
  initPaymentListeners();

  // 5. Splash screen: hide after 2.5s
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide');
      // Remove from DOM after animation completes
      splash.addEventListener('animationend', () => splash.remove(), { once: true });
    }
  }, 2500);

  // 6. Initial tab = home
  switchTab('home');
});

// ─── Tab Navigation ───────────────────────────────────────────────────────────

/**
 * Switches the visible section and updates active state on both
 * the header nav (desktop) and bottom nav (mobile).
 * @param {'home'|'cart'|'orders'} tab
 */
function switchTab(tab) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Show target section
  const target = document.getElementById(`section-${tab}`);
  if (target) target.classList.add('active');

  // Update header nav buttons (desktop)
  ['home','cart','orders'].forEach(t => {
    const deskBtn = document.getElementById(`nav-${t}-desk`);
    if (deskBtn) deskBtn.classList.toggle('active', t === tab);
  });

  // Update bottom nav buttons (mobile)
  ['home','cart','orders'].forEach(t => {
    const mobBtn = document.getElementById(`nav-${t}-mob`);
    if (mobBtn) mobBtn.classList.toggle('active', t === tab);
  });

  // Side effects per tab
  if (tab === 'orders') {
    fetchOrders();
  }
  if (tab === 'cart') {
    renderCartPage();
  }
}

// ─── Product Rendering ────────────────────────────────────────────────────────

/**
 * Renders all product cards from the PRODUCTS constant into #products-grid.
 * Applies staggered entrance animations and 3D tilt on hover.
 */
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Clear skeleton placeholders
  grid.innerHTML = '';

  PRODUCTS.forEach((product, index) => {
    const card = buildProductCard(product, index);
    grid.appendChild(card);

    // Staggered fade-in via delay
    setTimeout(() => {
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, index * 150 + 100);
  });
}

/**
 * Builds a product card DOM element.
 * @param {Object} product — from PRODUCTS array in config.js
 * @param {number} index — for stagger animation delay
 * @returns {HTMLElement}
 */
function buildProductCard(product, index) {
  const card = document.createElement('div');
  card.className   = 'product-card';
  card.role        = 'listitem';
  card.style.opacity   = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = `opacity 0.5s ease ${index * 120}ms, transform 0.5s ease ${index * 120}ms, border-color 0.3s, box-shadow 0.3s`;

  // Format price in Indian Rupees
  const priceFormatted = product.price.toLocaleString('en-IN');

  // Build appliance chips
  const applianceChips = product.appliances
    .map(a => `<div class="appliance-chip">${a.icon} ${a.name}</div>`)
    .join('');

  card.innerHTML = `
    <div class="gloss" aria-hidden="true"></div>
    <div class="product-badge ${product.badge.class}">${product.badge.text}</div>

    <div class="product-img-wrap">
      <img
        src="${product.image}"
        alt="${product.name} — Power Tech Voltage Stabilizer"
        loading="lazy"
        onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22230%22 viewBox=%220 0 400 230%22%3E%3Crect width=%22400%22 height=%22230%22 fill=%22%231a1f2b%22/%3E%3Ctext x=%22200%22 y=%22100%22 text-anchor=%22middle%22 font-size=%2264%22%3E%E2%9A%A1%3C/text%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23f5b642%22%3E${encodeURIComponent(product.name)}%3C/text%3E%3C/svg%3E'"
      />
      <div class="product-img-overlay" aria-hidden="true"></div>
    </div>

    <div class="product-body">
      <div class="product-model">${product.model}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-voltage">⚡ ${product.voltageRange} &nbsp;|&nbsp; ${product.capacityVA}</div>
      <p class="product-desc">${product.description}</p>
      <div class="product-appliances" aria-label="Supported Appliances">${applianceChips}</div>
      <div class="product-footer">
        <div class="product-price">
          <span class="price-label">MRP</span>
          <span class="price-value"><span>₹</span>${priceFormatted}</span>
        </div>
        <div class="product-actions">
          <button
            class="btn btn-outline btn-sm"
            onclick="addToCart(PRODUCTS.find(p => p.id === '${product.id}'))"
            aria-label="Add ${product.name} to cart"
          >
            🛒 Cart
          </button>
          <button
            class="btn btn-gold-pulse btn-sm"
            onclick="buyNow(PRODUCTS.find(p => p.id === '${product.id}'))"
            aria-label="Buy ${product.name} now"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>`;

  // Attach 3D tilt effect
  attach3DTilt(card);

  return card;
}

// ─── 3D Tilt Effect ───────────────────────────────────────────────────────────

/**
 * Attaches a mouse-movement-driven 3D tilt effect to a card.
 * The card lifts and tilts based on where the mouse is within it.
 * @param {HTMLElement} card
 */
function attach3DTilt(card) {
  const MAX_TILT    = 10; // degrees
  const MAX_LIFT    = 16; // px
  let   animFrameId = null;

  card.addEventListener('mousemove', (e) => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(() => {
      const rect    = card.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;

      // Normalized position: -1 to 1
      const normX = (e.clientX - centerX) / (rect.width  / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      // Tilt: invert Y axis (mouse top → tilt forward)
      const tiltX = -normY * MAX_TILT;
      const tiltY =  normX * MAX_TILT;

      // Shadow offset based on tilt
      const shadowX = normX * 12;
      const shadowY = normY * 12;

      card.style.transform  = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${MAX_LIFT}px)`;
      card.style.boxShadow  = `
        ${shadowX}px ${shadowY + 20}px 50px rgba(0,0,0,0.5),
        0 0 30px rgba(245,182,66,0.2)
      `;
    });
  });

  card.addEventListener('mouseleave', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    // Smoothly reset
    card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease, border-color 0.3s, opacity 0.5s';
    card.style.transform  = '';
    card.style.boxShadow  = '';
    // Re-enable tilt transition override after reset
    setTimeout(() => {
      card.style.transition = '';
    }, 500);
  });
}

// ─── Buy Now ─────────────────────────────────────────────────────────────────

/**
 * Adds the product to cart and immediately opens checkout.
 * Auth-gated.
 * @param {Object} product
 */
function buyNow(product) {
  if (!isLoggedIn()) {
    openAuthModal();
    showToast('info', '🔐 Login Required', 'Please sign in to purchase.');
    return;
  }

  // Add to cart (will show toast), then open checkout
  const cart = getCart();
  const idx  = cart.findIndex(item => item.id === product.id);

  if (idx === -1) {
    // Add silently (suppress toast for Buy Now)
    const updatedCart = [...cart, {
      id: product.id, model: product.model, name: product.name,
      price: product.price, image: product.image, quantity: 1,
    }];
    localStorage.setItem('pt_cart', JSON.stringify(updatedCart));
    syncCartBadge();
  }

  openCheckout();
}

// ─── Toast System ─────────────────────────────────────────────────────────────

/**
 * Shows a toast notification that auto-dismisses after 3.5 seconds.
 * @param {'success'|'error'|'info'} type
 * @param {string} title
 * @param {string} message
 */
function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = { success: '✅', error: '❌', info: 'ℹ️' };
  const icon    = iconMap[type] || 'ℹ️';

  const toast   = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)" aria-label="Dismiss">✕</button>`;

  container.appendChild(toast);

  // Trigger slide-in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  });

  // Auto dismiss after 3.5 seconds
  setTimeout(() => dismissToast(toast), 3500);
}

/**
 * Dismisses a toast with a slide-out animation and removes it from DOM.
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.remove('show');
  toast.classList.add('hide');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}
