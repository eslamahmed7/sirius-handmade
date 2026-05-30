import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import {
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  ChevronLeft,
  Star,
  Package,
  Heart,
  Gift,
  Award,
  Gem,
  Home,
  Key,
  Coffee,
  Bookmark,
  Image as ImageIcon
} from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import SEO, { generateStructuredData } from '../components/ui/SEO';
import { useIntersectionObserver } from '../lib/hooks';

const getCategoryIcon = (slug: string) => {
  const s = slug.toLowerCase();
  if (s.includes('مجوهرات') || s.includes('jewelry') || s.includes('accessories')) return Gem;
  if (s.includes('ديكور') || s.includes('decor')) return Home;
  if (s.includes('ميداليات') || s.includes('keychain')) return Key;
  if (s.includes('كوستر') || s.includes('coaster')) return Coffee;
  if (s.includes('فاصل') || s.includes('bookmark')) return Bookmark;
  if (s.includes('لوحات') || s.includes('art') || s.includes('frame') || s.includes('لوحة')) return ImageIcon;
  return Sparkles;
};

// Section wrapper with intersection-observer-based fade-in
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const onEnter = useCallback(() => setVisible(true), []);
  const ref = useIntersectionObserver(onEnter, { threshold: 0.08 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
    >
      {children}
    </div>
  );
}

const VALUES = [
  {
    icon: Truck,
    title: 'شحن سريع',
    desc: 'نوصل طلبك لأي مكان في مصر',
  },
  {
    icon: Heart,
    title: 'منتجات مصنوعة بحب',
    desc: 'كل قطعة مصنوعة يدوياً',
  },
  {
    icon: Gift,
    title: 'تغليف هدايا فاخر',
    desc: 'تغليف أنيق لكل الطلبات',
  },
  {
    icon: Award,
    title: 'ضمان الجودة',
    desc: 'منتجات عالية الجودة',
  },
];

