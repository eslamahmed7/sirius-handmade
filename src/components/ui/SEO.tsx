/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  price?: number;
  currency?: string;
  availability?: string;
}

export default function SEO({
  title = 'Sirius Handmade - سيريوس هاند ميد',
  description = 'متجر سيريوس هاند ميد للمنتجات اليدوية الفاخرة - مجوهرات الريزين، ديكورات منزلية، اكسسوارات وهدايا مميزة',
  keywords = 'ريزين, يدوي, مجوهرات, ديكور, هدايا, اكسسوارات, Sirius, handmade, resin',
  image = 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1200',
  url,
  type = 'website',
  price,
  currency = 'EGP',
  availability,
}: SEOProps) {
  const siteUrl = 'https://siriushandmade.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const siteTitle = 'Sirius Handmade';

  useEffect(() => {
    document.title = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', fullUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', siteTitle, true);
    setMeta('og:locale', 'ar_EG', true);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // Product-specific
    if (type === 'product' && price) {
      setMeta('product:price:amount', price.toString(), true);
      setMeta('product:price:currency', currency, true);
      if (availability) {
        setMeta('product:availability', availability, true);
      }
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;
  }, [title, description, keywords, image, fullUrl, type, price, currency, availability]);

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateStructuredData(type: 'website' | 'product' | 'organization', data?: Record<string, any>) {
  const base = {
    '@context': 'https://schema.org',
  };

  if (type === 'organization') {
    return {
      ...base,
      '@type': 'Organization',
      name: 'Sirius Handmade',
      url: 'https://siriushandmade.com',
      logo: 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: 'متجر سيريوس هاند ميد للمنتجات اليدوية الفاخرة',
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: ['Arabic', 'English'] },
      sameAs: data?.socialLinks || [],
    };
  }

  if (type === 'product' && data) {
    return {
      ...base,
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      sku: data.slug,
      brand: { '@type': 'Brand', name: 'Sirius Handmade' },
      offers: {
        '@type': 'Offer',
        url: `https://siriushandmade.com/product/${data.slug}`,
        priceCurrency: 'EGP',
        price: data.price,
        availability: data.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Sirius Handmade' },
      },
      aggregateRating: data.rating > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating,
        reviewCount: data.reviewCount,
      } : undefined,
    };
  }

  return {
    ...base,
    '@type': 'WebSite',
    name: 'Sirius Handmade',
    url: 'https://siriushandmade.com',
    description: 'متجر سيريوس هاند ميد للمنتجات اليدوية الفاخرة',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://siriushandmade.com/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
