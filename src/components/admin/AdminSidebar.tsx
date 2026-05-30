import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Users, Settings, ArrowRight, Shield, BarChart3, Tag, MessageSquare } from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'التحليلات' },
  { to: '/admin/products', icon: Package, label: 'المنتجات' },
  { to: '/admin/categories', icon: FolderOpen, label: 'الفئات' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'الطلبات' },
  { to: '/admin/reviews', icon: MessageSquare, label: 'التقييمات' },
  { to: '/admin/discounts', icon: Tag, label: 'الخصومات' },
  { to: '/admin/customers', icon: Users, label: 'العملاء' },
  { to: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-darkbg-card border-l border-gray-200 dark:border-darkbg-lighter flex flex-col flex-shrink-0 print:hidden transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-darkbg-lighter flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-gray-900 dark:text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">لوحة الإدارة</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sirius Handmade</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.end
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                onClick={onClose} // Close sidebar on mobile when navigating
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkbg-lighter'
                }`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t border-gray-200 dark:border-darkbg-lighter">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowRight size={16} /> العودة للمتجر
          </Link>
        </div>
      </aside>
    </>
  );
}
