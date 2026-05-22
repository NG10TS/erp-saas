import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { reportsApi, ReportFilters } from '@/services/api/reports';
import { Button } from '@/components/common/Button/Button';
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Reportes disponibles (simplificado) ──────────────────
const reports = [
  {
    id: 'sales',
    title: 'Ventas',
    description: 'Tus ventas por fecha, cliente y estado',
    icon: ShoppingCartIcon,
    color: 'emerald',
    formats: ['excel', 'pdf'] as const,
    endpoint: 'downloadSalesReport' as const,
    filters: {
      date: { label: 'Rango de fechas', type: 'date' as const },
      status: { label: 'Estado de venta', type: 'select' as const, options: [
        { value: '', label: 'Todos' },
        { value: 'completed', label: 'Completada' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'cancelled', label: 'Cancelada' },
      ]},
    },
  },
  {
    id: 'inventory',
    title: 'Inventario',
    description: 'Stock actual, precios y productos',
    icon: CubeIcon,
    color: 'blue',
    formats: ['excel', 'pdf'] as const,
    endpoint: 'downloadInventoryReport' as const,
    filters: {
      lowStock: { label: 'Solo stock bajo', type: 'checkbox' as const },
    },
  },
  {
    id: 'customers',
    title: 'Clientes',
    description: 'Historial de compras y contacto',
    icon: UsersIcon,
    color: 'purple',
    formats: ['excel', 'pdf'] as const,
    endpoint: 'downloadCustomersReport' as const,
    filters: {},
  },
  {
    id: 'invoices',
    title: 'Facturas SRI',
    description: 'Comprobantes electrónicos emitidos',
    icon: DocumentTextIcon,
    color: 'amber',
    formats: ['excel', 'pdf'] as const,
    endpoint: 'downloadInvoicesReport' as const,
    filters: {
      date: { label: 'Rango de fechas', type: 'date' as const },
    },
  },
  {
    id: 'iva',
    title: 'IVA',
    description: 'Resumen mensual para declaraciones',
    icon: BanknotesIcon,
    color: 'rose',
    formats: ['excel', 'pdf'] as const,
    endpoint: 'downloadIvaReport' as const,
    filters: {
      year: { label: 'Año fiscal', type: 'year' as const },
    },
  },
];

// ─── Colores por tema ──────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; border: string; ring: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    ring: 'ring-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  ring: 'ring-purple-500',  badge: 'bg-purple-100 text-purple-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   ring: 'ring-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    ring: 'ring-rose-500',    badge: 'bg-rose-100 text-rose-700' },
};

// ─── Animaciones simples ───────────────────────────────────
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Componente ────────────────────────────────────────────
export const Reports: React.FC = () => {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [activeReport, setActiveReport] = useState<(typeof reports)[0] | null>(null);
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSelectReport = (report: (typeof reports)[0]) => {
    setActiveReport(report);
    setFilters({});
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setActiveReport(null);
  };

  const handleDownload = async () => {
    if (!activeReport) return;
    setIsDownloading(true);
    try {
      const apiMethod = reportsApi[activeReport.endpoint];
      const blob = await apiMethod({ format, ...filters });

      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mime = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      const url = window.URL.createObjectURL(new Blob([blob], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport.id}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Listo 🎉 Archivo ${ext.toUpperCase()} descargado`);
    } catch {
      toast.error('No se pudo generar el reporte');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* ─── Título simple ────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {step === 'select'
            ? 'Elige el reporte que necesitas descargar'
            : 'Configura y descarga tu reporte'}
        </p>
      </div>

      {/* ─── Paso 1: Elegir reporte ────────────────────────── */}
      {step === 'select' && (
        <motion.div
          className="grid grid-cols-1 gap-3"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
        >
          {reports.map((report) => {
            const c = colorMap[report.color];
            const Icon = report.icon;
            return (
              <motion.button
                key={report.id}
                variants={fadeIn}
                onClick={() => handleSelectReport(report)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 ${c.border} ${c.bg} hover:shadow-md transition-all text-left group`}
              >
                <div className={`w-12 h-12 rounded-xl ${c.badge} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
                <div className="flex gap-1.5">
                  {report.formats.map((f) => (
                    <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>
                      {f === 'excel' ? 'Excel' : 'PDF'}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ─── Paso 2: Configurar y descargar ────────────────── */}
      <AnimatePresence>
        {step === 'configure' && activeReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Botón volver */}
            <button
              onClick={handleBack}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              ← Volver
            </button>

            {/* Card del reporte seleccionado */}
            <div className={`p-6 rounded-2xl border-2 ${colorMap[activeReport.color].border} ${colorMap[activeReport.color].bg}`}>
              <div className="flex items-center gap-3 mb-4">
                {React.createElement(activeReport.icon, { className: "w-6 h-6" })}
                <h2 className="text-lg font-bold text-gray-900">{activeReport.title}</h2>
              </div>

              {/* Selector de formato */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Formato</p>
                <div className="flex gap-2">
                  {activeReport.formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        format === f
                          ? 'bg-white border-2 border-gray-900 text-gray-900 shadow-sm'
                          : 'bg-white/50 border border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {f === 'excel' ? '📊 Excel' : '📄 PDF'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros opcionales */}
              {Object.keys(activeReport.filters).length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Filtros (opcional)</p>
                  <div className="space-y-3">
                    {Object.entries(activeReport.filters).map(([key, config]) => (
                      <div key={key}>
                        {config.type === 'date' && (
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-1 block">
                                <CalendarDaysIcon className="w-3.5 h-3.5 inline mr-1" />Desde
                              </label>
                              <input
                                type="date"
                                value={filters.from_date || ''}
                                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                              <input
                                type="date"
                                value={filters.to_date || ''}
                                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {config.type === 'select' && 'options' in config && (
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">{config.label}</label>
                            <select
                              value={filters[key] || ''}
                              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                            >
                              {config.options.map((opt: { value: string; label: string }) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {config.type === 'checkbox' && (
                          <label className="flex items-center gap-3 p-3 bg-white/80 rounded-xl cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters[key] || false}
                              onChange={(e) => setFilters({ ...filters, [key]: e.target.checked })}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm">{config.label}</span>
                          </label>
                        )}

                        {config.type === 'year' && (
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">{config.label}</label>
                            <input
                              type="number"
                              value={filters.year || new Date().getFullYear()}
                              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                              min={2020}
                              max={2030}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón descargar */}
              <Button
                fullWidth
                size="lg"
                icon={isDownloading ? undefined : <ArrowDownTrayIcon className="w-5 h-5" />}
                onClick={handleDownload}
                loading={isDownloading}
              >
                {isDownloading ? 'Generando...' : `Descargar ${format === 'excel' ? 'Excel' : 'PDF'}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};