import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, getCart, addToCart as cartAdd, removeFromCart as cartRemove, updateQuantity as cartUpdate, clearCart as cartClear, getCartTotal, getCartItemCount, getCartSavings } from '../lib/cart';
import { WCProduct } from '../lib/woocommerce';

interface CartContextType {
  cart: CartItem[];
  total: number;
  itemCount: number;
  savings: number;
  addToCart: (product: WCProduct, quantity?: number, customPrice?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(getCart());

  useEffect(() => { setCart(getCart()); }, []);

  const addToCart = useCallback((product: WCProduct, quantity: number = 1, customPrice?: number) => {
    const updated = cartAdd(product, quantity, customPrice);
    setCart([...updated]);
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    const updated = cartRemove(productId);
    setCart([...updated]);
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    const updated = cartUpdate(productId, quantity);
    setCart([...updated]);
  }, []);

  const clearCart = useCallback(() => {
    const updated = cartClear();
    setCart([...updated]);
  }, []);

  const total = getCartTotal(cart);
  const itemCount = getCartItemCount(cart);
  const savings = getCartSavings(cart);

  return (
    <CartContext.Provider value={{ cart, total, itemCount, savings, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
