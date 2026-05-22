// src/pages/dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { StatsCards } from '@/components/dashboard/StatsCards/StatsCards';
import { RecentSales } from '@/components/dashboard/RecentSales/RecentSales';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert/LowStockAlert';
import { QuickActions } from '@/components/dashboard/QuickActions/QuickActions';
import { SalesChart } from '@/components/dashboard/SalesChart/SalesChart';
import { useAuthStore } from '@/store/slices/authSlice';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { ConfigBanner } from '@/components/onboarding/ConfigBanner';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ─── API call ────────────────────────────────────────────────────────────────
const fetchDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-xl" />
      ))}
    </div>
    <div className="h-20 bg-gray-100 rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-64 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
    <div className="h-48 bg-gray-100 rounded-xl" />
  </div>
);

// ─── Componente principal ────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, business, refreshBusiness, isAuthenticated } = useAuthStore();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const hasCheckedOnboarding = useRef(false);

  // ✅ Query de estadísticas (solo si el negocio tiene datos básicos)
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard-stats', business?.id],
    queryFn: fetchDashboardStats,
    enabled: !!business?.id && !!business?.ruc && !!business?.business_name,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  useEffect(() => {
    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    console.log('📊 Dashboard.useEffect - isAuthenticated:', isAuthenticated, 'business:', business?.id || 'null');

    // Si no hay negocio (sin importar isAuthenticated), mostrar onboarding
    if (!business) {
      console.log('🏢 Usuario sin negocio → mostrar modal onboarding');
      setShowOnboardingModal(true);
      return;
    }

    // Verificar que los campos obligatorios estén completos
    const missingRequired = !business.ruc || !business.business_name || !business.email;
    if (missingRequired) {
      console.log('🏢 Negocio incompleto → mostrar modal onboarding');
      setShowOnboardingModal(true);
    } else {
      console.log('✅ Negocio completo → dashboard normal');
      setShowOnboardingModal(false);
    }
  }, [business, isAuthenticated]);
  
  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completado');
    setShowOnboardingModal(false);
    await refreshBusiness();
    toast.success('Negocio configurado correctamente');
  };

  const handleOnboardingClose = () => {
    console.log('⏭️ Modal de onboarding cerrado');
    setShowOnboardingModal(false);
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Datos actualizados');
  };

  // Si no hay negocio, mostrar modal en lugar del dashboard
  if (!business) {
    return (
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
        business={business}
      />
    );
  }

  // Estados de carga/error
  if (isError && !business?.id) {
    return (
      
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Error al cargar el dashboard</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const cardStats = {
    todaySales: stats.today?.sales_count ?? 0,
    todayRevenue: stats.today?.revenue ?? 0,
    totalProducts: stats.totals?.products ?? 0,
    totalCustomers: stats.totals?.customers ?? 0,
    lowStockCount: stats.low_stock?.count ?? 0,
  };

  const lowStockProducts = (stats?.low_stock?.products ?? []).map((product: any) => ({
    id: product.id,
    name: product.name,
    stock: product.stock_actual ?? 0,
    min_stock: product.stock_minimo ?? 0,
  }));

  return (
    <>
      {/* Modal de onboarding (solo si negocio incompleto) */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
        business={business}
      />

      {/* Banner de recordatorios (configuraciones pendientes) */}
      <ConfigBanner business={business} />

      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            {business && <p className="text-sm text-emerald-600 mt-1">{business.business_name}</p>}
            {dataUpdatedAt > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Actualizado {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        <StatsCards stats={cardStats} />
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SalesChart data={stats.sales_by_day || []} isLoading={isLoading} />
          </div>
          <div>
            {lowStockProducts.length > 0 && (
              <LowStockAlert products={lowStockProducts} onRefresh={() => void refetch()} isLoading={isLoading} />
            )}
          </div>
        </div>

        {stats.recent_sales?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Ventas Recientes</h2>
            </div>
            <div className="p-6">
              <RecentSales sales={stats.recent_sales} />
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};