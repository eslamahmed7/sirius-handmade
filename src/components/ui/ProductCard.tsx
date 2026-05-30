import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const favored = isFavorite(product.id);
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;
  const image = product.images?.[0]?.image_url || '';

  return (
    <div className="group bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary-900/10 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-darkbg-lighter p-2 pb-0">
        <Link to={`/product/${product.slug}`} className="block w-full h-full rounded-t-2xl overflow-hidden">
          {image ? (
            <img src={image} alt={product.name_ar} loading="lazy" decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <ShoppingCart size={40} />
            </div>
          )}
        </Link>
        {hasDiscount && (
          <span className="absolute bottom-4 right-4 bg-primary-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
            خصم {discountPercent}%
          </span>
        )}
        {user && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); }}
            className="absolute top-4 left-4 p-2 transition-all hover:scale-110"
            aria-label={favored ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}>
            <Heart size={20} className={favored ? 'fill-primary-500 text-primary-500' : 'text-primary-500 stroke-[1.5]'} />
          </button>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-1">
            <Link to={`/product/${product.slug}`} className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name_ar}</h3>
            </Link>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                <Star size={12} className="fill-amber-400 text-amber-400" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {hasDiscount ? product.discount_price : product.price} <span className="text-sm font-normal">ج.م</span>
              </span>
            </div>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">{product.price} ج.م</span>
            )}
          </div>
          <button onClick={() => addItem(product)}
            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkbg-lighter text-primary-400 flex items-center justify-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all shadow-sm hover:shadow-primary-500/30"
            aria-label="إضافة للسلة">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
