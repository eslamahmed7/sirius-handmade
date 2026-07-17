import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { RealtimeOrdersProvider } from './contexts/RealtimeOrdersContext';
import { GlobalDiscountProvider } from './contexts/GlobalDiscountContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import { PageLoader } from './components/ui/LoadingSpinner';

// Eager-loaded (critical path)
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/HomePage';

// Lazy-loaded public pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Lazy-loaded admin pages
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminDiscountsPage = lazy(() => import('./pages/admin/AdminDiscountsPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PWARegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (import.meta.env.PROD) {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
      } else {
        // In development, unregister any active service worker to prevent caching issues
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    }
  }, []);
  return null;
}

function AuthCallbackHandler() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=signup')) {
      setTimeout(() => {
        showToast('تم تأكيد بريدك الإلكتروني بنجاح! مرحباً بك في سيريوس ✨', 'success');
      }, 500);
      window.history.replaceState(null, '', location.pathname + location.search);
      navigate('/', { replace: true });
    }
  }, [location, navigate, showToast]);

  return null;
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <>
      {/* شاشة الصيانة - لا تقم بإزالتها حتى تنتهي من التحديثات */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: '90%',
          width: '550px'
        }}>
          <svg style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', color: '#60a5fa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>
            عطل فني
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: '1.8', margin: 0, padding: '0 1rem' }}>
            نعتذر عن هذا الانقطاع الخارج عن إرادتنا.
            <br />
            الموقع حالياً تحت الصيانة والتحديث لتقديم تجربة أفضل.
            <br />
            سنعود للعمل في أقرب وقت ممكن.
          </p>
        </div>
      </div>
      <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <GlobalDiscountProvider>
            <CartProvider>
              <FavoritesProvider>
                <NotificationsProvider>
                  <RealtimeOrdersProvider>
                  <ToastProvider>
                <PWARegistrar />
                <AuthCallbackHandler />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/product/:slug" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                    </Route>

                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="analytics" element={<AdminAnalyticsPage />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="categories" element={<AdminCategoriesPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="reviews" element={<AdminReviewsPage />} />
                      <Route path="discounts" element={<AdminDiscountsPage />} />
                      <Route path="customers" element={<AdminCustomersPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                  </ToastProvider>
                  </RealtimeOrdersProvider>
                </NotificationsProvider>
              </FavoritesProvider>
            </CartProvider>
          </GlobalDiscountProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </>
  );
}
