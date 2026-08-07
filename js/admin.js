/**
 * admin.js — Admin Panel logic for Power Tech
 *
 * API Endpoints (all require x-admin-key header):
 *   GET /api/admin/orders              → all orders with user info
 *   PUT /api/admin/order/:id/status    → update order status
 *
 * ✅ SCREENSHOT FIX (v2):
 *    - Full Base64 stored in screenshotMap (no attribute truncation).
 *    - Clicking thumbnail calls openAdminLightbox(orderId).
 *    - Self-contained lightbox overlay — no shared HTML element needed.
 *    - N/A shown in grey when screenshot is absent.
 */

// ─── Admin State ──────────────────────────────────────────────────────────────
var adminKey        = null;
var allAdminOrders  = [];
var filteredOrders  = [];

/**
 * screenshotMap — stores the FULL Base64 data URL for each order.
 * Key  : order.id (string)
 * Value: order.payment_screenshot (string) — full, never truncated
 *
 * We use a JS object instead of HTML attributes to avoid corrupting
 * Base64 strings with HTML-entity escaping or length limits.
 */
var screenshotMap = {};

// ─── Login ────────────────────────────────────────────────────────────────────

async function adminLogin(event) {
  event.preventDefault();

  var keyInput = document.getElementById('admin-key-input');
  var errEl    = document.getElementById('admin-login-error');
  var keyErr   = document.getElementById('admin-key-err');
  var btn      = document.getElementById('admin-login-btn');

  // Reset errors
  errEl.textContent = '';
  errEl.classList.remove('visible');
  keyErr.textContent = '';
  keyErr.classList.remove('visible');
  keyInput.classList.remove('error');

  var key = keyInput.value.trim();

  if (!key) {
    keyInput.classList.add('error');
    keyErr.textContent = 'Admin key is required.';
    keyErr.classList.add('visible');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Verifying…';

  try {
    var res = await fetch(CONFIG.BACKEND_URL + '/api/admin/orders', {
      headers: {
        'x-admin-key':  key,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      errEl.textContent = '❌ Invalid admin key. Access denied.';
      errEl.classList.add('visible');
      keyInput.classList.add('error');
      return;
    }

    if (!res.ok) {
      throw new Error('Server error: ' + res.status);
    }

    var data = await res.json();
    adminKey = key;

    document.getElementById('admin-login-page').style.display = 'none';
    document.getElementById('admin-panel-page').style.display = 'block';

    allAdminOrders = data.orders || [];
    filteredOrders = allAdminOrders.slice();
    renderAdminOrders(filteredOrders);
    computeAdminStats(allAdminOrders);

    showToast('success', '✅ Welcome, Admin', 'You are now signed in to the admin panel.');

  } catch (err) {
    console.error('[Admin] Login error:', err);
    errEl.textContent = 'Network error. Please check your connection.';
    errEl.classList.add('visible');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Access Admin Panel →';
  }
}

function adminLogout() {
  adminKey = null;
  document.getElementById('admin-login-page').style.display = 'flex';
  document.getElementById('admin-panel-page').style.display = 'none';
  document.getElementById('admin-key-input').value = '';
}

// ─── Fetch Orders ─────────────────────────────────────────────────────────────

async function fetchAdminOrders() {
  var tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="10"><div class="table-loading">' +
      '<div class="spinner" style="width:28px;height:28px;border-width:2px;"></div>' +
      'Refreshing orders…' +
    '</div></td></tr>';

  try {
    var res = await fetch(CONFIG.BACKEND_URL + '/api/admin/orders', {
      headers: {
        'x-admin-key':  adminKey,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      showToast('error', '❌ Unauthorised', 'Admin key may have expired. Please log in again.');
      adminLogout();
      return;
    }

    if (!res.ok) throw new Error('Server error: ' + res.status);

    var data = await res.json();
    allAdminOrders = data.orders || [];
    applyAdminFilter();
    computeAdminStats(allAdminOrders);
    showToast('success', '↻ Refreshed', allAdminOrders.length + ' orders loaded.');

  } catch (err) {
    console.error('[Admin] Fetch orders error:', err);
    tbody.innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--accent-red);">' +
        '⚠️ Failed to load orders. ' +
        '<button class="expand-btn" onclick="fetchAdminOrders()">Retry</button>' +
      '</td></tr>';
  }
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function applyAdminFilter() {
  var statusFilter  = (document.getElementById('filter-status')  || {}).value || '';
  var paymentFilter = (document.getElementById('filter-payment') || {}).value || '';

  filteredOrders = allAdminOrders.filter(function(order) {
    var matchStatus  = !statusFilter  || order.order_status   === statusFilter;
    var matchPayment = !paymentFilter || order.payment_method === paymentFilter;
    return matchStatus && matchPayment;
  });

  renderAdminOrders(filteredOrders);
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderAdminOrders(orders) {
  var tbody   = document.getElementById('admin-orders-body');
  var countEl = document.getElementById('admin-order-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = orders.length + ' order' + (orders.length !== 1 ? 's' : '');

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">' +
        'No orders match the current filter.' +
      '</td></tr>';
    return;
  }

  // Build all rows (thumbnail <img> elements start with src="")
  tbody.innerHTML = orders.map(function(order) { return buildAdminRow(order); }).join('');

  // ✅ Wire screenshots: set .src from screenshotMap AFTER innerHTML is written.
  // This is the key fix — img.src is set via JS property, not HTML attribute,
  // so the full Base64 string is never escaped or truncated.
  wireScreenshots();
}

/**
 * Builds a single <tr> HTML string for an order.
 *
 * ✅ SCREENSHOT FIX:
 *   1. Full Base64 string is stored in screenshotMap[order.id] — never
 *      truncated or HTML-escaped into an attribute (which corrupts it).
 *   2. The thumbnail <img> uses the full src directly (browsers handle
 *      large data URLs fine in src; it's attributes that get corrupted).
 *   3. onclick calls openAdminLightbox(orderId) — no inline data passing.
 *   4. N/A shown in grey when payment_screenshot is absent/empty.
 *
 * @param {Object} order
 * @returns {string}
 */
function buildAdminRow(order) {
  var shortId  = order.id.substring(0, 8).toUpperCase();
  var safeId   = order.id;   // full UUID, used as key in screenshotMap
  var items    = Array.isArray(order.items) ? order.items : (JSON.parse(order.items || '[]') || []);
  var dateStr  = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // ── Store full screenshot in JS map (never in HTML attributes) ──────────────
  var hasScreenshot = order.payment_screenshot && order.payment_screenshot.length > 10;
  if (hasScreenshot) {
    screenshotMap[safeId] = order.payment_screenshot; // full string, unmodified
  } else {
    delete screenshotMap[safeId];
  }

  // ── Items column ────────────────────────────────────────────────────────────
  var firstItem  = items[0];
  var extraItems = items.slice(1);

  var itemsHTML =
    '<div>' + (firstItem ? escapeHtml(firstItem.name) + ' &times;' + firstItem.quantity : '—') + '</div>' +
    (extraItems.length > 0
      ? '<button class="expand-btn" onclick="toggleAdminItems(this)">+' + extraItems.length + ' more</button>' +
        '<div class="collapsible-items">' +
          extraItems.map(function(i) {
            return '<div style="font-size:0.78rem;padding:2px 0;">' + escapeHtml(i.name) + ' &times;' + i.quantity + '</div>';
          }).join('') +
        '</div>'
      : '');

  // ── Screenshot column ────────────────────────────────────────────────────────
  // The thumbnail src is set directly from the full data URL via JS after
  // innerHTML is written (avoids HTML-attribute corruption of Base64).
  // We use a placeholder src and a data-orderid attribute to wire it up.
  var screenshotHTML;
  if (hasScreenshot) {
    screenshotHTML =
      '<img' +
        ' class="admin-screenshot"' +
        ' id="ss-' + safeId + '"' +
        ' src=""' +                          // filled by wireScreenshots()
        ' alt="UPI Payment Screenshot"' +
        ' loading="lazy"' +
        ' data-orderid="' + safeId + '"' +  // safe — just a UUID, no special chars
        ' title="Click to view full screenshot"' +
        ' onclick="openAdminLightbox(this.dataset.orderid)"' +
      '/>';
  } else {
    screenshotHTML = '<span style="color:#6b7280;font-size:0.8rem;font-style:italic;">N/A</span>';
  }

  // ── Status badge class ───────────────────────────────────────────────────────
  var statusClass = {
    Processing: 'status-processing',
    Shipped:    'status-shipped',
    Delivered:  'status-delivered',
    Cancelled:  'status-cancelled',
  }[order.order_status] || 'status-processing';

  return (
    '<tr id="row-' + safeId + '">' +
      '<td style="font-weight:600;color:var(--accent-gold);">' +
        '#' + shortId + '<br/>' +
        '<span style="font-size:0.7rem;color:#6b7280;">' + dateStr + '</span>' +
      '</td>' +
      '<td>' + escapeHtml(order.customer_name || (order.users && order.users.name) || '—') + '</td>' +
      '<td>' + escapeHtml(order.customer_phone || (order.users && order.users.phone) || '—') + '</td>' +
      '<td style="max-width:180px;font-size:0.8rem;line-height:1.4;">' +
        escapeHtml(order.customer_address) + ', ' +
        escapeHtml(order.customer_city) + ' — ' +
        escapeHtml(order.customer_pincode) +
      '</td>' +
      '<td class="items-cell">' + itemsHTML + '</td>' +
      '<td style="font-weight:700;color:var(--accent-gold);">₹' +
        parseFloat(order.total_amount).toLocaleString('en-IN') +
      '</td>' +
      '<td>' +
        '<span class="status-badge ' + statusClass + '" style="display:inline-flex;">' +
          (order.payment_method === 'COD' ? '💵' : '📲') + ' ' + escapeHtml(order.payment_method) +
        '</span>' +
      '</td>' +
      '<td>' + screenshotHTML + '</td>' +
      '<td>' +
        '<select id="status-' + safeId + '" class="filter-select" style="min-width:130px;">' +
          CONFIG.ORDER_STATUSES.map(function(s) {
            return '<option value="' + s + '"' + (s === order.order_status ? ' selected' : '') + '>' + s + '</option>';
          }).join('') +
        '</select>' +
      '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button' +
          ' class="btn btn-gold btn-sm"' +
          ' id="save-btn-' + safeId + '"' +
          ' onclick="updateOrderStatus(\'' + safeId + '\')"' +
        '>Save</button>' +
      '</td>' +
    '</tr>'
  );
}

/**
 * wireScreenshots — called after renderAdminOrders() writes HTML.
 * Sets the .src of every thumbnail <img> directly from screenshotMap
 * (bypasses HTML-attribute encoding entirely).
 */
function wireScreenshots() {
  Object.keys(screenshotMap).forEach(function(orderId) {
    var img = document.getElementById('ss-' + orderId);
    if (img && !img.src) {
      img.src = screenshotMap[orderId]; // full Base64, set via JS property
    }
  });
}

// ─── Admin Lightbox (self-contained) ─────────────────────────────────────────

/**
 * openAdminLightbox — opens a full-screen overlay showing the payment
 * screenshot for the given orderId.
 *
 * Design:
 *  - Self-contained: creates its own overlay DOM element every time
 *    (no dependency on a shared #lightbox element in the HTML).
 *  - Source comes from screenshotMap[orderId] — the full, untruncated
 *    Base64 string stored when the row was built.
 *  - Click anywhere on the overlay (or press Escape) to close.
 *
 * @param {string} orderId — the UUID of the order
 */
function openAdminLightbox(orderId) {
  var src = screenshotMap[orderId];

  if (!src || src.length < 10) {
    showToast('error', '❌ No Image', 'Screenshot not available for this order.');
    return;
  }

  // Remove any existing admin lightbox first
  closeAdminLightbox();

  // ── Build overlay ────────────────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'admin-lightbox-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:9999',
    'background:rgba(0,0,0,0.92)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:20px',
    'cursor:zoom-out',
    'animation:adminLbFadeIn 0.2s ease both',
  ].join(';');

  // ── Close button ─────────────────────────────────────────────────────────────
  var closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.title = 'Close (Esc)';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:18px',
    'right:20px',
    'width:42px',
    'height:42px',
    'border-radius:50%',
    'background:rgba(255,255,255,0.12)',
    'border:1px solid rgba(255,255,255,0.25)',
    'color:#fff',
    'font-size:1.2rem',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'transition:background 0.15s',
    'z-index:2',
  ].join(';');
  closeBtn.addEventListener('mouseenter', function() {
    this.style.background = 'rgba(255,255,255,0.25)';
  });
  closeBtn.addEventListener('mouseleave', function() {
    this.style.background = 'rgba(255,255,255,0.12)';
  });
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeAdminLightbox();
  });

  // ── Image ────────────────────────────────────────────────────────────────────
  var img = document.createElement('img');
  img.alt    = 'Payment Screenshot — Order #' + orderId.substring(0, 8).toUpperCase();
  img.style.cssText = [
    'max-width:90vw',
    'max-height:88vh',
    'border-radius:12px',
    'box-shadow:0 20px 60px rgba(0,0,0,0.7)',
    'object-fit:contain',
    'cursor:default',
    'animation:adminLbScaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
  ].join(';');

  // Label (order ID)
  var label = document.createElement('div');
  label.textContent = 'Order #' + orderId.substring(0, 8).toUpperCase() + ' — Payment Screenshot';
  label.style.cssText = [
    'position:absolute',
    'bottom:18px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:rgba(0,0,0,0.6)',
    'color:#d1d5db',
    'font-size:0.8rem',
    'padding:6px 16px',
    'border-radius:999px',
    'white-space:nowrap',
    'pointer-events:none',
  ].join(';');

  // Error fallback
  img.onerror = function() {
    img.style.display = 'none';
    var errMsg = document.createElement('div');
    errMsg.textContent = '⚠️ Could not display the screenshot.';
    errMsg.style.cssText = 'color:#ef4444;font-size:1rem;text-align:center;';
    overlay.appendChild(errMsg);
  };

  // Click on overlay background → close; click on image → do nothing
  overlay.addEventListener('click', function() { closeAdminLightbox(); });
  img.addEventListener('click', function(e) { e.stopPropagation(); });

  // ── Inject keyframe CSS once ─────────────────────────────────────────────────
  if (!document.getElementById('admin-lb-styles')) {
    var style = document.createElement('style');
    style.id = 'admin-lb-styles';
    style.textContent =
      '@keyframes adminLbFadeIn  { from { opacity:0; } to { opacity:1; } }' +
      '@keyframes adminLbScaleIn { from { transform:scale(0.88); opacity:0; } to { transform:scale(1); opacity:1; } }';
    document.head.appendChild(style);
  }

  // ── Assemble & show ──────────────────────────────────────────────────────────
  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  overlay.appendChild(label);
  document.body.appendChild(overlay);

  // Set src AFTER appending to DOM (avoids flash of broken image in some browsers)
  img.src = src;

  // Lock body scroll
  document.body.style.overflow = 'hidden';
}

/** Removes the admin lightbox overlay and restores body scroll. */
function closeAdminLightbox() {
  var overlay = document.getElementById('admin-lightbox-overlay');
  if (overlay) {
    overlay.remove();
    document.body.style.overflow = '';
  }
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAdminLightbox();
});

// ─── Update Order Status ──────────────────────────────────────────────────────

async function updateOrderStatus(orderId) {
  var selectEl = document.getElementById('status-' + orderId);
  var saveBtn  = document.getElementById('save-btn-' + orderId);
  if (!selectEl || !saveBtn) return;

  var newStatus = selectEl.value;
  saveBtn.disabled    = true;
  saveBtn.textContent = '…';

  try {
    var res = await fetch(CONFIG.BACKEND_URL + '/api/admin/order/' + orderId + '/status', {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key':  adminKey,
      },
      body: JSON.stringify({ order_status: newStatus }),
    });

    if (!res.ok) {
      var data = await res.json();
      showToast('error', '❌ Update Failed', data.error || 'Could not update status.');
      return;
    }

    // Update local cache
    var idx = allAdminOrders.findIndex(function(o) { return o.id === orderId; });
    if (idx !== -1) allAdminOrders[idx].order_status = newStatus;

    showToast('success', '✅ Status Updated', 'Order #' + orderId.substring(0, 8).toUpperCase() + ' → ' + newStatus);
    applyAdminFilter();
    computeAdminStats(allAdminOrders);

  } catch (err) {
    console.error('[Admin] Update status error:', err);
    showToast('error', '❌ Network Error', 'Could not reach server.');
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save';
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeAdminStats(orders) {
  var counts  = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
  var revenue = 0;

  orders.forEach(function(o) {
    if (counts[o.order_status] !== undefined) counts[o.order_status]++;
    revenue += parseFloat(o.total_amount) || 0;
  });

  function setEl(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  setEl('stat-total',      orders.length);
  setEl('stat-processing', counts.Processing);
  setEl('stat-shipped',    counts.Shipped);
  setEl('stat-delivered',  counts.Delivered);
  setEl('stat-revenue',    '₹' + revenue.toLocaleString('en-IN'));
}

// ─── Collapsible Items ────────────────────────────────────────────────────────

function toggleAdminItems(btn) {
  var collapsible = btn ? btn.nextElementSibling : null;
  if (!collapsible) return;
  var isExpanded = collapsible.classList.contains('expanded');
  collapsible.classList.toggle('expanded', !isExpanded);
  btn.textContent = isExpanded ? ('+' + btn.getAttribute('data-count') + ' more') : 'Show less';
}

// ─── Toast (standalone for admin) ────────────────────────────────────────────

function showToast(type, title, message) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var iconMap = { success: '✅', error: '❌', info: 'ℹ️' };
  var icon    = iconMap[type] || 'ℹ️';

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;

  toast.innerHTML =
    '<span class="toast-icon">' + icon + '</span>' +
    '<div class="toast-content">' +
      '<div class="toast-title">' + escapeHtml(title) + '</div>' +
      (message ? '<div class="toast-msg">' + escapeHtml(message) + '</div>' : '') +
    '</div>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';

  container.appendChild(toast);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });
  });

  setTimeout(function() {
    toast.classList.add('hide');
    setTimeout(function() { if (toast.parentElement) toast.remove(); }, 500);
  }, 3500);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Escapes HTML for safe text insertion */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapes HTML for use in attribute values (especially data-* with Base64) */
function escapeHtmlAttr(str) {
  if (str == null) return '';
  // For Base64 data URLs we only need to escape double-quotes
  return String(str).replace(/"/g, '&quot;');
}
