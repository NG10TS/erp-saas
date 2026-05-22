import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Dialog } from '@headlessui/react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock_quantity: number
  category: string
  is_active: boolean
}

export const ProductsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/products')
      return response.data
    },
  })

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (newProduct: Partial<Product>) =>
      api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
    },
  })

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: string }) =>
      api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      setEditingProduct(null)
    },
  })

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      price: parseFloat(formData.get('price') as string),
      stock_quantity: parseInt(formData.get('stock') as string),
      category: formData.get('category') as string,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...productData })
    } else {
      createMutation.mutate(productData)
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
        <button
          onClick={() => {
            setEditingProduct(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Products table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                SKU
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Nombre
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Categoría
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Precio
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Stock
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Estado
              </th>
              <th className="relative py-3.5 pl-3 pr-4">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products?.map((product) => (
              <tr key={product.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                  {product.sku}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {product.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {product.category}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  ${product.price.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span
                    className={classNames(
                      product.stock_quantity < 10
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-500'
                    )}
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span
                    className={classNames(
                      'inline-flex rounded-full px-2 text-xs font-semibold leading-5',
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingProduct(product)
                      setIsModalOpen(true)
                    }}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  defaultValue={editingProduct?.sku}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editingProduct?.category}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Precio
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={editingProduct?.price}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct?.stock_quantity}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
