import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import ProductCard from '../components/ui/ProductCard';
import SEO from '../components/ui/SEO';

export default function FavoritesPage() {
  const { favorites, toggleFavorite, loading } = useFavorites();

  return (
    <>
      <SEO
        title="المفضلة | سيريوس هاند ميد"
        description="منتجاتك المفضلة في مكان واحد"
        url="/favorites"
      />

      <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              المفضلة
            </h1>
            {!loading && favorites.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {favorites.length} منتج
              </p>
            )}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter flex items-center justify-center">
                <ShoppingBag size={40} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Heart size={14} className="text-rose-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
              قائمة المفضلة فارغة
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-xs leading-relaxed">
              لم تضف أي منتجات إلى المفضلة بعد. تصفح منتجاتنا واضغط على أيقونة القلب لحفظ ما يعجبك.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              تصفح المنتجات
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}

        {/* ── Favorites grid ── */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {favorites.map(fav => {
              if (!fav.product) return null;
              return (
                <div key={fav.id} className="relative group">
                  <ProductCard product={fav.product} />
                  {/* Remove from favorites overlay button */}
                  <button
                    onClick={() => toggleFavorite(fav.product_id)}
                    title="إزالة من المفضلة"
                    className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm"
                    aria-label="إزالة من المفضلة"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
