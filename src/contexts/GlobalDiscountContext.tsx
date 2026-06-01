import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Discount, Product } from '../types';

interface GlobalDiscountContextType {
  activeGlobalDiscount: Discount | null;
  applyGlobalDiscount: (product: Product) => Product;
  refreshGlobalDiscount: () => Promise<void>;
}

const GlobalDiscountContext = createContext<GlobalDiscountContextType | undefined>(undefined);

export function GlobalDiscountProvider({ children }: { children: ReactNode }) {
  const [activeGlobalDiscount, setActiveGlobalDiscount] = useState<Discount | null>(null);

  const refreshGlobalDiscount = async () => {
    const now = new Date();
    
    // Fetch all global, auto-apply, active discounts
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('scope', 'global')
      .eq('auto_apply', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      setActiveGlobalDiscount(null);
      return;
    }

    // Find the first one that is currently valid
    const validDiscount = data.find(d => {
      const startsAt = new Date(d.starts_at);
      const expiresAt = d.expires_at ? new Date(d.expires_at) : null;
      
      if (startsAt > now) return false;
      if (expiresAt && expiresAt < now) return false;
      return true;
    });

    setActiveGlobalDiscount(validDiscount || null);
  };

  useEffect(() => {
    refreshGlobalDiscount();
    
    // Re-check periodically in case a discount expires naturally
    const interval = setInterval(() => {
      refreshGlobalDiscount();
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, []);

  const applyGlobalDiscount = (product: Product): Product => {
    if (!activeGlobalDiscount) return product;

    const discountValue = activeGlobalDiscount.discount_value;
    const originalPrice = product.price;
    
    let newDiscountPrice = originalPrice;

    if (activeGlobalDiscount.discount_type === 'percentage') {
      newDiscountPrice = originalPrice - (originalPrice * (discountValue / 100));
    } else {
      newDiscountPrice = Math.max(0, originalPrice - discountValue);
    }

    // Round the price to the nearest whole number to look cleaner
    newDiscountPrice = Math.round(newDiscountPrice);

    return {
      ...product,
      discount_price: newDiscountPrice,
    };
  };

  return (
    <GlobalDiscountContext.Provider value={{ activeGlobalDiscount, applyGlobalDiscount, refreshGlobalDiscount }}>
      {children}
    </GlobalDiscountContext.Provider>
  );
}

export function useGlobalDiscount() {
  const context = useContext(GlobalDiscountContext);
  if (context === undefined) {
    throw new Error('useGlobalDiscount must be used within a GlobalDiscountProvider');
  }
  return context;
}
