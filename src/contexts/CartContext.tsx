/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  discountCode: string;
  discountAmount: number;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'sirius_cart';
const DISCOUNT_KEY = 'sirius_discount';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [discountCode, setDiscountCode] = useState(() => localStorage.getItem(DISCOUNT_KEY) || '');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    try {
      // Trim massive fields (like descriptions and full image arrays) before saving
      const minimalItems = items.map(item => ({
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name_ar: item.product.name_ar,
          name_en: item.product.name_en,
          slug: item.product.slug,
          price: item.product.price,
          discount_price: item.product.discount_price,
          stock_quantity: item.product.stock_quantity,
          category_id: item.product.category_id,
          images: item.product.images ? item.product.images.slice(0, 1) : [],
        }
      }));
      localStorage.setItem(CART_KEY, JSON.stringify(minimalItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage. Quota exceeded.', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        localStorage.removeItem(CART_KEY);
      }
    }
  }, [items]);

  useEffect(() => {
    if (discountCode) localStorage.setItem(DISCOUNT_KEY, discountCode);
    else localStorage.removeItem(DISCOUNT_KEY);
  }, [discountCode]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_quantity) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock_quantity) }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setDiscountAmount(0);
  };

  const subtotal = items.reduce((sum, i) => {
    const price = i.product.discount_price ?? i.product.price;
    return sum + price * i.quantity;
  }, 0);

  const applyDiscount = async (code: string): Promise<boolean> => {
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (!data) return false;
    if (new Date(data.starts_at) > new Date()) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
    if (data.max_uses !== null && data.current_uses >= data.max_uses) return false;

    // Calculate eligible subtotal based on scope
    let eligibleSubtotal = 0;
    if (data.scope === 'products' && data.product_ids?.length > 0) {
      eligibleSubtotal = items.reduce((sum, i) => {
        if (data.product_ids.includes(i.product.id)) {
          return sum + (i.product.discount_price ?? i.product.price) * i.quantity;
        }
        return sum;
      }, 0);
    } else if (data.scope === 'categories' && data.category_ids?.length > 0) {
      eligibleSubtotal = items.reduce((sum, i) => {
        if (i.product.category_id && data.category_ids.includes(i.product.category_id)) {
          return sum + (i.product.discount_price ?? i.product.price) * i.quantity;
        }
        return sum;
      }, 0);
    } else {
      eligibleSubtotal = subtotal;
    }

    if (data.min_order_amount > eligibleSubtotal) return false;
    const amount = data.discount_type === 'percentage'
      ? (eligibleSubtotal * data.discount_value) / 100
      : data.discount_value;
    setDiscountCode(code);
    setDiscountAmount(Math.min(amount, subtotal));
    return true;
  };

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountAmount(0);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = subtotal - discountAmount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice, discountCode, discountAmount,
      applyDiscount, removeDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
