// src/components/dashboard/StatsCards/StatsCards.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber'; // ✅ Importar el componente
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  isNumeric?: boolean; // ✅ Nuevo prop para saber si es número
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  isNumeric = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          
          {/* ✅ VALOR CON O SIN ANIMACIÓN */}
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {isNumeric && typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </p>
          
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend.value)}% vs ayer
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );
};

interface StatsCardsProps {
  stats: {
    todaySales: number;
    todayRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    lowStockCount: number;
  };
  trends?: {
    sales: number;
    revenue: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, trends }) => {
  const cards = [
    {
      title: 'Ventas Hoy',
      value: stats.todaySales,
      icon: ShoppingCartIcon,
      trend: trends?.sales ? { value: trends.sales, isPositive: trends.sales > 0 } : undefined,
      color: 'primary',
      isNumeric: true, // ✅ Para animar
    },
    {
      title: 'Ingresos Hoy',
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      trend: trends?.revenue ? { value: trends.revenue, isPositive: trends.revenue > 0 } : undefined,
      color: 'secondary',
      isNumeric: false, // ✅ Es string con $, no animar
    },
    {
      title: 'Productos',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'accent',
      isNumeric: true, // ✅ Para animar
    },
    {
      title: 'Clientes',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'primary',
      isNumeric: true, // ✅ Para animar
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};