import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { AnalyticsData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowDown,
  FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const STATUS_LABELS: Record<string, string> = {
  new: 'جديد', processing: 'قيد المعالجة', shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', processing: '#f59e0b', shipped: '#06b6d4', delivered: '#059669', cancelled: '#ef4444',
};

export default function AdminAnalyticsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('monthly');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      let dateFilterStr = '';
      let dateFilterDate = new Date(0);
      
      if (period === 'daily') {
        dateFilterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'weekly') {
        dateFilterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'monthly') {
        dateFilterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      } else if (period === 'yearly') {
        dateFilterDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      }
      dateFilterStr = dateFilterDate.toISOString();

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, discount_amount, created_at, status')
        .gte('created_at', dateFilterStr)
        .order('created_at', { ascending: true });
        
      if (ordersError) throw ordersError;

      const revenueByPeriod: Record<string, { revenue: number; orders: number; discounts: number }> = {};
      const ordersByStatus: Record<string, number> = { new: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
      const orderGrowth: Record<string, number> = {};
      let totalRevenue = 0;
      let totalDiscounts = 0;
      
      const uniqueBuyers = new Set();

      for (const order of orders || []) {
        totalRevenue += Number(order.total_amount || 0);
        totalDiscounts += Number(order.discount_amount || 0);
        
        if (order.user_id) uniqueBuyers.add(order.user_id);
        
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        
        const d = new Date(order.created_at);
        let key = '';
        if (period === 'daily') key = d.toISOString().split('T')[0];
        else if (period === 'weekly') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          key = new Date(d.setDate(diff)).toISOString().split('T')[0];
        } else if (period === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        else key = `${d.getFullYear()}`;

        if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, orders: 0, discounts: 0 };
        revenueByPeriod[key].revenue += Number(order.total_amount || 0);
        revenueByPeriod[key].orders += 1;
        revenueByPeriod[key].discounts += Number(order.discount_amount || 0);
        
        orderGrowth[key] = (orderGrowth[key] || 0) + 1;
      }

      let items = [];
      if (orders?.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, product_name_ar, product_name_en, quantity, total_price, order_id')
          .in('order_id', orders.map(o => o.id));
        if (data) items = data;
      }

      const productMap: Record<string, { name_ar: string; name_en: string; quantity: number; revenue: number }> = {};
      for (const item of items) {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name_ar: item.product_name_ar, name_en: item.product_name_en || item.product_name_ar, quantity: 0, revenue: 0 };
        }
        productMap[item.product_id].quantity += Number(item.quantity || 0);
        productMap[item.product_id].revenue += Number(item.total_price || 0);
      }
      
      const productSales = Object.entries(productMap).map(([id, vals]) => ({ id, ...vals }));
      productSales.sort((a, b) => b.quantity - a.quantity);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, created_at, is_admin')
        .gte('created_at', dateFilterStr)
        .order('created_at', { ascending: true });

      const customerGrowth: Record<string, number> = {};
      let totalCustomers = 0;
      
      for (const u of users || []) {
        if (u.is_admin) continue;
        totalCustomers++;
        
        const d = new Date(u.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        customerGrowth[key] = (customerGrowth[key] || 0) + 1;
      }

      const conversionRate = totalCustomers > 0 ? ((uniqueBuyers.size / totalCustomers) * 100).toFixed(1) : '0';

      const analyticsData = {
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalDiscounts,
        avgOrderValue: orders?.length ? totalRevenue / orders.length : 0,
        revenueByPeriod: Object.entries(revenueByPeriod).map(([p, vals]) => ({ period: p, ...vals })),
        topProducts: productSales.slice(0, 10),
        lowestProducts: productSales.slice(-10).reverse(),
        totalProductsSold: productSales.reduce((s, p) => s + p.quantity, 0),
        productRevenue: productSales.reduce((s, p) => s + p.revenue, 0),
        totalCustomers,
        customerGrowth: Object.entries(customerGrowth).map(([p, count]) => ({ period: p, count })),
        uniqueBuyingCustomers: uniqueBuyers.size,
        ordersByStatus,
        orderGrowth: Object.entries(orderGrowth).map(([p, count]) => ({ period: p, count })),
        conversionMetrics: {
          totalUsers: totalCustomers,
          buyingUsers: uniqueBuyers.size,
          conversionRate
        }
      };

      setData(analyticsData as AnalyticsData);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل التحليلات', 'error');
    }
    setLoading(false);
  }, [user, period, showToast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const exportPDF = async () => {
    window.print();
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      if (data) {
        // Summary sheet
        const summaryData = [
          ['Metric', 'Value'],
          ['Total Revenue', data.totalRevenue],
          ['Total Orders', data.totalOrders],
          ['Avg Order Value', data.avgOrderValue],
          ['Total Discounts', data.totalDiscounts],
          ['Total Customers', data.totalCustomers],
          ['Buying Customers', data.uniqueBuyingCustomers],
          ['Conversion Rate', `${data.conversionMetrics?.conversionRate}%`],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

        // Revenue sheet
        if (data.revenueByPeriod?.length) {
          const revData = [['Period', 'Revenue', 'Orders', 'Discounts'], ...data.revenueByPeriod.map(r => [r.period, r.revenue, r.orders, r.discounts])];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revData), 'Revenue');

        }

        // Products sheet
        if (data.topProducts?.length) {
          const prodData = [['Product', 'Quantity', 'Revenue'], ...data.topProducts.map(p => [p.name_en, p.quantity, p.revenue])];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), 'Top Products');
        }

        // Customers sheet
        if (data.customerGrowth?.length) {
          const custData = [['Period', 'New Customers'], ...data.customerGrowth.map(c => [c.period, c.count])];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(custData), 'Customer Growth');
        }

        // Orders sheet
        if (data.orderGrowth?.length) {
          const ordData = [['Period', 'Orders'], ...data.orderGrowth.map(o => [o.period, o.count])];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ordData), 'Order Growth');
        }
      }

      XLSX.writeFile(wb, `analytics-report-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('تم تصدير التقرير Excel');
    } catch { showToast('فشل تصدير Excel', 'error'); }
    setExporting(false);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
        <p className="text-gray-500 dark:text-gray-400 text-sm">جاري تحميل التحليلات...</p>
      </div>
    );
  }

  const pieData = Object.entries(data.ordersByStatus || {}).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key, value, color: STATUS_COLORS[key],
  })).filter(d => d.value > 0);

  return (
    <div>
      {/* ─── Dashboard View (Hidden on Print) ─── */}
      <div className="print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">التحليلات والتقارير</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إحصائيات وتحليلات الأداء</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <div className="flex bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-xl overflow-hidden">
              {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    period === p ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-lighter'
                  }`}>
                  {p === 'daily' ? 'يومي' : p === 'weekly' ? 'أسبوعي' : p === 'monthly' ? 'شهري' : 'سنوي'}
                </button>
              ))}
            </div>
            {/* Export buttons */}
            <button onClick={exportPDF} disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-medium rounded-xl transition-colors">
              <FileText size={14} /> PDF
            </button>
            <button onClick={exportExcel} disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-xs font-medium rounded-xl transition-colors">
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'إجمالي الإيرادات', value: `${data.totalRevenue?.toFixed(2) || 0} ج.م`, icon: DollarSign, color: 'primary', trend: null },
            { label: 'إجمالي الطلبات', value: data.totalOrders || 0, icon: ShoppingBag, color: 'blue', trend: null },
            { label: 'متوسط قيمة الطلب', value: `${data.avgOrderValue?.toFixed(2) || 0} ج.م`, icon: TrendingUp, color: 'primary', trend: null },
            { label: 'معدل التحويل', value: `${data.conversionMetrics?.conversionRate || 0}%`, icon: Users, color: 'amber', trend: null },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                card.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/30' :
                card.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
                card.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/30' :
                'bg-amber-50 dark:bg-amber-900/30'
              }`}>
                <card.icon size={20} className={
                  card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                  card.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                  'text-amber-600 dark:text-amber-400'
                } />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1: Revenue + Order Status */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">اتجاه الإيرادات</h3>
            {data.revenueByPeriod?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueByPeriod}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${Number(v).toFixed(2)} ج.م`, 'الإيرادات']} />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">لا توجد بيانات</div>
            )}
          </div>

          {/* Order Status Pie */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">حالات الطلبات</h3>
            {pieData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip formatter={(v: any) => [Number(v), 'طلبات']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map(d => (
                    <span key={d.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">لا توجد طلبات</div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Orders + Customers */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Order Growth */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">نمو الطلبات</h3>
            {data.orderGrowth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.orderGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [Number(v), 'طلبات']} />
                  <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} name="الطلبات" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">لا توجد بيانات</div>
            )}
          </div>

          {/* Customer Growth */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">نمو العملاء</h3>
            {data.customerGrowth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [Number(v), 'عملاء جدد']} />
                  <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} dot={{ fill: '#0d9488', r: 4 }} name="عملاء جدد" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* Charts Row 3: Top Products + Revenue + Discounts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Top Products */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={18} /> الأكثر مبيعاً</h3>
            {data.topProducts?.length > 0 ? (
              <div className="space-y-3">
                {data.topProducts.slice(0, 6).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white ${i < 3 ? 'bg-primary-500' : 'bg-gray-400'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {isAr ? p.name_ar : (p.name_en || p.name_ar)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.quantity} قطعة</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{p.revenue.toFixed(0)} ج.م</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-sm">لا توجد بيانات</div>
            )}
          </div>

          {/* Lowest Products */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><ArrowDown size={18} /> الأقل مبيعاً</h3>
            {data.lowestProducts?.length > 0 ? (
              <div className="space-y-3">
                {data.lowestProducts.slice(0, 6).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white bg-rose-400">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {isAr ? p.name_ar : (p.name_en || p.name_ar)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.quantity} قطعة</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{p.revenue.toFixed(0)} ج.م</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-sm">لا توجد بيانات</div>
            )}
          </div>

          {/* Revenue vs Discounts */}
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">الإيرادات مقابل الخصومات</h3>
            {data.revenueByPeriod?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.revenueByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} name="الإيرادات" />
                  <Bar dataKey="discounts" fill="#f59e0b" radius={[4, 4, 0, 0]} name="الخصومات" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-gray-500 dark:text-gray-400 text-sm">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">مقاييس التحويل</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.totalCustomers || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">إجمالي المستخدمين</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مستخدمين مسجلين</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-primary-200 dark:border-primary-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.uniqueBuyingCustomers || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">عملاء شراء</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مستخدمين قاموا بالشراء</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-primary-200 dark:border-primary-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.conversionMetrics?.conversionRate || 0}%</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">معدل التحويل</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">نسبة المشترين</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Printable Tabular Report (Visible only on Print) ─── */}
      <div className="hidden print:block text-black bg-white">
        <h1 className="text-3xl font-bold mb-2">سيريوس هاند ميد - تقرير التحليلات</h1>
        <p className="text-gray-600 mb-8 border-b border-gray-300 pb-4">
          الفترة: {period === 'daily' ? 'يومي' : period === 'weekly' ? 'أسبوعي' : period === 'monthly' ? 'شهري' : 'سنوي'} | تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}
        </p>

        {/* Summary Table */}
        <h2 className="text-xl font-bold text-gray-800 mb-3 bg-[#059669] text-white p-2">ملخص الأداء</h2>
        <table className="w-full text-right mb-8 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border border-gray-300 w-1/2">المقياس</th>
              <th className="p-3 border border-gray-300 w-1/2">القيمة</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-3 border border-gray-300 font-semibold">إجمالي الإيرادات</td><td className="p-3 border border-gray-300">{data.totalRevenue?.toFixed(2)} ج.م</td></tr>
            <tr className="bg-gray-50"><td className="p-3 border border-gray-300 font-semibold">إجمالي الطلبات</td><td className="p-3 border border-gray-300">{data.totalOrders || 0}</td></tr>
            <tr><td className="p-3 border border-gray-300 font-semibold">متوسط قيمة الطلب</td><td className="p-3 border border-gray-300">{data.avgOrderValue?.toFixed(2)} ج.م</td></tr>
            <tr className="bg-gray-50"><td className="p-3 border border-gray-300 font-semibold">إجمالي الخصومات</td><td className="p-3 border border-gray-300">{data.totalDiscounts?.toFixed(2)} ج.م</td></tr>
            <tr><td className="p-3 border border-gray-300 font-semibold">إجمالي المستخدمين</td><td className="p-3 border border-gray-300">{data.totalCustomers || 0}</td></tr>
            <tr className="bg-gray-50"><td className="p-3 border border-gray-300 font-semibold">العملاء المشترين</td><td className="p-3 border border-gray-300">{data.uniqueBuyingCustomers || 0}</td></tr>
            <tr><td className="p-3 border border-gray-300 font-semibold">معدل التحويل</td><td className="p-3 border border-gray-300">{data.conversionMetrics?.conversionRate || 0}%</td></tr>
          </tbody>
        </table>

        {/* Top Products Table */}
        {data.topProducts?.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-800 mb-3 bg-[#0d9488] text-white p-2">المنتجات الأكثر مبيعاً</h2>
            <table className="w-full text-right mb-8 border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-300">المنتج</th>
                  <th className="p-3 border border-gray-300">الكمية المباعة</th>
                  <th className="p-3 border border-gray-300">الإيرادات (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="p-3 border border-gray-300">
                      {isAr ? p.name_ar : (p.name_en || p.name_ar)}
                    </td>
                    <td className="p-3 border border-gray-300">{p.quantity}</td>
                    <td className="p-3 border border-gray-300">{p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Status Table */}
        {data.ordersByStatus && (
          <div className="break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-800 mb-3 bg-[#0ea5e9] text-white p-2">حالات الطلبات</h2>
            <table className="w-full text-right mb-8 border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-300 w-1/2">الحالة</th>
                  <th className="p-3 border border-gray-300 w-1/2">العدد</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.ordersByStatus).map(([k, v], i) => (
                  <tr key={k} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="p-3 border border-gray-300">{STATUS_LABELS[k] || k}</td>
                    <td className="p-3 border border-gray-300">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
