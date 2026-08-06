/**
 * admin.js — Admin Panel logic for Power Tech
 * Uses x-admin-key header for all admin API calls.
 *
 * API Endpoints:
 *   GET /api/admin/orders              → all orders with user info
 *   PUT /api/admin/order/:id/status    → update order status
 */

// ─── Admin State ──────────────────────────────────────────────────────────────
let adminKey        = null;          // the admin API key entered on login
let allAdminOrders  = [];            // full list fetched from server
let filteredOrders  = [];            // after filter applied

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Handles the admin login form submission.
 * Validates the key by making a test API call.
 * @param {Event} event
 */
async function adminLogin(event) {
  event.preventDefault();

  const keyInput = document.getElementById('admin-key-input');
  const errEl    = document.getElementById('admin-login-error');
  const btn      = document.getElementById('admin-login-btn');

  // Clear errors
  errEl.textContent = '';
  errEl.classList.remove('visible');
  keyInput.classList.remove('error');

  const key = keyInput.value.trim();

  if (!key) {
    keyInput.classList.add('error');
    document.getElementById('admin-key-err').textContent = 'Admin key is required.';
    document.getElementById('admin-key-err').classList.add('visible');
    return;
  }

  // Disable button
  btn.disabled    = true;
  btn.textContent = 'Verifying…';

  try {
    // Test the key by fetching orders
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/admin/orders`, {
      headers: {
        'x-admin-key': key,
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
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Key valid — switch to panel
    adminKey = key;
    document.getElementById('admin-login-page').style.display = 'none';
    document.getElementById('admin-panel-page').style.display = 'block';

    // Render orders from response (avoid double fetch)
    allAdminOrders = data.orders || [];
    filteredOrders = [...allAdminOrders];
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

/** Logs out of the admin panel. */
function adminLogout() {
  adminKey = null;
  document.getElementById('admin-login-page').style.display = 'flex';
  document.getElementById('admin-panel-page').style.display = 'none';
  document.getElementById('admin-key-input').value = '';
}

// ─── Fetch Orders ─────────────────────────────────────────────────────────────

/**
 * Fetches all orders (admin endpoint) and re-renders.
 * Keeps the current filter applied after refresh.
 */
async function fetchAdminOrders() {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  // Show loading row
  tbody.innerHTML = `<tr><td colspan="10"><div class="table-loading">
    <div class="spinner" style="width:28px;height:28px;border-width:2px;"></div>
    Refreshing orders…
  </div></td></tr>`;

  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/admin/orders`, {
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

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    allAdminOrders = data.orders || [];

    // Re-apply current filter
    applyAdminFilter();
    computeAdminStats(allAdminOrders);

    showToast('success', '↻ Refreshed', `${allAdminOrders.length} orders loaded.`);

  } catch (err) {
    console.error('[Admin] Fetch orders error:', err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:40px; color:var(--accent-red);">
      ⚠️ Failed to load orders. <button class="expand-btn" onclick="fetchAdminOrders()">Retry</button>
    </td></tr>`;
  }
}

// ─── Filter ───────────────────────────────────────────────────────────────────

/** Applies the current filter selections and re-renders. */
function applyAdminFilter() {
  const statusFilter  = document.getElementById('filter-status')?.value  || '';
  const paymentFilter = document.getElementById('filter-payment')?.value || '';

  filteredOrders = allAdminOrders.filter(order => {
    const matchStatus  = !statusFilter  || order.order_status    === statusFilter;
    const matchPayment = !paymentFilter || order.payment_method  === paymentFilter;
    return matchStatus && matchPayment;
  });

  renderAdminOrders(filteredOrders);
}

// ─── Render ───────────────────────────────────────────────────────────────────

/**
 * Renders the orders array into the admin table.
 * @param {Array} orders
 */
function renderAdminOrders(orders) {
  const tbody     = document.getElementById('admin-orders-body');
  const countEl   = document.getElementById('admin-order-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:40px; color:var(--text-muted);">
      No orders match the current filter.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => buildAdminRow(order)).join('');
}

/**
 * Builds a single table row HTML string for an order.
 * @param {Object} order
 * @returns {string}
 */
function buildAdminRow(order) {
  const shortId  = order.id.substring(0, 8).toUpperCase();
  const items    = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const dateStr  = new Date(order.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

  // Items summary (first item shown, rest in collapsible)
  const firstItem  = items[0];
  const extraItems = items.slice(1);

  const itemsHTML = `
    <div>${firstItem ? `${firstItem.name} ×${firstItem.quantity}` : '—'}</div>
    ${extraItems.length > 0 ? `
      <button class="expand-btn" onclick="toggleItems(this)">+${extraItems.length} more</button>
      <div class="collapsible-items">
        ${extraItems.map(i => `<div style="font-size:0.78rem; padding:2px 0;">${i.name} ×${i.quantity}</div>`).join('')}
      </div>` : ''}`;

  // Screenshot
  const screenshotHTML = order.payment_screenshot
    ? `<img
         class="admin-screenshot"
         src="${order.payment_screenshot}"
         alt="Payment Screenshot"
         loading="lazy"
         onclick="openLightbox('${order.payment_screenshot.substring(0,100)}')"
         title="Click to view full size"
       />`
    : `<span style="color:var(--text-muted); font-size:0.75rem;">—</span>`;

  // Status badge
  const statusClass = {
    Processing: 'status-processing',
    Shipped:    'status-shipped',
    Delivered:  'status-delivered',
    Cancelled:  'status-cancelled',
  }[order.order_status] || 'status-processing';

  return `
    <tr id="row-${order.id}">
      <td style="font-weight:600; color:var(--accent-gold);">#${shortId}<br/>
          <span style="font-size:0.7rem; color:var(--text-muted);">${dateStr}</span>
      </td>
      <td>${escapeHtml(order.customer_name || order.users?.name || '—')}</td>
      <td>${escapeHtml(order.customer_phone || order.users?.phone || '—')}</td>
      <td style="max-width:180px; font-size:0.8rem; line-height:1.4;">
        ${escapeHtml(order.customer_address)}, ${escapeHtml(order.customer_city)} — ${escapeHtml(order.customer_pincode)}
      </td>
      <td class="items-cell">${itemsHTML}</td>
      <td style="font-weight:700; color:var(--accent-gold);">₹${parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
      <td>
        <span class="order-meta-chip" style="display:inline-flex;">
          ${order.payment_method === 'COD' ? '💵' : '📲'} ${order.payment_method}
        </span>
      </td>
      <td>${screenshotHTML}</td>
      <td>
        <select id="status-${order.id}" class="filter-select" style="min-width:130px;">
          ${CONFIG.ORDER_STATUSES.map(s =>
            `<option value="${s}" ${s === order.order_status ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td class="save-btn-cell">
        <button
          class="btn btn-gold btn-sm"
          id="save-btn-${order.id}"
          onclick="updateOrderStatus('${order.id}')"
        >
          Save
        </button>
      </td>
    </tr>`;
}

// ─── Update Status ────────────────────────────────────────────────────────────

/**
 * Sends a PUT request to update the order status.
 * @param {string} orderId — full UUID
 */
async function updateOrderStatus(orderId) {
  const selectEl = document.getElementById(`status-${orderId}`);
  const saveBtn  = document.getElementById(`save-btn-${orderId}`);
  if (!selectEl || !saveBtn) return;

  const newStatus = selectEl.value;

  // Disable save button while saving
  saveBtn.disabled    = true;
  saveBtn.textContent = '…';

  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/admin/order/${orderId}/status`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key':  adminKey,
      },
      body: JSON.stringify({ order_status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      showToast('error', '❌ Update Failed', data.error || 'Could not update status.');
      return;
    }

    // Update local data to reflect new status
    const idx = allAdminOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) allAdminOrders[idx].order_status = newStatus;

    showToast('success', '✅ Status Updated', `Order #${orderId.substring(0,8).toUpperCase()} → ${newStatus}`);

    // Re-apply filter (this also re-renders)
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

// ─── Stats Computation ────────────────────────────────────────────────────────

/** Computes and updates the stat cards from an orders array. */
function computeAdminStats(orders) {
  const counts = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
  let revenue = 0;

  orders.forEach(o => {
    if (counts[o.order_status] !== undefined) counts[o.order_status]++;
    revenue += parseFloat(o.total_amount) || 0;
  });

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-total',      orders.length);
  set('stat-processing', counts.Processing);
  set('stat-shipped',    counts.Shipped);
  set('stat-delivered',  counts.Delivered);
  set('stat-revenue',    `₹${revenue.toLocaleString('en-IN')}`);
}

// ─── Collapsible Items Toggle ─────────────────────────────────────────────────

/**
 * Toggles the visibility of extra order items in a table row.
 * @param {HTMLButtonElement} btn
 */
function toggleItems(btn) {
  const collapsible = btn.nextElementSibling;
  if (!collapsible) return;

  const isExpanded = collapsible.classList.contains('expanded');
  collapsible.classList.toggle('expanded', !isExpanded);
  btn.textContent = isExpanded ? btn.textContent.replace('Show less', btn.getAttribute('data-count')) : 'Show less';
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Escapes HTML entities to prevent XSS in admin table rendering. */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
