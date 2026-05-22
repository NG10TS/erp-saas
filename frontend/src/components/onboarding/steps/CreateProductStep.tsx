// src/components/onboarding/steps/CreateProductStep.tsx (CORREGIDO)
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import { useCreateProduct } from '@/hooks/useProducts';
import { productsApi } from '@/services/api/products';

const productSchema = z.object({
  name: z.string().min(2, 'Nombre del producto es requerido'),
  price: z.number().min(0.01, 'Precio debe ser mayor a 0'),
  stock: z.number().min(1, 'Debes tener al menos 1 unidad en stock'),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface CreateProductStepProps {
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const CreateProductStep: React.FC<CreateProductStepProps> = ({
  onNext,
  onBack,
  isLoading: externalIsLoading,
  setIsLoading: setExternalIsLoading,
}) => {
  const { setProduct, setProductCreated, product } = useOnboardingStore();
  
  // ✅ Obtener la mutación correctamente
  const createProductMutation = useCreateProduct();
  const { mutateAsync: createProduct, isPending: isCreating } = createProductMutation;

  // Query to check for existing products
  const { 
    data: existingProducts, 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['products', 'onboarding'],
    queryFn: () => productsApi.getProducts({ limit: 10 }),
    retry: 2,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 10.00,
      stock: 10,
      description: '',
    },
  });

  // Mapeo de ProductListResponse a Product
  const mapToProduct = (resp: any) => ({
    id: resp.id,
    name: resp.name,
    precio_venta: resp.precio_venta,
    stock_actual: resp.stock_actual,
    description: resp.description || '',
  });

  // Preload existing product if found
  useEffect(() => {
    if (existingProducts && existingProducts.length > 0 && !product) {
      const existingProduct = existingProducts[0]; // Take the first product
      setValue('name', existingProduct.name || '');
      setValue('price', Number(existingProduct.precio_venta) || 0);
      setValue('stock', Number(existingProduct.stock_actual) || 0);
      setValue('description', '');
      // Mapear respuesta a tipo Product
      setProduct(mapToProduct(existingProduct));
      setProductCreated(true);
      toast.success('Producto existente cargado');
    }
  }, [existingProducts, product, setValue, setProduct, setProductCreated]);

  const watchName = watch('name');
  const watchPrice = watch('price');
  const watchStock = watch('stock');

  const onSubmit = async (data: ProductFormData) => {
    setExternalIsLoading(true);
    
    try {
      console.log('📡 Enviando producto:', data);
      
      const payload = {
        name: data.name,
        precio_venta: data.price,
        stock_actual: data.stock,
        description: data.description,
        control_stock: true,
      };
      
      // ✅ Usar createProduct correctamente
      const response = await createProduct(payload);
      
      console.log('✅ Producto creado:', response);
      
      // ✅ Guardar respuesta completa (con ID)
      setProduct(response);
      setProductCreated(true);
      
      toast.success('¡Producto creado exitosamente!');
      onNext();
      
    } catch (error: any) {
      console.error('❌ Error al crear producto:', error);
      console.error('❌ Detalles:', error.response?.data);
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Error al crear el producto');
    } finally {
      setExternalIsLoading(false);
    }
  };

  const isLoading = externalIsLoading || isCreating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Crea tu primer producto
        </h2>
        <p className="text-gray-600">
          ¿Qué producto o servicio vas a vender?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del producto *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ej: Camiseta deportiva"
            autoFocus
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock inicial *
            </label>
            <input
              {...register('stock', { valueAsNumber: true })}
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="10"
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe tu producto..."
          />
        </div>

        {(watchName || watchPrice > 0) && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-600 mb-2">📝 Vista previa:</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">
                  {watchName || "Nombre del producto"}
                </p>
                <p className="text-sm text-gray-500">
                  Stock: {watchStock || 0} unidades
                </p>
              </div>
              <p className="text-xl font-bold text-primary-600">
                ${watchPrice || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  );
};