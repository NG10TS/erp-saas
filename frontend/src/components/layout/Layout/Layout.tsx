import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'; // ✅ Agregar Link y useLocation
import { useAuthStore } from '@/store/slices/authSlice';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  UserCircleIcon,
  ChartBarIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { key: 'dashboard', name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
  { key: 'sales', name: 'Ventas', href: '/app/sales', icon: ShoppingBagIcon },
  { key: 'products', name: 'Productos', href: '/app/products', icon: CubeIcon },
  { key: 'customers', name: 'Clientes', href: '/app/customers', icon: UsersIcon },
  { key: 'invoices', name: 'Facturas', href: '/app/invoices', icon: DocumentTextIcon },
  { key: 'waybills', name: 'Guías', href: '/app/waybills', icon: TruckIcon },        // ← AGREGAR
  { key: 'reports', name: 'Reportes', href: '/app/reports', icon: ChartBarIcon },    // ← AGREGAR
  { key: 'whatsapp', name: 'WhatsApp', href: '/app/whatsapp', icon: ChatBubbleLeftRightIcon },
  { key: 'settings', name: 'Configuración', href: '/app/settings', icon: Cog6ToothIcon },
];

// Owner & Admin specific navigation
const ownerNavigation = [
  { key: 'employees', name: 'Empleados', href: '/app/owner/employees', icon: UsersIcon },
  { key: 'audit-logs', name: 'Auditoría', href: '/app/owner/audit-logs', icon: DocumentTextIcon },
];

// Super Admin specific navigation
const superAdminNavigation = [
  { key: 'businesses', name: 'Negocios', href: '/app/superadmin/businesses', icon: CubeIcon },
  { key: 'metrics', name: 'Métricas', href: '/app/superadmin/metrics', icon: HomeIcon },
  { key: 'audit-logs', name: 'Auditoría', href: '/app/superadmin/audit-logs', icon: DocumentTextIcon },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, business, logout } = useAuthStore();
  const { canAccessNavigation } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Para saber en qué ruta estamos
  
  const visibleNavigation = (user?.role === 'owner' || user?.role === 'SUPERADMIN')
    ? navigation
    : navigation.filter((item) => canAccessNavigation(item.key));

  // Add role-based navigation
  let additionalNavigation: typeof navigation = [];
  if (user?.role === 'SUPERADMIN') {
    additionalNavigation = superAdminNavigation;
  } else if (user?.role === 'owner' || user?.role === 'admin') {
    additionalNavigation = ownerNavigation;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ✅ Función para determinar si un enlace está activo
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay para móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-xl">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <Link to="/app/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                ERP Conversacional
              </span>
            </Link>
          </div>

          {/* Business info */}
          {business && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900">{business.business_name}</p>
                <p className="text-xs text-gray-500 mt-1">RUC: {business.ruc}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    business.subscription_plan === 'free' 
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {business.subscription_plan === 'free' ? 'Plan Gratuito' : 'Plan Pro'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - ✅ USAR Link en lugar de a */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive(item.href)
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-primary-500'
                }`} />
                {item.name}
              </Link>
            ))}

            {/* Separator for role-based navigation */}
            {additionalNavigation.length > 0 && (
              <div className="my-4 border-t border-gray-200"></div>
            )}

            {/* Role-based navigation */}
            {additionalNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive(item.href)
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-primary-500'
                }`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar móvil animado - ✅ También usar Link aquí */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
              <Link to="/app/dashboard" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  ERP Conversacional
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Business info móvil */}
            {business && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900">{business.business_name}</p>
                  <p className="text-xs text-gray-500 mt-1">RUC: {business.ruc}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      business.subscription_plan === 'free' 
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-primary-100 text-primary-700'
                    }`}>
                      {business.subscription_plan === 'free' ? 'Plan Gratuito' : 'Plan Pro'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation móvil - ✅ USAR Link */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-primary-500'
                  }`} />
                  {item.name}
                </Link>
              ))}

              {/* Separator for role-based navigation */}
              {additionalNavigation.length > 0 && (
                <div className="my-4 border-t border-gray-200"></div>
              )}

              {/* Role-based navigation */}
              {additionalNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-primary-500'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User menu móvil */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
