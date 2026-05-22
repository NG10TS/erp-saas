import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesChartProps {
  data?: Array<{
    date: string;
    label: string;
    count: number;
    revenue: number;
  }>;
  isLoading?: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data = [], isLoading = false }) => {
  const [days, setDays] = useState(7);
  const [metricView, setMetricView] = useState<'both' | 'amount' | 'sales'>('both');

  const daysOptions = [
    { value: 7, label: '7 días' },
    { value: 15, label: '15 días' },
    { value: 30, label: '30 días' },
  ];

  // Filtrar datos según los días seleccionados
  const filteredData = data.slice(-days);

  // Transformar datos para el gráfico
  const chartData = filteredData.map(item => ({
    date: item.label,
    amount: item.revenue,
    sales: item.count,
  }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
          <div className="flex space-x-2">
            {daysOptions.map(option => (
              <button
                key={option.value}
                className="px-3 py-1 text-sm rounded-lg text-gray-500"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
        <div className="h-80 flex items-center justify-center text-gray-400">
          No hay datos de ventas para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex space-x-2">
            {daysOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setDays(option.value)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  days === option.value
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {[
              { value: 'both', label: 'Ambos' },
              { value: 'amount', label: 'Ingresos' },
              { value: 'sales', label: 'Ventas' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setMetricView(option.value as 'both' | 'amount' | 'sales')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  metricView === option.value
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          {(metricView === 'both' || metricView === 'amount') && (
            <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} tick={{ fontSize: 12 }} stroke="#10b981" />
          )}
          {(metricView === 'both' || metricView === 'sales') && (
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6366f1" />
          )}
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'Monto ($)') return [`$${value.toFixed(2)}`, name];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          {(metricView === 'both' || metricView === 'amount') && (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name="Monto ($)"
              stroke="#10b981"
              fill="url(#colorAmount)"
              strokeWidth={2}
            />
          )}
          {(metricView === 'both' || metricView === 'sales') && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="sales"
              name="Ventas"
              stroke="#6366f1"
              fill="url(#colorSales)"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
