import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products';
import { waybillsApi } from '@/services/api/waybills';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  TruckIcon, 
  PlusIcon, 
  TrashIcon,
  UserCircleIcon,
  MapPinIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CameraIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Animaciones ───────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

// ─── Estados de entrega para el stepper ───────────────────
const DELIVERY_STEPS = [
  { id: 'PENDING', label: 'Pendiente', icon: ClockIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { id: 'CONFIRMED', label: 'Confirmado', icon: CheckCircleIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { id: 'IN_TRANSIT', label: 'En Camino', icon: TruckIcon, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { id: 'DELIVERED', label: 'Entregado', icon: CheckCircleIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
];

/**
 * Nueva Guía de Remisión - Versión Delivery
 * 
 * Diseño profesional con campos simplificados para entrega a domicilio.
 * Optimizado para móvil (mobile-first).
 */
export const NewWaybill: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1=Datos, 2=Productos, 3=Confirmar
  
  // Formulario simplificado
  const [formData, setFormData] = useState({
    destinatario_name: '',
    destinatario_phone: '',
    direccion_destino: '',
    delivery_notes: '',
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: () => productsApi.getProducts({ search: searchTerm, limit: 10 }),
    enabled: !!searchTerm,
  });

  const handleAddItem = (product: any) => {
    if (selectedItems.find(i => i.product_sku === product.sku)) {
      toast.error('Producto ya agregado');
      return;
    }
    setSelectedItems([...selectedItems, {
      product_sku: product.sku || '',
      product_name: product.name,
      quantity: 1,
    }]);
    toast.success(`${product.name} agregado`);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    if (!formData.destinatario_name.trim()) {
      toast.error('El nombre de quien recibe es requerido');
      return;
    }
    if (!formData.direccion_destino.trim()) {
      toast.error('La dirección de entrega es requerida');
      return;
    }

    setIsSubmitting(true);
    try {
      await waybillsApi.createWaybill({
        destinatario_name: formData.destinatario_name,
        destinatario_phone: formData.destinatario_phone,
        direccion_destino: formData.direccion_destino,
        delivery_notes: formData.delivery_notes,
        tipo_guia: '02',
        motivo_traslado: 'Entrega a domicilio',
        tipo_transporte: '01',
        placa: 'DELIVERY',
        items: selectedItems,
      });
      toast.success('✅ Guía de entrega creada exitosamente');
      navigate('/app/waybills');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear guía');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div 
      className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0 pb-20"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3 sm:gap-4">
        <Link to="/app/waybills" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </span>
            <span className="truncate">Nueva Entrega</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 ml-12 sm:ml-13">Completa los datos para el delivery</p>
        </div>
      </motion.div>

      {/* ─── Stepper Móvil ──────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          {DELIVERY_STEPS.slice(0, 3).map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index + 1 === currentStep;
            const isCompleted = index + 1 < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isCompleted ? '#059669' : isActive ? '#3B82F6' : '#E5E7EB',
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
                      isCompleted ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <StepIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </motion.div>
                  <span className={`text-[10px] sm:text-xs mt-1.5 font-medium hidden sm:block ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div className={`h-0.5 rounded-full ${index + 1 < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* ─── STEP 1: Datos de Entrega ───────────────────────── */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-4 sm:px-6 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Datos de Entrega</h2>
                  <p className="text-xs text-gray-500">¿A quién y dónde entregamos?</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Quién recibe? <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.destinatario_name}
                    onChange={(e) => updateField('destinatario_name', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Ej: Juan Pérez"
                    autoFocus
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" /> Teléfono 
                  <span className="text-xs text-gray-400 font-normal">(para notificar por WhatsApp)</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.destinatario_phone}
                    onChange={(e) => updateField('destinatario_phone', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="0999999999"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" /> Dirección de entrega <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3.5 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.direccion_destino}
                    onChange={(e) => updateField('direccion_destino', e.target.value)}
                    rows={2}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                    placeholder="Ej: Av. Principal 123, Edificio A, Depto 4B, Quito"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notas adicionales
                </label>
                <input
                  type="text"
                  value={formData.delivery_notes}
                  onChange={(e) => updateField('delivery_notes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Ej: Tocar el timbre, dejar en recepción..."
                />
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button onClick={() => setCurrentStep(2)} disabled={!formData.destinatario_name || !formData.direccion_destino}>
                Continuar → Productos
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: Productos ─────────────────────────────── */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-4 sm:px-6 py-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Productos a Entregar</h2>
                  <p className="text-xs text-gray-500">{selectedItems.length} productos · {totalItems} unidades</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Resultados de búsqueda */}
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {productsLoading ? (
                      <div className="flex justify-center py-4"><Loading size="sm" /></div>
                    ) : products && products.length > 0 ? (
                      products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleAddItem(product)}
                          className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">Stock: {product.stock_disponible ?? 0}</p>
                          </div>
                          <PlusIcon className="w-5 h-5 text-purple-500 flex-shrink-0 ml-2" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">No se encontraron productos</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Productos seleccionados */}
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between bg-gray-50 rounded-xl p-3 sm:p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Cantidad:</span>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...selectedItems];
                              newItems[index].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              setSelectedItems(newItems);
                            }}
                            min="1"
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(index)} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-sm text-gray-500">Busca y agrega productos a la entrega</p>
                </div>
              )}

              {/* Foto (opcional) */}
              <div className="pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  fullWidth 
                  icon={<CameraIcon className="w-4 h-4" />}
                  className="text-sm"
                >
                  📸 Foto de los productos (opcional)
                </Button>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Atrás
              </Button>
              <Button onClick={() => setCurrentStep(3)} disabled={selectedItems.length === 0}>
                Continuar → Revisar
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3: Confirmar ─────────────────────────────── */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {/* Resumen */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-4 sm:px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Resumen de Entrega</h2>
                    <p className="text-xs text-gray-500">Revisa antes de crear la guía</p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Datos del destinatario */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Destinatario</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{formData.destinatario_name || '—'}</span>
                    </div>
                    {formData.destinatario_phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{formData.destinatario_phone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{formData.direccion_destino || '—'}</span>
                    </div>
                    {formData.delivery_notes && (
                      <div className="flex items-start gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-500 italic">{formData.delivery_notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Productos ({totalItems} unidades)
                  </h3>
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 truncate flex-1">{item.product_name}</span>
                        <span className="font-medium text-gray-900 ml-2 flex-shrink-0">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                ← Editar
              </Button>
              <Button 
                onClick={handleSubmit} 
                loading={isSubmitting} 
                className="flex-1"
                icon={<TruckIcon className="w-5 h-5" />}
              >
                🚀 Crear Guía
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Indicador de paso móvil ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            Paso {currentStep} de 3
          </span>
          <span className="text-xs text-gray-400">
            {currentStep === 1 ? 'Datos' : currentStep === 2 ? 'Productos' : 'Confirmar'}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-all ${
                step <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};