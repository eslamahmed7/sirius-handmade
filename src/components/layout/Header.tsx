import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Sun, Moon, Search, LogOut, Package, Shield, Bell, Sparkles } from 'lucide-react';
import Logo from '../ui/Logo';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  return (
    <>

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-darkbg/95 backdrop-blur-md border-b border-gray-200 dark:border-darkbg-lighter">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          
          {/* Icons and User Actions (Left side in RTL) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-1 justify-start">
            <button onClick={() => setSearchOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="بحث">
              <Search size={20} />
            </button>
            
            <Link to="/cart" className="p-2 relative text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="السلة">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {user && (
              <Link to="/favorites" className="p-2 relative text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="المفضلة">
                <Heart size={20} />
                {favorites.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}

            {/* User Profile for Mobile */}
            <div className="relative md:hidden flex items-center">
              {user ? (
                <>
                  <button onClick={() => { setUserMenuOpen(!userMenuOpen); setMobileOpen(false); }} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors flex items-center" aria-label="الحساب">
                    <User size={20} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-darkbg-card rounded-xl shadow-xl border border-gray-200 dark:border-darkbg-lighter z-40 py-2" dir="rtl">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-darkbg-lighter text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'مستخدم'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-lighter text-right">
                          <User size={16} /> الملف الشخصي
                        </Link>
                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-lighter text-right">
                          <Package size={16} /> طلباتي
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-primary-400 hover:bg-primary-900/20 text-right">
                            <Shield size={16} /> لوحة الإدارة
                          </Link>
                        )}
                        <hr className="my-1 border-gray-200 dark:border-darkbg-lighter" />
                        <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-400 hover:bg-rose-900/20 text-right">
                          <LogOut size={16} /> تسجيل الخروج
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link to="/login" className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="تسجيل الدخول">
                  <User size={20} />
                </Link>
              )}
            </div>

            <button onClick={() => { setMobileOpen(!mobileOpen); setUserMenuOpen(false); }} className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400" aria-label="القائمة">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo (Center) */}
          <Link to="/" className="flex flex-col items-center justify-center shrink-0" aria-label="الرئيسية">
            <Logo size="md" />
          </Link>

          {/* Navigation Links and Login (Right side in RTL) */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-end shrink-0">
            <nav className="flex items-center gap-6">
              {navLinks.map(l => (
                <Link key={l.label} to={l.to} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors relative group">
                  {l.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
            
            <div className="w-px h-6 bg-gray-100 dark:bg-darkbg-lighter mx-2"></div>

            <button onClick={toggle} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors hidden sm:block" aria-label="تبديل المظهر">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors flex items-center gap-2" aria-label="الحساب">
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-darkbg-card rounded-xl shadow-xl border border-gray-200 dark:border-darkbg-lighter z-40 py-2">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-darkbg-lighter">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'مستخدم'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-darkbg-lighter">
                        <User size={16} /> الملف الشخصي
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-darkbg-lighter">
                        <Package size={16} /> طلباتي
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-primary-400 hover:bg-primary-900/20">
                          <Shield size={16} /> لوحة الإدارة
                        </Link>
                      )}
                      <hr className="my-1 border-gray-200 dark:border-darkbg-lighter" />
                      <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-400 hover:bg-rose-900/20">
                        <LogOut size={16} /> تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-2 px-6 py-2 bg-primary-500/10 hover:bg-primary-500 border border-primary-500 hover:text-white text-primary-400 text-sm font-bold rounded-full transition-all">
                <User size={18} /> تسجيل الدخول
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-darkbg-lighter bg-gray-50 dark:bg-darkbg py-4 px-4 flex flex-col gap-4" dir="rtl">
            {/* Search Bar in Mobile Menu */}
            <form onSubmit={handleSearch} className="relative flex items-center w-full">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتجات..."
                className="w-full bg-white dark:bg-darkbg-card text-gray-900 dark:text-white border border-gray-200 dark:border-darkbg-lighter rounded-xl py-2 px-4 pr-10 outline-none text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-right"
                dir="rtl"
              />
              <Search size={18} className="absolute right-3 text-gray-400" />
            </form>

            {/* Navigation Links */}
            <nav className="flex flex-col">
              {navLinks.map(l => (
                <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)} className="block py-3 px-2 text-gray-600 dark:text-gray-300 hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-darkbg-lighter/30 rounded-lg font-medium transition-colors text-right">
                  {l.label}
                </Link>
              ))}
            </nav>

            <hr className="border-gray-200 dark:border-darkbg-lighter/50" />

            {/* User Account / Settings Section */}
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="px-2 py-1 text-right">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">حسابي</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{profile?.full_name || 'مستخدم'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 p-3 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-primary-400 transition-colors justify-start">
                    <User size={18} />
                    <span>الملف الشخصي</span>
                  </Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 p-3 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-primary-400 transition-colors justify-start">
                    <Package size={18} />
                    <span>طلباتي</span>
                  </Link>
                  <Link to="/favorites" onClick={() => setMobileOpen(false)} className="flex items-center justify-between p-3 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-primary-400 transition-colors col-span-2">
                    <span className="flex items-center gap-2">
                      <Heart size={18} className="text-red-500 fill-red-500" />
                      <span>المفضلة</span>
                    </span>
                    {favorites.length > 0 && (
                      <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-sm text-primary-400 hover:bg-primary-500/20 transition-colors col-span-2 justify-start">
                      <Shield size={18} />
                      <span>لوحة الإدارة</span>
                    </Link>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter/50 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300">المظهر الداكن</span>
                  <button onClick={toggle} className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="تبديل المظهر">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>

                <button onClick={handleSignOut} className="flex items-center justify-center gap-2 w-full p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded-xl text-sm font-semibold transition-all">
                  <LogOut size={18} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter/50 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300">المظهر الداكن</span>
                  <button onClick={toggle} className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-primary-400 transition-colors" aria-label="تبديل المظهر">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full p-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors">
                  <User size={18} />
                  <span>تسجيل الدخول</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-darkbg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-darkbg-lighter p-4" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <Search size={24} className="text-primary-400" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتجات..." className="flex-1 bg-transparent text-gray-900 dark:text-white text-xl outline-none placeholder-gray-500" dir="rtl" />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white">
                <X size={24} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
