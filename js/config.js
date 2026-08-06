/**
 * config.js — Central configuration for Power Tech frontend
 * All API base URLs and constants live here.
 * Update BACKEND_URL once deployed to Render.
 */

// ─── API Base URL ────────────────────────────────────────────────────────────
// Change this to your Render deployment URL after deploying the backend.
// Example: 'http://localhost:5000'
const CONFIG = {
  BACKEND_URL: 'http://localhost:3000', // ← UPDATE after deploying to Render
  PHONE_NUMBER: '+919876543210',
  WHATSAPP_NUMBER: '919876543210',
  // Supported order status values (must match backend)
  ORDER_STATUSES: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
};

// ─── Product Data (Hardcoded, as per spec) ───────────────────────────────────
// Images use relative paths pointing to the img/ folder.
const PRODUCTS = [
  {
    id: 'pg-1500',
    model: 'PG-1500',
    name: 'PowerGuard 1500',
    badge: { text: 'Best Seller', class: 'badge-bestseller' },
    voltageRange: '140V – 270V',
    capacityVA: '1500 VA',
    price: 2200,
    image: 'img/product1.jpg',
    description:
      'The PowerGuard 1500 is an intelligent entry-level stabilizer engineered for single large appliances like 1.5 ton air conditioners and refrigerators. ' +
      'Its microprocessor-controlled relay switching ensures ultra-fast voltage correction within 20 milliseconds, eliminating the risk of motor burnout. ' +
      'Built with a high-grade toroidal transformer and housed in a rugged powder-coated steel cabinet, it delivers reliable protection for years of worry-free operation.',
    appliances: [
      { icon: '❄️', name: '1.5 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '📺', name: 'LED TV' },
      { icon: '💡', name: 'LED Lights' },
    ],
  },
  {
    id: 'pg-3000',
    model: 'PG-3000',
    name: 'PowerGuard 3000',
    badge: { text: 'Most Popular', class: 'badge-popular' },
    voltageRange: '130V – 280V',
    capacityVA: '3000 VA',
    price: 3500,
    image: 'img/product2.jpg',
    description:
      'The PowerGuard 3000 is a mid-range powerhouse designed for homes with multiple large appliances running simultaneously. ' +
      'With a wide operating range of 130V to 280V and a dual-display showing real-time input and output voltage, it provides complete visibility into your home\'s power quality. ' +
      'The intelligent time-delay relay protects compressors from restart damage, making it ideal for air conditioners up to 2 tons, washing machines, and microwave ovens.',
    appliances: [
      { icon: '❄️', name: '2 Ton AC' },
      { icon: '🧊', name: 'Refrigerator' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '📺', name: 'LED TV' },
    ],
  },
  {
    id: 'pg-pro-5000',
    model: 'PG-PRO-5000',
    name: 'PowerGuard PRO 5000',
    badge: { text: '🏆 Premium', class: 'badge-premium' },
    voltageRange: '100V – 290V',
    capacityVA: '5000 VA',
    price: 8000,
    image: 'img/product3.jpg',
    description:
      'The PowerGuard PRO 5000 is our flagship whole-home protection system, engineered for demanding environments with severe voltage fluctuations from 100V to 290V. ' +
      'Its servo-motor controlled automatic voltage regulation delivers a rock-steady 220V ±1% output, protecting even the most sensitive electronics including inverter ACs, smart refrigerators, and home theatres. ' +
      'The industrial-grade copper winding transformer and IP54-rated cabinet ensure decades of maintenance-free performance — backed by our comprehensive 2-year replacement warranty.',
    appliances: [
      { icon: '❄️', name: 'Inverter AC' },
      { icon: '🧊', name: 'Smart Fridge' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🖥️', name: 'Home Theatre' },
      { icon: '🔌', name: 'Full Home' },
    ],
  },
];
