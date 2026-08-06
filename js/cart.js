/**
 * cart.js — Shopping Cart logic for Power Tech
 * Uses localStorage as the persistent store.
 * Cart structure: Array of { id, model, name, price, image, quantity }
 */

// ─── Internal Cart State ──────────────────────────────────────────────────────
// The cart is an array stored in localStorage under key 'pt_cart'.
const CART_KEY = 'pt_cart';

/** Reads cart from localStorage. Returns array (empty array if none). */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/** Writes cart array to localStorage. */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCartBadge();   // always keep badge in sync
  renderCartItems(); // re-render drawer items
}

// ─── Cart Operations ──────────────────────────────────────────────────────────

/**
 * Adds a product to the cart, or increments its quantity if already present.
 * Auth-gated: opens auth modal if user is not logged in.
 * @param {Object} product — must match PRODUCTS array shape
 */
function addToCart(product) {
  // AUTH GATE: require login before adding to cart
  if (!isLoggedIn()) {
    openAuthModal();
    showToast('info', '🔐 Login Required', 'Please sign in to add items to your cart.');
    return;
  }

  const cart = getCart();
  const idx  = cart.findIndex(item => item.id === product.id);

  if (idx !== -1) {
    // Already in cart — increment quantity
    cart[idx].quantity += 1;
    showToast('success', '✅ Cart Updated', `${product.name} quantity increased.`);
  } else {
    // New item
    cart.push({
      id:       product.id,
      model:    product.model,
      name:     product.name,
      price:    product.price,
      image:    product.image,
      quantity: 1,
    });
    showToast('success', '🛒 Added to Cart', `${product.name} has been added.`);
  }

  saveCart(cart);

  // Animate badge pop
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.classList.remove('visible');
    void badge.offsetWidth; // force reflow
    badge.classList.add('visible');
  }
}

/**
 * Removes an item from the cart entirely by product id.
 * @param {string} productId
 */
function removeFromCart(productId) {
  const cart    = getCart();
  const updated = cart.filter(item => item.id !== productId);
  saveCart(updated);
  showToast('info', '🗑️ Removed', 'Item removed from cart.');
}

/**
 * Updates the quantity of a cart item.
 * If quantity reaches 0, removes the item.
 * @param {string} productId
 * @param {number} delta — +1 or -1
 */
function updateQty(productId, delta) {
  const cart = getCart();
  const idx  = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;

  cart[idx].quantity += delta;

  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1); // remove if zero
  }

  saveCart(cart);
}

/**
 * Clears the entire cart (called after successful order placement).
 */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  syncCartBadge();
  renderCartItems();
}

/**
 * Returns the total number of items in the cart (sum of quantities).
 */
function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Returns the subtotal price of all items in the cart.
 */
function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ─── Badge Sync ───────────────────────────────────────────────────────────────
/**
 * Updates the cart count badge in the header and bottom nav.
 */
function syncCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cart-badge');

  if (!badge) return;

  badge.textContent = count;

  if (count > 0) {
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ─── Cart Drawer Controls ─────────────────────────────────────────────────────
/** Opens the slide-in cart drawer. */
function openCartDrawer() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartItems(); // ensure fresh render
}

/** Closes the cart drawer. */
function closeCartDrawer() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Cart Render ──────────────────────────────────────────────────────────────
/**
 * Renders all cart items in the cart drawer.
 * Also updates the footer subtotal and the cart page section.
 */
function renderCartItems() {
  const cart        = getCart();
  const listEl      = document.getElementById('cart-items-list');
  const footerEl    = document.getElementById('cart-footer');
  const subtotalEl  = document.getElementById('cart-subtotal-amount');
  const countEl     = document.getElementById('cart-item-count');

  if (!listEl) return;

  // Update count label
  const totalCount = getCartCount();
  if (countEl) countEl.textContent = `(${totalCount} item${totalCount !== 1 ? 's' : ''})`;

  if (cart.length === 0) {
    // Empty state
    listEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <button class="btn btn-gold btn-sm" onclick="closeCartDrawer(); switchTab('home');">
          Browse Products
        </button>
      </div>`;
    if (footerEl) footerEl.style.display = 'none';
  } else {
    // Render items
    listEl.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img
          class="cart-item-img"
          src="${item.image}"
          alt="${item.name}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2270%22 height=%2270%22 viewBox=%220 0 70 70%22><rect width=%2270%22 height=%2270%22 fill=%22%231a1f2b%22/><text y=%2240%22 x=%2235%22 text-anchor=%22middle%22 font-size=%2224%22>⚡</text></svg>'"
        />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-model">${item.model}</div>
          <div class="cart-qty-row">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        <button class="cart-remove" onclick="removeFromCart('${item.id}')" aria-label="Remove ${item.name} from cart">🗑️</button>
      </div>
    `).join('');

    // Show footer with subtotal
    if (footerEl) {
      footerEl.style.display = 'block';
      const total = getCartTotal();
      if (subtotalEl) subtotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
  }

  // Also render the cart section page content
  renderCartPage();
}

/**
 * Renders the full-page cart section (section-cart).
 * This mirrors the drawer content but formatted for the full page view.
 */
function renderCartPage() {
  const pageEl = document.getElementById('cart-page-content');
  if (!pageEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    pageEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started.</p>
        <button class="btn btn-gold" onclick="switchTab('home')">🛍️ Browse Products</button>
      </div>`;
    return;
  }

  const total = getCartTotal();

  pageEl.innerHTML = `
    <div style="max-width:680px; margin:0 auto; padding-bottom:60px;">
      ${cart.map(item => `
        <div class="cart-item" style="margin-bottom:12px;">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2270%22 height=%2270%22 viewBox=%220 0 70 70%22><rect width=%2270%22 height=%2270%22 fill=%22%231a1f2b%22/><text y=%2240%22 x=%2235%22 text-anchor=%22middle%22 font-size=%2224%22>⚡</text></svg>'"/>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-model">${item.model}</div>
            <div class="cart-qty-row">
              <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
          </div>
          <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
          <button class="cart-remove" onclick="removeFromCart('${item.id}')">🗑️</button>
        </div>`).join('')}

      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:24px; margin-top:20px;">
        <div class="cart-subtotal" style="margin-bottom:16px;">
          <span class="label" style="font-size:1rem; color:var(--text-secondary);">Total</span>
          <span class="amount">₹${total.toLocaleString('en-IN')}</span>
        </div>
        <button class="btn btn-gold-pulse w-full" onclick="openCheckout()" style="font-size:1rem; padding:14px;">
          🛍️ Proceed to Checkout
        </button>
      </div>
    </div>`;
}
