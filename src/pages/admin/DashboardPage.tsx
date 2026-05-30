import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Package, Users, ShoppingCart, DollarSign, Clock, BarChart3, Tag, MessageSquare } from 'lucide-react';
import type { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';

interface Stats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalSales: number;
  pendingReviews: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalUsers: 0, totalOrders: 0, totalSales: 0, pendingReviews: 0 });
  const [recentOrders, setRecentOrders] = useState<(Order & { user?: { full_name: string; email: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prodRes, userRes, orderRes, salesRes, pendingReviewsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*, user:users(full_name, email)').order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('total_amount'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      ]);

      const totalSales = (salesRes.data ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalOrders = salesRes.data?.length ?? 0;

      setStats({
        totalProducts: prodRes.count ?? 0,
        totalUsers: userRes.count ?? 0,
        totalOrders,
        totalSales,
        pendingReviews: pendingReviewsRes.count ?? 0,
      });
      setRecentOrders(orderRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    shipped: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    delivered: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  const statCards = [
    { label: 'إجمالي المنتجات', value: stats.totalProducts, icon: Package, color: 'primary' },
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: 'amber' },
    { label: 'إجمالي المبيعات', value: `${stats.totalSales.toFixed(2)} ج.م`, icon: DollarSign, color: 'primary' },
    { label: 'تقييمات معلقة', value: stats.pendingReviews, icon: MessageSquare, color: 'amber' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">نظرة عامة على المتجر</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map(card => (
              <div key={card.label} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    card.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/30' :
                    card.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
                    card.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' :
                    'bg-primary-50 dark:bg-primary-900/30'
                  }`}>
                    <card.icon size={20} className={
                      card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                      card.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      card.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                      'text-primary-600 dark:text-primary-400'
                    } />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link to="/admin/analytics" className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-gray-900 dark:text-white hover:shadow-lg hover:shadow-primary-600/20 transition-all group">
              <BarChart3 size={24} className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
              <p className="font-bold text-lg">التحليلات والتقارير</p>
              <p className="text-sm text-primary-100">عرض الإحصائيات والرسوم البيانية</p>
            </Link>
            <Link to="/admin/discounts" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-gray-900 dark:text-white hover:shadow-lg hover:shadow-amber-600/20 transition-all group">
              <Tag size={24} className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
              <p className="font-bold text-lg">إدارة الخصومات</p>
              <p className="text-sm text-amber-100">إنشاء وإدارة أكواد الخصم</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Clock size={18} /> أحدث الطلبات</h2>
              <Link to="/admin/orders" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">عرض الكل</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">لا توجد طلبات بعد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-darkbg-lighter">
                      <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">رقم الطلب</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">العميل</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">المبلغ</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-darkbg-lighter/30">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{order.user?.full_name || 'غير معروف'}</td>
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{Number(order.total_amount).toFixed(2)} ج.م</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${statusColors[order.status]}`}>
                            {ORDER_STATUS_LABELS[order.status].ar}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
