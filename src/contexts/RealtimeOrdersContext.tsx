/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Order } from '../types';

interface RealtimeOrdersContextType {
  orders: Order[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const RealtimeOrdersContext = createContext<RealtimeOrdersContextType | undefined>(undefined);

export function RealtimeOrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) { setOrders([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime subscription for order status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setOrders(prev => [payload.new as Order, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <RealtimeOrdersContext.Provider value={{ orders, loading, refresh: fetchOrders }}>
      {children}
    </RealtimeOrdersContext.Provider>
  );
}

export function useRealtimeOrders() {
  const ctx = useContext(RealtimeOrdersContext);
  if (!ctx) throw new Error('useRealtimeOrders must be used within RealtimeOrdersProvider');
  return ctx;
}
