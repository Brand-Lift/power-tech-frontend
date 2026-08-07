/**
 * app.js — Main application orchestrator for Power Tech
 *
 * Features:
 *  - DOM ready init, splash screen
 *  - renderMidRange() + renderUpperRange() with stagger + 3D tilt
 *  - Intersection Observer scroll fade-up animations
 *  - Product detail modal (click any card to see full specs)
 *  - Contact Requirement form → WhatsApp redirect
 *  - Tab navigation (Home / Cart / My Orders)
 *  - Toast notification system
 */

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Init auth state from localStorage
  initAuth();

  // 2. Sync cart badge
  syncCartBadge();

  // 3. Render products after short delay (lets splash show)
  setTimeout(() => {
    renderMidRange();
    renderUpperRange();
    // After cards are in DOM, start observing for scroll animations
    initScrollAnimations();
  }, 400);

  // 4. Init payment radio listeners for checkout
  initPaymentListeners();

  // 5. Splash screen — hide after 2.5s
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide');
      splash.addEventListener('animationend', () => splash.remove(), { once: true });
    }
  }, 2500);

  // 6. Start on Home tab
  switchTab('home');
});

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  const target = document.getElementById('section-' + tab);
  if (target) target.classList.add('active');

  // Desktop nav
  ['home', 'cart', 'orders'].forEach(t => {
    const btn = document.getElementById('nav-' + t + '-desk');
    if (btn) btn.classList.toggle('active', t === tab);
  });

  // Mobile nav
  ['home', 'cart', 'orders'].forEach(t => {
    const btn = document.getElementById('nav-' + t + '-mob');
    if (btn) btn.classList.toggle('active', t === tab);
  });

  if (tab === 'orders') { fetchOrders(); }
  if (tab === 'cart')   { renderCartPage(); }
}

// ─── Product Rendering ────────────────────────────────────────────────────────

/** Renders the Mid Range (Category A) product grid. */
function renderMidRange() {
  const midProducts = PRODUCTS.filter(p => p.category === 'mid');
  const grid = document.getElementById('mid-range-grid');
  if (!grid) return;

  grid.innerHTML = '';
  midProducts.forEach((product, index) => {
    const card = buildProductCard(product, index);
    grid.appendChild(card);
  });
}

/** Renders the Upper Range (Category B) product grid. */
function renderUpperRange() {
  const upperProducts = PRODUCTS.filter(p => p.category === 'upper');
  const grid = document.getElementById('upper-range-grid');
  if (!grid) return;

  grid.innerHTML = '';
  upperProducts.forEach((product, index) => {
    const card = buildProductCard(product, index);
    grid.appendChild(card);
  });
}

/**
 * Builds a single product card DOM element.
 * Includes 3D tilt, scroll fade-up class, and click-to-modal.
 * @param {Object} product — from PRODUCTS array
 * @param {number} index   — for stagger delay
 * @returns {HTMLElement}
 */
function buildProductCard(product, index) {
  const card = document.createElement('div');
  card.className   = 'product-card fade-up';
  card.role        = 'listitem';
  card.setAttribute('data-product-id', product.id);
  // Stagger initial hidden state (overridden by fade-up class + IntersectionObserver)
  card.style.transitionDelay = (index * 80) + 'ms';

  const priceFormatted = product.price.toLocaleString('en-IN');

  const applianceChips = product.appliances
    .map(a => '<div class="appliance-chip">' + a.icon + ' ' + a.name + '</div>')
    .join('');

  card.innerHTML =
    '<div class="gloss" aria-hidden="true"></div>' +
    '<div class="product-badge ' + product.badge.class + '">' + product.badge.text + '</div>' +

    '<div class="product-img-wrap">' +
      '<img' +
        ' src="' + product.image + '"' +
        ' alt="' + product.name + ' — Power Tech Voltage Stabilizer"' +
        ' loading="lazy"' +
        ' onerror="this.onerror=null;this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22230%22%3E%3Crect width=%22400%22 height=%22230%22 fill=%22%231a1f2b%22/%3E%3Ctext x=%22200%22 y=%22100%22 text-anchor=%22middle%22 font-size=%2264%22%3E%E2%9A%A1%3C/text%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23f5b642%22%3E' + encodeURIComponent(product.name) + '%3C/text%3E%3C/svg%3E\'"' +
      ' />' +
      '<div class="product-img-overlay" aria-hidden="true"></div>' +
    '</div>' +

    '<div class="product-body">' +
      '<div class="product-model">' + product.model + '</div>' +
      '<div class="product-name">' + product.name + '</div>' +
      '<div class="product-voltage">⚡ IN: ' + product.inputRange + '&nbsp;|&nbsp;OUT: ' + product.outputRange + '</div>' +
      '<p class="product-desc">' + product.description + '</p>' +
      '<div class="product-appliances" aria-label="Supported Appliances">' + applianceChips + '</div>' +
      '<div class="product-footer">' +
        '<div class="product-price">' +
          '<span class="price-label">MRP</span>' +
          '<span class="price-value"><span>₹</span>' + priceFormatted + '</span>' +
        '</div>' +
        '<div class="product-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); addToCart(PRODUCTS.find(function(p){return p.id===\'' + product.id + '\'}))" aria-label="Add to cart">🛒 Cart</button>' +
          '<button class="btn btn-gold-pulse btn-sm" onclick="event.stopPropagation(); buyNow(PRODUCTS.find(function(p){return p.id===\'' + product.id + '\'}))" aria-label="Buy Now">Buy Now</button>' +
        '</div>' +
      '</div>' +
      '<button class="btn-view-details" onclick="event.stopPropagation(); openProductModal(\'' + product.id + '\')" aria-label="View Details">👁 View Details</button>' +
    '</div>';

  // Click anywhere on card → open product modal
  card.addEventListener('click', function() {
    openProductModal(product.id);
  });

  // Attach 3D tilt
  attach3DTilt(card);

  return card;
}

