/**
 * checkout.js — Multi-step checkout flow for Power Tech
 *
 * Steps:
 *   1 → Address details
 *   2 → Payment method (COD / UPI with screenshot upload)
 *   3 → Order summary + Place Order
 *   Success → Animated success screen + WhatsApp redirect
 *
 * API: POST /api/orders (JWT protected)
 */

// ─── Checkout State ───────────────────────────────────────────────────────────
let checkoutCurrentStep = 1;     // 1, 2, 3, or 'success'
let screenshotBase64    = null;  // Base64 data URL of uploaded screenshot
let placedOrderId       = null;  // UUID returned by server after order placed

// ─── Open / Close ─────────────────────────────────────────────────────────────

/**
 * Opens the checkout modal.
 * Auth-gated: redirects to auth modal if not logged in.
 */
function openCheckout() {
  if (!isLoggedIn()) {
    openAuthModal();
    showToast('info', '🔐 Login Required', 'Please sign in to proceed to checkout.');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    showToast('info', '🛒 Cart Empty', 'Add items to your cart first.');
    return;
  }

  // Reset to step 1
  checkoutCurrentStep = 1;
  screenshotBase64    = null;
  placedOrderId       = null;

  // Pre-fill name and phone from logged-in user
  const user = getCurrentUser();
  if (user) {
    const nameInput  = document.getElementById('addr-name');
    const phoneInput = document.getElementById('addr-phone');
    if (nameInput && !nameInput.value)   nameInput.value  = user.name  || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
  }

  // Reset payment to COD
  document.getElementById('pay-cod').checked = true;
  document.getElementById('upi-section').classList.add('hidden');
  document.getElementById('file-name-display').classList.add('hidden');
  document.getElementById('file-name-display').textContent = '';
  document.getElementById('screenshot-input').value = '';

  // Reset progress bar
  updateProgressBar(1);

  // Show step 1
  showCheckoutStep(1);

  // Show modal
  document.getElementById('checkout-modal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Close cart drawer if open
  closeCartDrawer();
}

/** Closes the checkout modal. */
function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Step Navigation ──────────────────────────────────────────────────────────

/** Shows the specified step, hiding all others. Updates progress bar. */
function showCheckoutStep(step) {
  // Hide all steps
  ['1','2','3','success'].forEach(s => {
    const el = document.getElementById(`checkout-step-${s}`);
    if (el) el.classList.remove('active');
  });

  // Show target step
  const targetEl = document.getElementById(`checkout-step-${step}`);
  if (targetEl) targetEl.classList.add('active');

  checkoutCurrentStep = step;

  // Update footer buttons
  const backBtn = document.getElementById('checkout-back-btn');
  const nextBtn = document.getElementById('checkout-next-btn');
  const footer  = document.getElementById('checkout-nav-footer');

  if (step === 'success') {
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'flex';

  if (step === 1) {
    backBtn.style.display = 'none';
    nextBtn.style.display = 'flex';
    nextBtn.textContent   = 'Continue →';
    nextBtn.disabled      = false;
  } else if (step === 2) {
    backBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    nextBtn.textContent   = 'Review Order →';
    // Enable/disable based on payment method
    syncContinueBtnState();
  } else if (step === 3) {
    backBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    nextBtn.textContent   = '✅ Place Order';
    nextBtn.disabled      = false;
    nextBtn.className     = 'btn btn-gold-pulse w-full';
    // Render summary
    renderOrderSummary();
  }

  updateProgressBar(step);
}

/** Called when the "Continue" / "Place Order" button is clicked. */
function checkoutNext() {
  if (checkoutCurrentStep === 1) {
    // Validate address form
    if (!validateAddressForm()) return;
    showCheckoutStep(2);

  } else if (checkoutCurrentStep === 2) {
    // Validate payment — UPI requires screenshot
    const method = getSelectedPaymentMethod();
    if (method === 'UPI' && !screenshotBase64) {
      showToast('error', '📸 Screenshot Required', 'Please upload your UPI payment screenshot.');
      return;
    }
    showCheckoutStep(3);

  } else if (checkoutCurrentStep === 3) {
    // Place the order
    placeOrder();
  }
}

/** Called when the "Back" button is clicked. */
function checkoutBack() {
  if (checkoutCurrentStep === 2) {
    showCheckoutStep(1);
  } else if (checkoutCurrentStep === 3) {
    showCheckoutStep(2);
  }
}

/** Advances to a specific step from outside (e.g. progress click). */
function goToCheckoutStep(step) {
  checkoutNext(); // just delegate to next for form-driven flow
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
/**
 * Updates the visual progress bar to reflect current step.
 * @param {number} step — 1, 2, or 3
 */
function updateProgressBar(step) {
  for (let i = 1; i <= 3; i++) {
    const ps = document.getElementById(`ps-${i}`);
    const sc = document.getElementById(`sc-${i}`);
    if (!ps || !sc) continue;

    ps.classList.remove('active', 'done');
    sc.textContent = i < step ? '✓' : i;

    if (i < step)  { ps.classList.add('done'); }
    if (i === step) { ps.classList.add('active'); }
  }
}

// ─── Payment Method Handling ──────────────────────────────────────────────────

/** Returns the currently selected payment method ('COD' or 'UPI'). */
function getSelectedPaymentMethod() {
  return document.querySelector('input[name="payment-method"]:checked')?.value || 'COD';
}

/**
 * Called when the payment radio changes.
 * Shows/hides the UPI section and updates the continue button state.
 */
function onPaymentMethodChange() {
  const method     = getSelectedPaymentMethod();
  const upiSection = document.getElementById('upi-section');

  if (method === 'UPI') {
    upiSection.classList.remove('hidden');
  } else {
    upiSection.classList.add('hidden');
  }

  syncContinueBtnState();
}

/** Enables or disables the Continue button on step 2 based on UPI screenshot. */
function syncContinueBtnState() {
  const nextBtn = document.getElementById('checkout-next-btn');
  if (!nextBtn || checkoutCurrentStep !== 2) return;

  const method = getSelectedPaymentMethod();
  nextBtn.disabled = (method === 'UPI' && !screenshotBase64);
}

// Attach payment radio change listeners once DOM ready (called from app.js)
function initPaymentListeners() {
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', onPaymentMethodChange);
  });
}

// ─── Screenshot Upload ────────────────────────────────────────────────────────

/**
 * Handles the payment screenshot file input change.
 * Converts the file to Base64 using FileReader for storage and later upload.
 * @param {HTMLInputElement} input
 */
function handleScreenshotUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('error', '❌ Invalid File', 'Please upload an image file (JPG/PNG/WEBP).');
    input.value = '';
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('error', '❌ File Too Large', 'Maximum file size is 5MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    screenshotBase64 = e.target.result; // Full data URL with MIME prefix

    // Update UI
    const fileNameEl = document.getElementById('file-name-display');
    const uploadArea = document.getElementById('file-upload-area');

    if (fileNameEl) {
      fileNameEl.textContent = `✅ ${file.name}`;
      fileNameEl.classList.remove('hidden');
    }

    if (uploadArea) {
      uploadArea.classList.add('has-file');
    }

    // Enable continue button
    syncContinueBtnState();

    showToast('success', '📸 Screenshot Added', 'Payment screenshot uploaded successfully.');
  };

  reader.onerror = () => {
    showToast('error', '❌ Upload Failed', 'Could not read the file. Please try again.');
    screenshotBase64 = null;
    syncContinueBtnState();
  };

  reader.readAsDataURL(file);
}

