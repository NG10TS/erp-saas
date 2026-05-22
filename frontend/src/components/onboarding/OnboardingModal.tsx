// frontend/src/components/onboarding/OnboardingModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, ArrowRight, Loader2, CheckCircle, Store, Mail, Phone, MapPin, CreditCard, Package, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  business: any; // Datos actuales del negocio
}

interface FormData {
  ruc: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProductData {
  name: string;
  price: number;
  stock: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete, business }) => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showProductStep, setShowProductStep] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    ruc: business?.ruc || '',
    business_name: business?.business_name || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
  });
  
  const [productData, setProductData] = useState<ProductData>({
    name: '',
    price: 0,
    stock: 0,
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Detectar campos obligatorios faltantes
  const missingFields = {
    ruc: !formData.ruc,
    business_name: !formData.business_name,
    email: !formData.email,
  };
  const hasMissingRequired = missingFields.ruc || missingFields.business_name || missingFields.email;
  const canSaveBusiness = !hasMissingRequired;

  // Actualizar formulario cuando cambia el negocio
  useEffect(() => {
    if (business) {
      setFormData({
        ruc: business.ruc || '',
        business_name: business.business_name || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveBusiness = async () => {
    setIsLoading(true);
    try {
      const businessPayload = {
        ruc: formData.ruc,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
      };

      // Si no hay ID de negocio, crear nuevo mediante endpoint de onboarding
      if (!business?.id) {
        console.log('📝 Creando nuevo negocio via POST /onboarding/business');
        await apiClient.post('/onboarding/business', businessPayload);
        toast.success('¡Negocio creado correctamente!');
      } else {
        // Actualizar negocio existente
        console.log('✏️ Actualizando negocio via PUT /business/me');
        await apiClient.put('/business/me', businessPayload);
        toast.success('¡Negocio actualizado correctamente!');
      }
      
      // Opcionalmente, agregar primer producto
      if (step === 0 && canSaveBusiness) {
        setStep(1);
      } else {
        // Completar onboarding
        console.log('🎉 Onboarding completado');
        onComplete();
      }
    } catch (error: any) {
      console.error('Error al guardar negocio:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar el negocio');
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async () => {
    if (!productData.name || productData.price <= 0) {
      toast.error('Nombre y precio del producto son requeridos');
      return;
    }
    setIsCreatingProduct(true);
    try {
      await apiClient.post('/products', {
        name: productData.name,
        precio_venta: productData.price,
        stock_actual: productData.stock,
        control_stock: true,
      });
      toast.success('¡Producto creado! Puedes agregar más desde el menú Productos.');
      onComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear producto');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const skipProduct = () => {
    toast('Puedes agregar productos más tarde desde "Productos"', { icon: '📦' });
    onComplete();
  };

  const steps = [
    {
      title: 'Completa los datos de tu negocio',
      description: 'Estos datos se usarán en tus facturas electrónicas',
      icon: Building2,
    },
    {
      title: '¿Quieres agregar tu primer producto?',
      description: 'Opcional: empieza a vender rápidamente',
      icon: Package,
    },
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{currentStep.title}</h2>
                      <p className="text-emerald-100 text-sm mt-0.5">{currentStep.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress bar (solo si hay más de un paso) */}
              {step === 0 && hasMissingRequired && (
                <div className="h-1 bg-emerald-100">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${canSaveBusiness ? 100 : (Object.values(missingFields).filter(Boolean).length / 3) * 100}%` }}
                  />
                </div>
              )}

              {/* Contenido del paso 0: Datos del negocio */}
              {step === 0 && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUC <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        maxLength={13}
                        value={formData.ruc}
                        onChange={(e) => handleChange('ruc', e.target.value)}
                        placeholder="0999999999001"
                        className={cn(
                          'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                          missingFields.ruc && !formData.ruc ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        )}
                      />
                    </div>
                    {missingFields.ruc && !formData.ruc && (
                      <p className="text-red-500 text-xs mt-1">El RUC es obligatorio para facturar</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => handleChange('business_name', e.target.value)}
                        placeholder="Mi Empresa S.A."
                        className={cn(
                          'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                          missingFields.business_name && !formData.business_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        )}
                      />
                    </div>
                    {missingFields.business_name && !formData.business_name && (
                      <p className="text-red-500 text-xs mt-1">La razón social es obligatoria</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del negocio <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="contacto@miempresa.com"
                        className={cn(
                          'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                          missingFields.email && !formData.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        )}
                      />
                    </div>
                    {missingFields.email && !formData.email && (
                      <p className="text-red-500 text-xs mt-1">El email es obligatorio</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (opcional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="0999999999"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección (opcional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Quito, Ecuador"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido del paso 1: Producto opcional */}
              {step === 1 && (
                <div className="p-6 space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <Plus className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-gray-700 text-sm">
                      Agrega tu primer producto para empezar a vender
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      value={productData.name}
                      onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                      placeholder="Ej: Camiseta Deportiva"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={productData.price}
                          onChange={(e) => setProductData({ ...productData, price: parseFloat(e.target.value) })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={productData.stock}
                        onChange={(e) => setProductData({ ...productData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer con botones */}
              <div className="flex justify-between gap-3 p-4 border-t bg-gray-50">
                {step === 0 ? (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                    >
                      Omitir
                    </button>
                    <button
                      onClick={saveBusiness}
                      disabled={isLoading || !canSaveBusiness}
                      className="ml-auto flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          Guardar
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={skipProduct}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                    >
                      Ahora no
                    </button>
                    <button
                      onClick={createProduct}
                      disabled={isCreatingProduct || !productData.name || productData.price <= 0}
                      className="ml-auto flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isCreatingProduct ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          Crear producto
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};