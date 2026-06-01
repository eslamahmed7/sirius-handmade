import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../types';

type ReviewWithUser = Review & { user?: { full_name?: string } | null };
import { ShoppingBag, Heart, Minus, Plus, ChevronRight, Share2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalDiscount } from '../contexts/GlobalDiscountContext';
import { useToast } from '../components/ui/Toast';
import SEO, { generateStructuredData } from '../components/ui/SEO';
import StarRating from '../components/ui/StarRating';
import { sanitizeText } from '../lib/security';

// ─── Rating Distribution Bar ────────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-left shrink-0 flex items-center gap-1">
        {star} <span className="text-amber-400">★</span>
      </span>
      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-left shrink-0">{count}</span>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateReview, setDuplicateReview] = useState(false);

  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { applyGlobalDiscount } = useGlobalDiscount();

  const product = fetchedProduct ? applyGlobalDiscount(fetchedProduct) : null;

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (cancelled) return;
      setFetchedProduct(data);

      if (data) {
        const { data: revData } = await supabase
          .from('reviews')
          .select('*, user:users(*)')
          .eq('product_id', data.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (!cancelled) setReviews(revData ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Derived values ────────────────────────────────────────────────────────

  const images = product?.images ?? [];
  const primaryImage = images[selectedImage]?.image_url ?? null;
  const hasDiscount =
    product !== null &&
    product.discount_price !== null &&
    product.discount_price < product.price;

  const discountPct =
    hasDiscount && product
      ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
      : 0;

  const effectivePrice = product ? (product.discount_price ?? product.price) : 0;

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const s = Math.round(r.rating);
      if (s >= 1 && s <= 5) dist[s]++;
    }
    return dist;
  }, [reviews]);

  const userHasReviewed = useMemo(
    () => user != null && reviews.some((r) => r.user_id === user.id),
    [reviews, user]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAddCart = () => {
    if (!product) return;
    addItem(product, quantity);
    showToast(t('product_detail.added_to_cart', { count: quantity }));
  };

  const handleShare = async () => {
    if (!product) return;
    const name = isAr ? product.name_ar : product.name_en;
    try {
      await navigator.share({ title: name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t('product_detail.share_copied'));
    }
  };

  const handleReview = async () => {
    if (!user || !product) return;
    const cleanComment = sanitizeText(reviewComment);
    if (!cleanComment) return;

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      rating: reviewRating,
      comment: cleanComment,
    });
    setSubmitting(false);

    if (!error) {
      showToast(t('product_detail.review_success'));
      setReviewComment('');
      setReviewRating(5);
    } else if (error.code === '23505') {
      // unique constraint violation — user already submitted
      setDuplicateReview(true);
    } else {
      showToast(error.message, 'error');
    }
  };

  // ── Structured data ───────────────────────────────────────────────────────

  const structuredData = product
    ? generateStructuredData('product', {
        name: isAr ? product.name_ar : product.name_en,
        description: isAr ? product.description_ar : product.description_en,
        image: primaryImage ?? images[0]?.image_url,
        slug: product.slug,
        price: effectivePrice,
        inStock: product.stock_quantity > 0,
        rating: product.rating,
        reviewCount: product.review_count,
      })
    : null;

  // ── Loading / Not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('product_detail.not_found')}</h2>
        <Link to="/products" className="text-primary-600 hover:underline">
          {t('product_detail.back_to_products')}
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-start">
      {/* SEO */}
      <SEO
        title={isAr ? product.name_ar : product.name_en}
        description={isAr ? product.description_ar : product.description_en}
        keywords={product.tags.join(', ')}
        image={primaryImage ?? images[0]?.image_url}
        url={`/product/${product.slug}`}
        type="product"
        price={effectivePrice}
        availability={product.stock_quantity > 0 ? 'instock' : 'outofstock'}
      />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 flex-wrap justify-start"
      >
        <Link to="/" className="hover:text-primary-600 transition-colors">
          {t('product_detail.breadcrumb_home')}
        </Link>
        <ChevronRight size={14} className="rtl:rotate-180" />
        <Link to="/products" className="hover:text-primary-600 transition-colors">
          {t('product_detail.breadcrumb_products')}
        </Link>
        {product.category && (
          <>
            <ChevronRight size={14} className="rtl:rotate-180" />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-primary-600 transition-colors"
            >
              {isAr ? product.category.name_ar : product.category.name_en}
            </Link>
          </>
        )}
        <ChevronRight size={14} className="rtl:rotate-180" />
        <span className="text-gray-900 dark:text-white font-medium">{isAr ? product.name_ar : product.name_en}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* ── Image Gallery ── */}
        <div>
          {/* Primary image */}
          <div className="aspect-square bg-gray-100 dark:bg-white dark:bg-darkbg-card rounded-2xl overflow-hidden mb-4 relative">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={isAr ? product.name_ar : product.name_en}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-3 rtl:right-3 ltr:left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="list" aria-label="Product Images">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  role="listitem"
                  aria-label={`Image ${i + 1}`}
                  aria-pressed={selectedImage === i}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    selectedImage === i
                      ? 'border-primary-500 ring-2 ring-primary-300'
                      : 'border-gray-200 dark:border-darkbg-lighter opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || (isAr ? product.name_ar : product.name_en)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Details ── */}
        <div className="flex flex-col gap-5 text-start">
          {/* Category badge */}
          {product.category && (
            <Link
              to={`/products?category=${product.category.slug}`}
              className="self-start text-xs font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              {isAr ? product.category.name_ar : product.category.name_en}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
            {isAr ? product.name_ar : product.name_en}
          </h1>

          {/* Aggregate rating */}
          <div className="flex items-center gap-3 justify-start">
            <StarRating value={product.rating} readonly size={18} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {product.review_count === 1 ? t('product_detail.rating_count_one') : t('product_detail.rating_count_other', { count: product.review_count })}
            </span>
            <button
              onClick={handleShare}
              aria-label={t('product_detail.share')}
              className="rtl:mr-auto ltr:ml-auto p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 justify-start">
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {effectivePrice} {t('product_detail.currency')}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 dark:text-gray-400 line-through mb-0.5">
                {product.price} {t('product_detail.currency')}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-start">
            {isAr ? product.description_ar : product.description_en}
          </p>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-start">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stock status */}
          <div className="text-start">
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
                {t('product_detail.in_stock', { count: product.stock_quantity })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                {t('product_detail.out_of_stock')}
              </span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex flex-col gap-3 pt-2 text-start">
            <div className="flex items-center gap-4 justify-start">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('product_detail.quantity')}</span>
              <div className="flex items-center border border-gray-200 dark:border-darkbg-lighter rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 py-2 font-semibold min-w-[3rem] text-center text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={product.stock_quantity === 0}
                  className="p-2.5 hover:bg-gray-100 dark:bg-darkbg-lighter transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                <ShoppingBag size={18} />
                {t('product_detail.add_to_cart')}
              </button>
              <button
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite(product.id) ? t('product_detail.remove_from_favorites') : t('product_detail.add_to_favorites')}
                className={`p-3 border rounded-xl transition-colors ${
                  isFavorite(product.id)
                    ? 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/30 text-rose-500'
                    : 'border-gray-200 dark:border-darkbg-lighter hover:border-rose-300 text-gray-500 hover:text-rose-500'
                }`}
              >
                <Heart size={20} className={isFavorite(product.id) ? 'fill-rose-500' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ─────────────────────────────────────────────────── */}
      <section className="mt-16 border-t border-gray-200 dark:border-darkbg-lighter pt-12 text-start">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
          {t('product_detail.reviews', { count: reviews.length })}
        </h2>

        {/* Rating summary + distribution */}
        {reviews.length > 0 && (
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 mb-8 flex flex-col sm:flex-row gap-6 items-center">
            {/* Overall score */}
            <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                {product.rating.toFixed(1)}
              </span>
              <StarRating value={product.rating} readonly size={20} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {reviews.length === 1 ? t('product_detail.rating_count_one') : t('product_detail.rating_count_other', { count: reviews.length })}
              </span>
            </div>

            {/* Bar chart */}
            <div className="flex-1 w-full flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar key={star} star={star} count={ratingDistribution[star]} total={reviews.length} />
              ))}
            </div>
          </div>
        )}

        {/* Review form — authenticated users who haven't reviewed yet */}
        {user && !userHasReviewed && !duplicateReview && (
          <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 mb-8 text-start">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('product_detail.add_review')}</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('product_detail.your_rating')}</p>
              <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t('product_detail.review_placeholder')}
            
              className="w-full px-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 transition-all resize-none text-sm text-start"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{reviewComment.length}/1000</span>
              <button
                onClick={handleReview}
                disabled={!reviewComment.trim() || submitting}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors text-sm"
              >
                {submitting ? t('product_detail.submitting_review') : t('product_detail.submit_review')}
              </button>
            </div>
          </div>
        )}

        {/* Duplicate review notice */}
        {duplicateReview && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 mb-8 text-amber-800 dark:text-amber-300 text-sm text-start">
            {t('product_detail.already_reviewed')}
          </div>
        )}

        {/* Login prompt */}
        {!user && (
          <div className="bg-gray-100 dark:bg-darkbg-lighter border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5 mb-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              {t('product_detail.login_to_review')}
            </p>
            <Link
              to="/login"
              className="inline-block px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {t('product_detail.login')}
            </Link>
          </div>
        )}

        {/* User already reviewed — show friendly notice */}
        {user && userHasReviewed && !duplicateReview && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-2xl p-4 mb-8 text-primary-800 dark:text-primary-300 text-sm text-start">
            {t('product_detail.thank_you_review')}
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">
            {t('product_detail.no_reviews')}
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewUser = review.user;
              const initial = (reviewUser?.full_name?.[0] ?? 'U').toUpperCase();
              return (
                <article
                  key={review.id}
                  className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 text-start"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shrink-0"
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {reviewUser?.full_name ?? t('product_detail.anonymous_user')}
                        </p>
                        <time
                          dateTime={review.created_at}
                          className="text-xs text-gray-500 shrink-0"
                        >
                          {formatDate(review.created_at, i18n.language)}
                        </time>
                      </div>
                      <StarRating value={review.rating} readonly size={14} />
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed text-start">
                    {review.comment}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
