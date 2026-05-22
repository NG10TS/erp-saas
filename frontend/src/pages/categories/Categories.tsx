import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { Button } from '@/components/common/Button/Button';

export const Categories: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">
            Organiza tus productos en categorías para una mejor gestión
          </p>
        </div>

        <Button
          onClick={handleCreate}
          icon={<PlusIcon className="w-5 h-5" />}
          className="whitespace-nowrap"
        >
          Nueva categoría
        </Button>
      </div>

      {/* Lista de categorías */}
      <CategoryList onEdit={handleEdit} />

      {/* Modal para crear/editar */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />
    </div>
  );
};