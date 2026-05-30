import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';
import { Search, Eye, X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

type OrderWithUser = Order & { user?: { full_name?: string; email?: string } | null };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    let query = supabase.from('orders').select('*, user:users(*), items:order_items(*)').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;
    setOrders((data as OrderWithUser[]) ?? []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrders(); }, [statusFilter]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.id.toLowerCase().includes(s) ||
      o.user?.full_name?.toLowerCase().includes(s) ||
      o.user?.email?.toLowerCase().includes(s) ||
      o.discount_code?.toLowerCase().includes(s);
  });

  async function updateStatus(orderId: string, newStatus: Order['status']) {
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) showToast(error.message, 'error');
    else {
      showToast('تم تحديث حالة الطلب');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);

      // Notify customer about status change
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          const session = await supabase.auth.getSession();
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'order_status', order_id: orderId, user_id: order.user_id }),
          });
        } catch { /* ignore */ }
      }
    }
    setUpdating(false);
  }

  const statusBtnColors: Record<string, string> = {
    new: 'bg-blue-600 hover:bg-blue-700',
    processing: 'bg-amber-600 hover:bg-amber-700',
    shipped: 'bg-cyan-600 hover:bg-cyan-700',
    delivered: 'bg-primary-600 hover:bg-primary-700',
    cancelled: 'bg-rose-600 hover:bg-rose-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{orders.length} طلب</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الطلب أو اسم العميل..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-white dark:bg-darkbg-card text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" dir="rtl" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-white dark:bg-darkbg-card text-gray-900 dark:text-white outline-none text-sm">
          <option value="">جميع الحالات</option>
          <option value="new">جديد</option>
          <option value="processing">قيد المعالجة</option>
          <option value="shipped">تم الشحن</option>
          <option value="delivered">تم التوصيل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-darkbg-lighter bg-white dark:bg-darkbg-card">
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">رقم الطلب</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">العميل</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">المبلغ</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-darkbg-lighter/30">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 dark:text-white">{order.user?.full_name || 'غير معروف'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{Number(order.total_amount).toFixed(2)} ج.م</td>
                    <td className="px-5 py-3">
                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value as Order['status'])} disabled={updating}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer text-gray-900 dark:text-white ${statusBtnColors[order.status]}`}>
                        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label.ar}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد طلبات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 px-4" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-2xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">تفاصيل الطلب #{selectedOrder.id.slice(0, 8)}</h2>
              <button onClick={() => setSelectedOrder(null)}><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">معلومات العميل</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">الاسم:</span> <span className="font-medium">{selectedOrder.user?.full_name}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">البريد:</span> <span className="font-medium">{selectedOrder.user?.email}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">الهاتف:</span> <span className="font-medium">{selectedOrder.shipping_phone || '-'}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">المدينة:</span> <span className="font-medium">{selectedOrder.shipping_city || '-'}</span></div>
                  {selectedOrder.shipping_address && <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">العنوان:</span> <span className="font-medium">{selectedOrder.shipping_address}</span></div>}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">عناصر الطلب</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product_image ? <img src={item.product_image} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name_ar}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} x {Number(item.unit_price).toFixed(2)} ج.م</p>
                      </div>
                      <span className="font-medium text-sm">{Number(item.total_price).toFixed(2)} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">المجموع</span><span className="font-medium">{Number(selectedOrder.total_amount + selectedOrder.discount_amount).toFixed(2)} ج.م</span></div>
                {selectedOrder.discount_amount > 0 && <div className="flex justify-between text-primary-600 dark:text-primary-400"><span>الخصم</span><span>- {Number(selectedOrder.discount_amount).toFixed(2)} ج.م</span></div>}
                <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-600 pt-2"><span>الإجمال</span><span className="text-primary-600 dark:text-primary-400">{Number(selectedOrder.total_amount).toFixed(2)} ج.م</span></div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ملاحظات</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Change Status */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-darkbg-lighter">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">تغيير الحالة:</span>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => updateStatus(selectedOrder.id, key as Order['status'])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-900 dark:text-white transition-colors ${statusBtnColors[key]} ${selectedOrder.status === key ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
                    {label.ar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
