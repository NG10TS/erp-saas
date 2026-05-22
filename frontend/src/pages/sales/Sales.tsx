import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, EyeIcon } from '@heroicons/react/24/outline';
import { salesApi } from '@/services/api/sales';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { TableSkeleton } from '@/components/common/Skeleton/Skeleton';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { SALE_STATUS } from '@/utils/constants';

export const Sales: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });
  const { data: sales, isLoading, refetch } = useQuery({
    queryKey: ['sales', search, filters],
    queryFn: () => salesApi.getSales({
      status: filters.status as any || undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
    }),
  });

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); refetch(); };
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Ventas</h1><p className="text-gray-500 mt-1">Gestiona todas tus ventas</p></div>
        <Link to="/app/sales/new"><Button icon={<PlusIcon className="w-5 h-5" />}>Nueva Venta</Button></Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input type="text" placeholder="Buscar por número de venta o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </form>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={<FunnelIcon className="w-5 h-5" />}>Filtros</Button>
        </div>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Todos</option><option value="pending">Pendiente</option><option value="confirmed">Confirmada</option><option value="processing">Procesando</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option>
              </select>
              <input type="date" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </motion.div>
        )}
      </div>

      {isLoading ? <TableSkeleton rows={5} columns={6} /> : sales && sales.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th>N° Venta</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Pago</th><th className="text-right">Acciones</th></tr></thead>
                <tbody>
                  {sales.map((sale, idx) => (
                    <motion.tr key={sale.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.numero_venta}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(sale.fecha_venta, 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{sale.customer_name || 'Cliente ocasional'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(sale.total)}</td>
                      <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sale.estado)}`}>{SALE_STATUS[sale.estado as keyof typeof SALE_STATUS]?.label || sale.estado}</span></td>
                      <td className="px-6 py-4 text-sm"><span className={`capitalize ${sale.estado_pago === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{sale.estado_pago === 'paid' ? 'Pagado' : 'Pendiente'}</span></td>
                      <td className="px-6 py-4 text-right"><Link to={`/app/sales/${sale.id}`} className="text-primary-600"><EyeIcon className="w-5 h-5 inline" /></Link></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sales.map((sale, idx) => (
              <motion.div key={sale.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between"><div><p className="font-semibold">{sale.numero_venta}</p><p className="text-sm text-gray-500">{formatDate(sale.fecha_venta, 'dd/MM/yyyy HH:mm')}</p></div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(sale.estado)}`}>{SALE_STATUS[sale.estado as keyof typeof SALE_STATUS]?.label}</span></div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{sale.customer_name || 'Cliente ocasional'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-emerald-700">{formatCurrency(sale.total)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Pago</span><span className={sale.estado_pago === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>{sale.estado_pago === 'paid' ? 'Pagado' : 'Pendiente'}</span></div>
                </div>
                <div className="mt-4"><Link to={`/app/sales/${sale.id}`}><Button variant="outline" fullWidth icon={<EyeIcon className="w-4 h-4" />}>Ver detalle</Button></Link></div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No hay ventas" description="Comienza registrando tu primera venta" action={{ label: "Nueva Venta", onClick: () => window.location.href = '/app/sales/new' }} icon={<div className="text-4xl">🛒</div>} />
      )}
    </div>
  );
};