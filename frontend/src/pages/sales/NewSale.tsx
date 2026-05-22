import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products';
import { customersApi } from '@/services/api/customers';
import { useCreateSale } from '@/hooks/useSales';
import { useCartStore } from '@/store/slices/cartSlice';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { formatCurrency } from '@/utils/formatters';
import { PAYMENT_METHODS } from '@/utils/constants';
import { CustomerForm } from '@/components/customers/CustomerForm';
import toast from 'react-hot-toast';
import type { PaymentMethod } from '@/types/sale';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  UserPlusIcon, 
  DocumentTextIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  SparklesIcon,
  MinusIcon,
  TagIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

// ─── Animaciones ───────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

// ─── Schema ────────────────────────────────────────────────
const saleSchema = z.object({
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  tipo_comprobante: z.enum(['CONSUMIDOR_FINAL', 'FACTURA']).default('CONSUMIDOR_FINAL'),
  metodo_pago: z.string(),
  descuento: z.number().min(0).optional(),
  notas: z.string().optional(),
}).refine(
  (data) => {
    if (data.tipo_comprobante === 'CONSUMIDOR_FINAL') {
      return !!data.customer_phone;
    }
    return !!data.customer_email;
  },
  {
    message: 'Campos requeridos según el tipo de comprobante',
    path: ['customer_phone'],
  }
);

type SaleFormData = z.infer<typeof saleSchema>;

interface FacturaData {
  identificacion: string;
  nombre: string;
  email: string;
  telefono: string;
}

