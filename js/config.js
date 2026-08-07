/**
 * config.js — Central configuration for Power Tech frontend
 */

// ─── API Base URL ────────────────────────────────────────────────────────────
const CONFIG = {
  BACKEND_URL: 'https://power-tech.onrender.com',
  PHONE_NUMBER: '+919928954791',
  WHATSAPP_NUMBER: '919928954791',
  ORDER_STATUSES: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
};

// ─── Product Data ────────────────────────────────────────────────────────────
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
    description: 'The PowerGuard 1500 is an intelligent entry-level stabilizer engineered for single large appliances like 1.5 ton air conditioners and refrigerators.',
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
    description: 'The PowerGuard 3000 is a mid-range powerhouse designed for homes with multiple large appliances running simultaneously.',
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
    description: 'The PowerGuard PRO 5000 is our flagship whole-home protection system, engineered for demanding environments.',
    appliances: [
      { icon: '❄️', name: 'Inverter AC' },
      { icon: '🧊', name: 'Smart Fridge' },
      { icon: '🫧', name: 'Washing Machine' },
      { icon: '📡', name: 'Microwave' },
      { icon: '🖥️', name: 'Home Theatre' },
      { icon: '🔌', name: 'Full Home' },
    ],
  },
  {   // ✅ अब ये 4th Product ARRAY के अंदर है (Comma ऊपर लगा है)
    id: 'pg-pro-7000',
    model: 'PG_PRO_7000',
    name: 'PowerGuard PRO 7000',    // ✅ ':' सही है, '.' नहीं
    badge: { text: '🔝 Upper Premium', class: 'badge-premium' }, // ✅ ':' लगा दिया
    voltageRange: '100V – 320V',
    capacityVA: '7000 VA',
    price: 12000,
    image: 'img/product4.jpg',     // ✅ Path सही किया (img/ folder और spaces हटाए)
    description: 'The PowerGuard PRO 7000 is the ultimate heavy-duty stabilizer for industrial and commercial use, handling extreme loads with ease.',
    appliances: [
      { icon: '🏭', name: 'Industrial AC' },
      { icon: '⚡', name: 'Heavy Load' },
      { icon: '🔌', name: 'Full Commercial' },
    ],
  }
];