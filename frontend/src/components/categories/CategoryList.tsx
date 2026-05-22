import React from 'react';
import { PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';

interface CategoryListProps {
  onEdit: (category: any) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ onEdit }) => {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const handleDelete = async (category: any) => {
    if (confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      await deleteCategory.mutateAsync(category.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No hay categorías
        </h3>
        <p className="text-gray-500 mb-4">
          Crea tu primera categoría para organizar tus productos
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FolderIcon className="w-5 h-5 text-primary-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {category.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {category.description || 'Sin descripción'}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};