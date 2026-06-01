import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNavigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const { favorites } = useFavorites();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/',
      label: t('header.home', 'الرئيسية'),
      icon: Home,
    },
    {
      to: '/products',
      label: t('header.products', 'الأقسام'),
      icon: LayoutGrid,
    },
    {
      to: '/favorites',
      label: t('header.favorites', 'المفضلة'),
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : undefined,
    },
    {
      to: user ? '/profile' : '/login',
      label: t('header.my_account', 'حسابي'),
      icon: User,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-darkbg border-t border-gray-200 dark:border-darkbg-lighter safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to === '/products' && location.pathname.startsWith('/products'));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400 hover:text-primary-400'
              }`}
            >
              <div className="relative">
                <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-darkbg">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
