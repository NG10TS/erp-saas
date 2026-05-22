import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TruckIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  DocumentArrowDownIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  MapPinIcon,
  UserCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { waybillsApi } from '@/services/api/waybills';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { TableSkeleton } from '@/components/common/Skeleton/Skeleton';
import { formatDate } from '@/utils/formatters';

// ─── Configuración de estados ──────────────────────────────
const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  icon: React.ReactNode;
}> = {
  draft: { 
    label: 'Borrador', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    icon: <DocumentArrowDownIcon className="w-5 h-5" />
  },
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50',
    icon: <ClockIcon className="w-5 h-5 animate-pulse" />
  },
  authorized: { 
    label: 'Autorizada', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50',
    icon: <CheckCircleIcon className="w-5 h-5" />
  },
  rejected: { 
    label: 'Rechazada', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    icon: <XCircleIcon className="w-5 h-5" />
  },
};

// ─── Animaciones ───────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const Waybills: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills', search, filters],
    queryFn: () => waybillsApi.getWaybills({
      status: filters.status || undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
    }),
  });

  const kpis = {
    total: waybills?.length || 0,
    authorized: waybills?.filter(w => w.sri_status === 'authorized').length || 0,
    pending: waybills?.filter(w => w.sri_status === 'pending').length || 0,
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-blue-600" />
            </span>
            Guías de Remisión
          </h1>
          <p className="text-gray-500 mt-1 ml-13">
            Gestiona el transporte de mercadería
          </p>
        </div>
        <Link to="/app/waybills/new">
          <Button icon={<PlusIcon className="w-5 h-5" />}>
            Nueva Guía
          </Button>
        </Link>
      </motion.div>

      {/* ─── KPI Cards ────────────────────────────────────────── */}
      {waybills && waybills.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Guías', value: kpis.total, color: 'from-blue-600 to-blue-700', icon: <TruckIcon className="w-5 h-5" /> },
            { label: 'Autorizadas', value: kpis.authorized, color: 'from-emerald-500 to-emerald-600', icon: <CheckCircleIcon className="w-5 h-5" /> },
            { label: 'Pendientes', value: kpis.pending, color: 'from-amber-500 to-amber-600', icon: <ClockIcon className="w-5 h-5" /> },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{kpi.label}</span>
                <span className="bg-white/20 rounded-lg p-1.5">{kpi.icon}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ─── Búsqueda y Filtros ───────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por secuencial o destinatario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={<FunnelIcon className="w-5 h-5" />}>
            {showFilters ? 'Ocultar' : 'Filtros'}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Estado</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="authorized">Autorizada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Desde</label>
                  <input type="date" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Hasta</label>
                  <input type="date" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Tabla ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : waybills && waybills.length > 0 ? (
          <>
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/50">
                      {['N° Guía', 'Fecha', 'Destinatario', 'Tipo', 'Estado', 'Acciones'].map((header) => (
                        <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {waybills.map((waybill, index) => {
                      const status = STATUS_CONFIG[waybill.sri_status] || STATUS_CONFIG.draft;
                      return (
                        <motion.tr
                          key={waybill.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                                <TruckIcon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{waybill.sequential}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {waybill.fecha_inicio ? formatDate(waybill.fecha_inicio, 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <UserCircleIcon className="w-4 h-4 text-gray-400" />
                              {waybill.destinatario_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{waybill.tipo_guia}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/app/waybills/${waybill.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <EyeIcon className="w-4 h-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
              {waybills.map((waybill, index) => {
                const status = STATUS_CONFIG[waybill.sri_status] || STATUS_CONFIG.draft;
                return (
                  <motion.div
                    key={waybill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${status.bgColor} flex items-center justify-center`}>
                          <TruckIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{waybill.sequential}</p>
                          <p className="text-xs text-gray-500">{waybill.fecha_inicio ? formatDate(waybill.fecha_inicio, 'dd/MM/yyyy') : '-'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Destinatario</span>
                      <span className="font-medium">{waybill.destinatario_name || 'N/A'}</span>
                    </div>
                    <Link to={`/app/waybills/${waybill.id}`} className="mt-3 block">
                      <Button variant="outline" fullWidth size="sm" icon={<EyeIcon className="w-4 h-4" />}>Ver detalle</Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center"
          >
            <div className="text-6xl mb-4">🚛</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay guías de remisión</h3>
            <p className="text-gray-500 mb-6">Crea tu primera guía para transportar mercadería</p>
            <Link to="/app/waybills/new">
              <Button icon={<PlusIcon className="w-5 h-5" />}>Crear Guía de Remisión</Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};