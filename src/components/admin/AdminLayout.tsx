import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size={32} /></div>;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white dark:bg-darkbg-card border-b border-gray-200 dark:border-darkbg-lighter p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">لوحة الإدارة</span>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto w-full">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
