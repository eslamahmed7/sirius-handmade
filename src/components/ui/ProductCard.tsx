import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalDiscount } from '../../contexts/GlobalDiscountContext';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { applyGlobalDiscount } = useGlobalDiscount();
  
  // Apply global discount if active
  const processedProduct = applyGlobalDiscount(product);
  
  const favored = isFavorite(processedProduct.id);
  const hasDiscount = processedProduct.discount_price && processedProduct.discount_price < processedProduct.price;
  const discountPercent = hasDiscount ? Math.round(((processedProduct.price - processedProduct.discount_price!) / processedProduct.price) * 100) : 0;
  const image = processedProduct.images?.[0]?.image_url || '';

  // Get localized name if possible.
  const productName = i18n.language === 'ar' ? processedProduct.name_ar : processedProduct.name_en;

  return (
    <div className="group bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary-900/10 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-darkbg-lighter p-2 pb-0">
        <Link to={`/product/${processedProduct.slug}`} className="block w-full h-full rounded-t-2xl overflow-hidden">
          {image ? (
            <img src={image} alt={productName} loading="lazy" decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <ShoppingCart size={40} />
            </div>
          )}
        </Link>
        {hasDiscount && (
          <span className="absolute bottom-4 rtl:right-4 ltr:left-4 bg-primary-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
            {t('product_card.discount')} {discountPercent}%
          </span>
        )}
        {user && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(processedProduct.id); }}
            className="absolute top-4 rtl:left-4 ltr:right-4 p-2 transition-all hover:scale-110"
            aria-label={favored ? t('product_card.remove_favorite') : t('product_card.add_favorite')}>
            <Heart size={20} className={favored ? 'fill-primary-500 text-primary-500' : 'text-primary-500 stroke-[1.5]'} />
          </button>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-1">
            <Link to={`/product/${processedProduct.slug}`} className="flex-1 text-start">
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-start">{productName}</h3>
            </Link>
            {processedProduct.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0 flex-row-reverse ltr:flex-row">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{processedProduct.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {hasDiscount ? processedProduct.discount_price : processedProduct.price} <span className="text-sm font-normal">{t('product_card.currency')}</span>
              </span>
            </div>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">{processedProduct.price} {t('product_card.currency')}</span>
            )}
          </div>
          <button onClick={() => addItem(processedProduct)}
            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-lighter text-primary-400 flex items-center justify-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all shadow-sm hover:shadow-primary-500/30 shrink-0"
            aria-label={t('product_card.add_cart')}>
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
