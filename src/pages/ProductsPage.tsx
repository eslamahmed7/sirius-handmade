import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, X, Search, ChevronDown, ChevronUp,
  Package, Filter, ArrowUpDown, ArrowUp, ArrowDown, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/ui/ProductCard';
import SEO from '../components/ui/SEO';
import { useDebounce } from '../lib/hooks';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل' },
  { value: 'price_desc', label: 'السعر: من الأعلى' },
  { value: 'rating', label: 'الأعلى تقييماً' },
];

const PAGE_SIZE = 16;

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const categoryParam = searchParams.get('category') ?? '';
  const searchParam = searchParams.get('search') ?? '';
  const sortParam = (searchParams.get('sort') as SortOption) ?? 'newest';
  const minPriceParam = searchParams.get('min_price') ?? '';
  const maxPriceParam = searchParams.get('max_price') ?? '';

  // Local UI state
  const [searchInput, setSearchInput] = useState(searchParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync debounced search to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch categories once
  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  // Fetch products whenever URL params or page change
  const fetchProducts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*)', { count: 'exact' })
      .eq('is_active', true);

    // Category filter via subquery
    if (categoryParam) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categoryParam)
        .maybeSingle();
      if (catData?.id) {
        query = query.eq('category_id', catData.id);
      } else {
        setProducts([]);
        setTotal(0);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
    }

    // Search filter
    if (searchParam) {
      const term = `%${searchParam}%`;
      query = query.or(`name_ar.ilike.${term},name_en.ilike.${term}`);
    }

    // Price filters
    if (minPriceParam) {
      query = query.gte('price', parseFloat(minPriceParam));
    }
    if (maxPriceParam) {
      query = query.lte('price', parseFloat(maxPriceParam));
    }

    // Sort
    switch (sortParam) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (pageNum - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count } = await query;

    if (append) {
      setProducts(prev => [...prev, ...(data ?? [])]);
    } else {
      setProducts(data ?? []);
    }
    setTotal(count ?? 0);
    setLoading(false);
    setLoadingMore(false);
  }, [categoryParam, searchParam, sortParam, minPriceParam, maxPriceParam]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setPage(1);
    setSearchParams(params, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({}, { replace: true });
    setPage(1);
  };

  const hasFilters = categoryParam || searchParam || minPriceParam || maxPriceParam;
  const hasMore = products.length < total;
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortParam)?.label ?? 'الأحدث';

  // ── Sidebar content ─────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">
          الفئات
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
              !categoryParam
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            جميع المنتجات
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                categoryParam === cat.slug
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name_ar}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">
          نطاق السعر
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              الحد الأدنى (ج.م)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPriceInput}
              onChange={e => setMinPriceInput(e.target.value)}
              onBlur={() => updateParam('min_price', minPriceInput)}
              onKeyDown={e => e.key === 'Enter' && updateParam('min_price', minPriceInput)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-lg text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              الحد الأقصى (ج.م)
            </label>
            <input
              type="number"
              min="0"
              placeholder="∞"
              value={maxPriceInput}
              onChange={e => setMaxPriceInput(e.target.value)}
              onBlur={() => updateParam('max_price', maxPriceInput)}
              onKeyDown={e => e.key === 'Enter' && updateParam('max_price', maxPriceInput)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-lg text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
          {(minPriceInput || maxPriceInput) && (
            <button
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                const params = new URLSearchParams(searchParams);
                params.delete('min_price');
                params.delete('max_price');
                setSearchParams(params, { replace: true });
              }}
              className="text-xs text-rose-500 hover:text-rose-600 transition-colors"
            >
              مسح نطاق السعر
            </button>
          )}
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          مسح جميع الفلاتر
        </button>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO
        title="جميع المنتجات | سيريوس هاند ميد"
        description="تصفح مجموعتنا الكاملة من منتجات الريزين اليدوية الفاخرة — مجوهرات، ديكور منزلي، هدايا مميزة، وأكثر."
        keywords="منتجات ريزين, مجوهرات يدوية, ديكور منزلي, هدايا, سيريوس هاند ميد"
        url="/products"
      />

      <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {categoryParam
              ? (categories.find(c => c.slug === categoryParam)?.name_ar ?? 'المنتجات')
              : 'جميع المنتجات'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} منتج متاح
            </p>
          )}
        </div>

        {/* ── Search + Controls bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="ابحث عن منتج..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-white dark:bg-darkbg-card text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); updateParam('search', ''); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-600 dark:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-white dark:bg-darkbg-card text-gray-600 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-600 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-gray-500 dark:text-gray-400" />
              {currentSortLabel}
              {sortDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {sortDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-xl shadow-lg z-20 overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateParam('sort', opt.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                      sortParam === opt.value
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-darkbg-lighter'
                    }`}
                  >
                    {opt.value === 'price_asc' && <ArrowUp size={12} />}
                    {opt.value === 'price_desc' && <ArrowDown size={12} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-white dark:bg-darkbg-card text-gray-600 dark:text-gray-300 hover:border-primary-400 transition-colors"
          >
            <Filter size={14} />
            فلترة
            {hasFilters && (
              <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        </div>

        {/* ── Active filter chips ── */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categoryParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                {categories.find(c => c.slug === categoryParam)?.name_ar ?? categoryParam}
                <button onClick={() => updateParam('category', '')} className="hover:text-primary-900 dark:hover:text-primary-200">
                  <X size={12} />
                </button>
              </span>
            )}
            {searchParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                بحث: {searchParam}
                <button onClick={() => { setSearchInput(''); updateParam('search', ''); }} className="hover:text-primary-900 dark:hover:text-primary-200">
                  <X size={12} />
                </button>
              </span>
            )}
            {(minPriceParam || maxPriceParam) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                السعر: {minPriceParam || '0'} - {maxPriceParam || '∞'} ج.م
                <button
                  onClick={() => {
                    setMinPriceInput('');
                    setMaxPriceInput('');
                    const p = new URLSearchParams(searchParams);
                    p.delete('min_price');
                    p.delete('max_price');
                    setSearchParams(p, { replace: true });
                  }}
                  className="hover:text-primary-900 dark:hover:text-primary-200"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* ── Main layout ── */}
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-200 dark:border-darkbg-lighter">
                <SlidersHorizontal size={16} className="text-primary-600 dark:text-primary-400" />
                <span className="font-bold text-gray-900 dark:text-white text-sm">الفلاتر</span>
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Package size={56} className="text-gray-500 dark:text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                  لا توجد منتجات
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                  لم نعثر على منتجات تطابق معايير البحث
                </p>
                {hasFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                    >
                      {loadingMore && <Loader2 size={18} className="animate-spin" />}
                      {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
                    </button>
                  </div>
                )}

                {/* Result count */}
                <p className="mt-6 text-center text-xs text-gray-500">
                  عرض {products.length} من {total} منتج
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" dir="rtl">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-y-0 right-0 w-72 max-w-full bg-gray-50 dark:bg-darkbg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-darkbg-lighter">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary-600" />
                <span className="font-bold text-gray-900 dark:text-white">الفلاتر</span>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white dark:bg-darkbg-card transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <SidebarContent />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-darkbg-lighter">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                عرض النتائج ({total})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
