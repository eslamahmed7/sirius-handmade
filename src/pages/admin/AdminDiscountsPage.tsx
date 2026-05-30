import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Discount, Product, Category } from '../../types';
import { Plus, Pencil, Trash2, X, Tag, Calendar, Target, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface DiscountForm {
  code: string;
  description_ar: string;
  description_en: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  scope: 'global' | 'products' | 'categories';
  product_ids: string[];
  category_ids: string[];
  auto_apply: boolean;
}

const emptyForm: DiscountForm = {
  code: '', description_ar: '', description_en: '',
  discount_type: 'percentage', discount_value: '', min_order_amount: '0',
  max_uses: '', starts_at: new Date().toISOString().slice(0, 16),
  expires_at: '', is_active: true, scope: 'global',
  product_ids: [], category_ids: [], auto_apply: false,
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountForm>(emptyForm);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    supabase.from('products').select('id, name_ar, name_en').eq('is_active', true).then(({ data }) => setProducts((data as Product[]) ?? []));
    supabase.from('categories').select('*').eq('is_active', true).then(({ data }) => setCategories(data ?? []));
    loadDiscounts();
  }, []);

  async function loadDiscounts() {
    setLoading(true);
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    setDiscounts(data ?? []);
    setLoading(false);
  }

  const now = new Date();
  const filtered = discounts.filter(d => {
    if (filter === 'active') return d.is_active && (!d.expires_at || new Date(d.expires_at) > now) && new Date(d.starts_at) <= now;
    if (filter === 'expired') return d.expires_at && new Date(d.expires_at) <= now;
    if (filter === 'scheduled') return new Date(d.starts_at) > now;
    return true;
  });

  function openCreate() {
    const code = 'DISCOUNT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({ ...emptyForm, code });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(d: Discount) {
    setForm({
      code: d.code,
      description_ar: d.description_ar,
      description_en: d.description_en,
      discount_type: d.discount_type,
      discount_value: d.discount_value.toString(),
      min_order_amount: d.min_order_amount.toString(),
      max_uses: d.max_uses?.toString() || '',
      starts_at: d.starts_at ? d.starts_at.slice(0, 16) : '',
      expires_at: d.expires_at ? d.expires_at.slice(0, 16) : '',
      is_active: d.is_active,
      scope: d.scope,
      product_ids: d.product_ids || [],
      category_ids: d.category_ids || [],
      auto_apply: d.auto_apply,
    });
    setEditingId(d.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const discountData: Record<string, unknown> = {
      code: form.code.toUpperCase().trim(),
      description_ar: form.description_ar,
      description_en: form.description_en,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      starts_at: form.starts_at || new Date().toISOString(),
      expires_at: form.expires_at || null,
      is_active: form.is_active,
      scope: form.scope,
      product_ids: form.scope === 'products' ? form.product_ids : [],
      category_ids: form.scope === 'categories' ? form.category_ids : [],
      auto_apply: form.auto_apply,
    };

    if (editingId) {
      const { error } = await supabase.from('discounts').update(discountData).eq('id', editingId);
      if (error) { showToast(error.message, 'error'); return; }
    } else {
      const { error } = await supabase.from('discounts').insert(discountData);
      if (error) { showToast(error.message, 'error'); return; }
    }

    showToast(editingId ? 'تم تحديث الخصم' : 'تم إنشاء الخصم');
    setShowForm(false);
    loadDiscounts();
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الخصم؟')) return;
    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم حذف الخصم'); loadDiscounts(); }
  }

  async function toggleActive(d: Discount) {
    const { error } = await supabase.from('discounts').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) showToast(error.message, 'error');
    else loadDiscounts();
  }

  function getDiscountStatus(d: Discount) {
    if (!d.is_active) return { label: 'معطل', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:text-gray-400' };
    if (d.expires_at && new Date(d.expires_at) <= now) return { label: 'منتهي', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' };
    if (new Date(d.starts_at) > now) return { label: 'مجدول', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
    return { label: 'نشط', color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' };
  }

  const scopeLabels = { global: 'عام', products: 'منتجات محددة', categories: 'فئات محددة' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الخصومات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{discounts.length} خصم</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">
          <Plus size={18} /> إضافة خصم
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['all', 'active', 'scheduled', 'expired'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter text-gray-500 dark:text-gray-400 hover:border-primary-300'
            }`}>
            {f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : f === 'scheduled' ? 'مجدول' : 'منتهي'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} className="mx-auto text-gray-500 dark:text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد خصومات</h3>
          <p className="text-gray-500 dark:text-gray-400">أنشئ خصمك الأول</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(d => {
            const status = getDiscountStatus(d);
            return (
              <div key={d.id} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-semibold">{d.code}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${status.color}`}>{status.label}</span>
                      {d.auto_apply && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                          <Zap size={10} /> تلقائي
                        </span>
                      )}
                    </div>
                    {d.description_ar && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{d.description_ar}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold text-base text-primary-600 dark:text-primary-400">
                        {d.discount_type === 'percentage' ? `${d.discount_value}%` : `${d.discount_value} ج.م`}
                      </span>
                      <span className="flex items-center gap-1"><Target size={12} /> {scopeLabels[d.scope]}</span>
                      {d.min_order_amount > 0 && <span>الحد الأدنى: {d.min_order_amount} ج.م</span>}
                      {d.max_uses && <span>الاستخدام: {d.current_uses}/{d.max_uses}</span>}
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(d.starts_at).toLocaleDateString('ar-SA')}</span>
                      {d.expires_at && <span>إلى {new Date(d.expires_at).toLocaleDateString('ar-SA')}</span>}
                    </div>
                    {d.scope === 'products' && d.product_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.product_ids.slice(0, 3).map(pid => {
                          const p = products.find(pr => pr.id === pid);
                          return p ? <span key={pid} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">{p.name_ar}</span> : null;
                        })}
                        {d.product_ids.length > 3 && <span className="text-xs text-gray-500 dark:text-gray-400">+{d.product_ids.length - 3} أخرى</span>}
                      </div>
                    )}
                    {d.scope === 'categories' && d.category_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.category_ids.map(cid => {
                          const c = categories.find(cat => cat.id === cid);
                          return c ? <span key={cid} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded text-xs">{c.name_ar}</span> : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${d.is_active ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 dark:text-gray-400'}`}>
                      {d.is_active ? 'نشط' : 'معطل'}
                    </button>
                    <button onClick={() => openEdit(d)} className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-6 px-4 overflow-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">{editingId ? 'تعديل الخصم' : 'إضافة خصم جديد'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-auto">
              {/* Code & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">كود الخصم *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">نوع الخصم *</label>
                  <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm">
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
              </div>

              {/* Value & Min Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    قيمة الخصم * {form.discount_type === 'percentage' ? '(%)' : '(ج.م)'}
                  </label>
                  <input type="number" step="0.01" min="0" max={form.discount_type === 'percentage' ? '100' : undefined}
                    value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الحد الأدنى للطلب (ج.م)</label>
                  <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                  <input value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} dir="rtl"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالإنجليزية</label>
                  <input value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2"><Calendar size={16} /> الجدولة</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ البدء</label>
                    <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الانتهاء</label>
                    <input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الحد الأقصى للاستخدام</label>
                    <input type="number" min="0" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                      placeholder="غير محدود"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* Scope */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2"><Target size={16} /> نطاق الخصم</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(['global', 'products', 'categories'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, scope: s, product_ids: s === 'products' ? f.product_ids : [], category_ids: s === 'categories' ? f.category_ids : [] }))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors ${
                        form.scope === s ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-darkbg-lighter text-gray-500 dark:text-gray-400 hover:border-primary-300'
                      }`}>
                      {scopeLabels[s]}
                    </button>
                  ))}
                </div>

                {form.scope === 'products' && (
                  <div className="max-h-40 overflow-auto border border-gray-200 dark:border-darkbg-lighter rounded-xl p-2 space-y-1">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg-lighter cursor-pointer">
                        <input type="checkbox" checked={form.product_ids.includes(p.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            product_ids: e.target.checked ? [...f.product_ids, p.id] : f.product_ids.filter(id => id !== p.id),
                          }))} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{p.name_ar}</span>
                      </label>
                    ))}
                    {products.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center">لا توجد منتجات</p>}
                  </div>
                )}

                {form.scope === 'categories' && (
                  <div className="border border-gray-200 dark:border-darkbg-lighter rounded-xl p-2 space-y-1">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-darkbg-lighter cursor-pointer">
                        <input type="checkbox" checked={form.category_ids.includes(c.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            category_ids: e.target.checked ? [...f.category_ids, c.id] : f.category_ids.filter(id => id !== c.id),
                          }))} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{c.name_ar}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">نشط</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.auto_apply} onChange={e => setForm(f => ({ ...f, auto_apply: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1"><Zap size={14} /> تطبيق تلقائي</span>
                </label>
              </div>

              {form.auto_apply && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} /> الخصم التلقائي يُطبق دون الحاجة لإدخال كود
                </p>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-darkbg-lighter">
                <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors text-sm">
                  {editingId ? 'حفظ التعديلات' : 'إنشاء الخصم'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 dark:border-darkbg-lighter text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
