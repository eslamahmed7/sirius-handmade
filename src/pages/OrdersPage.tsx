import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package, ChevronDown, ChevronUp, ShoppingBag,
  Clock, RefreshCw, ArrowLeft,
} from 'lucide-react';
import { useRealtimeOrders } from '../contexts/RealtimeOrdersContext';
import { ORDER_STATUS_LABELS } from '../types';
import type { Order } from '../types';
import SEO from '../components/ui/SEO';

const CITY_LABELS: Record<string, { ar: string; en: string }> = {
  'القاهرة': { ar: 'القاهرة', en: 'Cairo' },
  'الإسكندرية': { ar: 'الإسكندرية', en: 'Alexandria' },
  'الجيزة': { ar: 'الجيزة', en: 'Giza' },
  'القليوبية': { ar: 'القليوبية', en: 'Qalyubia' },
  'شرم الشيخ': { ar: 'شرم الشيخ', en: 'Sharm El-Sheikh' },
  'الغردقة': { ar: 'الغردقة', en: 'Hurghada' },
  'المنصورة': { ar: 'المنصورة', en: 'Mansoura' },
  'طنطا': { ar: 'طنطا', en: 'Tanta' },
  'أسيوط': { ar: 'أسيوط', en: 'Asyut' },
  'أسوان': { ar: 'أسوان', en: 'Aswan' },
  'أخرى': { ar: 'أخرى', en: 'Other' },
};

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
  const { i18n } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${changed ? 'ring-2 ring-offset-1 ring-primary-400 dark:ring-primary-600' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {ORDER_STATUS_LABELS[status][i18n.language as 'ar' | 'en']}
    </span>
  );
}

// ─── Order Card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const prevStatusRef = useRef(order.status);
  const [statusChanged, setStatusChanged] = useState(false);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Detect live status change
  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      prevStatusRef.current = order.status;
      setStatusChanged(true);
      const timer = setTimeout(() => setStatusChanged(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [order.status]);

  const formattedDate = new Date(order.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`bg-white dark:bg-darkbg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
      statusChanged
        ? 'border-primary-400 dark:border-primary-600 shadow-md shadow-primary-100 dark:shadow-primary-900/30'
        : 'border-gray-200 dark:border-darkbg-lighter'
    } text-start`}>
      {/* Live update indicator */}
      {statusChanged && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 px-5 py-2 flex items-center gap-2 justify-start">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
          <span className="text-xs text-primary-700 dark:text-primary-400 font-medium">
            {t('orders.order_card.status_updated')}
          </span>
        </div>
      )}

      {/* Card header */}
      <div className="p-5 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 justify-start">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 text-start">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('orders.order_card.id', { id: order.id.slice(0, 8).toUpperCase() })}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-start">
                <Clock size={11} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 justify-start sm:justify-end">
            <StatusBadge status={order.status} changed={statusChanged} />
            <span className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">
              {order.total_amount.toFixed(2)} {t('orders.order_card.currency')}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        {order.items && order.items.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-4 w-full flex items-center justify-between pt-4 border-t border-gray-200 dark:border-darkbg-lighter text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span>{order.items.length === 1 ? t('orders.order_card.product_count_one') : t('orders.order_card.product_count_other', { count: order.items.length })}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Expandable order items */}
      {expanded && order.items && (
        <div className="border-t border-gray-200 dark:border-darkbg-lighter px-5 pb-5 pt-4 space-y-3 text-start">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 text-sm justify-start">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={isAr ? item.product_name_ar : item.product_name_en}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {isAr ? item.product_name_ar : item.product_name_en}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.unit_price.toFixed(2)} {t('orders.order_card.currency')} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {item.total_price.toFixed(2)} {t('orders.order_card.currency')}
              </span>
            </div>
          ))}

          {/* Summary row */}
          <div className="pt-3 border-t border-gray-200 dark:border-darkbg-lighter flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('orders.order_card.total_price')}</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {order.total_amount.toFixed(2)} {t('orders.order_card.currency')}
            </span>
          </div>

          {order.shipping_city && (
            <div className="text-xs text-gray-500 text-start">
              {t('orders.order_card.delivery_to', { city: CITY_LABELS[order.shipping_city] ? (isAr ? CITY_LABELS[order.shipping_city].ar : CITY_LABELS[order.shipping_city].en) : order.shipping_city })}
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
  const { t, i18n } = useTranslation();

  return (
    <>
      <SEO
        title={t('orders.seo_title')}
        description={t('orders.seo_desc')}
        url="/orders"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-start">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('orders.title')}
            </h1>
            {!loading && orders.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {orders.length === 1 ? t('orders.order_count_one') : t('orders.order_count_other', { count: orders.length })}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            aria-label={t('orders.refresh')}
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{t('orders.refresh')}</span>
          </button>
        </div>

        {/* ── Live indicator ── */}
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500 justify-start">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          {t('orders.live_update')}
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
              {t('orders.empty_title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-xs">
              {t('orders.empty_desc')}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              {t('orders.shop_now')}
              <ArrowLeft size={16} className="rtl:rotate-0 ltr:rotate-180" />
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
