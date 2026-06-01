import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Sun, Moon, Search, LogOut, Package, Shield, Globe } from 'lucide-react';
import Logo from '../ui/Logo';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Close drawer if screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { to: '/', label: t('header.home') },
    { to: '/products', label: t('header.products') },
    { to: '/about', label: t('header.about') },
    { to: '/contact', label: t('header.contact') },
  ];

  return (
    <>
      <header className="bg-white/95 dark:bg-darkbg/95 backdrop-blur-md border-b border-gray-200 dark:border-darkbg-lighter">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-24 flex items-center justify-between">
          
          {/* Mobile Right / Desktop Left: Cart, Search, Fav */}
          <div className="flex items-center gap-3 shrink-0 flex-1 justify-start">
            <button onClick={() => setSearchOpen(true)} className="text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors p-1" aria-label={t('header.search')}>
              <Search size={24} strokeWidth={1.5} />
            </button>
            
            <Link to="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors p-1" aria-label={t('header.cart')}>
              <ShoppingCart size={24} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-darkbg">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Desktop Only Icons */}
            {user && (
              <Link to="/favorites" className="hidden md:flex p-1 relative text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label={t('header.favorites')}>
                <Heart size={20} strokeWidth={1.5} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-darkbg">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Logo (Center) */}
          <Link to="/" className="flex flex-col items-center justify-center shrink-0" aria-label={t('header.home')}>
            <Logo size="md" />
          </Link>

          {/* Mobile Left / Desktop Right: Nav Links, Theme, Lang, User, Mobile Menu */}
          <div className="flex items-center justify-end gap-6 flex-1 shrink-0">
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(l => (
                <Link key={l.label} to={l.to} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors relative group">
                  {l.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
            
            <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-darkbg-lighter mx-2"></div>

            {/* Desktop Language & Theme */}
            <button onClick={toggleLanguage} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors hidden md:flex items-center gap-1 font-bold text-sm" aria-label={t('header.toggle_language')}>
              <Globe size={18} />
              <span>{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button onClick={toggle} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors hidden md:block" aria-label={t('header.toggle_theme')}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Desktop User Menu */}
            {user ? (
              <div className="relative hidden md:block">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors flex items-center gap-2" aria-label={t('header.user_default')}>
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-56 bg-white dark:bg-darkbg-card rounded-xl shadow-xl border border-gray-200 dark:border-darkbg-lighter z-40 py-2 text-start">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-darkbg-lighter text-start">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || t('header.user_default')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-lighter">
                        <User size={16} /> {t('header.profile')}
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-lighter">
                        <Package size={16} /> {t('header.my_orders')}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-primary-400 hover:bg-primary-900/20">
                          <Shield size={16} /> {t('header.admin_panel')}
                        </Link>
                      )}
                      <hr className="my-1 border-gray-200 dark:border-darkbg-lighter" />
                      <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-400 hover:bg-rose-900/20">
                        <LogOut size={16} /> {t('header.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-2 px-6 py-2 bg-primary-500/10 hover:bg-primary-500 border border-primary-500 hover:text-white text-primary-400 text-sm font-bold rounded-full transition-all">
                <User size={18} /> {t('header.login')}
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-primary-400 p-1" aria-label={t('header.menu')}>
              <Menu size={26} strokeWidth={1.5} />
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Menu — glassmorphism floating card, half screen */}
      {mobileOpen && (
        <>
          {/* Backdrop — tap anywhere to close */}
          <div
            className="fixed inset-0 z-[59] md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Floating Glass Panel */}
          <div
            className="fixed top-16 right-0 rtl:right-auto rtl:left-0 z-[60] w-[55vw] max-w-[280px] max-h-[80vh] overflow-y-auto md:hidden
                       bg-white/80 dark:bg-[#1a0a2e]/85 backdrop-blur-2xl
                       border border-white/60 dark:border-primary-800/30
                       rounded-bl-3xl rtl:rounded-bl-none rtl:rounded-br-3xl
                       shadow-[0_8px_40px_rgba(97,62,114,0.25)]
                       animate-dropdown"
            style={{ animationDuration: '220ms' }}
          >
            {/* User Card */}
            {user && (
              <div className="mx-3 mt-3 p-3 rounded-2xl bg-primary-50/80 dark:bg-primary-900/25 border border-primary-100 dark:border-primary-800/30 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0 text-start">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || t('header.user_default')}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-2 py-2 flex flex-col gap-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1 mt-1">
                {t('header.navigation', 'التنقل')}
              </p>
              {navLinks.map(l => (
                <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:text-primary-500 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 font-semibold text-sm transition-all">
                  {l.label}
                </Link>
              ))}

              {user && (
                <>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1 mt-3">
                    {t('header.my_account', 'حسابي')}
                  </p>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:text-primary-500 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 font-semibold text-sm transition-all">
                    <User size={16} className="text-primary-400 shrink-0" />
                    <span>{t('header.profile', 'ملفي الشخصي')}</span>
                  </Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:text-primary-500 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 font-semibold text-sm transition-all">
                    <Package size={16} className="text-primary-400 shrink-0" />
                    <span>{t('header.my_orders', 'طلباتي')}</span>
                  </Link>
                  <Link to="/favorites" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:text-primary-500 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 font-semibold text-sm transition-all">
                    <Heart size={16} className="text-primary-400 shrink-0" />
                    <span className="flex-1">{t('header.favorites', 'المفضلة')}</span>
                    {favorites.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">{favorites.length}</span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50/70 dark:hover:bg-primary-900/20 font-semibold text-sm transition-all">
                      <Shield size={16} className="shrink-0" />
                      <span>{t('header.admin_panel', 'لوحة الإدارة')}</span>
                    </Link>
                  )}
                </>
              )}

              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1 mt-3">
                {t('header.settings', 'الإعدادات')}
              </p>
              <button onClick={toggle}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-white/5 font-semibold text-sm transition-all w-full">
                <span className="flex items-center gap-3">
                  {isDark ? <Sun size={16} className="text-amber-400 shrink-0" /> : <Moon size={16} className="text-indigo-400 shrink-0" />}
                  <span>{t('header.dark_mode', 'الوضع الليلي')}</span>
                </span>
                <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-primary-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-4 rtl:left-0.5 rtl:right-4' : 'left-0.5 rtl:right-0.5'}`} />
                </div>
              </button>
              <button onClick={toggleLanguage}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-white/5 font-semibold text-sm transition-all w-full">
                <span className="flex items-center gap-3">
                  <Globe size={16} className="text-primary-400 shrink-0" />
                  <span>{t('header.toggle_language', 'تغيير اللغة')}</span>
                </span>
                <span className="text-[10px] font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700 px-2 py-1 rounded-lg">
                  {i18n.language === 'ar' ? 'EN' : 'عر'}
                </span>
              </button>
            </div>

            {/* Bottom Action */}
            <div className="px-3 py-3 border-t border-gray-100/60 dark:border-white/10">
              {user ? (
                <button onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-rose-500 border border-rose-200/70 dark:border-rose-800/40 hover:bg-rose-500 hover:text-white text-sm font-bold transition-all">
                  <LogOut size={16} />
                  <span>{t('header.logout', 'تسجيل الخروج')}</span>
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 rtl:bg-gradient-to-l text-white text-sm font-bold hover:opacity-90 transition-all">
                  <User size={16} />
                  <span>{t('header.login', 'تسجيل الدخول')}</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Global Search Overlay — Full Screen */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#0f051a] flex flex-col animate-in fade-in duration-200">
          {/* Top bar: input row */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-white/10 shrink-0">
            <Search size={22} className="text-primary-400 shrink-0" />
            <form onSubmit={handleSearch} className="flex-1">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('header.search_placeholder')}
                className="w-full bg-transparent text-gray-900 dark:text-white text-lg font-medium outline-none placeholder-gray-400 dark:placeholder-gray-600"
              />
            </form>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: quick links / suggestions */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {searchQuery.trim() === '' ? (
              <div className="flex flex-col gap-6">
                {/* Quick nav */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    {t('header.quick_links', 'روابط سريعة')}
                  </p>
                  <div className="flex flex-col gap-1">
                    {navLinks.map(l => (
                      <Link
                        key={l.label}
                        to={l.to}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 py-3 px-3 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/15 font-semibold text-sm transition-all"
                      >
                        <Search size={15} className="text-gray-400 shrink-0" />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Submit hint when typing */
              <div className="flex flex-col items-center justify-center pt-10 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <Search size={28} className="text-primary-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('header.search_hint', 'اضغط Enter للبحث عن')} <span className="text-primary-500 font-bold">"{searchQuery}"</span>
                </p>
                <button
                  onClick={() => handleSearch({ preventDefault: () => {} } as React.FormEvent)}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-bold text-sm transition-colors"
                >
                  {t('header.search', 'بحث')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
