/**
 * config.js — Central configuration for Power Tech frontend
 * ✅ ONE PLACE to change: phone, WhatsApp, UPI ID, prices, backend URL
 * Last updated: August 2026
 */

// ─── Site-wide Configurables ──────────────────────────────────────────────────
const CONFIG = {
  // Backend API (update after deploying to Render)
  BACKEND_URL: 'https://powertech-api.onrender.com',

  // Contact & Payment — CHANGE THESE AS NEEDED
  PHONE_NUMBER:     '+919928954791',
  WHATSAPP_NUMBER:  '919928954791',
  UPI_ID:           'sanjaysharmas9834@ybl',
  QR_IMAGE:         'img/qr_upi.jpg',       // path to UPI QR code image

  // Hero / Trust badges
  TRUST_COUNT:   '10,000+ Families',
  DELIVERY_TEXT: '10km Free Delivery',

  // Image folder base path
  IMG_BASE: 'img/',

  // Valid order status values (must match database)
  ORDER_STATUSES: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
};

// ─── Products (Exactly 8 — 4 Mid Range + 4 Upper Range) ──────────────────────
//
// category: 'mid'   → Category A (1.5 Ton AC, single heavy appliances)
// category: 'upper' → Category B (2 Ton AC, heavy-duty / commercial)
//
// Output for ALL products: 200V – 240V ±5%

