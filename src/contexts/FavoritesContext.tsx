/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Favorite } from '../types';

interface FavoritesContextType {
  favorites: Favorite[];
  favoriteIds: Set<string>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const favoriteIds = new Set(favorites.map(f => f.product_id));

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('*, product:products(*, category:categories(*), images:product_images(*))')
      .eq('user_id', user.id);
    setFavorites(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const isFavorite = (productId: string) => favoriteIds.has(productId);

  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    if (isFavorite(productId)) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('product_id', productId);
      setFavorites(prev => prev.filter(f => f.product_id !== productId));
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: user.id, product_id: productId,
      }).select('*, product:products(*, category:categories(*), images:product_images(*))')
        .maybeSingle();
      if (data) setFavorites(prev => [...prev, data]);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteIds, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}