// ─── Scroll Fade-up Animations (Intersection Observer) ───────────────────────

/**
 * Watches all .fade-up elements and adds .visible when they enter the viewport.
 * This triggers the CSS slide-up transition defined in style.css.
 */
function initScrollAnimations() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // only animate once
      }
    });
  }, {
    threshold:  0.1,
    rootMargin: '0px 0px -40px 0px',
  });

  document.querySelectorAll('.fade-up').forEach(function(el) {
    observer.observe(el);
  });
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────

/**
 * Opens the product detail lightbox modal with full specs.
 * @param {string} productId — product id from PRODUCTS array
 */
function openProductModal(productId) {
  var product = PRODUCTS.find(function(p) { return p.id === productId; });
  if (!product) return;

  var modal = document.getElementById('product-modal');
  if (!modal) return;

  // Populate image
  var imgEl = document.getElementById('pm-image');
  if (imgEl) {
    imgEl.src = product.image;
    imgEl.alt = product.name;
    imgEl.onerror = function() {
      this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect width=%22400%22 height=%22250%22 fill=%22%231a1f2b%22/%3E%3Ctext x=%22200%22 y=%22130%22 text-anchor=%22middle%22 font-size=%2264%22%3E%E2%9A%A1%3C/text%3E%3C/svg%3E';
    };
  }

  // Populate model and name
  var pmModelEl = document.getElementById('pm-model');
  var pmNameEl  = document.getElementById('pm-name');
  if (pmModelEl) pmModelEl.textContent = product.model;
  if (pmNameEl)  pmNameEl.textContent  = product.name;

  // Input range
  var pmInputEl = document.getElementById('pm-input');
  if (pmInputEl) pmInputEl.textContent = product.inputRange;

  // Output range
  var pmOutputEl = document.getElementById('pm-output');
  if (pmOutputEl) pmOutputEl.textContent = product.outputRange;

  // Price
  var pmPriceEl = document.getElementById('pm-price');
  if (pmPriceEl) pmPriceEl.textContent = '₹' + product.price.toLocaleString('en-IN');

  // Category label
  var pmCatEl = document.getElementById('pm-category');
  if (pmCatEl) pmCatEl.textContent = product.category === 'mid' ? '⚡ Mid Range' : '🚀 Upper Range';

  // Appliances
  var pmAppliancesEl = document.getElementById('pm-appliances');
  if (pmAppliancesEl) {
    pmAppliancesEl.innerHTML = product.appliances
      .map(function(a) { return '<div class="appliance-chip">' + a.icon + ' ' + a.name + '</div>'; })
      .join('');
  }

  // Description
  var pmDescEl = document.getElementById('pm-desc');
  if (pmDescEl) pmDescEl.textContent = product.description;

  // Buttons — store product id on modal for cart/buy actions
  var pmAddBtn = document.getElementById('pm-add-cart-btn');
  var pmBuyBtn = document.getElementById('pm-buy-btn');
  if (pmAddBtn) pmAddBtn.setAttribute('data-pid', product.id);
  if (pmBuyBtn) pmBuyBtn.setAttribute('data-pid', product.id);

  // Show modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/** Closes the product detail modal. */
function closeProductModal() {
  var modal = document.getElementById('product-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/** Called from product modal "Add to Cart" button. */
function pmAddToCart() {
  var btn     = document.getElementById('pm-add-cart-btn');
  var pid     = btn ? btn.getAttribute('data-pid') : null;
  var product = pid ? PRODUCTS.find(function(p) { return p.id === pid; }) : null;
  if (!product) return;
  closeProductModal();
  addToCart(product);
}

/** Called from product modal "Buy Now" button. */
function pmBuyNow() {
  var btn     = document.getElementById('pm-buy-btn');
  var pid     = btn ? btn.getAttribute('data-pid') : null;
  var product = pid ? PRODUCTS.find(function(p) { return p.id === pid; }) : null;
  if (!product) return;
  closeProductModal();
  buyNow(product);
}

// ─── Contact Requirement Form ─────────────────────────────────────────────────

/**
 * Handles the "According to Your Requirement" form submission.
 * Builds a WhatsApp message and opens wa.me in a new tab.
 * @param {Event} event — form submit
 */
function submitRequirement(event) {
  event.preventDefault();

  var name    = (document.getElementById('req-name')    || {}).value || '';
  var email   = (document.getElementById('req-email')   || {}).value || '';
  var phone   = (document.getElementById('req-phone')   || {}).value || '';
  var purpose = (document.getElementById('req-purpose') || {}).value || '';
  var message = (document.getElementById('req-message') || {}).value || '';

  // Basic validation
  if (!name.trim() || !phone.trim() || !message.trim()) {
    showToast('error', '❌ Missing Fields', 'Please fill in Name, Phone, and Message.');
    return;
  }

  if (!/^\d{10}$/.test(phone.trim())) {
    showToast('error', '❌ Invalid Phone', 'Please enter a valid 10-digit phone number.');
    return;
  }

  var waMessage = [
    '📋 *New Requirement — Power Tech*',
    '',
    '👤 *Name:* ' + name.trim(),
    '📧 *Email:* ' + (email.trim() || 'Not provided'),
    '📱 *Phone:* ' + phone.trim(),
    '🎯 *Purpose:* ' + purpose,
    '',
    '💬 *Message:*',
    message.trim(),
    '',
    '─────────────────────',
    'Sent via PowerTech website ⚡',
  ].join('\n');

  var waUrl = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(waMessage);
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  showToast('success', '✅ Redirecting to WhatsApp', 'Your message is ready to send!');

  // Reset form
  document.getElementById('requirement-form').reset();
}

// ─── 3D Tilt Effect ───────────────────────────────────────────────────────────

/**
 * Attaches a mouse-driven 3D tilt effect to a card element.
 * @param {HTMLElement} card
 */
function attach3DTilt(card) {
  var MAX_TILT = 10;
  var MAX_LIFT = 16;
  var rafId    = null;

  card.addEventListener('mousemove', function(e) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function() {
      var rect    = card.getBoundingClientRect();
      var centerX = rect.left + rect.width  / 2;
      var centerY = rect.top  + rect.height / 2;
      var normX   = (e.clientX - centerX) / (rect.width  / 2);
      var normY   = (e.clientY - centerY) / (rect.height / 2);
      var tiltX   = -normY * MAX_TILT;
      var tiltY   =  normX * MAX_TILT;
      var shadowX =  normX * 12;
      var shadowY =  normY * 12;

      card.style.transform = 'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateZ(' + MAX_LIFT + 'px)';
      card.style.boxShadow = shadowX + 'px ' + (shadowY + 20) + 'px 50px rgba(0,0,0,0.5), 0 0 30px rgba(245,182,66,0.2)';
    });
  });

  card.addEventListener('mouseleave', function() {
    if (rafId) cancelAnimationFrame(rafId);
    card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease, border-color 0.3s';
    card.style.transform  = '';
    card.style.boxShadow  = '';
    setTimeout(function() { card.style.transition = ''; }, 500);
  });
}

// ─── Buy Now ──────────────────────────────────────────────────────────────────

function buyNow(product) {
  if (!isLoggedIn()) {
    openAuthModal();
    showToast('info', '🔐 Login Required', 'Please sign in to purchase.');
    return;
  }

  var cart = getCart();
  var idx  = cart.findIndex(function(item) { return item.id === product.id; });

  if (idx === -1) {
    var updated = cart.concat([{
      id: product.id, model: product.model, name: product.name,
      price: product.price, image: product.image, quantity: 1,
    }]);
    localStorage.setItem('pt_cart', JSON.stringify(updated));
    syncCartBadge();
  }

  openCheckout();
}

// ─── Toast System ─────────────────────────────────────────────────────────────

function showToast(type, title, message) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var iconMap = { success: '✅', error: '❌', info: 'ℹ️' };
  var icon    = iconMap[type] || 'ℹ️';

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.setAttribute('role', 'alert');
  toast.innerHTML =
    '<span class="toast-icon">' + icon + '</span>' +
    '<div class="toast-content">' +
      '<div class="toast-title">' + title + '</div>' +
      (message ? '<div class="toast-msg">' + message + '</div>' : '') +
    '</div>' +
    '<button class="toast-close" onclick="dismissToast(this.parentElement)" aria-label="Dismiss">✕</button>';

  container.appendChild(toast);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });
  });

  setTimeout(function() { dismissToast(toast); }, 3500);
}

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.remove('show');
  toast.classList.add('hide');
  toast.addEventListener('transitionend', function() { toast.remove(); }, { once: true });
}
