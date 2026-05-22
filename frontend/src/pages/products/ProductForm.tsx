import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Loading } from '@/components/common/Loading/Loading';
import { TAX_RATES } from '@/utils/constants';
import toast from 'react-hot-toast';
import type { ProductCreate, ProductUpdate } from '@/types/product';

import { PlusIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/common/Modal/Modal';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';




const productSchema = z.object({
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  precio_venta: z.number().positive('Debe ser mayor a 0'),
  precio_mayorista: z.number().optional(),
  costo: z.number().optional(),
  impuesto_iva: z.number().min(0).max(15),
  codigo_iva_sri: z.string(),
  tiene_ice: z.boolean(),
  porcentaje_ice: z.number().optional(),
  control_stock: z.boolean(),
  stock_actual: z.number().int().min(0).optional(),
  stock_minimo: z.number().int().min(0).optional(),
  stock_maximo: z.number().int().optional(),
  ubicacion: z.string().optional(),
  es_servicio: z.boolean(),
  imagen_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [tagsInput, setTagsInput] = useState('');

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: isEditing,
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      control_stock: true,
      es_servicio: false,
      impuesto_iva: 15,
      codigo_iva_sri: '2',
      tiene_ice: false,
    },
  });

  const esServicio = watch('es_servicio');
  const controlStock = watch('control_stock');
  const tags = watch('tags') || [];

  useEffect(() => {
    if (product) {
      setValue('sku', product.sku);
      setValue('barcode', product.barcode);
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('category_id', product.category_id);
      setValue('precio_venta', product.precio_venta);
      setValue('precio_mayorista', product.precio_mayorista);
      setValue('costo', product.costo);
      setValue('impuesto_iva', product.impuesto_iva);
      setValue('codigo_iva_sri', product.codigo_iva_sri);
      setValue('tiene_ice', product.tiene_ice);
      setValue('porcentaje_ice', product.porcentaje_ice);
      setValue('control_stock', product.control_stock);
      setValue('stock_actual', product.stock_actual);
      setValue('stock_minimo', product.stock_minimo);
      setValue('stock_maximo', product.stock_maximo);
      setValue('ubicacion', product.ubicacion);
      setValue('es_servicio', product.es_servicio);
      setValue('imagen_url', product.imagen_url);
      setValue('tags', product.tags);
      setTagsInput(product.tags?.join(', ') || '');
    }
  }, [product, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const basePayload = {
        ...data,
        name: data.name,
        precio_venta: data.precio_venta,
        category_id: data.category_id || undefined,
      };

      if (isEditing) {
        const payload: ProductUpdate = basePayload;
        await updateProduct.mutateAsync({ id: id!, data: payload });
      } else {
        const payload: ProductCreate = basePayload;
        await createProduct.mutateAsync(payload);
      }

      navigate('/app/products');
    } catch (error) {
      toast.error('No se pudo guardar el producto');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagsInput.trim()];
      setValue('tags', newTags);
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();

  const handleCreateCategory = async (data: any) => {
    try {
      const newCategory = await createCategory.mutateAsync(data);
      // Auto seleccionar la nueva categoría
      setValue('category_id', newCategory.id);
      setIsCategoryModalOpen(false);
      toast.success('Categoría creada y seleccionada');
    } catch (error) {
      // Error handled by hook
    }
  };

  

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={isEditing ? `/app/products/${id}` : '/app/products'} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Nombre del Producto *"
              error={errors.name?.message}
            />
            <Input
              {...register('sku')}
              label="SKU"
              error={errors.sku?.message}
            />
            <Input
              {...register('barcode')}
              label="Código de Barras"
              error={errors.barcode?.message}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <div className="flex gap-2">
                <select
                  {...register('category_id')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={categoriesLoading}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  title="Crear nueva categoría"
                >
                  <PlusIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen URL
            </label>
            <Input
              {...register('imagen_url')}
              placeholder="https://ejemplo.com/imagen.jpg"
              error={errors.imagen_url?.message}
            />
          </div>
        </div>

        {/* Pricing and Taxes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios e Impuestos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('precio_venta', { valueAsNumber: true })}
              label="Precio de Venta *"
              type="number"
              step="0.01"
              error={errors.precio_venta?.message}
            />
            <Input
              {...register('precio_mayorista', { valueAsNumber: true })}
              label="Precio Mayorista"
              type="number"
              step="0.01"
              error={errors.precio_mayorista?.message}
            />
            <Input
              {...register('costo', { valueAsNumber: true })}
              label="Costo"
              type="number"
              step="0.01"
              error={errors.costo?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IVA (%)
              </label>
              <select
                {...register('impuesto_iva', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {TAX_RATES.map(rate => (
                  <option key={rate.value} value={rate.value}>
                    {rate.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('tiene_ice')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Aplica ICE (Impuesto a Consumos Especiales)</span>
            </label>
          </div>
          {watch('tiene_ice') && (
            <div className="mt-4">
              <Input
                {...register('porcentaje_ice', { valueAsNumber: true })}
                label="Porcentaje ICE (%)"
                type="number"
                step="0.01"
                error={errors.porcentaje_ice?.message}
              />
            </div>
          )}
        </div>

        {/* Inventory Control */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h2>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('es_servicio')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Es un servicio (no consume inventario)</span>
            </label>
            
            {!esServicio && (
              <>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('control_stock')}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Controlar stock</span>
                </label>
                
                {controlStock && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Input
                      {...register('stock_actual', { valueAsNumber: true })}
                      label="Stock Actual"
                      type="number"
                      error={errors.stock_actual?.message}
                    />
                    <Input
                      {...register('stock_minimo', { valueAsNumber: true })}
                      label="Stock Mínimo"
                      type="number"
                      error={errors.stock_minimo?.message}
                    />
                    <Input
                      {...register('stock_maximo', { valueAsNumber: true })}
                      label="Stock Máximo"
                      type="number"
                      error={errors.stock_maximo?.message}
                    />
                  </div>
                )}
                
                <Input
                  {...register('ubicacion')}
                  label="Ubicación en Bodega"
                  error={errors.ubicacion?.message}
                />
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Etiquetas</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas (presiona Enter para agregar)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="ej: popular, nuevo, oferta"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link to={isEditing ? `/app/products/${id}` : '/app/products'}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            loading={createProduct.isPending || updateProduct.isPending}
          >
            {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
        </div>
      </form>
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva categoría"
        description="Crea una categoría sin salir del formulario de producto"
        size="md"
      >
        <CategoryForm
          onSubmit={handleCreateCategory}
          isLoading={createCategory.isPending}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
