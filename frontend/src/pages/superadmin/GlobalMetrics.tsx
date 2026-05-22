import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Building2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const GlobalMetrics: React.FC = () => {
  const { useMetrics } = useAdmin();
  const { data: metrics, isLoading } = useMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-emerald-600">⏳</div>
      </div>
    );
  }

  const metricCards: MetricCard[] = [
    {
      label: 'Total de negocios',
      value: metrics.total_businesses || 0,
      icon: <Building2 className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Negocios activos',
      value: metrics.active_businesses || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: 'Total de usuarios',
      value: metrics.total_users || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Ingresos totales',
      value: `$${(metrics.total_revenue || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Métricas globales</h1>
        <p className="text-slate-600 mt-1">
          Resumen de la actividad en la plataforma (se actualiza cada 30 segundos)
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg shadow-lg p-8"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-4">Resumen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-slate-600 mb-2">Tasa de actividad</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.active_businesses &&
                metrics.total_businesses ? (
                  (
                    ((metrics.active_businesses /
                      metrics.total_businesses) *
                      100).toFixed(1)
                  )
                ) : (
                  '0'
                )}
              </p>
              <p className="text-slate-600">% de negocios activos</p>
            </div>
          </div>
          <div>
            <p className="text-slate-600 mb-2">Promedio de usuarios por negocio</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-blue-600">
                {metrics.total_users && metrics.total_businesses ? (
                  (
                    metrics.total_users / metrics.total_businesses
                  ).toFixed(1)
                ) : (
                  '0'
                )}
              </p>
              <p className="text-slate-600">usuarios / negocio</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Last Updated */}
      <p className="text-center text-slate-500 text-sm">
        Última actualización: {new Date().toLocaleTimeString('es-ES')}
      </p>
    </motion.div>
  );
};