const TESTIMONIALS = [
  {
    name: 'سارة الأحمدي',
    rating: 5,
    text: 'منتجات رائعة وجودة استثنائية. المنتج وصل مغلفاً بشكل جميل وفاق توقعاتي تماماً.',
    role: 'عميلة مميزة',
  },
  {
    name: 'محمد العتيبي',
    rating: 5,
    text: 'اشتريت هدية لزوجتي وكانت سعيدة جداً. سأتعامل معكم دائماً وأنصح الجميع.',
    role: 'عميل دائم',
  },
  {
    name: 'نورة الزهراني',
    rating: 5,
    text: 'فنانة موهوبة حقاً. كل قطعة فريدة من نوعها ومليئة بالتفاصيل الدقيقة المذهلة.',
    role: 'عميلة جديدة',
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [waMenuOpen, setWaMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), images:product_images(*)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
      ]);
      setFeatured(prodRes.data ?? []);
      setCategories(catRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const websiteStructuredData = generateStructuredData('website');
  const orgStructuredData = generateStructuredData('organization');

  return (
    <>
      <SEO
        title="Sirius Handmade - سيريوس هاند ميد"
        description="لمسات من الريزين صنعت بحب. اكتشف أجمل منتجات الريزين اليدوية الفاخرة من مجوهرات وديكورات منزلية وهدايا مميزة."
        keywords="ريزين يدوي, مجوهرات ريزين, ديكور ريزين, هدايا مميزة, منتجات يدوية, سيريوس هاند ميد, resin art"
        url="/"
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgStructuredData) }}
      />

      <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-darkbg">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center justify-center">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(236,72,153,0.15) 0%, transparent 60%)',
              }}
            />
            {/* Twinkling Stars */}
            <div className="absolute top-[15%] right-[20%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] animate-twinkle" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-[40%] right-[10%] w-1 h-1 bg-primary-200 rounded-full shadow-[0_0_8px_1px_rgba(249,168,212,0.8)] animate-twinkle" style={{ animationDelay: '1.2s' }}></div>
            <div className="absolute top-[25%] left-[15%] w-2 h-2 bg-white rounded-full shadow-[0_0_12px_2px_rgba(255,255,255,0.9)] animate-twinkle" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-[30%] right-[30%] w-1 h-1 bg-white rounded-full opacity-70 animate-twinkle" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[20%] left-[25%] w-1.5 h-1.5 bg-primary-300 rounded-full shadow-[0_0_12px_2px_rgba(249,168,212,0.8)] animate-twinkle" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute top-[60%] left-[8%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_1px_rgba(255,255,255,0.6)] animate-twinkle" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-[10%] left-[45%] w-1.5 h-1.5 bg-primary-100 rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] animate-twinkle" style={{ animationDelay: '2.5s' }}></div>
            <div className="absolute bottom-[15%] right-[45%] w-1 h-1 bg-white rounded-full opacity-50 animate-twinkle" style={{ animationDelay: '0.3s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full text-center flex flex-col items-center">
            
            <div className="relative mb-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                لمسات من الريزين
              </h1>
              <div className="flex items-center justify-center gap-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-400 leading-tight">
                  صنعت بحب
                </h1>
                <Heart size={40} className="text-primary-500 stroke-[1.5] hidden md:block" />
              </div>
            </div>

            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              كل قطعة في Sirius Handmade مصنوعة يدوياً من الريزين بأدق التفاصيل لتكون فريدة مثلك
            </p>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-primary-500/90 hover:bg-primary-500 text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-105"
            >
              تسوق الآن
              <ArrowLeft size={18} />
            </Link>
            
            {/* Optional dots indicator */}
            <div className="flex items-center justify-center gap-2 mt-12">
              <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
              <span className="w-6 h-2 rounded-full bg-primary-500"></span>
              <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
            </div>
          </div>
        </section>

        {/* ===== CATEGORIES ===== */}
        {!loading && categories.length > 0 && (
          <AnimatedSection>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-gray-200 dark:border-darkbg-lighter/50">
              <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                {categories.map(cat => {
                  const Icon = getCategoryIcon(cat.slug || cat.name_ar);
                  return (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    className="group flex flex-col items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter hover:border-primary-300 dark:hover:border-primary-700 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Icon size={40} className="text-primary-400 group-hover:text-primary-500 transition-all duration-500 mb-3 group-hover:scale-110 group-hover:-translate-y-1" strokeWidth={1.5} />
                    <span className="text-sm sm:text-base font-bold text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-center px-2 z-10">
                      {cat.name_ar}
                    </span>
                  </Link>
                )})}
              </div>
            </section>
          </AnimatedSection>
        )}

        {/* ===== FEATURED PRODUCTS ===== */}
        <AnimatedSection>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-primary-500 stroke-[1.5]" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  منتجات مميزة
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white font-medium text-sm transition-colors group"
              >
                عرض الكل
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-darkbg-card rounded-3xl overflow-hidden animate-pulse border border-gray-200 dark:border-darkbg-lighter">
                    <div className="aspect-square bg-gray-100 dark:bg-darkbg-lighter/50" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-100 dark:bg-darkbg-lighter rounded w-3/4" />
                      <div className="h-4 bg-gray-100 dark:bg-darkbg-lighter rounded w-1/3 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featured.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="mx-auto text-darkbg-lighter mb-4" />
                <p className="text-gray-500 text-lg">لا توجد منتجات مميزة حالياً</p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-500 transition-colors"
                >
                  تصفح جميع المنتجات
                  <ArrowLeft size={16} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </AnimatedSection>

        {/* ===== VALUES / WHY US ===== */}
        <AnimatedSection>
          <section className="border-t border-gray-200 dark:border-darkbg-lighter py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {VALUES.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <Icon size={32} className="text-primary-500/80 mb-2" strokeWidth={1.5} />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
        
        {/* Floating WhatsApp Button */}
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end">
          {waMenuOpen && (
            <div className="mb-4 bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-lighter p-2 w-64 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="text-sm font-bold text-gray-900 dark:text-white px-3 py-2 border-b border-gray-100 dark:border-darkbg-lighter mb-1">
                كيف يمكننا مساعدتك؟
              </div>
              <a 
                href="https://wa.me/201005770190?text=مرحباً، أود الاستفسار عن سعر منتج"
                target="_blank" rel="noopener noreferrer"
                onClick={() => setWaMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 rounded-xl transition-colors text-right"
              >
                استفسار عن سعر منتج
              </a>
              <a 
                href="https://wa.me/201005770190?text=مرحباً، أود الاستفسار عن تكلفة الشحن"
                target="_blank" rel="noopener noreferrer"
                onClick={() => setWaMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 rounded-xl transition-colors text-right"
              >
                استفسار عن تكلفة الشحن
              </a>
              <a 
                href="https://wa.me/201005770190?text=مرحباً، لدي استفسار عام عن منتج"
                target="_blank" rel="noopener noreferrer"
                onClick={() => setWaMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 rounded-xl transition-colors text-right"
              >
                استفسار عام عن منتج
              </a>
            </div>
          )}
          <button 
            onClick={() => setWaMenuOpen(!waMenuOpen)}
            className="w-14 h-14 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:scale-110 transition-transform self-end"
            aria-label="تواصل عبر واتساب"
          >
            {waMenuOpen ? (
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
