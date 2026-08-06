/**
 * orders.js — My Orders section logic for Power Tech
 * Fetches and renders user orders from GET /api/orders (JWT protected).
 * Includes lightbox for screenshot enlargement.
 */

// ─── Fetch & Render Orders ────────────────────────────────────────────────────

/**
 * Fetches orders for the logged-in user and renders them.
 * Shows skeleton loaders while fetching.
 * Called when user switches to the "My Orders" tab.
 */
async function fetchOrders() {
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  // Require login
  if (!isLoggedIn()) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h3>Login Required</h3>
        <p>Please sign in to view your orders.</p>
        <button class="btn btn-gold" onclick="openAuthModal()">Sign In / Sign Up</button>
      </div>`;
    return;
  }

  // Show skeleton loaders
  listEl.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton-card" style="padding:24px; border-radius:var(--radius-xl);">
      <div class="skeleton sk-line short mb-8"></div>
      <div class="skeleton sk-line medium mb-8"></div>
      <div class="skeleton sk-line mb-8"></div>
      <div class="skeleton sk-line short"></div>
    </div>`).join('');

  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401) {
      // Token expired or invalid — log out
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    renderOrders(data.orders || []);
  } catch (err) {
    console.error('[Orders] Fetch error:', err);
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load orders</h3>
        <p>Please check your connection and try again.</p>
        <button class="btn btn-outline" onclick="fetchOrders()">↻ Retry</button>
      </div>`;
  }
}

/**
 * Renders the orders list into #orders-list.
 * @param {Array} orders — array of order objects from the API
 */
function renderOrders(orders) {
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  if (orders.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No orders yet</h3>
        <p>Your placed orders will appear here.</p>
        <button class="btn btn-gold" onclick="switchTab('home')">🛍️ Start Shopping</button>
      </div>`;
    return;
  }

  listEl.innerHTML = orders.map((order, index) => buildOrderCard(order, index)).join('');
}

/**
 * Builds an order card HTML string.
 * @param {Object} order
 * @param {number} index — used for stagger animation delay
 * @returns {string} HTML string
 */
function buildOrderCard(order, index) {
  const shortId     = order.id.substring(0, 8).toUpperCase();
  const dateStr     = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timeStr     = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
  const statusClass = getStatusClass(order.order_status);
  const items       = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const total       = parseFloat(order.total_amount).toLocaleString('en-IN');

  // Screenshot thumbnail (only if UPI and screenshot exists)
  const screenshotHTML = (order.payment_method === 'UPI' && order.payment_screenshot)
    ? `<img
         class="screenshot-thumb"
         src="${order.payment_screenshot}"
         alt="Payment Screenshot"
         loading="lazy"
         onclick="openLightbox('${order.payment_screenshot.replace(/'/g, "\\'")}')"
         title="Click to enlarge"
       />`
    : '';

  // Items list
  const itemsHTML = items.map(item => `
    <div class="order-item">
      <span class="item-name">${item.name}</span>
      <span class="item-qty">× ${item.quantity}</span>
      <span class="item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>`).join('');

  return `
    <div class="order-card" role="listitem" style="animation-delay: ${index * 80}ms;">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order <span>#${shortId}</span></div>
          <div class="order-date">${dateStr} at ${timeStr}</div>
        </div>
        <div class="${statusClass} status-badge">
          ${getStatusEmoji(order.order_status)} ${order.order_status}
        </div>
      </div>
      <div class="order-card-body">
        <div class="order-items">
          ${itemsHTML}
        </div>
        <div class="order-meta">
          <div class="order-meta-chip">
            ${order.payment_method === 'COD' ? '💵' : '📲'} ${order.payment_method}
          </div>
          <div class="order-meta-chip">
            📍 ${order.customer_city}, ${order.customer_pincode}
          </div>
          ${screenshotHTML}
          <span class="order-total-amount">₹${total}</span>
        </div>
      </div>
    </div>`;
}

/** Maps order status to CSS class. */
function getStatusClass(status) {
  const map = {
    Processing: 'status-processing',
    Shipped:    'status-shipped',
    Delivered:  'status-delivered',
    Cancelled:  'status-cancelled',
  };
  return map[status] || 'status-processing';
}

/** Maps order status to an emoji. */
function getStatusEmoji(status) {
  const map = {
    Processing: '🟡',
    Shipped:    '🔵',
    Delivered:  '🟢',
    Cancelled:  '🔴',
  };
  return map[status] || '🟡';
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

/**
 * Opens the lightbox overlay showing the full-size image.
 * @param {string} src — image src (can be Base64 data URL or URL)
 */
function openLightbox(src) {
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  if (!lb || !lbImg) return;

  lbImg.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/** Closes the lightbox overlay. */
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  document.body.style.overflow = '';
  // Clear src after transition to free memory
  setTimeout(() => {
    const lbImg = document.getElementById('lightbox-img');
    if (lbImg) lbImg.src = '';
  }, 300);
}

// Close lightbox with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeCheckout();
    closeAuthModal();
    closeCartDrawer();
  }
});
