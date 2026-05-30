import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ChevronDown, ChevronUp, ShoppingBag,
  Clock, RefreshCw, ArrowLeft,
} from 'lucide-react';
import { useRealtimeOrders } from '../contexts/RealtimeOrdersContext';
import { ORDER_STATUS_LABELS } from '../types';
import type { Order } from '../types';
import SEO from '../components/ui/SEO';

// ─── Status badge config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Order['status'], {
  bg: string;
  text: string;
  dot: string;
  pulse: boolean;
}> = {
  new: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    pulse: true,
  },
  processing: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    pulse: true,
  },
  shipped: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    dot: 'bg-cyan-500',
    pulse: false,
  },
  delivered: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-400',
    dot: 'bg-primary-500',
    pulse: false,
  },
  cancelled: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    pulse: false,
  },
};

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, changed = false }: { status: Order['status']; changed?: boolean }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${changed ? 'ring-2 ring-offset-1 ring-primary-400 dark:ring-primary-600' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {ORDER_STATUS_LABELS[status].ar}
    </span>
  );
}

// ─── Order Card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const prevStatusRef = useRef(order.status);
  const [statusChanged, setStatusChanged] = useState(false);

  // Detect live status change
  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      prevStatusRef.current = order.status;
      setStatusChanged(true);
      const timer = setTimeout(() => setStatusChanged(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [order.status]);

  const formattedDate = new Date(order.created_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`bg-white dark:bg-darkbg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
      statusChanged
        ? 'border-primary-400 dark:border-primary-600 shadow-md shadow-primary-100 dark:shadow-primary-900/30'
        : 'border-gray-200 dark:border-darkbg-lighter'
    }`}>
      {/* Live update indicator */}
      {statusChanged && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 px-5 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
          <span className="text-xs text-primary-700 dark:text-primary-400 font-medium">
            تم تحديث حالة الطلب
          </span>
        </div>
      )}

      {/* Card header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                طلب #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={11} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={order.status} changed={statusChanged} />
            <span className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">
              {order.total_amount.toFixed(2)} ج.م
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        {order.items && order.items.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-4 w-full flex items-center justify-between pt-4 border-t border-gray-200 dark:border-darkbg-lighter text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span>{order.items.length} منتج</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Expandable order items */}
      {expanded && order.items && (
        <div className="border-t border-gray-200 dark:border-darkbg-lighter px-5 pb-5 pt-4 space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.product_name_ar}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {item.product_name_ar}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.unit_price.toFixed(2)} ج.م × {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {item.total_price.toFixed(2)} ج.م
              </span>
            </div>
          ))}

          {/* Summary row */}
          <div className="pt-3 border-t border-gray-200 dark:border-darkbg-lighter flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">إجمالي الطلب</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {order.total_amount.toFixed(2)} ج.م
            </span>
          </div>

          {order.shipping_city && (
            <div className="text-xs text-gray-500">
              توصيل إلى: {order.shipping_city}
              {order.shipping_address ? ` - ${order.shipping_address}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, loading, refresh } = useRealtimeOrders();

  return (
    <>
      <SEO
        title="طلباتي | سيريوس هاند ميد"
        description="تتبع طلباتك ومراجعة حالة التوصيل في الوقت الفعلي"
        url="/orders"
      />

      <div dir="rtl" className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              طلباتي
            </h1>
            {!loading && orders.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {orders.length} طلب
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            aria-label="تحديث الطلبات"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>

        {/* ── Live indicator ── */}
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          يتم تحديث حالة الطلبات تلقائياً
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter flex items-center justify-center mb-5">
              <Package size={36} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
              لا توجد طلبات بعد
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-xs">
              لم تقم بأي طلب حتى الآن. تصفح منتجاتنا الجميلة وأتمم أول طلب!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              تسوق الآن
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}

        {/* ── Orders list ── */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
