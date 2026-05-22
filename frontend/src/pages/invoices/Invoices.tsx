import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChartBarIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { invoicesApi } from '@/services/api/invoices';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { TableSkeleton } from '@/components/common/Skeleton/Skeleton';
import { formatCurrency, formatDate } from '@/utils/formatters';

// ─── Animaciones ───────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// ─── Configuración de estados ──────────────────────────────
const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  icon: React.ReactNode;
  description: string;
}> = {
  draft: { 
    label: 'Borrador', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    description: 'Factura pendiente de envío'
  },
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50',
    icon: <ClockIcon className="w-5 h-5 animate-pulse" />,
    description: 'Enviada al SRI, esperando respuesta'
  },
  sent: { 
    label: 'Enviada', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50',
    icon: <ArrowPathIcon className="w-5 h-5" />,
    description: 'En proceso de validación'
  },
  authorized: { 
    label: 'Autorizada', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50',
    icon: <CheckCircleIcon className="w-5 h-5" />,
    description: 'Factura válida tributariamente'
  },
  rejected: { 
    label: 'Rechazada', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    icon: <XCircleIcon className="w-5 h-5" />,
    description: 'Factura rechazada por el SRI'
  },
  cancelled: { 
    label: 'Anulada', 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100',
    icon: <XCircleIcon className="w-5 h-5" />,
    description: 'Factura anulada'
  },
};

export const Invoices: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    from_date: '',
    to_date: '',
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search, filters],
    queryFn: () => invoicesApi.getInvoices({
      status: filters.status || undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
    }),
  });

  // ─── KPIs calculados ─────────────────────────────────────
  const kpis = {
    total: invoices?.length || 0,
    authorized: invoices?.filter(i => i.sri_status === 'authorized').length || 0,
    pending: invoices?.filter(i => i.sri_status === 'pending' || i.sri_status === 'sent').length || 0,
    rejected: invoices?.filter(i => i.sri_status === 'rejected').length || 0,
    totalAmount: invoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0,
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      setDownloadingId(id);
      const { pdf_url } = await invoicesApi.getInvoicePDF(id);
      window.open(pdf_url, '_blank');
      toast.success('PDF abierto en nueva pestaña');
    } catch (error) {
      toast.error('No se pudo descargar el PDF');
    } finally {
      setDownloadingId(null);
    }
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
            <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-emerald-600" />
            </span>
            Facturas Electrónicas
          </h1>
          <p className="text-gray-500 mt-1 ml-13">
            Gestiona tus comprobantes electrónicos del SRI
          </p>
        </div>
        <Link to="/app/sales/new">
          <Button icon={<SparklesIcon className="w-5 h-5" />}>
            Nueva Factura
          </Button>
        </Link>
      </motion.div>

      {/* ─── KPI Cards ────────────────────────────────────────── */}
      {invoices && invoices.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {[
            { label: 'Total Facturas', value: kpis.total, icon: <DocumentTextIcon className="w-5 h-5" />, color: 'from-gray-600 to-gray-700' },
            { label: 'Autorizadas', value: kpis.authorized, icon: <CheckCircleIcon className="w-5 h-5" />, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Pendientes', value: kpis.pending, icon: <ClockIcon className="w-5 h-5" />, color: 'from-amber-500 to-amber-600' },
            { label: 'Rechazadas', value: kpis.rejected, icon: <ExclamationTriangleIcon className="w-5 h-5" />, color: 'from-red-500 to-red-600' },
            { label: 'Monto Total', value: formatCurrency(kpis.totalAmount), icon: <BanknotesIcon className="w-5 h-5" />, color: 'from-blue-500 to-blue-600', isCurrency: true },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span className="bg-white/20 rounded-lg p-1.5">
                  {kpi.icon}
                </span>
              </div>
              <p className={`font-bold ${kpi.isCurrency ? 'text-lg' : 'text-2xl'}`}>
                {kpi.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ─── Búsqueda y Filtros ───────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de factura o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<FunnelIcon className="w-5 h-5" />}
          >
            {showFilters ? 'Ocultar filtros' : 'Filtros'}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Estado SRI
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="sent">Enviada</option>
                    <option value="authorized">Autorizada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filters.from_date}
                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filters.to_date}
                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Tabla de Facturas ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : invoices && invoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/50">
                      {['N° Factura', 'Fecha', 'Cliente', 'Total', 'Estado SRI', 'Acciones'].map((header) => (
                        <th 
                          key={header}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map((invoice, index) => {
                      const status = STATUS_CONFIG[invoice.sri_status] || STATUS_CONFIG.draft;
                      return (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-emerald-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                                {status.icon}
                              </div>
                              <span className="text-sm font-medium text-gray-900 font-mono">
                                {invoice.invoice_number?.slice(0, 15)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(invoice.issue_date, 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {invoice.customer_name || 'Consumidor Final'}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                to={`/app/invoices/${invoice.id}`}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Ver detalle"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDownloadPDF(invoice.id)}
                                disabled={downloadingId === invoice.id}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                                title="Descargar PDF"
                              >
                                {downloadingId === invoice.id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <DocumentArrowDownIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {invoices.map((invoice, index) => {
                const status = STATUS_CONFIG[invoice.sri_status] || STATUS_CONFIG.draft;
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${status.bgColor} flex items-center justify-center`}>
                          {status.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 font-mono text-sm">
                            {invoice.invoice_number?.slice(0, 20)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(invoice.issue_date, 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cliente</span>
                        <span className="font-medium">{invoice.customer_name || 'CF'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                      <Link to={`/app/invoices/${invoice.id}`} className="flex-1">
                        <Button variant="outline" fullWidth size="sm" icon={<EyeIcon className="w-4 h-4" />}>
                          Ver
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(invoice.id)}
                        className="flex-1"
                      >
                        <Button 
                          variant="ghost" 
                          fullWidth 
                          size="sm" 
                          icon={<DocumentArrowDownIcon className="w-4 h-4" />}
                          loading={downloadingId === invoice.id}
                        >
                          PDF
                        </Button>
                      </button>
                    </div>
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
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay facturas aún</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Las facturas electrónicas se generan automáticamente al completar una venta. 
              ¡Crea tu primera venta para empezar!
            </p>
            <Link to="/app/sales/new">
              <Button icon={<SparklesIcon className="w-5 h-5" />}>
                Crear mi primera venta
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};