import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Review } from '../../types';
import { CheckCircle, XCircle, Trash2, Star, MessageSquare } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

type ReviewWithRelations = Review & { product?: { name_ar?: string; name_en?: string } | null; user?: { full_name?: string } | null };

export default function AdminReviewsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const { showToast } = useToast();

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, product:products(name_ar, name_en), user:users(full_name)')
      .order('created_at', { ascending: false });
    if (data) setReviews(data as ReviewWithRelations[]);
    setLoading(false);
  }

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  async function approveReview(id: string) {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم الموافقة على التقييم'); setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r)); }
  }

  async function rejectReview(id: string) {
    const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم رفض التقييم'); setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: false } : r)); }
  }

  async function deleteReview(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('تم حذف التقييم'); setReviews(prev => prev.filter(r => r.id !== id)); }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التقييمات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{reviews.filter(r => !r.is_approved).length} تقييم معلق</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter text-gray-500 dark:text-gray-400'
              }`}>
              {f === 'all' ? 'الكل' : f === 'pending' ? 'معلق' : 'موافق عليه'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-gray-500 dark:text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد تقييمات</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'pending' ? 'لا توجد تقييمات معلقة' : 'لا توجد تقييمات'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => {
            const product = review.product;
            const user = review.user;
            return (
              <div key={review.id} className={`bg-white dark:bg-darkbg-card border rounded-2xl p-5 transition-colors ${
                !review.is_approved ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-darkbg-lighter'
              }`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-bold">
                        {user?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.full_name || 'مستخدم'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                      {!review.is_approved && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">معلق</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-500 dark:text-gray-400'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {isAr ? 'على' : 'on'} {isAr ? (product?.name_ar || 'منتج') : (product?.name_en || product?.name_ar || 'product')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!review.is_approved && (
                      <button onClick={() => approveReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
                        <CheckCircle size={14} /> موافقة
                      </button>
                    )}
                    {review.is_approved && (
                      <button onClick={() => rejectReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                        <XCircle size={14} /> إلغاء
                      </button>
                    )}
                    <button onClick={() => deleteReview(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