// ─── Order Summary Render ─────────────────────────────────────────────────────

/** Renders the full order summary into step 3. */
function renderOrderSummary() {
  const summaryEl = document.getElementById('order-summary-content');
  if (!summaryEl) return;

  const cart    = getCart();
  const total   = getCartTotal();
  const method  = getSelectedPaymentMethod();

  const addrName    = document.getElementById('addr-name').value;
  const addrPhone   = document.getElementById('addr-phone').value;
  const addrAddress = document.getElementById('addr-address').value;
  const addrCity    = document.getElementById('addr-city').value;
  const addrPincode = document.getElementById('addr-pincode').value;

  const screenshotThumb = (method === 'UPI' && screenshotBase64)
    ? `<div style="margin-top:8px;">
         <img class="screenshot-thumb" src="${screenshotBase64}" alt="Payment Proof"
              onclick="openLightbox('${screenshotBase64.substring(0,100)}...')" />
         <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">Tap to enlarge</span>
       </div>`
    : '';

  const itemsHTML = cart.map(item => `
    <div class="summary-row">
      <span class="key">${item.name} × ${item.quantity}</span>
      <span class="val">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>`).join('');

  summaryEl.innerHTML = `
    <!-- Delivery Address -->
    <div class="summary-section">
      <div class="summary-label">📍 Delivery Address</div>
      <div class="summary-row"><span class="key">Name</span><span class="val">${addrName}</span></div>
      <div class="summary-row"><span class="key">Phone</span><span class="val">${addrPhone}</span></div>
      <div class="summary-row"><span class="key">Address</span><span class="val" style="text-align:right;max-width:240px;">${addrAddress}</span></div>
      <div class="summary-row"><span class="key">City</span><span class="val">${addrCity} – ${addrPincode}</span></div>
    </div>

    <div class="divider"></div>

    <!-- Items -->
    <div class="summary-section">
      <div class="summary-label">🛒 Items</div>
      ${itemsHTML}
    </div>

    <div class="divider"></div>

    <!-- Payment -->
    <div class="summary-section">
      <div class="summary-label">💳 Payment</div>
      <div class="summary-row">
        <span class="key">Method</span>
        <span class="val">${method === 'COD' ? '💵 Cash on Delivery' : '📲 UPI'}</span>
      </div>
      ${screenshotThumb}
    </div>

    <!-- Total -->
    <div class="summary-total">
      <span class="key">Total Amount</span>
      <span class="val">₹${total.toLocaleString('en-IN')}</span>
    </div>`;
}

