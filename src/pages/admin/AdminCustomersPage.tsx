import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Order } from '../../types';
import { Search, Eye, X, ShoppingBag, Calendar } from 'lucide-react';

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userStats, setUserStats] = useState({ totalOrders: 0, totalSpent: 0 });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function viewCustomer(user: User) {
    setSelectedUser(user);
    const { data } = await supabase.from('orders').select('*, items:order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });
    const orders = data ?? [];
    setUserOrders(orders);
    setUserStats({
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    });
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s);
  });

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    shipped: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    delivered: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة العملاء</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{users.length} عميل</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الهاتف..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-white dark:bg-darkbg-card text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" dir="rtl" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkbg-lighter bg-white dark:bg-darkbg-card">
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">العميل</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">الهاتف</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">المدينة</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">الدور</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">تاريخ الانضمام</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-darkbg-lighter/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                          {u.full_name?.[0] || 'م'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{u.full_name || 'بدون اسم'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.phone || '-'}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.city || '-'}</td>
                    <td className="px-5 py-3">
                      {u.is_admin ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">مدير</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 dark:text-gray-400">عميل</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => viewCustomer(u)} className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">لا يوجد عملاء</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 px-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-2xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl mb-10 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between sticky top-0 bg-white dark:bg-darkbg-card z-10">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">تفاصيل العميل</h2>
              <button onClick={() => setSelectedUser(null)}><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl">
                  {selectedUser.full_name?.[0] || 'م'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedUser.full_name || 'بدون اسم'}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedUser.phone || 'بدون رقم هاتف'} | {selectedUser.city || 'بدون مدينة'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-3">
                  <ShoppingBag size={20} className="text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalOrders}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-3">
                  <Calendar size={20} className="text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي المشتريات (ج.م)</p>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">سجل الطلبات</h3>
                {userOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">لا توجد طلبات</p>
                ) : (
                  <div className="space-y-2">
                    {userOrders.map(order => (
                      <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[order.status]}`}>
                            {order.status === 'new' ? 'جديد' : order.status === 'processing' ? 'قيد المعالجة' : order.status === 'shipped' ? 'تم الشحن' : order.status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                          </span>
                          <span className="font-medium text-sm">{Number(order.total_amount).toFixed(2)} ج.م</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
