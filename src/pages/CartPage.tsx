import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Tag,
  MapPin, Phone, User, FileText, ChevronRight, ChevronLeft,
  CheckCircle2, Package,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, supabaseUrl } from '../lib/supabase';
import SEO from '../components/ui/SEO';
import { validatePhone, sanitizeText } from '../lib/security';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'cart' | 'shipping' | 'confirm';

interface ShippingForm {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  address?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EGYPT_CITIES = [
  'القاهرة',
  'الإسكندرية',
  'الجيزة',
  'القليوبية',
  'شرم الشيخ',
  'الغردقة',
  'المنصورة',
  'طنطا',
  'أسيوط',
  'أسوان',
  'أخرى',
];

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: Step; steps: { id: Step; label: string }[] }) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {steps.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-primary-600 text-white' : active ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
              >
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary-700 dark:text-primary-400' : done ? 'text-primary-600 dark:text-primary-500' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-1 mb-4 transition-all ${done ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, discountCode, discountAmount, applyDiscount, removeDiscount } = useCart();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const steps = [
    { id: 'cart' as Step, label: t('cart.steps.cart') },
    { id: 'shipping' as Step, label: t('cart.steps.shipping') },
    { id: 'confirm' as Step, label: t('cart.steps.confirm') },
  ];

  const [step, setStep] = useState<Step>('cart');
  const [discountInput, setDiscountInput] = useState('');
  const [placing, setPlacing] = useState(false);

  const [form, setForm] = useState<ShippingForm>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill from profile when available
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
        city: prev.city || (EGYPT_CITIES.includes(profile.city) ? profile.city : '') || '',
        address: prev.address || profile.address || '',
      }));
    }
  }, [profile]);

  const shippingFee = totalPrice > 200 ? 0 : 25;
  const grandTotal = totalPrice + shippingFee;

  // ── Discount ──────────────────────────────────────────────────────────────

  const handleDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    const ok = await applyDiscount(code);
    if (ok) {
      showToast(t('cart.discount.toast_applied'));
      setDiscountInput('');
    } else {
      showToast(t('cart.discount.toast_invalid'), 'error');
    }
  };

  // ── Form validation ───────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: FormErrors = {};

    const name = form.fullName.trim();
    if (!name) errs.fullName = t('cart.shipping_form.errors.name_required');
    else if (name.length < 3) errs.fullName = t('cart.shipping_form.errors.name_short');

    if (!form.phone.trim()) {
      errs.phone = t('cart.shipping_form.errors.phone_required');
    } else if (!validatePhone(form.phone.trim())) {
      errs.phone = t('cart.shipping_form.errors.phone_invalid');
    }

    if (!form.city) errs.city = t('cart.shipping_form.errors.city_required');

    const addr = form.address.trim();
    if (!addr) errs.address = t('cart.shipping_form.errors.address_required');
    else if (addr.length < 5) errs.address = t('cart.shipping_form.errors.address_short');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleShippingNext = () => {
    if (validate()) {
      setStep('confirm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Place order ───────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast(t('cart.confirm_step.toast_login'), 'error');
      return;
    }
    if (items.length === 0) return;
    setPlacing(true);

    const safeAddress = sanitizeText(form.address);
    const safeNotes = sanitizeText(form.notes);
    const safeName = sanitizeText(form.fullName);
    
    // Prepend name to notes since shipping_name column might not exist remotely
    const finalNotes = safeName 
      ? (isAr 
          ? `الاسم: ${safeName}${safeNotes ? `\nملاحظات: ${safeNotes}` : ''}` 
          : `Name: ${safeName}${safeNotes ? `\nNotes: ${safeNotes}` : ''}`) 
      : safeNotes;

    const { data: orderData, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: grandTotal,
        discount_amount: discountAmount,
        discount_code: discountCode || null,
        shipping_address: safeAddress,
        shipping_city: form.city,
        shipping_phone: form.phone.trim(),
        notes: finalNotes || null,
      })
      .select()
      .maybeSingle();

    if (error || !orderData) {
      showToast(error?.message || t('cart.confirm_step.toast_error'), 'error');
      console.error('Order Insert Error:', error);
      setPlacing(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_name_ar: item.product.name_ar,
      product_name_en: item.product.name_en,
      quantity: item.quantity,
      unit_price: item.product.discount_price ?? item.product.price,
      total_price: (item.product.discount_price ?? item.product.price) * item.quantity,
      product_image: item.product.images?.[0]?.image_url ?? '',
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      showToast(itemsError.message || t('cart.confirm_step.toast_items_error'), 'error');
      console.error('Order Items Insert Error:', itemsError);
      setPlacing(false);
      return;
    }

    clearCart();
    showToast(t('cart.confirm_step.toast_success'));

    // Send notification to admins about new order
    try {
      const session = await supabase.auth.getSession();
      await fetch(`${supabaseUrl}/functions/v1/notify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'new_order', order_id: orderData.id, user_id: user.id }),
      });
    } catch { /* ignore */ }

    navigate('/orders');
  };

  // ── Empty cart ────────────────────────────────────────────────────────────

  if (items.length === 0 && step === 'cart') {
    return (
      <>
        <SEO title={t('cart.seo_title')} description={t('cart.seo_desc')} url="/cart" />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-500 dark:text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('cart.empty_title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('cart.empty_desc')}</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft size={18} className="rtl:rotate-0 ltr:rotate-180" />
            {t('cart.shop_now')}
          </Link>
        </div>
      </>
    );
  }

  // ── Shared order summary sidebar ──────────────────────────────────────────

  const OrderSummary = () => (
    <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 sticky top-24 text-start">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-start">
        <Package size={18} className="text-primary-600" />
        {t('cart.summary.title')}
      </h3>

      {/* Items preview */}
      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
        {items.map((item) => {
          const price = item.product.discount_price ?? item.product.price;
          return (
            <div key={item.product.id} className="flex items-center gap-2 text-sm justify-start">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.images?.[0]?.image_url
                  ? <img src={item.product.images[0].image_url} alt={isAr ? item.product.name_ar : item.product.name_en} className="w-full h-full object-cover" />
                  : <ShoppingBag size={14} className="m-auto mt-1.5 text-gray-500 dark:text-gray-400" />}
              </div>
              <span className="flex-1 text-gray-600 dark:text-gray-300 line-clamp-1 text-start">{isAr ? item.product.name_ar : item.product.name_en}</span>
              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">×{item.quantity}</span>
              <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{(price * item.quantity).toFixed(2)} {t('product_detail.currency')}</span>
            </div>
          );
        })}
      </div>

      <hr className="border-gray-200 dark:border-darkbg-lighter mb-4" />

      {/* Totals */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('cart.summary.subtotal')}</span>
          <span className="font-medium text-gray-900 dark:text-white">{(totalPrice + discountAmount).toFixed(2)} {t('product_detail.currency')}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-primary-600 dark:text-primary-400">
            <span>{t('cart.summary.discount', { code: discountCode })}</span>
            <span>- {discountAmount.toFixed(2)} {t('product_detail.currency')}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('cart.summary.shipping')}</span>
          <span className={`font-medium ${shippingFee === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
            {shippingFee === 0 ? t('cart.summary.shipping_free') : `${shippingFee} ${t('product_detail.currency')}`}
          </span>
        </div>
        <hr className="border-gray-200 dark:border-darkbg-lighter" />
        <div className="flex justify-between text-base font-bold">
          <span className="text-gray-900 dark:text-white">{t('cart.summary.total')}</span>
          <span className="text-primary-600 dark:text-primary-400">{grandTotal.toFixed(2)} {t('product_detail.currency')}</span>
        </div>
      </div>

      {shippingFee > 0 && (
        <p className="text-xs text-gray-500 text-center mt-3">
          {t('cart.summary.free_shipping_notice', { amount: (200 - totalPrice).toFixed(2) })}
        </p>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO title={t('cart.seo_title')} description={t('cart.seo_desc')} url="/cart" />
      <div className="max-w-7xl mx-auto px-4 py-8 text-start">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-start">{t('cart.title')}</h1>

        <StepIndicator current={step} steps={steps} />

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left column: step content ─────────────────────────────────── */}
          <div className="lg:col-span-2">

            {/* STEP 1: Cart review */}
            {step === 'cart' && (
              <div className="space-y-4">
                {items.map((item) => {
                  const price = item.product.discount_price ?? item.product.price;
                  return (
                    <div key={item.product.id} className="flex gap-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-4 text-start">
                      <Link to={`/product/${item.product.slug}`} className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                        {item.product.images?.[0]?.image_url
                          ? <img src={item.product.images[0].image_url} alt={isAr ? item.product.name_ar : item.product.name_en} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={20} className="text-gray-500 dark:text-gray-400" /></div>}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link to={`/product/${item.product.slug}`} className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-start block">
                            {isAr ? item.product.name_ar : item.product.name_en}
                          </Link>
                          {item.product.discount_price ? (
                            <div className="flex items-center gap-2 mt-1 justify-start">
                              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{item.product.discount_price} {t('product_detail.currency')}</span>
                              <span className="text-gray-500 dark:text-gray-400 line-through text-xs">{item.product.price} {t('product_detail.currency')}</span>
                            </div>
                          ) : (
                            <p className="text-primary-600 dark:text-primary-400 font-bold mt-1 text-sm text-start">{price} {t('product_detail.currency')}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 dark:border-darkbg-lighter rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{(price * item.quantity).toFixed(2)} {t('product_detail.currency')}</span>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Discount code */}
                <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-4 text-start">
                  {!discountCode ? (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5 justify-start">
                        <Tag size={14} className="text-primary-600" />
                        {t('cart.discount.label')}
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDiscount()}
                            placeholder={t('cart.discount.placeholder')}
                            className="w-full pr-3 pl-3 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all text-start"
                          />
                        </div>
                        <button
                          onClick={handleDiscount}
                          className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t('cart.discount.apply')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-sm text-primary-700 dark:text-primary-400 font-medium">{t('cart.discount.applied', { code: discountCode })}</span>
                        <span className="text-xs text-primary-600 dark:text-primary-500">(-{discountAmount.toFixed(2)} {t('product_detail.currency')})</span>
                      </div>
                      <button onClick={removeDiscount} className="text-xs text-rose-500 hover:text-rose-600 hover:underline transition-colors">{t('cart.discount.remove')}</button>
                    </div>
                  )}
                </div>

                {/* Next button */}
                <button
                  onClick={() => {
                    if (!user) { showToast(t('cart.confirm_step.toast_login'), 'error'); return; }
                    setStep('shipping');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
                >
                  {t('cart.shipping_form.next')}
                  <ChevronLeft size={18} className="rtl:rotate-0 ltr:rotate-180" />
                </button>
              </div>
            )}

            {/* STEP 2: Shipping info */}
            {step === 'shipping' && (
              <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 text-start">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 justify-start">
                  <MapPin size={20} className="text-primary-600" />
                  {t('cart.shipping_form.title')}
                </h2>

                <div className="space-y-5">
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                      {t('cart.shipping_form.full_name')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => { setForm((p) => ({ ...p, fullName: e.target.value })); setErrors((p) => ({ ...p, fullName: undefined })); }}
                        placeholder={t('cart.shipping_form.full_name_placeholder')}
                        className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all text-start
                          ${errors.fullName ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'}`}
                      />
                    </div>
                    {errors.fullName && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 text-start">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                      {t('cart.shipping_form.phone')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: undefined })); }}
                        placeholder={t('cart.shipping_form.phone_placeholder')}
                        className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all text-start
                          ${errors.phone ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'}`}
                        dir="ltr"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-rose-500 text-start">{errors.phone}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                      {t('cart.shipping_form.city')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                      <select
                        value={form.city}
                        onChange={(e) => { setForm((p) => ({ ...p, city: e.target.value })); setErrors((p) => ({ ...p, city: undefined })); }}
                        className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all appearance-none cursor-pointer text-start
                          ${errors.city ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'}`}
                      >
                        <option value="" disabled>{t('cart.shipping_form.city_placeholder')}</option>
                        {EGYPT_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {CITY_LABELS[city] ? (isAr ? CITY_LABELS[city].ar : CITY_LABELS[city].en) : city}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.city && <p className="mt-1 text-xs text-rose-500 text-start">{errors.city}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                      {t('cart.shipping_form.address')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute rtl:right-3 ltr:left-3 top-3.5 text-gray-500 dark:text-gray-400" />
                      <textarea
                        value={form.address}
                        onChange={(e) => { setForm((p) => ({ ...p, address: e.target.value })); setErrors((p) => ({ ...p, address: undefined })); }}
                        placeholder={t('cart.shipping_form.address_placeholder')}
                        rows={3}
                        className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all resize-none text-start
                          ${errors.address ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'}`}
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-xs text-rose-500 text-start">{errors.address}</p>}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                      {t('cart.shipping_form.notes')} <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">{t('cart.shipping_form.notes_optional')}</span>
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute rtl:right-3 ltr:left-3 top-3.5 text-gray-500 dark:text-gray-400" />
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder={t('cart.shipping_form.notes_placeholder')}
                        rows={2}
                        className="w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none text-start"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => { setStep('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 px-5 py-3 border border-gray-200 dark:border-darkbg-lighter text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors"
                  >
                    <ChevronRight size={16} className="rtl:rotate-0 ltr:rotate-180" />
                    {t('cart.shipping_form.back')}
                  </button>
                  <button
                    onClick={handleShippingNext}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {t('cart.shipping_form.review_order')}
                    <ChevronLeft size={18} className="rtl:rotate-0 ltr:rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-4 text-start">
                {/* Shipping summary card */}
                <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-start">
                      <MapPin size={18} className="text-primary-600" />
                      {t('cart.confirm_step.delivery_info')}
                    </h2>
                    <button
                      onClick={() => setStep('shipping')}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {t('cart.confirm_step.edit')}
                    </button>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 text-start">{t('cart.confirm_step.name')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white text-start">{form.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 text-start">{t('cart.confirm_step.phone')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white text-start" dir="ltr">{form.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 text-start">{t('cart.confirm_step.city')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white text-start">
                        {CITY_LABELS[form.city] ? (isAr ? CITY_LABELS[form.city].ar : CITY_LABELS[form.city].en) : form.city}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 text-start">{t('cart.confirm_step.address')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white text-start">{form.address}</dd>
                    </div>
                    {form.notes && (
                      <div className="col-span-2">
                        <dt className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 text-start">{t('cart.confirm_step.notes')}</dt>
                        <dd className="font-medium text-gray-900 dark:text-white text-start">{form.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Items list */}
                <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-start">
                    <ShoppingBag size={18} className="text-primary-600" />
                    {t('cart.confirm_step.products', { count: items.length })}
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const price = item.product.discount_price ?? item.product.price;
                      return (
                        <div key={item.product.id} className="flex items-center gap-3 text-sm justify-start">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                            {item.product.images?.[0]?.image_url
                              ? <img src={item.product.images[0].image_url} alt={isAr ? item.product.name_ar : item.product.name_en} className="w-full h-full object-cover" />
                              : <ShoppingBag size={16} className="m-auto mt-2 text-gray-500 dark:text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0 text-start">
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{isAr ? item.product.name_ar : item.product.name_en}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{price} {t('product_detail.currency')} × {item.quantity}</p>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">{(price * item.quantity).toFixed(2)} {t('product_detail.currency')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('shipping'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 px-5 py-3 border border-gray-200 dark:border-darkbg-lighter text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors"
                  >
                    <ChevronRight size={16} className="rtl:rotate-0 ltr:rotate-180" />
                    {t('cart.shipping_form.back')}
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base animate-none"
                  >
                    {placing
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle2 size={18} />}
                    {placing ? t('cart.confirm_step.placing') : t('cart.confirm_step.confirm')}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {t('cart.confirm_step.terms_notice')}
                </p>
              </div>
            )}
          </div>

          {/* ── Right column: order summary ───────────────────────────────── */}
          <div>
            <OrderSummary />
          </div>
        </div>
      </div>
    </>
  );
}
