/**
 * admin.js — Admin Panel logic for Power Tech
 *
 * API Endpoints (all require x-admin-key header):
 *   GET /api/admin/orders              → all orders with user info
 *   PUT /api/admin/order/:id/status    → update order status
 *
 * ✅ SCREENSHOT FIX: Screenshot column renders <img> thumbnail.
 *    Clicking the thumbnail opens the lightbox (full-size view).
 */

// ─── Admin State ──────────────────────────────────────────────────────────────
var adminKey       = null;
var allAdminOrders = [];
var filteredOrders = [];

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

  tbody.innerHTML = orders.map(function(order) { return buildAdminRow(order); }).join('');
}

/**
 * Builds a single <tr> HTML string for an order.
 * ✅ Screenshot column: shows <img> thumbnail; click opens lightbox.
 * @param {Object} order
 * @returns {string}
 */
function buildAdminRow(order) {
  var shortId  = order.id.substring(0, 8).toUpperCase();
  var items    = Array.isArray(order.items) ? order.items : (JSON.parse(order.items || '[]') || []);
  var dateStr  = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // Items column
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

  // ✅ SCREENSHOT COLUMN — renders <img> with onclick lightbox
  var screenshotHTML;
  if (order.payment_screenshot && order.payment_screenshot.length > 10) {
    // We store as Base64 data URL; pass it safely via a data attribute
    screenshotHTML =
      '<img' +
        ' class="admin-screenshot"' +
        ' src="' + escapeHtmlAttr(order.payment_screenshot.substring(0, 500)) + '"' +
        ' alt="UPI Payment Screenshot"' +
        ' loading="lazy"' +
        ' onclick="adminOpenScreenshot(this.getAttribute(\'data-full\'))"' +
        ' data-full="' + escapeHtmlAttr(order.payment_screenshot.substring(0, 800)) + '"' +
        ' title="Click to view full screenshot"' +
        ' onerror="this.style.display=\'none\'; this.insertAdjacentHTML(\'afterend\',\'<span style=&quot;color:var(--accent-red);font-size:0.75rem;&quot;>Cannot load image</span>\')"' +
      ' />';
  } else {
    screenshotHTML = '<span style="color:var(--text-muted);font-size:0.75rem;">N/A</span>';
  }

  // Status badge class
  var statusClass = {
    Processing: 'status-processing',
    Shipped:    'status-shipped',
    Delivered:  'status-delivered',
    Cancelled:  'status-cancelled',
  }[order.order_status] || 'status-processing';

  return (
    '<tr id="row-' + order.id + '">' +
      '<td style="font-weight:600;color:var(--accent-gold);">' +
        '#' + shortId + '<br/>' +
        '<span style="font-size:0.7rem;color:var(--text-muted);">' + dateStr + '</span>' +
      '</td>' +
      '<td>' + escapeHtml(order.customer_name || (order.users && order.users.name) || '—') + '</td>' +
      '<td>' + escapeHtml(order.customer_phone || (order.users && order.users.phone) || '—') + '</td>' +
      '<td style="max-width:180px;font-size:0.8rem;line-height:1.4;">' +
        escapeHtml(order.customer_address) + ', ' +
        escapeHtml(order.customer_city) + ' — ' +
        escapeHtml(order.customer_pincode) +
      '</td>' +
      '<td class="items-cell">' + itemsHTML + '</td>' +
      '<td style="font-weight:700;color:var(--accent-gold);">₹' + parseFloat(order.total_amount).toLocaleString('en-IN') + '</td>' +
      '<td>' +
        '<span class="status-badge ' + statusClass + '" style="display:inline-flex;">' +
          (order.payment_method === 'COD' ? '💵' : '📲') + ' ' + escapeHtml(order.payment_method) +
        '</span>' +
      '</td>' +
      '<td>' + screenshotHTML + '</td>' +
      '<td>' +
        '<select id="status-' + order.id + '" class="filter-select" style="min-width:130px;">' +
          CONFIG.ORDER_STATUSES.map(function(s) {
            return '<option value="' + s + '"' + (s === order.order_status ? ' selected' : '') + '>' + s + '</option>';
          }).join('') +
        '</select>' +
      '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button' +
          ' class="btn btn-gold btn-sm"' +
          ' id="save-btn-' + order.id + '"' +
          ' onclick="updateOrderStatus(\'' + order.id + '\')"' +
        '>Save</button>' +
      '</td>' +
    '</tr>'
  );
}

// ─── Screenshot Lightbox (Admin) ──────────────────────────────────────────────

/**
 * Opens the admin screenshot in the shared lightbox.
 * @param {string} src — Base64 data URL or image URL
 */
function adminOpenScreenshot(src) {
  if (!src || src.length < 10) {
    showToast('error', '❌ No Image', 'Could not load the screenshot.');
    return;
  }

  var lb    = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');

  if (!lb || !lbImg) {
    // Fallback: open in new tab
    var win = window.open();
    if (win) {
      win.document.write('<img src="' + escapeHtmlAttr(src) + '" style="max-width:100%;height:auto;" />');
    }
    return;
  }

  lbImg.src = src;
  lb.classList.add('open');
}

function closeLightbox() {
  var lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
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
