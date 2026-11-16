import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  loading: boolean;
  couponCode: string;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localItems, setLocalItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('guest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync cart from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadServerCart();
    }
  }, [isAuthenticated]);

  const loadServerCart = async () => {
    setLoading(true);
    try {
      const serverCart = await api.getCart();
      setCart(serverCart);
    } catch (error) {
      console.error('Failed to load cart from server', error);
    } finally {
      setLoading(false);
    }
  };

  const items = isAuthenticated ? cart?.items || [] : localItems;
  const subtotal = items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.18 * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const addToCart = async (product: Product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        const updated = await api.addToCart(product.id, quantity);
        setCart(updated);
      } catch (error) {
        console.error('Failed to add to server cart', error);
      }
    } else {
      setLocalItems((prev) => {
        const existing = prev.find((item) => item.product_id === product.id);
        let updated: CartItem[];
        if (existing) {
          updated = prev.map((item) =>
            item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          updated = [...prev, { id: Date.now(), product_id: product.id, quantity, product }];
        }
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (isAuthenticated) {
      try {
        const updated = await api.updateCartItem(itemId, quantity);
        setCart(updated);
      } catch (error) {
        console.error('Failed to update cart item', error);
      }
    } else {
      setLocalItems((prev) => {
        const updated = quantity <= 0
          ? prev.filter((i) => i.id !== itemId)
          : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (isAuthenticated) {
      try {
        const updated = await api.removeFromCart(itemId);
        setCart(updated);
      } catch (error) {
        console.error('Failed to remove from server cart', error);
      }
    } else {
      setLocalItems((prev) => {
        const updated = prev.filter((i) => i.id !== itemId);
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.clearCart();
        setCart(null);
      } catch (error) {
        console.error('Failed to clear server cart', error);
      }
    } else {
      setLocalItems([]);
      localStorage.removeItem('guest_cart');
    }
    setCouponCode('');
    setDiscountAmount(0);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.applyCoupon(code, subtotal);
      if (res.valid) {
        setCouponCode(res.code);
        setDiscountAmount(res.discount_amount);
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.detail || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        subtotal,
        totalItems,
        loading,
        couponCode,
        discountAmount,
        taxAmount,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
