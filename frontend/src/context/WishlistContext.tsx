import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: number[];
  wishlistProducts: Product[];
  loading: boolean;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      try {
        const saved = localStorage.getItem('guest_wishlist');
        if (saved) setWishlistProducts(JSON.parse(saved));
      } catch {
        setWishlistProducts([]);
      }
    }
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await api.getWishlist();
      setWishlistProducts(data.items.map((i) => i.product).filter(Boolean));
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product: Product) => {
    if (isAuthenticated) {
      try {
        await api.addToWishlist(product.id);
        setWishlistProducts((prev) => [...prev.filter((p) => p.id !== product.id), product]);
      } catch (err) {
        console.error('Failed to add to wishlist on server', err);
      }
    } else {
      setWishlistProducts((prev) => {
        const updated = [...prev.filter((p) => p.id !== product.id), product];
        localStorage.setItem('guest_wishlist', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (isAuthenticated) {
      try {
        await api.removeFromWishlist(productId);
        setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (err) {
        console.error('Failed to remove from wishlist on server', err);
      }
    } else {
      setWishlistProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        localStorage.setItem('guest_wishlist', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlistProducts.some((p) => p.id === productId);
  };

  const wishlistIds = wishlistProducts.map((p) => p.id);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