const PRODUCTS = [

  // ════════════════════════════════════════════════════════════
  //  CATEGORY A — MID RANGE  (Best for 1.5 Ton AC)
  // ════════════════════════════════════════════════════════════

  {
    id:            'pt-4170',
    model:         'PT-4170',
    name:          'PowerGuard PT-4170',
    category:      'mid',
    badge:         { text: 'Best Value', class: 'badge-bestseller' },
    inputRange:    '170V – 270V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '170V – 270V',
    price:         2250,
    image:         'img/product1.jpg',
    description:
      'The PT-4170 is our entry-level mid-range stabilizer, engineered for households ' +
      'in areas with moderate voltage variation (170V to 270V). Its microprocessor-controlled ' +
      'relay switching responds in under 20ms, preventing costly motor damage to your AC and ' +
      'refrigerator. Compact, quiet, and built to last — the smart choice for budget-conscious ' +
      'homeowners who refuse to compromise on protection.',
    appliances: [
      { icon: '❄️', name: '1.5 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '📺', name: 'LED TV' },
      { icon: '💧', name: 'Water Pump' },
    ],
  },

  {
    id:            'pt-4160',
    model:         'PT-4160',
    name:          'PowerGuard PT-4160',
    category:      'mid',
    badge:         { text: 'Popular', class: 'badge-popular' },
    inputRange:    '160V – 280V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '160V – 280V',
    price:         3250,
    image:         'img/product2.jpg',
    description:
      'The PT-4160 offers a wider operating band of 160V to 280V, making it ideal for ' +
      'homes that experience both high and low voltage events regularly. The dual-display ' +
      'panel shows real-time input and output voltage, giving you complete visibility of ' +
      'your power quality. An intelligent time-delay relay protects AC compressors from ' +
      'restart damage — a critical feature for 1.5-ton inverter ACs.',
    appliances: [
      { icon: '❄️', name: '1.5 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '📺', name: 'LED TV' },
      { icon: '💧', name: 'Water Pump' },
    ],
  },

  {
    id:            'pt-4130',
    model:         'PT-4130',
    name:          'PowerGuard PT-4130',
    category:      'mid',
    badge:         { text: 'Wide Range', class: 'badge-popular' },
    inputRange:    '130V – 300V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '130V – 300V',
    price:         3850,
    image:         'img/product3.jpg',
    description:
      'The PT-4130 is built for areas with severe voltage fluctuations. Its extended ' +
      'operating range from 130V to 300V handles even the most erratic electricity supply ' +
      'without breaking a sweat. The high-grade toroidal transformer and powder-coated ' +
      'steel cabinet ensure long-term reliability. If your locality faces frequent voltage ' +
      'extremes, this is the model you need for dependable appliance protection.',
    appliances: [
      { icon: '❄️', name: '1.5 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '📺', name: 'LED TV' },
      { icon: '💧', name: 'Water Pump' },
    ],
  },

  {
    id:            'pt-4100',
    model:         'PT-4100',
    name:          'PowerGuard PT-4100',
    category:      'mid',
    badge:         { text: '🏆 Max Range', class: 'badge-premium' },
    inputRange:    '100V – 300V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '100V – 300V',
    price:         6850,
    image:         'img/product4.jpg',
    description:
      'The PT-4100 is our flagship mid-range model with an extraordinary 100V to 300V ' +
      'operating range — handling virtually any voltage situation India can throw at it. ' +
      'Its servo-motor controlled voltage regulation delivers a rock-steady 220V ±1% output, ' +
      'protecting even the most sensitive inverter AC compressors. Backed by our 2-year ' +
      'replacement warranty, this is the ultimate set-it-and-forget-it protection system.',
    appliances: [
      { icon: '❄️', name: '1.5 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '📺', name: 'LED TV' },
      { icon: '💧', name: 'Water Pump' },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  CATEGORY B — UPPER RANGE  (Best for 2 Ton AC / Heavy Duty)
  // ════════════════════════════════════════════════════════════

  {
    id:            'pt-5170',
    model:         'PT-5170',
    name:          'PowerGuard PT-5170',
    category:      'upper',
    badge:         { text: 'Heavy Duty', class: 'badge-bestseller' },
    inputRange:    '170V – 270V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '170V – 270V',
    price:         2850,
    image:         'img/product5.jpg',
    description:
      'The PT-5170 is our entry-level upper-range stabilizer designed for 2-ton ACs and ' +
      'heavy commercial loads. Its heavy-duty copper winding transformer handles higher ' +
      'current loads with ease, while the built-in thermal overload protection prevents ' +
      'damage during sustained operation. Perfect for small offices, shops, and homes ' +
      'running a 2-ton split AC alongside other appliances.',
    appliances: [
      { icon: '❄️', name: '2 Ton AC' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🔌', name: 'Full Home (partial)' },
    ],
  },

  {
    id:            'pt-5160',
    model:         'PT-5160',
    name:          'PowerGuard PT-5160',
    category:      'upper',
    badge:         { text: 'Commercial', class: 'badge-popular' },
    inputRange:    '160V – 280V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '160V – 280V',
    price:         3750,
    image:         'img/product6.jpg',
    description:
      'The PT-5160 combines a wider 160V to 280V input range with the heavy load capacity ' +
      'needed for 2-ton ACs and commercial equipment. Its intelligent relay switching and ' +
      'dual-display show real-time power quality metrics, making it ideal for retail shops, ' +
      'small offices, and restaurants. The reinforced housing and industrial-grade components ' +
      'ensure reliable 24/7 operation in demanding environments.',
    appliances: [
      { icon: '❄️', name: '2 Ton AC' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🔌', name: 'Full Home (partial)' },
    ],
  },

  {
    id:            'pt-5130',
    model:         'PT-5130',
    name:          'PowerGuard PT-5130',
    category:      'upper',
    badge:         { text: 'Pro Grade', class: 'badge-premium' },
    inputRange:    '130V – 300V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '130V – 300V',
    price:         4850,
    image:         'img/product7.jpg',
    description:
      'The PT-5130 is engineered for commercial and semi-industrial use where voltage ' +
      'fluctuations are extreme (130V to 300V). Its pro-grade servo motor control delivers ' +
      'precision voltage regulation for sensitive commercial equipment. The IP44-rated ' +
      'enclosure offers dust and splash resistance, making it suitable for semi-outdoor ' +
      'installations. Ideal for larger shops, gyms, and multi-AC office setups.',
    appliances: [
      { icon: '❄️', name: '2 Ton AC' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🔌', name: 'Full Home (partial)' },
    ],
  },

  {
    id:            'pt-5100',
    model:         'PT-5100',
    name:          'PowerGuard PT-5100',
    category:      'upper',
    badge:         { text: '🏆 Flagship', class: 'badge-premium' },
    inputRange:    '100V – 300V',
    outputRange:   '200V – 240V ±5%',
    voltageRange:  '100V – 300V',
    price:         7850,
    image:         'img/product8.jpg',
    description:
      'The PT-5100 is our ultimate commercial-grade flagship, offering the widest 100V to ' +
      '300V operating range with the highest load capacity in our lineup. Its industrial-grade ' +
      'copper-wound transformer and servo-motor regulation deliver ±1% output stability, ' +
      'protecting your entire commercial setup including 2-ton ACs, washing machines, ' +
      'microwaves, and partial whole-home loads. Built for demanding, high-uptime environments ' +
      'with a 2-year comprehensive warranty.',
    appliances: [
      { icon: '❄️', name: '2 Ton AC' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🔌', name: 'Full Home (partial)' },
    ],
  },

]; // end PRODUCTS