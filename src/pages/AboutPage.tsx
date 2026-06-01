import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Sparkles, Heart, Award, Users, Shield, Truck,
  RefreshCw, Headphones, ArrowLeft, Star,
} from 'lucide-react';
import SEO, { generateStructuredData } from '../components/ui/SEO';
import { useTranslation, Trans } from 'react-i18next';

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { t, i18n } = useTranslation();

  const VALUES = [
    {
      icon: Heart,
      title: t('home.values.love_title'),
      desc: t('home.values.love_desc'),
    },
    {
      icon: Award,
      title: t('home.values.quality_title'),
      desc: t('home.values.quality_desc'),
    },
    {
      icon: Shield,
      title: t('home.values.gift_title'), // Using some keys from home since they overlap
      desc: t('home.values.gift_desc'),
    },
    {
      icon: Users,
      title: t('about.values_badge'), // For demonstration we map these values
      desc: t('home.values.shipping_desc'),
    },
  ];

  const TESTIMONIALS = [
    {
      name: ' محمد احمد ',
      role: 'عميل مميز',
      text: 'اشتريت طقم مكتب ريزين هدية لاخويا وكان مبسوط جداً بي. التغليف رائع والجودة فوق الممتاز.',
      stars: 5,
    },
    {
      name: ' مرام جمال',
      role: 'عميلة دائمة',
      text: 'كل قطعة فريدة وجميلة بطريقتها. أشعر أن هناك فنانة موهوبة خلف كل منتج.',
      stars: 5,
    },
    {
      name: 'منى السيد',
      role: 'أول طلب',
      text: 'تجربتي الأولى مع سيريوس كانت رائعة من أول لحظة حتى استلام الطلب. .',
      stars: 5,
    },
  ];

  const orgData = useMemo(() => generateStructuredData('organization', {
    socialLinks: [
      'https://instagram.com/siriushandmade',
      'https://twitter.com/siriushandmade',
    ],
  }), []);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(orgData);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [orgData]);

  const [productImages, setProductImages] = useState<string[]>([
    '/resin_art_1.png',
    '/resin_art_2.png',
    '/resin_art_3.png',
    '/resin_art_4.png',
  ]);
  const [slotIndices, setSlotIndices] = useState([0, 0, 0, 0]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    async function loadImages() {
      try {
        const { data } = await supabase
          .from('product_images')
          .select('image_url')
          .order('created_at', { ascending: false });
        
        const urls = data?.map(d => d.image_url).filter(Boolean) ?? [];
        const fallbackUrls = [
          '/resin_art_1.png',
          '/resin_art_2.png',
          '/resin_art_3.png',
          '/resin_art_4.png',
        ];
        
        let combined = [...urls];
        if (combined.length < 12) {
          combined = [...combined, ...fallbackUrls];
        }
        
        while (combined.length < 4) {
          combined = [...combined, ...fallbackUrls];
        }
        
        setProductImages(combined);
      } catch (error) {
        console.error('Error loading product images:', error);
      }
    }
    loadImages();
  }, []);

  useEffect(() => {
    if (productImages.length < 4) return;
    
    const groupSize = Math.floor(productImages.length / 4);
    if (groupSize <= 1) return;
    
    const interval = setInterval(() => {
      setStep(s => {
        const nextStep = s + 1;
        const slotToUpdate = nextStep % 4;
        setSlotIndices(prev => {
          const next = [...prev];
          next[slotToUpdate] = (next[slotToUpdate] + 1) % groupSize;
          return next;
        });
        return nextStep;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [productImages]);

  return (
    <>
      <SEO
        title={t('about.seo_title')}
        description={t('about.seo_desc')}
        keywords="سيريوس هاند ميد, قصتنا, فن الريزين, منتجات يدوية مصرية, عن الشركة"
        url="/about"
      />

      <div className="min-h-screen">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 40%, rgba(16,185,129,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(5,150,105,0.3) 0%, transparent 50%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-1.5 mb-8">
              <Sparkles size={14} className="text-primary-400" />
              <span className="text-primary-300 text-sm font-semibold">{t('about.badge')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              <Trans i18nKey="about.hero_title">
                نحن <span className="text-primary-400">سيريوس</span>
              </Trans>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto mb-10">
              {t('about.hero_desc')}
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { value: '+500', label: t('about.stats.products') },
                { value: '+2000', label: t('about.stats.clients') },
                { value: '5', label: t('about.stats.years') },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-extrabold text-primary-400">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-wider uppercase mb-3">
                {t('about.story_badge')}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-5">
                {t('about.story_title')}
              </h2>
              <div className="space-y-4 text-gray-500 dark:text-gray-400 leading-relaxed">
                <p>{t('about.story_p1')}</p>
                <p>{t('about.story_p2')}</p>
                <p>{t('about.story_p3')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 aspect-square w-full">
              {Array.from({ length: 4 }).map((_, i) => {
                const groupSize = Math.floor(productImages.length / 4);
                const groupImages = productImages.slice(i * groupSize, (i + 1) * groupSize);
                
                return (
                  <div key={i} className={`relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-darkbg-lighter ${i === 0 ? 'row-span-2 h-full' : 'h-full'}`}>
                    {groupImages.map((src, imgIdx) => (
                      <img
                        key={src}
                        src={src}
                        alt={`Gallery ${i + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                          imgIdx === slotIndices[i] ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                        loading="lazy"
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="bg-gray-50 dark:bg-darkbg/50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-wider uppercase mb-3">
                {t('about.values_badge')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('about.values_title')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-darkbg-card rounded-2xl p-6 border border-gray-200 dark:border-darkbg-lighter hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                    <Icon size={22} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ── Testimonials ── */}
        <section className="bg-gray-50 dark:bg-darkbg/50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-wider uppercase mb-3">
                {t('about.testimonials_badge')}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('about.testimonials_title')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, role, text, stars }) => (
                <div
                  key={name}
                  className="bg-white dark:bg-darkbg-card rounded-2xl p-6 border border-gray-200 dark:border-darkbg-lighter hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4 flex-row-reverse justify-end">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
                    "{text}"
                  </blockquote>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-darkbg-lighter flex-row">
                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 dark:text-primary-400 font-bold text-sm">
                        {name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{name}</p>
                      <p className="text-xs text-gray-500">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why us ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-wider uppercase mb-3">
              {t('about.why_us_badge')}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('about.why_us_title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: t('home.values.quality_title'), desc: t('home.values.quality_desc') },
              { icon: Truck, title: t('home.values.shipping_title'), desc: t('home.values.shipping_desc') },
              { icon: Headphones, title: t('about.values_title'), desc: t('about.values_badge') },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-5 rounded-2xl bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-gradient-to-l from-primary-700 to-primary-600 dark:from-primary-800 dark:to-primary-700">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 10% 50%, rgba(255,255,255,0.5) 0%, transparent 40%), radial-gradient(circle at 90% 50%, rgba(255,255,255,0.3) 0%, transparent 40%)',
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <Sparkles size={36} className="mx-auto text-primary-200 mb-4" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {t('about.cta_title')}
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              {t('about.cta_desc')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center flex-row-reverse ltr:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
              >
                {t('about.shop_now')}
                {i18n.language === 'ar' ? <ArrowLeft size={18} /> : <ArrowLeft size={18} className="rotate-180" />}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-100 dark:bg-darkbg-lighter/50 hover:bg-gray-100 dark:bg-darkbg-lighter/70 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors border border-white/30"
              >
                {t('about.contact_us')}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
