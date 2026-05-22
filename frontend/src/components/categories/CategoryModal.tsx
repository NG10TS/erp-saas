import React from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { CategoryForm } from './CategoryForm';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any;
  onSuccess?: (category: any) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const handleSubmit = async (data: any) => {
    try {
      let result;
      if (isEditing) {
        result = await updateCategory.mutateAsync({ id: category.id, data });
      } else {
        result = await createCategory.mutateAsync(data);
      }
      
      onSuccess?.(result);
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      description={
        isEditing
          ? 'Actualiza la información de esta categoría'
          : 'Crea una nueva categoría para organizar tus productos'
      }
      size="md"
    >
      <CategoryForm
        defaultValues={category}
        onSubmit={handleSubmit}
        isLoading={createCategory.isPending || updateCategory.isPending}
        onCancel={onClose}
      />
    </Modal>
  );
};