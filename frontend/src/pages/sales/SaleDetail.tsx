import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PrinterIcon,
  ClockIcon,
  UserCircleIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  SparklesIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { salesApi } from '@/services/api/sales';
import { useConfirmSale, useProcessSale, useCompleteSale, useCancelSale } from '@/hooks/useSales';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { SALE_STATUS, PAYMENT_METHODS } from '@/utils/constants';
import toast from 'react-hot-toast';

// ─── Animaciones ───────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// ─── Status Badge ──────────────────────────────────────────
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const configs: Record<string, { label: string; gradient: string; icon: React.ReactNode }> = {
    pending: { label: 'Pendiente', gradient: 'from-amber-400 to-orange-500', icon: <ClockIcon className="w-4 h-4" /> },
    confirmed: { label: 'Confirmada', gradient: 'from-blue-400 to-indigo-500', icon: <ShieldCheckIcon className="w-4 h-4" /> },
    processing: { label: 'En proceso', gradient: 'from-purple-400 to-violet-500', icon: <TruckIcon className="w-4 h-4" /> },
    completed: { label: 'Completada', gradient: 'from-emerald-400 to-green-500', icon: <CheckCircleIcon className="w-4 h-4" /> },
    cancelled: { label: 'Cancelada', gradient: 'from-red-400 to-rose-500', icon: <XCircleIcon className="w-4 h-4" /> },
  };

  const config = configs[status] || configs.pending;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs gap-1' : 'px-4 py-2 text-sm gap-2';

  return (
    <span className={`inline-flex items-center ${sizeClasses} bg-gradient-to-r ${config.gradient} text-white rounded-full font-medium shadow-md`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ─── Payment Status Badge ──────────────────────────────────
const PaymentBadge: React.FC<{ status: string }> = ({ status }) => {
  const isPaid = status === 'paid';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
      isPaid 
        ? 'bg-emerald-50 text-emerald-700' 
        : 'bg-amber-50 text-amber-700'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      {isPaid ? 'Pagado' : 'Pendiente de pago'}
    </span>
  );
};

// ─── Progress Steps ────────────────────────────────────────
const ProgressSteps: React.FC<{ currentStatus: string }> = ({ currentStatus }) => {
  const steps = [
    { id: 'pending', label: 'Pendiente', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'confirmed', label: 'Confirmada', icon: <ShieldCheckIcon className="w-5 h-5" /> },
    { id: 'processing', label: 'En proceso', icon: <TruckIcon className="w-5 h-5" /> },
    { id: 'completed', label: 'Completada', icon: <CheckCircleIcon className="w-5 h-5" /> },
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'completed'];
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isCancelled = currentStatus === 'cancelled';

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.15, type: 'spring' }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                  isCancelled 
                    ? 'bg-red-100 text-red-500'
                    : isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : isCurrent 
                        ? 'bg-amber-500 text-white animate-pulse' 
                        : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : step.icon}
              </motion.div>
              <span className={`text-xs font-medium ${
                isCompleted ? 'text-emerald-600' : isCurrent ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-gray-200">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
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
    variants={itemVariants}
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
export const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.getSale(id!),
    enabled: !!id,
  });

  const confirmSale = useConfirmSale();
  const processSale = useProcessSale();
  const completeSale = useCompleteSale();
  const cancelSale = useCancelSale();

  const handleConfirm = async () => {
    await confirmSale.mutateAsync(id!);
    queryClient.invalidateQueries({ queryKey: ['sale', id] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    toast.success('✅ Venta confirmada exitosamente');
  };

  const handleProcess = async () => {
    await processSale.mutateAsync(id!);
    queryClient.invalidateQueries({ queryKey: ['sale', id] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    toast.success('📦 Venta en proceso de despacho');
  };

  const handleComplete = async () => {
    await completeSale.mutateAsync(id!);
    queryClient.invalidateQueries({ queryKey: ['sale', id] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    toast.success('🎉 Venta completada exitosamente');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Debes ingresar un motivo de cancelación');
      return;
    }
    await cancelSale.mutateAsync({ id: id!, reason: cancelReason });
    setShowCancelModal(false);
    queryClient.invalidateQueries({ queryKey: ['sale', id] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    toast.success('Venta cancelada');
  };

  const handleViewInvoice = () => {
    if (sale?.factura_id) navigate(`/app/invoices/${sale.factura_id}`);
  };

  const handlePrintInvoice = () => {
    if (sale?.pdf_url) {
      window.open(sale.pdf_url, '_blank');
      toast.success('Abriendo factura para imprimir...');
    } else {
      toast.error('PDF de factura no disponible aún');
    }
  };

  // ─── Loading State ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <ShoppingCartIcon className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <p className="text-gray-500 animate-pulse">Cargando venta...</p>
      </div>
    );
  }

  // ─── Not Found State ──────────────────────────────────────
  if (!sale) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Venta no encontrada</h2>
        <p className="text-gray-500 mb-6">La venta que buscas no existe o fue eliminada</p>
        <Link to="/app/sales">
          <Button icon={<ArrowLeftIcon className="w-4 h-4" />}>
            Volver a ventas
          </Button>
        </Link>
      </motion.div>
    );
  }

  const canConfirm = sale.estado === 'pending';
  const canProcess = sale.estado === 'confirmed';
  const canComplete = sale.estado === 'processing';
  const canCancel = !['completed', 'cancelled'].includes(sale.estado);
  const canPrint = sale.pdf_url;

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
        <div className="flex items-center gap-4">
          <Link 
            to="/app/sales" 
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-emerald-600" />
              </span>
              Venta #{sale.numero_venta}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 ml-13">
              {formatDateTime(sale.fecha_venta)}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button 
              variant="success" 
              icon={<ShieldCheckIcon className="w-4 h-4" />} 
              onClick={handleConfirm} 
              loading={confirmSale.isPending}
            >
              Confirmar
            </Button>
          )}
          {canProcess && (
            <Button 
              variant="primary" 
              icon={<TruckIcon className="w-4 h-4" />} 
              onClick={handleProcess} 
              loading={processSale.isPending}
            >
              Procesar
            </Button>
          )}
          {canComplete && (
            <Button 
              variant="primary" 
              icon={<CheckCircleIcon className="w-4 h-4" />} 
              onClick={handleComplete} 
              loading={completeSale.isPending}
            >
              Completar
            </Button>
          )}
          {canCancel && (
            <Button 
              variant="danger" 
              icon={<XCircleIcon className="w-4 h-4" />} 
              onClick={() => setShowCancelModal(true)}
            >
              Cancelar
            </Button>
          )}
          {sale.factura_id && (
            <Button 
              variant="outline" 
              icon={<DocumentTextIcon className="w-4 h-4" />} 
              onClick={handleViewInvoice}
            >
              Ver Factura
            </Button>
          )}
          {canPrint && (
            <Button 
              variant="outline" 
              icon={<PrinterIcon className="w-4 h-4" />} 
              onClick={handlePrintInvoice}
            >
              Imprimir
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Status + Payment Badges ─────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <StatusBadge status={sale.estado} />
        <PaymentBadge status={sale.estado_pago} />
      </motion.div>

      {/* ─── Progress Steps ──────────────────────────────────── */}
      {sale.estado !== 'cancelled' && (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <ProgressSteps currentStatus={sale.estado} />
        </motion.div>
      )}

      {/* ─── Cancelled Banner ────────────────────────────────── */}
      {sale.estado === 'cancelled' && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Venta Cancelada</h3>
              {sale.cancel_reason && (
                <p className="text-white/80 text-sm mt-1">Motivo: {sale.cancel_reason}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Productos" icon={<ShoppingCartIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="overflow-x-auto -mx-2">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">P. Unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sale.items?.map((item: any) => (
                    <motion.tr 
                      key={item.id} 
                      className="hover:bg-emerald-50/30 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{item.nombre_producto}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 text-center">{item.cantidad}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 text-right">{formatCurrency(item.precio_unitario)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.subtotal)}</td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">Subtotal:</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(sale.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">Descuento:</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-500 text-right">-{formatCurrency(sale.descuento)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">IVA:</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(sale.iva)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="px-4 py-4 text-right text-base font-bold text-gray-900">Total:</td>
                    <td className="px-4 py-4 text-base font-bold text-emerald-600 text-right">{formatCurrency(sale.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer */}
          <InfoCard title="Cliente" icon={<UserCircleIcon className="w-5 h-5 text-emerald-600" />}>
            {sale.customer_name ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-900 text-lg">{sale.customer_name}</p>
                {sale.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{sale.customer_phone}</span>
                  </div>
                )}
                {sale.customer_identification && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <IdentificationIcon className="w-4 h-4" />
                    <span>{sale.customer_identification.length === 10 ? 'Cédula' : 'RUC'}: {sale.customer_identification}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">Cliente ocasional</p>
            )}
          </InfoCard>

          {/* Payment Info */}
          <InfoCard title="Pago" icon={<CreditCardIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Método</span>
                <span className="font-medium capitalize">
                  {PAYMENT_METHODS.find(m => m.value === sale.metodo_pago)?.label || sale.metodo_pago}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estado</span>
                <PaymentBadge status={sale.estado_pago} />
              </div>
              {sale.fecha_pago && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha pago</span>
                  <span className="font-medium">{formatDateTime(sale.fecha_pago)}</span>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Totals */}
          <InfoCard title="Resumen" icon={<BanknotesIcon className="w-5 h-5 text-emerald-600" />}>
            <div className="space-y-3">
              {[
                { label: 'Subtotal', value: sale.subtotal },
                { label: 'Descuento', value: sale.descuento, isNegative: true },
                { label: 'IVA', value: sale.iva },
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
                <span className="font-bold text-xl text-emerald-600">{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </InfoCard>

          {/* Notes */}
          {sale.notas && (
            <InfoCard title="Notas" icon={<DocumentTextIcon className="w-5 h-5 text-emerald-600" />}>
              <p className="text-gray-600 text-sm leading-relaxed">{sale.notas}</p>
            </InfoCard>
          )}
        </div>
      </div>

      {/* ─── Cancel Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && (
          <Modal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            title="Cancelar Venta"
            description="Esta acción liberará el stock reservado. ¿Estás seguro?"
            tone="danger"
            confirmLabel="Cancelar Venta"
            cancelLabel="Volver"
            onConfirm={handleCancel}
            isConfirming={cancelSale.isPending}
          >
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Motivo de cancelación <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Explica brevemente el motivo..."
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};