// ─── Place Order API Call ─────────────────────────────────────────────────────

/**
 * Sends the final order to the backend.
 * On success: clears cart, shows success animation, triggers WhatsApp.
 */
async function placeOrder() {
  const cart   = getCart();
  const total  = getCartTotal();
  const method = getSelectedPaymentMethod();
  const token  = getToken();

  // Gather address fields
  const customerName    = document.getElementById('addr-name').value.trim();
  const customerPhone   = document.getElementById('addr-phone').value.trim();
  const customerAddress = document.getElementById('addr-address').value.trim();
  const customerCity    = document.getElementById('addr-city').value.trim();
  const customerPincode = document.getElementById('addr-pincode').value.trim();

  // Build payload
  const payload = {
    customer_name:    customerName,
    customer_phone:   customerPhone,
    customer_address: customerAddress,
    customer_city:    customerCity,
    customer_pincode: customerPincode,
    items:            cart,
    total_amount:     total,
    payment_method:   method,
    payment_screenshot: method === 'UPI' ? screenshotBase64 : null,
  };

  // Show full-screen spinner
  showSpinner('Placing your order…');

  try {
    const res  = await fetch(`${CONFIG.BACKEND_URL}/api/orders`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      hideSpinner();
      showToast('error', '❌ Order Failed', data.error || 'Could not place order. Try again.');
      return;
    }

    // Store order id for "View Order" button
    placedOrderId = data.order?.id;

    // SUCCESS ─────────────────────────────────────────────────────────────────
    hideSpinner();

    // Clear the cart
    clearCart();

    // Show success step
    updateProgressBar(3);
    showCheckoutStep('success');

    showToast('success', '🎉 Order Placed!', 'Your order was placed successfully.');

    // Trigger WhatsApp (immediate, per spec)
    generateWhatsAppLink({
      orderId:       placedOrderId || 'N/A',
      customerName,
      items:         cart,
      total,
      paymentMethod: method,
      address:       customerAddress,
      city:          customerCity,
      pincode:       customerPincode,
    });

  } catch (err) {
    console.error('[Checkout] Place order error:', err);
    hideSpinner();
    showToast('error', '❌ Network Error', 'Could not connect to server. Check your connection.');
  }
}

/** Called when "View Order" is clicked on the success screen. */
function viewMyOrder() {
  closeCheckout();
  switchTab('orders');
}

// ─── Address Validation ───────────────────────────────────────────────────────

/**
 * Validates all address form fields.
 * Shows inline error messages.
 * @returns {boolean} true if all valid
 */
function validateAddressForm() {
  let valid = true;

  // Helper: clear and show errors
  const clear = (inputId, errId) => {
    const el  = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (el)  el.classList.remove('error');
    if (err) { err.textContent = ''; err.classList.remove('visible'); }
  };

  const error = (inputId, errId, msg) => {
    const el  = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (el)  el.classList.add('error');
    if (err) { err.textContent = msg; err.classList.add('visible'); }
    valid = false;
  };

  // Clear all
  [['addr-name','addr-name-err'],['addr-phone','addr-phone-err'],
   ['addr-address','addr-address-err'],['addr-city','addr-city-err'],
   ['addr-pincode','addr-pincode-err']].forEach(([i,e]) => clear(i,e));

  const name    = document.getElementById('addr-name').value.trim();
  const phone   = document.getElementById('addr-phone').value.trim();
  const address = document.getElementById('addr-address').value.trim();
  const city    = document.getElementById('addr-city').value.trim();
  const pincode = document.getElementById('addr-pincode').value.trim();

  if (!name || name.length < 2)          error('addr-name',    'addr-name-err',    'Please enter your full name.');
  if (!phone || !/^\d{10}$/.test(phone)) error('addr-phone',   'addr-phone-err',   'Enter a valid 10-digit phone number.');
  if (!address || address.length < 10)   error('addr-address', 'addr-address-err', 'Please enter your full delivery address.');
  if (!city || city.length < 2)          error('addr-city',    'addr-city-err',    'Please enter your city.');
  if (!pincode || !/^\d{6}$/.test(pincode)) error('addr-pincode', 'addr-pincode-err', 'Enter a valid 6-digit pincode.');

  return valid;
}

// ─── Spinner Helpers ──────────────────────────────────────────────────────────
function showSpinner(text = 'Loading…') {
  const overlay = document.getElementById('spinner-overlay');
  const textEl  = document.getElementById('spinner-text');
  if (textEl)  textEl.textContent = text;
  if (overlay) overlay.classList.add('show');
}

function hideSpinner() {
  const overlay = document.getElementById('spinner-overlay');
  if (overlay) overlay.classList.remove('show');
}
