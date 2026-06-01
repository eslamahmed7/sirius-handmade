import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Product, Category, ProductImage } from '../../types';
import { Plus, Pencil, Trash2, Search, X, Upload, Image } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { uploadImage } from '../../lib/upload';

interface ProductForm {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: string;
  discount_price: string;
  stock_quantity: string;
  category_id: string;
  tags: string;
  is_active: boolean;
  is_featured: boolean;
}

const emptyForm: ProductForm = {
  name_ar: '', name_en: '', description_ar: '', description_en: '',
  price: '', discount_price: '', stock_quantity: '', category_id: '',
  tags: '', is_active: true, is_featured: false,
};

export default function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, category:categories(*), images:product_images(*)').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  const filtered = products.filter(p =>
    p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setNewImages([]);
    setExistingImages([]);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setForm({
      name_ar: product.name_ar, name_en: product.name_en,
      description_ar: product.description_ar, description_en: product.description_en,
      price: product.price.toString(), discount_price: product.discount_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      category_id: product.category_id || '',
      tags: product.tags.join(', '),
      is_active: product.is_active, is_featured: product.is_featured,
    });
    setEditingId(product.id);
    setExistingImages(product.images ?? []);
    setNewImages([]);
    setShowForm(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const url = await uploadImage(file);
        if (url) uploaded.push(url);
        else throw new Error('Upload failed');
      } catch { showToast('فشل رفع الصورة', 'error'); }
    }
    setNewImages(prev => [...prev, ...uploaded]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const toTitleCase = (str: string) => str.split(/\s+/).map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
    const nameEnFormatted = form.name_en.trim() ? toTitleCase(form.name_en.trim()) : '';
    const slugSource = nameEnFormatted || form.name_ar.trim();
    const slug = slugSource.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');
    const productData = {
      name_ar: form.name_ar.trim(),
      name_en: nameEnFormatted,
      slug: editingId ? undefined : slug,
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim() || '',
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock_quantity: Number(form.stock_quantity),
      category_id: form.category_id || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_active: form.is_active,
      is_featured: form.is_featured,
    };

    let productId = editingId;

    if (editingId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingId);
      if (error) { showToast(error.message, 'error'); return; }
    } else {
      const { data, error } = await supabase.from('products').insert(productData).select().maybeSingle();
      if (error) { showToast(error.message, 'error'); return; }
      productId = data.id;
    }

    // Insert new images
    if (productId && newImages.length > 0) {
      const imageRows = newImages.map((url, i) => ({
        product_id: productId,
        image_url: url,
        sort_order: existingImages.length + i,
        is_primary: existingImages.length === 0 && i === 0,
      }));
      await supabase.from('product_images').insert(imageRows);
    }

    showToast(editingId ? 'تم تحديث المنتج' : 'تم إنشاء المنتج');
    setShowForm(false);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم حذف المنتج'); loadProducts(); }
  }

  async function removeExistingImage(imgId: string) {
    await supabase.from('product_images').delete().eq('id', imgId);
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المنتجات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{products.length} منتج</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">
          <Plus size={18} /> إضافة منتج
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن منتج..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-white dark:bg-darkbg-card text-gray-900 dark:text-white outline-none focus:border-primary-500 transition-colors text-sm" />
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
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">المنتج</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">السعر</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">المخزون</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-darkbg-lighter/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.image_url ? <img src={p.images[0].image_url} alt="" className="w-full h-full object-cover" /> : <Image size={16} className="m-auto mt-2 text-gray-500 dark:text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{isAr ? p.name_ar : (p.name_en || p.name_ar)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{isAr ? p.name_en : p.name_ar}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{p.price} ج.م</span>
                      {p.discount_price && <span className="block text-xs text-rose-500">{p.discount_price} ج.م</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={p.stock_quantity > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-500'}>{p.stock_quantity}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.is_active ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 dark:text-gray-400'}`}>
                        {p.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد منتجات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 px-4 overflow-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الاسم بالعربية *</label>
                  <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الاسم بالإنجليزية</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                <textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالإنجليزية</label>
                <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">السعر *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">سعر الخصم</label>
                  <input type="number" step="0.01" value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">المخزون *</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الفئة</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm">
                    <option value="">بدون فئة</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{isAr ? c.name_ar : (c.name_en || c.name_ar)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوسوم (مفصولة بفاصلة)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="ريزين, هدية, ديكور"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">نشط</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">مميز</span>
                </label>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">صور المنتج</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative w-20 h-20 group">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button type="button" onClick={() => removeExistingImage(img.id)}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {newImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 group">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button type="button" onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-200 dark:border-darkbg-lighter rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">رفع</span>
                    <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                  </label>
                </div>
                {uploading && <p className="text-xs text-gray-500">جاري رفع الصور...</p>}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-darkbg-lighter">
                <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors text-sm">
                  {editingId ? 'حفظ التعديلات' : 'إنشاء المنتج'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 dark:border-darkbg-lighter text-gray-600 dark:text-gray-300 font-medium rounded-xl transition-colors text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
