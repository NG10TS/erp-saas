// src/pages/products/Products.tsx (VERSIÓN PROFESIONAL COMPLETA)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash'; // npm install lodash
import { productsApi } from '@/services/api/products';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { TableSkeleton } from '@/components/common/Skeleton/Skeleton';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { formatCurrency } from '@/utils/formatters';
import { useCategories } from '@/hooks/useCategories';

export const Products: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    low_stock: false,
    is_active: null as boolean | null,
  });

  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  // ✅ Debounce para búsqueda (300ms)
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSetSearch(value);
  };

  // ✅ Limpiar búsqueda
  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
  };
  
  // ✅ Query con búsqueda debounced
  const { data: products, isLoading, isFetching } = useQuery({
    queryKey: ['products', debouncedSearch, filters],
    queryFn: () => productsApi.getProducts({
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined, // ✅ Solo buscar si tiene 2+ caracteres
      category: filters.category || undefined,
      low_stock: filters.low_stock,
      is_active: filters.is_active,
    }),
    placeholderData: (previousData) => previousData, // ✅ Mantener datos anteriores mientras carga
  });

  // ✅ Prefetch para búsquedas comunes (opcional)
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      const timer = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ['products', debouncedSearch, filters],
          queryFn: () => productsApi.getProducts({
            search: debouncedSearch,
            category: filters.category || undefined,
            low_stock: filters.low_stock,
            is_active: filters.is_active,
          }),
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearch, filters, queryClient]);

  // ✅ Reset filters
  const resetFilters = () => {
    setFilters({
      category: '',
      low_stock: false,
      is_active: true,
    });
    setSearch('');
    setDebouncedSearch('');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestiona tu inventario de productos</p>
        </div>
        <Link to="/app/products/new">
          <Button icon={<PlusIcon className="w-5 h-5" />}>
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* ✅ Search con debounce y clear */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, SKU o código de barras (mínimo 2 caracteres)..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<FunnelIcon className="w-5 h-5" />}
          >
            Filtros
            {(filters.category || filters.low_stock) && (
              <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </Button>
          {(filters.category || filters.low_stock || search) && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="text-gray-500"
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar productos eliminados</span>
                </label>
              </div>
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.is_active === null ? 'all' : filters.is_active ? 'active' : 'inactive'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters({ 
                      ...filters, 
                      is_active: value === 'all' ? null : value === 'active'
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              {/* Stock bajo */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.low_stock}
                    onChange={(e) => setFilters({ ...filters, low_stock: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar solo productos con stock bajo</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* ✅ Indicador de búsqueda */}
        {isFetching && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Buscando...
          </div>
        )}
        {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
          <div className="mt-2 text-xs text-yellow-500 text-center">
            Ingresa al menos 2 caracteres para buscar
          </div>
        )}
      </div>

      {/* Products Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : products && products.length > 0 ? (
        <>
          {/* ✅ Contador de resultados */}
          <div className="text-sm text-gray-500">
            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </div>
          
          <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.imagen_url ? (
                            <img
                              src={product.imagen_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-lg">📦</span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.category_name && (
                              <div className="text-xs text-gray-500">
                                {product.category_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(product.precio_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            product.stock_actual <= 10 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {product.es_servicio ? '∞' : product.stock_actual}
                          </span>
                          {product.stock_actual <= product.stock_minimo && !product.es_servicio && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Stock bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/app/products/${product.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/app/products/${product.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Editar
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {product.imagen_url ? (
                      <img
                        src={product.imagen_url}
                        alt={product.name}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                        📦
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku || 'Sin SKU'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 text-sm">
                  <div>
                    <p className="text-gray-500">Precio</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(product.precio_venta)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stock</p>
                    <p className="font-semibold text-gray-900">{product.es_servicio ? '∞' : product.stock_actual}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link to={`/app/products/${product.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth>Ver</Button>
                  </Link>
                  <Link to={`/app/products/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" fullWidth>Editar</Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No hay productos"
          description={debouncedSearch ? `No se encontraron productos para "${debouncedSearch}"` : "Comienza agregando tu primer producto"}
          action={{
            label: "Agregar Producto",
            onClick: () => window.location.href = '/app/products/new'
          }}
          icon={<div className="text-4xl">📦</div>}
        />
      )}
    </div>
  );
};
