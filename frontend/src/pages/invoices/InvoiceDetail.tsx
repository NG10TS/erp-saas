import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  DocumentArrowUpIcon,  // Para el botón de nota de crédito
  ReceiptRefundIcon,    // Icono de nota de crédito
} from '@heroicons/react/24/outline';
import { invoicesApi } from '@/services/api/invoices';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Modal } from '@/components/common/Modal/Modal';

// ─── Animaciones ───────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// ─── Timeline Step ─────────────────────────────────────────
const TimelineStep: React.FC<{
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  isLast?: boolean;
}> = ({ label, date, status, isLast = false }) => {
  const config = {
    completed: { dot: 'bg-emerald-500', line: 'bg-emerald-500', icon: <CheckCircleIcon className="w-5 h-5 text-white" /> },
    current: { dot: 'bg-amber-500 animate-pulse', line: 'bg-gray-200', icon: <ClockIcon className="w-5 h-5 text-white" /> },
    pending: { dot: 'bg-gray-300', line: 'bg-gray-200', icon: null },
    error: { dot: 'bg-red-500', line: 'bg-red-500', icon: <XCircleIcon className="w-5 h-5 text-white" /> },
  };

  const style = config[status];

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${style.dot} flex items-center justify-center shadow-md`}>
          {style.icon || <span className="w-2 h-2 bg-white rounded-full" />}
        </div>
        {!isLast && <div className={`w-0.5 h-full ${style.line} mt-1`} />}
      </div>
      <div className="pb-8">
        <p className="font-semibold text-gray-900">{label}</p>
        {date && <p className="text-sm text-gray-500 mt-0.5">{date}</p>}
      </div>
    </div>
  );
};

// ─── Status Hero Card ──────────────────────────────────────
const StatusHeroCard: React.FC<{
  status: string;
  authorizationDate?: string;
  errors?: Array<{ message: string }>;
}> = ({ status, authorizationDate, errors }) => {
  const configs: Record<string, {
    gradient: string;
    icon: React.ReactNode;
    title: string;
    description: string;
  }> = {
    authorized: {
      gradient: 'from-emerald-500 to-teal-600',
      icon: <CheckCircleIcon className="w-16 h-16 text-white" />,
      title: 'Factura Autorizada',
      description: 'Válida tributariamente por el SRI'
    },
    rejected: {
      gradient: 'from-red-500 to-rose-600',
      icon: <XCircleIcon className="w-16 h-16 text-white" />,
      title: 'Factura Rechazada',
      description: 'Corrige los errores y reintenta'
    },
    pending: {
      gradient: 'from-amber-500 to-orange-600',
      icon: <ClockIcon className="w-16 h-16 text-white animate-pulse" />,
      title: 'Pendiente de Autorización',
      description: 'Esperando respuesta del SRI'
    },
    sent: {
      gradient: 'from-blue-500 to-indigo-600',
      icon: <ArrowPathIcon className="w-16 h-16 text-white animate-spin" />,
      title: 'Enviada al SRI',
      description: 'En proceso de validación'
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <motion.div
      variants={fadeInUp}
      className={`bg-gradient-to-br ${config.gradient} rounded-3xl p-8 text-white shadow-xl relative overflow-hidden`}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center gap-6 mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            {config.icon}
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-white/80 text-sm mt-1">{config.description}</p>
          </div>
        </div>
        
        {authorizationDate && (
          <div className="flex items-center gap-2 text-white/70 text-sm mt-4 pt-4 border-t border-white/20">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Autorizada el {formatDateTime(authorizationDate)}</span>
          </div>
        )}
      </div>

      {/* Errors */}
      <AnimatePresence>
        {errors && errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 bg-red-600/30 backdrop-blur-sm rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-semibold text-sm">Errores detectados</span>
            </div>
            <ul className="space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-white/50 rounded-full flex-shrink-0" />
                  {err.message}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Info Card ──────────────────────────────────────────────
const InfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = '' }) => (
  <motion.div
    variants={fadeInUp}
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </motion.div>
);

// ─── Componente Principal ───────────────────────────────────
export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showXml, setShowXml] = useState(false);
  const [retrying, setRetrying] = useState(false);


    // Después de:
  // const [retrying, setRetrying] = useState(false);

  // Agrega:
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteData, setCreditNoteData] = useState({
    tipo_nota: '01',  // 01=Anulación, 02=Devolución, 03=Descuento
    motivo: '',
    items: [] as any[],
    subtotal: 0,
    iva: 0,
    total: 0,
  });

  const creditNoteMutation = useMutation({
    mutationFn: (data: any) => invoicesApi.createCreditNote(id!, data),
    onSuccess: () => {
      toast.success('✅ Nota de crédito creada y enviada al SRI');
      setShowCreditNoteModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear nota de crédito');
    },
  });

  // Inicializar items cuando se abre el modal
  const handleOpenCreditNote = () => {
    if (invoice?.details) {
      setCreditNoteData({
        tipo_nota: '01',
        motivo: '',
        items: invoice.details.map((item: any) => ({
          ...item,
          selected: false,
          return_quantity: 0,
        })),
        subtotal: 0,
        iva: 0,
        total: 0,
      });
    }
    setShowCreditNoteModal(true);
  };


  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(id!),
    enabled: !!id,
  });

  const retryMutation = useMutation({
    mutationFn: () => invoicesApi.retrySriSubmission(id!),
    onSuccess: () => {
      toast.success('Reintentando envío al SRI');
      setRetrying(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al reintentar');
      setRetrying(false);
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const { pdf_url } = await invoicesApi.getInvoicePDF(id!);
      window.open(pdf_url, '_blank');
      toast.success('PDF abierto en nueva pestaña');
    } catch (error) {
      toast.error('Error al descargar PDF');
    }
  };

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <DocumentTextIcon className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <p className="text-gray-500 animate-pulse">Cargando factura...</p>
      </div>
    );
  }

  // ─── Not Found ────────────────────────────────────────────
  if (!invoice) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Factura no encontrada</h2>
        <p className="text-gray-500 mb-6">La factura que buscas no existe o fue eliminada</p>
        <Link to="/app/invoices">
          <Button icon={<ArrowLeftIcon className="w-4 h-4" />}>
            Volver a facturas
          </Button>
        </Link>
      </motion.div>
    );
  }

  const canRetry = invoice.sri_status === 'rejected' || invoice.sri_status === 'pending';

  // ─── Timeline Steps ───────────────────────────────────────
  const timelineSteps = [
    { label: 'Factura creada', date: invoice.issue_date ? formatDateTime(invoice.issue_date) : undefined, status: 'completed' as const },
    { label: 'Enviada al SRI', date: invoice.sri_status !== 'draft' ? formatDateTime(invoice.issue_date) : undefined, status: invoice.sri_status !== 'draft' ? 'completed' as const : 'pending' as const },
    { label: 'Autorizada por SRI', date: invoice.authorization_date ? formatDateTime(invoice.authorization_date) : undefined, status: invoice.sri_status === 'authorized' ? 'completed' as const : invoice.sri_status === 'rejected' ? 'error' as const : invoice.sri_status === 'pending' ? 'current' as const : 'pending' as const },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/app/invoices" 
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Factura
              <span className="text-emerald-600 font-mono text-lg">
                #{invoice.invoice_number?.slice(0, 20)}...
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Emitida el {formatDateTime(invoice.issue_date)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            icon={<DocumentArrowDownIcon className="w-4 h-4" />}
            onClick={handleDownloadPDF}
          >
            Descargar PDF
          </Button>
          {invoice?.sri_status === 'authorized' && (
              <Button
                variant="outline"
                icon={<ReceiptRefundIcon className="w-4 h-4" />}
                onClick={handleOpenCreditNote}
              >
                Nota de Crédito
              </Button>
            )}
          {canRetry && (
            <Button
              variant="primary"
              icon={<ArrowPathIcon className="w-4 h-4" />}
              onClick={() => {
                setRetrying(true);
                retryMutation.mutate();
              }}
              loading={retrying}
            >
              Reintentar SRI
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Status Hero ─────────────────────────────────────── */}
      <StatusHeroCard
        status={invoice.sri_status}
        authorizationDate={invoice.authorization_date}
        errors={invoice.sri_errors}
      />

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline + Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <InfoCard title="Progreso SRI" icon={<SparklesIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="mt-2">
              {timelineSteps.map((step, idx) => (
                <TimelineStep
                  key={step.label}
                  label={step.label}
                  date={step.date}
                  status={step.status}
                  isLast={idx === timelineSteps.length - 1}
                />
              ))}
            </div>
          </InfoCard>

          {/* Products Table */}
          <InfoCard title="Productos" icon={<ReceiptPercentIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="overflow-x-auto -mx-2">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">P. Unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.details?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        {item.product_sku && (
                          <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <InfoCard title="Cliente" icon={<UserCircleIcon className="w-5 h-5 text-emerald-600" />}>
            {invoice.customer_name ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-900 text-lg">{invoice.customer_name}</p>
                {invoice.customer_identification && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <IdentificationIcon className="w-4 h-4" />
                    <span>{invoice.customer_identification.length === 10 ? 'Cédula' : 'RUC'}: {invoice.customer_identification}</span>
                  </div>
                )}
                {invoice.customer_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span>{invoice.customer_email}</span>
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{invoice.customer_phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">Consumidor Final</p>
            )}
          </InfoCard>

          {/* Totals */}
          <InfoCard title="Resumen" icon={<BanknotesIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="space-y-3">
              {[
                { label: 'Subtotal', value: invoice.subtotal },
                { label: 'Descuento', value: invoice.discount, isNegative: true },
                { label: 'IVA 15%', value: invoice.iva },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${item.isNegative ? 'text-red-500' : 'text-gray-700'}`}>
                    {item.isNegative ? '-' : ''}{formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t-2 border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-emerald-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </InfoCard>

          {/* Business Info */}
          <InfoCard title="Emisor" icon={<BuildingOfficeIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">{invoice.business_name}</p>
              <p className="text-gray-500">RUC: {invoice.business_ruc}</p>
              {invoice.business_address && (
                <div className="flex items-start gap-2 text-gray-500">
                  <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{invoice.business_address}</span>
                </div>
              )}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* ─── XML Section ─────────────────────────────────────── */}
      {invoice.xml_signed && (
        <motion.div variants={fadeInUp}>
          <InfoCard title="XML Firmado" icon={<DocumentTextIcon className="w-5 h-5 text-emerald-600" />}>
            <button
              onClick={() => setShowXml(!showXml)}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-3"
            >
              {showXml ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
              {showXml ? 'Ocultar' : 'Ver'} XML firmado
            </button>
            <AnimatePresence>
              {showXml && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-xs text-gray-700 max-h-96 overflow-y-auto border border-gray-100"
                >
                  {invoice.xml_signed}
                </motion.pre>
              )}
            </AnimatePresence>
          </InfoCard>
        </motion.div>
      )}

      {/* ─── Notes ───────────────────────────────────────────── */}
      {invoice.notes && (
        <motion.div variants={fadeInUp}>
          <InfoCard title="Notas" icon={<DocumentTextIcon className="w-5 h-5 text-emerald-600" />}>
            <p className="text-gray-600 text-sm leading-relaxed">{invoice.notes}</p>
          </InfoCard>
        </motion.div>
      )}
      {/* ─── Credit Note Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showCreditNoteModal && (
          <Modal
            isOpen={showCreditNoteModal}
            onClose={() => setShowCreditNoteModal(false)}
            title="Crear Nota de Crédito"
            size="xl"
          >
            <div className="space-y-6">
              {/* Tipo de Nota */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Nota de Crédito
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '01', label: 'Anulación', desc: 'Anula completamente la factura', icon: '❌' },
                    { value: '02', label: 'Devolución', desc: 'Devolución de productos', icon: '📦' },
                    { value: '03', label: 'Descuento', desc: 'Descuento posterior', icon: '🏷️' },
                    { value: '04', label: 'Bonificación', desc: 'Bonificación especial', icon: '🎁' },
                  ].map((tipo) => (
                    <motion.button
                      key={tipo.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCreditNoteData({ ...creditNoteData, tipo_nota: tipo.value })}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        creditNoteData.tipo_nota === tipo.value
                          ? 'border-amber-500 bg-amber-50 shadow-amber-100 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tipo.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{tipo.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tipo.desc}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={creditNoteData.motivo}
                  onChange={(e) => setCreditNoteData({ ...creditNoteData, motivo: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Explica el motivo de la nota de crédito..."
                />
              </div>

              {/* Productos a incluir */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Productos a corregir
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {creditNoteData.items.map((item: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        item.selected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            const newItems = [...creditNoteData.items];
                            newItems[index] = {
                              ...newItems[index],
                              selected: e.target.checked,
                              return_quantity: e.target.checked ? 1 : 0,
                            };
                            setCreditNoteData({ ...creditNoteData, items: newItems });
                          }}
                          className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-500">
                            Facturado: {item.quantity} x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                      </label>
                      
                      {item.selected && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Cant. a devolver:</span>
                          <input
                            type="number"
                            value={item.return_quantity}
                            onChange={(e) => {
                              const newItems = [...creditNoteData.items];
                              newItems[index] = {
                                ...newItems[index],
                                return_quantity: Math.min(
                                  Math.max(0, parseInt(e.target.value) || 0),
                                  item.quantity
                                ),
                              };
                              setCreditNoteData({ ...creditNoteData, items: newItems });
                            }}
                            min="1"
                            max={item.quantity}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Resumen de valores */}
              {creditNoteData.items.some((i: any) => i.selected) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50 rounded-xl p-4 space-y-2"
                >
                  <h4 className="font-semibold text-gray-900 text-sm">Resumen de Nota de Crédito</h4>
                  {(() => {
                    const selectedItems = creditNoteData.items.filter((i: any) => i.selected);
                    const subtotal = selectedItems.reduce(
                      (sum: number, i: any) => sum + (i.unit_price * i.return_quantity), 0
                    );
                    const iva = subtotal * 0.15;
                    const total = subtotal + iva;
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">IVA 15%</span>
                          <span className="font-medium">{formatCurrency(iva)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-900">Total a acreditar</span>
                          <span className="font-bold text-amber-600">{formatCurrency(total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setShowCreditNoteModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={<ReceiptRefundIcon className="w-5 h-5" />}
                  onClick={() => {
                    const selectedItems = creditNoteData.items.filter((i: any) => i.selected);
                    
                    if (selectedItems.length === 0) {
                      toast.error('Selecciona al menos un producto');
                      return;
                    }
                    if (!creditNoteData.motivo.trim()) {
                      toast.error('El motivo es requerido');
                      return;
                    }

                    const subtotal = selectedItems.reduce(
                      (sum: number, i: any) => sum + (i.unit_price * i.return_quantity), 0
                    );
                    const iva = subtotal * 0.15;
                    const total = subtotal + iva;

                    creditNoteMutation.mutate({
                      sequential: invoice?.sequential || '001-001-000000001',
                      tipo_nota: creditNoteData.tipo_nota,
                      motivo: creditNoteData.motivo,
                      subtotal,
                      iva,
                      total,
                      items: selectedItems.map((item: any) => ({
                        product_sku: item.product_sku || '',
                        product_name: item.product_name,
                        quantity: item.return_quantity,
                        unit_price: item.unit_price,
                        discount: 0,
                        total_price: item.unit_price * item.return_quantity,
                        iva_percentage: 15,
                        iva_amount: (item.unit_price * item.return_quantity) * 0.15,
                      })),
                    });
                  }}
                  loading={creditNoteMutation.isPending}
                >
                  {creditNoteMutation.isPending ? 'Creando...' : 'Crear Nota de Crédito'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};