// ─── Componente Principal ───────────────────────────────────
export const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, subtotal, discount, total, clearCart, applyDiscount, updateQuantity, removeItem } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<'CONSUMIDOR_FINAL' | 'FACTURA'>('CONSUMIDOR_FINAL');
  const [facturaData, setFacturaData] = useState<FacturaData>({
    identificacion: '',
    nombre: '',
    email: '',
    telefono: '',
  });
  const [validationErrors, setValidationErrors] = useState<Partial<FacturaData>>({});
  const [isProcessingFactura, setIsProcessingFactura] = useState(false);
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: () => productsApi.getProducts({ search: searchTerm, limit: 10 }),
    enabled: !!searchTerm,
  });

  const createSale = useCreateSale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      metodo_pago: 'cash',
      descuento: 0,
      tipo_comprobante: 'CONSUMIDOR_FINAL',
    },
  });

  const metodoPago = watch('metodo_pago');

  useEffect(() => {
    setValue('descuento', discount);
  }, [discount, setValue]);

  useEffect(() => {
    const preselected = location.state?.preselectedCustomer;
    if (preselected) {
      setSelectedCustomer(preselected);
      toast.success(`Cliente seleccionado: ${preselected.name}`);
    }
  }, [location.state]);

  // ─── Handlers ────────────────────────────────────────────
  const handleAddToCart = (product: any) => {
    useCartStore.getState().addItem(product, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity(productId, quantity);
  };

  const handleApplyDiscount = () => {
    const amount = parseFloat(discountInput);
    if (!isNaN(amount) && amount >= 0) {
      if (amount > subtotal) {
        toast.error(`El descuento no puede ser mayor al subtotal (${formatCurrency(subtotal)})`);
        return;
      }
      applyDiscount(amount);
      setDiscountInput('');
      toast.success('Descuento aplicado');
    }
  };

  const validateFacturaData = (): boolean => {
    const errors: Partial<FacturaData> = {};

    if (!facturaData.identificacion.trim()) {
      errors.identificacion = 'Identificación requerida';
    } else if (!/^\d{10,13}$/.test(facturaData.identificacion)) {
      errors.identificacion = 'Identificación debe tener 10-13 dígitos';
    }

    if (!facturaData.nombre.trim()) {
      errors.nombre = 'Nombre requerido';
    }

    if (!facturaData.email.trim()) {
      errors.email = 'Email requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facturaData.email)) {
      errors.email = 'Email inválido';
    }

    if (!facturaData.telefono.trim()) {
      errors.telefono = 'Teléfono requerido';
    } else if (!/^\d{10}$/.test(facturaData.telefono.replace(/\D/g, ''))) {
      errors.telefono = 'Teléfono debe tener 10 dígitos';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processFacturaData = async (): Promise<string | null> => {
    if (!validateFacturaData()) {
      toast.error('Completa todos los campos de facturación correctamente');
      return null;
    }

    setIsProcessingFactura(true);
    try {
      let customer = null;
      try {
        customer = await customersApi.getCustomerByIdentification(facturaData.identificacion);
      } catch (error) {
        customer = null;
      }

      if (customer) {
        const updatedCustomer = await customersApi.updateCustomer(customer.id, {
          name: facturaData.nombre,
          email: facturaData.email,
          phone_number: facturaData.telefono,
        });
        toast.success(`Cliente actualizado: ${updatedCustomer.name}`);
        return updatedCustomer.id;
      } else {
        const newCustomer = await customersApi.createCustomer({
          phone_number: facturaData.telefono,
          name: facturaData.nombre,
          identification: facturaData.identificacion,
          email: facturaData.email,
        });
        toast.success(`Cliente creado: ${newCustomer.name}`);
        return newCustomer.id;
      }
    } catch (error) {
      toast.error('Error al procesar datos de factura');
      return null;
    } finally {
      setIsProcessingFactura(false);
    }
  };

  const onSubmit = async (data: SaleFormData) => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto al carrito');
      return;
    }

    let customerId: string | undefined = selectedCustomer?.id;
    let customerEmail: string | undefined;
    let customerPhone: string | undefined;

    if (tipoComprobante === 'FACTURA') {
      const procCustomerId = await processFacturaData();
      if (!procCustomerId) return;
      customerId = procCustomerId;
      customerEmail = facturaData.email;
      customerPhone = facturaData.telefono;
    } else {
      if (!selectedCustomer && !data.customer_phone) {
        toast.error('Debes seleccionar un cliente o ingresar un teléfono');
        return;
      }
      customerPhone = data.customer_phone || selectedCustomer?.phone_number;
    }

    try {
      const payload = {
        ...data,
        metodo_pago: data.metodo_pago as PaymentMethod,
        customer_id: customerId,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        tipo_comprobante: tipoComprobante,
        items: items.map(item => ({
          product_id: item.product_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
        })),
      };
      await createSale.mutateAsync(payload);
      clearCart();
      navigate('/app/sales');
      toast.success('🎉 Venta realizada exitosamente');
    } catch (error) {
      toast.error('Error al crear la venta');
    }
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <motion.div 
      className="max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/app/sales" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-emerald-600" />
              </span>
              Nueva Venta
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 ml-13">
              {items.length > 0 ? `${items.length} producto(s) en el carrito` : 'Agrega productos para comenzar'}
            </p>
          </div>
        </div>
        
        {/* Mobile Cart Toggle */}
        <button
          className="lg:hidden relative p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"
          onClick={() => setShowCartOnMobile(!showCartOnMobile)}
        >
          <ShoppingCartIcon className="w-6 h-6" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>
      </motion.div>

      {/* ─── Tipo de Comprobante ─────────────────────────────── */}
      <motion.div 
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
          Tipo de Comprobante
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Consumidor Final */}
          <motion.button
            onClick={() => {
              setTipoComprobante('CONSUMIDOR_FINAL');
              setValue('tipo_comprobante', 'CONSUMIDOR_FINAL');
              setFacturaData({ identificacion: '', nombre: '', email: '', telefono: '' });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-5 border-2 rounded-2xl transition-all text-left ${
              tipoComprobante === 'CONSUMIDOR_FINAL'
                ? 'border-emerald-500 bg-emerald-50 shadow-emerald-100 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                tipoComprobante === 'CONSUMIDOR_FINAL' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <ReceiptPercentIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${tipoComprobante === 'CONSUMIDOR_FINAL' ? 'text-emerald-900' : 'text-gray-900'}`}>
                  Consumidor Final
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Comprobante simple sin datos de facturación electrónica
                </p>
              </div>
              {tipoComprobante === 'CONSUMIDOR_FINAL' && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
          </motion.button>

          {/* Factura Electrónica */}
          <motion.button
            onClick={() => {
              setTipoComprobante('FACTURA');
              setValue('tipo_comprobante', 'FACTURA');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-5 border-2 rounded-2xl transition-all text-left ${
              tipoComprobante === 'FACTURA'
                ? 'border-blue-500 bg-blue-50 shadow-blue-100 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                tipoComprobante === 'FACTURA' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${tipoComprobante === 'FACTURA' ? 'text-blue-900' : 'text-gray-900'}`}>
                  Factura Electrónica
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Con datos de facturación y envío automático al SRI
                </p>
              </div>
              {tipoComprobante === 'FACTURA' && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
          </motion.button>
        </div>

        {/* Formulario de Facturación */}
        <AnimatePresence>
          {tipoComprobante === 'FACTURA' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t-2 border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
                  Datos de Facturación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <IdentificationIcon className="w-4 h-4 inline mr-1" />
                      Identificación (Cédula o RUC)
                    </label>
                    <input
                      type="text"
                      value={facturaData.identificacion}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFacturaData({ ...facturaData, identificacion: value });
                        if (validationErrors.identificacion) setValidationErrors({ ...validationErrors, identificacion: '' });
                      }}
                      placeholder="1234567890001"
                      maxLength={13}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.identificacion ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.identificacion && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <XCircleIcon className="w-3 h-3" />
                        {validationErrors.identificacion}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={facturaData.nombre}
                      onChange={(e) => {
                        setFacturaData({ ...facturaData, nombre: e.target.value });
                        if (validationErrors.nombre) setValidationErrors({ ...validationErrors, nombre: '' });
                      }}
                      placeholder="Juan Pérez"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.nombre && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <XCircleIcon className="w-3 h-3" />
                        {validationErrors.nombre}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={facturaData.email}
                      onChange={(e) => {
                        setFacturaData({ ...facturaData, email: e.target.value });
                        if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                      }}
                      placeholder="juan@example.com"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <XCircleIcon className="w-3 h-3" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={facturaData.telefono}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFacturaData({ ...facturaData, telefono: value });
                        if (validationErrors.telefono) setValidationErrors({ ...validationErrors, telefono: '' });
                      }}
                      placeholder="0999999999"
                      maxLength={10}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        validationErrors.telefono ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.telefono && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <XCircleIcon className="w-3 h-3" />
                        {validationErrors.telefono}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Column */}
        <div className={`lg:col-span-2 space-y-6 ${showCartOnMobile ? 'hidden lg:block' : 'block'}`}>
          {/* Search Products */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-emerald-600" />
              Buscar Productos
            </h2>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loading size="md" />
                    </div>
                  ) : products && products.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-50 hover:border-emerald-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <TagIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <div className="flex items-center gap-3 text-sm">
                                {product.sku && <span className="text-gray-400">SKU: {product.sku}</span>}
                                <span className={`font-semibold ${product.stock_disponible === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {product.stock_disponible === 0 ? 'Agotado' : `Stock: ${product.stock_disponible}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-emerald-600">
                              {formatCurrency(product.precio_venta)}
                            </span>
                            <Button
                              size="sm"
                              icon={<PlusIcon className="w-4 h-4" />}
                              onClick={() => handleAddToCart(product)}
                              disabled={!product.es_servicio && (product.stock_disponible ?? 0) === 0}
                            >
                              Agregar
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-gray-500">No se encontraron productos</p>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Cart Column */}
        <div className={`space-y-6 ${!showCartOnMobile ? 'hidden lg:block' : 'block'}`}>
          {/* Customer Info */}
          {tipoComprobante === 'CONSUMIDOR_FINAL' && (
            <motion.div
              variants={slideInRight}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5 text-emerald-600" />
                  Cliente
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<UserPlusIcon className="w-4 h-4" />} 
                  onClick={() => setShowCustomerModal(true)}
                >
                  {selectedCustomer ? 'Cambiar' : 'Agregar'}
                </Button>
              </div>
              {selectedCustomer ? (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedCustomer.phone_number}</p>
                  {selectedCustomer.identification && (
                    <p className="text-sm text-gray-500">
                      {selectedCustomer.identification.length === 10 ? 'Cédula' : 'RUC'}: {selectedCustomer.identification}
                    </p>
                  )}
                </div>
              ) : (
                <Input {...register('customer_phone')} label="Teléfono del cliente" placeholder="0999999999" />
              )}
            </motion.div>
          )}

          {/* Cart */}
          <motion.div
            variants={slideInRight}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-emerald-600" />
              Carrito
              {items.length > 0 && (
                <span className="text-sm font-normal text-gray-400">({items.length} items)</span>
              )}
            </h2>
            
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-5xl mb-4">🛒</div>
                <p className="text-gray-500 font-medium">Carrito vacío</p>
                <p className="text-sm text-gray-400 mt-1">Busca y agrega productos</p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.product_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.precio_unitario)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <div className="flex items-center bg-white rounded-lg border border-gray-200">
                            <button
                              onClick={() => handleUpdateQuantity(item.product_id, item.cantidad - 1)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <MinusIcon className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product_id, item.cantidad + 1)}
                              className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="w-16 text-right font-semibold text-sm">
                            {formatCurrency(item.cantidad * item.precio_unitario)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Descuento</span>
                    <input
                      type="number"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                    />
                    <Button size="sm" variant="outline" onClick={handleApplyDiscount}>
                      Aplicar
                    </Button>
                    {discount > 0 && (
                      <span className="text-red-500 text-sm font-medium ml-auto">
                        -{formatCurrency(discount)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t-2 border-gray-200">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <motion.span
                      key={total}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-xl font-bold text-emerald-600"
                    >
                      {formatCurrency(total)}
                    </motion.span>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Payment Method */}
          <motion.div
            variants={slideInRight}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-emerald-600" />
              Método de Pago
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <motion.label
                  key={method.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    metodoPago === method.value
                      ? 'border-emerald-500 bg-emerald-50 shadow-emerald-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={method.value}
                    {...register('metodo_pago')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">
                    {method.icon} {method.label}
                  </span>
                </motion.label>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            variants={slideInRight}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-400" />
              Notas (opcional)
            </label>
            <textarea
              {...register('notas')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              placeholder="Notas adicionales para esta venta..."
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={slideInRight}>
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit(onSubmit)}
              loading={createSale.isPending || isProcessingFactura}
              disabled={items.length === 0}
              icon={<BanknotesIcon className="w-5 h-5" />}
            >
              {items.length === 0 ? 'Agrega productos para continuar' : `Cobrar ${formatCurrency(total)}`}
            </Button>
            {items.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Busca productos en la columna izquierda para agregarlos al carrito
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <Modal
            isOpen={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            title="Seleccionar Cliente"
            size="lg"
          >
            <CustomerForm
              onSelect={(customer) => {
                setSelectedCustomer(customer);
                setShowCustomerModal(false);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};