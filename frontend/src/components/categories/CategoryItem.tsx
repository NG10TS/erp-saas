import React, { useState } from 'react';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { Button } from '@/components/common/Button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

export const CategoriesPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const handleCreate = () => {
    setSelected(null);
    setIsOpen(true);
  };

  const handleEdit = (category: any) => {
    setSelected(category);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>

        <Button
          onClick={handleCreate}
          icon={<PlusIcon className="w-5 h-5" />}
        >
          Nueva Categoría
        </Button>
      </div>

      {/* List */}
      <CategoryList onEdit={handleEdit} />

      {/* Modal */}
      <CategoryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        category={selected}
      />
    </div>
  );
};