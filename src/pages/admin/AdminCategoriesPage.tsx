import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types';
import { Plus, Pencil, Trash2, X, FolderOpen, Upload } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { uploadImage } from '../../lib/upload';

interface CategoryForm {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name_ar: '', name_en: '', description_ar: '', description_en: '',
  image_url: '', sort_order: '0', is_active: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data ?? []);
    setLoading(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setForm({
      name_ar: cat.name_ar, name_en: cat.name_en,
      description_ar: cat.description_ar, description_en: cat.description_en,
      image_url: cat.image_url, sort_order: cat.sort_order.toString(),
      is_active: cat.is_active,
    });
    setEditingId(cat.id);
    setShowForm(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) setForm(f => ({ ...f, image_url: url }));
      else throw new Error('Upload failed');
    } catch { showToast('فشل رفع الصورة', 'error'); }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const catData = {
      name_ar: form.name_ar,
      name_en: form.name_en,
      slug: editingId ? undefined : slug,
      description_ar: form.description_ar,
      description_en: form.description_en,
      image_url: form.image_url,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from('categories').update(catData).eq('id', editingId);
      if (error) { showToast(error.message, 'error'); return; }
    } else {
      const { error } = await supabase.from('categories').insert(catData);
      if (error) { showToast(error.message, 'error'); return; }
    }

    showToast(editingId ? 'تم تحديث الفئة' : 'تم إنشاء الفئة');
    setShowForm(false);
    loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم حذف الفئة'); loadCategories(); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الفئات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{categories.length} فئة</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">
          <Plus size={18} /> إضافة فئة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    {cat.image_url ? <img src={cat.image_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <FolderOpen size={20} className="text-primary-600 dark:text-primary-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name_ar}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cat.name_en}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cat.is_active ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 dark:text-gray-400'}`}>
                  {cat.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>
              {cat.description_ar && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{cat.description_ar}</p>}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-darkbg-lighter">
                <button onClick={() => openEdit(cat)} className="flex-1 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Pencil size={14} /> تعديل
                </button>
                <button onClick={() => handleDelete(cat.id)} className="flex-1 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Trash2 size={14} /> حذف
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">لا توجد فئات</div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 px-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl mb-10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">{editingId ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الاسم بالعربية *</label>
                  <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} required dir="rtl"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الاسم بالإنجليزية *</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                <textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={2} dir="rtl"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الوصف بالإنجليزية</label>
                <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">ترتيب العرض</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">الصورة</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500">{form.image_url ? 'تم الرفع' : 'رفع صورة'}</span>
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {uploading && <p className="text-xs text-gray-500 mt-1">جاري الرفع...</p>}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-300">نشط</span>
              </label>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-darkbg-lighter">
                <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors text-sm">
                  {editingId ? 'حفظ التعديلات' : 'إنشاء الفئة'}
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
