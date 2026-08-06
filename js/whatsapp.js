/**
 * whatsapp.js — WhatsApp redirect logic for Power Tech
 * Generates a pre-filled WhatsApp message with order details
 * and opens it in a new browser tab.
 */

/**
 * Builds and opens a WhatsApp deep link with order details.
 * Called immediately after a successful order placement.
 *
 * @param {Object} orderDetails — Shape:
 *   {
 *     orderId: string,          // full UUID
 *     customerName: string,
 *     items: Array<{name, quantity, price}>,
 *     total: number,
 *     paymentMethod: 'COD'|'UPI',
 *     address: string,
 *     city: string,
 *     pincode: string,
 *   }
 */
function generateWhatsAppLink(orderDetails) {
  const {
    orderId,
    customerName,
    items,
    total,
    paymentMethod,
    address,
    city,
    pincode,
  } = orderDetails;

  // Shorten order ID for readability (first 8 chars)
  const shortId = orderId ? orderId.substring(0, 8).toUpperCase() : 'N/A';

  // Build items summary string
  const itemsSummary = items
    .map(item => `  • ${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}`)
    .join('\n');

  // Compose the WhatsApp message
  const message = [
    `🧾 *New Order — Power Tech*`,
    ``,
    `📦 *Order ID:* #${shortId}`,
    `👤 *Customer:* ${customerName}`,
    ``,
    `🛒 *Items Ordered:*`,
    itemsSummary,
    ``,
    `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}`,
    `💳 *Payment:* ${paymentMethod}`,
    ``,
    `📍 *Delivery Address:*`,
    `${address}, ${city} - ${pincode}`,
    ``,
    `─────────────────────`,
    `Thank you for shopping with Power Tech! ⚡`,
  ].join('\n');

  // Encode for URL
  const encodedMessage = encodeURIComponent(message);

  // WhatsApp API link (uses CONFIG.WHATSAPP_NUMBER without + sign)
  const waUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;

  // Open in new tab
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
