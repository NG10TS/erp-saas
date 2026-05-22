import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { productsApi } from '@/services/api/products';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useAdjustStock, useDeleteProduct } from '@/hooks/useProducts';
import { StockAdjustmentForm } from '@/components/products/StockAdjustmentForm';

// ✅ Función auxiliar para convertir valores a número de forma segura
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// ✅ Función para formatear porcentaje de forma segura
const formatPercentage = (value: any): string => {
  const num = safeNumber(value);
  return `${num.toFixed(2)}%`;
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  const adjustStock = useAdjustStock();
  const deleteProduct = useDeleteProduct();

  const handleAdjustStock = async (data: { cantidad: number; motivo: string; notas?: string }) => {
    await adjustStock.mutateAsync({
      id: id!,
      data: {
        cantidad: data.cantidad,
        motivo: data.motivo,
        notas: data.notas,
      },
    });
    setShowStockModal(false);
    queryClient.invalidateQueries({ queryKey: ['product', id] });
  };

  const handleDelete = async () => {
    await deleteProduct.mutateAsync(id!);
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Producto no encontrado</p>
        <Link to="/app/products" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Volver a productos
        </Link>
      </div>
    );
  }

  // ✅ Convertir valores a números de forma segura
  const utilidadPorcentaje = safeNumber(product.utilidad_porcentaje);
  const stockActual = safeNumber(product.stock_actual);
  const stockMinimo = safeNumber(product.stock_minimo);
  const stockMaximo = safeNumber(product.stock_maximo);
  const impuestoIva = safeNumber(product.impuesto_iva);
  const porcentajeIce = safeNumber(product.porcentaje_ice);
  const isLowStock = product.control_stock && !product.es_servicio && stockActual <= stockMinimo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/products"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.sku && (
              <p className="text-gray-500 mt-1">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <Link to={`/app/products/${id}/edit`}>
            <Button variant="outline" icon={<PencilIcon className="w-4 h-4" />}>
              Editar
            </Button>
          </Link>
          <Button
            variant="danger"
            icon={<TrashIcon className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image */}
          {product.imagen_url && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <img
                src={product.imagen_url}
                alt={product.name}
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Precio de venta:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(product.precio_venta)}
                </span>
              </div>
              {product.precio_mayorista && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio mayorista:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.precio_mayorista)}
                  </span>
                </div>
              )}
              {product.costo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Costo:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.costo)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-gray-500">Utilidad:</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(utilidadPorcentaje)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h3>
            {product.es_servicio ? (
              <p className="text-gray-500">Producto de servicio (no requiere inventario)</p>
            ) : product.control_stock ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock actual:</span>
                  <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {stockActual} unidades
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock mínimo:</span>
                  <span className="text-gray-900">{stockMinimo} unidades</span>
                </div>
                {product.stock_maximo && stockMaximo > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock máximo:</span>
                    <span className="text-gray-900">{stockMaximo} unidades</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Ubicación:</span>
                  <span className="text-gray-900">{product.ubicacion || 'No especificada'}</span>
                </div>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowStockModal(true)}
                  className="mt-4"
                >
                  Ajustar Stock
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">Control de stock desactivado</p>
            )}
          </div>

          {/* Taxes Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impuestos</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">IVA:</span>
                <span className="font-semibold text-gray-900">
                  {impuestoIva}%
                </span>
              </div>
              {product.tiene_ice && porcentajeIce > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ICE:</span>
                  <span className="font-semibold text-gray-900">
                    {porcentajeIce}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creado:</span>
                <span className="text-gray-700">{formatDateTime(product.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Última actualización:</span>
                <span className="text-gray-700">{formatDateTime(product.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className={product.is_active ? 'text-green-600' : 'text-red-600'}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Ajustar Stock"
        description={`Producto: ${product.name}`}
      >
        <StockAdjustmentForm
          onSubmit={handleAdjustStock}
          isLoading={adjustStock.isPending}
          onCancel={() => setShowStockModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Producto"
        description={`¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`}
      >
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteProduct.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
};