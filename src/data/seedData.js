export const PRODUCT_CATEGORIES = ['All', 'Pizza', 'Pasta', 'Burger', 'Sides', 'Beverage', 'Dessert'];

export const SEED_PRODUCTS = [
  { id: 'p1', name: 'Margherita Pizza', category: 'Pizza', price: 12.99, tax: 5, unit: 'pcs', emoji: '🍕', description: 'Classic tomato, mozzarella, fresh basil', variants: [{ attribute: 'Size', values: [{ name: 'Small', price: 9.99 }, { name: 'Medium', price: 12.99 }, { name: 'Large', price: 16.99 }] }] },
  { id: 'p2', name: 'Pepperoni Pizza', category: 'Pizza', price: 14.99, tax: 5, unit: 'pcs', emoji: '🍕', description: 'Loaded with pepperoni and cheese', variants: [{ attribute: 'Size', values: [{ name: 'Small', price: 11.99 }, { name: 'Medium', price: 14.99 }, { name: 'Large', price: 18.99 }] }] },
  { id: 'p3', name: 'BBQ Chicken Pizza', category: 'Pizza', price: 15.99, tax: 5, unit: 'pcs', emoji: '🍕', description: 'BBQ sauce, grilled chicken, red onion', variants: [{ attribute: 'Size', values: [{ name: 'Small', price: 12.99 }, { name: 'Medium', price: 15.99 }, { name: 'Large', price: 19.99 }] }] },
  { id: 'p4', name: 'Spaghetti Bolognese', category: 'Pasta', price: 11.99, tax: 5, unit: 'pcs', emoji: '🍝', description: 'Rich beef ragù with spaghetti', variants: [] },
  { id: 'p5', name: 'Penne Alfredo', category: 'Pasta', price: 12.49, tax: 5, unit: 'pcs', emoji: '🍝', description: 'Creamy Alfredo sauce with penne', variants: [] },
  { id: 'p6', name: 'Classic Burger', category: 'Burger', price: 9.99, tax: 5, unit: 'pcs', emoji: '🍔', description: 'Beef patty, lettuce, tomato, cheese', variants: [{ attribute: 'Patty', values: [{ name: 'Single', price: 9.99 }, { name: 'Double', price: 13.49 }] }] },
  { id: 'p7', name: 'Chicken Burger', category: 'Burger', price: 10.49, tax: 5, unit: 'pcs', emoji: '🍔', description: 'Crispy chicken, mayo, coleslaw', variants: [] },
  { id: 'p8', name: 'Caesar Salad', category: 'Sides', price: 7.99, tax: 5, unit: 'pcs', emoji: '🥗', description: 'Romaine, croutons, parmesan, Caesar dressing', variants: [] },
  { id: 'p9', name: 'French Fries', category: 'Sides', price: 4.99, tax: 5, unit: 'pcs', emoji: '🍟', description: 'Crispy golden fries with seasoning', variants: [] },
  { id: 'p10', name: 'Garlic Bread', category: 'Sides', price: 5.49, tax: 5, unit: 'pcs', emoji: '🥖', description: 'Warm garlic butter bread', variants: [] },
  { id: 'p11', name: 'Espresso', category: 'Beverage', price: 3.49, tax: 5, unit: 'pcs', emoji: '☕', description: 'Rich Italian espresso shot', variants: [] },
  { id: 'p12', name: 'Cappuccino', category: 'Beverage', price: 4.99, tax: 5, unit: 'pcs', emoji: '☕', description: 'Espresso with steamed milk foam', variants: [{ attribute: 'Size', values: [{ name: 'Regular', price: 4.99 }, { name: 'Large', price: 6.49 }] }] },
  { id: 'p13', name: 'Fresh Lemonade', category: 'Beverage', price: 3.99, tax: 5, unit: 'pcs', emoji: '🍋', description: 'Freshly squeezed lemonade', variants: [] },
  { id: 'p14', name: 'Mineral Water', category: 'Beverage', price: 1.99, tax: 0, unit: 'pcs', emoji: '💧', description: '500ml bottled water', variants: [] },
  { id: 'p15', name: 'Tiramisu', category: 'Dessert', price: 6.99, tax: 5, unit: 'pcs', emoji: '🍰', description: 'Classic Italian coffee-flavored dessert', variants: [] },
  { id: 'p16', name: 'Chocolate Brownie', category: 'Dessert', price: 5.99, tax: 5, unit: 'pcs', emoji: '🍫', description: 'Warm brownie with vanilla ice cream', variants: [] },
];

export const SEED_FLOORS = [
  {
    id: 'f1',
    name: 'Ground Floor',
    tables: [
      { id: 't1', number: 1, seats: 2, status: 'available', active: true },
      { id: 't2', number: 2, seats: 4, status: 'available', active: true },
      { id: 't3', number: 3, seats: 4, status: 'available', active: true },
      { id: 't4', number: 4, seats: 6, status: 'available', active: true },
      { id: 't5', number: 5, seats: 2, status: 'available', active: true },
      { id: 't6', number: 6, seats: 8, status: 'available', active: true },
    ],
  },
  {
    id: 'f2',
    name: 'Rooftop',
    tables: [
      { id: 't7', number: 7, seats: 4, status: 'available', active: true },
      { id: 't8', number: 8, seats: 2, status: 'available', active: true },
      { id: 't9', number: 9, seats: 6, status: 'available', active: true },
      { id: 't10', number: 10, seats: 4, status: 'available', active: true },
      { id: 't11', number: 11, seats: 2, status: 'available', active: true },
      { id: 't12', number: 12, seats: 8, status: 'available', active: true },
    ],
  },
];

export const DEFAULT_PAYMENT_METHODS = {
  cash: true,
  digital: false,
  upi: true,
  razorpay: false,
  upiId: '123@ybl.com',
};

export const DEFAULT_KITCHEN_AVAILABILITY = {};
// Will be populated dynamically: { productId: true/false }
// true = available, undefined/missing = available (default available)

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

export function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getTimeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
