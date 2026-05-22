import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { EyeIcon } from '@heroicons/react/24/outline';

interface Sale {
  id: string;
  numero_venta: string;
  customer_name: string;
  total: number;
  estado: string;
  fecha_venta?: string;  // ✅ Cambiar de 'time' a 'fecha_venta'
}

interface RecentSalesProps {
  sales: Sale[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  processing: 'Procesando',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// ✅ Función segura para formatear fecha
const formatSafeDate = (dateString?: string): string => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    if (isValid(date)) {
      return format(date, "dd MMM yyyy, HH:mm", { locale: es });
    }
    return 'Fecha inválida';
  } catch {
    return 'Fecha inválida';
  }
};

export const RecentSales: React.FC<RecentSalesProps> = ({ sales }) => {
  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay ventas recientes</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              N° Venta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sales.map((sale, index) => (
            <motion.tr
              key={sale.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {sale.numero_venta}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {sale.customer_name || 'Cliente ocasional'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatSafeDate(sale.fecha_venta)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${sale.total?.toFixed(2) ?? '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[sale.estado] || statusColors.pending}`}>
                  {statusLabels[sale.estado] || sale.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/app/sales/${sale.id}`}
                  className="text-primary-600 hover:text-primary-900"
                >
                  <EyeIcon className="w-5 h-5" />
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};