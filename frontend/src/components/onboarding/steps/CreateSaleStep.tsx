// src/components/onboarding/steps/CreateSaleStep.tsx (VERSIÓN CORREGIDA)
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/services/api/customers';
import { productsApi } from '@/services/api/products';
import { formatPrice, formatNumber } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import type { Customer } from '@/types/customer';
import type { ProductListResponse } from '@/types/product';

const saleSchema = z.object({
  product_id: z.string().min(1, 'Selecciona un producto'),
  customer_id: z.string().min(1, 'Selecciona un cliente'),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1').max(999, 'Cantidad máxima 999'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface CreateSaleStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const CreateSaleStep: React.FC<CreateSaleStepProps> = ({ onNext, onBack }) => {
  const { customer, product } = useOnboardingStore();
  const { createSale, isCreatingSale } = useOnboarding();
  const [selectedProduct, setSelectedProduct] = useState<ProductListResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    data: products, 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['products', 'onboarding'],
    queryFn: () => productsApi.getProducts({ limit: 100 }),
    retry: 2,
  });

  const { 
    data: customers, 
    isLoading: customersLoading,
    error: customersError 
  } = useQuery({
    queryKey: ['customers', 'onboarding'],
    queryFn: () => customersApi.getCustomers({ limit: 100 }),
    retry: 2,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      product_id: product?.id || '',
      customer_id: customer?.id || '',
      quantity: 1,
    },
  });

  const watchProductId = watch('product_id');
  const watchQuantity = watch('quantity');

  useEffect(() => {
    const verifyOnboardingData = async () => {
      if (customer?.id && customers) {
        const customerExists = customers.find((c: Customer) => c.id === customer.id);
        if (!customerExists) {
          toast.error('El cliente registrado no se encuentra en el sistema. Por favor, regresa al paso anterior.');
          onBack();
        }
      }
      
      if (product?.id && products) {
        const productExists = products.find((p: ProductListResponse) => p.id === product.id);
        if (!productExists) {
          toast.error('El producto registrado no se encuentra en el sistema. Por favor, regresa al paso anterior.');
          onBack();
        }
      }
    };
    
    if (customers && products) {
      verifyOnboardingData();
    }
  }, [customers, products, customer, product, onBack]);

  useEffect(() => {
    const productFound = products?.find((p: ProductListResponse) => p.id === watchProductId) ?? null;
    setSelectedProduct(productFound);
  }, [watchProductId, products]);

  const onSubmit = async (data: SaleFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const selectedProductData = products?.find((p: ProductListResponse) => p.id === data.product_id);
      const selectedCustomerData = customers?.find((c: Customer) => c.id === data.customer_id);
      
      if (!selectedProductData || !selectedCustomerData) {
        throw new Error('Producto o cliente no encontrado');
      }
      
      // ✅ Convertir precio a número de forma segura
      const unitPrice = typeof selectedProductData.precio_venta === 'number' 
        ? selectedProductData.precio_venta 
        : parseFloat(selectedProductData.precio_venta);
      
      await createSale({
        customer_id: data.customer_id,
        product_id: data.product_id,
        quantity: data.quantity,
        unit_price: unitPrice,
        product_name: selectedProductData.name,
      });
      
      onNext();
      
    } catch (error) {
      console.error('Error creating sale:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isCreatingSale || productsLoading || customersLoading;
  const hasProducts = products && products.length > 0;
  const hasCustomers = customers && customers.length > 0;
  
  // ✅ Calcular total de forma segura
  const getPrice = (product: ProductListResponse | null): number => {
    if (!product) return 0;
    const price = product.precio_venta;
    return typeof price === 'number' ? price : parseFloat(price) || 0;
  };
  
  const unitPrice = getPrice(selectedProduct);
  const total = unitPrice * watchQuantity;

  if (productsError || customersError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          Error al cargar datos. Por favor, regresa y completa los pasos anteriores.
        </div>
        <button onClick={onBack} className="text-primary-600 hover:text-primary-700">
          ← Volver atrás
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Registra tu primera venta!
        </h2>
        <p className="text-gray-600">
          Selecciona el producto y cliente que acabas de crear. ¡Este es tu primer paso hacia el éxito!
        </p>
      </div>

      <div className="space-y-5 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Producto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Producto *
          </label>
          {productsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <select
              {...register('product_id')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={productsLoading}
            >
              <option value="">Selecciona un producto</option>
              {products?.map((p: ProductListResponse) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatPrice(p.precio_venta)} (Stock: {formatNumber(p.stock_actual, 0)})
                </option>
              ))}
            </select>
          )}
          {errors.product_id && (
            <p className="text-red-500 text-sm mt-1">{errors.product_id.message}</p>
          )}
          {!hasProducts && !productsLoading && (
            <p className="text-yellow-500 text-sm mt-1 flex items-center gap-2">
              ⚠️ No hay productos disponibles. Completa el paso anterior primero.
            </p>
          )}
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cliente *
          </label>
          {customersLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <select
              {...register('customer_id')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={customersLoading}
            >
              <option value="">Selecciona un cliente</option>
              {customers?.map((c: Customer) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Cliente sin nombre'} - {c.identification || 'Sin identificación'}
                </option>
              ))}
            </select>
          )}
          {errors.customer_id && (
            <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>
          )}
          {!hasCustomers && !customersLoading && (
            <p className="text-yellow-500 text-sm mt-1 flex items-center gap-2">
              ⚠️ No hay clientes disponibles. Completa el paso anterior primero.
            </p>
          )}
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cantidad *
          </label>
          <input
            {...register('quantity', { valueAsNumber: true })}
            type="number"
            min="1"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {/* Resumen de venta */}
        {selectedProduct && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-5 mt-4 border border-primary-200">
            <p className="text-sm font-semibold text-primary-900 mb-3">📊 Resumen de venta</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-800">Producto:</span>
                <span className="font-medium text-primary-900">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-800">Precio unitario:</span>
                <span className="text-primary-900">{formatPrice(selectedProduct.precio_venta)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-800">Cantidad:</span>
                <span className="text-primary-900">{watchQuantity}</span>
              </div>
              <div className="border-t border-primary-200 my-2"></div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-primary-900">Total:</span>
                <span className="text-primary-700">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">¡Automático!</p>
              <p className="text-sm text-gray-600">
                Al registrar esta venta, el stock se actualizará automáticamente y 
                quedará registrada en tu historial. ¡Así de fácil es empezar!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between mt-8 gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          disabled={isLoading}
        >
          ← Atrás
        </button>
        <button
          type="submit"
          disabled={isLoading || !hasProducts || !hasCustomers}
          className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando venta...
            </span>
          ) : (
            '✨ Registrar venta ✨'
          )}
        </button>
      </div>
    </form>
  );
};
