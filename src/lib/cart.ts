import { WCProduct } from './woocommerce';
import { getDealerPrice, formatPrice } from './pricing';

export interface CartItem {
  product: WCProduct;
  quantity: number;
  dealerPrice: number;
  totalPrice: number;
}

const CART_KEY = 'bayiportal_cart';

export function getCart(): CartItem[] {
  const stored = localStorage.getItem(CART_KEY);
  if (stored) { 
    try { 
      return JSON.parse(stored); 
    } catch { 
      return []; 
    } 
  }
  return [];
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product: WCProduct, quantity: number = 1, customPrice?: number): CartItem[] {
  const cart = getCart();
  const dealerPrice = customPrice !== undefined ? customPrice : parseFloat(product.price);

  const existingIndex = cart.findIndex(item => item.product.id === product.id);
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
    cart[existingIndex].totalPrice = cart[existingIndex].quantity * cart[existingIndex].dealerPrice;
  } else {
    cart.push({ 
      product, 
      quantity, 
      dealerPrice, 
      totalPrice: quantity * dealerPrice,
    });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: number): CartItem[] {
  const cart = getCart().filter(item => item.product.id !== productId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: number, quantity: number): CartItem[] {
  const cart = getCart();
  const item = cart.find(item => item.product.id === productId);
  if (item) { 
    item.quantity = Math.max(1, quantity); 
    item.totalPrice = item.quantity * item.dealerPrice; 
  }
  saveCart(cart);
  return cart;
}

export function clearCart(): CartItem[] {
  localStorage.removeItem(CART_KEY);
  return [];
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSavings(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    const regularTotal = parseFloat(item.product.regular_price) * item.quantity;
    return sum + (regularTotal - item.totalPrice);
  }, 0);
}

export { formatPrice };
