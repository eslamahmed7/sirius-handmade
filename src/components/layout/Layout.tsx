import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import { useGlobalDiscount } from '../../contexts/GlobalDiscountContext';
import { Heart } from 'lucide-react';

export default function Layout() {
  const { activeGlobalDiscount } = useGlobalDiscount();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-darkbg text-gray-100">
      <div className="sticky top-0 z-50 w-full flex flex-col">
        {activeGlobalDiscount && (
          <div className="bg-primary-600 text-white py-2 px-4 text-center text-sm sm:text-base font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <Heart size={16} className="fill-white animate-pulse" />
            <span>
              خصم {activeGlobalDiscount.discount_value}{activeGlobalDiscount.discount_type === 'percentage' ? '%' : ' ج.م'} على جميع المنتجات لفترة محدودة
            </span>
            <Heart size={16} className="fill-white animate-pulse" />
          </div>
        )}
        <Header />
      </div>
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
}
